// Importing the mongoose library
const mongoose = require('mongoose');

// Defining a mongoose schema for the 'order' collection
const orderSchema = new mongoose.Schema({

    // Unique identifier for the order, of type String, and is required
    id: {
        type: String,
        required: true,
        unique: true,
    },

    // Date of the order, of type Date, and is required
    date: {
        type: Date,
        required: true,
    },

    // Shipping address for the order, of type String, and is required
    address: {
        type: String,
        required: true,
    },

    // Status of the order, of type String, with predefined values using enum
    // Default value is 'Pending', and it is required
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
        default: 'Pending',
        required: true,
    },

    // Total cost of the order, of type Number, and is required
    totalCost: {
        type: Number,
        required: true,
    },
});

// Creating a mongoose model named 'Order' based on the defined schema
const Order = mongoose.model('orderModel', orderSchema);

// Exporting the 'Order' model to be used in other files
module.exports = Order;
