// =====================================
// CallDesk Backend (Node + Socket.IO + Auth)
// =====================================
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const { verifyToken, verifyRole, JWT_SECRET } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

// Redirect root URL directly to the login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.use(express.static("models/public"));

// ================= DATABASE =================
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/calldesk";
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  issue: String,
  priority: String,
  createdAt: Date,
  servedAt: Date
});

const Customer = mongoose.model("Customer", CustomerSchema);

// ================= AUTH ROUTES =================

// Register Route
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate inputs
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role === "developer" ? "developer" : "customer",
      phone
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Verify token route
app.get("/api/auth/verify", verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// ================= QUEUE API ROUTES =================

// Get queue and served customers
app.get("/api/queue", async (req, res) => {
  try {
    const queue = await Customer.find({ servedAt: null }).sort({ createdAt: 1 });
    const served = await Customer.find({ servedAt: { $ne: null } })
      .sort({ servedAt: -1 })
      .limit(10);
    const nextCustomer = queue[0] || null;

    res.json({
      success: true,
      customers: queue,
      served,
      nextCustomer,
      queueSize: queue.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching queue" });
  }
});

// Add customer to queue (Protected - customers and developers)
app.post("/api/queue", verifyToken, async (req, res) => {
  try {
    const { name, phone, email, issue, priority } = req.body;

    const customer = new Customer({
      name: name || req.user.name,
      phone: phone || req.user.phone || "Not provided",
      email: email || req.user.email || "Not provided",
      issue,
      priority: priority || "normal",
      createdAt: new Date(),
      servedAt: null
    });

    await customer.save();

    io.emit("updateQueue");

    res.status(201).json({
      success: true,
      message: "Customer added to queue",
      customer
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding customer" });
  }
});

// Serve next customer or a selected customer (Protected - developers only)
app.post("/api/queue/serve", verifyToken, verifyRole(["developer"]), async (req, res) => {
  try {
    const { customerId } = req.body;

    let customer;
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, servedAt: null });
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Selected customer not found or already served"
        });
      }
    } else {
      customer = await Customer.findOne({ servedAt: null }).sort({ priority: -1, createdAt: 1 });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "No customers in queue"
      });
    }

    customer.servedAt = new Date();
    await customer.save();

    io.emit("updateQueue");

    res.json({
      success: true,
      message: "Customer served",
      customer
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error serving customer" });
  }
});

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send queue
  socket.on("getQueue", async () => {
    const queue = await Customer.find({ servedAt: null });
    const served = await Customer.find({ servedAt: { $ne: null } }).limit(10);

    socket.emit("queueData", { queue, served });
  });

  // Add customer
  socket.on("addCustomer", async (data) => {
    const customer = new Customer({
      ...data,
      createdAt: new Date(),
      servedAt: null
    });

    await customer.save();

    io.emit("updateQueue");
  });

  // Serve customer
  socket.on("serveNext", async () => {
    const customer = await Customer.findOne({ servedAt: null }).sort({ createdAt: 1 });

    if (customer) {
      customer.servedAt = new Date();
      await customer.save();
    }

    io.emit("updateQueue");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});