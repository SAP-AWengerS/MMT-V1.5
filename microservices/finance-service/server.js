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

// ==================== EXPENSE ROUTES (Unified) ====================

// Add Expense (handles fuel, def, other)
app.post('/api/expenses', async (req, res) => {
  try {
    const { type, addedBy, truckId, amount, category, quantity, pricePerUnit, station, date, description, otherType,
            cost, litres, currentKM, note } = req.body;

    let expense;
    const expenseType = type || category;

    if (expenseType === 'fuel') {
      expense = new FuelExpense({
        addedBy,
        truckId,
        currentKM: currentKM || 0,
        litres: litres || quantity || 0,
        cost: cost || amount || (quantity * pricePerUnit) || 0,
        date: new Date(date),
        note: note || description || ''
      });
    } else if (expenseType === 'def') {
      // DEF uses same fields as Fuel: cost, litres, currentKM
      expense = new DefExpense({
        addedBy,
        truckId,
        currentKM: currentKM || 0,
        litres: litres || quantity || 0,
        cost: cost || amount || (quantity * pricePerUnit) || 0,
        date: new Date(date),
        note: note || description || ''
      });
    } else {
      // Other expenses - match OtherExpense model fields
      expense = new OtherExpense({
        addedBy,
        truckId,
        category: category || 'Other',           // Required field
        cost: cost || amount || 0,               // Required field (not 'amount')
        date: new Date(date),
        note: note || description || '',         // Optional field (not 'description')
        other: otherType || ''                   // Optional field
      });
    }

    await expense.save();
    logger.info('Expense added', { expenseId: expense._id, type: expenseType });
    res.status(201).json(expense);
  } catch (error) {
    logger.error('Error adding expense', { error: error.message });
    res.status(500).json({ message: 'Failed to add expense', error: error.message });
  }
});

// Get Fuel Expenses by Truck
app.get('/api/expenses/fuel/by-truck', async (req, res) => {
  try {
    const { truckId, startDate, endDate } = req.query;

    const filter = { truckId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await FuelExpense.find(filter).sort({ date: -1 });
    logger.info('Fuel expenses fetched by truck', { truckId, count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching fuel expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Get Fuel Expenses by User
app.get('/api/expenses/fuel/by-user', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const filter = { addedBy: userId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await FuelExpense.find(filter).sort({ date: -1 });
    logger.info('Fuel expenses fetched by user', { userId, count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching fuel expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Get DEF Expenses by Truck
app.get('/api/expenses/def/by-truck', async (req, res) => {
  try {
    const { truckId, startDate, endDate } = req.query;

    const filter = { truckId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await DefExpense.find(filter).sort({ date: -1 });
    logger.info('DEF expenses fetched by truck', { truckId, count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching DEF expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Get DEF Expenses by User
app.get('/api/expenses/def/by-user', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const filter = { addedBy: userId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await DefExpense.find(filter).sort({ date: -1 });
    logger.info('DEF expenses fetched by user', { userId, count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching DEF expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Get Other Expenses by Truck
app.get('/api/expenses/other/by-truck', async (req, res) => {
  try {
    const { truckId, startDate, endDate } = req.query;

    const filter = { truckId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await OtherExpense.find(filter).sort({ date: -1 });
    logger.info('Other expenses fetched by truck', { truckId, count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching other expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Get Other Expenses by User
app.get('/api/expenses/other/by-user', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const filter = { addedBy: userId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await OtherExpense.find(filter).sort({ date: -1 });
    logger.info('Other expenses fetched by user', { userId, count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching other expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
});

// Get Total Expenses by Truck - EXACT backend format and logic
app.get('/api/expenses/total/by-truck', async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;
    const moment = require('moment');

    if (!truckId) {
      return res.status(400).json({ message: 'Truck ID is required' });
    }

    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf('day').toDate()
      : null;
    const endDate = selectedDates
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

    const fuelExpenses = (await FuelExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: 'Fuel Expense',
      })
    );

    const defExpenses = (await DefExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: 'Def Expense',
      })
    );

    const otherExpenses = (
      await OtherExpense.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: 'Other Expense',
    }));

    const loanExpenses = (
      await LoanCalculation.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: 'Loan Expense',
    }));

    const allExpenses = [...fuelExpenses, ...defExpenses, ...otherExpenses, ...loanExpenses];

    if (allExpenses.length === 0) {
      return res.status(404).json({
        message: 'No expenses found for this truck in the given date range',
      });
    }

    // EXACT backend logic - fetch truck registration for each expense
    const formattedExpenses = await Promise.all(
      allExpenses.map(async (expense) => {
        // In backend: const truck = await TruckExpense.findById(expense.truckId);
        // In microservices: query fleet-service
        const registrationNo = await getTruckRegistration(expense.truckId);

        const date = new Date(expense.date);
        const formattedDate = moment(date).format('DD-MM-YYYY');

        return {
          ...expense,
          date: formattedDate,
          registrationNo,
        };
      })
    );

    // Sort combined expenses by date
    formattedExpenses.sort(
      (a, b) =>
        new Date(a.date.split('-').reverse().join('-')) -
        new Date(b.date.split('-').reverse().join('-'))
    );

    const totalExpense = formattedExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    res.status(200).json({
      expenses: formattedExpenses,
      totalExpense,
    });
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ message: 'Failed to retrieve expenses' });
  }
});

// Get Total Expenses by User - EXACT backend format
app.get('/api/expenses/total/by-user', async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;
    const moment = require('moment');

    logger.info('Fetching total expenses by user ID', { userId, selectedDates });

    if (!userId) {
      logger.warn('Get total expenses attempted without user ID');
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

    // Fetch all expense types
    const fuelExpenses = (await FuelExpense.find(query).sort({ date: 1 })).map(expense => ({
      ...expense.toObject(),
      catalog: 'Fuel Expense'
    }));

    const defExpenses = (await DefExpense.find(query).sort({ date: 1 })).map(expense => ({
      ...expense.toObject(),
      catalog: 'Def Expense'
    }));

    const otherExpenses = (await OtherExpense.find(query).sort({ date: 1 })).map(expense => ({
      ...expense.toObject(),
      catalog: 'Other Expense'
    }));

    const loanExpenses = (await LoanCalculation.find(query).sort({ date: 1 })).map(expense => ({
      ...expense.toObject(),
      catalog: 'Loan Expense'
    }));

    const allExpenses = [...fuelExpenses, ...defExpenses, ...otherExpenses, ...loanExpenses];

    if (allExpenses.length === 0) {
      logger.info(`No total expenses found for user ${userId}`, { userId, dateRange: selectedDates });
      return res.status(404).json({
        message: 'No expenses found for this user in the given date range'
      });
    }

    // Fetch registration numbers for all unique truck IDs
    const uniqueTruckIds = [...new Set(allExpenses.map(e => e.truckId))];
    const truckRegMap = {};

    await Promise.all(
      uniqueTruckIds.map(async (truckId) => {
        truckRegMap[truckId] = await getTruckRegistration(truckId);
      })
    );

    // Format expenses with truck registration
    const formattedExpenses = allExpenses.map(expense => {
      const date = new Date(expense.date);
      const formattedDate = moment(date).format('DD-MM-YYYY');

      return {
        ...expense,
        date: formattedDate,
        registrationNo: truckRegMap[expense.truckId] || 'N/A'
      };
    });

    // Sort by date
    formattedExpenses.sort((a, b) =>
      new Date(a.date.split('-').reverse().join('-')) -
      new Date(b.date.split('-').reverse().join('-'))
    );

    const totalExpense = formattedExpenses.reduce((sum, expense) => sum + (expense.cost || 0), 0);

    logger.info(`Retrieved ${formattedExpenses.length} total expenses for user ${userId}`, {
      userId,
      count: formattedExpenses.length,
      totalExpense,
      dateRange: selectedDates
    });

    res.status(200).json({
      expenses: formattedExpenses,
      totalExpense
    });
  } catch (error) {
    logger.error('Error fetching total expenses', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve expenses', error: error.message });
  }
});

// Update Expense (generic - finds by ID across all types)
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Try each expense type
    let expense = await FuelExpense.findByIdAndUpdate(id, updates, { new: true });
    if (!expense) expense = await DefExpense.findByIdAndUpdate(id, updates, { new: true });
    if (!expense) expense = await OtherExpense.findByIdAndUpdate(id, updates, { new: true });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    logger.info('Expense updated', { expenseId: id });
    res.json(expense);
  } catch (error) {
    logger.error('Error updating expense', { error: error.message });
    res.status(500).json({ message: 'Failed to update expense', error: error.message });
  }
});

// Delete Expense (generic - finds by ID across all types)
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try each expense type
    let expense = await FuelExpense.findByIdAndDelete(id);
    if (!expense) expense = await DefExpense.findByIdAndDelete(id);
    if (!expense) expense = await OtherExpense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    logger.info('Expense deleted', { expenseId: id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Error deleting expense', { error: error.message });
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
});

// Excel Download Placeholders
app.get('/api/expenses/fuel/download', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/expenses/fuel/download-all', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/expenses/def/download', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/expenses/def/download-all', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/expenses/other/download', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/expenses/other/download-all', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/expenses/total/download-all', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

// ==================== LOAN CALCULATION ROUTES ====================

// Add Loan Calculation
app.post('/api/calculate-loan', async (req, res) => {
  try {
    const { truckId, addedBy, date, cost, additionalCharges, note } = req.body;

    const loan = new LoanCalculation({
      truckId,
      addedBy,
      date: new Date(date),
      cost,
      additionalCharges,
      note
    });

    await loan.save();
    logger.info('Loan calculation added', { loanId: loan._id, truckId, cost });
    res.status(201).json(loan);
  } catch (error) {
    logger.error('Error adding loan calculation', { error: error.message });
    res.status(500).json({ message: 'Failed to add loan calculation', error: error.message });
  }
});

// Get Loan Calculations by Truck
app.get('/api/calculate-loan/by-truck', async (req, res) => {
  try {
    const { truckId, startDate, endDate } = req.query;

    const filter = { truckId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const loans = await LoanCalculation.find(filter).sort({ date: -1 });
    logger.info('Loan calculations fetched by truck', { truckId, count: loans.length });
    res.json(loans);
  } catch (error) {
    logger.error('Error fetching loan calculations', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch loan calculations', error: error.message });
  }
});

// Get Loan Calculations by User
app.get('/api/calculate-loan/by-user', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const filter = { addedBy: userId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const loans = await LoanCalculation.find(filter).sort({ date: -1 });
    logger.info('Loan calculations fetched by user', { userId, count: loans.length });
    res.json(loans);
  } catch (error) {
    logger.error('Error fetching loan calculations', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch loan calculations', error: error.message });
  }
});

// Update Loan Calculation
app.put('/api/calculate-loan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const loan = await LoanCalculation.findByIdAndUpdate(id, updates, { new: true });

    if (!loan) {
      return res.status(404).json({ message: 'Loan calculation not found' });
    }

    logger.info('Loan calculation updated', { loanId: id });
    res.json(loan);
  } catch (error) {
    logger.error('Error updating loan calculation', { error: error.message });
    res.status(500).json({ message: 'Failed to update loan calculation', error: error.message });
  }
});

// Delete Loan Calculation
app.delete('/api/calculate-loan/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await LoanCalculation.findByIdAndDelete(id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan calculation not found' });
    }

    logger.info('Loan calculation deleted', { loanId: id });
    res.json({ message: 'Loan calculation deleted successfully' });
  } catch (error) {
    logger.error('Error deleting loan calculation', { error: error.message });
    res.status(500).json({ message: 'Failed to delete loan calculation', error: error.message });
  }
});

// Loan Calculation Excel Placeholders
app.get('/api/calculate-loan/download', (req, res) => {
  res.status(501).json({ message: 'Excel download not yet implemented' });
});

app.get('/api/calculate-loan/download-all', (req, res) => {
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
