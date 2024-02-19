// Importing required modules
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

// Creating an instance of the Express app
const app = express();
// Using bodyParser middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to search for all products
app.get('/search_all', async (req, res) => {
  try {
    // Reading product data from a JSON file
    const data = await fs.readFile('./data/product.json', 'utf-8');
    const { products } = JSON.parse(data);

    // Sending the list of products in the response
    res.json(products);
  } catch (error) {
    // Handling server error
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to search for a product by ID
app.get('/search_product_by_id', async (req, res) => {
  try {
    // Extracting product ID from query parameters
    const id = req.query.id;

    // Handling case where product ID is missing
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required in the query parameters' });
    }

    // Reading product data from a JSON file
    const productsData = await fs.readFile('./data/product.json', 'utf-8');
    const products = JSON.parse(productsData).products;

    // Finding a product by ID in the product list
    const product = products.find((p) => p.id === id);

    // Handling case where the product is not found
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Sending the found product in the response
    res.json(product);
  } catch (error) {
    // Handling server error
    console.error('Error retrieving product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to add a new product
app.post('/products_add', async (req, res) => {
  try {
    // Extracting product details from the request body
    const { name, description, price, stock, imageUrl } = req.body;

    // Handling case where required fields are missing
    if (!name || !description || !price || !stock || !imageUrl) {
      return res.status(400).json({ error: 'Name, description, price, stock, and imageUrl are required in the request body' });
    }

    // Reading existing product data from a JSON file
    const productData = await fs.readFile('./data/product.json', 'utf-8');
    let jsonData = JSON.parse(productData);

    // Ensuring products array exists in the JSON data
    if (!jsonData.products || !Array.isArray(jsonData.products)) {
      jsonData.products = [];
    }

    // Generating a new product ID
    const newProductId = String(jsonData.products.length + 1);

    // Creating a new product object
    const newProduct = {
      id: newProductId,
      name: name,
      description: description,
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl: imageUrl,
    };

    // Adding the new product to the products array
    jsonData.products.push(newProduct);

    // Writing the updated product data back to the JSON file
    await fs.writeFile('./data/product.json', JSON.stringify(jsonData, null, 2), 'utf-8');

    // Sending success response with the new product details
    res.status(201).json({ id: newProductId, ...newProduct });
  } catch (error) {
    // Handling server error
    console.error('Error adding product:', error);
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

    // Reading product data from a JSON file
    const productsData = await fs.readFile('./data/product.json', 'utf-8');
    const products = JSON.parse(productsData).products;

    // Finding the product in the product list by ID
    const foundProduct = products.find((product) => product.id === id);

    // Handling case where the product is not found
    if (!foundProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Checking if the requested quantity exceeds available stock
    if (quantity > foundProduct.stock) {
      return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    }

    // Reading cart data from a JSON file
    const cartData = await fs.readFile('./data/cart.json', 'utf-8');
    const cart = JSON.parse(cartData);

    // Finding or creating a cart item based on the product ID
    const existingCartItem = cart.find((item) => item.id === id);

    if (existingCartItem) {
      // Updating the existing cart item
      existingCartItem.quantity += quantity;
      existingCartItem.price += foundProduct.price * quantity;
    } else {
      // Creating a new cart item
      const newCartItem = {
        id: id,
        quantity: quantity,
        price: foundProduct.price * quantity,
      };
      cart.push(newCartItem);
    }

    // Writing the updated cart data back to the JSON file
    await fs.writeFile('./data/cart.json', JSON.stringify(cart, null, 2));

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
      return res.status(400).json({ error: 'ID, date, and address are required in the request body' });
    }

    // Reading cart data from a JSON file
    const cartData = await fs.readFile('./data/cart.json', 'utf-8');
    const cart = JSON.parse(cartData);

    // Handling case where the cart is empty
    if (cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add items to the cart before placing an order.' });
    }

    // Calculating the total cost of the order
    const totalCost = cart.reduce((sum, item) => sum + item.price, 0);

    // Creating a new order object
    const order = {
      id: id,
      date: date,
      address: address,
      status: 'pending',
      totalCost: totalCost,
      products: cart,
    };

    // Reading existing order data from a JSON file
    const orderData = await fs.readFile('./data/order.json', 'utf-8');
    const orders = JSON.parse(orderData);

    // Adding the new order to the orders array
    orders.push(order);

    // Writing the updated order data back to the JSON file
    await fs.writeFile('./data/order.json', JSON.stringify(orders, null, 2));

    // Clearing the cart by writing an empty array back to the cart data file
    await fs.writeFile('./data/cart.json', '[]');

    // Sending success response with the order details
    res.json({ message: 'Order placed successfully', order });
  } catch (error) {
    // Handling server error
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to update the status of a placed order
app.put('/order_placed', async (req, res) => {
  try {
    // Extracting order ID and status from the request body
    const { id, status } = req.body;

    // Handling case where either order ID or status is missing
    if (!id || !status) {
      return res.status(400).json({ error: 'Both order ID and status are required in the request body' });
    }

    // Reading existing order data from a JSON file
    const orderData = await fs.readFile('./data/order.json', 'utf-8');

    try {
      // Parsing the order data
      const orders = JSON.parse(orderData);

      // Checking if the parsed data is an array
      if (Array.isArray(orders)) {
        // Finding the order in the orders array by ID
        const foundOrder = orders.find((order) => order.id === id);

        // Handling case where the order is found
        if (foundOrder) {
          // Updating the status of the found order
          foundOrder.status = status;

          // Writing the updated order data back to the JSON file
          await fs.writeFile('./data/order.json', JSON.stringify(orders, null, 2));

          // Sending success response with the updated order details
          return res.json({ message: 'Order status updated successfully', updatedOrder: foundOrder });
        }
      }
    } catch (parseError) {
      // Handling error in parsing order data
      console.error('Error parsing order data:', parseError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Handling case where the order with the specified ID is not found
    return res.status(404).json({ error: `Order with the specified ID (${id}) not found` });
  } catch (error) {
    // Handling server error
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to delete an order
app.delete('/delete-order', async (req, res) => {
  try {
    // Extracting order ID from the request body
    const { id } = req.body;

    // Handling case where order ID is missing
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required in the request body' });
    }

    // Reading existing order data from a JSON file
    const orderData = await fs.readFile('./data/order.json', 'utf-8');

    try {
      // Parsing the order data
      const orders = JSON.parse(orderData);

      // Checking if the parsed data is an array
      if (Array.isArray(orders)) {
        // Finding the index of the order in the orders array by ID
        const orderIndex = orders.findIndex((order) => order.id === id);

        // Handling case where the order is found
        if (orderIndex !== -1) {
          // Removing the order from the orders array
          orders.splice(orderIndex, 1);

          // Writing the updated order data back to the JSON file
          await fs.writeFile('./data/order.json', JSON.stringify(orders, null, 2));

          // Sending success response
          return res.json({ message: 'Order deleted successfully' });
        }
      }
    } catch (parseError) {
      // Handling error in parsing order data
      console.error('Error parsing order data:', parseError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Handling case where the order with the specified ID is not found
    return res.status(404).json({ error: `Order with the specified ID (${id}) not found` });
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
    const productId = req.query.id;

    // Handling case where product ID is missing
    if (!productId) {
      return res.status(400).json({ error: 'Invalid or missing product ID' });
    }

    // Reading product data from a JSON file
    const data = await fs.readFile('./data/product.json', 'utf-8');
    const jsonData = JSON.parse(data);

    // Finding the index of the product in the products array by ID
    const productIndex = jsonData.products.findIndex(product => product && product.id === productId);

    // Handling case where the product is found
    if (productIndex !== -1) {
      // Removing the product from the products array
      jsonData.products.splice(productIndex, 1);

      // Writing the updated product data back to the JSON file
      await fs.writeFile('./data/product.json', JSON.stringify(jsonData, null, 2), 'utf-8');

      // Sending success response
      return res.status(200).json({ message: 'Product deleted successfully' });
    } else {
      // Handling case where the product with the specified ID is not found
      return res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    // Handling server error
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Starting the server on port 3000
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Exporting the Express app for external use
module.exports = app;
