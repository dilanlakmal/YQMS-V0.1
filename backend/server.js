import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from 'fs';
import createUserModel from "./models/User.js";
import createQCDataModel from "./models/qc1_data.js";
import createRoleModel from "./models/Role.js";
import axios from 'axios';

const app = express();
const PORT = 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/storage', express.static(path.join(__dirname, 'storage')));
// app.use('/storage', express.static(path.join(__dirname, '../storage/app/public')));

const ymProdConnection = mongoose.createConnection("mongodb://localhost:27017/ym_prod");
const mainUserConnection = mongoose.createConnection("mongodb://127.0.0.1:27017/eco_development");

// Log connection status
ymProdConnection.on('connected', () => console.log("Connected to ym_prod database"));
ymProdConnection.on('error', (err) => console.error("ym_prod connection error:", err));
mainUserConnection.on('connected', () => console.log("Connected to eco_development database"));
mainUserConnection.on('error', (err) => console.error("eco_development connection error:", err));

// Define model on connections
const UserMain = createUserModel(mainUserConnection);
const QCData = createQCDataModel(ymProdConnection);
const Role = createRoleModel(ymProdConnection);

// Ensure connections are established before starting the server
// Promise.all([
//   ymProdConnection.asPromise(),
//   mainUserConnection.asPromise(),
// ])
  

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId; // Assuming userId is set in the request object
    const dir = `profiles/${userId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});


// const storage = multer.diskStorage({
//   destination: '../storage/app/public',
//   filename: (req, file, cb) => {
//     cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
//   },
// });


// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single('profile');

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// User routes
app.get('/users', async (req, res) => {
  try {
    const users = await UserMain.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const user = new UserMain(req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const user = await UserMain.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    await UserMain.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

app.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { name, email, roles, sub_roles, keywords, password } = req.body;
    const updatedUser = { name, email, roles, sub_roles, keywords };
    if (password) {
      const saltRounds = 12;
      updatedUser.password = await bcrypt.hash(password, saltRounds); // Ensure you hash the password before saving
    }
    const user = await UserMain.findByIdAndUpdate(req.params.id, updatedUser, { new: true });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});


app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const { factory, lineNo, moNo, customer, timeInterval } = req.query;
    let matchQuery = {};

    // Apply filters if provided
    if (factory) matchQuery["headerData.factory"] = factory;
    if (lineNo) matchQuery["headerData.lineNo"] = lineNo;
    if (moNo) matchQuery["headerData.moNo"] = moNo;
    if (customer) matchQuery["headerData.customer"] = customer;

    // Get unique filter values
    const filterValues = await QCData.aggregate([
      {
        $group: {
          _id: null,
          factories: { $addToSet: "$headerData.factory" },
          lineNos: { $addToSet: "$headerData.lineNo" },
          moNos: { $addToSet: "$headerData.moNo" },
          customers: { $addToSet: "$headerData.customer" },
        },
      },
    ]);

    // Get overall stats
    const stats = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          totalDefectPieces: { $sum: "$defectPieces" },
          totalReturnDefectQty: { $sum: "$returnDefectQty" },
          totalGoodOutput: { $sum: "$goodOutput" },
          latestHeaderData: { $last: "$headerData" },
        },
      },
    ]);

    // Get defect rate by line
    const defectRateByLine = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.lineNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          lineNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { defectRate: -1 } },
    ]);

    // Get defect rate by MO
    const defectRateByMO = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.moNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          moNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { defectRate: -1 } },
    ]);

    // Get defect rate by customer
    const defectRateByCustomer = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.customer",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          customer: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { defectRate: -1 } },
    ]);

    // Get top defects
    const topDefects = await QCData.aggregate([
      { $match: matchQuery },
      { $unwind: "$defectArray" },
      {
        $group: {
          _id: "$defectArray.name",
          count: { $sum: "$defectArray.count" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get time-series data
    const timeSeriesData = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$formattedTimestamp",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          timestamp: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { timestamp: 1 } },
    ]);

    const dashboardData = stats[0] || {
      totalCheckedQty: 0,
      totalDefectQty: 0,
      totalDefectPieces: 0,
      totalReturnDefectQty: 0,
      totalGoodOutput: 0,
      latestHeaderData: {},
    };

    const totalInspected = dashboardData.totalCheckedQty || 0;

    res.json({
      filters: filterValues[0] || {
        factories: [],
        lineNos: [],
        moNos: [],
        customers: [],
      },
      headerInfo: dashboardData.latestHeaderData,
      stats: {
        checkedQty: dashboardData.totalCheckedQty || 0,
        defectQty: dashboardData.totalDefectQty || 0,
        defectPieces: dashboardData.totalDefectPieces || 0,
        returnDefectQty: dashboardData.totalReturnDefectQty || 0,
        goodOutput: dashboardData.totalGoodOutput || 0,
        defectRatio: totalInspected
          ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
          : 0,
        defectRate: totalInspected
          ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(2)
          : 0,
      },
      defectRateByLine,
      defectRateByMO,
      defectRateByCustomer,
      topDefects,
      timeSeriesData,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.post("/api/save-qc-data", async (req, res) => {
  try {
    const sanitizedData = {
      ...req.body,
      headerData: {
        ...req.body.headerData,
        date: req.body.headerData.date
          ? new Date(req.body.headerData.date).toISOString()
          : undefined,
      },
    };
    const qcData = new QCData(sanitizedData);
    const savedData = await qcData.save();
    res.status(201).json({
      message: "QC data saved successfully",
      data: savedData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save QC data",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : undefined,
    });
  }
});

// Login Endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    // Debug: Print the received username and password
    console.log("Login attempt:", { username, password });

    // Ensure connections are established
    if (!mainUserConnection.readyState) {
      console.log("Database not connected");
      return res.status(500).json({ message: "Database not connected" });
    }

    // Find user by email or other fields
    const user = await UserMain.findOne({
      $or: [{ email: username }, { name: username }, { emp_id: username }],
    });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Debug: Print the retrieved user object
    console.log("User found:", user);

    // Ensure compatibility with $2y$ bcrypt hashes
    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      user.password.replace("$2y$", "$2b$")
    );

    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Rehash password to $2b$ standard for consistency
    if (user.password.startsWith("$2y$")) {
      const newHashedPassword = await bcrypt.hash(password.trim(), 10);
      user.password = newHashedPassword;
      await user.save();
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
        sub_roles: user.sub_roles,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in", error: error.message });
  }
});

// Registration Endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { emp_id, eng_name, kh_name, password, confirmPassword } = req.body;

    if (!emp_id || !eng_name || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Employee ID, name, and password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const existingUser = await UserMain.findOne({ emp_id });

    if (existingUser) {
      return res.status(400).json({
        message: "Employee ID already registered",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new UserMain({
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
    const user = await UserMain.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

app.put('/api/user-profile', upload, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const userId = decoded.userId;

    const updatedProfile = {
      emp_id: req.body.emp_id,
      name: req.body.name,
      dept_name: req.body.dept_name,
      sect_name: req.body.sect_name,
      profile: req.file ? `../public/storage/${req.file.filename}` : req.body.profile,
      // profile: req.file ? `../storage/app/public/profiles/${userId}/${req.file.filename}` : req.body.profile, // Save file path
    };

    console.log('Updated Profile:', updatedProfile);

    const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, { new: true });

    console.log('Updated User:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update user profile', error: error.message });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
