const express = require('express');
const path = require('path');
const router = express.Router();

// Get the absolute path to the public directory
const publicPath = path.join(__dirname, '../public/pages');

// Serve HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

router.get('/products', (req, res) => {
  res.sendFile(path.join(publicPath, 'products.html'));
});

router.get('/about', (req, res) => {
  res.sendFile(path.join(publicPath, 'about.html'));
});

router.get('/contact', (req, res) => {
  res.sendFile(path.join(publicPath, 'contact.html'));
});

router.get('/product/:id', (req, res) => {
  res.sendFile(path.join(publicPath, 'product-details.html'));
});

router.get('/cart', (req, res) => {
  res.sendFile(path.join(publicPath, 'cart.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

router.get('/signup', (req, res) => {
  res.sendFile(path.join(publicPath, 'signup.html'));
});

module.exports = router;
