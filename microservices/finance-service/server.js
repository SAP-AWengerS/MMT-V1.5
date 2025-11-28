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

// ==================== INCOME ROUTES ====================

// Add Income
app.post('/api/incomes', async (req, res) => {
  try {
    const { addedBy, truckId, amount, source, date, description } = req.body;

    const income = new Income({
      addedBy,
      truckId,
      amount,
      source,
      date: new Date(date),
      description
    });

    await income.save();
    logger.info('Income added', { incomeId: income._id, truckId, amount });
    res.status(201).json(income);
  } catch (error) {
    logger.error('Error adding income', { error: error.message });
    res.status(500).json({ message: 'Failed to add income', error: error.message });
  }
});

// Get Income by Truck - EXACT backend format with profit calculation
app.get('/api/incomes/by-truck', async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;
    const moment = require('moment');

    logger.info('Fetching incomes by truck ID', { truckId, selectedDates });

    if (!truckId) {
      logger.warn('Truck ID missing in income fetch request');
      return res.status(400).json({ message: 'Truck ID is required' });
    }

    // Parse selectedDates array - frontend sends as array
    const startDate = selectedDates && Array.isArray(selectedDates)
      ? moment.utc(selectedDates[0]).startOf('day').toDate()
      : null;
    const endDate = selectedDates && Array.isArray(selectedDates)
      ? moment.utc(selectedDates[1]).endOf('day').toDate()
      : null;

    const query = { truckId };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        query.date = { $eq: startDate };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const incomes = await Income.find(query).sort({ date: 1 });

    if (incomes.length === 0) {
      return res.status(404).json({
        message: 'No incomes found for this truck in the given date range'
      });
    }

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Fetch all expenses for the same truck and date range
    const expenseQuery = { truckId };
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        expenseQuery.date = { $eq: startDate };
      } else {
        expenseQuery.date = { $gte: startDate, $lte: endDate };
      }
    }

    const [fuelExpenses, defExpenses, otherExpenses, loanExpenses] = await Promise.all([
      FuelExpense.find(expenseQuery),
      DefExpense.find(expenseQuery),
      OtherExpense.find(expenseQuery),
      LoanCalculation.find(expenseQuery)
    ]);

    const totalExpenses =
      fuelExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      defExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      otherExpenses.reduce((sum, expense) => sum + (expense.cost || expense.amount || 0), 0) +
      loanExpenses.reduce((sum, expense) => sum + expense.cost, 0);

    const totalProfit = totalIncome - totalExpenses;

    // Format incomes with DD-MM-YYYY date format
    const formattedIncomes = incomes.map((income, index) => {
      const date = new Date(income.date);
      const formattedDate = moment(date).format('DD-MM-YYYY');

      return {
        ...income.toObject(),
        date: formattedDate,
        key: index
      };
    });

    logger.info('Income fetched by truck', { truckId, count: incomes.length, totalIncome, totalProfit });

    res.status(200).json({
      expenses: formattedIncomes,
      totalExpense: totalIncome,
      totalProfit: totalProfit
    });
  } catch (error) {
    console.error('Error retrieving incomes:', error);
    logger.error('Error fetching income by truck', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve incomes' });
  }
});

// Get Income by User - EXACT backend format with profit calculation
app.get('/api/incomes/by-user', async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;
    const moment = require('moment');

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Parse selectedDates array
    const startDate = selectedDates && Array.isArray(selectedDates)
      ? moment.utc(selectedDates[0]).startOf('day').toDate()
      : null;
    const endDate = selectedDates && Array.isArray(selectedDates)
      ? moment.utc(selectedDates[1]).endOf('day').toDate()
      : null;

    const query = { addedBy: userId };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        query.date = { $eq: startDate };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const incomes = await Income.find(query).sort({ date: 1 });

    if (incomes.length === 0) {
      return res.status(404).json({
        message: 'No incomes found for this user in the given date range'
      });
    }

    // Fetch registration numbers for all unique truck IDs
    const uniqueTruckIds = [...new Set(incomes.map(i => i.truckId))];
    const truckRegMap = {};

    await Promise.all(
      uniqueTruckIds.map(async (truckId) => {
        truckRegMap[truckId] = await getTruckRegistration(truckId);
      })
    );

    // Format incomes with registration numbers and date formatting
    const formattedIncomes = incomes.map((income, index) => {
      const date = new Date(income.date);
      const formattedDate = moment(date).format('DD-MM-YYYY');

      return {
        ...income.toObject(),
        date: formattedDate,
        registrationNo: truckRegMap[income.truckId] || 'N/A',
        key: index
      };
    });

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Fetch all expenses for the same user and date range
    const expenseQuery = { addedBy: userId };
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        expenseQuery.date = { $eq: startDate };
      } else {
        expenseQuery.date = { $gte: startDate, $lte: endDate };
      }
    }

    const [fuelExpenses, defExpenses, otherExpenses, loanExpenses] = await Promise.all([
      FuelExpense.find(expenseQuery),
      DefExpense.find(expenseQuery),
      OtherExpense.find(expenseQuery),
      LoanCalculation.find(expenseQuery)
    ]);

    const totalExpenses =
      fuelExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      defExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      otherExpenses.reduce((sum, expense) => sum + (expense.cost || expense.amount || 0), 0) +
      loanExpenses.reduce((sum, expense) => sum + expense.cost, 0);

    const totalProfit = totalIncome - totalExpenses;

    logger.info('Income fetched by user', { userId, count: incomes.length, totalIncome, totalProfit });

    res.status(200).json({
      expenses: formattedIncomes,
      totalExpense: totalIncome,
      totalProfit: totalProfit
    });
  } catch (error) {
    console.error('Error retrieving incomes:', error);
    logger.error('Error fetching income by user', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve incomes' });
  }
});

// Update Income
app.put('/api/incomes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const income = await Income.findByIdAndUpdate(id, updates, { new: true });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    logger.info('Income updated', { incomeId: id });
    res.json(income);
  } catch (error) {
    logger.error('Error updating income', { error: error.message });
    res.status(500).json({ message: 'Failed to update income', error: error.message });
  }
});

// Delete Income
app.delete('/api/incomes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findByIdAndDelete(id);

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    logger.info('Income deleted', { incomeId: id });
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    logger.error('Error deleting income', { error: error.message });
    res.status(500).json({ message: 'Failed to delete income', error: error.message });
  }
});

// Download Income Excel (placeholder)
app.get('/api/incomes/download', async (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/incomes/download-all', async (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
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
