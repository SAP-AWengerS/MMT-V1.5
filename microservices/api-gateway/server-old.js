const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const CircuitBreaker = require('opossum');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const winston = require('winston');
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
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  fleet: process.env.FLEET_SERVICE_URL || 'http://localhost:3002',
  finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:3003',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/google', '/health'];

  if (publicRoutes.some(route => req.path.startsWith(route))) {
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

// Circuit Breaker Configuration
const breakerOptions = {
  timeout: 3000, // 3 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // 30 seconds
  name: 'serviceBreaker'
};

// Create circuit breakers for each service
const circuitBreakers = {};

Object.keys(SERVICES).forEach(serviceName => {
  const breaker = new CircuitBreaker(
    async (req, res, serviceUrl) => {
      return new Promise((resolve, reject) => {
        const proxy = createProxyMiddleware({
          target: serviceUrl,
          changeOrigin: true,
          pathRewrite: (path) => {
            // Remove the service prefix from the path
            return path.replace(`/api/${serviceName}`, '/api');
          },
          onError: (err, req, res) => {
            logger.error(`Proxy error for ${serviceName}`, {
              error: err.message,
              path: req.path
            });
            reject(err);
          },
          onProxyRes: (proxyRes, req, res) => {
            resolve(proxyRes);
          }
        });

        proxy(req, res, (err) => {
          if (err) reject(err);
        });
      });
    },
    breakerOptions
  );

  // Circuit breaker event listeners
  breaker.on('open', () => {
    logger.error(`Circuit breaker opened for ${serviceName}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open for ${serviceName}`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker closed for ${serviceName}`);
  });

  breaker.fallback(() => {
    return {
      error: `${serviceName} service is currently unavailable. Please try again later.`,
      fallback: true
    };
  });

  circuitBreakers[serviceName] = breaker;
});

// Apply authentication middleware
app.use(authenticateToken);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {}
  };

  Object.keys(circuitBreakers).forEach(serviceName => {
    const breaker = circuitBreakers[serviceName];
    healthStatus.services[serviceName] = {
      status: breaker.opened ? 'DOWN' : 'UP',
      stats: breaker.stats
    };
  });

  const overallStatus = Object.values(healthStatus.services).every(s => s.status === 'UP');
  res.status(overallStatus ? 200 : 503).json(healthStatus);
});

// Service routing with circuit breaker
Object.keys(SERVICES).forEach(serviceName => {
  app.use(`/api/${serviceName}`, async (req, res, next) => {
    try {
      logger.info(`Routing request to ${serviceName}`, {
        method: req.method,
        path: req.path,
        user: req.user?.id
      });

      const breaker = circuitBreakers[serviceName];
      const result = await breaker.fire(req, res, SERVICES[serviceName]);

      if (result && result.fallback) {
        return res.status(503).json(result);
      }
    } catch (error) {
      logger.error(`Error routing to ${serviceName}`, {
        error: error.message,
        path: req.path
      });

      // Check if circuit is open
      if (circuitBreakers[serviceName].opened) {
        return res.status(503).json({
          error: `${serviceName} service is currently unavailable`,
          message: 'Circuit breaker is open. Please try again later.'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});

// GraphQL Gateway - Route to Finance Service
app.use('/graphql', createProxyMiddleware({
  target: SERVICES.finance,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error('GraphQL proxy error', { error: err.message });
    res.status(503).json({ error: 'GraphQL service unavailable' });
  }
}));

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`, {
    services: SERVICES,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
