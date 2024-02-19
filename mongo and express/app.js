const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
app.use(bodyParser.json());

app.get('/search_all', async (req, res) => {
  try {
    const data = await fs.readFile('./data/product.json', 'utf-8');
    const { products } = JSON.parse(data);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/search_product_by_id', async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required in the query parameters' });
    }

    const productsData = await fs.readFile('./data/product.json', 'utf-8');
    const products = JSON.parse(productsData).products;

    const product = products.find((p) => p.id === id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error retrieving product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/products_add', async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;

    if (!name || !description || !price || !stock || !imageUrl) {
      return res.status(400).json({ error: 'Name, description, price, stock, and imageUrl are required in the request body' });
    }

    const productData = await fs.readFile('./data/product.json', 'utf-8');
    let jsonData = JSON.parse(productData);

    if (!jsonData.products || !Array.isArray(jsonData.products)) {
      jsonData.products = [];
    }

    const newProductId = String(jsonData.products.length + 1);

    const newProduct = {
      id: newProductId,
      name: name,
      description: description,
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl: imageUrl,
    };

    jsonData.products.push(newProduct);

    await fs.writeFile('./data/product.json', JSON.stringify(jsonData, null, 2), 'utf-8');

    res.status(201).json({ id: newProductId, ...newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/checkout', async (req, res) => {
  try {
    const { id, quantity } = req.body;

    if (!id || !quantity) {
      return res.status(400).json({ error: 'Both product ID and quantity are required in the request body' });
    }

    const productsData = await fs.readFile('./data/product.json', 'utf-8');
    const products = JSON.parse(productsData).products;

    const foundProduct = products.find((product) => product.id === id);

    if (!foundProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity > foundProduct.stock) {
      return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    }

    const cartData = await fs.readFile('./data/cart.json', 'utf-8');
    const cart = JSON.parse(cartData);

    const existingCartItem = cart.find((item) => item.id === id);

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      existingCartItem.price += foundProduct.price * quantity;
    } else {
      const newCartItem = {
        id: id,
        quantity: quantity,
        price: foundProduct.price * quantity,
      };
      cart.push(newCartItem);
    }

    await fs.writeFile('./data/cart.json', JSON.stringify(cart, null, 2));

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
      return res.status(400).json({ error: 'ID, date, and address are required in the request body' });
    }

    const cartData = await fs.readFile('./data/cart.json', 'utf-8');
    const cart = JSON.parse(cartData);

    if (cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add items to the cart before placing an order.' });
    }

    const totalCost = cart.reduce((sum, item) => sum + item.price, 0);

    const order = {
      id: id,
      date: date,
      address: address,
      status: 'pending',
      totalCost: totalCost,
      products: cart,
    };

    const orderData = await fs.readFile('./data/order.json', 'utf-8');
    const orders = JSON.parse(orderData);

    orders.push(order);

    await fs.writeFile('./data/order.json', JSON.stringify(orders, null, 2));

    await fs.writeFile('./data/cart.json', '[]');

    res.json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/order_placed', async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Both order ID and status are required in the request body' });
    }

    const orderData = await fs.readFile('./data/order.json', 'utf-8');

    try {
      const orders = JSON.parse(orderData);

      if (Array.isArray(orders)) {
        const foundOrder = orders.find((order) => order.id === id);

        if (foundOrder) {
          foundOrder.status = status;

          await fs.writeFile('./data/order.json', JSON.stringify(orders, null, 2));

          return res.json({ message: 'Order status updated successfully', updatedOrder: foundOrder });
        }
      }
    } catch (parseError) {
      console.error('Error parsing order data:', parseError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(404).json({ error: `Order with the specified ID (${id}) not found` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/delete-order', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required in the request body' });
    }

    const orderData = await fs.readFile('./data/order.json', 'utf-8');

    try {
      const orders = JSON.parse(orderData);

      if (Array.isArray(orders)) {
        const orderIndex = orders.findIndex((order) => order.id === id);

        if (orderIndex !== -1) {
          orders.splice(orderIndex, 1);

          await fs.writeFile('./data/order.json', JSON.stringify(orders, null, 2));

          return res.json({ message: 'Order deleted successfully' });
        }
      }
    } catch (parseError) {
      console.error('Error parsing order data:', parseError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(404).json({ error: `Order with the specified ID (${id}) not found` });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/delete_product', async (req, res) => {
  try {
    const productId = req.query.id;

    if (!productId) {
      return res.status(400).json({ error: 'Invalid or missing product ID' });
    }

    const data = await fs.readFile('./data/product.json', 'utf-8');
    const jsonData = JSON.parse(data);

    const productIndex = jsonData.products.findIndex(product => product && product.id === productId);

    if (productIndex !== -1) {
      jsonData.products.splice(productIndex, 1);

      await fs.writeFile('./data/product.json', JSON.stringify(jsonData, null, 2), 'utf-8');

      return res.status(200).json({ message: 'Product deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

module.exports = app;
