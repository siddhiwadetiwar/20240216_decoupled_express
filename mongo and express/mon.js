// Importing the Express framework
const express = require('express');
const app = express();
// Importing MongoDB configuration
require("./mongo");

// Importing models
const product = require('./model/productModel');
const cart = require('./model/cartModel');
const order = require('./model/orderModel');

// Middleware to parse incoming JSON requests
app.use(express.json());

// Connecting to MongoDB
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://siddhiwadetiwar:root@cluster0.v2wphpr.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log("Connected"))

// Endpoint to create a new product
app.post('/create_product', async (req, res) => {
    try {
        // Extracting product details from the request body
        const { name, description, price, stock, imageUrl, id } = req.body;

        // Handling case where any required field is missing
        if (!name || !description || !price || !stock || !imageUrl || !id) {
            return res.status(400).json({ error: 'All parameters (name, description, price, stock, imageUrl, id) are required in the request body' });
        }

        // Creating a new product in the database
        const newProduct = new product({
            name: name,
            description: description,
            price: price,
            stock: stock,
            imageUrl: imageUrl,
            id: id
        });

        await newProduct.save();

        // Sending success message in the response
        res.json({ message: 'Product created successfully', createdProduct: newProduct });
    } catch (error) {
        // Handling server error
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Endpoint to search for all products
app.get('/search_all', async (req, res) => {
    try {
        // Retrieving all products from the database
        const allProducts = await product.find();
        // Handling case where no products are found
        if (allProducts.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }
        // Sending the list of products in the response
        res.json(allProducts);
    } catch (error) {
        // Handling server error
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to search for a product by ID
app.get('/search_product_by_id', async (req, res) => {
    try {
        // Extracting product ID from query parameters
        const productId = req.query.id;
        // Handling case where product ID is missing
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required in the query parameters' });
        }
        // Finding a product by ID in the database
        const foundProduct = await product.findOne({ id: productId });
        // Handling case where the product is not found
        if (!foundProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Sending the found product in the response
        res.json(foundProduct);
    } catch (error) {
        // Handling server error
        console.error('Error retrieving product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint for the checkout process
app.post('/checkout', async (req, res) => {
    try {
        // Extracting product ID and quantity from the request body
        const { id, quantity } = req.body;
        // Handling case where either product ID or quantity is missing
        if (!id || !quantity) {
            return res.status(400).json({ error: 'Both product ID and quantity are required in the request body' });
        }
        // Finding the product in the database by ID
        const foundProduct = await product.findOne({ id: id });
        // Handling case where the product is not found
        if (!foundProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Checking if the requested quantity exceeds available stock
        if (quantity > foundProduct.stock) {
            return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
        }
        // Finding or creating a cart item based on the product ID
        const existingCartItem = await cart.findOne({ id: id });
        if (existingCartItem) {
            // Updating the existing cart item
            existingCartItem.quantity += quantity;
            existingCartItem.price += foundProduct.price * quantity;
            await existingCartItem.save();
        } else {
            // Creating a new cart item
            const newCartItem = new cart({ id: id, quantity: quantity, price: foundProduct.price * quantity });
            await newCartItem.save();
        }
        // Sending success message in the response
        res.json({ message: 'Item added to the cart successfully' });
    } catch (error) {
        // Handling server error
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint for placing an order
app.post('/order', async (req, res) => {
    try {
        // Extracting order details from the request body
        const { id, date, address } = req.body;
        // Handling case where either order ID, date, or address is missing
        if (!id || !date || !address) {
            return res.status(400).json({ error: 'All parameters (id, date, address) are required in the request body' });
        }
        // Finding all cart items in the database
        const cartItems = await cart.find();
        // Handling case where the cart is empty
        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Add items to the cart before placing an order.' });
        }
        // Calculating the total cost of the order
        const totalCost = cartItems.reduce((total, item) => {
            return total + item.price;
        }, 0);
        // Creating a new order in the database
        const newOrder = new order({ id: id, date: new Date(date), address: address, status: 'Pending', totalCost: totalCost });
        await newOrder.save();
        // Sending success message in the response and clearing the cart
        res.json({ message: 'Order placed successfully' });
        await cart.deleteMany();
    } catch (error) {
        // Handling server error
        console.error('Error during order creation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to update the status of an order
app.put('/order_placed', async (req, res) => {
    try {
        // Extracting order ID and status from the request body
        const { id, status } = req.body;
        // Handling case where either order ID or status is missing
        if (!id || !status) {
            return res.status(400).json({ error: 'Both orderId and status are required in the request body' });
        }
        // Finding the order in the database by ID
        const foundOrder = await order.findOne({ id: id });
        // Handling case where the order is not found
        if (!foundOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        // Updating the status of the order
        foundOrder.status = status;
        await foundOrder.save();
        // Sending success message in the response
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        // Handling server error
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to delete an order
app.delete('/delete_order', async (req, res) => {
    try {
        // Extracting order ID from query parameters
        const id = req.query.id;
        // Handling case where order ID is missing
        if (!id) {
            return res.status(400).json({ error: 'id parameter is required in the query parameters' });
        }
        // Deleting the order from the database
        const deleteResult = await order.deleteOne({ id: id });
        // Handling case where the order is not found
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        // Returning success message
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        // Handling server error
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to delete a product
app.delete('/delete_product', async (req, res) => {
    try {
        // Extracting product ID from query parameters
        const id = req.query.id;
        // Handling case where product ID is missing
        if (!id) {
            return res.status(400).json({ error: 'id parameter is required in the query parameters' });
        }
        // Deleting the product from the database
        const deleteResult = await product.deleteOne({ id: id });
        // Handling case where the product is not found
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Returning success message
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        // Handling server error
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// Exporting the Express app
module.exports = app;
