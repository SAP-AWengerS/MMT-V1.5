const express = require('express');
const mongoose = require('mongoose');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const Income = require('./models/Income');
const Expense = require('./models/Expense');

const app = express();
const PORT = process.env.PORT || 3003;

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

// GraphQL Type Definitions
const typeDefs = `#graphql
  type Income {
    id: ID!
    truckId: ID!
    userId: ID!
    amount: Float!
    source: String!
    date: String!
    description: String
    createdAt: String!
  }

  type Expense {
    id: ID!
    truckId: ID!
    userId: ID!
    amount: Float!
    category: String!
    quantity: Float
    pricePerUnit: Float
    station: String
    date: String!
    description: String
    createdAt: String!
  }

  type ExpenseSummary {
    totalExpenses: Float!
    fuelExpenses: Float!
    defExpenses: Float!
    otherExpenses: Float!
    maintenanceExpenses: Float!
    breakdown: [ExpenseBreakdown!]!
    period: String!
    transactionCount: Int!
  }

  type ExpenseBreakdown {
    category: String!
    amount: Float!
    percentage: Float!
    count: Int!
  }

  type ExpenseDetails {
    fuelExpenses: [Expense!]!
    defExpenses: [Expense!]!
    otherExpenses: [Expense!]!
    maintenanceExpenses: [Expense!]!
    total: Float!
  }

  type Query {
    getTotalExpenses(truckId: ID!, startDate: String!, endDate: String!): ExpenseSummary!
    getIncomeByTruck(truckId: ID!, startDate: String, endDate: String): [Income!]!
    getExpensesByTruck(truckId: ID!, startDate: String, endDate: String): ExpenseDetails!
    getIncome(userId: ID): [Income!]!
    getExpenses(userId: ID): [Expense!]!
  }

  type Mutation {
    addIncome(
      truckId: ID!
      userId: ID!
      amount: Float!
      source: String!
      date: String!
      description: String
    ): Income!

    addExpense(
      truckId: ID!
      userId: ID!
      amount: Float!
      category: String!
      quantity: Float
      pricePerUnit: Float
      station: String
      date: String!
      description: String
    ): Expense!

    deleteIncome(id: ID!): Boolean!
    deleteExpense(id: ID!): Boolean!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    getTotalExpenses: async (_, { truckId, startDate, endDate }) => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const expenses = await Expense.find({
          truckId,
          date: { $gte: start, $lte: end }
        });

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const fuelExpenses = expenses
          .filter(exp => exp.category === 'fuel')
          .reduce((sum, exp) => sum + exp.amount, 0);
        const defExpenses = expenses
          .filter(exp => exp.category === 'def')
          .reduce((sum, exp) => sum + exp.amount, 0);
        const maintenanceExpenses = expenses
          .filter(exp => exp.category === 'maintenance')
          .reduce((sum, exp) => sum + exp.amount, 0);
        const otherExpenses = expenses
          .filter(exp => exp.category === 'other')
          .reduce((sum, exp) => sum + exp.amount, 0);

        const breakdown = [
          { category: 'fuel', amount: fuelExpenses },
          { category: 'def', amount: defExpenses },
          { category: 'maintenance', amount: maintenanceExpenses },
          { category: 'other', amount: otherExpenses }
        ].map(item => ({
          ...item,
          percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
          count: expenses.filter(exp => exp.category === item.category).length
        }));

        logger.info('Total expenses queried', {
          truckId,
          totalExpenses,
          period: `${startDate} to ${endDate}`
        });

        return {
          totalExpenses,
          fuelExpenses,
          defExpenses,
          maintenanceExpenses,
          otherExpenses,
          breakdown,
          period: `${startDate} to ${endDate}`,
          transactionCount: expenses.length
        };
      } catch (error) {
        logger.error('Error getting total expenses', { error: error.message });
        throw new Error('Failed to fetch total expenses');
      }
    },

    getIncomeByTruck: async (_, { truckId, startDate, endDate }) => {
      try {
        const filter = { truckId };

        if (startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const income = await Income.find(filter).sort({ date: -1 });

        logger.info('Income fetched', {
          truckId,
          count: income.length
        });

        return income.map(inc => ({
          id: inc._id.toString(),
          truckId: inc.truckId,
          userId: inc.userId,
          amount: inc.amount,
          source: inc.source,
          date: inc.date.toISOString(),
          description: inc.description || '',
          createdAt: inc.createdAt.toISOString()
        }));
      } catch (error) {
        logger.error('Error getting income', { error: error.message });
        throw new Error('Failed to fetch income');
      }
    },

    getExpensesByTruck: async (_, { truckId, startDate, endDate }) => {
      try {
        const filter = { truckId };

        if (startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const expenses = await Expense.find(filter).sort({ date: -1 });

        const fuelExpenses = expenses.filter(exp => exp.category === 'fuel');
        const defExpenses = expenses.filter(exp => exp.category === 'def');
        const maintenanceExpenses = expenses.filter(exp => exp.category === 'maintenance');
        const otherExpenses = expenses.filter(exp => exp.category === 'other');
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const mapExpense = (exp) => ({
          id: exp._id.toString(),
          truckId: exp.truckId,
          userId: exp.userId,
          amount: exp.amount,
          category: exp.category,
          quantity: exp.quantity || 0,
          pricePerUnit: exp.pricePerUnit || 0,
          station: exp.station || '',
          date: exp.date.toISOString(),
          description: exp.description || '',
          createdAt: exp.createdAt.toISOString()
        });

        return {
          fuelExpenses: fuelExpenses.map(mapExpense),
          defExpenses: defExpenses.map(mapExpense),
          maintenanceExpenses: maintenanceExpenses.map(mapExpense),
          otherExpenses: otherExpenses.map(mapExpense),
          total
        };
      } catch (error) {
        logger.error('Error getting expenses', { error: error.message });
        throw new Error('Failed to fetch expenses');
      }
    },

    getIncome: async (_, { userId }) => {
      try {
        const filter = userId ? { userId } : {};
        const income = await Income.find(filter).sort({ date: -1 });

        return income.map(inc => ({
          id: inc._id.toString(),
          truckId: inc.truckId,
          userId: inc.userId,
          amount: inc.amount,
          source: inc.source,
          date: inc.date.toISOString(),
          description: inc.description || '',
          createdAt: inc.createdAt.toISOString()
        }));
      } catch (error) {
        logger.error('Error getting income', { error: error.message });
        throw new Error('Failed to fetch income');
      }
    },

    getExpenses: async (_, { userId }) => {
      try {
        const filter = userId ? { userId } : {};
        const expenses = await Expense.find(filter).sort({ date: -1 });

        return expenses.map(exp => ({
          id: exp._id.toString(),
          truckId: exp.truckId,
          userId: exp.userId,
          amount: exp.amount,
          category: exp.category,
          quantity: exp.quantity || 0,
          pricePerUnit: exp.pricePerUnit || 0,
          station: exp.station || '',
          date: exp.date.toISOString(),
          description: exp.description || '',
          createdAt: exp.createdAt.toISOString()
        }));
      } catch (error) {
        logger.error('Error getting expenses', { error: error.message });
        throw new Error('Failed to fetch expenses');
      }
    }
  },

  Mutation: {
    addIncome: async (_, { truckId, userId, amount, source, date, description }) => {
      try {
        const income = new Income({
          truckId,
          userId,
          amount,
          source,
          date: new Date(date),
          description
        });

        await income.save();

        logger.info('Income added', {
          incomeId: income._id,
          truckId,
          amount
        });

        return {
          id: income._id.toString(),
          truckId: income.truckId,
          userId: income.userId,
          amount: income.amount,
          source: income.source,
          date: income.date.toISOString(),
          description: income.description || '',
          createdAt: income.createdAt.toISOString()
        };
      } catch (error) {
        logger.error('Error adding income', { error: error.message });
        throw new Error('Failed to add income');
      }
    },

    addExpense: async (_, { truckId, userId, amount, category, quantity, pricePerUnit, station, date, description }) => {
      try {
        const expense = new Expense({
          truckId,
          userId,
          amount,
          category,
          quantity,
          pricePerUnit,
          station,
          date: new Date(date),
          description
        });

        await expense.save();

        logger.info('Expense added', {
          expenseId: expense._id,
          truckId,
          category,
          amount
        });

        return {
          id: expense._id.toString(),
          truckId: expense.truckId,
          userId: expense.userId,
          amount: expense.amount,
          category: expense.category,
          quantity: expense.quantity || 0,
          pricePerUnit: expense.pricePerUnit || 0,
          station: expense.station || '',
          date: expense.date.toISOString(),
          description: expense.description || '',
          createdAt: expense.createdAt.toISOString()
        };
      } catch (error) {
        logger.error('Error adding expense', { error: error.message });
        throw new Error('Failed to add expense');
      }
    },

    deleteIncome: async (_, { id }) => {
      try {
        await Income.findByIdAndDelete(id);
        logger.info('Income deleted', { incomeId: id });
        return true;
      } catch (error) {
        logger.error('Error deleting income', { error: error.message });
        return false;
      }
    },

    deleteExpense: async (_, { id }) => {
      try {
        await Expense.findByIdAndDelete(id);
        logger.info('Expense deleted', { expenseId: id });
        return true;
      } catch (error) {
        logger.error('Error deleting expense', { error: error.message });
        return false;
      }
    }
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  // Middleware
  app.use(cors());
  app.use(express.json());

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

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
  });

  await server.start();

  // Apply GraphQL middleware
  app.use('/graphql', expressMiddleware(server));

  app.listen(PORT, () => {
    logger.info(`Finance Service running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_finance_db',
      graphql: `http://localhost:${PORT}/graphql`
    });
    console.log(`💰 Finance Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🚀 GraphQL playground: http://localhost:${PORT}/graphql`);
  });
};

startServer();

module.exports = app;
