/* ------------------------------
   Import Required Libraries/Models
------------------------------ */
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; 
import https from 'https';
import { Server } from "socket.io"; 

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
import qc1DashboardRoutes from "./routes/LiveDashboard/qc1DashboardRoutes.js";
import QC2DashboardRoutes from "./routes/LiveDashboard/qc2DashboardRoutes.js";
import processDashbiardRoutes from "./routes/LiveDashboard/processDashboardRoutes.js";
import qc1SunriseRoutes from "./routes/QC1Sunrise/qc1SunriseRoutes.js"; 
import aqlRoutes from "./routes/AQL/aqlRoutes.js";
import sewingDefectRoutes from "./routes/Defects/sewingDefectRoutes.js";
import measurmentRoutes from "./routes/DigitalMeasurement/measurementRoutes.js";

// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "./config.js"; 
import {ymProdConnection,
  ymEcoConnection,
  disconnectMongoDB,
} from "../backend/Config/mongodb.js";

import { initializeSchedulerAndSyncs } from "./Scheduler/syncSchedule.js";

import {
  closeSQLPools,
} from "./Config/sqldb.js";


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
app.use(qc1DashboardRoutes);
app.use(QC2DashboardRoutes);
app.use(processDashbiardRoutes);
app.use(qc1SunriseRoutes);
app.use(aqlRoutes);
app.use(sewingDefectRoutes);
app.use(measurmentRoutes);

// Initialize the scheduler, which also handles initial pool setup and data syncs
initializeSchedulerAndSyncs();

 /* ------------------------------
    Initialize Pools and Run Initial Syncs
 ------------------------------ */


// Updated Endpoint to Search MO Numbers (St_No) from inline_orders in MongoDB with partial matching
// app.get("/api/inline-orders-mo-numbers", async (req, res) => {
//   try {
//     const searchTerm = req.query.search; // Get the search term from query params
//     if (!searchTerm) {
//       return res.status(400).json({ error: "Search term is required" });
//     }

//     // Use a case-insensitive regex to match the term anywhere in St_No
//     const regexPattern = new RegExp(searchTerm, "i");
//     const { InlineOrders } = await import("./Config/mongodb.js");

//     // Query the inline_orders collection
//     const results = await InlineOrders.find({
//       St_No: { $regex: regexPattern }
//     })
//       .select("St_No") // Only return the St_No field (equivalent to .project({ St_No: 1, _id: 0 }))
//       .limit(100) // Limit results to prevent overwhelming the UI
//       .sort({ St_No: 1 }) // Sort alphabetically
//       .exec();

//     // Extract unique St_No values
//     const uniqueMONos = [...new Set(results.map((r) => r.St_No))];

//     res.json(uniqueMONos);
//   } catch (err) {
//     console.error("Error fetching MO numbers from inline_orders:", err);
//     res.status(500).json({
//       message: "Failed to fetch MO numbers from inline_orders",
//       error: err.message
//     });
//   }
// });

// New Endpoint to Fetch Inline Order Details for a given MO No (St_No)
// app.get("/api/inline-orders-details", async (req, res) => {
//   try {
//     const stNo = req.query.stNo;
//     if (!stNo) {
//       return res.status(400).json({ error: "St_No is required" });
//     }

//     const { InlineOrders } = await import("./Config/mongodb.js");

//     // Find the document where St_No matches
//     const document = await InlineOrders.findOne({ St_No: stNo }).exec();

//     if (!document) {
//       return res.status(404).json({ error: "MO No not found" });
//     }

//     res.json(document);
//   } catch (err) {
//     console.error("Error fetching Inline Order details:", err);
//     res.status(500).json({
//       message: "Failed to fetch Inline Order details",
//       error: err.message
//     });
//   }
// });



/* ------------------------------
   Schedule Daily Sync
------------------------------ */

/* ------------------------------
   New Endpoints for CutPanelOrders
------------------------------ */


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
// app.get("/api/reprint-search", async (req, res) => {
//   try {
//     const { mono, packageNo, empId } = req.query;

//     // Build the query dynamically based on provided parameters
//     const query = {};
//     if (mono) {
//       query.selectedMono = { $regex: mono, $options: "i" }; // Case-insensitive partial match
//     }
//     if (packageNo) {
//       const packageNoInt = parseInt(packageNo);
//       if (!isNaN(packageNoInt)) {
//         query.package_no = packageNoInt; // Exact match for integer
//       }
//     }
//     if (empId) {
//       query.emp_id = { $regex: empId, $options: "i" }; // Case-insensitive partial match
//     }

//     // Fetch matching records from qc2_orderdata
//     const records = await QC2OrderData.find(query)
//       .sort({ package_no: 1 }) // Sort by package_no ascending
//       .limit(100); // Limit to prevent overload

//     res.json(records);
//   } catch (error) {
//     console.error("Error searching qc2_orderdata:", error);
//     res.status(500).json({ error: "Failed to search records" });
//   }
// });

// Fetch colors and sizes for a specific MONo (unchanged)
// app.get("/api/reprint-colors-sizes/:mono", async (req, res) => {
//   try {
//     const mono = req.params.mono;
//     const result = await QC2OrderData.aggregate([
//       { $match: { selectedMono: mono } },
//       {
//         $group: {
//           _id: {
//             color: "$color",
//             size: "$size",
//           },
//           colorCode: { $first: "$colorCode" },
//           chnColor: { $first: "$chnColor" },
//           package_no: { $first: "$package_no" },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id.color",
//           sizes: { $push: "$_id.size" },
//           colorCode: { $first: "$colorCode" },
//           chnColor: { $first: "$chnColor" },
//         },
//       },
//     ]);

//     const colors = result.map((c) => ({
//       color: c._id,
//       sizes: c.sizes,
//       colorCode: c.colorCode,
//       chnColor: c.chnColor,
//     }));

//     res.json(colors);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch colors/sizes" });
//   }
// });

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

// app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
//   try {
//     const { bundleId } = req.params;
//     const { inspectionType, process, data } = req.body;

//     if (!["first", "defect"].includes(inspectionType)) {
//       return res.status(400).json({ error: "Invalid inspection type" });
//     }

//     const updateField =
//       inspectionType === "first" ? "inspectionFirst" : "inspectionDefect";
//     const updateOperation = {
//       $push: {
//         [updateField]: {
//           process,
//           ...data
//         }
//       }
//     };

//     // For defect scans, ensure defect_print_id is provided
//     if (inspectionType === "defect" && !data.defect_print_id) {
//       return res
//         .status(400)
//         .json({ error: "defect_print_id is required for defect scans" });
//     }

//     const updatedRecord = await QC2OrderData.findOneAndUpdate(
//       { bundle_id: bundleId },
//       updateOperation,
//       { new: true, upsert: true }
//     );

//     if (!updatedRecord) {
//       return res.status(404).json({ error: "Bundle not found" });
//     }

//     res.json({ message: "Record updated successfully", data: updatedRecord });
//   } catch (error) {
//     console.error("Error updating qc2_orderdata:", error);
//     res
//       .status(500)
//       .json({ error: "Failed to update record", details: error.message });
//   }
// });

/* ------------------------------
   End Points - Live Dashboard - QC1
------------------------------ */

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

/* ------------------------------
   Emp id for Inspector Data
------------------------------ */

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


/* ------------------------------
   QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

/* ------------------------------
   Defect Buyer Status ENDPOINTS
------------------------------ */

// /* ------------------------------
//    User Management ENDPOINTS
// ------------------------------ */

/* ------------------------------
   End Points - Digital Measurement
------------------------------ */

/* ------------------------------
   End Points - SCC HT/FU
------------------------------ */

/* ------------------------------
   End Points - SCC HT/FU - Daily Testing
------------------------------ */

/* ------------------------------
   End Points - SCC Daily HT/FU QC Test
------------------------------ */

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on https://0.0.0.0:${PORT}`);
});