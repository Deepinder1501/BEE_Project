const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");
const session = require("express-session");
require("dotenv").config();
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());


const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/watchstore", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(" MongoDB connected...."))
.catch((err) => console.error(" MongoDB connection error:", err));

const User = require("./models/User");
const Product = require("./models/Product");
const CartItem = require("./models/CartItem");


const PORT = process.env.PORT || 3000;
const saltRounds = 10;

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self';"
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: true,
  })
);

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(401).json({ message: "Please log in first" });
  }
  res.redirect("/login");
}

app.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    const featuredProducts = products.slice(0, 4);
    const arrivals = products.filter(p => p.new);
    const testimonials = [
      { quote: "Amazing watches and super fast delivery!", name: "Alice Smith", title: "Customer" },
      { quote: "Quality is top-notch. Will order again!", name: "Bob Johnson", title: "Verified Buyer" },
      { quote: "Beautiful designs. Excellent service.", name: "Carol Davis", title: "Happy Customer" }
    ];
    res.render("index", { title: "Home", featuredProducts, arrivals, testimonials, user: req.session.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
//signup
app.get("/signup", (req, res) => res.render("signup"));
app.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  if (!firstname || !lastname || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  if (await User.findOne({ email: new RegExp('^' + email + '$', 'i') })) {
    return res.status(409).json({ message: "User already exists." });
  }

  try {
    const hashed = await bcrypt.hash(password, saltRounds);

    const user = new User({ firstname, lastname, email, password: hashed });
    await user.save();

    res.status(201).json({ message: "Signup successful!", redirect: "/login" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

//login
app.get("/login", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = {
      _id: user._id,
      name: user.name || `${user.firstname} ${user.lastname}`,
      email: user.email
    };

    res.json({ message: "Login successful!", redirect: "/" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});


// Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("products", { products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading products");
  }
});

// Cart
app.get("/cart", isAuthenticated, async (req, res) => {
  const items = await CartItem.find({ userId: req.session.user._id });
  res.render("cart", { cart: items, user: req.session.user });
});
app.get("/cart-items", isAuthenticated, async (req, res) => {
  const items = await CartItem.find({ userId: req.session.user._id });
  res.json(items);
});
app.post("/api/add-to-cart", isAuthenticated, async (req, res) => {
  const { id, name, image, price, quantity } = req.body;
  const email = req.session.user.email;
  const userId = req.session.user._id; 

  if (!userId) return res.status(400).json({ message: "User ID missing in session" });

  let item = await CartItem.findOne({ userId, productId: id });

  if (item) {
    item.quantity += quantity;
    await item.save();
  } else {
    item = new CartItem({
      userId,
      userEmail: email,
      productId: id,
      name,
      image,
      price,
      quantity
    });
    await item.save();
  }

  res.json({ success: true, message: "Item added to cart" });
});

app.post("/update-cart", isAuthenticated, async (req, res) => {
  const { id, action } = req.body;
  const item = await CartItem.findById(id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  if (action === 'increase') item.quantity++;
  if (action === 'decrease' && item.quantity > 1) item.quantity--;

  await item.save();
  res.json({ message: "Cart updated" });
});
app.post("/remove-from-cart", isAuthenticated, async (req, res) => {
  await CartItem.findByIdAndDelete(req.body.id);
  res.json({ success: true, message: "Item removed successfully" });
});

// Profile
app.get("/profile", isAuthenticated, (req, res) => {
  res.render("profile", { name: req.session.user.name, email: req.session.user.email });
});
app.post("/edit-profile", isAuthenticated, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email)
    return res.status(400).json({ message: "Name and email are required." });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found." });
  user.name = name;
  if (password) user.password = await bcrypt.hash(password, saltRounds);
  await user.save();
  res.json({ message: "Profile updated successfully!" });
});

// Contact
app.get("/contact", (req, res) => res.render("contact"));
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  try {
    await transporter.sendMail({ from: email, to: process.env.EMAIL_USER, subject: "Contact Form Message", text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}` });
    res.json({ success: true });
  } catch (err) {
    console.error("Email Error:", err);
    res.json({ success: false });
  }
});

// About
app.get("/about", (req, res) => res.render("about"));

// Admin
app.get("/admin/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});
app.post("/admin/users/delete", async (req, res) => {
  await User.deleteOne({ _id: req.body.id });
  res.json({ success: true });
});
app.get("/admin/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
app.post("/admin/products/edit", async (req, res) => {
  try {
    const { id, field, value } = req.body;

    if (!id || !field) {
      return res.status(400).send("Missing required fields.");
    }

    let updateValue;
    if (field === 'price') {
      const parsedPrice = parseFloat(value);
      if (isNaN(parsedPrice)) {
        return res.status(400).send("Invalid price value.");
      }
      updateValue = parsedPrice;
    } else {
      updateValue = value;
    }

    const update = { [field]: updateValue };
    await Product.findByIdAndUpdate(id, update);

    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Server error.");
  }
});

// Add new product
app.post("/admin/products/add", async (req, res) => {
  try {
    const { name, price, description } = req.body;

    const parsedPrice = parseFloat(price);
    if (!name || isNaN(parsedPrice) || !description) {
      return res.status(400).send("Invalid product details.");
    }

    const product = new Product({ name, price: parsedPrice, description });
    await product.save();

    res.sendStatus(201);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).send("Server error.");
  }
});

// Delete product
app.post("/admin/products/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).send("Product ID required.");
    
    await Product.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Server error.");
  }
});

// admin panel
app.get("/admin", async (req, res) => {
  try {
    const users = await User.find();
    const products = await Product.find();
    res.render("admin", { users, products });
  } catch (err) {
    console.error("Error loading admin page:", err);
    res.status(500).send("Server error.");
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
