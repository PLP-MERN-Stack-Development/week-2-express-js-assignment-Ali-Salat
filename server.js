// server.js - Starter Express server for Week 2 assignment
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Custom middleware for request logging
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

// Custom middleware for basic authentication
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please provide a valid authorization token'
    });
  }
  next();
};

// Custom error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end'
  });
};

// Apply logging middleware
app.use(requestLogger);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// GET all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET product by ID
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({
      error: 'Product not found',
      message: `Product with id ${productId} does not exist`
    });
  }

  res.json(product);
});

// POST new product
app.post('/api/products', authenticate, (req, res, next) => {
  try {
    const { name, description, price, category, inStock } = req.body;

    if (!name || !description || price === undefined || !category) {
      const error = new Error('Missing required fields: name, description, price, and category are required');
      error.type = 'validation';
      throw error;
    }

    if (typeof price !== 'number' || price < 0) {
      const error = new Error('Price must be a positive number');
      error.type = 'validation';
      throw error;
    }

    const newProduct = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category: category.trim().toLowerCase(),
      inStock: inStock !== undefined ? Boolean(inStock) : true
    };

    products.push(newProduct);

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    next(error);
  }
});

// PUT update product
app.put('/api/products/:id', authenticate, (req, res, next) => {
  try {
    const productId = req.params.id;
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with id ${productId} does not exist`
      });
    }

    const { name, description, price, category, inStock } = req.body;

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      const error = new Error('Price must be a positive number');
      error.type = 'validation';
      throw error;
    }

    const updatedProduct = {
      ...products[productIndex],
      ...(name && { name: name.trim() }),
      ...(description && { description: description.trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(category && { category: category.trim().toLowerCase() }),
      ...(inStock !== undefined && { inStock: Boolean(inStock) })
    };

    products[productIndex] = updatedProduct;

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
});

// DELETE product
app.delete('/api/products/:id', authenticate, (req, res) => {
  const productId = req.params.id;
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({
      error: 'Product not found',
      message: `Product with id ${productId} does not exist`
    });
  }

  const deletedProduct = products.splice(productIndex, 1)[0];

  res.json({
    message: 'Product deleted successfully',
    product: deletedProduct
  });
});

// Apply error handling last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export app (useful for testing)
module.exports = app;