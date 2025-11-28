const mongoose = require('mongoose');

const FuelExpenseSchema = new mongoose.Schema({
    truckId: {
        type: String,
        ref: 'Truck',
        required: [true, "Truck ID is required"],
    },
    addedBy: {
        type: String,
        required: [true, "User Id not recieved"],
      },
    date: {
        type: Date,
        required: [true, "Date of fuel filling is required"],
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
      },
    currentKM: {
        type: Number,
        required: [true, "Current kilometers is required"],
    },
    litres: {
        type: Number,
        required: [true, "Amount of fuel filled is required"],
    },
    cost: {
        type: Number,
        required: [true, "Cost of the fuel is required"],
    },
    note: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('FuelExpense', FuelExpenseSchema);
