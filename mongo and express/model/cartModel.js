// Importing the Mongoose library
const mongoose = require('mongoose');

// Defining the schema for the 'cartModel' collection
const cartSchema = new mongoose.Schema({
    // Unique identifier for the cart item
    id: {
        type: String,
        // The id field is required
        required: true,
        // Ensures each cart item has a unique identifier
        unique: true,      
    },
    // Quantity of a particular product in the cart
    quantity: {
        type: Number,
        // The quantity field is required
        required: true,     
    },
    // Total price for the quantity of the product in the cart
    price: {
        type: Number,
        // The price field is required
        required: true,     
    },
});

// Creating the Mongoose model named 'Cart' based on the defined schema
const Cart = mongoose.model('cartModel', cartSchema);

// Exporting the Cart model to be used in other parts of the application
module.exports = Cart;
