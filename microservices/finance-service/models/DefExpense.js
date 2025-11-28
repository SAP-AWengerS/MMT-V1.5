const mongoose = require("mongoose");

const defExpenseSchema = new mongoose.Schema({
  truckId: {
    type: String,
    ref: "Truck",
    required: [true, "Truck ID is required"],
  },
  addedBy: {
    type: String,
    required: [true, "User Id not recieved"],
  },
  date: {
    type: Date,
    required: [true, "Please choose the date"],
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  currentKM: {
    type: Number,
    required: [true, "Please enter the current KM"],
  },
  litres: {
    type: Number,
    required: [true, "Please enter the litres of def filled"],
  },
  cost: {
    type: Number,
    required: [true, "Please enter the cost of def"],
  },
  note: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("DefExpense", defExpenseSchema);
