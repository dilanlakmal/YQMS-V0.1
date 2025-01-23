import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./models/User.js";


const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json ({ limit: '50mb' }) ); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const mongoURI = "mongodb://localhost:27017/ym_prod";
mongoose
  //  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected to ym_prod database"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define a Schema for QC Data
const qcDataSchema = new mongoose.Schema({
  type: String, // "pass" or "reject"
  garmentNo: Number,
  status: String,
  timestamp: Number,
  actualtime: Number,
  defectDetails: Array,
  checkedQty: Number, // New field
  goodOutput: Number, // New field
  defectQty: Number, // New field
  defectPieces: Number, // New field
  defectArray: Array, // New field
  cumulativeChecked: Number,
  cumulativeDefects: Number,
  cumulativeGoodOutput: Number, // Cumulative good output
  cumulativeDefectPieces: Number, // Cumulative defect pieces
  returnDefectList: Array, // Changed from Number to Array
  returnDefectArray: Array, // Changed from Number to Array
  returnDefectQty: Number,
  cumulativeReturnDefectQty: Number,
});
// Create a model for the "qc1_data" collection
const QCData = mongoose.model("qc1_data", qcDataSchema);

// API Endpoint to Save QC Data
app.post("/api/save-qc-data", async (req, res) => {
  try {
    const qcData = new QCData(req.body);
    await qcData.save();
    res.status(201).json({ message: "QC data saved successfully" });
  } catch (error) {
    console.error("Error saving QC data:", error);
    res.status(500).json({ message: "Failed to save QC data" });
  }
});

// Login Endpoint
app.post("/api/login", async (req, res) => {
  try {
    console.log("Login attempt received:", { username: req.body.username });
    const { username, password, rememberMe } = req.body;

    // Find user by email or other fields
    const user = await User.findOne({
      $or: [{ email: username }, { name: username }, { emp_id: username }],
    });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log("Stored hashed password:", user.password);

    // Ensure compatibility with $2y$ bcrypt hashes
    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      user.password.replace("$2y$", "$2b$")
    );

    console.log("Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Rehash password to $2b$ standard for consistency
    if (user.password.startsWith("$2y$")) {
      const newHashedPassword = await bcrypt.hash(password.trim(), 10);
      user.password = newHashedPassword;
      await user.save();
      console.log("Rehashed password for user:", user.emp_id);
    }

    // Generate JWT token
    const expiresIn = rememberMe ? "7d" : "1h";
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      "your_jwt_secret",
      { expiresIn }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
});


// Registration Endpoint
app.post("/api/register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    const { emp_id, eng_name, kh_name, password, confirmPassword } = req.body;

    if (!emp_id || !eng_name || !password || !confirmPassword) {
      console.log("Validation error: Missing required fields");
      return res.status(400).json({
        message: "Employee ID, name, and password are required",
      });
    }

    if (password !== confirmPassword) {
      console.log("Validation error: Passwords do not match");
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({ emp_id });
    if (existingUser) {
      console.log("Validation error: Employee ID already registered");
      return res.status(400).json({
        message: "Employee ID already registered",
      });
    }

    const saltRounds = 12; 
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed password during registration:", hashedPassword);

    const newUser = new User({
      emp_id,
      eng_name,
      name: eng_name, 
      kh_name: kh_name || "",
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newUser.save();
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      message: "Failed to register user",
      error: error.message,
    });
  }
});

// Fetch User Profile Endpoint
app.get('/api/user-profile', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      name: user.name,
      dept_name: user.dept_name,
      sec_name: user.sec_name,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Update User Profile Endpoint
app.put('/api/user-profile', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const userId = decoded.userId;

    const updatedProfile = {
      name: req.body.name,
      dept_name: req.body.dept_name,
      sec_name: req.body.sect_name,
      profile: req.body.profile,
    };

    const user = await User.findByIdAndUpdate(userId, updatedProfile, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
