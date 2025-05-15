const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  productId: { type: String, required: true },
  name: String,
  image: String,
  price: Number,
  quantity: { type: Number, default: 1 }
});

module.exports = mongoose.model("CartItem", cartItemSchema);
