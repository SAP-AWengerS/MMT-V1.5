const express = require('express');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const adapters = require('./adapters');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'gateway-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'gateway.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Handle OPTIONS preflight for all routes
app.options('*', cors());

// Service URLs - Use Kubernetes service names
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  fleet: process.env.FLEET_SERVICE_URL || 'http://fleet-service:3002',
  finance: process.env.FINANCE_SERVICE_URL || 'http://finance-service:3003',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005'
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  // Public routes (old and new format)
  const publicRoutes = [
    '/api/v1/app/auth',
    '/api/auth',
    '/health',
    '/api/v1/app/health'
  ];

  // Check if path matches any public route
  const isPublic = publicRoutes.some(route => req.path.startsWith(route));

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      logger.warn('Invalid token', { path: req.path, ip: req.ip });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Circuit Breaker Options - Very permissive to avoid false positives
const breakerOptions = {
  timeout: 60000,           // 60 second timeout (very lenient)
  errorThresholdPercentage: 99,  // Almost never trip (99% errors needed)
  resetTimeout: 30000,      // 30 second reset
  rollingCountTimeout: 60000,    // Longer time window
  rollingCountBuckets: 10,
  volumeThreshold: 100       // Need 100 requests before circuit can trip (effectively disabled)
};

// Circuit breaker for HTTP requests
const createServiceBreaker = (serviceName, serviceUrl) => {
  const breaker = new CircuitBreaker(
    async (method, path, data, headers) => {
      const url = `${serviceUrl}${path}`;
      logger.info(`Calling ${serviceName}`, { method, url });

      const response = await axios({
        method,
        url,
        data,
        headers,
        timeout: 5000
      });

      return response.data;
    },
    { ...breakerOptions, name: serviceName }
  );

  breaker.on('open', () => logger.error(`Circuit breaker opened for ${serviceName}`));
  breaker.on('halfOpen', () => logger.info(`Circuit breaker half-open for ${serviceName}`));
  breaker.on('close', () => logger.info(`Circuit breaker closed for ${serviceName}`));

  breaker.fallback(() => ({
    error: `${serviceName} service is currently unavailable`,
    fallback: true
  }));

  return breaker;
};

// Health check routes - BEFORE authentication middleware
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

app.get('/api/v1/app/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

// Create breakers for each service
const breakers = {
  auth: createServiceBreaker('auth-service', SERVICES.auth),
  fleet: createServiceBreaker('fleet-service', SERVICES.fleet),
  finance: createServiceBreaker('finance-service', SERVICES.finance),
  analytics: createServiceBreaker('analytics-service', SERVICES.analytics),
  notification: createServiceBreaker('notification-service', SERVICES.notification)
};

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute window
  max: 1000,                 // 1000 requests per minute (very permissive)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Apply authentication middleware AFTER health routes and rate limiting
app.use(authenticateToken);

// Helper function to forward requests with optional adapter
const forwardRequest = async (req, res, breaker, servicePath, adapter = null) => {
  try {
    // BYPASS CIRCUIT BREAKER - Direct axios call
    const serviceUrl = breaker.options.name.replace('-service', '');
    const baseUrl = SERVICES[serviceUrl];
    const url = `${baseUrl}${servicePath}`;

    logger.info(`Direct call (circuit breaker bypassed)`, { method: req.method, url });

    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: { authorization: req.headers.authorization },
      timeout: 30000 // 30 second timeout
    });

    // Apply adapter if provided
    const finalResult = adapter ? adapter(response.data, req.query) : response.data;
    res.json(finalResult);
  } catch (error) {
    logger.error('Request forwarding error', {
      error: error.message,
      path: req.path,
      url: error.config?.url
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({
      error: 'Service unavailable',
      message: error.message
    });
  }
};

// AUTH ROUTES - Old format support
app.post('/api/v1/app/auth/signUpWithGoogle', (req, res) => forwardRequest(req, res, breakers.auth, '/api/google'));
app.post('/api/v1/app/auth/register', (req, res) => forwardRequest(req, res, breakers.auth, '/api/register'));
app.post('/api/v1/app/auth/login', (req, res) => forwardRequest(req, res, breakers.auth, '/api/login'));
app.post('/api/v1/app/auth/whoami', (req, res) => forwardRequest(req, res, breakers.auth, '/api/whoami', adapters.adaptWhoamiResponse));
app.get('/api/v1/app/auth/profile', (req, res) => forwardRequest(req, res, breakers.auth, '/api/profile'));
app.put('/api/v1/app/auth/profile', (req, res) => forwardRequest(req, res, breakers.auth, '/api/profile'));

// TRUCK/FLEET ROUTES - Old format support
app.get('/api/v1/app/truck', (req, res) => forwardRequest(req, res, breakers.fleet, '/api/trucks', adapters.adaptTrucksResponse));
app.post('/api/v1/app/truck', (req, res) => forwardRequest(req, res, breakers.fleet, '/api/trucks', adapters.adaptSingleTruckResponse));
app.post('/api/v1/app/truck/addTruck', (req, res) => forwardRequest(req, res, breakers.fleet, '/api/trucks', adapters.adaptSingleTruckResponse));
app.get('/api/v1/app/truck/getAllTrucksByUser/:userId', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/by-user/${req.params.userId}`, adapters.adaptTrucksResponse));
app.get('/api/v1/app/truck/getTruckById/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/${req.params.id}`, adapters.adaptSingleTruckResponse));
app.get('/api/v1/app/truck/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/${req.params.id}`, adapters.adaptSingleTruckResponse));
app.put('/api/v1/app/truck/updateTruckById/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/${req.params.id}`, adapters.adaptSingleTruckResponse));
app.put('/api/v1/app/truck/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/${req.params.id}`, adapters.adaptSingleTruckResponse));
app.delete('/api/v1/app/truck/deleteTruckById/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/${req.params.id}`));
app.delete('/api/v1/app/truck/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/trucks/${req.params.id}`));

// DRIVER ROUTES - Old format support
app.get('/api/v1/app/driverProfiles', (req, res) => forwardRequest(req, res, breakers.fleet, '/api/drivers', adapters.adaptDriverProfilesResponse));
app.post('/api/v1/app/driverProfiles', (req, res) => forwardRequest(req, res, breakers.fleet, '/api/drivers'));
app.post('/api/v1/app/driverProfiles/addDriverProfile', (req, res) => forwardRequest(req, res, breakers.fleet, '/api/drivers'));
app.get('/api/v1/app/driverProfiles/getAllDriverProfilesByUser/:userId', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/by-user/${req.params.userId}`, adapters.adaptDriverProfilesResponse));
app.get('/api/v1/app/driverProfiles/getDriverProfileById/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/${req.params.id}`));
app.get('/api/v1/app/driverProfiles/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/${req.params.id}`));
app.put('/api/v1/app/driverProfiles/updateDriverProfileById/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/${req.params.id}`));
app.put('/api/v1/app/driverProfiles/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/${req.params.id}`));
app.delete('/api/v1/app/driverProfiles/deleteDriverProfileById/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/${req.params.id}`));
app.delete('/api/v1/app/driverProfiles/:id', (req, res) => forwardRequest(req, res, breakers.fleet, `/api/drivers/${req.params.id}`));

// INCOME ROUTES - Old format support
app.get('/api/v1/app/income', (req, res) => forwardRequest(req, res, breakers.finance, '/api/incomes'));
app.post('/api/v1/app/income', (req, res) => forwardRequest(req, res, breakers.finance, '/api/incomes'));
app.post('/api/v1/app/income/addIncome', (req, res) => forwardRequest(req, res, breakers.finance, '/api/incomes'));
app.get('/api/v1/app/income/getAllIncomesByTruckId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/incomes/by-truck?${query}`);
});
app.get('/api/v1/app/income/getAllIncomesByUserId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/incomes/by-user?${query}`);
});
app.get('/api/v1/app/income/getIncomeById/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.put('/api/v1/app/income/updateIncomeByTruckId/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.put('/api/v1/app/income/updateIncomeById/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.delete('/api/v1/app/income/deleteIncomeById/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.get('/api/v1/app/income/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.put('/api/v1/app/income/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.delete('/api/v1/app/income/:id', (req, res) => forwardRequest(req, res, breakers.finance, `/api/incomes/${req.params.id}`));
app.get('/api/v1/app/income/downloadIncomeExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/incomes/download?${query}`);
});
app.get('/api/v1/app/income/downloadAllIncomeExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/incomes/download-all?${query}`);
});

// FUEL EXPENSE ROUTES - Old format support
app.get('/api/v1/app/fuelExpenses/getAllFuelExpensesByTruckId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/fuel/by-truck?${query}`, adapters.adaptFuelExpensesResponse);
});
app.get('/api/v1/app/fuelExpenses/getAllFuelExpensesByUserId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/fuel/by-user?${query}`, adapters.adaptFuelExpensesResponse);
});
app.post('/api/v1/app/fuelExpenses/addFuelExpense', (req, res) => {
  req.body.type = 'fuel';
  forwardRequest(req, res, breakers.finance, '/api/expenses');
});
app.put('/api/v1/app/fuelExpenses/updateFuelExpenseByTruckId/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/expenses/${req.params.id}`);
});
app.delete('/api/v1/app/fuelExpenses/deleteFuelExpenseById/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/expenses/${req.params.id}`);
});
app.get('/api/v1/app/fuelExpenses/downloadFuelExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/fuel/download?${query}`);
});
app.get('/api/v1/app/fuelExpenses/downloadAllFuelExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/fuel/download-all?${query}`);
});

// DEF EXPENSE ROUTES - Old format support
app.get('/api/v1/app/defExpenses/getAllDefExpensesByTruckId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/def/by-truck?${query}`, adapters.adaptDefExpensesResponse);
});
app.get('/api/v1/app/defExpenses/getAllDefExpensesByUserId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/def/by-user?${query}`, adapters.adaptDefExpensesResponse);
});
app.post('/api/v1/app/defExpenses/addDefExpense', (req, res) => {
  req.body.type = 'def';
  forwardRequest(req, res, breakers.finance, '/api/expenses');
});
app.put('/api/v1/app/defExpenses/updateDefExpenseByTruckId/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/expenses/${req.params.id}`);
});
app.delete('/api/v1/app/defExpenses/deleteDefExpenseById/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/expenses/${req.params.id}`);
});
app.get('/api/v1/app/defExpenses/downloadDefExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/def/download?${query}`);
});
app.get('/api/v1/app/defExpenses/downloadAllDefExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/def/download-all?${query}`);
});

// OTHER EXPENSE ROUTES - Old format support
app.get('/api/v1/app/otherExpenses/getAllOtherExpensesByTruckId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/other/by-truck?${query}`, adapters.adaptOtherExpensesResponse);
});
app.get('/api/v1/app/otherExpenses/getAllOtherExpensesByUserId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/other/by-user?${query}`, adapters.adaptOtherExpensesResponse);
});
app.post('/api/v1/app/otherExpenses/addOtherExpense', (req, res) => {
  req.body.type = 'other';
  forwardRequest(req, res, breakers.finance, '/api/expenses');
});
app.put('/api/v1/app/otherExpenses/updateOtherExpenseByTruckId/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/expenses/${req.params.id}`);
});
app.delete('/api/v1/app/otherExpenses/deleteOtherExpenseById/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/expenses/${req.params.id}`);
});
app.get('/api/v1/app/otherExpenses/downloadOtherExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/other/download?${query}`);
});
app.get('/api/v1/app/otherExpenses/downloadAllOtherExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/other/download-all?${query}`);
});

// TOTAL EXPENSE ROUTES - Old format support
app.get('/api/v1/app/totalExpenses/getAllTotalExpensesByTruckId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/total/by-truck?${query}`, adapters.adaptTotalExpensesResponse);
});
app.get('/api/v1/app/totalExpenses/getAllTotalExpensesByUserId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/total/by-user?${query}`, adapters.adaptTotalExpensesResponse);
});
app.get('/api/v1/app/totalExpenses/downloadAllTotalExpensesExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/expenses/total/download-all?${query}`);
});

// LOAN CALCULATION ROUTES - Old format support
app.get('/api/v1/app/calculateLoan/getAllLoanCalculationsByTruckId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/calculate-loan/by-truck?${query}`, adapters.adaptLoanCalculationsResponse);
});
app.get('/api/v1/app/calculateLoan/getAllLoanCalculationsByUserId', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/calculate-loan/by-user?${query}`, adapters.adaptLoanCalculationsResponse);
});
app.post('/api/v1/app/calculateLoan/addLoanCalculation', (req, res) => {
  forwardRequest(req, res, breakers.finance, '/api/calculate-loan');
});
app.put('/api/v1/app/calculateLoan/updateLoanCalculationById/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/calculate-loan/${req.params.id}`);
});
app.delete('/api/v1/app/calculateLoan/deleteLoanCalculationById/:id', (req, res) => {
  forwardRequest(req, res, breakers.finance, `/api/calculate-loan/${req.params.id}`);
});
app.get('/api/v1/app/calculateLoan/downloadLoanCalculationExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/calculate-loan/download?${query}`);
});
app.get('/api/v1/app/calculateLoan/downloadAllLoanCalculationExcel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.finance, `/api/calculate-loan/download-all?${query}`);
});

// ALERTS/NOTIFICATIONS - Old format support
app.get('/api/v1/app/alerts', (req, res) => forwardRequest(req, res, breakers.notification, '/api/alerts', adapters.adaptAlertsResponse));
app.post('/api/v1/app/alerts', (req, res) => forwardRequest(req, res, breakers.notification, '/api/alerts'));
app.post('/api/v1/app/alerts/addAlert', (req, res) => forwardRequest(req, res, breakers.notification, '/api/alerts'));
app.get('/api/v1/app/alerts/getAllAlertsByUser/:addedBy', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  forwardRequest(req, res, breakers.notification, `/api/alerts/by-user/${req.params.addedBy}${query ? '?' + query : ''}`, adapters.adaptAlertsResponse);
});
app.get('/api/v1/app/alerts/getAlertById/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/${req.params.id}`));
app.get('/api/v1/app/alerts/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/${req.params.id}`));
app.put('/api/v1/app/alerts/updateAlertById/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/${req.params.id}`));
app.put('/api/v1/app/alerts/markAlertAsRead/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/mark-read/${req.params.id}`));
app.put('/api/v1/app/alerts/markRecurringAlertAsDone/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/mark-done/${req.params.id}`));
app.put('/api/v1/app/alerts/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/${req.params.id}`));
app.delete('/api/v1/app/alerts/deleteAlertById/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/${req.params.id}`));
app.delete('/api/v1/app/alerts/:id', (req, res) => forwardRequest(req, res, breakers.notification, `/api/alerts/${req.params.id}`));

// METADATA - Old format support
app.get('/api/v1/app/metadata', (req, res) => forwardRequest(req, res, breakers.analytics, '/api/metadata'));
// Metadata routes - routed to finance-service (not analytics)
app.get('/api/v1/app/metadata/getMetadataByUserId', (req, res) => forwardRequest(req, res, breakers.finance, `/api/metadata/getMetadataByUserId?userId=${req.query.userId}`));
app.get('/api/v1/app/metadata/getProfileMetadataByUserId', (req, res) => forwardRequest(req, res, breakers.finance, `/api/metadata/getProfileMetadataByUserId?userId=${req.query.userId}`));
app.get('/api/v1/app/metadata/getSixMonthsDataByUserId', (req, res) => forwardRequest(req, res, breakers.finance, `/api/metadata/getSixMonthsDataByUserId?userId=${req.query.userId}`));
app.get('/api/v1/app/metadata/getMetadataByTruckId', (req, res) => forwardRequest(req, res, breakers.finance, `/api/metadata/getMetadataByTruckId?truckId=${req.query.truckId}`));

// USERS - Old format support
app.get('/api/v1/app/users', (req, res) => forwardRequest(req, res, breakers.auth, '/api/users'));
app.get('/api/v1/app/users/:id', (req, res) => forwardRequest(req, res, breakers.auth, `/api/users/${req.params.id}`));

// ADMIN ROUTES - Old format support
app.get('/api/v1/app/admin/getAlluser', (req, res) => forwardRequest(req, res, breakers.auth, '/api/admin/getAlluser'));
app.get('/api/v1/app/admin/getOneUserByUsername/:username', (req, res) => forwardRequest(req, res, breakers.auth, `/api/admin/getOneUserByUsername/${req.params.username}`));
app.delete('/api/v1/app/admin/deleteOneUserByUsername/:username', (req, res) => forwardRequest(req, res, breakers.auth, `/api/admin/deleteOneUserByUsername/${req.params.username}`));
app.delete('/api/v1/app/admin/deleteTestUsers', (req, res) => forwardRequest(req, res, breakers.auth, '/api/admin/deleteTestUsers'));
app.put('/api/v1/app/admin/manageSubscription', (req, res) => forwardRequest(req, res, breakers.auth, '/api/admin/manageSubscription'));

// New format routes (keep existing)
app.all('/api/auth/*', (req, res) => {
  const path = req.path.replace('/api/auth', '/api');
  forwardRequest(req, res, breakers.auth, path);
});

app.all('/api/trucks/*', (req, res) => {
  const path = req.path.replace('/api/trucks', '/api/trucks');
  forwardRequest(req, res, breakers.fleet, path);
});

app.all('/api/drivers/*', (req, res) => {
  const path = req.path.replace('/api/drivers', '/api/drivers');
  forwardRequest(req, res, breakers.fleet, path);
});

app.all('/api/finance/*', (req, res) => {
  const path = req.path.replace('/api/finance', '/api');
  forwardRequest(req, res, breakers.finance, path);
});

app.all('/api/notifications/*', (req, res) => {
  const path = req.path.replace('/api/notifications', '/api');
  forwardRequest(req, res, breakers.notification, path);
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway v2 running on port ${PORT}`, { services: SERVICES });
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Supporting both old (/api/v1/app/) and new (/api/) routes`);
});

module.exports = app;
