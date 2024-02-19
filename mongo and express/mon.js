const express = require('express');
const app = express();
require("./mongo");

const product = require('./model/productModel');
const cart = require('./model/cartModel');
const order = require('./model/orderModel');
app.use(express.json());



app.get('/search_all', async (req, res) => {
    try {
        const allProducts = await product.find();
        if (allProducts.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }
        res.json(allProducts);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/search_product_by_id', async (req, res) => {
    try {
        const productId = req.query.id;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required in the query parameters' });
        }
        const foundProduct = await product.findOne({ id: productId });
        if (!foundProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(foundProduct);
    } catch (error) {
        console.error('Error retrieving product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/checkout', async (req, res) => {
    try {
        const { id, quantity } = req.body;
        if (!id || !quantity) {
            return res.status(400).json({ error: 'Both product ID and quantity are required in the request body' });
        }
        const foundProduct = await product.findOne({ id: id });
        if (!foundProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (quantity > foundProduct.stock) {
            return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
        }
        const existingCartItem = await cart.findOne({ id: id });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            existingCartItem.price += foundProduct.price * quantity;
            await existingCartItem.save();
        } else {
            const newCartItem = new cart({ id: id, quantity: quantity, price: foundProduct.price * quantity });
            await newCartItem.save();
        }
        res.json({ message: 'Item added to the cart successfully' });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/order', async (req, res) => {
    try {
        const { id, date, address } = req.body;
        if (!id || !date || !address) {
            return res.status(400).json({ error: 'All parameters (id, date, address) are required in the request body' });
        }
        const cartItems = await cart.find();
        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Add items to the cart before placing an order.' });
        }
        const totalCost = cartItems.reduce((total, item) => {
            return total + item.price;
        }, 0);
        const newOrder = new order({ id: id, date: new Date(date), address: address, status: 'Pending', totalCost: totalCost });
        await newOrder.save();
        res.json({ message: 'Order placed successfully' });
        await cart.deleteMany();
    } catch (error) {
        console.error('Error during order creation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/order_placed', async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            return res.status(400).json({ error: 'Both orderId and status are required in the request body' });
        }
        const foundOrder = await order.findOne({ id: id });
        if (!foundOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        foundOrder.status = status;
        await foundOrder.save();
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/delete_order', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ error: 'id parameter is required in the query parameters' });
        }
        const deleteResult = await order.deleteOne({ id: id });
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/delete_product', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ error: 'id parameter is required in the query parameters' });
        }
        const deleteResult = await product.deleteOne({ id: id });
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3001');
});

module.exports = app;
