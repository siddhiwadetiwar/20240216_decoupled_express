// Importing the mongoose library
const mongoose = require('mongoose');

// Defining a mongoose schema for the 'product' collection
const productSchema = new mongoose.Schema({

    // Unique identifier for the product, of type String, and is required
    id: {
        type: String,
        required: true,
        unique: true,
    },

    // Name of the product, of type String, and is required
    name: {
        type: String,
        required: true,
    },

    // Description of the product, of type String, and is required
    description: {
        type: String,
        required: true,
    },

    // Price of the product, of type Number, and is required
    price: {
        type: Number,
        required: true,
    },

    // Stock quantity of the product, of type Number, and is required
    stock: {
        type: Number,
        required: true,
    },

    // URL of the product image, of type String, and is required
    imageUrl: {
        type: String,
        required: true,
    },
});

// Creating a mongoose model named 'Product' based on the defined schema
const Product = mongoose.model('productModel', productSchema);

// Exporting the 'Product' model to be used in other files
module.exports = Product;
