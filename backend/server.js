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
import fsPromises from 'fs/promises';
import https from 'https';
import { Server } from "socket.io"; 
import axios from 'axios';
import cron from "node-cron";

//Import the Route Files
import userRoutes from "./routes/User/userRoutes.js";
import authRoutes from "./routes/User/authRoutes.js";
import roleManagementRoutes from "./routes/User/roleManagementRoutes.js";
import sqlQueryRoutes from "./routes/sql/sqlQueryRoutes.js";
import sqlSyncRoutes from "./routes/sql/sqlSyncRoutes.js";
import cutPanelOrderRoutes from "./routes/Cutting/cutPanelOrderRoutes.js";
import cuttingFabricDefectRoutes from "./routes/Cutting/cuttingFabricDefectRoutes.js";
import cuttingImageUploadRoutes from "./routes/Cutting/cuttingImageUploadRoutes.js";
import cuttingInspectionRoutes from "./routes/Cutting/cuttingInspectionRoutes.js";
import cuttingIssueRoutes from "./routes/Cutting/cuttingIssueRoutes.js";
import cuttingMesurmentRoutes from "./routes/Cutting/cuttingMeasurementRoutes.js";
import cuttingOrderRoutes from "./routes/Cutting/cuttingOrderRoutes.js";
import cuttingTrendRoutes from "./routes/Cutting/cuttingTrendRoutes.js";
import sccRoutes from "./routes/SCC/sccRoutes.js";
import sccImageUploadRoutes from "./routes/SCC/sccImageUploadRoutes.js";
import bundleRoutes from "./routes/Bundle/bundleRoutes.js";
import washingRoutes from "./routes/Washing/washingRoutes.js";
import opaRoutes from "./routes/OPA/opaRoutes.js";
import ironingRoutes from "./routes/Ironing/ironingRoutes.js";
import packingRoutes from "./routes/Packing/packingRoutes.js";
import qcInlineImageUploadRoutes from "./routes/QCInlineRoving/qcInlineImageUploadRoutes.js";
import qcInlineRovingRoutes from "./routes/QCInlineRoving/qcInlineRovingRoutes.js";
import qcInlineWorkerRoutes from "./routes/QCInlineRoving/qcInlineWorkerRoutes.js";
import qc2InspectionRoutes from "./routes/QC2Inspection/qc2InspectionRoutes.js";
import qc2RepairTrackingRoutes from "./routes/QC2RepairTracking/qc2RepairTrackingRoutes.js";
import downloadDataRoutes from "./routes//DownloadData/downloadDataRoutes.js";
import QC2DashboardRoutes from "./routes/LiveDashboard/qc2DashboardRoutes.js";
import processDashbiardRoutes from "./routes/LiveDashboard/processDashboardRoutes.js";
import qc1SunriseRoutes from "./routes/QC1Sunrise/qc1SunriseRoutes.js"; 
import aqlRoutes from "./routes/AQL/aqlRoutes.js";

// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "./config.js"; 
import {ymProdConnection,
  ymEcoConnection,
  UserMain,
  InlineOrders,
  CutPanelOrders,
  QCData,
  Role,
  QC2OrderData,
  RoleManagment,
  QC2InspectionPassBundle,
  QCInlineRoving,
  SewingDefects,
  DailyTestingHTFU,
  disconnectMongoDB,
} from "../backend/Config/mongodb.js";

import {
  initializePools,
  closeSQLPools,
} from "./Config/sqldb.js";

import {
    syncQC1SunriseData,
    syncInlineOrders,
    syncCuttingOrders,
    syncCutPanelOrders,
} from "./Controller/SQL/sqlSyncController.js";

/* ------------------------------
   Connection String
------------------------------ */
// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;



// Serve static files from the React app
// app.use(express.static(path.join(__dirname, '../build')));

// Catch all handler to return the React app for any request
// app.get('*', (req, res) => {
    // res.sendFile(path.join(__dirname, 'index.html'));
// });

const options = {
  key: fs.readFileSync(path.resolve(__dirname, '192.167.8.235-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '192.167.8.235.pem'))
};

// Create HTTPS server
const server = https.createServer(options, app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["https://192.167.8.235:3001", "http://localhost:3001",    // For local development (HTTP)
      "https://localhost:3001"],// Update with your frontend URL  //"https://localhost:3001"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  //path: "/socket.io",
  //transports: ["websocket"],
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


const allowedOrigins = ["https://192.167.8.235:3001", "http://localhost:3001", "https://localhost:3001"];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
//"mongodb://localhost:27017/ym_prod"

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Static file serving
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/storage', express.static(path.join(__dirname, '..', 'public', 'storage')));

// Routes
app.use(userRoutes); 
app.use(authRoutes); 
app.use(roleManagementRoutes); 
app.use(sqlQueryRoutes); 
app.use(sqlSyncRoutes); 
app.use(cutPanelOrderRoutes); 
app.use(cuttingFabricDefectRoutes);
app.use(cuttingImageUploadRoutes);
app.use(cuttingInspectionRoutes);
app.use(cuttingIssueRoutes);
app.use(cuttingMesurmentRoutes);
app.use(cuttingOrderRoutes);
app.use(cuttingTrendRoutes);
app.use(sccRoutes);
app.use(sccImageUploadRoutes);
app.use(bundleRoutes);
app.use(washingRoutes);
app.use(opaRoutes);
app.use(ironingRoutes);
app.use(packingRoutes);
app.use(qcInlineImageUploadRoutes);
app.use(qcInlineRovingRoutes);
app.use(qcInlineWorkerRoutes);
app.use(qc2InspectionRoutes);
app.use(qc2RepairTrackingRoutes);
app.use(downloadDataRoutes);
app.use(QC2DashboardRoutes);
app.use(processDashbiardRoutes);
app.use(qc1SunriseRoutes);
app.use(aqlRoutes);

// Drop the conflicting St_No_1 index if it exists
async function dropConflictingIndex() {
  try {
    const indexes = await InlineOrders.collection.getIndexes();
    if (indexes["St_No_1"]) {
      await InlineOrders.collection.dropIndex("St_No_1");
      console.log("Dropped conflicting St_No_1 index.");
    } else {
      console.log("St_No_1 index not found, no need to drop.");
    }
  } catch (err) {
    console.error("Error dropping St_No_1 index:", err);
  }
}


/* ------------------------------
   Initialize Pools and Run Initial Syncs
------------------------------ */

// Call this before initializePools
dropConflictingIndex().then(() => {
  initializePools()
    .then(() => {
      console.log("All SQL connection pools initialized successfully.");
      syncInlineOrders().then(() =>
        console.log("Initial inline_orders sync completed.")
      );
      syncCuttingOrders().then(() =>
        console.log("Initial cuttingOrders sync completed.")
      );
      syncCutPanelOrders().then(() =>
        console.log("Initial cutpanelorders sync completed.")
      );
      syncQC1SunriseData().then(() =>
        console.log("Initial QC1 Sunrise sync completed.")
      );
    })
    .catch((err) => {
      console.error("Failed to initialize SQL connection pools:", err);
      process.exit(1);
    });
});


// Schedule daily sync at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily QC1 Sunrise data sync...");
  try {
    await syncQC1SunriseData();
  } catch (err) {
    console.error("Error in daily QC1 Sunrise sync:", err);
  }
});



// Schedule the sync to run every day at 11 AM
cron.schedule("0 11 * * *", async () => {
  console.log("Running scheduled inline_orders sync at 11 AM...");
  await syncInlineOrders();
});

// Run the sync immediately on server start (optional, for testing)
syncInlineOrders().then(() => {
  console.log(
    "Initial inline_orders sync completed. Scheduler is now running..."
  );
});

// Updated Endpoint to Search MO Numbers (St_No) from inline_orders in MongoDB with partial matching
app.get("/api/inline-orders-mo-numbers", async (req, res) => {
  try {
    const searchTerm = req.query.search; // Get the search term from query params
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Use a case-insensitive regex to match the term anywhere in St_No
    const regexPattern = new RegExp(searchTerm, "i");

    // Query the inline_orders collection
    const results = await InlineOrders.find({
      St_No: { $regex: regexPattern }
    })
      .select("St_No") // Only return the St_No field (equivalent to .project({ St_No: 1, _id: 0 }))
      .limit(100) // Limit results to prevent overwhelming the UI
      .sort({ St_No: 1 }) // Sort alphabetically
      .exec();

    // Extract unique St_No values
    const uniqueMONos = [...new Set(results.map((r) => r.St_No))];

    res.json(uniqueMONos);
  } catch (err) {
    console.error("Error fetching MO numbers from inline_orders:", err);
    res.status(500).json({
      message: "Failed to fetch MO numbers from inline_orders",
      error: err.message
    });
  }
});

// New Endpoint to Fetch Inline Order Details for a given MO No (St_No)
app.get("/api/inline-orders-details", async (req, res) => {
  try {
    const stNo = req.query.stNo;
    if (!stNo) {
      return res.status(400).json({ error: "St_No is required" });
    }

    // Find the document where St_No matches
    const document = await InlineOrders.findOne({ St_No: stNo }).exec();

    if (!document) {
      return res.status(404).json({ error: "MO No not found" });
    }

    res.json(document);
  } catch (err) {
    console.error("Error fetching Inline Order details:", err);
    res.status(500).json({
      message: "Failed to fetch Inline Order details",
      error: err.message
    });
  }
});



/* ------------------------------
   Schedule Daily Sync
------------------------------ */

cron.schedule("0 7 * * *", async () => {
  console.log("Running scheduled cuttingOrders sync at 7 AM...");
  try {
    await syncCuttingOrders();
  } catch (err) {
    console.error("Scheduled cuttingOrders sync failed:", err);
  }
});

/* ------------------------------
   New Endpoints for CutPanelOrders
------------------------------ */

// Endpoint to Search MO Numbers (StyleNo) from cutpanelorders with partial matching
app.get("/api/cutpanel-orders-mo-numbers", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const regexPattern = new RegExp(searchTerm, "i");

    const results = await CutPanelOrders.find({
      StyleNo: { $regex: regexPattern }
    })
      .select("StyleNo")
      .limit(100)
      .sort({ StyleNo: 1 })
      .exec();

    const uniqueMONos = [...new Set(results.map((r) => r.StyleNo))];

    res.json(uniqueMONos);
  } catch (err) {
    console.error("Error fetching MO numbers from cutpanelorders:", err);
    res.status(500).json({
      message: "Failed to fetch MO numbers from cutpanelorders",
      error: err.message
    });
  }
});

// Endpoint to Fetch Table Nos for a given MO No (StyleNo)
app.get("/api/cutpanel-orders-table-nos", async (req, res) => {
  try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "StyleNo is required" });
    }

    const results = await CutPanelOrders.find({ StyleNo: styleNo })
      .select("TableNo")
      .exec();

    const uniqueTableNos = [...new Set(results.map((r) => r.TableNo))].filter(
      (table) => table
    );

    res.json(uniqueTableNos);
  } catch (err) {
    console.error("Error fetching Table Nos from cutpanelorders:", err);
    res.status(500).json({
      message: "Failed to fetch Table Nos from cutpanelorders",
      error: err.message
    });
  }
});

// Endpoint to Fetch Cut Panel Order Details for a given MO No (StyleNo) and TableNo
app.get("/api/cutpanel-orders-details", async (req, res) => {
  try {
    const { styleNo, tableNo } = req.query;
    if (!styleNo || !tableNo) {
      return res
        .status(400)
        .json({ error: "StyleNo and TableNo are required" });
    }

    const document = await CutPanelOrders.findOne({
      StyleNo: styleNo,
      TableNo: tableNo
    }).exec();

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  } catch (err) {
    console.error("Error fetching Cut Panel Orders details:", err);
    res.status(500).json({
      message: "Failed to fetch Cut Panel Orders details",
      error: err.message
    });
  }
});

// Endpoint to Fetch Total Order Quantity for unique StyleNo and Color combinations
app.get("/api/cutpanel-orders-total-order-qty", async (req, res) => {
  try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "StyleNo is required" });
    }

    const results = await CutPanelOrders.aggregate([
      // Match documents for the given StyleNo
      { $match: { StyleNo: styleNo } },
      // Group by StyleNo and Color to deduplicate and sum TotalOrderQty
      {
        $group: {
          _id: { StyleNo: "$StyleNo", Color: "$Color" },
          totalOrderQty: { $sum: "$TotalOrderQty" }
        }
      },
      // Group all results to get the overall sum
      {
        $group: {
          _id: null,
          overallTotalOrderQty: { $sum: "$totalOrderQty" }
        }
      },
      // Project only the overallTotalOrderQty field
      {
        $project: {
          _id: 0,
          overallTotalOrderQty: 1
        }
      }
    ]).exec();

    if (results.length === 0) {
      return res.json({ overallTotalOrderQty: 0 });
    }

    res.json(results[0]);
  } catch (err) {
    console.error(
      "Error fetching total order quantity from cutpanelorders:",
      err
    );
    res.status(500).json({
      message: "Failed to fetch total order quantity from cutpanelorders",
      error: err.message
    });
  }
});

// Endpoint to get aggregated TotalOrderQty for a given StyleNo (MO No)
// This sums the TotalOrderQty for each unique color associated with the StyleNo.
app.get("/api/cutpanel-orders/aggregated-total-order-qty", async (req, res) => {
  try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "StyleNo (MO No) is required" });
    }

    // Find one document matching the StyleNo and project only TotalOrderQtyStyle
    const result = await CutPanelOrders.findOne(
      { StyleNo: styleNo },
      { TotalOrderQtyStyle: 1 }
    );

    if (result && result.TotalOrderQtyStyle !== undefined) {
      res.json({ aggregatedTotalOrderQty: result.TotalOrderQtyStyle });
    } else {
      // If no matching StyleNo or TotalOrderQtyStyle is undefined, return 0
      res.json({ aggregatedTotalOrderQty: 0 });
    }
  } catch (err) {
    console.error("Error fetching aggregated total order quantity:", err);
    res.status(500).json({
      message: "Failed to fetch aggregated total order quantity",
      error: err.message
    });
  }
});


/* ------------------------------
   Graceful Shutdown
------------------------------ */

process.on("SIGINT", async () => {
  try {
     await closeSQLPools();
     await disconnectMongoDB();
    console.log("SQL connection pools closed.");
  } catch (err) {
    console.error("Error closing SQL connection pools:", err);
  } finally {
    process.exit(0);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ------------------------------
   End Points - SewingDefects
------------------------------ */
app.get('/api/sewing-defects', async (req, res) => {
  try {
    // Extract query parameters
    const { categoryEnglish, type, isCommon } = req.query;

    // Build filter object based on provided query parameters
    const filter = {};
    if (categoryEnglish) filter.categoryEnglish = categoryEnglish;
    if (type) filter.type = type;
    if (isCommon) filter.isCommon = isCommon;

    // Fetch defects from the database
    const defects = await SewingDefects.find(filter);

    // Send the response with fetched defects
    res.json(defects);
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message });
  }
});

// DELETE a defect by code
app.delete("/api/sewing-defects/:defectCode", async (req, res) => {
  try {
    const { defectCode } = req.params;
    const result = await SewingDefects.findOneAndDelete({ code: defectCode });

    if (!result) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.status(200).json({ message: "Defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting defect:", error);
    res.status(500).json({ message: "Failed to delete defect", error: error.message });
  }
});


/* ------------------------------
   End Points - dt_orders
------------------------------ */

// This endpoint is unused
async function fetchOrderDetails(mono) {
  const collection = ymEcoConnection.db.collection("dt_orders");
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

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */


/* ------------------------------
   End Points - Reprint - qc2_orderdata
------------------------------ */

// Combined search endpoint for MONo, Package No, and Emp ID from qc2_orderdata
app.get("/api/reprint-search", async (req, res) => {
  try {
    const { mono, packageNo, empId } = req.query;

    // Build the query dynamically based on provided parameters
    const query = {};
    if (mono) {
      query.selectedMono = { $regex: mono, $options: "i" }; // Case-insensitive partial match
    }
    if (packageNo) {
      const packageNoInt = parseInt(packageNo);
      if (!isNaN(packageNoInt)) {
        query.package_no = packageNoInt; // Exact match for integer
      }
    }
    if (empId) {
      query.emp_id = { $regex: empId, $options: "i" }; // Case-insensitive partial match
    }

    // Fetch matching records from qc2_orderdata
    const records = await QC2OrderData.find(query)
      .sort({ package_no: 1 }) // Sort by package_no ascending
      .limit(100); // Limit to prevent overload

    res.json(records);
  } catch (error) {
    console.error("Error searching qc2_orderdata:", error);
    res.status(500).json({ error: "Failed to search records" });
  }
});

// Fetch colors and sizes for a specific MONo (unchanged)
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
          package_no: { $first: "$package_no" },
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

/* ------------------------------
   End Points - Ironing
------------------------------ */

/* ------------------------------
   End Points - Washing
------------------------------ */

/* ------------------------------
   End Points - OPA
------------------------------ */


 /* ------------------------------
    End Points - Packing
 ------------------------------ */

/* ------------------------------
  PUT Endpoints - Update QC2 Order Data
------------------------------ */

app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { inspectionType, process, data } = req.body;

    if (!["first", "defect"].includes(inspectionType)) {
      return res.status(400).json({ error: "Invalid inspection type" });
    }

    const updateField =
      inspectionType === "first" ? "inspectionFirst" : "inspectionDefect";
    const updateOperation = {
      $push: {
        [updateField]: {
          process,
          ...data
        }
      }
    };

    // For defect scans, ensure defect_print_id is provided
    if (inspectionType === "defect" && !data.defect_print_id) {
      return res
        .status(400)
        .json({ error: "defect_print_id is required for defect scans" });
    }

    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      updateOperation,
      { new: true, upsert: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    console.error("Error updating qc2_orderdata:", error);
    res
      .status(500)
      .json({ error: "Failed to update record", details: error.message });
  }
});

/* ------------------------------
   End Points - Live Dashboard - QC1
------------------------------ */

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const { factory, lineNo, moNo, customer, timeInterval = "1" } = req.query;
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
          latestDefectArray: { $last: "$defectArray" },
          latestHeaderData: { $last: "$headerData" }
        }
      }
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
          count: { $sum: "$defectArray.count" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // In server.js, replace the timeSeriesData aggregation with:
    const timeSeriesData = await QCData.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          timeComponents: {
            $let: {
              vars: {
                timeParts: { $split: ["$formattedTimestamp", ":"] }
              },
              in: {
                hours: { $toInt: { $arrayElemAt: ["$$timeParts", 0] } },
                minutes: { $toInt: { $arrayElemAt: ["$$timeParts", 1] } },
                seconds: { $toInt: { $arrayElemAt: ["$$timeParts", 2] } }
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalMinutes: {
            $add: [
              { $multiply: ["$timeComponents.hours", 60] },
              "$timeComponents.minutes"
            ]
          }
        }
      },
      {
        $sort: { timestamp: 1 }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: { $eq: [parseInt(timeInterval), 1] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 1] } },
                      1
                    ]
                  }
                },
                {
                  case: { $eq: [parseInt(timeInterval), 15] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 15] } },
                      15
                    ]
                  }
                },
                {
                  case: { $eq: [parseInt(timeInterval), 30] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 30] } },
                      30
                    ]
                  }
                },
                {
                  case: { $eq: [parseInt(timeInterval), 60] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 60] } },
                      60
                    ]
                  }
                }
              ],
              default: "$totalMinutes"
            }
          },
          // Use last record for the time period to get cumulative values
          cumulativeChecked: { $last: "$cumulativeChecked" },
          cumulativeDefects: { $last: "$cumulativeDefects" }
        }
      },
      {
        $project: {
          timestamp: {
            $switch: {
              branches: [
                {
                  case: { $eq: [parseInt(timeInterval), 60] },
                  then: { $toString: { $divide: ["$_id", 60] } }
                }
              ],
              default: { $toString: "$_id" }
            }
          },
          checkedQty: "$cumulativeChecked",
          defectQty: "$cumulativeDefects",
          defectRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      "$cumulativeDefects",
                      { $max: ["$cumulativeChecked", 1] }
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
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
        defectRate: totalInspected
          ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
          : 0,
        defectRatio: totalInspected
          ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(
              2
            )
          : 0
      },
      defectRateByLine,
      defectRateByMO,
      defectRateByCustomer,
      topDefects,
      timeSeriesData
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

/* ------------------------------
   End Points - QC1
------------------------------ */

//-----------------------------USER FUNCTION------------------------------------------------//

/* ------------------------------
   AQL ENDPOINTS
------------------------------ */

/* ------------------------------
   End Points - Download Data
------------------------------ */

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */

// Edit the Inspection Data
app.put("/api/qc2-inspection-pass-bundle/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // console.log(`Received request to update record with ID: ${id}`);
    // console.log(`Update Data: ${JSON.stringify(updateData)}`);
    const updatedRecord = await QC2InspectionPassBundle.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedRecord) {
      // console.log(`Record with ID: ${id} not found`);
      return res.status(404).send({ message: "Record not found" });
    }
    // console.log(`Record with ID: ${id} updated successfully`);
    res.send(updatedRecord);
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ------------------------------
   Emp id for Inspector Data
------------------------------ */

// Endpoint to fetch a specific user by emp_id
app.get("/api/users/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const user = await UserMain.findOne(
      { emp_id },
      "emp_id eng_name face_photo"
    ).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(
      `Error fetching user with emp_id ${req.params.emp_id}:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/* ------------------------------
   QC2 - Repair Tracking
------------------------------ */

/* ------------------------------
   QC2 - Reworks
------------------------------ */

/* ------------------------------
   QC2 - Defect Print
------------------------------ */

/* ------------------------------
   QC2 OrderData Live Dashboard
------------------------------ */

/* ------------------------------
   QC2 Washing Live Dashboard
------------------------------ */

/* ------------------------------
   Ironing Live Dashboard Endpoints
------------------------------ */

/* ------------------------------
   OPA Live Dashboard Endpoints
------------------------------ */

/* ------------------------------
   QC Inline Roving ENDPOINTS
------------------------------ */

// Serve static files (for accessing uploaded images)
app.use("/storage", express.static(path.join(__dirname, "../public/storage")));

/* ------------------------------
   QC Inline Roving New
------------------------------ */

// Roving data filter function
app.get("/api/qc-inline-roving-reports/filtered", async (req, res) => {
  try {
    const { inspection_date, qcId, operatorId, lineNo, moNo } = req.query;

    let queryConditions = {};

    if (inspection_date) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(inspection_date)) {
        const parts = inspection_date.split("/");

        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        const monthRegexPart = month < 10 ? `0?${month}` : `${month}`;
        const dayRegexPart = day < 10 ? `0?${day}` : `${day}`;

        const dateRegex = new RegExp(`^${monthRegexPart}\\/${dayRegexPart}\\/${year}$`);
        queryConditions.inspection_date = { $regex: dateRegex };
      } else {
        console.warn(
          "Received date for filtering is not in MM/DD/YYYY format:",
          inspection_date,
          "- Date filter will not be applied effectively."
        );
      }
    }

    if (qcId) {
      queryConditions.emp_id = qcId;
    }

    if (lineNo) {
      queryConditions.line_no = lineNo;
    }

    if (moNo) {
      queryConditions.mo_no = moNo;
    }

    if (operatorId) {
      const orConditions = [{ operator_emp_id: operatorId }];
      if (/^\d+$/.test(operatorId)) {
        orConditions.push({ operator_emp_id: parseInt(operatorId, 10) });
      }
      queryConditions.inlineData = { $elemMatch: { $or: orConditions } };
    }

    const reports = await QCInlineRoving.find(queryConditions);

    res.json(reports);
  } catch (error) {
    console.error("Error fetching filtered QC inline roving reports:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch filtered reports", error: error.message });
  }
});

const sanitize = (input) => {
  if (typeof input !== "string") input = String(input);
  let sane = input.replace(/[^a-zA-Z0-9-_]/g, "_");
  if (sane === "." || sane === "..") return "_";
  return sane;
};

const rovingStorage = multer.memoryStorage();

const rovingUpload = multer({
  storage: rovingStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /^(jpeg|jpg|png|gif)$/i;
    const allowedMimeTypes = /^image\/(jpeg|pjpeg|png|gif)$/i;
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    const isExtAllowed = allowedExtensions.test(fileExt);
    const isMimeAllowed = allowedMimeTypes.test(file.mimetype.toLowerCase());
    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else {
      console.error(
        `File rejected by filter: name='${file.originalname}', mime='${file.mimetype}', ext='${fileExt}'. IsMimeAllowed: ${isMimeAllowed}, IsExtAllowed: ${isExtAllowed}`
      );
      cb(new Error("Error: Images Only! (jpeg, jpg, png, gif)"));
    }
  },
});

//Roving image upload
app.post("/api/roving/upload-roving-image",rovingUpload.single("imageFile"),async (req, res) => {
    try {
      const { imageType, date, lineNo, moNo, operationId } = req.body;
      const imageFile = req.file;
      if (!imageFile) {
        const errorMessage =
          req.fileValidationError ||
          (req.multerError && req.multerError.message) ||
          "No image file provided or file rejected by filter.";
        return res.status(400).json({ success: false, message: errorMessage });
      }

      if (
        !date ||
        !lineNo ||
        lineNo === "NA_Line" ||
        !moNo ||
        moNo === "NA_MO" ||
        !operationId ||
        operationId === "NA_Op"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Missing or invalid required metadata: date, lineNo, moNo, operationId must be actual values.",
          });
      }

      if (!imageType || !["spi", "measurement"].includes(imageType.toLowerCase())) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid image type. Must be "spi" or "measurement".' });
      }

      const sanitizedDate = sanitize(date);
      const sanitizedLineNo = sanitize(lineNo);
      const sanitizedMoNo = sanitize(moNo);
      const sanitizedOperationId = sanitize(operationId);
      const upperImageType = imageType.toUpperCase();

      const targetDir = path.resolve(
        __dirname,
        "..",
        "public",
        "storage",
        "roving",
        upperImageType
      );
      await fsPromises.mkdir(targetDir, { recursive: true });

      const imagePrefix = `${sanitizedDate}_${sanitizedLineNo}_${sanitizedMoNo}_${sanitizedOperationId}_`;
      let existingImageCount = 0;
      try {
        const filesInDir = await fsPromises.readdir(targetDir);
        filesInDir.forEach((file) => {
          if (file.startsWith(imagePrefix)) {
            existingImageCount++;
          }
        });
      } catch (readDirError) {
        if (readDirError.code !== "ENOENT") {
                    console.error("Error reading directory for indexing:", targetDir, readDirError);
        }
      }

      const imageIndex = existingImageCount + 1;
      const fileExtension = path.extname(imageFile.originalname);
      const newFilename = `${imagePrefix}${imageIndex}${fileExtension}`;
      const filePathInPublic = path.join(targetDir, newFilename);
      await fsPromises.writeFile(filePathInPublic, imageFile.buffer);
      const publicUrl = `/storage/roving/${upperImageType}/${newFilename}`;
      res.json({ success: true, filePath: publicUrl, filename: newFilename });
    } catch (error) {
      console.error("Error uploading roving image:", error);
      if (error.message && error.message.startsWith("Error: Images Only!")) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Multer error: ${error.message}` });
      }
      res.status(500).json({ success: false, message: "Server error during image upload." });
    }
  }
);

/* ------------------------------
   QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

/* ------------------------------
   Defect Buyer Status ENDPOINTS
------------------------------ */

// Endpoint for /api/defects/all-details
app.get("/api/defects/all-details", async (req, res) => {
  try {
    const defects = await SewingDefects.find({}).lean();
    const transformedDefects = defects.map(defect => ({
      code: defect.code.toString(),
      name_en: defect.english,
      name_kh: defect.khmer,
      name_ch: defect.chinese,
      categoryEnglish: defect.categoryEnglish,
      type: defect.type,
      repair: defect.repair,
      statusByBuyer: defect.statusByBuyer || [],
    }));
    res.json(transformedDefects);
  } catch (error) {
    console.error("Error fetching all defect details:", error);
    res.status(500).json({ message: "Failed to fetch defect details", error: error.message });
  }
});

// Endpoint for /api/buyers
app.get("/api/buyers", (req, res) => {
  const buyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];
  res.json(buyers);
});

// New Endpoint for updating buyer statuses in SewingDefects
app.post("/api/sewing-defects/buyer-statuses", async (req, res) => {
  try {
    const statusesPayload = req.body; 
    if (!Array.isArray(statusesPayload)) {
      return res.status(400).json({ message: "Invalid payload: Expected an array of statuses." });
    }
    const updatesByDefect = statusesPayload.reduce((acc, status) => {
      const defectCode = status.defectCode; 
      if (!acc[defectCode]) {
        acc[defectCode] = [];
      }
   acc[defectCode].push({
        buyerName: status.buyerName,
        defectStatus: Array.isArray(status.defectStatus) ? status.defectStatus : [], 
        isCommon: ["Critical", "Major", "Minor"].includes(status.isCommon) ? status.isCommon : "Minor",
      });
      return acc;
    }, {});

    const bulkOps = [];
    for (const defectCodeStr in updatesByDefect) {
      const defectCodeNum = parseInt(defectCodeStr, 10); 
      if (isNaN(defectCodeNum)) {
          console.warn(`Invalid defectCode received: ${defectCodeStr}, skipping.`);
          continue; 
      }
      const newStatusByBuyerArray = updatesByDefect[defectCodeStr];
      bulkOps.push({
        updateOne: {
          filter: { code: defectCodeNum }, 
          update: { $set: { statusByBuyer: newStatusByBuyerArray, updatedAt: new Date() } },
        },
      });
    }
    if (bulkOps.length > 0) {
      await SewingDefects.bulkWrite(bulkOps);
    }
    res.status(200).json({ message: "Defect buyer statuses updated successfully in SewingDefects." });
  } catch (error) {
    console.error("Error updating defect buyer statuses:", error);
    res.status(500).json({ message: "Failed to update defect buyer statuses", error: error.message });
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

/* ------------------------------
   End Points - Digital Measurement
------------------------------ */

// New endpoint for filter options
app.get("/api/filter-options", async (req, res) => {
  try {
    const { factory, mono, custStyle, buyer, mode, country, origin, stage } =
      req.query;
    const orderFilter = {};
    if (factory) orderFilter.Factory = factory;
    if (mono) orderFilter.Order_No = mono;
    if (custStyle) orderFilter.CustStyle = custStyle;
    if (buyer) orderFilter.ShortName = buyer;
    if (mode) orderFilter.Mode = mode;
    if (country) orderFilter.Country = country;
    if (origin) orderFilter.Origin = origin;

    const factories = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("Factory", orderFilter);
    const monos = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("Order_No", orderFilter);
    const custStyles = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("CustStyle", orderFilter);
    const buyers = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("ShortName", orderFilter);
    const modes = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("Mode", orderFilter);
    const countries = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("Country", orderFilter);
    const origins = await ymEcoConnection.db
      .collection("dt_orders")
      .distinct("Origin", orderFilter);

    // Fetch distinct stages from measurement_data, filtered by dt_orders
    let measurementFilter = {};
    if (mono) {
      const order = await ymEcoConnection.db
        .collection("dt_orders")
        .findOne({ Order_No: mono }, { projection: { _id: 1 } });
      if (order) {
        measurementFilter.style_id = order._id.toString();
      }
    } else {
      const filteredOrders = await ymEcoConnection.db
        .collection("dt_orders")
        .find(orderFilter, { projection: { _id: 1 } })
        .toArray();
      const orderIds = filteredOrders.map((order) => order._id.toString());
      measurementFilter.style_id = { $in: orderIds };
    }
    if (stage) {
      measurementFilter.stage = stage;
    }

    const stages = await ymEcoConnection.db
      .collection("measurement_data")
      .distinct("stage", measurementFilter);

    // Fetch distinct emp_ids from UserMain where working_status is "Working"
    const empIds = await UserMain.distinct("emp_id", {
      working_status: "Working",
      emp_id: { $ne: null } // Ensure emp_id is not null
    });

    // Add minDate and maxDate from measurement_data
    const dateRange = await ymEcoConnection.db
      .collection("measurement_data")
      .aggregate([
        {
          $group: {
            _id: null,
            minDate: { $min: "$created_at" },
            maxDate: { $max: "$created_at" }
          }
        }
      ])
      .toArray();
    const minDate = dateRange.length > 0 ? dateRange[0].minDate : null;
    const maxDate = dateRange.length > 0 ? dateRange[0].maxDate : null;

    res.json({
      factories,
      monos,
      custStyles,
      buyers,
      modes,
      countries,
      origins,
      stages, // Added stages
      empIds, // Added empIds
      minDate,
      maxDate
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// New endpoint for buyer spec order details
app.get("/api/buyer-spec-order-details/:mono", async (req, res) => {
  try {
    const collection = ymEcoConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorSizeMap = {};
    const sizes = new Set();
    order.OrderColors.forEach((colorObj) => {
      const color = colorObj.Color.trim();
      colorSizeMap[color] = {};
      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
        const quantity = sizeEntry[sizeName];
        if (quantity > 0) {
          colorSizeMap[color][sizeName] = quantity;
          sizes.add(sizeName);
        }
      });
    });

    // Apply the same tolerance correction logic as in /api/measurement-details
    const buyerSpec = order.SizeSpec.map((spec) => {
      // Adjust tolMinus and tolPlus to their fractional parts
      const tolMinusMagnitude =
        Math.abs(spec.ToleranceMinus.decimal) >= 1
          ? Math.abs(spec.ToleranceMinus.decimal) -
            Math.floor(Math.abs(spec.ToleranceMinus.decimal))
          : Math.abs(spec.ToleranceMinus.decimal);
      const tolPlusMagnitude =
        Math.abs(spec.TolerancePlus.decimal) >= 1
          ? Math.abs(spec.TolerancePlus.decimal) -
            Math.floor(Math.abs(spec.TolerancePlus.decimal))
          : Math.abs(spec.TolerancePlus.decimal);

      return {
        seq: spec.Seq,
        measurementPoint: spec.EnglishRemark,
        chineseRemark: spec.ChineseArea,
        tolMinus: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude, // Ensure tolMinus is negative
        tolPlus: tolPlusMagnitude,
        specs: spec.Specs.reduce((acc, sizeSpec) => {
          const sizeName = Object.keys(sizeSpec)[0];
          acc[sizeName] = sizeSpec[sizeName].decimal;
          return acc;
        }, {})
      };
    });

    res.json({
      moNo: order.Order_No,
      custStyle: order.CustStyle || "N/A",
      buyer: order.ShortName || "N/A",
      mode: order.Mode || "N/A",
      country: order.Country || "N/A",
      origin: order.Origin || "N/A",
      orderQty: order.TotalQty,
      colors: Object.keys(colorSizeMap),
      sizes: Array.from(sizes),
      colorSizeMap,
      buyerSpec
    });
  } catch (error) {
    console.error("Error fetching buyer spec order details:", error);
    res.status(500).json({ error: "Failed to fetch buyer spec order details" });
  }
});

// New endpoint for paginated MO Nos
app.get("/api/paginated-monos", async (req, res) => {
  try {
    const {
      page = 1,
      factory,
      custStyle,
      buyer,
      mode,
      country,
      origin
    } = req.query;
    const pageSize = 1; // One MO No per page
    const skip = (parseInt(page) - 1) * pageSize;

    const filter = {};
    if (factory) filter.Factory = factory;
    if (custStyle) filter.CustStyle = custStyle;
    if (buyer) filter.ShortName = buyer;
    if (mode) filter.Mode = mode;
    if (country) filter.Country = country;
    if (origin) filter.Origin = origin;

    const total = await ymEcoConnection.db
      .collection("dt_orders")
      .countDocuments(filter);
    const monos = await ymEcoConnection.db
      .collection("dt_orders")
      .find(filter)
      .project({ Order_No: 1, _id: 0 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    res.json({
      monos: monos.map((m) => m.Order_No),
      totalPages: Math.ceil(total / pageSize),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Error fetching paginated MONos:", error);
    res.status(500).json({ error: "Failed to fetch paginated MONos" });
  }
});

// New endpoint for overall measurement summary
app.get("/api/measurement-summary", async (req, res) => {
  try {
    const {
      factory,
      startDate,
      endDate,
      mono,
      custStyle,
      buyer,
      empId,
      stage
    } = req.query;
    const orderFilter = {};
    if (factory) orderFilter.Factory = factory;
    if (mono) orderFilter.Order_No = mono;
    if (custStyle) orderFilter.CustStyle = custStyle;
    if (buyer) orderFilter.ShortName = buyer;

    const selectedOrders = await ymEcoConnection.db
      .collection("dt_orders")
      .find(orderFilter)
      .toArray();
    const orderIds = selectedOrders.map((order) => order._id.toString());

    const measurementFilter = { style_id: { $in: orderIds } };
    if (startDate || endDate) {
      measurementFilter.created_at = {};
      if (startDate) {
        measurementFilter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        measurementFilter.created_at.$lte = end;
      }
    }

    if (empId) measurementFilter["user.name"] = empId;

    if (stage) measurementFilter.stage = stage;

    const measurementRecords = await ymEcoConnection.db
      .collection("measurement_data")
      .find(measurementFilter)
      .toArray();
    const orderIdToSizeSpec = {};
    selectedOrders.forEach((order) => {
      orderIdToSizeSpec[order._id.toString()] = order.SizeSpec.map((spec) => {
        const tolMinusMagnitude =
          Math.abs(spec.ToleranceMinus.decimal) >= 1
            ? Math.abs(spec.ToleranceMinus.decimal) -
              Math.floor(Math.abs(spec.ToleranceMinus.decimal))
            : Math.abs(spec.ToleranceMinus.decimal);
        const tolPlusMagnitude =
          Math.abs(spec.TolerancePlus.decimal) >= 1
            ? Math.abs(spec.TolerancePlus.decimal) -
              Math.floor(Math.abs(spec.TolerancePlus.decimal))
            : Math.abs(spec.TolerancePlus.decimal);

        return {
          ...spec,
          ToleranceMinus: {
            decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
          },
          TolerancePlus: { decimal: tolPlusMagnitude }
        };
      });
    });

    let orderQty = selectedOrders.reduce(
      (sum, order) => sum + order.TotalQty,
      0
    );
    let inspectedQty = measurementRecords.length;
    let totalPass = 0;

    measurementRecords.forEach((record) => {
      const sizeSpec = orderIdToSizeSpec[record.style_id];
      const size = record.size;
      let isPass = true;
      for (let i = 0; i < record.actual.length; i++) {
        if (record.actual[i].value === 0) continue;
        const spec = sizeSpec[i];
        const tolMinus = spec.ToleranceMinus.decimal;
        const tolPlus = spec.TolerancePlus.decimal;

        // Fix: Define specValue by extracting the buyer's spec for the given size
        const specValue = spec.Specs.find((s) => Object.keys(s)[0] === size)[
          size
        ].decimal;

        const lower = specValue + tolMinus;
        const upper = specValue + tolPlus;
        const actualValue = record.actual[i].value;
        if (actualValue < lower || actualValue > upper) {
          isPass = false;
          break;
        }
      }
      if (isPass) totalPass++;
    });

    const totalReject = inspectedQty - totalPass;
    const passRate =
      inspectedQty > 0 ? ((totalPass / inspectedQty) * 100).toFixed(2) : "0.00";

    res.json({ orderQty, inspectedQty, totalPass, totalReject, passRate });
  } catch (error) {
    console.error("Error fetching measurement summary:", error);
    res.status(500).json({ error: "Failed to fetch measurement summary" });
  }
});

// Updated endpoint for paginated measurement summary per MO No, only including MO Nos with inspectedQty > 0
app.get("/api/measurement-summary-per-mono", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      factory,
      startDate,
      endDate,
      mono,
      custStyle,
      buyer,
      empId,
      stage
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    // Build measurement filter
    const measurementFilter = {};
    if (startDate || endDate) {
      measurementFilter.created_at = {};
      if (startDate) {
        measurementFilter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        measurementFilter.created_at.$lte = end;
      }
    }

    if (empId) measurementFilter["user.name"] = empId;

    if (stage) measurementFilter.stage = stage;

    // Build order filter
    const orderFilter = {};
    if (factory) orderFilter.Factory = factory;
    if (mono) orderFilter.Order_No = mono;
    if (custStyle) orderFilter.CustStyle = custStyle;
    if (buyer) orderFilter.ShortName = buyer;

    // Aggregation pipeline to join dt_orders with measurement_data
    const pipeline = [
      { $match: orderFilter },
      {
        $lookup: {
          from: "measurement_data",
          let: { orderId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$style_id", "$$orderId"] },
                ...measurementFilter
              }
            }
          ],
          as: "measurements"
        }
      },
      { $match: { measurements: { $ne: [] } } }, // Only include orders with measurements
      { $sort: { Order_No: 1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(pageSize) }]
        }
      }
    ];

    const result = await ymEcoConnection.db
      .collection("dt_orders")
      .aggregate(pipeline)
      .toArray();
    const orders = result[0].data || [];
    const totalOrders = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalOrders / parseInt(pageSize));

    const orderIds = orders.map((order) => order._id.toString());
    const measurementRecords = await ymEcoConnection.db
      .collection("measurement_data")
      .find({
        style_id: { $in: orderIds },
        ...measurementFilter
      })
      .toArray();

    const recordsByOrder = {};
    measurementRecords.forEach((record) => {
      const styleId = record.style_id;
      if (!recordsByOrder[styleId]) recordsByOrder[styleId] = [];
      recordsByOrder[styleId].push(record);
    });

    const orderIdToSizeSpec = {};
    orders.forEach((order) => {
      orderIdToSizeSpec[order._id.toString()] = order.SizeSpec.map((spec) => {
        const tolMinusMagnitude =
          Math.abs(spec.ToleranceMinus.decimal) >= 1
            ? Math.abs(spec.ToleranceMinus.decimal) -
              Math.floor(Math.abs(spec.ToleranceMinus.decimal))
            : Math.abs(spec.ToleranceMinus.decimal);
        const tolPlusMagnitude =
          Math.abs(spec.TolerancePlus.decimal) >= 1
            ? Math.abs(spec.TolerancePlus.decimal) -
              Math.floor(Math.abs(spec.TolerancePlus.decimal))
            : Math.abs(spec.TolerancePlus.decimal);

        return {
          ...spec,
          ToleranceMinus: {
            decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
          },
          TolerancePlus: { decimal: tolPlusMagnitude }
        };
      });
    });

    const summaryPerMono = orders.map((order) => {
      const styleId = order._id.toString();
      const records = recordsByOrder[styleId] || [];
      let inspectedQty = records.length;
      let totalPass = 0;
      records.forEach((record) => {
        const sizeSpec = orderIdToSizeSpec[styleId];
        const size = record.size;
        let isPass = true;
        for (let i = 0; i < record.actual.length; i++) {
          if (record.actual[i].value === 0) continue;
          const spec = sizeSpec[i];
          const tolMinus = spec.ToleranceMinus.decimal;
          const tolPlus = spec.TolerancePlus.decimal;

          const specValue = spec.Specs.find((s) => Object.keys(s)[0] === size)[
            size
          ].decimal;
          const lower = specValue + tolMinus;
          const upper = specValue + tolPlus;
          const actualValue = record.actual[i].value;
          if (actualValue < lower || actualValue > upper) {
            isPass = false;
            break;
          }
        }
        if (isPass) totalPass++;
      });
      const totalReject = inspectedQty - totalPass;
      const passRate =
        inspectedQty > 0
          ? ((totalPass / inspectedQty) * 100).toFixed(2)
          : "0.00";
      return {
        moNo: order.Order_No,
        custStyle: order.CustStyle,
        buyer: order.ShortName,
        country: order.Country,
        origin: order.Origin,
        mode: order.Mode,
        orderQty: order.TotalQty,
        inspectedQty,
        totalPass,
        totalReject,
        passRate
      };
    });

    res.json({ summaryPerMono, totalPages, currentPage: parseInt(page) });
  } catch (error) {
    console.error("Error fetching measurement summary per MO No:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch measurement summary per MO No" });
  }
});

// Updated endpoint for measurement details by MO No

app.get("/api/measurement-details/:mono", async (req, res) => {
  try {
    const { startDate, endDate, empId, stage } = req.query;
    const order = await ymEcoConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: req.params.mono });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const styleId = order._id.toString();
    const measurementFilter = { style_id: styleId };
    if (startDate || endDate) {
      measurementFilter.created_at = {};
      if (startDate) {
        measurementFilter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        measurementFilter.created_at.$lte = end;
      }
    }

    if (empId) measurementFilter["user.name"] = empId;

    if (stage) measurementFilter.stage = stage;

    const records = await ymEcoConnection.db
      .collection("measurement_data")
      .find(measurementFilter)
      .toArray();

    const correctedSizeSpec = order.SizeSpec.map((spec) => {
      const tolMinusMagnitude =
        Math.abs(spec.ToleranceMinus.decimal) >= 1
          ? Math.abs(spec.ToleranceMinus.decimal) -
            Math.floor(Math.abs(spec.ToleranceMinus.decimal))
          : Math.abs(spec.ToleranceMinus.decimal);
      const tolPlusMagnitude =
        Math.abs(spec.TolerancePlus.decimal) >= 1
          ? Math.abs(spec.TolerancePlus.decimal) -
            Math.floor(Math.abs(spec.TolerancePlus.decimal))
          : Math.abs(spec.TolerancePlus.decimal);

      return {
        ...spec,
        ToleranceMinus: {
          decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
        },
        TolerancePlus: {
          decimal: tolPlusMagnitude
        }
      };
    });

    // Calculate the measurement point summary
    const measurementPointSummary = correctedSizeSpec
      .map((spec, index) => {
        const measurementPoint = spec.EnglishRemark;
        const tolMinus = spec.ToleranceMinus.decimal;
        const tolPlus = spec.TolerancePlus.decimal;

        let totalCount = 0;
        let totalPass = 0;

        records.forEach((record) => {
          const actualValue = record.actual[index]?.value || 0;
          if (actualValue === 0) return; // Skip if the value is 0

          totalCount++;

          // Get the buyer spec for the specific size of the record
          const buyerSpec =
            spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
              record.size
            ]?.decimal || 0;

          const lower = buyerSpec + tolMinus;
          const upper = buyerSpec + tolPlus;

          if (actualValue >= lower && actualValue <= upper) {
            totalPass++;
          }
        });

        const totalFail = totalCount - totalPass;
        const passRate =
          totalCount > 0 ? ((totalPass / totalCount) * 100).toFixed(2) : "0.00";

        // Use the first valid size as a representative buyer spec (for summary display)
        const sampleRecord = records.find(
          (r) => r.size && spec.Specs.find((s) => Object.keys(s)[0] === r.size)
        );
        const buyerSpec = sampleRecord
          ? spec.Specs.find((s) => Object.keys(s)[0] === sampleRecord.size)?.[
              sampleRecord.size
            ]?.decimal || 0
          : 0;

        return {
          measurementPoint,
          buyerSpec,
          tolMinus,
          tolPlus,
          totalCount,
          totalPass,
          totalFail,
          passRate
        };
      })
      .filter((summary) => summary.totalCount > 0); // Only include measurement points with non-zero counts

    res.json({
      records: records.map((record) => ({
        ...record,
        reference_no: record.reference_no // Include reference_no in the response
      })),
      sizeSpec: correctedSizeSpec,
      measurementPointSummary // Add the new summary data
    });
  } catch (error) {
    console.error("Error fetching measurement details:", error);
    res.status(500).json({ error: "Failed to fetch measurement details" });
  }
});

// New endpoint to update measurement value

app.put("/api/update-measurement-value", async (req, res) => {
  try {
    const { moNo, referenceNo, index, newValue } = req.body;

    // Validate inputs
    if (
      !moNo ||
      !referenceNo ||
      index === undefined ||
      newValue === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert newValue to a float and ensure it's a valid number
    const updatedValue = parseFloat(newValue);
    if (isNaN(updatedValue)) {
      return res.status(400).json({ error: "Invalid measurement value" });
    }

    // Find the dt_orders record to get its _id
    const order = await ymEcoConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo });
    if (!order) {
      return res.status(404).json({ error: "Order not found for MO No" });
    }

    const styleId = order._id.toString();

    // Find the measurement_data record with matching style_id and reference_no
    const record = await ymEcoConnection.db
      .collection("measurement_data")
      .findOne({ style_id: styleId, reference_no: referenceNo });

    if (!record) {
      return res.status(404).json({ error: "Measurement record not found" });
    }

    // Validate the index against the actual array length
    if (!record.actual || index < 0 || index >= record.actual.length) {
      return res.status(400).json({ error: "Invalid index for actual array" });
    }

    // Update the specific index in the actual array
    const result = await ymEcoConnection.db
      .collection("measurement_data")
      .updateOne(
        { style_id: styleId, reference_no: referenceNo },
        {
          $set: {
            [`actual.${index}.value`]: updatedValue,
            updated_at: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found during update" });
    }

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to update the record" });
    }

    res.json({ message: "Measurement value updated successfully" });
  } catch (error) {
    console.error(
      "Error updating measurement value:",
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "Failed to update measurement value",
      details: error.message
    });
  }
});

// New endpoint to delete measurement record
app.delete("/api/delete-measurement-record", async (req, res) => {
  try {
    const { moNo, referenceNo } = req.body;

    // Validate input
    if (!moNo || !referenceNo) {
      return res
        .status(400)
        .json({ error: "moNo and referenceNo are required" });
    }

    // Find the dt_orders record to get style_id
    const order = await ymEcoConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo }, { projection: { _id: 1 } });

    if (!order) {
      console.log("Order not found for MO No:", moNo);
      return res
        .status(404)
        .json({ error: `Order not found for MO No: ${moNo}` });
    }

    const styleId = order._id.toString();

    // Delete the measurement_data record
    const result = await ymEcoConnection.db
      .collection("measurement_data")
      .deleteOne({
        style_id: styleId,
        reference_no: referenceNo
      });

    if (result.deletedCount === 0) {
      console.log("No measurement record found for:", { styleId, referenceNo });
      return res.status(404).json({
        error: `No measurement record found for reference_no: ${referenceNo}`
      });
    }

    res
      .status(200)
      .json({ message: "Measurement record deleted successfully" });
  } catch (error) {
    console.error(
      "Error deleting measurement record:",
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "Failed to delete measurement record",
      details: error.message
    });
  }
});

/* ------------------------------
   End Points - SCC HT/FU
------------------------------ */

/* ------------------------------
   End Points - SCC HT/FU - Daily Testing
------------------------------ */

/* ------------------------------
   End Points - SCC Daily HT/FU QC Test
------------------------------ */

// POST Endpoint to save/update Daily HT/FU Test data
app.post("/api/scc/daily-htfu-test", async (req, res) => {
  try {
    const {
      _id, // ID of the main document if updating
      inspectionDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title, // User details
      baseReqTemp,
      baseReqTime,
      baseReqPressure, // Base specs from first output
      currentInspection, // The data for the specific slot being submitted
      stretchTestResult,
      washingTestResult // Overall tests
    } = req.body;

    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    if (!formattedDate || !machineNo || !moNo || !color || !currentInspection) {
      return res
        .status(400)
        .json({ message: "Missing required fields for submission." });
    }

    const now = new Date();
    const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const query = { inspectionDate: formattedDate, machineNo, moNo, color };
    let record = await DailyTestingHTFU.findOne(query);

    if (record) {
      // Update existing record
      record.baseReqTemp = baseReqTemp ?? record.baseReqTemp;
      record.baseReqTime = baseReqTime ?? record.baseReqTime;
      record.baseReqPressure = baseReqPressure ?? record.baseReqPressure;
      record.emp_id = emp_id; // Update user details on each submission if needed
      record.emp_kh_name = emp_kh_name;
      record.emp_eng_name = emp_eng_name;
      record.emp_dept_name = emp_dept_name;
      record.emp_sect_name = emp_sect_name;
      record.emp_job_title = emp_job_title;
      record.inspectionTime = inspectionTime;

      // Update or add the specific inspection slot
      const slotIndex = record.inspections.findIndex(
        (insp) => insp.timeSlotKey === currentInspection.timeSlotKey
      );
      if (slotIndex > -1) {
        // Update existing slot, ensuring not to overwrite with nulls if not intended
        record.inspections[slotIndex] = {
          ...record.inspections[slotIndex], // keep old values not submitted
          ...currentInspection, // new values for the slot
          inspectionTimestamp: new Date()
        };
      } else {
        record.inspections.push({
          ...currentInspection,
          inspectionTimestamp: new Date()
        });
      }
      // Sort inspections by inspectionNo after modification
      record.inspections.sort(
        (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
      );

      // Update stretch/washing tests only if they are being set and not already "Done"
      // Or if they are 'Pending' and now being set to 'Pass'/'Reject'
      if (
        !record.isStretchWashingTestDone ||
        record.stretchTestResult === "Pending"
      ) {
        if (stretchTestResult && stretchTestResult !== "Pending") {
          record.stretchTestResult = stretchTestResult;
        }
      }
      if (
        !record.isStretchWashingTestDone ||
        record.washingTestResult === "Pending"
      ) {
        if (washingTestResult && washingTestResult !== "Pending") {
          record.washingTestResult = washingTestResult;
        }
      }
      // Mark as done if both are now Pass/Reject
      if (
        (record.stretchTestResult === "Pass" ||
          record.stretchTestResult === "Reject") &&
        (record.washingTestResult === "Pass" ||
          record.washingTestResult === "Reject")
      ) {
        record.isStretchWashingTestDone = true;
      }
    } else {
      // Create new record
      record = new DailyTestingHTFU({
        inspectionDate: formattedDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title,
        inspectionTime,
        baseReqTemp,
        baseReqTime,
        baseReqPressure,
        inspections: [
          { ...currentInspection, inspectionTimestamp: new Date() }
        ],
        stretchTestResult:
          stretchTestResult && stretchTestResult !== "Pending"
            ? stretchTestResult
            : "Pending",
        washingTestResult:
          washingTestResult && washingTestResult !== "Pending"
            ? washingTestResult
            : "Pending"
      });
      if (
        (record.stretchTestResult === "Pass" ||
          record.stretchTestResult === "Reject") &&
        (record.washingTestResult === "Pass" ||
          record.washingTestResult === "Reject")
      ) {
        record.isStretchWashingTestDone = true;
      }
    }

    await record.save();
    res.status(201).json({
      message: "Daily HT/FU QC Test saved successfully",
      data: record
    });
  } catch (error) {
    console.error("Error saving Daily HT/FU QC Test:", error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({
        message:
          "A record with this Date, Machine No, MO No, and Color already exists. Submission failed.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save Daily HT/FU QC Test",
      error: error.message,
      details: error // Mongoose validation errors might be here
    });
  }
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on https://0.0.0.0:${PORT}`);
});