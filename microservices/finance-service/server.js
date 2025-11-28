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