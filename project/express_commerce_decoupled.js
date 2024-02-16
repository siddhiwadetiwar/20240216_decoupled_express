/**
 * E-commerce Website Backend using Express.
 * This server handles CRUD operations for products and orders, 
 * connecting to products.json and orders.json files.
 */

//Importing required modules

//Importing the Express framework for building web applications.
const express = require('express');  

//Middleware to parse incoming JSON requests.
const bodyParser = require('body-parser');  

//File system module for reading and writing files.
const fs = require('fs');  

const app = express();

//Setting the server port.
const port = 3000;  


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://siddhiwadetiwar:root@cluster0.v2wphpr.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


// Loading product data from products.json file.
let products = loadJsonData('products.json');  
let cart = [];
// Loading order data from orders.json file.
let orders = loadJsonData('orders.json');  

app.use(bodyParser.json());

// Helper function to load JSON data from file
/**
 * Loads JSON data from a file.
 * @param {string} filename - The name of the file to load.
 * @returns {Array} - The loaded JSON data or an empty array if an error occurs.
 */

function loadJsonData(filename) {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return [];
  }
}

// Helper function to save JSON data to file
/**
 * Saves JSON data to a file.
 * @param {string} filename - The name of the file to save.
 * @param {Array} data - The JSON data to save.
 */

function saveJsonData(filename, data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonData, 'utf8');
  } catch (error) {
    console.error(`Error saving ${filename}:`, error.message);
  }
}

// Product Endpoints

// Endpoint to get all products
app.get('/search', (req, res) => {
  res.json(products);
});

// Endpoint to cancel the cart and clear the items
app.delete('/cancel', (req, res) => {
    // Update the order status to "deleted" for each product in the cart
    cart.forEach((product) => {
      const orderId = product.orderId; 
      const order = orders.find((o) => o.id === orderId);
  
      if (order) {
        // Update the order status to "deleted" for the product
        const productIndex = order.items.findIndex((item) => item.id === product.id);
        if (productIndex !== -1) {
          order.items[productIndex].orderstatus = 'deleted';
        }
      }
    });

    // Save the updated orders to the file
    saveJsonData('orders.json', orders);  
    res.json({ message: 'order cancelled successfully' });
});

// Endpoint to get a specific product by ID
app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find((p) => p.id === productId);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Endpoint to add a new product
app.post('/products', (req, res) => {
  const newProduct = req.body;
  products.push(newProduct);
  saveJsonData('products.json', products);
  res.status(201).json(newProduct);
});

// Endpoint to update a product by ID
app.put('/products/:id', (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;
  const index = products.findIndex((p) => p.id === productId);

  if (index !== -1) {
    products[index] = { ...products[index], ...updatedProduct };
    saveJsonData('products.json', products);
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Endpoint to delete a product by ID
app.delete('/products/:id', (req, res) => {
  const productId = req.params.id;
  products = products.filter((p) => p.id !== productId);
  saveJsonData('products.json', products);
  res.json({ message: 'Product deleted successfully' });
});

// Cart Endpoints

// Endpoint to get the current contents of the cart
app.get('/cart', (req, res) => {
  res.json(cart);
});

// Endpoint to add a product to the cart
app.post('/cart/add', (req, res) => {
  const productId = req.body.productId;
  const product = products.find((p) => p.id === productId);

  if (product) {
    cart.push(product);
    res.status(201).json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Order Endpoints

// Endpoint to get all orders
app.get('/orders', (req, res) => {
  res.json(orders);
});

// Endpoint to checkout the cart and create a new order
app.post('/cart/checkout', (req, res) => {
  const order = {
    id: Math.random().toString(36).substring(7),
    items: [...cart],
    createdAt: new Date(),
  };

  orders.push(order);
  cart = [];
  saveJsonData('orders.json', orders);
  res.status(201).json(order);
});

// Start the Express server on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
