const mongoose = require('mongoose');

const DriverProfileSchema = new mongoose.Schema({
    addedBy: {
        type: String,
        ref: 'User',
        required: [true, "User ID is required"],
        trim: true,
        minlength: [3, "User ID must be at least 3 characters"],
        maxlength: [50, "User ID cannot exceed 50 characters"]
    },
    name: {
        type: String,
        required: [true, "Driver name is required"],
        trim: true,
        minlength: [2, "Driver name must be at least 2 characters"],
        maxlength: [50, "Driver name cannot exceed 50 characters"]
    },
    contact: {
        type: String,
        required: [true, "Contact number is required"],
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: "Contact number must be exactly 10 digits"
        }
    },
    age: {
        type: Number,
        min: [18, "Driver must be at least 18 years old"],
        max: [70, "Driver cannot be older than 70 years"]
    },
    experience: {
        type: String,
        trim: true,
        maxlength: [50, "Experience cannot exceed 50 characters"]
    },
    license: {
        type: String,
        required: [true, "License number is required"],
        trim: true,
        minlength: [5, "License number must be at least 5 characters"],
        maxlength: [20, "License number cannot exceed 20 characters"]
    },
    gender: {
        type: String,
        required: [true, "Gender is required"],
        enum: ['Male', 'Female', 'Other'],
    },
    photo: {
        type: String,
        default: '/driver.png',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
    },
    updatedAt: {
        type: Date,
        default: () => new Date(),
    }
});

// Update the updatedAt field before saving
DriverProfileSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('DriverProfile', DriverProfileSchema);
