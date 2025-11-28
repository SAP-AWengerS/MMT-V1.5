const mongoose = require("mongoose");

const otherExpenseSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: [true, "Please select a category"],
  },
  other: {
    type: String,
  },
  cost: {
    type: Number,
    required: [true, "Please enter the cost"],
  },
  note: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("OtherExpense", otherExpenseSchema);
