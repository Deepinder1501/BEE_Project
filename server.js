const express = require("express");
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const nodemailer = require('nodemailer');
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
const PORT = 3000;
const products = require("./products.json");
app.use(bodyParser.json());

const usersFilePath = path.join(__dirname, "users.json");
const cartFilePath = path.join(__dirname, "cart.json");
app.use('/pages', express.static(path.join(__dirname, 'public/pages')));



    
    app.use(express.json()); 
    app.use(cors());
    app.use(express.static("public"));
    app.use(express.static(path.join(__dirname, 'public')));


    app.get("/signup", (req, res) => {
      res.sendFile(path.join(__dirname, "public/pages/signup.html"));
  });
  
    
    function readCart() {
      return JSON.parse(fs.readFileSync(cartFilePath, "utf8"));
    }
    
    function writeCart(cart) {
      fs.writeFileSync(cartFilePath, JSON.stringify(cart, null, 2), "utf8");
    }
//ADD TO CART
app.post("/add-to-cart", (req, res) => {
  const newProduct = req.body;
  let cart = readCart();

  //CHECK IF PRODUCT EXISTS
  const existingProduct = cart.find((item) => item.id === newProduct.id);
  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push(newProduct);
  }

  writeCart(cart);
  res.json({ message: "Product added to cart!" });
});

//GET ITEMS FROM CART
app.get("/cart-items", (req, res) => {
  res.json(readCart());
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

const PRODUCTS_FILE = path.join(__dirname, "products.json");

app.post("/api/Addproducts", (req, res) => {
  const newProduct = req.body;

  // Read products.json file
  fs.readFile(PRODUCTS_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading products file:", err);
      return res.status(500).json({ message: "Error reading products file" });
    }

    let products = [];

    // If the file is not empty, parse the existing products
    if (data.trim().length > 0) {
      try {
        products = JSON.parse(data);
      } catch (parseError) {
        console.error("Error parsing products file:", parseError);
        return res.status(500).json({ message: "Error parsing products file" });
      }
    }

    // Generate a new ID
    const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    newProduct.id = newId;

    // Add new product to the array
    products.push(newProduct);

    // Write updated data back to products.json
    fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing to products file:", writeErr);
        return res.status(500).json({ message: "Error writing to products file" });
      }
      res.status(201).json({ message: "Product added successfully", product: newProduct });
    });
  });
});

//UPDATE ITEMS 
app.post("/update-cart", (req, res) => {
    const { id, action } = req.body;
    let cart = readCart();
  
    const productIndex = cart.findIndex((item) => item.id == id);
    if (productIndex !== -1) {
      if (action === "increase") {
        cart[productIndex].quantity += 1;
      } else if (action === "decrease" && cart[productIndex].quantity > 1) {
        cart[productIndex].quantity -= 1;
      }
    }
  
    writeCart(cart);
    res.json({ message: "Cart updated!", cart });
  });
  app.post("/remove-from-cart", (req, res) => {
    const { id } = req.body;
    let cart = readCart();
  
    cart = cart.filter((item) => item.id != id);
    writeCart(cart);
  
    res.json({ message: "Item removed successfully!", cart });
  });


//SEND EMAIL 
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS,  
    },
  });

  let mailOptions = {
    from: `"${name}" <${email}>`,
    to: "deepinder1501@gmail.com", 
    subject: `New Message from ${name}`,
    text: `From: ${name} (${email})\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Email sending failed", error });
  }
});



//ADD NEW USER 
const readUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
      fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
};

//WRITE TO users.json
const writeUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const isValidEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailPattern.test(email);
};

//SIGNUP
app.post("/signup", (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  if (!firstname || !lastname || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
  }

  if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
  }

  let users = readUsers();

  if (users.some(user => user.email === email)) {
      return res.status(400).json({ message: "Email already registered" });
  }

  // SAVE USER
  const newUser = { firstname, lastname, email, password };
  users.push(newUser);
  writeUsers(users);

  res.json({ message: "Signup successful", redirect: "/login" }); // Redirect to home page});
})





//LOGIN 
const getUsers = () => {
  try {
      const data = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8');
      return JSON.parse(data);
  } catch (err) { 
      return [];
  }
};

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Email and Password are required.' });
  }

  const users = getUsers();
  
  // FINDING USER IN users.json
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
      return res.status(200).json({ message: 'Login successful', redirect: '/' });
  } else {
      return res.status(401).json({ message: 'Invalid credentials' });
  }
});






//ROUTING  
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/pages/index.html")));
    app.get("/products", (req, res) => res.sendFile(path.join(__dirname, "public/pages/products.html")));
    app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "public/pages/about.html")));
    app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "public/pages/contact.html")));
    app.get("/cart", (req, res) => res.sendFile(path.join(__dirname, "public/pages/cart.html")));
    app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public/pages/login.html")));
    app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "public/pages/signup.html")));
    app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "public/pages/profile.html")));
   
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });