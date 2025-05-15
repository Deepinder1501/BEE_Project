const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  description: String
});

module.exports = mongoose.model('Product', productSchema);
