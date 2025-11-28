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
