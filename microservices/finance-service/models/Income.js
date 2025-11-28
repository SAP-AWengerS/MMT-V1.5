const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
    truckId: {
        type: String,
        ref: 'Truck',
        required: [true, "Truck ID is required"],
        index: true
    },
    addedBy: {
        type: String,
        required: [true, "User Id not received"],
        index: true
    },
    date: {
        type: Date,
        required: [true, "Date of income is required"],
        index: true
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
    },
    amount: {
        type: Number,
        required: [true, "Income amount is required"],
        min: 0
    },
    source: {
        type: String,
        required: false,  // Made optional to match usage
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Income', IncomeSchema);
