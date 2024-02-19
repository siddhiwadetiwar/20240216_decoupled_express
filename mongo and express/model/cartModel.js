const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
});

const Cart = mongoose.model('cartModel', cartSchema);

module.exports = Cart;