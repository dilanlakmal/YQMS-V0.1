/* ------------------------------
   Import Required Libraries/Models
------------------------------ */
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from "mongoose";
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
//import createRoleManagmentModel from "./models/RoleManagment.js";
import createRoleManagmentModel from "./models/RoleManagment.js";
import createQC2InspectionPassBundle from "./models/qc2_inspection_pass_bundle.js";
import createQC2ReworksModel from "./models/qc2_reworks.js";
import createWashingModel from "./models/Washing.js";
import createOPAModel from "./models/OPA.js";
import createPackingModel from "./models/Packing.js";



// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "./config.js";

/* ------------------------------
   Connection String
------------------------------ */

const app = express();
const PORT = 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));

app.use(bodyParser.json());
app.use(
  cors({
    origin: "*", //["http://localhost:3001", "https://localhost:3001"], // Allow both HTTP and HTTPS, // Update with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
//    "mongodb://localhost:27017/ym_prod"

//-----------------------------DATABASE CONNECTIONS------------------------------------------------//


// const mainUserConnection = mongoose.createConnection("mongodb://yasomi:Yasomi%40YM2025@192.167.1.10:29000/ym_eco_board?authSource=admin");
// const mainUserConnection = mongoose.createConnection("mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin");
const ymProdConnection = mongoose.createConnection("mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin");

// // Log connection status
ymProdConnection.on('connected', () => console.log("Connected to ym_prod database"));
ymProdConnection.on('error', (err) => console.error("ym_prod connection error:", err));
// mainUserConnection.on('connected', () => console.log("Connected to eco_development database"));
// mainUserConnection.on('error', (err) => console.error("eco_development connection error:", err));

// Define model on connections
const UserMain = createUserModel(ymProdConnection);
const QCData = createQCDataModel(ymProdConnection);
const Role = createRoleModel(ymProdConnection);
const Ironing = createIroningModel(ymProdConnection);
const QC2OrderData = createQc2OrderDataModel(ymProdConnection);
const RoleManagment = createRoleManagmentModel(ymProdConnection);
const QC2InspectionPassBundle = createQC2InspectionPassBundle(ymProdConnection);
const QC2Reworks = createQC2ReworksModel(ymProdConnection);
const Washing = createWashingModel(ymProdConnection);
const OPA = createOPAModel(ymProdConnection);
const Packing = createPackingModel(ymProdConnection);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

//-----------------------------END DATABASE CONNECTIONS------------------------------------------------//

/* ------------------------------
   End Points - dt_orders
------------------------------ */

// const checkDbConnection = (req, res, next) => {
//   if (ymProdConnection.readyState !== 1) {
//     // 1 means connected
//     return res.status(500).json({ error: "Mongoose connection is not ready" });
//   }
//   next();
// };

// const checkDbConnection = (req, res, next) => {
//   if (ymProdConnection.readyState !== 1) { // 1 means connected
//     return res.status(500).json({ error: 'Mongoose connection is not ready' });
//   }
//   next();
// };

// Update the MONo search endpoint to handle complex pattern matching
app.get("/api/search-mono", async (req, res) => {
  try {
    const digits = req.query.digits;

    const collection = ymProdConnection.db.collection("dt_orders");

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

      // console.log("Search results:", results);

    res.json(results.map((r) => r._id));
  } catch (error) {
    console.error("Error searching MONo:", error);
    res.status(500).json({ error: "Failed to search MONo" });
  }
});

// Update /api/order-details endpoint
app.get("/api/order-details/:mono", async (req, res) => {
  try {
    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          colorCode: colorObj.ColorCode,
          chnColor: colorObj.ChnColor,
          colorKey: colorObj.ColorKey,
          sizes: new Map(),
        });
      }

      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];
        const cleanSize = sizeName.split(";")[0].trim();

        if (quantity > 0) {
          colorMap.get(colorKey).sizes.set(cleanSize, {
            orderQty: quantity,
            planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0,
          });
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      factoryname: order.Factory || "N/A",
      custStyle: order.CustStyle || "N/A",
      country: order.Country || "N/A",
      colors: Array.from(colorMap.values()).map((c) => ({
        original: c.originalColor,
        code: c.colorCode,
        chn: c.chnColor,
        key: c.colorKey,
      })),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = {
          sizes: Array.from(curr.sizes.keys()),
          details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
            size,
            orderQty: data.orderQty,
            planCutQty: data.planCutQty,
          })),
        };
        return acc;
      }, {}),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Update /api/order-sizes endpoint
app.get("/api/order-sizes/:mono/:color", async (req, res) => {
  try {
    const collection = ymProdConnection.db.collection("dt_orders");
    
    const order = await collection.findOne({ Order_No: req.params.mono });

    if (!order) return res.status(404).json({ error: "Order not found" });s

    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    const sizesWithDetails = colorObj.OrderQty.filter(
      (entry) => entry[Object.keys(entry)[0]] > 0
    )
      .map((entry) => {
        const sizeName = Object.keys(entry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        return {
          size: cleanSize,
          orderQty: entry[sizeName],
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0,
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

    res.json(sizesWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

// Bundle Qty Endpoint
app.get("/api/total-bundle-qty/:mono", async (req, res) => {
  try {
    const mono = req.params.mono;
    const total = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } }, // Match documents with the given MONo
      {
        $group: {
          _id: null, // Group all matched documents
          total: { $sum: "$totalBundleQty" }, // Correct sum using field reference with $
        },
      },
    ]);
    res.json({ total: total[0]?.total || 0 }); // Return the summed total or 0 if no documents
  } catch (error) {
    console.error("Error fetching total bundle quantity:", error);
    res.status(500).json({ error: "Failed to fetch total bundle quantity" });
  }
});

// Endpoint to get total garments count for a specific MONo, Color, and Size
app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
  try {
    const { mono, color, size } = req.params;

    const totalCount = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono, color: color, size: size } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" }, // Sum the count field
        },
      },
    ]);

    res.json({ totalCount: totalCount[0]?.totalCount || 0 }); // Return total count or 0
  } catch (error) {
    console.error("Error fetching total garments count:", error);
    res.status(500).json({ error: "Failed to fetch total garments count" });
  }
});

// Endpoint to fetch available colors for a selected order
app.get("/api/colors", async (req, res) => {
  try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "styleNo is required" });
    }

    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: styleNo });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const colors = order.OrderColors.map(colorObj => colorObj.Color.trim());
    res.json({ colors });
  } catch (error) {
    console.error("Error fetching colors:", error);
    res.status(500).json({ error: "Failed to fetch colors" });
  }
});

// Endpoint to fetch available sizes for a selected order
app.get("/api/sizes", async (req, res) => {
  try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "styleNo is required" });
    }

    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: styleNo });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const sizes = new Set();
    order.OrderColors.forEach(colorObj => {
      colorObj.OrderQty.forEach(sizeEntry => {
        const sizeName = Object.keys(sizeEntry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        sizes.add(cleanSize);
      });
    });

    res.json({ sizes: Array.from(sizes) });
  } catch (error) {
    console.error("Error fetching sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});


// This endpoint is unused
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

/* ------------------------------
   End Points - qc2_orderdata
------------------------------ */

// Generate a random ID for the bundle
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



// Save bundle data to MongoDB
app.post("/api/save-bundle-data", async (req, res) => {
  try {
    const { bundleData } = req.body;
    const savedRecords = [];

    // Save each bundle record
    for (const bundle of bundleData) {
      // Get current package number for this MONo-Color-Size combination
      const packageCount = await QC2OrderData.countDocuments({
        selectedMono: bundle.selectedMono,
        color: bundle.color,
        size: bundle.size,
      });

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
        package_no: packageCount + 1,
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
        // Ensure user fields are included
        emp_id: bundle.emp_id,
        eng_name: bundle.eng_name,
        kh_name: bundle.kh_name || "",
        job_title: bundle.job_title || "",
        dept_name: bundle.dept_name,
        sect_name: bundle.sect_name || "",
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

//For Data tab display records in a table
app.get("/api/user-batches", async (req, res) => {
  try {
    const { emp_id } = req.query;
    if (!emp_id) {
      return res.status(400).json({ message: "emp_id is required" });
    }
    const batches = await QC2OrderData.find({ emp_id });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user batches" });
  }
});

/* ------------------------------
   End Points - Reprint - qc2 orders
------------------------------ */

// Reprint endpoints
app.get("/api/reprint-search-mono", async (req, res) => {
  try {
    const digits = req.query.digits;
    const results = await QC2OrderData.aggregate([
      {
        $match: {
          selectedMono: { $regex: `${digits}$` },
        },
      },
      {
        $group: {
          _id: "$selectedMono",
          count: { $sum: 1 },
        },
      },
      { $limit: 100 },
    ]);

    res.json(results.map((r) => r._id));
  } catch (error) {
    res.status(500).json({ error: "Failed to search MONo" });
  }
});

app.get("/api/reprint-colors-sizes/:mono", async (req, res) => {
  try {
    const mono = req.params.mono;
    const result = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } },
      {
        $group: {
          _id: {
            color: "$color",
            size: "$size",
          },
          colorCode: { $first: "$colorCode" },
          chnColor: { $first: "$chnColor" },
          package_no: { $first: "$package_no" }, // Add this line
        },
      },
      {
        $group: {
          _id: "$_id.color",
          sizes: { $push: "$_id.size" },
          colorCode: { $first: "$colorCode" },
          chnColor: { $first: "$chnColor" },
        },
      },
    ]);

    const colors = result.map((c) => ({
      color: c._id,
      sizes: c.sizes,
      colorCode: c.colorCode,
      chnColor: c.chnColor,
    }));

    res.json(colors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch colors/sizes" });
  }
});

app.get("/api/reprint-records", async (req, res) => {
  try {
    const { mono, color, size } = req.query;
    const records = await QC2OrderData.find({
      selectedMono: mono,
      color: color,
      size: size,
    }).sort({ package_no: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

/* ------------------------------
   End Points - Ironing
------------------------------ */

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

// New endpoint to get the last ironing record ID for a specific emp_id
app.get("/api/last-ironing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Ironing.findOne(
      { emp_id },
      {},
      { sort: { ironing_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.ironing_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last ironing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last ironing record ID" });
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

// Update qc2_orderdata with ironing details
app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { passQtyIron, ironing_updated_date, ironing_update_time } = req.body;

    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      {
        passQtyIron,
        ironing_updated_date,
        ironing_update_time,
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to update record" });
  }
});

// For Data tab display records in a table
app.get("/api/ironing-records", async (req, res) => {
  try {
    const records = await Ironing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ironing records" });
  }
});

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

// New endpoint to get the last ironing record ID for a specific emp_id
app.get("/api/last-ironing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Ironing.findOne(
      { emp_id },
      {},
      { sort: { ironing_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.ironing_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last ironing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last ironing record ID" });
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

// Update qc2_orderdata with ironing details
app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { passQtyIron, ironing_updated_date, ironing_update_time } = req.body;

    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      {
        passQtyIron,
        ironing_updated_date,
        ironing_update_time,
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to update record" });
  }
});

// For Data tab display records in a table
app.get("/api/ironing-records", async (req, res) => {
  try {
    const records = await Ironing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ironing records" });
  }
});

/* ------------------------------
   End Points - Washing
------------------------------ */

// Check if washing record exists
app.get("/api/check-washing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Washing.findOne({
      washing_bundle_id: req.params.bundleId,
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// New endpoint to get the last washing record ID for a specific emp_id
app.get("/api/last-washing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Washing.findOne(
      { emp_id },
      {},
      { sort: { washing_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.washing_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last washing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last washing record ID" });
  }
});

// Save washing record
app.post("/api/save-washing", async (req, res) => {
  try {
    const newRecord = new Washing(req.body);
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

// Update qc2_orderdata with washing details
app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { passQtyWash, washing_updated_date, washing_update_time } = req.body;
    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      {
        passQtyWash,
        washing_updated_date,
        washing_update_time,
      },
      { new: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to update record" });
  }
});

// For Data tab display records in a table
app.get("/api/washing-records", async (req, res) => {
  try {
    const records = await Washing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch washing records" });
  }
});



/* ------------------------------
   End Points - OPA
------------------------------ */

// Check if OPA record exists
app.get("/api/check-opa-exists/:bundleId", async (req, res) => {
  try {
    const record = await OPA.findOne({
      opa_bundle_id: req.params.bundleId,
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// New endpoint to get the last OPA record ID for a specific emp_id
app.get("/api/last-opa-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await OPA.findOne(
      { emp_id },
      {},
      { sort: { opa_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.opa_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last OPA record ID:", error);
    res.status(500).json({ error: "Failed to fetch last OPA record ID" });
  }
});

// Save OPA record
app.post("/api/save-opa", async (req, res) => {
  try {
    const newRecord = new OPA(req.body);
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

// Update qc2_orderdata with OPA details
app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { passQtyOPA, opa_updated_date, opa_update_time } = req.body;

    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      {
        passQtyOPA,
        opa_updated_date,
        opa_update_time,
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to update record" });
  }
});

// For Data tab display records in a table
app.get("/api/opa-records", async (req, res) => {
  try {
    const records = await OPA.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch OPA records" });
  }
});


/* ------------------------------
   End Points - Packing
------------------------------ */

// Check if Packing record exists
app.get("/api/check-packing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Packing.findOne({
      packing_bundle_id: req.params.bundleId,
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// New endpoint to get the last Packing record ID for a specific emp_id
app.get("/api/last-packing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Packing.findOne(
      { emp_id },
      {},
      { sort: { packing_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.packing_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last Packing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last Packing record ID" });
  }
});

// Save Packing record
app.post("/api/save-packing", async (req, res) => {
  try {
    const newRecord = new Packing(req.body);
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

// Update qc2_orderdata with Packing details
app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { passQtyPacking, packing_updated_date, packing_update_time } = req.body;
    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      {
        passQtyPacking,
        packing_updated_date,
        packing_update_time,
      },
      { new: true }
    );
    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to update record" });
  }
});

// For Data tab display records in a table
app.get("/api/packing-records", async (req, res) => {
  try {
    const records = await Packing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Packing records" });
  }
});

/* ------------------------------
   End Points - Live Dashboard - QC1
------------------------------ */

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

/* ------------------------------
   End Points - QC1
------------------------------ */

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






// app.put('/api/user-profile',authenticateUser, upload, async (req, res) => {
//   try {
//     const token = req.headers.authorization.split(' ')[1];
//     const decoded = jwt.verify(token, 'your_jwt_secret');
//     const userId = decoded.userId;
    

//     const updatedProfile = {
//       emp_id: req.body.emp_id,
//       name: req.body.name,
//       dept_name: req.body.dept_name,
//       sect_name: req.body.sect_name,
//       profile: req.file ? `profiles/${userId}/${req.file.filename}` : req.body.profile,
//       // profile: req.file ? `../storage/app/public/profiles/${userId}/${req.file.filename}` : req.body.profile, // Save file path
//     };

//     // console.log('Updated Profile:', updatedProfile);

//     const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, { new: true });

//     // console.log('Updated User:', user);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({ message: 'Profile updated successfully', user });
//   } catch (error) {
//     console.error('Error updating user profile:', error);
//     res.status(500).json({ message: 'Failed to update user profile', error: error.message });
//   }
// });

//-----------------------------END USER FUNCTION------------------------------------------------//

// Start the Server
/* ------------------------------
   End Points - Download Data
------------------------------ */

// Helper function to format date to MM/DD/YYYY

const formatDate = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

// New endpoint to get unique values for filters
app.get("/api/unique-values", async (req, res) => {
  try {
    const uniqueValues = await QC2OrderData.aggregate([
      {
        $group: {
          _id: null,
          moNos: { $addToSet: "$selectedMono" },
          styleNos: { $addToSet: "$custStyle" },
          lineNos: { $addToSet: "$lineNo" },
          colors: { $addToSet: "$color" },
          sizes: { $addToSet: "$size" },
          buyers: { $addToSet: "$buyer" },
        },
      },
    ]);

    const result = uniqueValues[0] || {
      moNos: [],
      styleNos: [],
      lineNos: [],
      colors: [],
      sizes: [],
      buyers: [],
    };

    delete result._id;
    Object.keys(result).forEach((key) => {
      result[key] = result[key].filter(Boolean).sort();
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching unique values:", error);
    res.status(500).json({ error: "Failed to fetch unique values" });
  }
});

// Updated endpoint to get filtered data
app.get("/api/download-data", async (req, res) => {
  try {
    let {
      startDate,
      endDate,
      type,
      taskNo,
      moNo,
      styleNo,
      lineNo,
      color,
      size,
      buyer,
      page = 1,
      limit = 50,
    } = req.query;

    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Format dates to match the stored format (MM/DD/YYYY)
    if (startDate) {
      startDate = formatDate(new Date(startDate));
    }
    if (endDate) {
      endDate = formatDate(new Date(endDate));
    }

    // Build match query
    const matchQuery = {};

    // Determine collection and date field based on type/taskNo
    const isIroning = type === "Ironing" || taskNo === "53";
    const collection = isIroning ? Ironing : QC2OrderData;
    const dateField = isIroning ? "ironing_updated_date" : "updated_date_seperator";

    // Date range filter
    if (startDate || endDate) {
      matchQuery[dateField] = {};
      if (startDate) matchQuery[dateField].$gte = startDate;
      if (endDate) matchQuery[dateField].$lte = endDate;
    }

    // Add other filters if they exist
    if (moNo) matchQuery.selectedMono = moNo;
    if (styleNo) matchQuery.custStyle = styleNo;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (buyer) matchQuery.buyer = buyer;

    // Add task number filter
    if (taskNo) {
      matchQuery.task_no = parseInt(taskNo);
    }

    console.log("Match Query:", JSON.stringify(matchQuery, null, 2)); // For debugging

    // Get total count
    const total = await collection.countDocuments(matchQuery);

    // Get paginated data
    const data = await collection
      .find(matchQuery)
      .sort({ [dateField]: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Found records:", data.length); // For debugging

    // Transform data for consistent response
    const transformedData = data.map((item) => {
      const date = item[dateField]; // Log the date field
      return {
        date: date,
        type: isIroning ? "Ironing" : "QC2 Order Data",
        taskNo: isIroning ? "53" : "52",
        selectedMono: item.selectedMono,
        custStyle: item.custStyle,
        lineNo: item.lineNo,
        color: item.color,
        size: item.size,
        buyer: item.buyer,
        bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id,
      };
    });

    res.json({
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching download data:", error);
    res.status(500).json({ error: "Failed to fetch download data" });
  }
});

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */

// Schema for qc2_inspection_pass_bundle with header fields as separate fields



// Endpoint to save inspection pass bundle data
app.post("/api/inspection-pass-bundle", async (req, res) => {
  try {
    const {
      bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      checkedQty,
      totalPass,
      totalRejects,
      defectQty,
      defectArray,
      inspection_time,
      inspection_date,
    } = req.body;

    const newRecord = new QC2InspectionPassBundle({
      bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      checkedQty,
      totalPass,
      totalRejects,
      defectQty,
      defectArray,
      inspection_time,
      inspection_date,
    });

    await newRecord.save();
    res.status(201).json({
      message: "Inspection pass bundle saved successfully",
      data: newRecord,
    });
  } catch (error) {
    console.error("Error saving inspection pass bundle:", error);
    res.status(500).json({
      message: "Failed to save inspection pass bundle",
      error: error.message,
    });
  }
});

// Endpoint to save reworks (reject garment) data
app.post("/api/reworks", async (req, res) => {
  try {
    const {
      bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      reworkGarments,
    } = req.body;

    const newRecord = new QC2Reworks({
      bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      reworkGarments,
    });
    await newRecord.save();
    res.status(201).json({
      message: "Reworks data saved successfully",
      data: newRecord,
    });
  } catch (error) {
    console.error("Error saving reworks data:", error);
    res.status(500).json({
      message: "Failed to save reworks data",
      error: error.message,
    });
  }
});



/* ------------------------------
   User Management old ENDPOINTS
------------------------------ */

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

// POST /users - Create an External User / Device
app.post("/users", async (req, res) => {
  try {
    const {
      emp_id,
      name,
      email,
      job_title,
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status, // Optional, but will default to "Working"
      password,
    } = req.body;

    console.log("Request body:", req.body);

    // >>> NEW: Check if a user with the same name already exists (case-insensitive)
    const existingUserByName = await UserMain.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingUserByName) {
      return res.status(400).json({
        message: "User already exist! Please Use different Name",
      });
    }
    // <<<

    // If emp_id is provided, check if it already exists
    if (emp_id) {
      const existingUser = await UserMain.findOne({ emp_id });
      if (existingUser) {
        return res.status(400).json({
          message: "Employee ID already exists. Please use a different ID.",
        });
      }
    }

    // Hash the password
    // const salt = await bcrypt.genSalt(12);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user with the provided fields.
    const newUser = new UserMain({
      emp_id,
      name,
      email,
      job_title: job_title || "External",
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status: working_status || "Working",
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

// app.post("/users", async (req, res) => {
//   try {
//     const { emp_id, name, email, roles, sub_roles, keywords, password } =
//       req.body;

//     // Log the incoming request body
//     console.log("Request body:", req.body);

//     // Check if the emp_id already exists
//     const existingUser = await UserMain.findOne({ emp_id });
//     if (existingUser) {
//       return res.status(400).json({
//         message: "Employee ID already exists. Please use a different ID.",
//       });
//     }

//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create a new user
//     const newUser = new UserMain({
//       emp_id,
//       name,
//       email,
//       roles,
//       sub_roles,
//       keywords,
//       password: hashedPassword,
//     });

//     // Save the user to the database
//     await newUser.save();

//     res.status(201).json(newUser);
//   } catch (error) {
//     console.error("Error creating user:", error);
//     res.status(500).json({ message: "Failed to create user" });
//   }
// });

// //Update
// app.put("/users/:id", async (req, res) => {
//   try {
//     const user = await UserMain.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     res.json(user);
//   } catch (error) {
//     console.error("Error updating user:", error);
//     res.status(500).json({ message: "Failed to update user" });
//   }
// });

//Delete
app.delete('/users/:id', async (req, res) => {
  try {
    await UserMain.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

//-----------------------------------------------------------//
// // Getting Roles
// app.get("/roles", async (req, res) => {
//   try {
//     const roles = await Role.find();
//     res.json(roles);
//   } catch (error) {
//     console.error("Error fetching roles:", error);
//     res.status(500).json({ error: "Failed to fetch roles" });
//   }
// });

// // Change role
// app.put("/users/:id", async (req, res) => {
//   try {
//     const { name, email, roles, sub_roles, keywords, password } = req.body;
//     const updatedUser = { name, email, keywords };

//     if (roles) {
//       updatedUser.roles = [...new Set(roles)]; // Remove duplicates
//     }

//     if (sub_roles) {
//       updatedUser.sub_roles = [...new Set(sub_roles)]; // Remove duplicates
//     }

//     if (password) {
//       const saltRounds = 12;
//       updatedUser.password = await bcrypt.hash(password, saltRounds); // Ensure you hash the password before saving
//     }

//     const user = await UserMain.findByIdAndUpdate(req.params.id, updatedUser, {
//       new: true,
//     });
//     res.json(user);
//   } catch (error) {
//     console.error("Error updating user:", error);
//     res.status(500).json({ message: "Failed to update user" });
//   }
// });
//-----------------------------------------------------------//

/* ----------------------------
   User Auth ENDPOINTS
------------------------------ */

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


// Multer Storage Setup
// ------------------------
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


// ------------------------


/* ------------------------------
   Login Authentication ENDPOINTS
------------------------------ */
// When Login get user data
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
    // console.log("Display user data:", user);

    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      profile: user.profile,
      face_photo: user.face_photo,
      roles: user.roles,
      sub_roles: user.sub_roles,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
  }
});

// Avoid Logout when Refresh
app.post("/api/refresh-token", async (req, res) => {
  try {
    // 
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
    if (!ymProdConnection.readyState) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const user = await UserMain.findOne({
      $or: [{ email: username }, { name: username }, { emp_id: username }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // console.log('user details:', user);

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
    // console.log('user:', isPasswordValid);

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

/* ------------------------------
   Registration - Login Page ENDPOINTS
------------------------------ */
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

app.post("/api/reset-password", async (req, res) => {
  try {
    const { emp_id, newPassword } = req.body;

    if (!emp_id || !newPassword) {
      return res.status(400).json({
        message: "Employee ID and new password are required",
      });
    }

    const user = await UserMain.findOne({ emp_id });

    if (!user) {
      return res.status(404).json({
        message: "Employee ID not found",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.updated_at = new Date();

    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reset password",
      error: error.message,
    });
  }
});

// ------------------------
// GET /api/user-profile
// ------------------------
app.get("/api/user-profile", authenticateUser, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "your_jwt_secret");
    const user = await UserMain.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine profile image:
    // Use the custom uploaded image if available; otherwise use face_photo; else fallback.
    let profileImage = "";
    if (user.profile && user.profile.trim() !== "") {
      profileImage = `http://localhost:5001/public/storage/profiles/${
        decoded.userId
      }/${path.basename(user.profile)}`;
    } else if (user.face_photo && user.face_photo.trim() !== "") {
      profileImage = user.face_photo;
    } else {
      profileImage = "/IMG/default-profile.png";
    }

    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      working_status: user.working_status,
      phone_number: user.phone_number,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      email: user.email,
      profile: profileImage, // URL for display
      face_photo: user.face_photo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});


// ------------------------

// PUT /api/user-profile
// ------------------------

// Fetch User Profile Endpoint
app.get('/api/user-profile', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await UserMain.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // console.log('User Data:', user);
    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      face_photo: user.face_photo,
      profile: user.profile ? `/public/storage/profiles/${decoded.userId}/${path.basename(user.profile)}` : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});


app.put("/api/user-profile", authenticateUser, upload, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "your_jwt_secret");
    const userId = decoded.userId;

    // Update additional fields along with existing ones.
    const updatedProfile = {
      emp_id: req.body.emp_id,
      name: req.body.name,
      dept_name: req.body.dept_name,
      sect_name: req.body.sect_name,
      phone_number: req.body.phone_number,
      eng_name: req.body.eng_name,
      kh_name: req.body.kh_name,
      job_title: req.body.job_title,
      email: req.body.email,
    };

    // If a new image was uploaded, update the profile field.
    if (req.file) {
      updatedProfile.profile = `profiles/${userId}/${req.file.filename}`;
    }

    // Update the user document in the main collection.
    const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, {
      new: true,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Update the phone_number in role_managment collection ---
    // For every document in role_managment that has a user with the same emp_id,
    // update that user's phone_number field.
    await RoleManagment.updateMany(
      { "users.emp_id": user.emp_id },
      { $set: { "users.$[elem].phone_number": user.phone_number } },
      { arrayFilters: [{ "elem.emp_id": user.emp_id }] }
    );

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "Failed to update user profile",
      error: error.message,
    });
  }
});


// /* ------------------------------
//    Super Admin ENDPOINTS
// ------------------------------ */

// Adding Super Admin End point
app.post("/api/role-management/super-admin", async (req, res) => {
  try {
    const { user } = req.body;

    let superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

    if (!superAdminRole) {
      superAdminRole = new RoleManagment({
        role: "Super Admin",
        jobTitles: ["Developer"],
        users: [],
      });
    }

    const userExists = superAdminRole.users.some(
      (u) => u.emp_id === user.emp_id
    );

    if (userExists) {
      return res.status(400).json({ message: "User is already a Super Admin" });
    }

    const userDetails = await UserMain.findOne(
      { emp_id: user.emp_id },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    superAdminRole.users.push({
      emp_id: userDetails.emp_id,
      name: userDetails.name,
      eng_name: userDetails.eng_name,
      kh_name: userDetails.kh_name,
      job_title: "Developer",
      dept_name: userDetails.dept_name,
      sect_name: userDetails.sect_name,
      working_status: userDetails.working_status,
      phone_number: userDetails.phone_number,
      face_photo: userDetails.face_photo,
    });

    await superAdminRole.save();
    res.json({ message: "Super Admin registered successfully" });
  } catch (error) {
    console.error("Error registering super admin:", error);
    res.status(500).json({ message: "Failed to register super admin" });
  }
});

// Delete Super Admin endpoint
app.delete("/api/role-management/super-admin/:empId", async (req, res) => {
  try {
    const { empId } = req.params;

    // Find the Super Admin role
    const superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

    if (!superAdminRole) {
      return res.status(404).json({ message: "Super Admin role not found" });
    }

    // Check if the employee ID is in the protected list
    const protectedEmpIds = ["YM6702", "YM7903"];
    if (protectedEmpIds.includes(empId)) {
      return res.status(403).json({
        message: "Cannot delete protected Super Admin users",
      });
    }

    // Find the user index in the users array
    const userIndex = superAdminRole.users.findIndex(
      (user) => user.emp_id === empId
    );

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found in Super Admin role",
      });
    }

    // Remove the user from the array using MongoDB update
    const result = await RoleManagment.updateOne(
      { role: "Super Admin" },
      {
        $pull: {
          users: { emp_id: empId },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        message: "Failed to remove Super Admin",
      });
    }

    // Fetch the updated document
    const updatedRole = await RoleManagment.findOne({ role: "Super Admin" });

    res.json({
      message: "Super Admin removed successfully",
      updatedRole: updatedRole,
    });
  } catch (error) {
    console.error("Error removing super admin:", error);
    res.status(500).json({ message: "Failed to remove super admin" });
  }
});

// /* ------------------------------
//    Role Management ENDPOINTS
// ------------------------------ */

app.get("/api/search-users", async (req, res) => {
  try {
    const { q } = req.query;
    const users = await UserMain.find(
      {
        emp_id: { $regex: q, $options: "i" },
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
});

app.get("/api/user-details", async (req, res) => {
  try {
    const { empId } = req.query;
    if (!empId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const user = await UserMain.findOne(
      { emp_id: empId, working_status: "Working" },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

app.get("/api/job-titles", async (req, res) => {
  try {
    const jobTitles = await UserMain.distinct("job_title", {
      working_status: "Working",
    });
    res.json(jobTitles.filter((title) => title));
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({ message: "Failed to fetch job titles" });
  }
});

app.get("/api/users-by-job-title", async (req, res) => {
  try {
    const { jobTitle } = req.query;
    const users = await UserMain.find(
      {
        job_title: jobTitle,
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by job title:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.post("/api/role-management", async (req, res) => {
  try {
    const { role, jobTitles } = req.body;

    const users = await UserMain.find(
      {
        job_title: { $in: jobTitles },
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    let roleDoc = await RoleManagment.findOne({ role });

    if (roleDoc) {
      roleDoc.jobTitles = jobTitles;
      roleDoc.users = users.map((user) => ({
        emp_id: user.emp_id,
        name: user.name,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        working_status: user.working_status,
        phone_number: user.phone_number,
        face_photo: user.face_photo,
      }));
    } else {
      roleDoc = new RoleManagment({
        role,
        jobTitles,
        users: users.map((user) => ({
          emp_id: user.emp_id,
          name: user.name,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
          working_status: user.working_status,
          phone_number: user.phone_number,
          face_photo: user.face_photo,
        })),
      });
    }

    await roleDoc.save();
    res.json({ message: `Role ${roleDoc ? "updated" : "added"} successfully` });
  } catch (error) {
    console.error("Error saving role:", error);
    res.status(500).json({ message: "Failed to save role" });
  }
});

// Update the /api/user-roles/:empId endpoint (remove duplicates and modify)
app.get("/api/user-roles/:empId", async (req, res) => {
  try {
    const { empId } = req.params;
    const roles = [];

    // Check Super Admin role first
    const superAdminRole = await RoleManagment.findOne({
      role: "Super Admin",
      "users.emp_id": empId,
    });

    if (superAdminRole) {
      roles.push("Super Admin");
      return res.json({ roles }); // Return early if Super Admin
    }

    // Check Admin role
    const adminRole = await RoleManagment.findOne({
      role: "Admin",
      "users.emp_id": empId,
    });

    if (adminRole) {
      roles.push("Admin");
      return res.json({ roles }); // Return early if Admin
    }

    // Get other roles
    const otherRoles = await RoleManagment.find({
      role: { $nin: ["Super Admin", "Admin"] },
      "users.emp_id": empId,
    });

    otherRoles.forEach((roleDoc) => {
      roles.push(roleDoc.role);
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Failed to fetch user roles" });
  }
});

// app.get("/api/user-roles/:empId", async (req, res) => {
//   try {
//     const { empId } = req.params;
//     const roles = [];

//     const userRoles = await RoleManagment.find({
//       "users.emp_id": empId,
//     });

//     userRoles.forEach((role) => {
//       roles.push(role.role);
//     });

//     res.json({ roles });
//   } catch (error) {
//     console.error("Error fetching user roles:", error);
//     res.status(500).json({ message: "Failed to fetch user roles" });
//   }
// });

app.get("/api/role-management", async (req, res) => {
  try {
    const roles = await RoleManagment.find({}).sort({
      role: 1, // Sort by role name
    });
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

// Get all roles from role_management collection
app.get("/api/role-management", async (req, res) => {
  try {
    const roles = await RoleManagment.find({});
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

// /* ------------------------------
//    User Management ENDPOINTS
// ------------------------------ */

// Get user roles
app.get("/api/user-roles/:empId", async (req, res) => {
  try {
    const { empId } = req.params;
    const roles = [];

    // Find all roles where this user exists
    const userRoles = await RoleManagment.find({
      "users.emp_id": empId,
    });

    userRoles.forEach((role) => {
      if (!["Super Admin", "Admin"].includes(role.role)) {
        roles.push(role.role);
      }
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Failed to fetch user roles" });
  }
});

// Update user roles
app.post("/api/update-user-roles", async (req, res) => {
  try {
    const { emp_id, currentRoles, newRoles, userData } = req.body;

    // Find roles to remove (in currentRoles but not in newRoles)
    const rolesToRemove = currentRoles.filter(
      (role) => !newRoles.includes(role)
    );

    // Find roles to add (in newRoles but not in currentRoles)
    const rolesToAdd = newRoles.filter((role) => !currentRoles.includes(role));

    // Remove user from roles
    for (const role of rolesToRemove) {
      const roleDoc = await RoleManagment.findOne({ role });
      if (roleDoc) {
        // Remove user from users array
        roleDoc.users = roleDoc.users.filter((u) => u.emp_id !== emp_id);

        // Check if there are any other users with the same job title
        const otherUsersWithSameTitle = roleDoc.users.some(
          (u) => u.job_title === userData.job_title
        );
        if (!otherUsersWithSameTitle) {
          roleDoc.jobTitles = roleDoc.jobTitles.filter(
            (t) => t !== userData.job_title
          );
        }

        await roleDoc.save();
      }
    }

    // Add user to new roles
    for (const role of rolesToAdd) {
      const roleDoc = await RoleManagment.findOne({ role });
      if (roleDoc) {
        // Add job title if not exists
        if (!roleDoc.jobTitles.includes(userData.job_title)) {
          roleDoc.jobTitles.push(userData.job_title);
        }

        // Add user if not exists
        if (!roleDoc.users.some((u) => u.emp_id === emp_id)) {
          roleDoc.users.push(userData);
        }

        await roleDoc.save();
      }
    }

    res.json({
      success: true,
      message: "User roles updated successfully",
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user roles",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
