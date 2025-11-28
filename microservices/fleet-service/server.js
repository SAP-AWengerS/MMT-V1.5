const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const Truck = require('./models/Truck');
const DriverProfile = require('./models/Driver');

const app = express();
const PORT = process.env.PORT || 3002;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'fleet-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'fleet.log' })
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

// Database connection - Database-per-Service Pattern
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_fleet_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Fleet Service Database Connected', {
      database: 'mmt_fleet_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// ==================== TRUCK ROUTES (Exact Backend Logic) ====================

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'fleet-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
});

// Add Truck - Exact backend logic from backend/controllers/truck.js
app.post('/api/trucks', async (req, res) => {
    try {
        const { addedBy, registrationNo, make, model, isFinanced, financeAmount, year, imgURL, chassisNo, engineNo, desc } = req.body;
        logger.info("Adding new truck", { addedBy, registrationNo, make, model, isFinanced });

        const newTruck = new Truck({
            addedBy,
            registrationNo,
            make,
            model,
            year,
            isFinanced,
            financeAmount,
            imgURL,
            chassisNo,
            engineNo,
            desc,
        });

        const savedTruck = await newTruck.save();
        logger.info("Truck added successfully", { truckId: savedTruck._id, registrationNo: savedTruck.registrationNo });
        res.status(201).json(savedTruck);
    } catch (error) {
        logger.error('Error adding truck', { error: error.message, stack: error.stack });
        res.status(500).json({ message:'Failed to add truck', error: error.message });
    }
});

// Get Truck by ID - Exact backend logic
app.get('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        logger.info("Fetching truck by ID", { truckId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID provided", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        const truck = await Truck.findById(id);

        if (!truck) {
            logger.warn("Truck not found", { truckId: id });
            return res.status(404).json({ message: 'Truck not found' });
        }

        logger.info("Truck fetched successfully", { truckId: id, registrationNo: truck.registrationNo });
        res.status(200).json(truck);
    } catch (error) {
        logger.error('Error fetching truck by ID', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to fetch truck', error: error.message });
    }
});

// Get All Trucks by User - Exact backend logic
app.get('/api/trucks/user/:addedBy', async (req, res) => {
    try {
        const { addedBy } = req.params;
        logger.info("Fetching all trucks by user", { userId: addedBy });

        const trucks = await Truck.find({ addedBy });

        if (trucks.length === 0) {
            logger.warn("No trucks found for user", { userId: addedBy });
            return res.status(404).json({ message: 'No trucks found for this user' });
        }

        logger.info("Trucks fetched successfully", { userId: addedBy, count: trucks.length });
        res.status(200).json(trucks);
    } catch (error) {
        logger.error('Error fetching trucks by user', { userId: req.params.addedBy, error: error.message });
        res.status(500).json({ message: 'Failed to fetch trucks', error: error.message });
    }
});

// NEW: Alternative route for API Gateway compatibility
app.get('/api/trucks/by-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        logger.info("Fetching all trucks by user (new route)", { userId });

        const trucks = await Truck.find({ addedBy: userId });

        if (trucks.length === 0) {
            logger.warn("No trucks found for user", { userId });
            return res.status(404).json({ message: 'No trucks found for this user' });
        }

        logger.info("Trucks fetched successfully", { userId, count: trucks.length });
        res.status(200).json(trucks);
    } catch (error) {
        logger.error('Error fetching trucks by user', { userId: req.params.userId, error: error.message });
        res.status(500).json({ message: 'Failed to fetch trucks', error: error.message });
    }
});

// Update Truck by ID - Exact backend logic
app.put('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { registrationNo, make, model, year, imgURL, isFinanced, financeAmount, chassisNo, engineNo, desc } = req.body.values || req.body;
        logger.info("Updating truck", { truckId: id, registrationNo });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID for update", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        const updatedTruck = await Truck.findByIdAndUpdate(
            {_id:id},
            { registrationNo, make, model, year, isFinanced, financeAmount, imgURL, chassisNo, engineNo, desc },
            { new: true }
        );

        if (!updatedTruck) {
            logger.warn("Truck not found for update", { truckId: id });
            return res.status(404).json({ message: 'Truck not found' });
        }

        logger.info("Truck updated successfully", { truckId: id, registrationNo: updatedTruck.registrationNo });
        res.status(200).json(updatedTruck);
    } catch (error) {
        logger.error('Error updating truck', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to update truck', error: error.message });
    }
});

// Get All Trucks - Exact backend logic
app.get('/api/trucks', async (req, res) => {
    try {
        logger.info("Fetching all trucks");
        const trucks = await Truck.find();

        logger.info("All trucks fetched successfully", { count: trucks.length });
        res.status(200).json(trucks);
    } catch (error) {
        logger.error('Error fetching all trucks', { error: error.message });
        res.status(500).json({ message: 'Failed to fetch trucks', error: error.message });
    }
});

// Delete Truck by ID - Exact backend logic
app.delete('/api/trucks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        logger.info("Deleting truck", { truckId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn("Invalid truck ID for deletion", { truckId: id });
            return res.status(400).json({ message: 'Invalid truck ID' });
        }

        const deletedTruck = await Truck.findByIdAndDelete(id);

        if (!deletedTruck) {
            logger.warn("Truck not found for deletion", { truckId: id });
            return res.status(404).json({ message: 'Truck not found' });
        }

        logger.info("Truck deleted successfully", { truckId: id, registrationNo: deletedTruck.registrationNo });
        res.status(200).json({ message: 'Truck and associated expenses deleted' });
    } catch (error) {
        logger.error('Error deleting truck', { truckId: req.params.id, error: error.message });
        res.status(500).json({ message: 'Failed to delete truck', error: error.message });
    }
});

// ==================== DRIVER PROFILE ROUTES (Exact Backend Logic) ====================

// Add Driver Profile - Exact backend logic from backend/controllers/driverProfiles.js
app.post('/api/drivers', async (req, res) => {
    try {
        const { addedBy, name, contact, age, experience, license, gender, photo } = req.body;

        logger.info('Adding new driver profile', { addedBy, name, license, age });

        // Check if license number already exists
        const existingDriver = await DriverProfile.findOne({ license });
        if (existingDriver) {
            logger.warn('Driver creation failed - license already exists', { license });
            return res.status(400).json({
                success: false,
                message: "Driver with this license number already exists"
            });
        }

        const newDriver = new DriverProfile({
            addedBy,
            name,
            contact,
            age,
            experience,
            license,
            gender,
            photo: photo || '/driver.png'
        });

        const savedDriver = await newDriver.save();

        logger.info('Driver profile created successfully', {
            driverId: savedDriver._id,
            addedBy,
            name,
            license
        });

        res.status(201).json({
            success: true,
            message: 'Driver profile created successfully',
            data: savedDriver
        });
    } catch (error) {
        console.error('Error adding driver profile:', error);
        logger.error('Failed to add driver profile', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to add driver profile'
        });
    }
});

// Get Driver Profile by ID - Exact backend logic
app.get('/api/drivers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        logger.info('Fetching driver profile by ID', { driverId: id });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid driver profile ID', { driverId: id });
            return res.status(400).json({
                success: false,
                message: 'Invalid driver profile ID'
            });
        }

        const driver = await DriverProfile.findById(id);

        if (!driver) {
            logger.warn('Driver profile not found', { driverId: id });
            return res.status(404).json({
                success: false,
                message: 'Driver profile not found'
            });
        }

        logger.info('Driver profile retrieved successfully', { driverId: id, name: driver.name });

        res.status(200).json({
            success: true,
            message: 'Driver profile found',
            data: driver
        });
    } catch (error) {
        console.error('Error fetching driver profile by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver profile'
        });
    }
});

// (Keep old route for backward compatibility)
app.get('/api/driverProfiles/getAllDriverProfilesByUser/:addedBy', async (req, res) => {
    try {
        const { addedBy } = req.params;

        logger.info('Fetching driver profiles by user', { userId: addedBy });

        const drivers = await DriverProfile.find({
            addedBy,
            isActive: true
        }).sort({ createdAt: -1 });

        logger.info('Driver profiles retrieved successfully', { userId: addedBy, count: drivers.length });

        res.status(200).json({
            success: true,
            message: `Found ${drivers.length} driver profiles`,
            data: drivers,
            count: drivers.length
        });
    } catch (error) {
        console.error('Error fetching driver profiles by user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver profiles'
        });
    }
});

// NEW: Alternative route for API Gateway compatibility
app.get('/api/drivers/by-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        logger.info('Fetching driver profiles by user (new route)', { userId });

        const drivers = await DriverProfile.find({
            addedBy: userId,
            isActive: true
        }).sort({ createdAt: -1 });

        logger.info('Driver profiles retrieved successfully', { userId, count: drivers.length });

        res.status(200).json({
            success: true,
            message: `Found ${drivers.length} driver profiles`,
            data: drivers,
            count: drivers.length
        });
    } catch (error) {
        console.error('Error fetching driver profiles by user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver profiles'
        });
    }
});

// Get All Driver Profiles (admin) - Exact backend logic
app.get('/api/drivers', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', isActive } = req.query;

        logger.info('Fetching all driver profiles (admin)', { page, limit, search, isActive });

        // Build search query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { license: { $regex: search, $options: 'i' } },
                { contact: { $regex: search, $options: 'i' } }
            ];
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const drivers = await DriverProfile.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DriverProfile.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Driver profiles retrieved successfully',
            data: drivers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCount: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all driver profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver profiles'
        });
    }
});

// Update Driver Profile by ID - Exact backend logic
app.put('/api/drivers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact, age, experience, license, gender, photo } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver profile ID'
            });
        }

        // Check if license number already exists for another driver
        if (license) {
            const existingDriver = await DriverProfile.findOne({
                license,
                _id: { $ne: id }
            });
            if (existingDriver) {
                return res.status(400).json({
                    success: false,
                    message: "Another driver with this license number already exists"
                });
            }
        }

        const updatedDriver = await DriverProfile.findByIdAndUpdate(
            id,
            { name, contact, age, experience, license, gender, photo },
            { new: true, runValidators: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({
                success: false,
                message: 'Driver profile not found'
            });
        }

        logger.info(`Driver profile updated`, {
            driverId: id,
            name: updatedDriver.name,
            license: updatedDriver.license
        });

        res.status(200).json({
            success: true,
            message: 'Driver profile updated successfully',
            data: updatedDriver
        });
    } catch (error) {
        console.error('Error updating driver profile:', error);
        logger.error(`Failed to update driver profile`, {
            driverId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update driver profile'
        });
    }
});

// Soft Delete Driver Profile by ID - Exact backend logic
app.delete('/api/drivers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver profile ID'
            });
        }

        const deletedDriver = await DriverProfile.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!deletedDriver) {
            return res.status(404).json({
                success: false,
                message: 'Driver profile not found'
            });
        }

        logger.info(`Driver profile soft deleted`, {
            driverId: id,
            name: deletedDriver.name,
            license: deletedDriver.license
        });

        res.status(200).json({
            success: true,
            message: 'Driver profile deleted successfully',
            data: deletedDriver
        });
    } catch (error) {
        console.error('Error deleting driver profile:', error);
        logger.error(`Failed to delete driver profile`, {
            driverId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to delete driver profile'
        });
    }
});

// Get Driver Statistics by User - Exact backend logic
app.get('/api/drivers/stats/:addedBy', async (req, res) => {
    try {
        const { addedBy } = req.params;

        const stats = await DriverProfile.aggregate([
            { $match: { addedBy } },
            {
                $group: {
                    _id: null,
                    totalDrivers: { $sum: 1 },
                    activeDrivers: {
                        $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                    },
                    inactiveDrivers: {
                        $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
                    },
                    avgAge: { $avg: "$age" },
                    maleCount: {
                        $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] }
                    },
                    femaleCount: {
                        $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] }
                    },
                    otherCount: {
                        $sum: { $cond: [{ $eq: ["$gender", "Other"] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalDrivers: 0,
            activeDrivers: 0,
            inactiveDrivers: 0,
            avgAge: 0,
            maleCount: 0,
            femaleCount: 0,
            otherCount: 0
        };

        res.status(200).json({
            success: true,
            message: 'Driver statistics retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error fetching driver statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver statistics'
        });
    }
});

// ==================== gRPC SERVER (For Analytics Service Communication) ====================

// Load proto file
const PROTO_PATH = path.join(__dirname, 'fleet.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const fleetProto = grpc.loadPackageDefinition(packageDefinition).fleet;

// gRPC service implementation (using backend field names)
const grpcServiceImpl = {
  GetTrucks: async (call, callback) => {
    try {
      const { userId, status, limit, skip } = call.request;
      const filter = {};

      // Support both userId and addedBy for compatibility
      if (userId) filter.addedBy = userId;
      if (status) filter.status = status;

      const trucks = await Truck.find(filter)
        .limit(limit || 100)
        .skip(skip || 0);

      const total = await Truck.countDocuments(filter);

      const truckList = trucks.map(truck => ({
        id: truck._id.toString(),
        userId: truck.addedBy,
        registrationNo: truck.registrationNo,
        make: truck.make,
        model: truck.model,
        year: truck.year ? truck.year.toString() : '',
        isFinanced: truck.isFinanced || false,
        financeAmount: truck.financeAmount || 0,
        createdAt: truck.createdAt.toISOString()
      }));

      logger.info('gRPC: GetTrucks called', { count: trucks.length });

      callback(null, { trucks: truckList, total });
    } catch (error) {
      logger.error('gRPC: GetTrucks error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetTruckById: async (call, callback) => {
    try {
      const truck = await Truck.findById(call.request.id);

      if (!truck) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: 'Truck not found'
        });
      }

      const truckData = {
        id: truck._id.toString(),
        userId: truck.addedBy,
        registrationNo: truck.registrationNo,
        make: truck.make,
        model: truck.model,
        year: truck.year ? truck.year.toString() : '',
        isFinanced: truck.isFinanced || false,
        financeAmount: truck.financeAmount || 0,
        createdAt: truck.createdAt.toISOString()
      };

      logger.info('gRPC: GetTruckById called', { truckId: truck._id });

      callback(null, truckData);
    } catch (error) {
      logger.error('gRPC: GetTruckById error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetDrivers: async (call, callback) => {
    try {
      const { userId, available, limit, skip } = call.request;
      const filter = {};

      // Support both userId and addedBy for compatibility
      if (userId) filter.addedBy = userId;
      if (available !== undefined) filter.isActive = available;

      const drivers = await DriverProfile.find(filter)
        .limit(limit || 100)
        .skip(skip || 0);

      const total = await DriverProfile.countDocuments(filter);

      const driverList = drivers.map(driver => ({
        id: driver._id.toString(),
        userId: driver.addedBy,
        name: driver.name,
        licenseNumber: driver.license,
        phone: driver.contact,
        email: driver.email || '',
        available: driver.isActive,
        createdAt: driver.createdAt.toISOString()
      }));

      logger.info('gRPC: GetDrivers called', { count: drivers.length });

      callback(null, { drivers: driverList, total });
    } catch (error) {
      logger.error('gRPC: GetDrivers error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetDriverById: async (call, callback) => {
    try {
      const driver = await DriverProfile.findById(call.request.id);

      if (!driver) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: 'Driver not found'
        });
      }

      const driverData = {
        id: driver._id.toString(),
        userId: driver.addedBy,
        name: driver.name,
        licenseNumber: driver.license,
        phone: driver.contact,
        email: driver.email || '',
        available: driver.isActive,
        createdAt: driver.createdAt.toISOString()
      };

      logger.info('gRPC: GetDriverById called', { driverId: driver._id });

      callback(null, driverData);
    } catch (error) {
      logger.error('gRPC: GetDriverById error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  StreamTruckStatus: (call) => {
    logger.info('gRPC: StreamTruckStatus - streaming started');

    // Simulate streaming truck status updates
    const interval = setInterval(() => {
      const status = {
        truckId: call.request.id,
        status: 'active',
        location: 'Highway 101, Mile ' + Math.floor(Math.random() * 100),
        fuelLevel: Math.random() * 100,
        timestamp: new Date().toISOString()
      };

      call.write(status);
    }, 3000);

    call.on('cancelled', () => {
      clearInterval(interval);
      logger.info('gRPC: StreamTruckStatus - client cancelled');
    });
  }
};

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

// Start servers
const startServers = async () => {
  await connectDB();

  // Start REST API server
  app.listen(PORT, () => {
    logger.info(`Fleet Service REST API running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_fleet_db'
    });
    console.log(`🚛 Fleet Service REST API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Database: mmt_fleet_db (Database-per-Service pattern)`);
  });

  // Start gRPC server
  const grpcServer = new grpc.Server();
  grpcServer.addService(fleetProto.FleetService.service, grpcServiceImpl);

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        logger.error('gRPC server failed to start', { error: error.message });
        return;
      }

      logger.info(`Fleet Service gRPC server running on port ${port}`);
      console.log(`🔌 Fleet Service gRPC server running on port ${port}`);
    }
  );
};

startServers();

module.exports = app;
