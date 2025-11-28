const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'auth-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'auth.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Database connection - Database-per-Service Pattern
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_auth_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Auth Service Database Connected', {
      database: 'mmt_auth_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin', 'fleet_manager').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// JWT Middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt', { ip: req.ip });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

// Routes

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
});

// Register new user - EXACTLY like original backend
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return res.status(409).json({ message: 'Email already exists', code: 409 });
    }

    // Generate a unique googleId for email/password users using email hash
    const crypto = require('crypto');
    const googleId = 'email_' + crypto.createHash('sha256').update(email).digest('hex').substring(0, 20);

    // Create new user
    const user = new User({
      googleId: googleId,
      email: email,
      password: password,
      name: name,
      createdAt: new Date(),
    });

    const result = await user.save();

    if (result !== null) {
      logger.info('User created successfully', { email, userId: result._id });
      res.json({
        code: 200,
        message: "User created",
        data: result,
      });
    } else {
      logger.error('Failed to create user', { email });
      res.status(500).json({ error: 'Failed to create user' });
    }

  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    // Validate request
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login attempt with inactive account', { email });
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user);

    logger.info('User logged in', {
      userId: user._id,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth login - EXACTLY like original backend
app.post('/api/google', async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  logger.info("Google Sign-In attempt", { hasToken: !!token });

  try {
    let payload;
    if (token && token.split('.').length === 3) {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      logger.info("Google ID token verified successfully");
    } else {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);

      if (!response.ok) {
        logger.error("Failed to fetch Google user info", { status: response.status, statusText: response.statusText });
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      payload = await response.json();
      payload.sub = payload.id;
      logger.info("Google access token verified successfully");
    }

    const userId = payload.sub;
    const email = payload.email;
    const picture = payload.picture;
    const name = payload.name || "User";

    let user = await User.findOne({ googleId: userId });

    const isSubscribed = user ? user.isSubscribed : false;
    const isAdmin = user ? user.isAdmin : false;

    if (!user) {
      user = new User({
        googleId: userId,
        email,
        name,
        isSubscribed,
        isAdmin,
        createdAt: new Date(),
      });
      await user.save();
      logger.info("New user created", { userId, email, name });
    } else {
      logger.info("Existing user logged in", { userId, email });
    }

    const jwtToken = jwt.sign(
      {
        userId,
        name,
        email,
        picture,
        isSubscribed,
        isAdmin
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info("JWT token generated for user", { userId, email });

    res.status(200).json({
      user: { userId, email, picture, name, isSubscribed, isAdmin },
      token: jwtToken,
    });
  } catch (error) {
    logger.error("Google authentication failed", { error: error.message, stack: error.stack });

    if (error.message.includes('Wrong number of segments')) {
      res.status(400).json({
        error: "Invalid token format. Expected ID token or valid access token."
      });
    } else if (error.message.includes('Failed to fetch user info')) {
      res.status(401).json({
        error: "Invalid or expired access token."
      });
    } else {
      res.status(401).json({
        error: "Token verification failed.",
        details: error.message
      });
    }
  }
});

// Validate token (used by API Gateway)
app.post('/api/validate-token', (req, res) => {
const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token expired or invalid' });
    }

    try {
      // Return decoded token data in exact backend format
      // Backend returns the full decoded JWT payload as user object
      res.status(200).json({
        message: 'User verified',
        user: decoded
      });
    } catch (error) {
      logger.error('Token validation error', { error: error.message });
      res.status(401).json({ message: 'Token expired or invalid' });
    }
  });
});

// Who am I - EXACTLY like original backend
app.post('/api/whoami', (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    logger.warn("Whoami request without token");
    return res.status(400).json({ error: 'Token not found' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info("User identity verified", { userId: decoded.userId || decoded.id, email: decoded.email });

    res.status(200).json({
      message: "User verified",
      user: decoded,
    });
  } catch (error) {
    logger.error("Token verification failed in whoami", { error: error.message });
    res.status(401).json({
      message: "Token expired or invalid",
    });
  }
});

// Get user profile (protected)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.toPublicJSON()
    });

  } catch (error) {
    logger.error('Get profile error', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (protected)
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    logger.info('User profile updated', {
      userId: user._id
    });

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    logger.error('Update profile error', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find().select('-password');

    res.json({
      count: users.length,
      users: users.map(u => u.toPublicJSON())
    });

  } catch (error) {
    logger.error('Get users error', {
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all users - Compatible with old backend format
app.get('/api/admin/getAlluser', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');

    // Return in EXACT old backend format
    res.status(200).json({
      message: "All user",
      users: users
    });

  } catch (error) {
    logger.error('Get all users error', {
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete test users - Compatible with old backend format
app.delete('/api/admin/deleteTestUsers', authenticateToken, async (req, res) => {
  try {
    // Check for test users first
    const testUsers = await User.find({
      email: { $regex: /^testuser_/i }
    });

    if (testUsers.length === 0) {
      logger.info('No test users found to delete');
      return res.status(200).json({
        message: "No test users found",
        deletedCount: 0
      });
    }

    // Delete users with email starting with 'testuser_'
    const result = await User.deleteMany({
      email: { $regex: /^testuser_/i }
    });

    logger.info('Test users deleted', {
      deletedCount: result.deletedCount
    });

    // Return in EXACT old backend format
    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} test users`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    logger.error('Delete test users error', {
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get one user by username - Compatible with old backend format
app.get('/api/admin/getOneUserByUsername/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ name: username }).select('-password');

    if (!user) {
      logger.warn('User not found by username', { username });
      return res.status(500).json({ error: 'Failed to create user' });
    }

    logger.info('User found by username', { username, userId: user._id });

    // Return in EXACT old backend format
    res.status(200).json({
      message: "User found",
      user: user
    });

  } catch (error) {
    logger.error('Get user by username error', {
      error: error.message,
      username: req.params.username
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete one user by username - Compatible with old backend format
app.delete('/api/admin/deleteOneUserByUsername/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOneAndDelete({ name: username });

    if (!user) {
      logger.warn('User not found for deletion', { username });
      return res.status(500).json({ error: 'Failed to create user' });
    }

    logger.info('User deleted by username', {
      username,
      userId: user._id,
      deletedBy: req.user.email
    });

    // Return in EXACT old backend format
    res.status(200).json({
      message: "User found",
      user: user
    });

  } catch (error) {
    logger.error('Delete user by username error', {
      error: error.message,
      username: req.params.username
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Manage subscription - Compatible with old backend format
app.put('/api/admin/manageSubscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle subscription status
    user.isSubscribed = !user.isSubscribed;
    await user.save();

    logger.info('Subscription status toggled', {
      userId: user._id,
      newStatus: user.isSubscribed
    });

    // Return in EXACT old backend format
    res.status(200).json({
      message: `User ${user.isSubscribed ? "subscribed" : "unsubscribed"} successfully`,
      user: user
    });

  } catch (error) {
    logger.error('Manage subscription error', {
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
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
    logger.info(`Auth Service running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_auth_db'
    });
    console.log(`🔐 Auth Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Database: mmt_auth_db (Database-per-Service pattern)`);
  });
};

startServer();

module.exports = app;
