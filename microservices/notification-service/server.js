const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const Alert = require('./models/Alert');

const app = express();
const PORT = process.env.PORT || 3005;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'notification-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'notification.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Database connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_notifications_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Notification Service Database Connected', {
      database: 'mmt_notifications_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// ==================== ALERT ROUTES (Exact Backend Logic) ====================

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'notification-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
});

// Add a new alert - Exact backend logic from backend/controllers/alerts.js
app.post('/api/alerts', async (req, res) => {
    try {
        const { addedBy, title, description, alertDate, type, priority, truckId, driverId, isRecurring, recurringType } = req.body;

        logger.info('Creating new alert', {
            addedBy,
            title,
            type,
            priority,
            truckId,
            driverId,
            isRecurring,
            recurringType
        });

        const newAlert = new Alert({
            addedBy,
            title,
            description,
            alertDate: new Date(alertDate),
            type,
            priority,
            truckId,
            driverId,
            isRecurring: isRecurring || false,
            recurringType: recurringType || 'none'
        });

        const savedAlert = await newAlert.save();

        logger.info('Alert created successfully', {
            alertId: savedAlert._id,
            addedBy,
            title: savedAlert.title,
            type: savedAlert.type,
            priority: savedAlert.priority,
            isRecurring: savedAlert.isRecurring
        });

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: savedAlert
        });
    } catch (error) {
        console.error('Error adding alert:', error);
        logger.error('Failed to create alert', {
            error: error.message,
            stack: error.stack
        });
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: Object.values(error.errors)[0].message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to add alert'
        });
    }
});

// Get alert by ID - Exact backend logic
app.get('/api/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        logger.info('Fetching alert by ID', { alertId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID provided', { alertId: id });
            return res.status(400).json({
                success: false,
                message: 'Invalid alert ID'
            });
        }

        const alert = await Alert.findById(id);

        if (!alert) {
            logger.warn('Alert not found', { alertId: id });
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        logger.info('Alert retrieved successfully', {
            alertId: id,
            title: alert.title,
            type: alert.type
        });

        res.status(200).json({
            success: true,
            message: 'Alert found',
            data: alert
        });
    } catch (error) {
        console.error('Error fetching alert by ID:', error);
        logger.error('Failed to fetch alert by ID', {
            error: error.message,
            alertId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alert'
        });
    }
});

// Get all alerts by user - Exact backend logic
app.get('/api/alerts/by-user/:addedBy', async (req, res) => {
    try {
        const { addedBy } = req.params;
        const {
            isRead,
            type,
            priority,
            page = 1,
            limit = 20,
            sortBy = 'alertDate',
            sortOrder = 'asc',
            dateFilter
        } = req.query;

        logger.info('Fetching alerts by user', {
            addedBy,
            filters: { isRead, type, priority, dateFilter },
            page,
            limit
        });

        // Build query - use addedBy to match backend
        let query = { addedBy, isActive: true };

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        // Date filters
        if (dateFilter) {
            const now = new Date();
            switch (dateFilter) {
                case 'overdue':
                    query.alertDate = { $lt: now };
                    query.isRead = false;
                    break;
                case 'today':
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    query.alertDate = { $gte: startOfDay, $lt: endOfDay };
                    break;
                case 'upcoming':
                    query.alertDate = { $gte: now };
                    break;
                case 'week':
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    query.alertDate = { $gte: now, $lte: weekFromNow };
                    break;
            }
        }

        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Add secondary sort by priority and creation date
        if (sortBy !== 'priority') {
            sortConfig.priority = -1;
        }
        if (sortBy !== 'createdAt') {
            sortConfig.createdAt = -1;
        }

        const alerts = await Alert.find(query)
            .sort(sortConfig)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Alert.countDocuments(query);

        // Get statistics
        const stats = await Alert.aggregate([
            { $match: { addedBy, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalAlerts: { $sum: 1 },
                    unreadAlerts: {
                        $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
                    },
                    overdueAlerts: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lt: ["$alertDate", new Date()] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    urgentAlerts: {
                        $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
                    },
                    highAlerts: {
                        $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] }
                    }
                }
            }
        ]);

        logger.info('Alerts fetched successfully', {
            addedBy,
            count: alerts.length,
            total,
            page
        });

        res.status(200).json({
            success: true,
            message: `Found ${alerts.length} alerts`,
            data: alerts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCount: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            statistics: stats[0] || {
                totalAlerts: 0,
                unreadAlerts: 0,
                overdueAlerts: 0,
                urgentAlerts: 0,
                highAlerts: 0
            }
        });
    } catch (error) {
        console.error('Error fetching alerts by user:', error);
        logger.error('Failed to fetch alerts by user', {
            error: error.message,
            addedBy: req.params.addedBy
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts'
        });
    }
});

// Get all alerts (admin only) - Exact backend logic
app.get('/api/alerts', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', type, priority } = req.query;

        logger.info('Fetching all alerts (admin)', {
            filters: { search, type, priority },
            page,
            limit
        });

        let query = { isActive: true };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        const alerts = await Alert.find(query)
            .sort({ alertDate: 1, priority: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Alert.countDocuments(query);

        logger.info('All alerts fetched successfully', {
            count: alerts.length,
            total,
            page
        });

        res.status(200).json({
            success: true,
            message: 'Alerts retrieved successfully',
            data: alerts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCount: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all alerts:', error);
        logger.error('Failed to fetch all alerts', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts'
        });
    }
});

// Update alert by ID - Exact backend logic
app.put('/api/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, alertDate, type, priority, truckId, driverId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for update', { alertId: id });
            return res.status(400).json({
                success: false,
                message: 'Invalid alert ID'
            });
        }

        logger.info('Updating alert', {
            alertId: id,
            updates: { title, type, priority, truckId, driverId }
        });

        const updateData = { title, description, type, priority, truckId, driverId };

        if (alertDate) {
            const newAlertDate = new Date(alertDate);
            if (newAlertDate < new Date()) {
                logger.warn('Attempt to set past alert date', {
                    alertId: id,
                    alertDate: newAlertDate
                });
                return res.status(400).json({
                    success: false,
                    message: 'Alert date cannot be in the past'
                });
            }
            updateData.alertDate = newAlertDate;
        }

        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedAlert) {
            logger.warn('Alert not found for update', { alertId: id });
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        logger.info('Alert updated successfully', {
            alertId: id,
            title: updatedAlert.title,
            type: updatedAlert.type,
            priority: updatedAlert.priority
        });

        res.status(200).json({
            success: true,
            message: 'Alert updated successfully',
            data: updatedAlert
        });
    } catch (error) {
        console.error('Error updating alert:', error);
        logger.error('Failed to update alert', {
            error: error.message,
            alertId: req.params.id,
            updates: req.body
        });
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: Object.values(error.errors)[0].message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update alert'
        });
    }
});

// Mark alert as read - Exact backend logic
app.put('/api/alerts/mark-read/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { isRead = true } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for read status update', { alertId: id });
            return res.status(400).json({
                success: false,
                message: 'Invalid alert ID'
            });
        }

        logger.info('Marking alert as read/unread', {
            alertId: id,
            isRead
        });

        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            { isRead: Boolean(isRead) },
            { new: true }
        );

        if (!updatedAlert) {
            logger.warn('Alert not found for read status update', { alertId: id });
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        logger.info('Alert read status updated successfully', {
            alertId: id,
            isRead,
            title: updatedAlert.title
        });

        res.status(200).json({
            success: true,
            message: `Alert marked as ${isRead ? 'read' : 'unread'}`,
            data: updatedAlert
        });
    } catch (error) {
        console.error('Error marking alert:', error);
        logger.error('Failed to update alert read status', {
            error: error.message,
            alertId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update alert status'
        });
    }
});

// Mark recurring alert as done - Exact backend logic
app.put('/api/alerts/mark-done/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for recurring completion', { alertId: id });
            return res.status(400).json({
                success: false,
                message: 'Invalid alert ID'
            });
        }

        logger.info('Marking recurring alert as done', { alertId: id });

        const alert = await Alert.findById(id);

        if (!alert) {
            logger.warn('Alert not found for recurring completion', { alertId: id });
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        if (!alert.isRecurring || alert.recurringType === 'none') {
            logger.warn('Alert is not recurring', { alertId: id });
            return res.status(400).json({
                success: false,
                message: 'Alert is not a recurring alert'
            });
        }

        // Calculate next occurrence date based on recurring type
        let nextAlertDate = new Date(alert.alertDate);

        if (alert.recurringType === 'monthly') {
            // Add one month to the current alert date
            nextAlertDate.setMonth(nextAlertDate.getMonth() + 1);
        }

        // Update the existing alert with new date and reset read status
        alert.alertDate = nextAlertDate;
        alert.isRead = false;
        alert.lastRecurredDate = new Date();

        const updatedAlert = await alert.save();

        logger.info('Recurring alert updated with next occurrence date', {
            alertId: id,
            nextAlertDate: nextAlertDate,
            recurringType: alert.recurringType
        });

        res.status(200).json({
            success: true,
            message: 'Recurring alert updated with next occurrence date.',
            data: updatedAlert
        });
    } catch (error) {
        console.error('Error marking recurring alert as done:', error);
        logger.error('Failed to mark recurring alert as done', {
            error: error.message,
            alertId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to process recurring alert'
        });
    }
});

// Soft delete alert by ID - Exact backend logic
app.delete('/api/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for deletion', { alertId: id });
            return res.status(400).json({
                success: false,
                message: 'Invalid alert ID'
            });
        }

        logger.info('Soft deleting alert', { alertId: id });

        const deletedAlert = await Alert.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!deletedAlert) {
            logger.warn('Alert not found for deletion', { alertId: id });
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        logger.info('Alert soft deleted successfully', {
            alertId: id,
            title: deletedAlert.title,
            type: deletedAlert.type
        });

        res.status(200).json({
            success: true,
            message: 'Alert deleted successfully',
            data: deletedAlert
        });
    } catch (error) {
        console.error('Error deleting alert:', error);
        logger.error('Failed to delete alert', {
            error: error.message,
            alertId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to delete alert'
        });
    }
});

// Get alerts summary - Exact backend logic
app.get('/api/alerts/summary/:addedBy', async (req, res) => {
    try {
        const { addedBy } = req.params;
        const now = new Date();

        logger.info('Fetching alerts summary', { addedBy });

        const summary = await Alert.aggregate([
            { $match: { addedBy, isActive: true } },
            {
                $facet: {
                    counts: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
                                overdue: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $lt: ["$alertDate", now] },
                                                    { $eq: ["$isRead", false] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                dueToday: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $gte: ["$alertDate", new Date(now.getFullYear(), now.getMonth(), now.getDate())] },
                                                    { $lt: ["$alertDate", new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    byType: [
                        { $group: { _id: "$type", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    byPriority: [
                        { $group: { _id: "$priority", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    upcoming: [
                        { $match: { alertDate: { $gte: now }, isRead: false } },
                        { $sort: { alertDate: 1 } },
                        { $limit: 5 }
                    ]
                }
            }
        ]);

        const result = summary[0];

        logger.info('Alerts summary fetched successfully', {
            addedBy,
            total: result.counts[0]?.total || 0,
            unread: result.counts[0]?.unread || 0,
            overdue: result.counts[0]?.overdue || 0
        });

        res.status(200).json({
            success: true,
            message: 'Alerts summary retrieved successfully',
            data: {
                counts: result.counts[0] || { total: 0, unread: 0, overdue: 0, dueToday: 0 },
                byType: result.byType,
                byPriority: result.byPriority,
                upcoming: result.upcoming
            }
        });
    } catch (error) {
        console.error('Error fetching alerts summary:', error);
        logger.error('Failed to fetch alerts summary', {
            error: error.message,
            addedBy: req.params.addedBy
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts summary'
        });
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
    logger.info(`Notification Service running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_notifications_db'
    });
    console.log(`🔔 Notification Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Database: mmt_notifications_db (Database-per-Service pattern)`);
  });
};

startServer();

module.exports = app;
