const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const axios = require('axios');
require('dotenv').config();

const Income = require('./models/Income');
const FuelExpense = require('./models/FuelExpense');
const DefExpense = require('./models/DefExpense');
const OtherExpense = require('./models/OtherExpense');
const LoanCalculation = require('./models/LoanCalculation');
const Expense = require('./models/Expense');

const app = express();
const PORT = process.env.PORT || 3003;
const FLEET_SERVICE_URL = process.env.FLEET_SERVICE_URL || 'http://localhost:3002';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'finance-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'finance.log' })
  ]
});

// Helper function to fetch truck registration number
const getTruckRegistration = async (truckId) => {
  try {
    const response = await axios.get(`${FLEET_SERVICE_URL}/api/trucks/${truckId}`);
    return response.data.registrationNo || 'N/A';
  } catch (error) {
    logger.warn('Failed to fetch truck registration', { truckId, error: error.message });
    return 'N/A';
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

// Database connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_finance_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Finance Service Database Connected', {
      database: 'mmt_finance_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'finance-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
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
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Finance Service REST API running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_finance_db'
    });
    console.log(`💰 Finance Service REST API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Database: mmt_finance_db`);
  });
};

startServer();

module.exports = app;
