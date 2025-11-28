const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    addedBy: {
        type: String,
        ref: 'User',
        required: [true, "User ID is required"],
    },
    title: {
        type: String,
        required: [true, "Alert title is required"],
        trim: true,
        maxLength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: false,
        trim: true,
        maxLength: [500, "Description cannot exceed 500 characters"]
    },
    alertDate: {
        type: Date,
        required: [true, "Alert date is required"]
    },
    type: {
        type: String,
        required: [true, "Alert type is required"],
        enum: {
            values: ['maintenance', 'delivery', 'license', 'insurance', 'inspection', 'fuel', 'payment', 'other'],
            message: "Invalid alert type"
        },
        default: 'other'
    },
    priority: {
        type: String,
        required: [true, "Alert priority is required"],
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: "Invalid priority level"
        },
        default: 'medium'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    truckId: {
        type: String,
        ref: 'Truck',
        required: false
    },
    driverId: {
        type: String,
        ref: 'DriverProfile',
        required: false
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringType: {
        type: String,
        enum: {
            values: ['none', 'monthly'],
            message: "Invalid recurring type"
        },
        default: 'none'
    },
    recurringDayOfMonth: {
        type: Number,
        min: [1, "Day of month must be between 1 and 31"],
        max: [31, "Day of month must be between 1 and 31"],
        required: false
    },
    lastRecurredDate: {
        type: Date,
        required: false
    },
    parentAlertId: {
        type: String,
        ref: 'Alert',
        required: false
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

// Indexes for better query performance
AlertSchema.index({ addedBy: 1, alertDate: 1 });
AlertSchema.index({ addedBy: 1, isRead: 1 });
AlertSchema.index({ addedBy: 1, priority: 1 });
AlertSchema.index({ alertDate: 1, isActive: 1 });

// Update the updatedAt field before saving
AlertSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

// Virtual field to check if alert is overdue
AlertSchema.virtual('isOverdue').get(function() {
    return this.alertDate < new Date() && !this.isRead;
});

// Virtual field to check if alert is due today
AlertSchema.virtual('isDueToday').get(function() {
    const today = new Date();
    const alertDate = new Date(this.alertDate);
    return (
        alertDate.getDate() === today.getDate() &&
        alertDate.getMonth() === today.getMonth() &&
        alertDate.getFullYear() === today.getFullYear()
    );
});

// Virtual field to check if alert is due soon (within 24 hours)
AlertSchema.virtual('isDueSoon').get(function() {
    const now = new Date();
    const timeDiff = this.alertDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff <= 24 && hoursDiff > 0;
});

module.exports = mongoose.model('Alert', AlertSchema);
