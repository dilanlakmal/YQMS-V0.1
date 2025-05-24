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



// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "./config.js"; 
import {ymProdConnection,
  ymEcoConnection,
  UserMain,
  QC1Sunrise,
  InlineOrders,
  CutPanelOrders,
  QCData,
  Role,
  Ironing,
  Washing,
  OPA,
  Packing,
  QC2OrderData,
  RoleManagment,
  QC2InspectionPassBundle,
  QC2DefectPrint,
  QC2Reworks,
  QCInlineRoving,
  QC2RepairTracking,
  LineSewingWorker,
  SewingDefects,
  AQLChart,
  HTFirstOutput,
  FUFirstOutput,
  SCCDailyTesting,
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
    determineBuyer,
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

// const checkDbConnection = (req, res, next) => {
//   if (ymProdConnection.readyState !== 1) {
//     // 1 means connected
//     return res.status(500).json({ error: "Mongoose connection is not ready" });
//   }
//   next();
// };

// Update the MONo search endpoint to handle partial matching
app.get("/api/search-mono", async (req, res) => {
  try {
    const term = req.query.term; // Changed from 'digits' to 'term'
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const collection = ymEcoConnection.db.collection("dt_orders");

    // Use a case-insensitive regex to match the term anywhere in Order_No
    const regexPattern = new RegExp(term, "i");

    const results = await collection
      .find({
        Order_No: { $regex: regexPattern }
      })
      .project({ Order_No: 1, _id: 0 }) // Only return Order_No field
      .limit(100) // Limit results to prevent overwhelming the UI
      .toArray();

    // Extract unique Order_No values
    const uniqueMONos = [...new Set(results.map((r) => r.Order_No))];

    res.json(uniqueMONos);
  } catch (error) {
    console.error("Error searching MONo:", error);
    res.status(500).json({ error: "Failed to search MONo" });
  }
});

// Update /api/order-details endpoint
app.get("/api/order-details/:mono", async (req, res) => {
  try {
    const collection = ymEcoConnection.db.collection("dt_orders");
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
    const collection = ymEcoConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });
    if (!order) return res.status(404).json({ error: "Order not found" });
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

    const collection = ymEcoConnection.db.collection("dt_orders");
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

    const collection = ymEcoConnection.db.collection("dt_orders");
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

      const packageCount = await QC2OrderData.countDocuments({
        selectedMono: bundle.selectedMono,
        //color: bundle.color,
        //size: bundle.size,
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

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */

app.put('/api/update-bundle-data/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await QC2OrderData.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedOrder) {
      return res.status(404).send({ message: 'Order not found' });
    }
    res.send(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).send({ message: 'Internal Server Error' });
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
      { emp_id_ironing: emp_id }, // Filter by emp_id_ironing
      {},
      { sort: { ironing_record_id: -1 } } // Sort descending to get the highest ID
    );
    const lastRecordId = lastRecord ? lastRecord.ironing_record_id : 0; // Start at 0 if no records exist
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last ironing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last ironing record ID" });
  }
});

// Modified endpoint to fetch defect card data with logging
app.get("/api/check-defect-card/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    //console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log

    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false,
    });
    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }

    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      package_no: defectRecord.package_no, // Include package_no
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: defectRecord.checkedQty,
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id,
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card:", error);
    res.status(500).json({ message: error.message });
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

app.get("/api/check-defect-card-washing/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false,
    });
    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }
    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }
    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      package_no: defectRecord.package_no,
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: defectRecord.checkedQty,
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id,
    };
    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card for washing:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/last-washing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Washing.findOne(
      { emp_id_washing: emp_id },
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

app.get("/api/check-defect-card-opa/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false,
    });
    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }
    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }
    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      package_no: defectRecord.package_no,
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: defectRecord.checkedQty,
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id,
    };
    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card for OPA:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/last-opa-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await OPA.findOne(
      { emp_id_opa: emp_id },
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

app.get("/api/opa-records", async (req, res) => {
  try {
    const records = await OPA.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch OPA records" });
  }
});

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

// New Endpoint to Get Bundle by Random ID (from qc2_inspection_pass_bundle for order cards)
app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const randomId = req.params.randomId.trim(); // Trim to avoid whitespace issues
    // console.log("Searching for bundle_random_id:", randomId);

    // First, check qc2_inspection_pass_bundle for order card
    const bundle = await QC2InspectionPassBundle.findOne({
      bundle_random_id: randomId,
      "printArray.isCompleted": false, // Ensure bundle is not completed
    });

    if (!bundle) {
      return res
        .status(404)
        .json({ error: "This bundle has not been inspected yet" });
    }

    // Use the first printArray entry (assuming one bundle_random_id per document for simplicity)
    const printData = bundle.printArray.find(
      (item) => item.isCompleted === false
    );
    if (!printData) {
      return res
        .status(404)
        .json({ error: "No active print data found for this bundle" });
    }

    const formattedData = {
      bundle_id: bundle.bundle_id,
      bundle_random_id: bundle.bundle_random_id,
      package_no: bundle.package_no, // Include package_no
      moNo: bundle.moNo,
      selectedMono: bundle.moNo,
      custStyle: bundle.custStyle,
      buyer: bundle.buyer,
      color: bundle.color,
      size: bundle.size,
      factory: bundle.factory || "N/A",
      country: bundle.country || "N/A",
      lineNo: bundle.lineNo,
      department: bundle.department,
      count: bundle.totalPass, // Use totalPass as checkedQty for order cards
      totalBundleQty: 1, // Set hardcoded as 1 for order card
      emp_id_inspection: bundle.emp_id_inspection,
      inspection_date: bundle.inspection_date,
      inspection_time: bundle.inspection_time,
      sub_con: bundle.sub_con,
      sub_con_factory: bundle.sub_con_factory,
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

// Check if Packing record exists (updated for task_no 62)
app.get("/api/check-packing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Packing.findOne({
      packing_bundle_id: req.params.bundleId, // No change needed here, but ensure it matches task_no 62 in Packing.jsx
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// New endpoint to get the last Packing record ID for a specific emp_id (no change needed)
app.get("/api/last-packing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Packing.findOne(
      { emp_id_packing: emp_id }, // Filter by emp_id_packing
      {},
      { sort: { packing_record_id: -1 } } // Sort descending to get the highest ID
    );
    const lastRecordId = lastRecord ? lastRecord.packing_record_id : 0; // Start at 0 if no records exist
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last Packing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last Packing record ID" });
  }
});

// Modified endpoint to fetch defect card data from qc2_inspection_pass_bundle with defect_print_id (updated for task_no 62)
app.get("/api/check-defect-card/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    // console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log

    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false,
    });

    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }

    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      totalRejectGarment_Var: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var for defect cards
      package_no: defectRecord.package_no, // Include package_no
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var as count for defect cards
      totalBundleQty: 1, // Set hardcoded as 1 for defect card
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id,
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card:", error);
    res.status(500).json({ message: error.message });
  }
});

// Save Packing record (no change needed, but ensure task_no is 62 in Packing.jsx)
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

//For Data tab display records in a table (no change needed)
app.get("/api/packing-records", async (req, res) => {
  try {
    const records = await Packing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Packing records" });
  }
});

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

app.post("/api/save-qc-data", async (req, res) => {
  try {
    // Sanitize defectDetails
    const sanitizedDefects = (req.body.defectDetails || []).map((defect) => ({
      name: defect.name.toString().trim(),
      count: Math.abs(parseInt(defect.count)) || 0
    }));
    const sanitizedData = {
      ...req.body,
      defectArray: sanitizedDefects,
      headerData: {
        ...req.body.headerData,
        date: req.body.headerData.date
          ? new Date(req.body.headerData.date).toISOString()
          : undefined
      }
    };

    const qcData = new QCData(sanitizedData);
    const savedData = await qcData.save();

    res.status(201).json({
      message: "QC data saved successfully",
      data: savedData
    });
  } catch (error) {
    console.error("Error saving QC data:", error);
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
//-----------------------------USER FUNCTION------------------------------------------------//

/* ------------------------------
   AQL ENDPOINTS
------------------------------ */

app.get("/api/aqlmappings", async (req, res) => {
  try {
    const aqlCharts = await AQLChart.find({}).lean();
    const mappings = {};

    // Group by lot size
    aqlCharts.forEach((entry) => {
      const lotSizeKey = `${entry.LotSize.min}-${entry.LotSize.max || "null"}`;
      if (!mappings[lotSizeKey]) {
        mappings[lotSizeKey] = {
          LotSize: {
            min: entry.LotSize.min,
            max: entry.LotSize.max
          },
          General: { I: "", II: "", III: "" },
          Special: { S1: "", S2: "", S3: "", S4: "" }
        };
      }
      if (entry.Type === "General") {
        mappings[lotSizeKey].General[entry.Level] = entry.SampleSizeLetterCode;
      } else if (entry.Type === "Special") {
        mappings[lotSizeKey].Special[entry.Level] = entry.SampleSizeLetterCode;
      }
    });

    // Convert mappings object to array
    const mappingsArray = Object.values(mappings);
    res.json(mappingsArray);
  } catch (error) {
    console.error("Error fetching AQL mappings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/samplesizecodeletters", async (req, res) => {
  try {
    const aqlCharts = await AQLChart.find({}).lean();
    const codeLettersMap = {};

    // Group by SampleSizeLetterCode
    aqlCharts.forEach((entry) => {
      const code = entry.SampleSizeLetterCode;
      if (!codeLettersMap[code]) {
        codeLettersMap[code] = {
          code,
          sampleSize: entry.SampleSize,
          AQL: []
        };
      }
      // Merge AQL entries, avoiding duplicates
      entry.AQL.forEach((aql) => {
        if (!codeLettersMap[code].AQL.some((a) => a.level === aql.level)) {
          codeLettersMap[code].AQL.push({
            level: aql.level,
            AcceptDefect: aql.AcceptDefect,
            RejectDefect: aql.RejectDefect
          });
        }
      });
    });

    // Convert to array and sort AQL by level
    const codeLettersArray = Object.values(codeLettersMap).map((item) => ({
      ...item,
      AQL: item.AQL.sort((a, b) => a.level - b.level)
    }));

    res.json(codeLettersArray);
  } catch (error) {
    console.error("Error fetching sample size code letters:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Cutting Page AQL Level display
app.get("/api/aql-details", async (req, res) => {
  try {
    const { lotSize } = req.query;

    if (!lotSize || isNaN(lotSize)) {
      return res
        .status(400)
        .json({ message: "Lot size is required and must be a number" });
    }

    const lotSizeNum = parseInt(lotSize);

    // Find AQL chart entry where lotSize falls within LotSize.min and LotSize.max
    const aqlChart = await AQLChart.findOne({
      Type: "General",
      Level: "II",
      "LotSize.min": { $lte: lotSizeNum },
      $or: [{ "LotSize.max": { $gte: lotSizeNum } }, { "LotSize.max": null }]
    }).lean();

    if (!aqlChart) {
      return res
        .status(404)
        .json({ message: "No AQL chart found for the given lot size" });
    }

    // Find AQL entry for level 1.0
    const aqlEntry = aqlChart.AQL.find((aql) => aql.level === 1.0);

    if (!aqlEntry) {
      return res
        .status(404)
        .json({ message: "AQL level 1.0 not found for the given chart" });
    }

    res.json({
      SampleSizeLetterCode: aqlChart.SampleSizeLetterCode,
      SampleSize: aqlChart.SampleSize,
      AcceptDefect: aqlEntry.AcceptDefect,
      RejectDefect: aqlEntry.RejectDefect
    });
  } catch (error) {
    console.error("Error fetching AQL details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

    // console.log("Match Query:", JSON.stringify(matchQuery, null, 2)); // For debugging

    // Get total count
    const total = await collection.countDocuments(matchQuery);

    // Get paginated data
    const data = await collection
      .find(matchQuery)
      .sort({ [dateField]: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // console.log("Found records:", data.length); // For debugging

    // Transform data for consistent response
    const transformedData = data.map((item) => ({
      date: item[dateField],
      type: isIroning ? "Ironing" : "QC2 Order Data",
      taskNo: isIroning ? "53" : "52",
      selectedMono: item.selectedMono,
      custStyle: item.custStyle,
      lineNo: item.lineNo,
      color: item.color,
      size: item.size,
      buyer: item.buyer,
      bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id,
      factory: item.factory,
      count: item.count
    }));

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


// Socket.io connection handler
io.on("connection", (socket) => {
  //console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    //console.log("A client disconnected:", socket.id);
  });
});

// Endpoint to save inspection pass bundle data
app.post("/api/inspection-pass-bundle", async (req, res) => {
  try {
    const {
      package_no,
      // bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer,
      factory,
      country,
      sub_con,
      sub_con_factory,
      checkedQty,
      totalPass,
      totalRejects,
      totalRepair,
      defectQty,
      defectArray,
      rejectGarments,
      inspection_time,
      inspection_date,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
      printArray,
    } = req.body;

    const newRecord = new QC2InspectionPassBundle({
      package_no,
      //bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer: buyer || "N/A",
      factory: factory || "N/A",
      country: country || "N/A",
      sub_con: sub_con || "No",
      sub_con_factory: sub_con_factory || "N/A",
      checkedQty,
      totalPass,
      totalRejects,
      totalRepair: totalRepair || 0,
      defectQty,
      defectArray: defectArray || [],
      rejectGarments: rejectGarments || [],
      inspection_time,
      inspection_date,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
      printArray: printArray || []
    });

    await newRecord.save();

    // Emit event to all clients
    io.emit("qc2_data_updated");

    res.status(201).json({
      message: "Inspection pass bundle saved successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error saving inspection pass bundle:", error);
    res.status(500).json({
      message: "Failed to save inspection pass bundle",
      error: error.message,
    });
  }
});

//Update QC2 inspection records for each of reject garments - PUT endpoint to update inspection records
app.put(
  "/api/qc2-inspection-pass-bundle/:bundle_random_id",
  async (req, res) => {
    try {
      const { bundle_random_id } = req.params;
      const { updateOperations, arrayFilters } = req.body || {};

      let updateData = req.body;
      if (updateOperations) {
        updateData = updateOperations;
      }

      const updateOperationsFinal = {};
      if (updateData.$set) {
        updateOperationsFinal.$set = updateData.$set;
      }
      if (updateData.$push) {
        updateOperationsFinal.$push = updateData.$push;
      }
      if (updateData.$inc) {
        updateOperationsFinal.$inc = updateData.$inc;
      }
      if (!updateData.$set && !updateData.$push && !updateData.$inc) {
        updateOperationsFinal.$set = updateData;
      }

      // Ensure totalRejectGarment_Var remains unchanged when updating printArray
      if (updateOperationsFinal.$set?.printArray) {
        updateOperationsFinal.$set.printArray =
          updateOperationsFinal.$set.printArray.map((printEntry) => ({
            ...printEntry,
            totalRejectGarment_Var:
              printEntry.totalRejectGarment_Var ||
              printEntry.totalRejectGarmentCount
          }));
      }

      const options = {
        new: true,
        runValidators: true,
      };
      if (arrayFilters) {
        options.arrayFilters = arrayFilters;
      }

      const updatedRecord = await QC2InspectionPassBundle.findOneAndUpdate(
        { bundle_random_id },
        updateOperationsFinal,
        options
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Record not found" });
      }

      // Update qc2_orderdata for qc2InspectionFirst and qc2InspectionDefect
      const qc2OrderDataRecord = await QC2OrderData.findOne({
        bundle_random_id
      });

      // Case 1: Initial inspection completed (inspection_time is set)
      if (
        updateOperationsFinal.$set &&
        updateOperationsFinal.$set.inspection_time
      ) {
        if (qc2OrderDataRecord) {
          // Check if an entry with the same inspection_time, emp_id, and bundle_random_id already exists
          const existingEntry = qc2OrderDataRecord.qc2InspectionFirst.find(
            (entry) =>
              entry.inspectionRecordId === updatedRecord._id.toString() ||
              (entry.updated_date === updatedRecord.inspection_date &&
                entry.update_time === updatedRecord.inspection_time &&
                entry.emp_id === updatedRecord.emp_id_inspection)
          );

          if (!existingEntry) {
            const inspectionFirstEntry = {
              process: "qc2",
              task_no: 100,
              checkedQty: updatedRecord.checkedQty,
              totalPass: updatedRecord.totalPass,
              totalRejects: updatedRecord.totalRejects,
              defectQty: updatedRecord.defectQty,
              defectArray: updatedRecord.defectArray,
              rejectGarments: updatedRecord.rejectGarments.map((rg) => ({
                totalCount: rg.totalCount,
                defects: rg.defects.map((d) => ({
                  name: d.name,
                  count: d.count,
                  repair: d.repair,
                  status: "Fail"
                })),
                garment_defect_id: rg.garment_defect_id,
                rejectTime: rg.rejectTime
              })),
              updated_date: updatedRecord.inspection_date,
              update_time: updatedRecord.inspection_time,
              emp_id: updatedRecord.emp_id_inspection,
              eng_name: updatedRecord.eng_name_inspection,
              kh_name: updatedRecord.kh_name_inspection,
              job_title: updatedRecord.job_title_inspection,
              dept_name: updatedRecord.dept_name_inspection,
              sect_name: updatedRecord.sect_name_inspection,
              inspectionRecordId: updatedRecord._id.toString() // Add unique identifier
            };
            qc2OrderDataRecord.qc2InspectionFirst.push(inspectionFirstEntry);
            await qc2OrderDataRecord.save();
          } else {
            console.log(
              "Duplicate entry detected, skipping push to qc2InspectionFirst"
            );
          }
        }
      }

      // Case 2: Return inspection completed (repairGarmentsDefects is pushed)
      if (
        updateOperationsFinal.$push &&
        updateOperationsFinal.$push[
          "printArray.$[elem].repairGarmentsDefects"
        ] &&
        updateData.sessionData
      ) {
        const sessionData = updateData.sessionData;
        const {
          sessionTotalPass,
          sessionTotalRejects,
          sessionDefectsQty,
          sessionRejectedGarments,
          inspectionNo,
          defect_print_id
        } = sessionData;

        if (qc2OrderDataRecord) {
          const now = new Date();
          const inspectionDefectEntry = {
            process: "qc2",
            task_no: 101,
            defect_print_id,
            inspectionNo,
            checkedQty: sessionTotalPass + sessionTotalRejects,
            totalPass: sessionTotalPass,
            totalRejects: sessionTotalRejects,
            defectQty: sessionDefectsQty,
            // Omit defectArray
            rejectGarments: sessionRejectedGarments.map((rg) => ({
              totalCount: rg.totalDefectCount,
              defects: rg.repairDefectArray.map((d) => ({
                name: d.name,
                count: d.count,
                repair:
                  allDefects.find((def) => def.english === d.name)?.repair ||
                  "Unknown",
                status: "Fail"
              })),
              garment_defect_id: generateGarmentDefectId(),
              rejectTime: now.toLocaleTimeString("en-US", { hour12: false })
            })),
            updated_date: now.toLocaleDateString("en-US"),
            update_time: now.toLocaleTimeString("en-US", { hour12: false }),
            emp_id: updatedRecord.emp_id_inspection,
            eng_name: updatedRecord.eng_name_inspection,
            kh_name: updatedRecord.kh_name_inspection,
            job_title: updatedRecord.job_title_inspection,
            dept_name: updatedRecord.dept_name_inspection,
            sect_name: updatedRecord.sect_name_inspection
          };
          qc2OrderDataRecord.qc2InspectionDefect.push(inspectionDefectEntry);
          await qc2OrderDataRecord.save();
        }
      }

      io.emit("qc2_data_updated");
      res.json({
        message: "Inspection pass bundle updated successfully",
        data: updatedRecord,
      });
    } catch (error) {
      console.error("Error updating inspection pass bundle:", error);
      res.status(500).json({
        message: "Failed to update inspection pass bundle",
        error: error.message,
      });
    }
  }
);


// Filter Pane for Live Dashboard - EndPoints
app.get("/api/qc2-inspection-pass-bundle/filter-options", async (req, res) => {
  try {
    const filterOptions = await QC2InspectionPassBundle.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$moNo" },
          color: { $addToSet: "$color" },
          size: { $addToSet: "$size" },
          department: { $addToSet: "$department" },
          emp_id_inspection: { $addToSet: "$emp_id_inspection" },
          buyer: { $addToSet: "$buyer" },
          package_no: { $addToSet: "$package_no" }, // Added package_no
          lineNo: { $addToSet: "$lineNo" } // Add Line No
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          color: 1,
          size: 1,
          department: 1,
          emp_id_inspection: 1,
          buyer: 1,
          package_no: 1,
          lineNo: 1 // Include Line No
        }
      }
    ]);

    const result =
      filterOptions.length > 0
        ? filterOptions[0]
        : {
            moNo: [],
            color: [],
            size: [],
            department: [],
            emp_id_inspection: [],
            buyer: [],
            package_no: [],
            lineNo: [] // Include Line No
          };

    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b))); // Numeric sort for package_no
      //.sort((a, b) => a.localeCompare(b));
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

app.get("/api/qc2-defect-print/filter-options", async (req, res) => {
  try {
    const filterOptions = await QC2DefectPrint.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$moNo" },
          package_no: { $addToSet: "$package_no" },
          repair: { $addToSet: "$repair" },
        },
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          package_no: 1,
          repair: 1,
        },
      },
    ]);
    const result = filterOptions[0] || { moNo: [], package_no: [], repair: [] };
    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b)));
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// New endpoint to fetch by bundle_random_id
app.get(
  "/api/qc2-inspection-pass-bundle-by-random-id/:bundle_random_id",
  async (req, res) => {
    try {
      const { bundle_random_id } = req.params;
      const record = await QC2InspectionPassBundle.findOne({
        bundle_random_id,
      });
      if (record) {
        res.json(record);
      } else {
        res.status(404).json({ message: "Record not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// New GET endpoint to fetch record by defect_print_id
app.get(
  "/api/qc2-inspection-pass-bundle-by-defect-print-id/:defect_print_id",
  async (req, res) => {
    try {
      const { defect_print_id } = req.params;
      const { includeCompleted } = req.query;

      let query = {
        "printArray.defect_print_id": defect_print_id,
      };

      if (includeCompleted !== "true") {
        query["printArray.isCompleted"] = false;
      }

      const record = await QC2InspectionPassBundle.findOne(query);

      if (record) {
        res.json(record);
      } else {
        res
          .status(404)
          .json({ message: "Record not found or already completed" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Helper function to normalize date strings with leading zeros
const normalizeDateString = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [month, day, year] = dateStr.split("/").map((part) => part.trim());
    if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) {
      throw new Error("Invalid date format");
    }
    // Add leading zeros to month and day
    const normalizedMonth = ("0" + parseInt(month, 10)).slice(-2);
    const normalizedDay = ("0" + parseInt(day, 10)).slice(-2);
    return `${normalizedMonth}/${normalizedDay}/${year}`;
  } catch (error) {
    console.error(`Invalid date string: ${dateStr}`, error);
    return null;
  }
};

// Helper function to escape special characters in regex
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escapes . * + ? ^ $ { } ( ) | [ ] \
};

// Helper function to normalize date strings (remove leading zeros for consistency)
// const normalizeDateString = (dateStr) => {
//   if (!dateStr) return null;
//   const [month, day, year] = dateStr.split("/");
//   return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
// };

// GET endpoint to fetch all inspection records
app.get("/api/qc2-inspection-pass-bundle/search", async (req, res) => {
  try {
    const {
      moNo,
      package_no,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      page = 1,
      limit = 50, // Default to 50 records per page
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber)) {
        return res.status(400).json({ error: "Package No must be a number" });
      }
      match.package_no = packageNoNumber;
    }
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i"),
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;

    if (startDate || endDate) {
      match.inspection_date = {};
      if (startDate)
        match.inspection_date.$gte = normalizeDateString(startDate);
      if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await QC2InspectionPassBundle.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    // console.log("Search result:", { data, total });
    res.json({ data, total });
  } catch (error) {
    console.error("Error searching data cards:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/qc2-defect-print/search", async (req, res) => {
  try {
    const { moNo, package_no, repair, page = 1, limit = 50 } = req.query;
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber))
        return res.status(400).json({ error: "Package No must be a number" });
      match.package_no = packageNoNumber;
    }
    if (repair) match.repair = { $regex: new RegExp(repair.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await QC2DefectPrint.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ data, total });
  } catch (error) {
    console.error("Error searching defect print cards:", error);
    res.status(500).json({ error: error.message });
  }
});

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

// Endpoint to get summary data
app.get("/api/qc2-inspection-summary", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo // Add Line No
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i"),
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();
    //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") }; // Add Line No filter

    // Normalize and convert dates to Date objects for proper comparison
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }
    // if (startDate || endDate) {
    //   match.inspection_date = {};
    //   if (startDate)
    //     match.inspection_date.$gte = normalizeDateString(startDate);
    //   if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
    // }

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          checkedQty: { $sum: "$checkedQty" },
          totalPass: { $sum: "$totalPass" },
          totalRejects: { $sum: "$totalRejects" },
          defectsQty: { $sum: "$defectQty" },
          totalBundles: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          checkedQty: 1,
          totalPass: 1,
          totalRejects: 1,
          defectsQty: 1,
          totalBundles: 1,
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$defectsQty", "$checkedQty"] },
            ],
          },
          defectRatio: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$totalRejects", "$checkedQty"] },
            ],
          },
        },
      },
    ]);

    if (data.length > 0) {
      res.json(data[0]);
    } else {
      res.json({
        checkedQty: 0,
        totalPass: 0,
        totalRejects: 0,
        defectsQty: 0,
        totalBundles: 0,
        defectRate: 0,
        defectRatio: 0,
      });
    }
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

// Endpoint to get summaries per MO No with dynamic grouping

app.get("/api/qc2-mo-summaries", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo,
      groupByDate, // "true" to group by date
      groupByLine, // "true" to group by lineNo
      groupByMO, // "true" to group by moNo
      groupByBuyer, // "true" to group by buyer
      groupByColor, // "true" to group by color
      groupBySize, // "true" to group by size
      groupByWeek // New parameter for weekly grouping
    } = req.query;

    let match = {};

    if (moNo && moNo.trim()) {
      match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    }
    if (emp_id_inspection) {
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i"),
      };
    }
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer) {
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    }
    if (lineNo) match.lineNo = lineNo.trim();

    // Normalize and convert dates to Date objects for proper comparison
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Handle invalid dates gracefully
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Handle invalid dates gracefully
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Dynamically build the _id object for grouping based on query params
    const groupBy = {};
    const projectFields = {};

    // Order matters: Week, Date, Line No, MO No, Buyer, Color, Size
    if (groupByWeek === "true") {
      groupBy.weekInfo = {
        $let: {
          vars: {
            parsedDate: {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Return null if date parsing fails
              }
            },
            monday: {
              $cond: {
                if: {
                  $ne: [
                    {
                      $dateFromString: {
                        dateString: "$inspection_date",
                        format: "%m/%d/%Y",
                        onError: null
                      }
                    },
                    null
                  ]
                },
                then: {
                  $dateSubtract: {
                    startDate: {
                      $dateFromString: {
                        dateString: "$inspection_date",
                        format: "%m/%d/%Y",
                        onError: null
                      }
                    },
                    unit: "day",
                    amount: {
                      $subtract: [
                        {
                          $dayOfWeek: {
                            $dateFromString: {
                              dateString: "$inspection_date",
                              format: "%m/%d/%Y",
                              onError: null
                            }
                          }
                        },
                        1 // Adjust for Monday (1 = Sunday, 2 = Monday, etc.)
                      ]
                    }
                  }
                },
                else: null // If date is invalid, set monday to null
              }
            }
          },
          in: {
            weekNumber: {
              $cond: {
                if: { $ne: ["$$monday", null] },
                then: { $week: "$$monday" },
                else: -1 // Use -1 for invalid weeks
              }
            },
            startDate: {
              $cond: {
                if: { $ne: ["$$monday", null] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$$monday"
                  }
                },
                else: "Invalid Date"
              }
            },
            endDate: {
              $cond: {
                if: { $ne: ["$$monday", null] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: {
                      $dateAdd: {
                        startDate: "$$monday",
                        unit: "day",
                        amount: 6
                      }
                    }
                  }
                },
                else: "Invalid Date"
              }
            }
          }
        }
      };
      projectFields.weekInfo = "$_id.weekInfo";
    } else if (groupByDate === "true") {
      groupBy.inspection_date = {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateFromString: {
              dateString: "$inspection_date",
              format: "%m/%d/%Y",
              onError: null // Handle invalid dates
            }
          }
        }
      };
      projectFields.inspection_date = "$_id.inspection_date";
    }
    if (groupByLine === "true") {
      groupBy.lineNo = "$lineNo";
      projectFields.lineNo = "$_id.lineNo";
    }
    if (groupByMO === "true") {
      groupBy.moNo = "$moNo";
      projectFields.moNo = "$_id.moNo";
    }
    if (groupByBuyer === "true") {
      groupBy.buyer = "$buyer";
      projectFields.buyer = "$_id.buyer";
    }
    if (groupByColor === "true") {
      groupBy.color = "$color";
      projectFields.color = "$_id.color";
    }
    if (groupBySize === "true") {
      groupBy.size = "$size";
      projectFields.size = "$_id.size";
    }

    const data = await QC2InspectionPassBundle.aggregate([
      // Step 1: Filter out documents with invalid inspection_date
      {
        $match: {
          inspection_date: { $exists: true, $ne: null, $ne: "" },
          ...match
        }
      },
      // Step 2: Group the data
      {
        $group: {
          _id: groupBy,
          checkedQty: { $sum: "$checkedQty" },
          totalPass: { $sum: "$totalPass" },
          totalRejects: { $sum: "$totalRejects" },
          defectsQty: { $sum: "$defectQty" },
          totalBundles: { $sum: 1 },
          defectiveBundles: {
            $sum: { $cond: [{ $gt: ["$totalRepair", 0] }, 1, 0] },
          },
          defectArray: { $push: "$defectArray" },
          firstInspectionDate: { $first: "$inspection_date" },
          firstLineNo: { $first: "$lineNo" },
          firstMoNo: { $first: "$moNo" },
          firstBuyer: { $first: "$buyer" },
          firstColor: { $first: "$color" },
          firstSize: { $first: "$size" }
        }
      },
      // Step 3: Project the required fields
      {
        $project: {
          ...projectFields,
          inspection_date:
            groupByDate !== "true"
              ? "$firstInspectionDate"
              : "$_id.inspection_date",
          weekInfo:
            groupByWeek !== "true"
              ? null
              : {
                  weekNumber: "$_id.weekInfo.weekNumber",
                  startDate: "$_id.weekInfo.startDate",
                  endDate: "$_id.weekInfo.endDate"
                },
          lineNo: groupByLine !== "true" ? "$firstLineNo" : "$_id.lineNo",
          moNo: groupByMO !== "true" ? "$firstMoNo" : "$_id.moNo",
          buyer: groupByBuyer !== "true" ? "$firstBuyer" : "$_id.buyer",
          color: groupByColor !== "true" ? "$firstColor" : "$_id.color",
          size: groupBySize !== "true" ? "$firstSize" : "$_id.size",
          checkedQty: 1,
          totalPass: 1,
          totalRejects: 1,
          defectsQty: 1,
          totalBundles: 1,
          defectiveBundles: 1,
          defectArray: {
            $reduce: {
              input: "$defectArray",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$defectsQty", "$checkedQty"] },
            ],
          },
          defectRatio: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$totalRejects", "$checkedQty"] },
            ],
          },
          _id: 0,
        },
      },
      // Step 4: Sort the results
      {
        $sort: {
          ...(groupByWeek === "true" && { "weekInfo.startDate": 1 }),
          ...(groupByDate === "true" && { inspection_date: 1 }),
          lineNo: 1,
          moNo: 1
        }
      }
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching MO summaries:", error);
    res.status(500).json({ error: "Failed to fetch MO summaries" });
  }
});

app.get("/api/qc2-defect-rates", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo
    } = req.query;

    // Build the match stage with filters
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();

    // Date filtering using $expr for string dates
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: match },
      {
        $facet: {
          totalChecked: [
            {
              $group: {
                _id: null,
                totalCheckedQty: { $sum: "$checkedQty" }
              }
            }
          ],
          defects: [
            { $unwind: "$defectArray" },
            {
              $group: {
                _id: "$defectArray.defectName",
                totalCount: { $sum: "$defectArray.totalCount" }
              }
            }
          ]
        }
      },
      {
        $project: {
          totalCheckedQty: {
            $arrayElemAt: ["$totalChecked.totalCheckedQty", 0]
          },
          defects: "$defects"
        }
      },
      { $unwind: "$defects" },
      {
        $project: {
          defectName: "$defects._id",
          totalCount: "$defects.totalCount",
          defectRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              { $divide: ["$defects.totalCount", "$totalCheckedQty"] }
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ];

    const data = await QC2InspectionPassBundle.aggregate(pipeline);
    res.json(data);
  } catch (error) {
    console.error("Error fetching defect rates:", error);
    res.status(500).json({ error: "Failed to fetch defect rates" });
  }
});

//Defect rate by Hour - Endpoint
app.get("/api/qc2-defect-rates-by-hour", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i"),
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };

    // Update date filtering using $expr and $dateFromString
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          moNo: 1,
          checkedQty: 1,
          defectQty: 1,
          defectArray: 1,
          inspection_time: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
          minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
          second: { $toInt: { $substr: ["$inspection_time", 6, 2] } },
        },
      },
      {
        $match: {
          minute: { $gte: 0, $lte: 59 },
          second: { $gte: 0, $lte: 59 },
        },
      },
      {
        $group: {
          _id: { moNo: "$moNo", hour: "$hour" },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          defectRecords: { $push: "$defectArray" },
        },
      },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            moNo: "$_id.moNo",
            hour: "$_id.hour",
            defectName: "$defectRecords.defectName",
          },
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defectCount: { $sum: "$defectRecords.totalCount" },
        },
      },
      {
        $group: {
          _id: { moNo: "$_id.moNo", hour: "$_id.hour" },
          checkedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defects: {
            $push: {
              name: "$_id.defectName",
              count: {
                $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.moNo",
          hours: {
            $push: {
              hour: "$_id.hour",
              checkedQty: "$checkedQty",
              defects: "$defects",
              defectQty: "$totalDefectQty",
            },
          },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" },
        },
      },
      {
        $project: {
          moNo: "$_id",
          hourData: {
            $arrayToObject: {
              $map: {
                input: "$hours",
                as: "h",
                in: {
                  k: { $toString: { $add: ["$$h.hour", 1] } },
                  v: {
                    rate: {
                      $cond: [
                        { $eq: ["$$h.checkedQty", 0] },
                        0,
                        {
                          $multiply: [
                            { $divide: ["$$h.defectQty", "$$h.checkedQty"] },
                            100,
                          ],
                        },
                      ],
                    },
                    hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
                    checkedQty: "$$h.checkedQty",
                    defects: "$$h.defects",
                  },
                },
              },
            },
          },
          totalRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100,
                ],
              },
            ],
          },
          _id: 0,
        },
      },
      { $sort: { moNo: 1 } },
    ]);

    const totalData = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          checkedQty: 1,
          defectQty: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
        },
      },
      {
        $group: {
          _id: "$hour",
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          hour: "$_id",
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100,
                ],
              },
            ],
          },
          hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
          _id: 0,
        },
      },
    ]);

    const grandTotal = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
        },
      },
      {
        $project: {
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100,
                ],
              },
            ],
          },
          _id: 0,
        },
      },
    ]);

    const result = {};
    data.forEach((item) => {
      result[item.moNo] = {};
      Object.keys(item.hourData).forEach((hour) => {
        const formattedHour = `${hour}:00`.padStart(5, "0");
        const hourData = item.hourData[hour];
        result[item.moNo][formattedHour] = {
          rate: hourData.rate,
          hasCheckedQty: hourData.hasCheckedQty,
          checkedQty: hourData.checkedQty,
          defects: hourData.defects.map((defect) => ({
            name: defect.name || "No Defect",
            count: defect.count,
            rate:
              hourData.checkedQty > 0
                ? (defect.count / hourData.checkedQty) * 100
                : 0,
          })),
        };
      });
      result[item.moNo].totalRate = item.totalRate;
    });

    result.total = {};
    totalData.forEach((item) => {
      const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
      if (item.hour >= 6 && item.hour <= 20) {
        result.total[formattedHour] = {
          rate: item.rate,
          hasCheckedQty: item.hasCheckedQty,
        };
      }
    });

    result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

    const hours = [
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
    ];
    Object.keys(result).forEach((key) => {
      if (key !== "grand") {
        hours.forEach((hour) => {
          if (!result[key][hour]) {
            result[key][hour] = {
              rate: 0,
              hasCheckedQty: false,
              checkedQty: 0,
              defects: [],
            };
          }
        });
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching defect rates by hour:", error);
    res.status(500).json({ error: "Failed to fetch defect rates by hour" });
  }
});

// Endpoint to get defect rates by line by hour
app.get("/api/qc2-defect-rates-by-line", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();
    //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };

    // Normalize and convert dates to Date objects for proper comparison using $expr
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          lineNo: 1,
          moNo: 1,
          checkedQty: 1,
          defectQty: 1,
          defectArray: 1,
          inspection_time: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
          minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
          second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
        }
      },
      {
        $match: {
          minute: { $gte: 0, $lte: 59 },
          second: { $gte: 0, $lte: 59 }
        }
      },
      {
        $group: {
          _id: { lineNo: "$lineNo", moNo: "$moNo", hour: "$hour" },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          defectRecords: { $push: "$defectArray" }
        }
      },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            lineNo: "$_id.lineNo",
            moNo: "$_id.moNo",
            hour: "$_id.hour",
            defectName: "$defectRecords.defectName"
          },
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defectCount: { $sum: "$defectRecords.totalCount" }
        }
      },
      {
        $group: {
          _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo", hour: "$_id.hour" },
          checkedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defects: {
            $push: {
              name: "$_id.defectName",
              count: {
                $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo" },
          hours: {
            $push: {
              hour: "$_id.hour",
              checkedQty: "$checkedQty",
              defects: "$defects",
              defectQty: "$totalDefectQty"
            }
          },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" }
        }
      },
      {
        $group: {
          _id: "$_id.lineNo",
          moNos: {
            $push: {
              moNo: "$_id.moNo",
              hours: "$hours",
              totalCheckedQty: "$totalCheckedQty",
              totalDefectQty: "$totalDefectQty",
              totalRate: {
                $cond: [
                  { $eq: ["$totalCheckedQty", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                      100
                    ]
                  }
                ]
              }
            }
          },
          totalCheckedQty: { $sum: "$totalCheckedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" }
        }
      },
      {
        $project: {
          lineNo: "$_id",
          moData: {
            $arrayToObject: {
              $map: {
                input: "$moNos",
                as: "mo",
                in: {
                  k: "$$mo.moNo",
                  v: {
                    hourData: {
                      $arrayToObject: {
                        $map: {
                          input: "$$mo.hours",
                          as: "h",
                          in: {
                            k: { $toString: { $add: ["$$h.hour", 1] } },
                            v: {
                              rate: {
                                $cond: [
                                  { $eq: ["$$h.checkedQty", 0] },
                                  0,
                                  {
                                    $multiply: [
                                      {
                                        $divide: [
                                          "$$h.defectQty",
                                          "$$h.checkedQty"
                                        ]
                                      },
                                      100
                                    ]
                                  }
                                ]
                              },
                              hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
                              checkedQty: "$$h.checkedQty",
                              defects: "$$h.defects"
                            }
                          }
                        }
                      }
                    },
                    totalRate: "$$mo.totalRate"
                  }
                }
              }
            }
          },
          totalRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      },
      { $sort: { lineNo: 1 } }
    ]);

    const totalData = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          checkedQty: 1,
          defectQty: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
        }
      },
      {
        $group: {
          _id: "$hour",
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          hour: "$_id",
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
          _id: 0
        }
      }
    ]);

    const grandTotal = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      }
    ]);

    const result = {};
    data.forEach((item) => {
      result[item.lineNo] = {};
      Object.keys(item.moData).forEach((moNo) => {
        result[item.lineNo][moNo] = {};
        Object.keys(item.moData[moNo].hourData).forEach((hour) => {
          const formattedHour = `${hour}:00`.padStart(5, "0");
          const hourData = item.moData[moNo].hourData[hour];
          result[item.lineNo][moNo][formattedHour] = {
            rate: hourData.rate,
            hasCheckedQty: hourData.hasCheckedQty,
            checkedQty: hourData.checkedQty,
            defects: hourData.defects.map((defect) => ({
              name: defect.name || "No Defect",
              count: defect.count,
              rate:
                hourData.checkedQty > 0
                  ? (defect.count / hourData.checkedQty) * 100
                  : 0
            }))
          };
        });
        result[item.lineNo][moNo].totalRate = item.moData[moNo].totalRate;
      });
      result[item.lineNo].totalRate = item.totalRate;
    });

    result.total = {};
    totalData.forEach((item) => {
      const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
      if (item.hour >= 6 && item.hour <= 20) {
        result.total[formattedHour] = {
          rate: item.rate,
          hasCheckedQty: item.hasCheckedQty
        };
      }
    });

    result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

    const hours = [
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00"
    ];
    Object.keys(result).forEach((key) => {
      if (key !== "grand" && key !== "total") {
        Object.keys(result[key]).forEach((moNo) => {
          if (moNo !== "totalRate") {
            hours.forEach((hour) => {
              if (!result[key][moNo][hour]) {
                result[key][moNo][hour] = {
                  rate: 0,
                  hasCheckedQty: false,
                  checkedQty: 0,
                  defects: []
                };
              }
            });
          }
        });
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching defect rates by line:", error);
    res.status(500).json({ error: "Failed to fetch defect rates by line" });
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
// 1. Fetch Defect Data by defect_print_id
app.get("/api/defect-track/:defect_print_id", async (req, res) => {
  try {
    const { defect_print_id } = req.params;

    // Fetch from qc2_inspection_pass_bundle
    const inspectionRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defect_print_id
    });

    if (!inspectionRecord) {
      return res.status(404).json({ message: "Defect print ID not found" });
    }

    const printData = inspectionRecord.printArray.find(
      (item) => item.defect_print_id === defect_print_id
    );

    if (!printData) {
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    // Fetch existing repair tracking data if it exists
    const repairRecord = await QC2RepairTracking.findOne({ defect_print_id });

    const formattedData = {
      package_no: inspectionRecord.package_no,
      moNo: inspectionRecord.moNo,
      custStyle: inspectionRecord.custStyle,
      color: inspectionRecord.color,
      size: inspectionRecord.size,
      lineNo: inspectionRecord.lineNo,
      department: inspectionRecord.department,
      buyer: inspectionRecord.buyer,
      factory: inspectionRecord.factory,
      sub_con: inspectionRecord.sub_con,
      sub_con_factory: inspectionRecord.sub_con_factory,
      defect_print_id: printData.defect_print_id,
      garments: printData.printData.map((garment) => ({
        garmentNumber: garment.garmentNumber,
        defects: garment.defects.map((defect) => {
          const repairItem = repairRecord
            ? repairRecord.repairArray.find((r) => r.defectName === defect.name &&  r.garmentNumber === garment.garmentNumber)
            : null;
          return {
            name: defect.name,
            count: defect.count,
            repair: defect.repair,
            status: repairItem ? repairItem.status : "Fail",
            repair_date: repairItem ? repairItem.repair_date : "",
            repair_time: repairItem ? repairItem.repair_time : "",
            pass_bundle: repairItem ? repairItem.pass_bundle : "Not Checked",
          };
        })
      }))
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching defect track data:", error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Save/Update Repair Tracking Data
app.post("/api/repair-tracking", async (req, res) => {
  try {
    const {
      defect_print_id,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer,
      factory,
      sub_con,
      sub_con_factory,
      repairArray
    } = req.body;

    // Check if a record already exists
    let existingRecord = await QC2RepairTracking.findOne({ defect_print_id });

    if (existingRecord) {
      // Update existing record
      existingRecord.repairArray = existingRecord.repairArray.map((item) => {
        const updatedItem = repairArray.find(
          (newItem) => newItem.defectName === item.defectName && newItem.garmentNumber === item.garmentNumber
        );
        if (updatedItem) {
          // Determine if pass_bundle needs to be updated
          let newPassBundle = item.pass_bundle;
          if (updatedItem.status !== item.status) {
            newPassBundle = updatedItem.status === "Fail" ? "Not Checked" : updatedItem.status === "OK" ? "Fail" : updatedItem.status === "Unrepairable" ? "Fail" : "Not Checked";
          }
          return {
            ...item,
            status: updatedItem.status,
            repair_date: updatedItem.repair_date,
            repair_time: updatedItem.repair_time,
            pass_bundle: newPassBundle,
          };
        }
        return item;
      });

       //Add new items
       const newItems = repairArray.filter(newItem => !existingRecord.repairArray.some(
        existingItem => existingItem.defectName === newItem.defectName && existingItem.garmentNumber === newItem.garmentNumber
    ));

    if (newItems.length > 0) {
        existingRecord.repairArray.push(...newItems);
    }

      await existingRecord.save();
      res.status(200).json({
        message: "Repair tracking updated successfully",
        data: existingRecord
      });
    } else {
      // Create new record
      const newRecord = new QC2RepairTracking({
        package_no,
        moNo,
        custStyle,
        color,
        size,
        lineNo,
        department,
        buyer,
        factory,
        sub_con,
        sub_con_factory,
        defect_print_id,
        repairArray: repairArray.map((item) => ({
          defectName: item.defectName,
          defectCount: item.defectCount,
          repairGroup: item.repairGroup,
          garmentNumber: item.garmentNumber,
          status: item.status || "Fail",
          repair_date: item.repair_date || "",
          repair_time: item.repair_time || "",
          pass_bundle: item.status === "Fail" ? "Not Checked" : item.status === "OK" ? "Fail" : item.status === "Unrepairable" ? "Fail": "Not Checked",
        }))
      });
      await newRecord.save();
      res.status(201).json({
        message: "Repair tracking saved successfully",
        data: newRecord
      });
    }
  } catch (error) {
    console.error("Error saving/updating repair tracking:", error);
    res.status(500).json({
      message: "Failed to save/update repair tracking",
      error: error.message
    });
  }
});


// Endpoint to update defect status for a rejected garment
app.post("/api/qc2-repair-tracking/update-defect-status", async (req, res) => {
  const { defect_print_id, garmentNumber, failedDefects, isRejecting } = req.body;
  try {
    const repairTracking = await QC2RepairTracking.find({ defect_print_id });
    if (!repairTracking || repairTracking.length == 0) {
      return res.status(404).json({ message: "Repair tracking not found" });
    }

    const rt = repairTracking[0];

    rt.repairArray = rt.repairArray.map(item => {
      if (item.garmentNumber === garmentNumber) {
        if (isRejecting && failedDefects.some(fd => fd.name === item.defectName)) {
          item.status = "Fail";
          item.repair_date = null;
          item.repair_time = null;
          item.pass_bundle = "Fail"; 
        } else if (isRejecting) {
          // If rejecting but not in failedDefectIds, don't change status or pass_bundle
        } else {
          item.status = "OK";
          const now = new Date();
          item.repair_date = now.toLocaleDateString("en-US");
          item.repair_time = now.toLocaleTimeString("en-US", { hour12: false });
          // Only set pass_bundle to "Pass" if not rejecting
          item.pass_bundle = "Pass"; 
        }
      }
      return item;
    });

    await rt.save();
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to update pass_bundle status for all garments
app.post("/api/qc2-repair-tracking/update-pass-bundle-status", async (req, res) => {
  try {
    const { defect_print_id, pass_bundle } =
      req.body;

    const repairTracking = await QC2RepairTracking.findOne({
      defect_print_id,
    });

    if (!repairTracking) {
      return res.status(404).json({ message: "Repair tracking not found" });
    }

    const updatedRepairArray = repairTracking.repairArray.map((item) => {
        return {
          ...item.toObject(),
          pass_bundle: item.status === "OK" ? "Pass" : item.pass_bundle,
        };
    });

    repairTracking.repairArray = updatedRepairArray;
    await repairTracking.save();

    res
      .status(200)
      .json({ message: "pass_bundle status updated successfully" });
  } catch (error) {
    console.error("Error updating pass_bundle status:", error);
    res.status(500).json({
      message: "Failed to update pass_bundle status",
      error: error.message,
    });
  }
}
);



// Endpoint to update defect status by defect name and garment number
app.post("/api/qc2-repair-tracking/update-defect-status-by-name", async (req, res) => {
  const { defect_print_id, garmentNumber, defectName, status} = req.body;
  try {
    const repairTracking = await QC2RepairTracking.findOne({ defect_print_id });
    if (!repairTracking) {
      // console.error(`No repair tracking found for defect_print_id: ${defect_print_id}`); // Add this line
      return res.status(404).json({ message: "Repair tracking not found" });
    }
    
    // Find the specific defect and update it
    const updatedRepairArray = repairTracking.repairArray.map(item => {
      if (item.garmentNumber === garmentNumber && item.defectName === defectName) {
        if (item.status !== status) {
            const now = new Date();
            return {
                ...item,
                status: status,
                repair_date: status === "OK" ? now.toLocaleDateString("en-US") : null,
                repair_time: status === "OK" ? now.toLocaleTimeString("en-US", { hour12: false }) : null,
                // pass_bundle: status === "OK" ? "Pass" : status === "Fail" ? "Fail" : item.pass_bundle
                pass_bundle: status === "OK" ? "Pass" : item.pass_bundle,
            };
            
        } 
        // else {
        //     return item; // Don't update if no change is needed
        // }
      }
      return item;
    });
    // Check if any changes were made
    const hasChanges = repairTracking.repairArray.some((item, index) => {
      return JSON.stringify(item) !== JSON.stringify(updatedRepairArray[index]);
    });

    if (hasChanges) {
      repairTracking.repairArray = updatedRepairArray;
      await repairTracking.save();
      res.status(200).json({ message: "Defect status updated successfully" });
    } else {
      res.status(200).json({ message: "No changes were made" });
    }

  } catch (error) {
    console.error("Error updating defect status:", error);
    res.status(500).json({ message: "Failed to update defect status", error: error.message });
  }
});


// New endpoint to save scan data
app.post('/api/save-qc2-scan-data', async (req, res) => {
  try {
    const {
      bundle_random_id,
      defect_print_id,
      scanNo,
      scanDate,
      scanTime,
      totalRejects,
      totalPass,
      rejectGarmentCount,
      defectQty,
      isRejectGarment,
      isPassBundle,
      // sessionData,
      confirmedDefects,
      repairStatuses,
      inspection_operator,
    } = req.body;


    // Optional: Ensure scanDate is in MM/DD/YYYY format
    let formattedScanDate = scanDate;
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(scanDate)) {
      const now = new Date();
      formattedScanDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    }


    // 1. Save to qc2_orderdata
    let orderData = await QC2OrderData.findOne({ bundle_random_id });
    if (!orderData) {
      orderData = new QC2OrderData({
        bundle_random_id,
        qc2InspectionDefect: [], // Initialize as empty array
      });
    } 
    // else {
    //   console.log('Existing order data found:', orderData);
    // }

    // Ensure qc2InspectionDefect is an array before pushing
    if (!Array.isArray(orderData.qc2InspectionDefect)) {
      orderData.qc2InspectionDefect = [];
    }

    orderData.qc2InspectionDefect.push({
      scanNo,
      scanDate: formattedScanDate,
      scanTime,
      rejectGarmentCount,
      totalPass,
      totalRejects,
      defectQty,
      bundle_random_id,
      defect_print_id,
      isRejectGarment,
      isPassBundle,
      // sessionData,
      confirmedDefects,
      repairStatuses,
      inspection_operator,
    });

    await orderData.save();

    // 2. Save to qc2_inspection_pass_bundle
    const inspectionData = await QC2InspectionPassBundle.findOne({ bundle_random_id });
    if (inspectionData) {
      const printEntry = inspectionData.printArray.find(
        (entry) => entry.defect_print_id === defect_print_id
      );
      if (printEntry) {
        if (!Array.isArray(printEntry.inspectionHistory)) {
          printEntry.inspectionHistory = [];
        }
        printEntry.inspectionHistory.push({
          scanNo,
          scanDate: formattedScanDate,
          scanTime,
          rejectGarmentCount,
          totalPass,
          totalRejects,
          defectQty,
          isRejectGarment,
          isPassBundle,
          // sessionData,
          confirmedDefects,
          repairStatuses,
          inspection_operator,
        });
        await inspectionData.save();
      }
    }

    res.status(200).json({ message: 'Scan data saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save scan data', error: err.message });
  }
});

app.get('/api/get-current-scan-count/:bundle_random_id', async (req, res) => {
  const { bundle_random_id } = req.params;

  try {
    const inspectionData = await QC2InspectionPassBundle.findOne({ bundle_random_id });

    if (!inspectionData) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    const printEntry = inspectionData.printArray.find(
      (entry) => entry.defect_print_id === req.query.defect_print_id
    );

    if (!printEntry) {
      return res.status(404).json({ message: 'Defect print entry not found' });
    }

    const currentScanCount = printEntry.inspectionHistory.length;

    res.json({ currentScanCount });
  } catch (err) {
    console.error('Error fetching current scan count:', err);
    res.status(500).json({ message: 'Failed to fetch current scan count', error: err.message });
  }
});
/* ------------------------------
   QC2 - Reworks
------------------------------ */

// const QC2Reworks = mongoose.model("qc2_reworks", qc2ReworksSchema);

// Endpoint to save reworks (reject garment) data
app.post("/api/reworks", async (req, res) => {
  try {
    const {
      package_no,
      //bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      reworkGarments,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
    } = req.body;

    const newRecord = new QC2Reworks({
      package_no,
      //bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      reworkGarments,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
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
   QC2 - Defect Print
------------------------------ */

// Create new defect print record
app.post("/api/qc2-defect-print", async (req, res) => {
  try {
    const {
      factory,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      repair,
      count,
      count_print,
      defects,
      defect_id,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
    } = req.body;

    const now = new Date();
    const print_time = now.toLocaleTimeString("en-US", { hour12: false });

    const defectPrint = new QC2DefectPrint({
      factory,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      repair,
      count,
      count_print,
      defects,
      print_time,
      defect_id,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
    });

    const savedDefectPrint = await defectPrint.save();
    res.json(savedDefectPrint);
  } catch (error) {
    console.error("Error creating defect print record:", error);
    res.status(500).json({ error: error.message });
  }
});

// Search defect print records
app.get("/api/qc2-defect-print/search", async (req, res) => {
  try {
    const { moNo, package_no, repair } = req.query;
    const query = {};

    // Build the query object based on provided parameters
    if (moNo) {
      query.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    }

    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber)) {
        return res.status(400).json({ error: "Package No must be a number" });
      }
      query.package_no = packageNoNumber;
    }

    if (repair) {
      query.repair = { $regex: new RegExp(repair.trim(), "i") };
    }

    // Execute the search query
    const defectPrints = await QC2DefectPrint.find(query).sort({
      createdAt: -1,
    });

    // Return empty array if no results found
    if (!defectPrints || defectPrints.length === 0) {
      return res.json([]);
    }

    res.json(defectPrints);
  } catch (error) {
    console.error("Error searching defect print records:", error);
    res.status(500).json({
      error: "Failed to search defect cards",
      details: error.message,
    });
  }
});

// Fetch all defect print records
app.get("/api/qc2-defect-print", async (req, res) => {
  try {
    const defectPrints = await QC2DefectPrint.find().sort({ createdAt: -1 });

    if (!defectPrints || defectPrints.length === 0) {
      return res.json([]);
    }

    res.json(defectPrints);
  } catch (error) {
    console.error("Error fetching defect print records:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get defect print records by defect_id
app.get("/api/qc2-defect-print/:defect_id", async (req, res) => {
  try {
    const { defect_id } = req.params;
    const defectPrint = await QC2DefectPrint.findOne({ defect_id });

    if (!defectPrint) {
      return res.status(404).json({ error: "Defect print record not found" });
    }

    res.json(defectPrint);
  } catch (error) {
    console.error("Error fetching defect print record:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------
   QC2 OrderData Live Dashboard
------------------------------ */

app.get("/api/qc2-orderdata/filter-options", async (req, res) => {
  try {
    const filterOptions = await QC2OrderData.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$selectedMono" },
          color: { $addToSet: "$color" },
          size: { $addToSet: "$size" },
          department: { $addToSet: "$department" },
          empId: { $addToSet: "$emp_id" },
          buyer: { $addToSet: "$buyer" },
          lineNo: { $addToSet: "$lineNo" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          color: 1,
          size: 1,
          department: 1,
          empId: 1,
          buyer: 1,
          lineNo: 1
        }
      }
    ]);

    const result =
      filterOptions.length > 0
        ? filterOptions[0]
        : {
            moNo: [],
            color: [],
            size: [],
            department: [],
            empId: [],
            buyer: [],
            lineNo: []
          };

    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

app.get("/api/qc2-orderdata-summary", async (req, res) => {
  try {
    const {
      moNo,
      startDate,
      endDate,
      color,
      size,
      department,
      empId,
      buyer,
      lineNo,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (empId) match.emp_id = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };
    if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };
    if (startDate || endDate) {
      match.updated_date_seperator = {};
      if (startDate) match.updated_date_seperator.$gte = startDate;
      if (endDate) match.updated_date_seperator.$lte = endDate;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                totalGarmentsQty: { $sum: "$count" },
                uniqueMONos: { $addToSet: "$selectedMono" },
                uniqueColors: { $addToSet: "$color" }, // Add unique colors
                uniqueSizes: { $addToSet: "$size" }, // Add unique sizes
                uniqueOrderQty: {
                  $addToSet: { moNo: "$selectedMono", orderQty: "$orderQty" }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalRegisteredBundleQty: 1,
                totalGarmentsQty: 1,
                totalMO: { $size: "$uniqueMONos" },
                totalColors: { $size: "$uniqueColors" }, // Count unique colors
                totalSizes: { $size: "$uniqueSizes" }, // Count unique sizes
                totalOrderQty: {
                  $sum: {
                    $map: {
                      input: "$uniqueOrderQty",
                      in: "$$this.orderQty"
                    }
                  }
                }
              }
            }
          ],
          tableData: [
            {
              $group: {
                _id: {
                  lineNo: "$lineNo",
                  moNo: "$selectedMono",
                  custStyle: "$custStyle",
                  country: "$country",
                  buyer: "$buyer",
                  color: "$color",
                  size: "$size",
                  empId: "$emp_id" // Add emp_id to group
                },
                totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                totalGarments: { $sum: "$count" },
                orderQty: { $first: "$orderQty" } // Use $first to get orderQty for each unique MO
              }
            },
            {
              $project: {
                _id: 0,
                lineNo: "$_id.lineNo",
                moNo: "$_id.moNo",
                custStyle: "$_id.custStyle",
                country: "$_id.country",
                buyer: "$_id.buyer",
                color: "$_id.color",
                size: "$_id.size",
                empId: "$_id.empId", // Include empId in output
                totalRegisteredBundleQty: 1,
                totalGarments: 1,
                orderQty: 1 // Include orderQty in output
              }
            },
            { $sort: { lineNo: 1, moNo: 1 } },
            { $skip: skip },
            { $limit: limitNum }
          ],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2OrderData.aggregate(pipeline);
    const summary = result[0].summary[0] || {
      totalRegisteredBundleQty: 0,
      totalGarmentsQty: 0,
      totalMO: 0,
      totalColors: 0, // Default for new fields
      totalSizes: 0,
      totalOrderQty: 0
    };
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ summary, tableData, total });
  } catch (error) {
    console.error("Error fetching order data summary:", error);
    res.status(500).json({ error: "Failed to fetch order data summary" });
  }
});


/* ------------------------------
   QC2 Washing Live Dashboard
------------------------------ */
app.get("/api/washing-autocomplete", async (req, res) => {
  try {
    const { field, query } = req.query;

    // Validate field
    const validFields = [
      "selectedMono",
      "custStyle",
      "buyer",
      "color",
      "size",
      "emp_id_washing"
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    // Build match stage for partial search (optional)
    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(query.trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: `$${field}`
        }
      },
      {
        $project: {
          _id: 0,
          value: "$_id"
        }
      },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : []) // Limit only when searching
    ];

    const results = await Washing.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

app.get("/api/washing-summary", async (req, res) => {
  try {
    const {
      moNo,
      custStyle, // Added for filtering
      color,
      size,
      empId,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (custStyle)
      match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
    if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
    if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
    if (empId) match.emp_id_washing = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size"
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 55] }, "$totalBundleQty", 0]
            }
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 86] }, "$totalBundleQty", 0]
            }
          },
          goodGarments: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 55] },
                { $toInt: "$passQtyWash" },
                0
              ]
            }
          },
          defectiveGarments: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 86] },
                { $toInt: "$passQtyWash" },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1
        }
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await Washing.aggregate(pipeline);
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error("Error fetching washing summary:", error);
    res.status(500).json({ error: "Failed to fetch washing summary" });
  }
});

/* ------------------------------
   Ironing Live Dashboard Endpoints
------------------------------ */

// Summary endpoint for IroningLive table
app.get("/api/ironing-summary", async (req, res) => {
  try {
    const {
      moNo,
      custStyle,
      color,
      size,
      empId,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (custStyle)
      match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
    if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
    if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
    if (empId) match.emp_id_ironing = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size"
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$totalBundleQty", 0]
            }
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 84] }, "$totalBundleQty", 0]
            }
          },
          goodGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          defectiveGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 84] }, "$passQtyIron", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1
        }
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await Ironing.aggregate(pipeline);
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error("Error fetching ironing summary:", error);
    res.status(500).json({ error: "Failed to fetch ironing summary" });
  }
});

// Autocomplete endpoint for IroningLive filters
app.get("/api/ironing-autocomplete", async (req, res) => {
  try {
    const { field, query } = req.query;

    const validFields = [
      "selectedMono",
      "custStyle",
      "buyer",
      "color",
      "size",
      "emp_id_ironing"
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(query.trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: `$${field}`
        }
      },
      {
        $project: {
          _id: 0,
          value: "$_id"
        }
      },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : [])
    ];

    const results = await Ironing.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching ironing autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

/* ------------------------------
   OPA Live Dashboard Endpoints
------------------------------ */

// Summary endpoint for OPALive table
app.get("/api/opa-summary", async (req, res) => {
  try {
    const {
      moNo,
      custStyle,
      color,
      size,
      empId,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (custStyle)
      match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
    if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
    if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
    if (empId) match.emp_id_opa = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size"
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 60] }, "$totalBundleQty", 0]
            }
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 85] }, "$totalBundleQty", 0]
            }
          },
          goodGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0]
            }
          },
          defectiveGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 85] }, "$passQtyOPA", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1
        }
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await OPA.aggregate(pipeline);
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error("Error fetching OPA summary:", error);
    res.status(500).json({ error: "Failed to fetch OPA summary" });
  }
});

// Autocomplete endpoint for OPALive filters
app.get("/api/opa-autocomplete", async (req, res) => {
  try {
    const { field, query } = req.query;

    const validFields = [
      "selectedMono",
      "custStyle",
      "buyer",
      "color",
      "size",
      "emp_id_opa"
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(query.trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: `$${field}`
        }
      },
      {
        $project: {
          _id: 0,
          value: "$_id"
        }
      },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : [])
    ];

    const results = await OPA.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching OPA autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

/* ------------------------------
   QC Inline Roving ENDPOINTS
------------------------------ */

// ------------------------
// Multer Storage Setup for QC Inline Roving
// ------------------------
const qcStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/storage/qcinline");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const { date, type, emp_id } = req.body;
    // Validate the inputs to prevent 'undefined' in the filename
    const currentDate = date || new Date().toISOString().split("T")[0]; // Fallback to current date if not provided
    const imageType = type || "spi-measurement"; // Fallback to 'unknown' if type is not provided
    const userEmpId = emp_id || "emp"; // Fallback to 'guest' if emp_id is not provided
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${currentDate}-${imageType}-${userEmpId}-${randomId}.jpg`;
    cb(null, fileName);
  }
});

const qcUpload = multer({
  storage: qcStorage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only (jpeg, jpg, png, gif)!");
    }
  }
}).single("image");

// Serve static files (for accessing uploaded images)
app.use("/storage", express.static(path.join(__dirname, "../public/storage")));

// Endpoint to upload images for QC Inline Roving
app.post("/api/upload-qc-image", qcUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const imagePath = `/storage/qcinline/${req.file.filename}`;
    res.status(200).json({ imagePath });
  } catch (error) {
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ message: "Failed to upload image", error: error.message });
  }
});



// Endpoint to fetch QC Inline Roving reports
app.get("/api/qc-inline-roving-reports", async (req, res) => {
  try {
    const reports = await QCInlineRoving.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error });
  }
});

// New endpoint to fetch filtered QC Inline Roving reports with date handling
app.get("/api/qc-inline-roving-reports-filtered", async (req, res) => {
  try {
    const { startDate, endDate, line_no, mo_no, emp_id } = req.query;

    let match = {};

    // Date filtering using $expr for string dates
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Other filters
    if (line_no) {
      match.line_no = line_no;
    }
    if (mo_no) {
      match.mo_no = mo_no;
    }
    if (emp_id) {
      match.emp_id = emp_id;
    }

    const reports = await QCInlineRoving.find(match);
    res.json(reports);
  } catch (error) {
    console.error("Error fetching filtered roving reports:", error);
    res.status(500).json({ message: "Error fetching filtered reports", error });
  }
});

// Endpoint to fetch distinct MO Nos
app.get("/api/qc-inline-roving-mo-nos", async (req, res) => {
  try {
    const moNos = await QCInlineRoving.distinct("mo_no");
    res.json(moNos.filter((mo) => mo)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching MO Nos:", error);
    res.status(500).json({ message: "Failed to fetch MO Nos" });
  }
});

// Endpoint to fetch distinct Buyer Names for Roving Report filters
app.get("/api/qc-inline-roving-buyers", async (req, res) => {
  try {
    const buyers = await QCInlineRoving.distinct("buyer_name");
    res.json(buyers.filter(b => b).sort()); // Filter out null/empty and sort
  } catch (error) {
    console.error("Error fetching buyers for Roving Report:", error);
    res.status(500).json({ message: "Error fetching buyers", error: error.message });
  }
});

// Endpoint to fetch distinct Operation Names from inlineData for Roving Report filters
app.get("/api/qc-inline-roving-operations", async (req, res) => {
  try {
    const operations = await QCInlineRoving.aggregate([
      { $unwind: "$inlineData" },
      { $match: { "inlineData.operation_name": { $ne: null, $ne: "" } } }, // Ensure operation_name exists and is not empty
      { $group: { _id: "$inlineData.operation_name" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, operation_name: "$_id" } }
    ]);
    res.json(operations.map(op => op.operation_name));
  } catch (error)
 {
    console.error("Error fetching operations for Roving Report:", error);
    res.status(500).json({ message: "Error fetching operations", error: error.message });
  }
});

// Endpoint to fetch distinct QC IDs (emp_id)
app.get("/api/qc-inline-roving-qc-ids", async (req, res) => {
  try {
    const qcIds = await QCInlineRoving.distinct("emp_id");
    res.json(qcIds.filter((id) => id)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching QC IDs:", error);
    res.status(500).json({ message: "Failed to fetch QC IDs" });
  }
});


/* ------------------------------
   QC Inline Roving New
------------------------------ */

//get the each line related working worker count
app.get("/api/line-summary", async (req, res) => {
  try {
    const lineSummaries = await UserMain.aggregate([
      {
        $match: {
          sect_name: { $ne: null, $ne: "" },
          working_status: "Working",
          job_title: "Sewing Worker",
        },
      },
      {
        $group: {
          _id: "$sect_name",
          worker_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          line_no: "$_id",
          real_worker_count: "$worker_count",
        },
      },
      { $sort: { line_no: 1 } },
    ]);

    const editedCountsDocs = await LineSewingWorker.find(
      {},
      "line_no edited_worker_count"
    ).lean();

    const editedCountsMap = new Map(
      editedCountsDocs.map((doc) => [doc.line_no, doc.edited_worker_count])
    );

    const mergedSummaries = lineSummaries.map((realSummary) => ({
      ...realSummary,
      edited_worker_count: editedCountsMap.get(realSummary.line_no),
    }));

    res.json(mergedSummaries);
  } catch (error) {
    console.error("Error fetching line summary:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch line summary data.", error: error.message });
  }
});

//Edit the line worker count
app.put("/api/line-sewing-workers/:lineNo", async (req, res) => {
  const { lineNo } = req.params;
  const { edited_worker_count } = req.body;

  if (
    typeof edited_worker_count !== "number" ||
    edited_worker_count < 0 ||
    !Number.isInteger(edited_worker_count)
  ) {
    return res
      .status(400)
      .json({ message: "Edited worker count must be a non-negative integer." });
  }
  try {
    const now = new Date();
    const realCountResult = await UserMain.aggregate([
      {
        $match: {
          sect_name: lineNo,
          working_status: "Working",
          job_title: "Sewing Worker",
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const current_real_worker_count =
      realCountResult.length > 0 ? realCountResult[0].count : 0;

    const historyEntry = {
      edited_worker_count,
      updated_at: now,
    };

    const updatedLineWorker = await LineSewingWorker.findOneAndUpdate(
      { line_no: lineNo },
      {
        $set: {
          real_worker_count: current_real_worker_count,
          edited_worker_count,
          updated_at: now,
        },
        $push: { history: historyEntry },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Line worker count updated successfully.",
      data: updatedLineWorker,
    });
  } catch (error) {
    console.error(`Error updating line worker count for line ${lineNo}:`, error);
    res
      .status(500)
      .json({ message: "Failed to update line worker count.", error: error.message });
  }
});
//Save the inline Roving data
app.post("/api/save-qc-inline-roving", async (req, res) => {
  try {
    const {
      inspection_date,
      mo_no,
      line_no,
      report_name,
      inspection_rep_item,
    } = req.body;

    if (!inspection_date || !mo_no || !line_no || !inspection_rep_item) {
      return res
        .status(400)
        .json({
          message:
            "Missing required fields: inspection_date, mo_no, line_no, or inspection_rep_item.",
        });
    }

    if (typeof inspection_rep_item !== "object" || inspection_rep_item === null) {
      return res
        .status(400)
        .json({ message: "inspection_rep_item must be a valid object." });
    }

    if (
      !inspection_rep_item.inspection_rep_name ||
      !inspection_rep_item.emp_id ||
      !inspection_rep_item.eng_name
    ) {
      return res
        .status(400)
        .json({
          message:
            "inspection_rep_item is missing required fields like inspection_rep_name, emp_id, or eng_name.",
        });
    }

    let doc = await QCInlineRoving.findOne({ inspection_date, mo_no, line_no });

    if (doc) {
      const existingRepIndex = doc.inspection_rep.findIndex(
        (rep) => rep.inspection_rep_name === inspection_rep_item.inspection_rep_name
      );

      if (existingRepIndex !== -1) {
        const repToUpdate = doc.inspection_rep[existingRepIndex];

        if (!Array.isArray(repToUpdate.inlineData)) {
          repToUpdate.inlineData = [];
        }

        if (inspection_rep_item.inlineData && inspection_rep_item.inlineData.length > 0) {
          repToUpdate.inlineData.push(inspection_rep_item.inlineData[0]);
        }

        repToUpdate.inspection_rep_name = inspection_rep_item.inspection_rep_name;
        repToUpdate.emp_id = inspection_rep_item.emp_id;
        repToUpdate.eng_name = inspection_rep_item.eng_name;
        repToUpdate.complete_inspect_operators = repToUpdate.inlineData.length;
        repToUpdate.Inspect_status =
          repToUpdate.total_operators > 0 &&
          repToUpdate.complete_inspect_operators >= repToUpdate.total_operators
            ? "Completed"
            : "Not Complete";
      } else {
        if (doc.inspection_rep.length < 5) {
          const newRepItem = { ...inspection_rep_item };
          if (!Array.isArray(newRepItem.inlineData)) {
            newRepItem.inlineData = [];
          }

          newRepItem.complete_inspect_operators = newRepItem.inlineData.length;
          newRepItem.Inspect_status =
            newRepItem.total_operators > 0 &&
            newRepItem.complete_inspect_operators >= newRepItem.total_operators
              ? "Completed"
              : "Not Complete";

          doc.inspection_rep.push(newRepItem);
        } else {
          return res
            .status(400)
            .json({
              message:
                "Maximum number of 5 inspection reports already recorded for this combination.",
            });
        }
      }

      if (report_name && doc.report_name !== report_name) {
        doc.report_name = report_name;
      }

      await doc.save();
      res.status(200).json({
        message: "QC Inline Roving data updated successfully.",
        data: doc,
      });
    } else {
      const lastDoc = await QCInlineRoving.findOne()
        .sort({ inline_roving_id: -1 })
        .select("inline_roving_id");

      const newId =
        lastDoc && typeof lastDoc.inline_roving_id === "number"
          ? lastDoc.inline_roving_id + 1
          : 1;

      const initialRepItem = { ...inspection_rep_item };
      if (!Array.isArray(initialRepItem.inlineData)) {
        initialRepItem.inlineData = [];
      }

      initialRepItem.complete_inspect_operators = initialRepItem.inlineData.length;
      initialRepItem.Inspect_status =
        initialRepItem.total_operators > 0 &&
        initialRepItem.complete_inspect_operators >= initialRepItem.total_operators
          ? "Completed"
          : "Not Complete";

      const newQCInlineRovingDoc = new QCInlineRoving({
        inline_roving_id: newId,
        report_name:
          report_name || `Report for ${inspection_date} - ${line_no} - ${mo_no}`,
        inspection_date,
        mo_no,
        line_no,
        inspection_rep: [initialRepItem],
      });

      await newQCInlineRovingDoc.save();
      res.status(201).json({
        message: "QC Inline Roving data saved successfully (new record created).",
        data: newQCInlineRovingDoc,
      });
    }
  } catch (error) {
    console.error("Error saving/updating QC Inline Roving data:", error);
    res.status(500).json({
      message: "Failed to save/update QC Inline Roving data",
      error: error.message,
    });
  }
});

function getOrdinal(n) {
  if (n <= 0) return String(n);
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0] || "th");
}

//Get the inspection Number
app.get("/api/qc-inline-roving/inspection-time-info", async (req, res) => {
  try {
    const { line_no, inspection_date } = req.query;
    if (!line_no || !inspection_date) {
      return res
        .status(400)
        .json({ message: "Line number and inspection date are required." });
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(inspection_date)) {
      return res
        .status(400)
        .json({ message: "Invalid inspection date format. Expected MM/DD/YYYY." });
    }

    const lineWorkerInfo = await LineSewingWorker.findOne({ line_no });

    if (!lineWorkerInfo) {
      return res.json({ inspectionTimeOrdinal: "N/A (Line not configured)" });
    }

    const target_worker_count = lineWorkerInfo.edited_worker_count;

    if (target_worker_count === 0) {
      return res.json({ inspectionTimeOrdinal: "N/A (Target 0 workers)" });
    }

    const rovingRecords = await QCInlineRoving.find({
      line_no: line_no,
      inspection_date: inspection_date,
    });

    if (rovingRecords.length === 0) {
      return res.json({ inspectionTimeOrdinal: getOrdinal(1) });
    }

    const operatorInspectionCounts = {};

    rovingRecords.forEach((record) => {
      record.inlineData.forEach((entry) => {
        const operatorId = entry.operator_emp_id;
        if (operatorId) {
          operatorInspectionCounts[operatorId] =
            (operatorInspectionCounts[operatorId] || 0) + 1;
        }
      });
    });

    if (Object.keys(operatorInspectionCounts).length === 0) {
      return res.json({ inspectionTimeOrdinal: getOrdinal(1) });
    }

    let completed_rounds = 0;

    for (let round_num = 1; round_num <= 5; round_num++) {
      let operators_finished_this_round = 0;

      for (const operator_id in operatorInspectionCounts) {
        if (operatorInspectionCounts[operator_id] >= round_num) {
          operators_finished_this_round++;
        }
      }

      if (operators_finished_this_round >= target_worker_count) {
        completed_rounds = round_num;
      } else {
        break;
      }
    }

    const current_inspection_time_number = completed_rounds + 1;

    const ordinal =
      current_inspection_time_number > 5
        ? `${getOrdinal(5)} (Completed)`
        : getOrdinal(current_inspection_time_number);

    res.json({ inspectionTimeOrdinal: ordinal });
  } catch (error) {
    console.error("Error fetching inspection time info:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch inspection time info.", error: error.message });
  }
});

//Get the completed inspect operators
app.get("/api/inspections-completed", async (req, res) => {
  const { line_no, inspection_date, mo_no, operation_id, inspection_rep_name } =
    req.query;

  try {
    const findQuery = {
      line_no,
      inspection_date,
    };

    if (mo_no) {
      findQuery.mo_no = mo_no;
    }

    const elemMatchConditions = { inspection_rep_name };

    if (operation_id) {
      elemMatchConditions["inlineData.tg_no"] = operation_id;
    }

    findQuery.inspection_rep = { $elemMatch: elemMatchConditions };

    const inspection = await QCInlineRoving.findOne(findQuery);

    if (!inspection) {
      return res.json({ completeInspectOperators: 0 });
    }

    const specificRep = inspection.inspection_rep.find(
      (rep) => rep.inspection_rep_name === inspection_rep_name
    );

    if (!specificRep) {
      return res.json({ completeInspectOperators: 0 });
    }

    const completeInspectOperators = specificRep.complete_inspect_operators || 0;

    res.json({ completeInspectOperators });
  } catch (error) {
    console.error("Error fetching inspections completed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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

// Endpoint for get the buyer status
app.get("/api/buyer-by-mo", (req, res) => {
  const { moNo } = req.query;
  if (!moNo) {
    return res.status(400).json({ message: "MO number is required" });
  }
  const buyerName = determineBuyer(moNo);
  res.json({ buyerName });
});

/* ------------------------------
   QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

// Endpoint to fetch filtered QC1 Sunrise data for the dashboard
app.get("/api/sunrise/qc1-data", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    const matchStage = {};

    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) {
      matchStage["DefectArray.defectName"] = defectName;
    }

    const pipeline = [];

    // Stage 1: Add a field with the date converted to a Date object
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            // Assuming inspectionDate is stored as "MM-DD-YYYY"
            dateString: "$inspectionDate",
            format: "%m-%d-%Y",
            onError: null, // Handle potential parsing errors
            onNull: null
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided (using the converted date field)
    if (startDate && endDate) {
      try {
        const start = new Date(startDate); // Input format YYYY-MM-DD
        const end = new Date(endDate); // Input format YYYY-MM-DD
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error("Invalid date format received.");
        }
        end.setHours(23, 59, 59, 999); // Include the full end day

        pipeline.push({
          $match: {
            inspectionDateAsDate: {
              $gte: start,
              $lte: end
            },
            ...matchStage // Include other filters
          }
        });
      } catch (dateError) {
        console.error("Error parsing date filters:", dateError);
        return res.status(400).json({
          message: "Invalid date format provided for filtering.",
          error: dateError.message
        });
      }
    } else {
      // If no date range, match on other filters and ensure date is valid
      pipeline.push({
        $match: {
          inspectionDateAsDate: { $ne: null }, // Ensure date was parsed correctly
          ...matchStage
        }
      });
    }

    // Stage 3: Filter DefectArray if defectName is provided
    if (defectName) {
      pipeline.push({
        $addFields: {
          DefectArray: {
            $filter: {
              input: "$DefectArray",
              as: "defect",
              cond: { $eq: ["$$defect.defectName", defectName] }
            }
          }
        }
      });

      // Stage 4: Recalculate totalDefectsQty based on the filtered DefectArray
      pipeline.push({
        $addFields: {
          totalDefectsQty: {
            $sum: "$DefectArray.defectQty"
          }
        }
      });
    }

    // Stage 5: Sort by lineNo (assuming it's a string that can be numerically sorted, adjust if needed)
    pipeline.push({
      $sort: { lineNo: 1 }
    });

    // Fetch data from MongoDB
    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Transform the inspectionDate back to DD/MM/YYYY for display
    const transformedData = data.map((item) => {
      // Original format is MM-DD-YYYY, needs to be DD/MM/YYYY
      const [month, day, year] = item.inspectionDate.split("-");
      return {
        ...item,
        inspectionDate: `${day}/${month}/${year}` // Convert to DD/MM/YYYY
      };
    });

    res.json(transformedData);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise data:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise data",
      error: err.message
    });
  }
});

// Endpoint to fetch unique filter values with cross-filtering
app.get("/api/sunrise/qc1-filters", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    const matchStage = {};

    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    const pipeline = [];

    // Stage 1: Add converted date field
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: "$inspectionDate",
            format: "%m-%d-%Y",
            onError: null,
            onNull: null
          }
        }
      }
    });

    // Stage 2: Apply date range filter
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error("Invalid date format received.");
        }
        end.setHours(23, 59, 59, 999);

        pipeline.push({
          $match: {
            inspectionDateAsDate: {
              $gte: start,
              $lte: end
            },
            ...matchStage
          }
        });
      } catch (dateError) {
        console.error("Error parsing date filters:", dateError);
        return res.status(400).json({
          message: "Invalid date format provided for filtering.",
          error: dateError.message
        });
      }
    } else {
      pipeline.push({
        $match: {
          inspectionDateAsDate: { $ne: null },
          ...matchStage
        }
      });
    }

    // Fetch unique values concurrently
    const [
      uniqueLineNos,
      uniqueMONos,
      uniqueColors,
      uniqueSizes,
      uniqueBuyers,
      uniqueDefectNames
    ] = await Promise.all([
      QC1Sunrise.aggregate([
        ...pipeline,
        { $match: { lineNo: { $ne: null, $ne: "" } } },
        { $group: { _id: "$lineNo" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $match: { MONo: { $ne: null, $ne: "" } } },
        { $group: { _id: "$MONo" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $match: { Color: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Color" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $match: { Size: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Size" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $match: { Buyer: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Buyer" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $unwind: "$DefectArray" },
        { $match: { "DefectArray.defectName": { $ne: null, $ne: "" } } },
        { $group: { _id: "$DefectArray.defectName" } }
      ]).exec()
    ]);

    // Helper to extract, filter, and sort
    const processResults = (results, numericSort = false) => {
      const values = results.map((item) => item._id).filter(Boolean);
      return numericSort
        ? values.sort((a, b) => parseInt(a) - parseInt(b))
        : values.sort();
    };

    res.json({
      lineNos: processResults(uniqueLineNos, true),
      MONos: processResults(uniqueMONos),
      Colors: processResults(uniqueColors),
      Sizes: processResults(uniqueSizes),
      Buyers: processResults(uniqueBuyers),
      defectNames: processResults(uniqueDefectNames)
    });
  } catch (err) {
    console.error("Error fetching QC1 Sunrise filter values:", err);
    res.status(500).json({
      message: "Failed to fetch filter values",
      error: err.message
    });
  }
});

// Endpoint for daily trend data
app.get("/api/sunrise/qc1-daily-trend", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required." });
    }

    const matchStage = {};

    // Date filtering using $expr
    matchStage.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m-%d-%Y", // Matches stored format MM-DD-YYYY
                onError: null
              }
            },
            { $dateFromString: { dateString: startDate, format: "%Y-%m-%d" } } // Input format YYYY-MM-DD
          ]
        },
        {
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m-%d-%Y",
                onError: null
              }
            },
            { $dateFromString: { dateString: endDate, format: "%Y-%m-%d" } } // Input format YYYY-MM-DD
          ]
        }
      ]
    };

    // Add other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) {
      matchStage["DefectArray.defectName"] = defectName;
    }

    const pipeline = [
      { $match: matchStage },
      // Optional: Filter DefectArray if defectName is provided
      ...(defectName
        ? [
            {
              $addFields: {
                DefectArray: {
                  $filter: {
                    input: "$DefectArray",
                    as: "defect",
                    cond: { $eq: ["$$defect.defectName", defectName] }
                  }
                }
              }
            },
            {
              $addFields: {
                totalDefectsQty: { $sum: "$DefectArray.defectQty" }
              }
            }
          ]
        : []),
      {
        $group: {
          _id: "$inspectionDate", // Group by the original date string
          checkedQty: { $sum: "$CheckedQty" },
          defectQty: { $sum: "$totalDefectsQty" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id", // Keep original MM-DD-YYYY format
          checkedQty: 1,
          defectQty: 1,
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $multiply: [{ $divide: ["$defectQty", "$checkedQty"] }, 100] }
            ]
          }
        }
      },
      // Sort by date after grouping
      {
        $addFields: {
          sortDate: {
            $dateFromString: { dateString: "$date", format: "%m-%d-%Y" }
          }
        }
      },
      { $sort: { sortDate: 1 } },
      { $project: { sortDate: 0 } } // Remove temporary sort field
    ];

    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Transform date to DD/MM/YYYY for frontend display
    const transformedData = data.map((item) => {
        const [month, day, year] = item.date.split("-");
        return {
          ...item,
          date: `${day}/${month}/${year}`
        };
    });


    res.json(transformedData);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise daily trend:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise daily trend",
      error: err.message
    });
  }
});

// Endpoint for weekly data aggregation
app.get("/api/sunrise/qc1-weekly-data", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required for weekly view." });
    }

    // Validate date format YYYY-MM-DD
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date value." });
    }
    end.setHours(23, 59, 59, 999); // Include the full end day

    const matchStageBase = {};
    if (lineNo) matchStageBase.lineNo = lineNo;
    if (MONo) matchStageBase.MONo = MONo;
    if (Color) matchStageBase.Color = Color;
    if (Size) matchStageBase.Size = Size;
    if (Buyer) matchStageBase.Buyer = Buyer;
    if (defectName) matchStageBase["DefectArray.defectName"] = defectName;

    const pipeline = [];

    // Convert stored date string to Date object
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: "$inspectionDate",
            format: "%m-%d-%Y", // Stored format
            onError: null,
            onNull: null
          }
        }
      }
    });

    // Filter by date range and other criteria
    pipeline.push({
      $match: {
        inspectionDateAsDate: {
          $gte: start,
          $lte: end,
          $ne: null // Exclude records with invalid dates
        },
        ...matchStageBase
      }
    });

    // Optional: Filter DefectArray if defectName is provided
    if (defectName) {
      pipeline.push({
        $addFields: {
          DefectArray: {
            $filter: {
              input: "$DefectArray",
              as: "defect",
              cond: { $eq: ["$$defect.defectName", defectName] }
            }
          }
        }
      });
      // Recalculate totalDefectsQty based on filtered array
      pipeline.push({
        $addFields: {
          totalDefectsQty: { $sum: "$DefectArray.defectQty" }
        }
      });
    }


    // Group by week start date (Monday) and other selected fields
    pipeline.push({
      $group: {
        _id: {
          weekStartDate: {
            $dateTrunc: {
              date: "$inspectionDateAsDate",
              unit: "week",
              startOfWeek: "Monday" // Set Monday as the start of the week
            }
          },
          // Include other grouping fields if needed by frontend logic
          lineNo: "$lineNo",
          MONo: "$MONo",
          Buyer: "$Buyer",
          Color: "$Color",
          Size: "$Size"
        },
        CheckedQty: { $sum: "$CheckedQty" },
        totalDefectsQty: { $sum: "$totalDefectsQty" },
        // Aggregate defects if needed per group, otherwise fetch raw data first
        DefectArrays: { $push: "$DefectArray" } // Collect arrays to process later if needed
      }
    });

    // Re-aggregate defects within each group
    pipeline.push({ $unwind: { path: "$DefectArrays", preserveNullAndEmptyArrays: true } });
    pipeline.push({ $unwind: { path: "$DefectArrays", preserveNullAndEmptyArrays: true } });
    pipeline.push({
        $group: {
            _id: {
                groupInfo: "$_id", // Keep the original group _id
                defectName: "$DefectArrays.defectName"
            },
            CheckedQty: { $first: "$CheckedQty" }, // Carry over total checked qty
            totalDefectsQty: { $first: "$totalDefectsQty" }, // Carry over total defects qty
            defectQty: { $sum: "$DefectArrays.defectQty" } // Sum qty for this specific defect
        }
    });
     // Filter out null defect names that might result from empty arrays
    pipeline.push({
        $match: {
            "_id.defectName": { $ne: null }
        }
    });
    // Group back by the original group _id to reconstruct the DefectArray
    pipeline.push({
        $group: {
            _id: "$_id.groupInfo",
            CheckedQty: { $first: "$CheckedQty" },
            totalDefectsQty: { $first: "$totalDefectsQty" },
            DefectArray: {
                $push: {
                    defectName: "$_id.defectName",
                    defectQty: "$defectQty"
                }
            }
        }
    });


    // Project the final structure
    pipeline.push({
      $project: {
        _id: 0,
        weekStartDate: "$_id.weekStartDate",
        lineNo: "$_id.lineNo",
        MONo: "$_id.MONo",
        Buyer: "$_id.Buyer",
        Color: "$_id.Color",
        Size: "$_id.Size",
        CheckedQty: 1,
        totalDefectsQty: 1,
        DefectArray: { // Ensure DefectArray only contains valid defects
            $filter: {
                input: "$DefectArray",
                as: "defect",
                cond: { $ne: ["$$defect.defectName", null] }
            }
        }
      }
    });

    // Sort the results
    pipeline.push({
      $sort: {
        weekStartDate: 1,
        lineNo: 1,
        MONo: 1,
        Buyer: 1,
        Color: 1,
        Size: 1
      }
    });

    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Add weekKey (e.g., "2023-W34") to each result item
    const transformedData = data.map((item) => {
      const year = item.weekStartDate.getFullYear();
      // Calculate ISO week number
      const date = item.weekStartDate;
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7)); // Thursday of the week
      const week1 = new Date(date.getFullYear(), 0, 4);
      const weekNum =
        1 +
        Math.round(
          ((date.getTime() - week1.getTime()) / 86400000 -
            3 +
            ((week1.getDay() + 6) % 7)) /
            7
        );

      return {
        ...item,
        weekKey: `${year}-W${String(weekNum).padStart(2, "0")}`
      };
    });

    res.json(transformedData);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise weekly data:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise weekly data",
      error: err.message
    });
  }
});

// Endpoint for weekly filter options
app.get("/api/sunrise/qc1-weekly-filters", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required for filters." });
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date value." });
    }
    end.setHours(23, 59, 59, 999);

    const basePipeline = [];

    // Convert date string and filter by date range
    basePipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: "$inspectionDate",
            format: "%m-%d-%Y",
            onError: null,
            onNull: null
          }
        }
      }
    });
    basePipeline.push({
      $match: {
        inspectionDateAsDate: {
          $gte: start,
          $lte: end,
          $ne: null
        }
      }
    });

    // Apply other filters if provided
    const matchStageOthers = {};
    if (lineNo) matchStageOthers.lineNo = lineNo;
    if (MONo) matchStageOthers.MONo = MONo;
    if (Color) matchStageOthers.Color = Color;
    if (Size) matchStageOthers.Size = Size;
    if (Buyer) matchStageOthers.Buyer = Buyer;
    if (defectName) matchStageOthers["DefectArray.defectName"] = defectName;

    if (Object.keys(matchStageOthers).length > 0) {
      basePipeline.push({ $match: matchStageOthers });
    }

    // Fetch unique values concurrently
    const [
      uniqueLineNos,
      uniqueMONos,
      uniqueColors,
      uniqueSizes,
      uniqueBuyers,
      uniqueDefectNames
    ] = await Promise.all([
      QC1Sunrise.aggregate([
        ...basePipeline,
        { $match: { lineNo: { $ne: null, $ne: "" } } },
        { $group: { _id: "$lineNo" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...basePipeline,
        { $match: { MONo: { $ne: null, $ne: "" } } },
        { $group: { _id: "$MONo" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...basePipeline,
        { $match: { Color: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Color" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...basePipeline,
        { $match: { Size: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Size" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...basePipeline,
        { $match: { Buyer: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Buyer" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        ...basePipeline,
        { $unwind: "$DefectArray" },
        { $match: { "DefectArray.defectName": { $ne: null, $ne: "" } } },
        { $group: { _id: "$DefectArray.defectName" } }
      ]).exec()
    ]);

    // Helper to process results
    const processResults = (results, numericSort = false) => {
      const values = results.map((item) => item._id).filter(Boolean);
      return numericSort
        ? values.sort((a, b) => parseInt(a) - parseInt(b))
        : values.sort();
    };

    res.json({
      lineNos: processResults(uniqueLineNos, true),
      MONos: processResults(uniqueMONos),
      Colors: processResults(uniqueColors),
      Sizes: processResults(uniqueSizes),
      Buyers: processResults(uniqueBuyers),
      defectNames: processResults(uniqueDefectNames)
    });
  } catch (err) {
    console.error("Error fetching QC1 Sunrise weekly filter values:", err);
    res.status(500).json({
      message: "Failed to fetch weekly filter values",
      error: err.message
    });
  }
});


// Endpoint for monthly data aggregation
app.get("/api/sunrise/qc1-monthly-data", async (req, res) => {
  try {
    const { startMonth, endMonth, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    if (!startMonth || !endMonth) {
      return res
        .status(400)
        .json({ error: "Start and end months are required." });
    }
    if (
      !/^\d{4}-\d{2}$/.test(startMonth) ||
      !/^\d{4}-\d{2}$/.test(endMonth)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid month format. Use YYYY-MM." });
    }

    const matchStage = {};

    // Filter by month range using $expr
    matchStage.$expr = {
      $and: [
        {
          $gte: [
            {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // YYYY
                "-",
                { $substr: ["$inspectionDate", 0, 2] } // MM
              ]
            },
            startMonth
          ]
        },
        {
          $lte: [
            {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // YYYY
                "-",
                { $substr: ["$inspectionDate", 0, 2] } // MM
              ]
            },
            endMonth
          ]
        }
      ]
    };

    // Add other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    const pipeline = [];
    pipeline.push({ $match: matchStage });

    // Optional: Filter DefectArray if defectName is provided
    if (defectName) {
      pipeline.push({
        $addFields: {
          DefectArray: {
            $filter: {
              input: "$DefectArray",
              as: "defect",
              cond: { $eq: ["$$defect.defectName", defectName] }
            }
          }
        }
      });
      pipeline.push({
        $addFields: {
          totalDefectsQty: { $sum: "$DefectArray.defectQty" }
        }
      });
    }

    // Add yearMonth field for sorting/grouping if needed later
    pipeline.push({
      $addFields: {
        yearMonth: {
          $concat: [
            { $substr: ["$inspectionDate", 6, 4] },
            "-",
            { $substr: ["$inspectionDate", 0, 2] }
          ]
        }
      }
    });

    // Sort before sending response
    pipeline.push({
      $sort: {
        yearMonth: 1,
        lineNo: 1,
        MONo: 1,
        Buyer: 1,
        Color: 1,
        Size: 1
      }
    });

    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Transform date to DD/MM/YYYY for frontend display
    const transformedData = data.map((item) => {
      const [month, day, year] = item.inspectionDate.split("-");
      return {
        ...item,
        inspectionDate: `${day}/${month}/${year}`
      };
    });

    res.json(transformedData);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise monthly data:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise monthly data",
      error: err.message
    });
  }
});

// Endpoint for monthly trend data
app.get("/api/sunrise/qc1-monthly-trend", async (req, res) => {
  try {
    const { startMonth, endMonth, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    if (!startMonth || !endMonth) {
      return res
        .status(400)
        .json({ error: "Start and end months are required." });
    }
    if (
      !/^\d{4}-\d{2}$/.test(startMonth) ||
      !/^\d{4}-\d{2}$/.test(endMonth)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid month format. Use YYYY-MM." });
    }

    const matchStage = {};

    // Filter by month range
    matchStage.$expr = {
      $and: [
        {
          $gte: [
            {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] },
                "-",
                { $substr: ["$inspectionDate", 0, 2] }
              ]
            },
            startMonth
          ]
        },
        {
          $lte: [
            {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] },
                "-",
                { $substr: ["$inspectionDate", 0, 2] }
              ]
            },
            endMonth
          ]
        }
      ]
    };

    // Add other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    const pipeline = [
      { $match: matchStage },
      // Optional: Filter DefectArray if defectName is provided
      ...(defectName
        ? [
            {
              $addFields: {
                DefectArray: {
                  $filter: {
                    input: "$DefectArray",
                    as: "defect",
                    cond: { $eq: ["$$defect.defectName", defectName] }
                  }
                }
              }
            },
            {
              $addFields: {
                totalDefectsQty: { $sum: "$DefectArray.defectQty" }
              }
            }
          ]
        : []),
      // Group by month
      {
        $group: {
          _id: {
            $concat: [
              { $substr: ["$inspectionDate", 6, 4] }, // YYYY
              "-",
              { $substr: ["$inspectionDate", 0, 2] } // MM
            ]
          },
          checkedQty: { $sum: "$CheckedQty" },
          defectQty: { $sum: "$totalDefectsQty" }
          // Removed pushing all records for performance in trend view
        }
      },
      // Project final fields
      {
        $project: {
          _id: 0,
          month: "$_id",
          checkedQty: 1,
          defectQty: 1,
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $multiply: [{ $divide: ["$defectQty", "$checkedQty"] }, 100] }
            ]
          }
        }
      },
      // Sort by month
      { $sort: { month: 1 } }
    ];

    const data = await QC1Sunrise.aggregate(pipeline).exec();

    res.json(data);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise monthly trend:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise monthly trend",
      error: err.message
    });
  }
});

// Endpoint for monthly filter options
app.get("/api/sunrise/qc1-monthly-filters", async (req, res) => {
  try {
    const { startMonth, endMonth, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    const matchStage = {};

    // Filter by month range
    if (startMonth || endMonth) {
      matchStage.$expr = matchStage.$expr || {};
      matchStage.$expr.$and = matchStage.$expr.$and || [];
      const yearMonthExpr = {
        $concat: [
          { $substr: ["$inspectionDate", 6, 4] },
          "-",
          { $substr: ["$inspectionDate", 0, 2] }
        ]
      };
      if (startMonth) {
        matchStage.$expr.$and.push({ $gte: [yearMonthExpr, startMonth] });
      }
      if (endMonth) {
        matchStage.$expr.$and.push({ $lte: [yearMonthExpr, endMonth] });
      }
    }

    // Add other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    // Fetch unique values concurrently
    const [
      uniqueLineNos,
      uniqueMONos,
      uniqueColors,
      uniqueSizes,
      uniqueBuyers,
      uniqueDefectNames
    ] = await Promise.all([
      QC1Sunrise.aggregate([
        { $match: matchStage },
        { $match: { lineNo: { $ne: null, $ne: "" } } },
        { $group: { _id: "$lineNo" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        { $match: matchStage },
        { $match: { MONo: { $ne: null, $ne: "" } } },
        { $group: { _id: "$MONo" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        { $match: matchStage },
        { $match: { Color: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Color" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        { $match: matchStage },
        { $match: { Size: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Size" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        { $match: matchStage },
        { $match: { Buyer: { $ne: null, $ne: "" } } },
        { $group: { _id: "$Buyer" } }
      ]).exec(),
      QC1Sunrise.aggregate([
        { $match: matchStage },
        { $unwind: "$DefectArray" },
        { $match: { "DefectArray.defectName": { $ne: null, $ne: "" } } },
        { $group: { _id: "$DefectArray.defectName" } }
      ]).exec()
    ]);

    // Helper to process results
    const processResults = (results, numericSort = false) => {
      const values = results.map((item) => item._id).filter(Boolean);
      return numericSort
        ? values.sort((a, b) => parseInt(a) - parseInt(b))
        : values.sort();
    };

    res.json({
      lineNos: processResults(uniqueLineNos, true),
      MONos: processResults(uniqueMONos),
      Colors: processResults(uniqueColors),
      Sizes: processResults(uniqueSizes),
      Buyers: processResults(uniqueBuyers),
      defectNames: processResults(uniqueDefectNames)
    });
  } catch (err) {
    console.error("Error fetching QC1 Sunrise monthly filter values:", err);
    res.status(500).json({
      message: "Failed to fetch monthly filter values",
      error: err.message
    });
  }
});


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

// Multer setup for SCC image uploads
const sccImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "public/storage/scc_images");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // imageType should be passed in the body: 'referenceSample-HT', 'afterWash-FU', etc.
    const { imageType, inspectionDate } = req.body;
    const datePart = inspectionDate
      ? inspectionDate.replace(/\//g, "-")
      : new Date().toISOString().split("T")[0];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Filename: imageType-date-uniqueSuffix.extension
    const filename = `${
      imageType || "sccimage"
    }-${datePart}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const sccUpload = multer({ storage: sccImageStorage });

app.post("/api/scc/upload-image", sccUpload.single("imageFile"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }
  const filePath = `${API_BASE_URL}/storage/scc_images/${req.file.filename}`;
  res.json({ success: true, filePath: filePath, filename: req.file.filename });
});

// Helper function to format date to MM/DD/YYYY
const formatDateToMMDDYYYY = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput); // Handles ISO string or Date object
  const month = d.getMonth() + 1; // No padding
  const day = d.getDate(); // No padding
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

app.post("/api/scc/ht-first-output", async (req, res) => {
  try {
    const { _id, ...dataToSave } = req.body;
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);

    // Ensure remarks fields are "NA" if empty
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";
    if (
      dataToSave.standardSpecification &&
      dataToSave.standardSpecification.length > 0
    ) {
      dataToSave.standardSpecification = dataToSave.standardSpecification.map(
        (spec) => ({
          ...spec,
          remarks: spec.remarks?.trim() || "NA"
        })
      );
    }

    let record;
    if (_id) {
      record = await HTFirstOutput.findByIdAndUpdate(_id, dataToSave, {
        new: true,
        runValidators: true,
        upsert: false
      }); // Make sure upsert is false for explicit update
      if (!record)
        return res
          .status(404)
          .json({ message: "Record not found for update." });
    } else {
      // Check for existing record by moNo, color, and inspectionDate before creating
      const existing = await HTFirstOutput.findOne({
        moNo: dataToSave.moNo,
        color: dataToSave.color,
        inspectionDate: dataToSave.inspectionDate
      });
      if (existing) {
        // If it exists, update it
        record = await HTFirstOutput.findByIdAndUpdate(
          existing._id,
          dataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new HTFirstOutput(dataToSave);
        await record.save();
      }
    }
    res
      .status(201)
      .json({ message: "HT First Output saved successfully", data: record });
  } catch (error) {
    console.error("Error saving HT First Output:", error);
    if (error.code === 11000) {
      // Mongoose duplicate key error
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, and Date already exists.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save HT First Output",
      error: error.message,
      details: error
    });
  }
});

app.get("/api/scc/ht-first-output", async (req, res) => {
  try {
    const { moNo, color, inspectionDate } = req.query;
    if (!moNo || !color || !inspectionDate) {
      return res
        .status(400)
        .json({ message: "MO No, Color, and Inspection Date are required." });
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await HTFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate
    });
    if (!record) {
      // Return 200 with a specific message for "not found" so frontend can handle it as new record
      return res
        .status(200)
        .json({ message: "HT_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Existing record data will be in record directly, not record.data
  } catch (error) {
    console.error("Error fetching HT First Output:", error);
    res.status(500).json({
      message: "Failed to fetch HT First Output",
      error: error.message
    });
  }
});

// REVISED Endpoints for FUFirstOutput (similar changes as HT)
app.post("/api/scc/fu-first-output", async (req, res) => {
  try {
    const { _id, ...dataToSave } = req.body;
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);

    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";
    if (
      dataToSave.standardSpecification &&
      dataToSave.standardSpecification.length > 0
    ) {
      dataToSave.standardSpecification = dataToSave.standardSpecification.map(
        (spec) => ({
          ...spec,
          remarks: spec.remarks?.trim() || "NA"
        })
      );
    }

    let record;
    if (_id) {
      record = await FUFirstOutput.findByIdAndUpdate(_id, dataToSave, {
        new: true,
        runValidators: true,
        upsert: false
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Record not found for update." });
    } else {
      const existing = await FUFirstOutput.findOne({
        moNo: dataToSave.moNo,
        color: dataToSave.color,
        inspectionDate: dataToSave.inspectionDate
      });
      if (existing) {
        record = await FUFirstOutput.findByIdAndUpdate(
          existing._id,
          dataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new FUFirstOutput(dataToSave);
        await record.save();
      }
    }
    res
      .status(201)
      .json({ message: "FU First Output saved successfully", data: record });
  } catch (error) {
    console.error("Error saving FU First Output:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, and Date already exists.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save FU First Output",
      error: error.message,
      details: error
    });
  }
});

app.get("/api/scc/fu-first-output", async (req, res) => {
  try {
    const { moNo, color, inspectionDate } = req.query;
    if (!moNo || !color || !inspectionDate) {
      return res
        .status(400)
        .json({ message: "MO No, Color, and Inspection Date are required." });
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await FUFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "FU_RECORD_NOT_FOUND", data: null });
    }
    res.json(record);
  } catch (error) {
    console.error("Error fetching FU First Output:", error);
    res.status(500).json({
      message: "Failed to fetch FU First Output",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - SCC HT/FU - Daily Testing
------------------------------ */

app.get("/api/scc/get-first-output-specs", async (req, res) => {
  try {
    const { moNo, color, inspectionDate } = req.query;
    if (!moNo || !color || !inspectionDate) {
      return res
        .status(400)
        .json({ message: "MO No, Color, and Inspection Date are required." });
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);

    let specs = null;
    // Try HT First Output
    const htRecord = await HTFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate
    }).lean();
    if (htRecord && htRecord.standardSpecification) {
      const afterHatSpec = htRecord.standardSpecification.find(
        (s) => s.type === "afterHat" && s.timeSec && s.tempC && s.pressure
      );
      const firstSpec = htRecord.standardSpecification.find(
        (s) => s.type === "first"
      );
      if (afterHatSpec) {
        specs = {
          tempC: afterHatSpec.tempC,
          timeSec: afterHatSpec.timeSec,
          pressure: afterHatSpec.pressure
        };
      } else if (firstSpec) {
        specs = {
          tempC: firstSpec.tempC,
          timeSec: firstSpec.timeSec,
          pressure: firstSpec.pressure
        };
      }
    }

    // If not found in HT, try FU First Output (assuming similar logic might apply or distinct records)
    if (!specs) {
      const fuRecord = await FUFirstOutput.findOne({
        moNo,
        color,
        inspectionDate: formattedDate
      }).lean();
      if (fuRecord && fuRecord.standardSpecification) {
        const afterHatSpec = fuRecord.standardSpecification.find(
          (s) => s.type === "afterHat" && s.timeSec && s.tempC && s.pressure
        );
        const firstSpec = fuRecord.standardSpecification.find(
          (s) => s.type === "first"
        );
        if (afterHatSpec) {
          specs = {
            tempC: afterHatSpec.tempC,
            timeSec: afterHatSpec.timeSec,
            pressure: afterHatSpec.pressure
          };
        } else if (firstSpec) {
          specs = {
            tempC: firstSpec.tempC,
            timeSec: firstSpec.timeSec,
            pressure: firstSpec.pressure
          };
        }
      }
    }

    if (!specs) {
      return res.status(200).json({ message: "SPECS_NOT_FOUND", data: null });
    }
    res.json({ data: specs });
  } catch (error) {
    console.error("Error fetching first output specs:", error);
    res.status(500).json({
      message: "Failed to fetch first output specifications",
      error: error.message
    });
  }
});

// Endpoints for SCCDailyTesting
app.post("/api/scc/daily-testing", async (req, res) => {
  try {
    const { _id, ...dataToSave } = req.body;
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    let record;
    if (_id) {
      record = await SCCDailyTesting.findByIdAndUpdate(_id, dataToSave, {
        new: true,
        runValidators: true
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Daily Testing record not found for update." });
    } else {
      const existing = await SCCDailyTesting.findOne({
        moNo: dataToSave.moNo,
        color: dataToSave.color,
        machineNo: dataToSave.machineNo,
        inspectionDate: dataToSave.inspectionDate
      });
      if (existing) {
        record = await SCCDailyTesting.findByIdAndUpdate(
          existing._id,
          dataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new SCCDailyTesting(dataToSave);
        await record.save();
      }
    }
    res.status(201).json({
      message: "Daily Testing report saved successfully",
      data: record
    });
  } catch (error) {
    console.error("Error saving Daily Testing report:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, Machine No, and Date already exists.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    res.status(500).json({
      message: "Failed to save Daily Testing report",
      error: error.message,
      details: error
    });
  }
});

app.get("/api/scc/daily-testing", async (req, res) => {
  try {
    const { moNo, color, machineNo, inspectionDate } = req.query;
    if (!moNo || !color || !machineNo || !inspectionDate) {
      return res.status(400).json({
        message: "MO No, Color, Machine No, and Inspection Date are required."
      });
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await SCCDailyTesting.findOne({
      moNo,
      color,
      machineNo,
      inspectionDate: formattedDate
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "DAILY_TESTING_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Returns the existing record
  } catch (error) {
    console.error("Error fetching Daily Testing report:", error);
    res.status(500).json({
      message: "Failed to fetch Daily Testing report",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - SCC Daily HT/FU QC Test
------------------------------ */

// GET Endpoint to fetch existing Daily HT/FU Test data or MO list
app.get("/api/scc/daily-htfu-test", async (req, res) => {
  try {
    const { inspectionDate, machineNo, moNo, color } = req.query;
    const formattedDate = inspectionDate
      ? formatDateToMMDDYYYY(inspectionDate)
      : null;

    if (!formattedDate || !machineNo) {
      return res
        .status(400)
        .json({ message: "Inspection Date and Machine No are required." });
    }

    // Scenario 1: Fetch specific record if moNo and color are provided
    if (moNo && color) {
      const record = await DailyTestingHTFU.findOne({
        inspectionDate: formattedDate,
        machineNo,
        moNo,
        color
      });
      if (!record) {
        return res
          .status(200)
          .json({ message: "DAILY_HTFU_RECORD_NOT_FOUND", data: null });
      }
      return res.json({ message: "RECORD_FOUND", data: record });
    } else {
      // Scenario 2: Fetch distinct MO/Color combinations for a given Date/MachineNo
      const records = await DailyTestingHTFU.find(
        { inspectionDate: formattedDate, machineNo },
        "moNo color buyer buyerStyle" // Select only necessary fields
      ).distinct("moNo"); // Or more complex aggregation if needed to pair MO with Color

      // For simplicity, let's return distinct MOs, client can then pick color
      // A better approach might be to return {moNo, color, buyer, buyerStyle} tuples
      const distinctEntries = await DailyTestingHTFU.aggregate([
        { $match: { inspectionDate: formattedDate, machineNo } },
        {
          $group: {
            _id: { moNo: "$moNo", color: "$color" },
            buyer: { $first: "$buyer" },
            buyerStyle: { $first: "$buyerStyle" },
            // If you need to know if a full record exists to load it directly
            docId: { $first: "$_id" }
          }
        },
        {
          $project: {
            _id: 0,
            moNo: "$_id.moNo",
            color: "$_id.color",
            buyer: "$buyer",
            buyerStyle: "$buyerStyle",
            docId: "$docId"
          }
        }
      ]);

      if (distinctEntries.length === 0) {
        return res.status(200).json({
          message: "NO_RECORDS_FOR_DATE_MACHINE",
          data: []
        });
      }
      // If only one unique MO/Color combo, frontend might auto-load it fully later
      return res.json({
        message: "MULTIPLE_MO_COLOR_FOUND",
        data: distinctEntries // Array of {moNo, color, buyer, buyerStyle, docId}
      });
    }
  } catch (error) {
    console.error("Error fetching Daily HT/FU Test data:", error);
    res.status(500).json({
      message: "Failed to fetch Daily HT/FU Test data",
      error: error.message
    });
  }
});

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