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
import createIroningModel from "./models/Ironing.js";
import createQc2OrderDataModel from "./models/qc2_orderdata.js";
import axios from 'axios';

const app = express();
const PORT = 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));
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
const Ironing = createIroningModel(ymProdConnection);
const QC2OrderData = createQc2OrderDataModel(ymProdConnection);

const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'your_jwt_secret');
    req.userId = decodedToken.userId; // Set the userId in the request object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId; 
    if (!userId) {
      return cb(new Error('User ID is not defined'));
    }
    const dir = `../public/storage/profiles/${userId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const randomString = generateRandomString(32);
    cb(null, `${randomString}${path.extname(file.originalname)}`);
  },
});

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

const generateRandomId = async () => {
  let randomId;
  let isUnique = false;

  while (!isUnique) {
    randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
    if (!existing) isUnique = true;
  }

  return randomId;
};

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
    const { emp_id, name, email, roles, sub_roles, keywords, password } = req.body;

    // Log the incoming request body
    console.log('Request body:', req.body);

    // Check if the emp_id already exists
    const existingUser = await UserMain.findOne({ emp_id });
    if (existingUser) {
      return res.status(400).json({ message: 'Employee ID already exists. Please use a different ID.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new UserMain({
      emp_id,
      name,
      email,
      roles,
      sub_roles,
      keywords,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json(newUser);
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
    const updatedUser = { name, email, keywords };

    if (roles) {
      updatedUser.roles = [...new Set(roles)]; // Remove duplicates
    }

    if (sub_roles) {
      updatedUser.sub_roles = [...new Set(sub_roles)]; // Remove duplicates
    }

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

app.post('/api/get-user-data', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

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
      roles: user.roles, 
      sub_roles: user.sub_roles, 
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Save bundle data to MongoDB
app.post("/api/save-bundle-data", async (req, res) => {
  try {
    const { bundleData } = req.body;
    const savedRecords = [];

    // Save each bundle record
    for (const bundle of bundleData) {
      const randomId = await generateRandomId();

      const now = new Date();

      // Format timestamps
      const updated_date_seperator = now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      const updated_time_seperator = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newBundle = new QC2OrderData({
        ...bundle,
        bundle_random_id: randomId,
        factory: bundle.factory || "N/A", // Handle null factory
        custStyle: bundle.custStyle || "N/A", // Handle null custStyle
        country: bundle.country || "N/A", // Handle null country
        department: bundle.department,
        sub_con: bundle.sub_con || "No",
        sub_con_factory:
          bundle.sub_con === "Yes" ? bundle.sub_con_factory || "" : "N/A",
        updated_date_seperator,
        updated_time_seperator,
      });
      await newBundle.save();
      savedRecords.push(newBundle);
    }
    // const savedRecords = await QC2OrderData.insertMany(bundleData);

    res.status(201).json({
      message: "Bundle data saved successfully",
      data: savedRecords,
    });
  } catch (error) {
    console.error("Error saving bundle data:", error);
    res.status(500).json({
      message: "Failed to save bundle data",
      error: error.message,
    });
  }
});

// New Endpoint to Get Bundle by Random ID
app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId,
    });

    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json(bundle);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

// Check if bundle_id already exists and get the largest number
app.post("/api/check-bundle-id", async (req, res) => {
  try {
    const { date, lineNo, selectedMono, color, size } = req.body;

    // Find all bundle IDs matching the criteria
    const existingBundles = await QC2OrderData.find({
      bundle_id: {
        $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`,
      },
    });

    // Extract the largest number from the bundle IDs
    let largestNumber = 0;
    existingBundles.forEach((bundle) => {
      const parts = bundle.bundle_id.split(":");
      const number = parseInt(parts[parts.length - 1]);
      if (number > largestNumber) {
        largestNumber = number;
      }
    });

    res.status(200).json({ largestNumber });
  } catch (error) {
    console.error("Error checking bundle ID:", error);
    res.status(500).json({
      message: "Failed to check bundle ID",
      error: error.message,
    });
  }
});

// Update the MONo search endpoint to handle complex pattern matching
app.get("/api/search-mono", async (req, res) => {
  try {
    const digits = req.query.digits;
    const collection = mongoose.connection.db.collection("dt_orders");

    // More robust regex pattern to match last 3 digits before any non-digit characters
    const regexPattern = new RegExp(
      `(\\d{3})(?=\\D*$)|(\\d{3}$)|(?<=\\D)(\\d{3})(?=\\D)`,
      "i"
    );

    const results = await collection
      .aggregate([
        {
          $addFields: {
            matchParts: {
              $regexFind: {
                input: "$Order_No",
                regex: regexPattern,
              },
            },
          },
        },
        {
          $match: {
            $or: [
              { "matchParts.match": { $regex: new RegExp(`${digits}$`, "i") } },
              { "matchParts.match": { $regex: new RegExp(`^${digits}`, "i") } },
            ],
          },
        },
        {
          $project: {
            Order_No: 1,
            numericMatch: {
              $substr: [
                { $ifNull: ["$matchParts.match", ""] },
                { $subtract: [{ $strLenCP: "$matchParts.match" }, 3] },
                3,
              ],
            },
          },
        },
        {
          $match: {
            numericMatch: digits,
          },
        },
        {
          $group: {
            _id: "$Order_No",
            count: { $sum: 1 },
          },
        },
        {
          $limit: 100,
        },
      ])
      .toArray();

    res.json(results.map((r) => r._id));
  } catch (error) {
    console.error("Error searching MONo:", error);
    res.status(500).json({ error: "Failed to search MONo" });
  }
});

// Updated order details endpoint
app.get("/api/order-details/:mono", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Process colors with sizes
    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          sizes: new Set(),
        });
      }

      // Process sizes for this color
      colorObj.OrderQty.forEach((sizeEntry) => {
        // Get the size name (first key in the object)
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];

        if (quantity > 0) {
          const cleanSize = sizeName.split(";")[0].trim();
          colorMap.get(colorKey).sizes.add(cleanSize);
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      // Add new fields here
      factoryname: order.Factory || "N/A", // New field
      custStyle: order.CustStyle || "N/A", // New field
      country: order.Country || "N/A", // New field
      colors: Array.from(colorMap.values()).map((c) => c.originalColor),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes);
        return acc;
      }, {}),
    };

    res.json(response);
  } catch (error) {
    // console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Updated order sizes endpoint
app.get("/api/order-sizes/:mono/:color", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Find the matching color object (case-insensitive)
    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    // Extract sizes with quantity > 0
    const sizes = colorObj.OrderQty.map((entry) => {
      const sizeName = Object.keys(entry)[0];
      return entry[sizeName] > 0 ? sizeName.split(";")[0].trim() : null;
    })
      .filter((size) => size !== null)
      .filter((size, index, self) => self.indexOf(size) === index); // Remove duplicates

    res.json(sizes);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

async function fetchOrderDetails(mono) {
  const collection = mongoose.connection.db.collection("dt_orders");
  const order = await collection.findOne({ Order_No: mono });

  const colorMap = new Map();
  order.OrderColors.forEach((c) => {
    const key = c.Color.toLowerCase().trim();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        originalColor: c.Color.trim(),
        sizes: new Map(),
      });
    }

    c.OrderQty.forEach((q) => {
      if (q.Quantity > 0) {
        const sizeParts = q.Size.split(";");
        const cleanSize = sizeParts[0].trim();
        const sizeKey = cleanSize.toLowerCase();
        if (!colorMap.get(key).sizes.has(sizeKey)) {
          colorMap.get(key).sizes.set(sizeKey, cleanSize);
        }
      }
    });
  });

  return {
    engName: order.EngName,
    totalQty: order.TotalQty,
    colors: Array.from(colorMap.values()).map((c) => c.originalColor),
    colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
      acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes.values());
      return acc;
    }, {}),
  };
}

// Check if ironing record exists
app.get("/api/check-ironing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Ironing.findOne({
      ironing_bundle_id: req.params.bundleId,
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// Save ironing record
app.post("/api/save-ironing", async (req, res) => {
  try {
    const newRecord = new Ironing(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
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



app.post("/api/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    jwt.verify(refreshToken, "your_refresh_token_secret", (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const accessToken = jwt.sign(
        { userId: decoded.userId },
        "your_jwt_secret",
        { expiresIn: "1h" }
      );

      res.status(200).json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to refresh token", error: error.message });
  }
});

// Login Endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    if (!mainUserConnection.readyState) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const user = await UserMain.findOne({
      $or: [{ email: username }, { name: username }, { emp_id: username }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      user.password.replace("$2y$", "$2b$")
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (user.password.startsWith("$2y$")) {
      const newHashedPassword = await bcrypt.hash(password.trim(), 10);
      user.password = newHashedPassword;
      await user.save();
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      "your_refresh_token_secret",
      { expiresIn: "30d" }
    );

    // console.log('Access Token:', accessToken); 
    // console.log('Refresh Token:', refreshToken); 

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        sub_roles: user.sub_roles,
      },
    });
  } catch (error) {
    // console.error("Login error:", error);
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
      profile: user.profile ? `/public/storage/profiles/${decoded.userId}/${path.basename(user.profile)}` : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

app.put('/api/user-profile',authenticateUser, upload, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const userId = decoded.userId;
    

    const updatedProfile = {
      emp_id: req.body.emp_id,
      name: req.body.name,
      dept_name: req.body.dept_name,
      sect_name: req.body.sect_name,
      profile: req.file ? `profiles/${userId}/${req.file.filename}` : req.body.profile,
      // profile: req.file ? `../storage/app/public/profiles/${userId}/${req.file.filename}` : req.body.profile, // Save file path
    };

    // console.log('Updated Profile:', updatedProfile);

    const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, { new: true });

    // console.log('Updated User:', user);

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
