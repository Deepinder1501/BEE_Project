const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const session = require("express-session");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { name } = require("ejs");

const saltRounds = 10;

const app = express();
const PORT = 3000;

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


const USERS_FILE = path.join(__dirname, "users.json");
const PRODUCTS_FILE = path.join(__dirname, "products.json");
const cartFilePath = path.join(__dirname, "cart.json");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(
  session({
    secret: "secretKey",//session cookie 
    resave: false,//dont save if unmodified
    saveUninitialized: true,//session cookie created even if nothing is set
  })
);



// Home route
app.get("/", (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  const featuredProducts = products.slice(0, 4);
  const arrivals = products.filter((product) => product.new);

  const testimonials = [   
    { quote: "Amazing watches and super fast delivery!", name: "Alice Smith", title: "Customer" },
    { quote: "Quality is top-notch. Will order again!", name: "Bob Johnson", title: "Verified Buyer" },
    { quote: "Beautiful designs. Excellent service.", name: "Carol Davis", title: "Happy Customer" }
  ];
  res.render("index", {
    title: "Home",
    featuredProducts,
    arrivals,
    testimonials,
    user: req.session.user || null
  });
});

// Auth routes
app.get("/signup", (req, res) => res.render("signup"));

app.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  if (!firstname || !lastname || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  if (users.find(user => user.email === email)) {
    return res.status(400).json({ message: "User already exists." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = users.length + 1; 
    const newUser = {
      id: userId,
      name: `${firstname} ${lastname}`,
      email,
      password: hashedPassword,
    };

    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.status(200).json({ message: "Signup successful!", redirect: "/login" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

app.get("/login", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    const user = users.find(user => user.email === email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = user;
    return res.status(200).json({ message: "Login successful!", redirect: "/" });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong on the server." });
  }
});



// Product routes
app.get("/products", (req, res) => {
  fs.readFile(PRODUCTS_FILE, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading products.json:", err);
      return res.status(500).send("Error loading products");
    }
    const products = JSON.parse(data);
    res.render("products", { products });
  });
});


// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(401).json({ message: "Please log in first" });
    } else {
      return res.redirect("/login");
    }
  }
}
app.get("/cart", isAuthenticated, (req, res) => {
  const cart = JSON.parse(fs.readFileSync(cartFilePath, "utf-8"));
  res.render("cart", { cart, user: req.session.user });
});

// --- Render Cart Page ---
app.get('/profile', isAuthenticated, (req, res) => {

  const user = req.session.user; // Access user from session
  console.log(user)
  res.render('profile', { 
    name: user.name,
    email: user.email,
   }); // Pass user data to profile 
});

app.post('/edit-profile', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    const userIndex = users.findIndex((user) => user.email === email);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user details
    users[userIndex].name = name;
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10); // Hash the new password
      users[userIndex].password = hashedPassword;
    }

    // Save the updated users array back to the file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.status(200).json({ message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});


// --- Add to Cart ---
app.post("/api/add-to-cart", isAuthenticated, (req, res) => {
  const { id, name, image, price, quantity } = req.body;
  const {email} = req.session.user
  fs.readFile(cartFilePath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading cart");

    let cart = [];
    try {
      cart = JSON.parse(data);
    } catch (parseErr) {
      console.error("Parse error:", parseErr);
    }

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ user_email:email,id, name, image, price, quantity });
    }

    fs.writeFile(cartFilePath, JSON.stringify(cart, null, 2), (err) => {
      if (err) return res.status(500).send("Error writing to cart");
      res.json({ success: true, message: "Item added to cart" });
    });
  });
});

// Get Cart Items
app.get("/cart-items", isAuthenticated, (req, res) => {
  const userEmail = req.session.user.email; // Get the logged-in user's email
  console.log(userEmail)
    const cart = JSON.parse(fs.readFileSync(cartFilePath, "utf-8") || "[]");
    // Filter cart items for the logged-in user
    const userCart = cart.filter(item => item.user_email === userEmail);
    res.json(userCart)
});

// Update Cart Quantity
app.post("/update-cart", isAuthenticated, (req, res) => {
  const { id, action } = req.body;
  let cart = JSON.parse(fs.readFileSync(cartFilePath, "utf-8"));

  cart = cart.map((item) => {
    if (item.id === id) {
      if (action === "increase") item.quantity += 1;
      if (action === "decrease" && item.quantity > 1) item.quantity -= 1;
    }
    return item;
  });

  fs.writeFileSync(cartFilePath, JSON.stringify(cart, null, 2));
  res.json({ message: "Cart updated" });
});

// Remove from Cart
app.post("/remove-from-cart", isAuthenticated, (req, res) => {
  const { id } = req.body;

  let cart = JSON.parse(fs.readFileSync(cartFilePath, "utf-8"));
  cart = cart.filter((item) => item.id !== id);

  fs.writeFile(cartFilePath, JSON.stringify(cart, null, 2), (err) => {
    if (err) {
      console.error("Error writing cart:", err);
      return res.status(500).json({ success: false, message: "Failed to remove item" });
    }
    res.json({ success: true, message: "Item removed successfully" });
  });
});

// Contact Form
app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: "Contact Form Message",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Email Error:", error);
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});

// About page
app.get("/about", (req, res) => {
  res.render("about");
});

// Admin Panel API routes
app.get("/admin/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  res.json(users);
});

app.post("/admin/users/delete", (req, res) => {
  const { email } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  users = users.filter(user => user.email !== email);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  
  res.json({ success: true });
});

app.get("/admin/products", (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  res.json(products);
});

app.post("/admin/products/edit", (req, res) => {
  const { index, field, value } = req.body;
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  if (products[index]) {
    products[index][field] = field === 'price' ? parseFloat(value) : value;
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }
  res.sendStatus(200);
});

app.post("/admin/products/add", (req, res) => {
  const { name, price, description } = req.body;
  const product = { name, price: parseFloat(price), description };
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  products.push(product);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.sendStatus(201);
});

// Admin: Delete Product Route
app.post('/admin/products/delete', (req, res) => {
  const { name } = req.body;

  let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));

  products = products.filter(product => product.name !== name);

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));

  res.json({ success: true });
});


// Admin Panel View
app.get('/admin', (req, res) => {
  const usersPath = path.join(__dirname, 'users.json');
  const productsPath = path.join(__dirname, 'products.json');

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  res.render('admin', { users, products });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});