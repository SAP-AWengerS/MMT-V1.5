const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;
const GRPC_PORT = process.env.GRPC_PORT || 50052;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'analytics-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'analytics.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_analytics_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Analytics Service Database Connected', {
      database: 'mmt_analytics_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// gRPC Client to Fleet Service
const FLEET_GRPC_URL = process.env.FLEET_GRPC_URL || 'localhost:50051';
const fleetProtoPath = path.join(__dirname, 'fleet.proto');
const fleetPackageDef = protoLoader.loadSync(fleetProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const fleetProto = grpc.loadPackageDefinition(fleetPackageDef).fleet;
const fleetClient = new fleetProto.FleetService(
  FLEET_GRPC_URL,
  grpc.credentials.createInsecure()
);

// Analytics data schema (for caching)
const analyticsSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  metricType: { type: String, required: true },
  value: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'analytics-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
});

// REST endpoint for dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    const stats = await Analytics.find({ userId }).sort({ timestamp: -1 }).limit(10);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metadata by user ID
app.get('/api/metadata/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch trucks for this user via gRPC
    fleetClient.GetTrucks({ userId, limit: 100, skip: 0 }, (err, trucksResponse) => {
      if (err) {
        logger.error('Error fetching trucks from Fleet Service', { error: err.message });
        return res.status(500).json({ error: 'Failed to fetch fleet data' });
      }

      const trucks = trucksResponse.trucks || [];
      const metadata = {
        totalTrucks: trucks.length,
        activeTrucks: trucks.filter(t => t.status === 'active').length,
        totalRevenue: 50000,
        totalExpenses: 30000,
        netProfit: 20000
      };

      res.json({
        success: true,
        metadata
      });
    });
  } catch (error) {
    logger.error('Error fetching metadata', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profile metadata by user ID
app.get('/api/metadata/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user fleet data
    fleetClient.GetTrucks({ userId, limit: 100, skip: 0 }, (err, trucksResponse) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch fleet data' });
      }

      fleetClient.GetDrivers({ userId, limit: 100, skip: 0 }, (err2, driversResponse) => {
        if (err2) {
          return res.status(500).json({ error: 'Failed to fetch driver data' });
        }

        const trucks = trucksResponse.trucks || [];
        const drivers = driversResponse.drivers || [];

        const metadata = {
          totalTrucks: trucks.length,
          totalDrivers: drivers.length,
          totalRevenue: 150000,
          totalExpenses: 95000,
          netProfit: 55000,
          profitMargin: 36.67
        };

        res.json({
          success: true,
          metadata
        });
      });
    });
  } catch (error) {
    logger.error('Error fetching profile metadata', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get six months data by user ID
app.get('/api/metadata/six-months/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock six months data
    const sixMonthsData = {
      months: [
        { month: 'Jan', revenue: 20000, expenses: 12000, profit: 8000 },
        { month: 'Feb', revenue: 22000, expenses: 13000, profit: 9000 },
        { month: 'Mar', revenue: 21000, expenses: 12500, profit: 8500 },
        { month: 'Apr', revenue: 25000, expenses: 15000, profit: 10000 },
        { month: 'May', revenue: 27000, expenses: 16000, profit: 11000 },
        { month: 'Jun', revenue: 30000, expenses: 18000, profit: 12000 }
      ],
      totalRevenue: 145000,
      totalExpenses: 86500,
      totalProfit: 58500
    };

    res.json({
      success: true,
      data: sixMonthsData
    });
  } catch (error) {
    logger.error('Error fetching six months data', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metadata by truck ID
app.get('/api/metadata/by-truck/:truckId', async (req, res) => {
  try {
    const { truckId } = req.params;

    // Fetch truck via gRPC
    fleetClient.GetTruckById({ id: truckId }, (err, truck) => {
      if (err) {
        return res.status(404).json({ error: 'Truck not found' });
      }

      const metadata = {
        truckNumber: truck.truckNumber,
        truckName: truck.truckName,
        status: truck.status,
        totalRevenue: 25000,
        totalExpenses: 15000,
        netProfit: 10000,
        trips: 20,
        fuelEfficiency: 8.5
      };

      res.json({
        success: true,
        metadata
      });
    });
  } catch (error) {
    logger.error('Error fetching truck metadata', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic metadata endpoint
app.get('/api/metadata', async (req, res) => {
  try {
    const { userId, truckId } = req.query;

    if (userId) {
      return res.redirect(`/api/metadata/by-user/${userId}`);
    } else if (truckId) {
      return res.redirect(`/api/metadata/by-truck/${truckId}`);
    }

    res.json({
      success: false,
      error: 'userId or truckId required'
    });
  } catch (error) {
    logger.error('Error fetching metadata', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== gRPC SERVER ====================

const analyticsProtoPath = path.join(__dirname, 'analytics.proto');
const analyticsPackageDef = protoLoader.loadSync(analyticsProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const analyticsProto = grpc.loadPackageDefinition(analyticsPackageDef).analytics;

// gRPC service implementation
const grpcServiceImpl = {
  GetTotalExpenses: async (call, callback) => {
    try {
      const { truckId, startDate, endDate, userId } = call.request;

      // Mock expense calculation (in real scenario, query Finance Service)
      const mockExpenses = {
        totalExpenses: 15000,
        fuelExpenses: 8000,
        defExpenses: 2000,
        otherExpenses: 3000,
        maintenanceExpenses: 2000,
        transactionCount: 45,
        period: `${startDate} to ${endDate}`
      };

      logger.info('gRPC: GetTotalExpenses called', {
        truckId,
        totalExpenses: mockExpenses.totalExpenses
      });

      callback(null, mockExpenses);
    } catch (error) {
      logger.error('gRPC: GetTotalExpenses error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetMetadata: async (call, callback) => {
    try {
      const { userId, metricType } = call.request;

      // Fetch from analytics database
      const metrics = await Analytics.find({ userId, metricType })
        .sort({ timestamp: -1 })
        .limit(2);

      const currentValue = metrics[0]?.value || 0;
      const previousValue = metrics[1]?.value || 0;
      const change = currentValue - previousValue;
      const percentageChange = previousValue > 0 ? (change / previousValue) * 100 : 0;

      const response = {
        metricType,
        currentValue,
        previousValue,
        percentageChange,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        period: 'monthly',
        breakdown: {}
      };

      logger.info('gRPC: GetMetadata called', { userId, metricType });

      callback(null, response);
    } catch (error) {
      logger.error('gRPC: GetMetadata error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetDashboardStats: async (call, callback) => {
    try {
      const { userId, period } = call.request;

      // Query Fleet Service via gRPC for truck data
      fleetClient.GetTrucks({ userId, limit: 100, skip: 0 }, (err, response) => {
        if (err) {
          logger.error('Error querying Fleet Service', { error: err.message });
          return callback({
            code: grpc.status.INTERNAL,
            details: 'Failed to fetch fleet data'
          });
        }

        const trucks = response.trucks || [];
        const activeTrucks = trucks.filter(t => t.status === 'active').length;

        // Mock analytics data
        const stats = {
          totalTrucks: trucks.length,
          activeTrucks: activeTrucks,
          totalDrivers: 25,
          totalRevenue: 150000,
          totalExpenses: 95000,
          netProfit: 55000,
          profitMargin: 36.67,
          topPerformingTrucks: trucks.slice(0, 5).map(truck => ({
            truckId: truck.id,
            truckNumber: truck.truckNumber,
            revenue: 25000,
            expenses: 15000,
            profit: 10000,
            trips: 20
          })),
          expenseBreakdown: {
            fuel: 50000,
            def: 15000,
            maintenance: 20000,
            other: 10000
          }
        };

        logger.info('gRPC: GetDashboardStats called', {
          userId,
          totalTrucks: stats.totalTrucks
        });

        callback(null, stats);
      });
    } catch (error) {
      logger.error('gRPC: GetDashboardStats error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetExpenseTrends: async (call, callback) => {
    try {
      const { userId, metricType, startDate, endDate, granularity } = call.request;

      // Mock trend data
      const dataPoints = [
        { date: '2024-01-01', value: 10000, label: 'Jan' },
        { date: '2024-02-01', value: 12000, label: 'Feb' },
        { date: '2024-03-01', value: 11500, label: 'Mar' },
        { date: '2024-04-01', value: 13000, label: 'Apr' },
        { date: '2024-05-01', value: 14000, label: 'May' }
      ];

      const values = dataPoints.map(dp => dp.value);
      const trendData = {
        metricType,
        dataPoints,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };

      logger.info('gRPC: GetExpenseTrends called', { userId, metricType });

      callback(null, trendData);
    } catch (error) {
      logger.error('gRPC: GetExpenseTrends error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  StreamAnalytics: (call) => {
    logger.info('gRPC: StreamAnalytics - streaming started');

    const interval = setInterval(() => {
      const update = {
        timestamp: new Date().toISOString(),
        metric: 'totalExpenses',
        value: Math.random() * 100000,
        change: (Math.random() - 0.5) * 10000
      };

      call.write(update);
    }, 5000);

    call.on('cancelled', () => {
      clearInterval(interval);
      logger.info('gRPC: StreamAnalytics - client cancelled');
    });
  }
};

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Start servers
const startServers = async () => {
  await connectDB();

  // Start REST API server
  app.listen(PORT, () => {
    logger.info(`Analytics Service REST API running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_analytics_db'
    });
    console.log(`📊 Analytics Service REST API running on port ${PORT}`);
    console.log(`📈 Health check: http://localhost:${PORT}/health`);
  });

  // Start gRPC server
  const grpcServer = new grpc.Server();
  grpcServer.addService(analyticsProto.AnalyticsService.service, grpcServiceImpl);

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        logger.error('gRPC server failed to start', { error: error.message });
        return;
      }

      logger.info(`Analytics Service gRPC server running on port ${port}`);
      console.log(`🔌 Analytics Service gRPC server running on port ${port}`);
    }
  );
};

startServers();

module.exports = app;
