import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import gracefulFs from 'graceful-fs';
gracefulFs.gracefulify(fs);
import https from "https"; 
import axios from "axios";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import createIroningModel from "./models/Ironing.js";
//import createRoleModel from "./models/Role.js";
import createRoleManagmentModel from "./models/RoleManagment.js";
import createOPAModel from "./models/OPA.js";
import createPackingModel from "./models/Packing.js";
import createQC2DefectPrintModel from "./models/QC2DefectPrint.js";
import createUserModel from "./models/User.js";
import createWashingModel from "./models/Washing.js";
import createQCDataModel from "./models/qc1_data.js";
import createQc2OrderDataModel from "./models/qc2_orderdata.js";
import createQC2InspectionPassBundleModel from "./models/qc2_inspection.js";
import createQC2ReworksModel from "./models/qc2_rework.js";
import createQC2RepairTrackingModel from "./models/qc2_repair_tracking.js";
import createSubconFactoryModel from "./models/SubconFactory.js"; 
import createQC2DefectsModel from "./models/QC2DefectsModel.js";
import createQC2WorkersDataModel from "./models/QC2WorkersData.js";
import createQC2BGradeModel from "./models/QC2BGrade.js";
import createQC2TaskModel from "./models/QC2Task.js";

import createInlineOrdersModel from "./models/InlineOrders.js"; 
import createLineSewingWorkerModel from "./models/LineSewingWorkers.js";
import createQCInlineRovingModel from "./models/QC_Inline_Roving.js";
import createPairingDefectModel from "./models/PairingDefect.js";
import createAccessoryIssueModel from "./models/AccessoryIssue.js";
import createQCRovingPairingModel from "./models/QCRovingPairing.js";
import createSewingDefectsModel from "./models/SewingDefects.js";
import createQCWashingModel from "./models/QCWashing.js";
import createQCWashingDefectsModel from "./models/QCWashingDefectsModel.js";
import createQCWashingCheckpointsModel from "./models/QCWashingCheckpointsModel.js";
import createQCWashingFirstOutputModel from "./models/QCWashingFirstOutputModel.js";

import createCutPanelOrdersModel from "./models/CutPanelOrders.js"; // New model import
import createCuttingInspectionModel from "./models/cutting_inspection.js"; // New model import
import createCuttingMeasurementPointModel from "./models/CuttingMeasurementPoints.js"; // New model import
import createCuttingFabricDefectModel from "./models/CuttingFabricDefects.js";
import createCuttingIssueModel from "./models/CuttingIssues.js";
import createAQLChartModel from "./models/AQLChart.js";

import createQC1SunriseModel from "./models/QC1Sunrise.js"; 
import createHTFirstOutputModel from "./models/HTFirstOutput.js";
import createFUFirstOutputModel from "./models/FUFirstOutput.js";
import createSCCDailyTestingModel from "./models/SCCDailyTesting.js";
import createDailyTestingHTFUtModel from "./models/dailyTestingHTFUModel.js";
import createDailyTestingFUQCModel from "./models/DailyTestingFUQCModel.js";
import createSCCDefectModel from "./models/SCCDefectModel.js";
import createSCCScratchDefectModel from "./models/SCCScratchDefectModel.js";
import createHTInspectionReportModel from "./models/HTInspectionReportModel.js";
import createElasticReportModel from "./models/ElasticReport.js";

// Import the new SCC Operator models
import createSCCHTOperatorModel from "./models/SCCHTOperatorModel.js";
import createSCCFUOperatorModel from "./models/SCCFUOperatorModel.js";
import createSCCElasticOperatorModel from "./models/SCCElasticOperatorModel.js";

import createEMBDefectModel from "./models/EMBdefect.js";
import createPrintingDefectModel from "./models/printingDefect.js";
import createEMBReportModel from "./models/EMBReport.js";

import createQADefectsModel from "./models/QADefectsModel.js";
import createQCAccuracyReportModel from "./models/QCAccuracyReportModel.js";
import createQAStandardDefectsModel from "./models/QAStandardDefectsModel.js";

import createAuditCheckPointModel from "./models/AuditCheckPoint.js";

import createBuyerSpecTemplateModel from "./models/BuyerSpecTemplate.js";
import createANFMeasurementReportModel from "./models/ANFMeasurementReport.js";
import createSizeCompletionStatusModel from "./models/SizeCompletionStatus.model.js";

import createQCWorkersModel from "./models/QCWorkers.js";
import createSupplierIssuesDefectModel from "./models/SupplierIssuesDefect.js";
import createSupplierIssueReportModel from "./models/SupplierIssueReport.js";
import createQC2OlderDefectModel from "./models/QC2_Older_Defects.js";
import createQCWashingMachineStandard from "./models/qcWashingStanderd.js";
import createQCWashingQtyOldSchema from "./models/QCWashingQtyOld.js";
import createDTOrdersSchema from "./models/dt_orders.js";

import sql from "mssql"; // Import mssql for SQL Server connection
import cron from "node-cron"; // Import node-cron for scheduling

import { promises as fsPromises } from "fs";
import { Server as SocketIO } from "socket.io";
import crypto from "crypto";

// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "./config.js";

/* ------------------------------
   Connection String
------------------------------ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;



/* ------------------------------
   for HTTPS
------------------------------ */

const options = {
   key: fs.readFileSync(path.resolve(path.dirname(__filename), '192.167.12.85-key.pem')),
  cert: fs.readFileSync(path.resolve(path.dirname(__filename), '192.167.12.85.pem'))
};

export const server = https.createServer(options, app);
// Initialize Socket.io
export const io = new SocketIO(server, {
  cors: {
    origin: "https://192.167.12.162:3001", //"https://192.165.2.175:3001", //"https://localhost:3001"
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

app.use("/storage", express.static(path.join(__dirname, "public/storage")));
app.use("/public", express.static(path.join(__dirname, "../public")));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

//app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const allowedOrigins = ["https://192.167.12.85:3001", "http://localhost:3001", "https://localhost:3001"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);


app.options("*", cors());

const ymProdConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

const ymEcoConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_eco_board?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

ymProdConnection.on("connected", () =>
  console.log("✅ Connected to ym_prod database in 192.167.1.10:29000...")
);
ymProdConnection.on("error", (err) => console.error("❌ unexpected error:", err));

ymEcoConnection.on("connected", () =>
  console.log("✅ Connected to ym_eco_board database in 192.167.1.10:29000...")
);
ymEcoConnection.on("error", (err) => console.error("❌ unexpected error:", err));

// Define model on connections

//const UserMain = createUserModel(ymProdConnection);
const UserMain = createUserModel(ymEcoConnection);

// User model for the PROD board (for populating references)
const UserProd = createUserModel(ymProdConnection);

const QCData = createQCDataModel(ymProdConnection);
const QC2OrderData = createQc2OrderDataModel(ymProdConnection);
const Ironing = createIroningModel(ymProdConnection);
const Washing = createWashingModel(ymProdConnection);
const OPA = createOPAModel(ymProdConnection);
const Packing = createPackingModel(ymProdConnection);
const RoleManagment = createRoleManagmentModel(ymProdConnection);
const QC2DefectPrint = createQC2DefectPrintModel(ymProdConnection);
const QC2InspectionPassBundle =
  createQC2InspectionPassBundleModel(ymProdConnection);
const QC2Reworks = createQC2ReworksModel(ymProdConnection);
const QC2RepairTracking = createQC2RepairTrackingModel(ymProdConnection);
const SubconFactory = createSubconFactoryModel(ymProdConnection);
const QC2Defects = createQC2DefectsModel(ymProdConnection);
const QC2WorkersData = createQC2WorkersDataModel(ymProdConnection);
const QC2BGrade = createQC2BGradeModel(ymProdConnection);
const QC2Task = createQC2TaskModel(ymProdConnection);
const QCWashingDefects = createQCWashingDefectsModel(ymProdConnection);
const QCWashingCheckList = createQCWashingCheckpointsModel(ymProdConnection);
const QCWashingFirstOutput = createQCWashingFirstOutputModel(ymProdConnection);
// const StyleWiseCheckedQty = createStyleWiseCheckedQtyModel(ymProdConnection);
const QCWashing = createQCWashingModel(ymProdConnection);

const InlineOrders = createInlineOrdersModel(ymProdConnection); // Define the new model
const SewingDefects = createSewingDefectsModel(ymProdConnection);
const LineSewingWorker = createLineSewingWorkerModel(ymProdConnection);
const QCInlineRoving = createQCInlineRovingModel(ymProdConnection);
const PairingDefect = createPairingDefectModel(ymProdConnection);
const AccessoryIssue = createAccessoryIssueModel(ymProdConnection);
const QCRovingPairing = createQCRovingPairingModel(ymProdConnection);

const CuttingInspection = createCuttingInspectionModel(ymProdConnection); // New model
const CuttingMeasurementPoint =
  createCuttingMeasurementPointModel(ymProdConnection); 
const CutPanelOrders = createCutPanelOrdersModel(ymProdConnection); 
const CuttingFabricDefect = createCuttingFabricDefectModel(ymProdConnection);
const CuttingIssue = createCuttingIssueModel(ymProdConnection);
const AQLChart = createAQLChartModel(ymProdConnection);

const QC1Sunrise = createQC1SunriseModel(ymProdConnection); 

const HTFirstOutput = createHTFirstOutputModel(ymProdConnection);
const FUFirstOutput = createFUFirstOutputModel(ymProdConnection);
const SCCDailyTesting = createSCCDailyTestingModel(ymProdConnection);
const DailyTestingHTFU = createDailyTestingHTFUtModel(ymProdConnection);
const DailyTestingFUQC = createDailyTestingFUQCModel(ymProdConnection);
const SCCDefect = createSCCDefectModel(ymProdConnection);
const SCCScratchDefect = createSCCScratchDefectModel(ymProdConnection);
const HTInspectionReport = createHTInspectionReportModel(ymProdConnection);
const ElasticReport = createElasticReportModel(ymProdConnection);

const EMBDefect = createEMBDefectModel(ymProdConnection);
const PrintingDefect = createPrintingDefectModel(ymProdConnection);
const EMBReport = createEMBReportModel(ymProdConnection);

const QADefectsModel = createQADefectsModel(ymProdConnection);
const QCAccuracyReportModel = createQCAccuracyReportModel(ymProdConnection);
const QAStandardDefectsModel = createQAStandardDefectsModel(ymProdConnection);

// Define new SCC Operator models on ymProdConnection
const SCCHTOperator = createSCCHTOperatorModel(ymProdConnection);
const SCCFUOperator = createSCCFUOperatorModel(ymProdConnection);
const SCCElasticOperator = createSCCElasticOperatorModel(ymProdConnection);

const AuditCheckPoint = createAuditCheckPointModel(ymProdConnection);

const BuyerSpecTemplate = createBuyerSpecTemplateModel(ymProdConnection);
const ANFMeasurementReport = createANFMeasurementReportModel(ymProdConnection);
const SizeCompletionStatus = createSizeCompletionStatusModel(ymProdConnection);

const SupplierIssuesDefect = createSupplierIssuesDefectModel(ymProdConnection);

(ymProdConnection);
const QCWorkers = createQCWorkersModel(ymProdConnection);
const SupplierIssueReport = createSupplierIssueReportModel(ymProdConnection);
const QC2OlderDefect = createQC2OlderDefectModel(ymProdConnection);
const QCWashingMachineStandard = createQCWashingMachineStandard(ymProdConnection);
const QCWashingQtyOld = createQCWashingQtyOldSchema(ymProdConnection);
const DtOrder = createDTOrdersSchema(ymProdConnection);

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

/* ------------------------------
   YM DataSore SQL
------------------------------ */

// SQL Server Configuration for YMDataStore
// const sqlConfig = {
//   user: "ymdata",
//   password: "Kzw15947",
//   server: "192.167.1.13",
//   port: 1433,
//   database: "YMDataStore",
//   options: {
//     encrypt: false, // Use true if SSL is required
//     trustServerCertificate: true // For self-signed certificates
//   },
//   requestTimeout: 3000000, // Set timeout to 5 minutes (300,000 ms)
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000
//   }
// };

// /* ------------------------------
//    YMCE_SYSTEM SQL
// ------------------------------ */

// SQL Server Configuration for YMCE_SYSTEM
// const sqlConfigYMCE = {
//   user: "visitor",
//   password: "visitor",
//   server: "192.167.1.240", //"ymws-150",
//   //port: 1433,
//   database: "YMCE_SYSTEM",
//   options: {
//     encrypt: false,
//     trustServerCertificate: true
//   },
//   requestTimeout: 300000,
//   connectionTimeout: 300000, // Increase connection timeout to 300 seconds
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000
//   }
// };

// /* ------------------------------
//    YMWHSYS2 SQL Configuration
// ------------------------------ */

const sqlConfigYMWHSYS2 = {
  user: "user01",
  password: "Ur@12323",
  server: "192.167.1.14", //"YM-WHSYS",
  database: "FC_SYSTEM",
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  requestTimeout: 18000000,
  connectionTimeout: 18000000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

/* ------------------------------
   DTrade SQL Configuration
------------------------------ */

const sqlConfigDTrade = {
  user: "user01",
  password: "Ur@12323",
  server: "192.167.1.14",
  database: "DTrade_CONN", // This should be DTrade_CONN, not FC_SYSTEM
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  requestTimeout: 18000000,
  connectionTimeout: 18000000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

// Create connection pools
// const poolYMDataStore = new sql.ConnectionPool(sqlConfig);
// const poolYMCE = new sql.ConnectionPool(sqlConfigYMCE);
const poolYMWHSYS2 = new sql.ConnectionPool(sqlConfigYMWHSYS2);
const poolDTrade = new sql.ConnectionPool(sqlConfigDTrade);

// MODIFICATION: Add a status tracker for SQL connections
const sqlConnectionStatus = {
  // YMDataStore: false,
  // YMCE_SYSTEM: false,
  YMWHSYS2: false,
  DTrade_CONN: false 
};

// // Function to connect to a pool, now it updates the status tracker
async function connectPool(pool, poolName) {
  try {
    await pool.connect();
    console.log(
      `✅ Successfully connected to ${poolName} pool at ${pool.config.server}`
    );
    sqlConnectionStatus[poolName] = true; // Set status to true on success

    // Listen for errors on the pool to detect disconnections
    pool.on("error", (err) => {
      console.error(`SQL Pool Error for ${poolName}:`, err);
      sqlConnectionStatus[poolName] = false; // Set status to false on error
    });
  } catch (err) {
    console.error(`❌ FAILED to connect to ${poolName} pool:`, err.message);
    sqlConnectionStatus[poolName] = false; // Ensure status is false on failure
    // We throw the error so Promise.allSettled can catch it
    throw new Error(`Failed to connect to ${poolName}`);
  }
}

// MODIFICATION: This function is now more critical for on-demand reconnections.
async function ensurePoolConnected(pool, poolName) {
  // If we know the connection is down, or the pool reports it's not connected
  if (!sqlConnectionStatus[poolName] || !pool.connected) {
    console.log(
      `Pool ${poolName} is not connected. Attempting to reconnect...`
    );
    try {
      // Attempt to close the pool if it's in a broken state before reconnecting
      if (pool.connected || pool.connecting) {
        await pool.close();
      }
      await connectPool(pool, poolName); // This will re-attempt connection and update the status
    } catch (reconnectErr) {
      console.error(
        `Failed to reconnect to ${poolName}:`,
        reconnectErr.message
      );
      sqlConnectionStatus[poolName] = false; // Ensure status is false
      throw reconnectErr; // Throw error to be caught by the calling function
    }
  }
  // If we reach here, the pool should be connected.
  if (!sqlConnectionStatus[poolName]) {
    throw new Error(`Database ${poolName} is unavailable.`);
  }
}

// Drop the conflicting St_No_1 index if it exists
// async function dropConflictingIndex() {
//   try {
//     const indexes = await InlineOrders.collection.getIndexes();
//     if (indexes["St_No_1"]) {
//       await InlineOrders.collection.dropIndex("St_No_1");
//       console.log("Dropped conflicting St_No_1 index.");
//     } else {
//       console.log("St_No_1 index not found, no need to drop.");
//     }
//   } catch (err) {
//     console.error("Error dropping St_No_1 index:", err);
//   }
// }

// /* ------------------------------
//    Initialize Pools and Run Initial Syncs
// ------------------------------ */

// // MODIFICATION: Rewritten initializePools and server startup logic
// async function initializeServer() {
//   console.log("--- Initializing Server ---");

//   // 1. Handle MongoDB Index
//   await dropConflictingIndex();

//   // 2. Attempt to connect to all SQL pools without crashing
//   console.log("Initializing SQL connection pools...");
//   const connectionPromises = [
//     connectPool(poolYMDataStore, "YMDataStore"),
//     // connectPool(poolYMCE, "YMCE_SYSTEM"),
//     // connectPool(poolYMWHSYS2, "YMWHSYS2")
       // connectPool(poolDTrade, "DTrade_CONN")
//   ];

//   // Promise.allSettled will not short-circuit. It waits for all promises.
//   const results = await Promise.allSettled(connectionPromises);

//   results.forEach((result) => {
//     if (result.status === "rejected") {
//       // The error is already logged in connectPool, but we can add a summary here.
//       console.warn(
//         `Initialization Warning: ${result.reason.message}. Dependent services will be unavailable.`
//       );
//     }
//   });

//   console.log("Current SQL Connection Status:", sqlConnectionStatus);
//   console.log(
//     "SQL pool initialization complete. Server will continue regardless of failures."
//   );

//   // 3. Run initial data syncs. These functions will now check the connection status internally.
//   console.log("Running initial data synchronizations...");
//   await syncInlineOrders();
//   await syncCutPanelOrders();
//   await syncQC1SunriseData();
//   await syncDTOrdersData()

//   console.log("--- Server Initialization Complete ---");
// }

// // Start the server initialization
// initializeServer().catch((err) => {
//   // This catch is for any unexpected errors during the setup process itself.
//   console.error("A critical error occurred during server initialization:", err);
//   // still want to exit here if something truly fundamental fails.
//   // process.exit(1);
// });

// /* ------------------------------
//   Fetching RS18 Data from YMDataStore
// ------------------------------ */

// // New Endpoint for RS18 Data (YMDataStore)
// app.get("/api/sunrise/rs18", async (req, res) => {
//   if (!sqlConnectionStatus.YMDataStore) {
//     return res.status(503).json({
//       message:
//         "Service Unavailable: The YMDataStore database is not connected.",
//       error: "Database connection failed"
//     });
//   }
//   try {
//     await ensurePoolConnected(poolYMDataStore, "YMDataStore");
//     const request = poolYMDataStore.request();
//     //pool = await connectToSqlServerYMDataStore();
//     const query = `
//       SELECT
//         FORMAT(CAST(dDate AS DATE), 'MM-dd-yyyy') AS InspectionDate,
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         ReworkCode,
//         CASE ReworkCode
//           WHEN '1' THEN N'សំរុងវែងខ្លីមិនស្មើគ្នា(ខោ ដៃអាវ) / 左右長短(裤和袖长) / Uneven leg/sleeve length'
//           WHEN '2' THEN N'មិនមែនកែដេរ / 非本位返工 / Non-defective'
//           WHEN '3' THEN N'ដេររមួល / 扭 / Twisted'
//           WHEN '4' THEN N'ជ្រួញនិងទឹករលក និងប៉ោងសាច់ / 起皺/波浪/起包 / Puckering/ Wavy/ Fullness'
//           WHEN '5' THEN N'ដាច់អំបោះ / 斷線 / Broken stitches'
//           WHEN '6' THEN N'លោតអំបោះ / 跳線 / Skipped stitches'
//           WHEN '7' THEN N'ប្រឡាក់ប្រេង / 油漬 / Oil stain'
//           WHEN '8' THEN N'ធ្លុះរន្ធ / 破洞 (包括針洞) / Hole/ Needle hole'
//           WHEN '9' THEN N'ខុសពណ៏ / 色差 / Color shading'
//           WHEN '10' THEN N'ផ្លាកដេរខុសសេរីនិងដេរខុសផ្លាក / 嘜頭錯碼/車錯嘜頭 / Label sewn wrong size/style/po'
//           WHEN '11' THEN N'ប្រឡាក់ / 髒污 / Dirty stain'
//           WHEN '12' THEN N'រហែកថ្នេរ / 爆縫 / Open seam'
//           WHEN '13' THEN N'អត់បានដេរ / 漏車縫/漏空 / Missed sewing'
//           WHEN '14' THEN N'ព្រុយ / 線頭 / Untrimmed thread ends'
//           WHEN '15' THEN N'ខូចសាច់ក្រណាត់(មិនអាចកែ) / 布疵（改不了） / Fabric defect (unrepairable)'
//           WHEN '16' THEN N'គៀបសាច់ / 打折 / Pleated'
//           WHEN '17' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់ / 燙畫/印花/繡花 / Heat transfer/ Printing/ EMB defect'
//           WHEN '18' THEN N'អាវកែផ្សេងៗ / 其它返工 / Others'
//           WHEN '19' THEN N'អ៊ុតអត់ជាប់ / 熨燙不良 / Insecure of Heat transfer'
//           WHEN '20' THEN N'ទំហំទទឺងតូចធំមិនស្មើគ្នា / 左右大小不均匀 / Uneven width'
//           WHEN '21' THEN N'គំលាតម្ជុល តឹង និង ធូរអំបោះពេក / 針距: 線緊/線鬆 / Stitch density tight/loose'
//           WHEN '22' THEN N'សល់ជាយ និង ព្រុយខាងៗ / 毛邊 止口 / Fray edge / Raw edge'
//           WHEN '23' THEN N'ជ្រលក់ពណ៏ខុស រឺក៏ ខូច / 染色不正確 - 次品/廢品 / Incorrect dying'
//           WHEN '24' THEN N'ប្រឡាក់ប្រេង2 / 油漬2 / Oil stain 2'
//           WHEN '25' THEN N'ខុសពណ៏2 / 色差2 / Color variation 2'
//           WHEN '26' THEN N'ប្រឡាក់2 / 髒污2 / Dirty stain 2'
//           WHEN '27' THEN N'ឆ្នូតក្រណាត់2 / 布疵2 / Fabric defect 2'
//           WHEN '28' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់2 / 燙畫 / 印花 /繡花 2 / Heat transfer/ Printing/ EMB defect 2'
//           WHEN '29' THEN N'ដេរអត់ជាប់ / 不牢固 / Insecure'
//           WHEN '30' THEN N'ដេរធ្លាក់ទឹក / 落坑 / Run off stitching'
//           WHEN '31' THEN N'ខូចទ្រង់ទ្រាយ / 形状不良 / Poor shape'
//           WHEN '32' THEN N'បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន) / 布有飞纱，勾纱(可修) / Fabric fly yarn / snagging (repairable)'
//           WHEN '33' THEN N'មិនចំគ្នា / 不对称（骨位，间条） / Mismatched'
//           WHEN '34' THEN N'បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំ វៀច / 车标问题:错位置,反,高低,歪斜 / Label: misplace,invert,uneven,slant'
//           WHEN '35' THEN N'ស្មាមម្ជុល / 针孔 / Needle Mark'
//           WHEN '36' THEN N'បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-) / 衣服錯碼(某部位/裁片) / Wrong size of garment(cut panel/part)'
//           WHEN '37' THEN N'ផ្សេងៗ / 其它-做工不良 / Others - Poor Workmanship (Spare) 2'
//           WHEN '38' THEN N'បញ្ហាបោកទឹក / ជ្រលក់ពណ៌ / 洗水 / 染色不正确 / Improper Washing Dyeing'
//           WHEN '39' THEN N'បញ្ហាអ៊ុត- ឡើងស / ស្នាម / ខ្លោច -ល- / 烫工不良:起镜 / 压痕 / 烫焦 / Improper Ironing: Glazing / Mark / Scorch, etc…'
//           WHEN '40' THEN N'បញ្ហាអ៊ុត: ខូចទ្រង់ទ្រាយ / ខូចរាង / 烫工不良:变形 / 外观不良 / Improper Ironing: Off Shape / Poor Appearance'
//           WHEN '41' THEN N'ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា / 左右高低 / Asymmetry / Hi-Low'
//           WHEN '42' THEN N'ថ្នេរដេរមិនត្រួតគ្នា តូចធំមិនស្មើគ្នា / 车线不重叠 大小不均匀 / Uneven / Misalign stitches'
//           WHEN '43' THEN N'បញ្ហាលើសខ្នាត(+) / 尺寸问题 (+大) / Measurement issue positive'
//           WHEN '44' THEN N'បញ្ហាខ្វះខ្នាត(-) / 尺寸问题 (-小) / Measurement issue negative'
//           ELSE NULL
//         END AS ReworkName,
//         SUM(QtyRework) AS DefectsQty
//       FROM
//         YMDataStore.SUNRISE.RS18 r
//       WHERE
//         TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
//         AND SeqNo <> 700
//         AND TRY_CAST(ReworkCode AS INT) BETWEEN 1 AND 44
//         AND CAST(dDate AS DATE) > '2022-12-31'
//         AND CAST(dDate AS DATE) < DATEADD(DAY, 1, GETDATE())
//       GROUP BY
//         CAST(dDate AS DATE),
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         ReworkCode
//       HAVING
//         CASE ReworkCode
//           WHEN '1' THEN N'សំរុងវែងខ្លីមិនស្មើគ្នា(ខោ ដៃអាវ) / 左右長短(裤和袖长) / Uneven leg/sleeve length'
//           WHEN '2' THEN N'មិនមែនកែដេរ / 非本位返工 / Non-defective'
//           WHEN '3' THEN N'ដេររមួល / 扭 / Twisted'
//           WHEN '4' THEN N'ជ្រួញនិងទឹករលក និងប៉ោងសាច់ / 起皺/波浪/起包 / Puckering/ Wavy/ Fullness'
//           WHEN '5' THEN N'ដាច់អំបោះ / 斷線 / Broken stitches'
//           WHEN '6' THEN N'លោតអំបោះ / 跳線 / Skipped stitches'
//           WHEN '7' THEN N'ប្រឡាក់ប្រេង / 油漬 / Oil stain'
//           WHEN '8' THEN N'ធ្លុះរន្ធ / 破洞 (包括針洞) / Hole/ Needle hole'
//           WHEN '9' THEN N'ខុសពណ៏ / 色差 / Color shading'
//           WHEN '10' THEN N'ផ្លាកដេរខុសសេរីនិងដេរខុសផ្លាក / 嘜頭錯碼/車錯嘜頭 / Label sewn wrong size/style/po'
//           WHEN '11' THEN N'ប្រឡាក់ / 髒污 / Dirty stain'
//           WHEN '12' THEN N'រហែកថ្នេរ / 爆縫 / Open seam'
//           WHEN '13' THEN N'អត់បានដេរ / 漏車縫/漏空 / Missed sewing'
//           WHEN '14' THEN N'ព្រុយ / 線頭 / Untrimmed thread ends'
//           WHEN '15' THEN N'ខូចសាច់ក្រណាត់(មិនអាចកែ) / 布疵（改不了） / Fabric defect (unrepairable)'
//           WHEN '16' THEN N'គៀបសាច់ / 打折 / Pleated'
//           WHEN '17' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់ / 燙畫/印花/繡花 / Heat transfer/ Printing/ EMB defect'
//           WHEN '18' THEN N'អាវកែផ្សេងៗ / 其它返工 / Others'
//           WHEN '19' THEN N'អ៊ុតអត់ជាប់ / 熨燙不良 / Insecure of Heat transfer'
//           WHEN '20' THEN N'ទំហំទទឺងតូចធំមិនស្មើគ្នា / 左右大小不均匀 / Uneven width'
//           WHEN '21' THEN N'គំលាតម្ជុល តឹង និង ធូរអំបោះពេក / 針距: 線緊/線鬆 / Stitch density tight/loose'
//           WHEN '22' THEN N'សល់ជាយ និង ព្រុយខាងៗ / 毛邊 止口 / Fray edge / Raw edge'
//           WHEN '23' THEN N'ជ្រលក់ពណ៏ខុស រឺក៏ ខូច / 染色不正確 - 次品/廢品 / Incorrect dying'
//           WHEN '24' THEN N'ប្រឡាក់ប្រេង2 / 油漬2 / Oil stain 2'
//           WHEN '25' THEN N'ខុសពណ៏2 / 色差2 / Color variation 2'
//           WHEN '26' THEN N'ប្រឡាក់2 / 髒污2 / Dirty stain 2'
//           WHEN '27' THEN N'ឆ្នូតក្រណាត់2 / 布疵2 / Fabric defect 2'
//           WHEN '28' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់2 / 燙畫 / 印花 /繡花 2 / Heat transfer/ Printing/ EMB defect 2'
//           WHEN '29' THEN N'ដេរអត់ជាប់ / 不牢固 / Insecure'
//           WHEN '30' THEN N'ដេរធ្លាក់ទឹក / 落坑 / Run off stitching'
//           WHEN '31' THEN N'ខូចទ្រង់ទ្រាយ / 形状不良 / Poor shape'
//           WHEN '32' THEN N'បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន) / 布有飞纱，勾纱(可修) / Fabric fly yarn / snagging (repairable)'
//           WHEN '33' THEN N'មិនចំគ្នា / 不对称（骨位，间条） / Mismatched'
//           WHEN '34' THEN N'បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំ វៀច / 车标问题:错位置,反,高低,歪斜 / Label: misplace,invert,uneven,slant'
//           WHEN '35' THEN N'ស្មាមម្ជុល / 针孔 / Needle Mark'
//           WHEN '36' THEN N'បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-) / 衣服錯碼(某部位/裁片) / Wrong size of garment(cut panel/part)'
//           WHEN '37' THEN N'ផ្សេងៗ / 其它-做工不良 / Others - Poor Workmanship (Spare) 2'
//           WHEN '38' THEN N'បញ្ហាបោកទឹក / ជ្រលក់ពណ៌ / 洗水 / 染色不正确 / Improper Washing Dyeing'
//           WHEN '39' THEN N'បញ្ហាអ៊ុត- ឡើងស / ស្នាម / ខ្លោច -ល- / 烫工不良:起镜 / 压痕 / 烫焦 / Improper Ironing: Glazing / Mark / Scorch, etc…'
//           WHEN '40' THEN N'បញ្ហាអ៊ុត: ខូចទ្រង់ទ្រាយ / ខូចរាង / 烫工不良:变形 / 外观不良 / Improper Ironing: Off Shape / Poor Appearance'
//           WHEN '41' THEN N'ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា / 左右高低 / Asymmetry / Hi-Low'
//           WHEN '42' THEN N'ថ្នេរដេរមិនត្រួតគ្នា តូចធំមិនស្មើគ្នា / 车线不重叠 大小不均匀 / Uneven / Misalign stitches'
//           WHEN '43' THEN N'បញ្ហាលើសខ្នាត(+) / 尺寸问题 (+大) / Measurement issue positive'
//           WHEN '44' THEN N'បញ្ហាខ្វះខ្នាត(-) / 尺寸问题 (-小) / Measurement issue negative'
//           ELSE NULL
//         END IS NOT NULL;
//     `;

//     const result = await request.query(query);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching RS18 data:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch RS18 data", error: err.message });
//   }
// });

// /* ------------------------------
//    Fetching Sunrise Output Data from YMDataStore
// ------------------------------ */

// // New Endpoint for Sunrise Output Data (YMDataStore)
// app.get("/api/sunrise/output", async (req, res) => {
//   if (!sqlConnectionStatus.YMDataStore) {
//     return res.status(503).json({
//       message:
//         "Service Unavailable: The YMDataStore database is not connected.",
//       error: "Database connection failed"
//     });
//   }
//   try {
//     await ensurePoolConnected(poolYMDataStore, "YMDataStore");
//     const request = poolYMDataStore.request();
//     //pool = await connectToSqlServerYMDataStore();
//     const query = `
//       SELECT
//         FORMAT(CAST(BillDate AS DATE), 'MM-dd-yyyy') AS InspectionDate,
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END) AS TotalQtyT38,
//         SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END) AS TotalQtyT39
//       FROM
//       (
//         SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2023
//         UNION ALL
//         SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2024
//         UNION ALL
//         SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2025
//       ) AS CombinedData
//       WHERE
//         SeqNo IN (38, 39)
//         AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
//       GROUP BY
//         CAST(BillDate AS DATE),
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName;
//     `;

//     const result = await request.query(query);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching Sunrise Output data:", err);
//     res.status(500).json({
//       message: "Failed to fetch Sunrise Output data",
//       error: err.message
//     });
//   }
// });

// /* ------------------------------
//    QC1 Sunrise MongoDB
// ------------------------------ */

// // Function to fetch RS18 data (defects) - Last 7 days only
// const fetchRS18Data = async () => {
//   if (!sqlConnectionStatus.YMDataStore) {
//     return res.status(503).json({
//       message:
//         "Service Unavailable: The YMDataStore database is not connected.",
//       error: "Database connection failed"
//     });
//   }
//   try {
//     await ensurePoolConnected(poolYMDataStore, "YMDataStore");
//     const request = poolYMDataStore.request();
//     const query = `
//       SELECT
//         FORMAT(CAST(dDate AS DATE), 'MM-dd-yyyy') AS InspectionDate,
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         ReworkCode,
//         CASE ReworkCode
//           WHEN '1' THEN N'សំរុងវែងខ្លីមិនស្មើគ្នា(ខោ ដៃអាវ) / 左右長短(裤和袖长) / Uneven leg/sleeve length'
//           WHEN '2' THEN N'មិនមែនកែដេរ / 非本位返工 / Non-defective'
//           WHEN '3' THEN N'ដេររមួល / 扭 / Twisted'
//           WHEN '4' THEN N'ជ្រួញនិងទឹករលក និងប៉ោងសាច់ / 起皺/波浪/起包 / Puckering/ Wavy/ Fullness'
//           WHEN '5' THEN N'ដាច់អំបោះ / 斷線 / Broken stitches'
//           WHEN '6' THEN N'លោតអំបោះ / 跳線 / Skipped stitches'
//           WHEN '7' THEN N'ប្រឡាក់ប្រេង / 油漬 / Oil stain'
//           WHEN '8' THEN N'ធ្លុះរន្ធ / 破洞 (包括針洞) / Hole/ Needle hole'
//           WHEN '9' THEN N'ខុសពណ៏ / 色差 / Color shading'
//           WHEN '10' THEN N'ផ្លាកដេរខុសសេរីនិងដេរខុសផ្លាក / 嘜頭錯碼/車錯嘜頭 / Label sewn wrong size/style/po'
//           WHEN '11' THEN N'ប្រឡាក់ / 髒污 / Dirty stain'
//           WHEN '12' THEN N'រហែកថ្នេរ / 爆縫 / Open seam'
//           WHEN '13' THEN N'អត់បានដេរ / 漏車縫/漏空 / Missed sewing'
//           WHEN '14' THEN N'ព្រុយ / 線頭 / Untrimmed thread ends'
//           WHEN '15' THEN N'ខូចសាច់ក្រណាត់(មិនអាចកែ) / 布疵（改不了） / Fabric defect (unrepairable)'
//           WHEN '16' THEN N'គៀបសាច់ / 打折 / Pleated'
//           WHEN '17' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់ / 燙畫/印花/繡花 / Heat transfer/ Printing/ EMB defect'
//           WHEN '18' THEN N'អាវកែផ្សេងៗ / 其它返工 / Others'
//           WHEN '19' THEN N'អ៊ុតអត់ជាប់ / 熨燙不良 / Insecure of Heat transfer'
//           WHEN '20' THEN N'ទំហំទទឺងតូចធំមិនស្មើគ្នា / 左右大小不均匀 / Uneven width'
//           WHEN '21' THEN N'គំលាតម្ជុល តឹង និង ធូរអំបោះពេក / 針距: 線緊/線鬆 / Stitch density tight/loose'
//           WHEN '22' THEN N'សល់ជាយ និង ព្រុយខាងៗ / 毛邊 止口 / Fray edge / Raw edge'
//           WHEN '23' THEN N'ជ្រលក់ពណ៏ខុស រឺក៏ ខូច / 染色不正確 - 次品/廢品 / Incorrect dying'
//           WHEN '24' THEN N'ប្រឡាក់ប្រេង2 / 油漬2 / Oil stain 2'
//           WHEN '25' THEN N'ខុសពណ៏2 / 色差2 / Color variation 2'
//           WHEN '26' THEN N'ប្រឡាក់2 / 髒污2 / Dirty stain 2'
//           WHEN '27' THEN N'ឆ្នូតក្រណាត់2 / 布疵2 / Fabric defect 2'
//           WHEN '28' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់2 / 燙畫 / 印花 /繡花 2 / Heat transfer/ Printing/ EMB defect 2'
//           WHEN '29' THEN N'ដេរអត់ជាប់ / 不牢固 / Insecure'
//           WHEN '30' THEN N'ដេរធ្លាក់ទឹក / 落坑 / Run off stitching'
//           WHEN '31' THEN N'ខូចទ្រង់ទ្រាយ / 形状不良 / Poor shape'
//           WHEN '32' THEN N'បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន) / 布有飞纱，勾纱(可修) / Fabric fly yarn / snagging (repairable)'
//           WHEN '33' THEN N'មិនចំគ្នា / 不对称（骨位，间条） / Mismatched'
//           WHEN '34' THEN N'បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំ វៀច / 车标问题:错位置,反,高低,歪斜 / Label: misplace,invert,uneven,slant'
//           WHEN '35' THEN N'ស្មាមម្ជុល / 针孔 / Needle Mark'
//           WHEN '36' THEN N'បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-) / 衣服錯碼(某部位/裁片) / Wrong size of garment(cut panel/part)'
//           WHEN '37' THEN N'ផ្សេងៗ / 其它-做工不良 / Others - Poor Workmanship (Spare) 2'
//           WHEN '38' THEN N'បញ្ហាបោកទឹក / ជ្រលក់ពណ៌ / 洗水 / 染色不正确 / Improper Washing Dyeing'
//           WHEN '39' THEN N'បញ្ហាអ៊ុត- ឡើងស / ស្នាម / ខ្លោច -ល- / 烫工不良:起镜 / 压痕 / 烫焦 / Improper Ironing: Glazing / Mark / Scorch, etc…'
//           WHEN '40' THEN N'បញ្ហាអ៊ុត: ខូចទ្រង់ទ្រាយ / ខូចរាង / 烫工不良:变形 / 外观不良 / Improper Ironing: Off Shape / Poor Appearance'
//           WHEN '41' THEN N'ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា / 左右高低 / Asymmetry / Hi-Low'
//           WHEN '42' THEN N'ថ្នេរដេរមិនត្រួតគ្នា តូចធំមិនស្មើគ្នា / 车线不重叠 大小不均匀 / Uneven / Misalign stitches'
//           WHEN '43' THEN N'បញ្ហាលើសខ្នាត(+) / 尺寸问题 (+大) / Measurement issue positive'
//           WHEN '44' THEN N'បញ្ហាខ្វះខ្នាត(-) / 尺寸问题 (-小) / Measurement issue negative'
//           ELSE NULL
//         END AS ReworkName,
//         SUM(QtyRework) AS DefectsQty
//       FROM
//         YMDataStore.SUNRISE.RS18 r
//       WHERE
//         TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
//         AND SeqNo <> 700
//         AND TRY_CAST(ReworkCode AS INT) BETWEEN 1 AND 44
//         AND CAST(dDate AS DATE) >= DATEADD(DAY, -7, GETDATE())
//         AND CAST(dDate AS DATE) < DATEADD(DAY, 1, GETDATE())
//       GROUP BY
//         CAST(dDate AS DATE),
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         ReworkCode
//       HAVING
//         CASE ReworkCode
//           WHEN '1' THEN N'សំរុងវែងខ្លីមិនស្មើគ្នា(ខោ ដៃអាវ) / 左右長短(裤和袖长) / Uneven leg/sleeve length'
//           WHEN '2' THEN N'មិនមែនកែដេរ / 非本位返工 / Non-defective'
//           WHEN '3' THEN N'ដេររមួល / 扭 / Twisted'
//           WHEN '4' THEN N'ជ្រួញនិងទឹករលក និងប៉ោងសាច់ / 起皺/波浪/起包 / Puckering/ Wavy/ Fullness'
//           WHEN '5' THEN N'ដាច់អំបោះ / 斷線 / Broken stitches'
//           WHEN '6' THEN N'លោតអំបោះ / 跳線 / Skipped stitches'
//           WHEN '7' THEN N'ប្រឡាក់ប្រេង / 油漬 / Oil stain'
//           WHEN '8' THEN N'ធ្លុះរន្ធ / 破洞 (包括針洞) / Hole/ Needle hole'
//           WHEN '9' THEN N'ខុសពណ៏ / 色差 / Color shading'
//           WHEN '10' THEN N'ផ្លាកដេរខុសសេរីនិងដេរខុសផ្លាក / 嘜頭錯碼/車錯嘜頭 / Label sewn wrong size/style/po'
//           WHEN '11' THEN N'ប្រឡាក់ / 髒污 / Dirty stain'
//           WHEN '12' THEN N'រហែកថ្នេរ / 爆縫 / Open seam'
//           WHEN '13' THEN N'អត់បានដេរ / 漏車縫/漏空 / Missed sewing'
//           WHEN '14' THEN N'ព្រុយ / 線頭 / Untrimmed thread ends'
//           WHEN '15' THEN N'ខូចសាច់ក្រណាត់(មិនអាចកែ) / 布疵（改不了） / Fabric defect (unrepairable)'
//           WHEN '16' THEN N'គៀបសាច់ / 打折 / Pleated'
//           WHEN '17' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់ / 燙畫/印花/繡花 / Heat transfer/ Printing/ EMB defect'
//           WHEN '18' THEN N'អាវកែផ្សេងៗ / 其它返工 / Others'
//           WHEN '19' THEN N'អ៊ុតអត់ជាប់ / 熨燙不良 / Insecure of Heat transfer'
//           WHEN '20' THEN N'ទំហំទទឺងតូចធំមិនស្មើគ្នា / 左右大小不均匀 / Uneven width'
//           WHEN '21' THEN N'គំលាតម្ជុល តឹង និង ធូរអំបោះពេក / 針距: 線緊/線鬆 / Stitch density tight/loose'
//           WHEN '22' THEN N'សល់ជាយ និង ព្រុយខាងៗ / 毛邊 止口 / Fray edge / Raw edge'
//           WHEN '23' THEN N'ជ្រលក់ពណ៏ខុស រឺក៏ ខូច / 染色不正確 - 次品/廢品 / Incorrect dying'
//           WHEN '24' THEN N'ប្រឡាក់ប្រេង2 / 油漬2 / Oil stain 2'
//           WHEN '25' THEN N'ខុសពណ៏2 / 色差2 / Color variation 2'
//           WHEN '26' THEN N'ប្រឡាក់2 / 髒污2 / Dirty stain 2'
//           WHEN '27' THEN N'ឆ្នូតក្រណាត់2 / 布疵2 / Fabric defect 2'
//           WHEN '28' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់2 / 燙畫 / 印花 /繡花 2 / Heat transfer/ Printing/ EMB defect 2'
//           WHEN '29' THEN N'ដេរអត់ជាប់ / 不牢固 / Insecure'
//           WHEN '30' THEN N'ដេរធ្លាក់ទឹក / 落坑 / Run off stitching'
//           WHEN '31' THEN N'ខូចទ្រង់ទ្រាយ / 形状不良 / Poor shape'
//           WHEN '32' THEN N'បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន) / 布有飞纱，勾纱(可修) / Fabric fly yarn / snagging (repairable)'
//           WHEN '33' THEN N'មិនចំគ្នា / 不对称（骨位，间条） / Mismatched'
//           WHEN '34' THEN N'បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំ វៀច / 车标问题:错位置,反,高低,歪斜 / Label: misplace,invert,uneven,slant'
//           WHEN '35' THEN N'ស្មាមម្ជុល / 针孔 / Needle Mark'
//           WHEN '36' THEN N'បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-) / 衣服錯碼(某部位/裁片) / Wrong size of garment(cut panel/part)'
//           WHEN '37' THEN N'ផ្សេងៗ / 其它-做工不良 / Others - Poor Workmanship (Spare) 2'
//           WHEN '38' THEN N'បញ្ហាបោកទឹក / ជ្រលក់ពណ៌ / 洗水 / 染色不正确 / Improper Washing Dyeing'
//           WHEN '39' THEN N'បញ្ហាអ៊ុត- ឡើងស / ស្នាម / ខ្លោច -ល- / 烫工不良:起镜 / 压痕 / 烫焦 / Improper Ironing: Glazing / Mark / Scorch, etc…'
//           WHEN '40' THEN N'បញ្ហាអ៊ុត: ខូចទ្រង់ទ្រាយ / ខូចរាង / 烫工不良:变形 / 外观不良 / Improper Ironing: Off Shape / Poor Appearance'
//           WHEN '41' THEN N'ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា / 左右高低 / Asymmetry / Hi-Low'
//           WHEN '42' THEN N'ថ្នេរដេរមិនត្រួតគ្នា តូចធំមិនស្មើគ្នា / 车线不重叠 大小不均匀 / Uneven / Misalign stitches'
//           WHEN '43' THEN N'បញ្ហាលើសខ្នាត(+) / 尺寸问题 (+大) / Measurement issue positive'
//           WHEN '44' THEN N'បញ្ហាខ្វះខ្នាត(-) / 尺寸问题 (-小) / Measurement issue negative'
//           ELSE NULL
//         END IS NOT NULL;
//     `;
//     const result = await request.query(query);
//     console.log(
//       `Fetched ${result.recordset.length} RS18 records from the last 7 days`
//     );
//     return result.recordset;
//   } catch (err) {
//     console.error("Error fetching RS18 data:", err);
//     throw err;
//   }
// };

// // Function to fetch Output data - Last 7 days only
// const fetchOutputData = async () => {
//   if (!sqlConnectionStatus.YMDataStore) {
//     return res.status(503).json({
//       message:
//         "Service Unavailable: The YMDataStore database is not connected.",
//       error: "Database connection failed"
//     });
//   }
//   try {
//     await ensurePoolConnected(poolYMDataStore, "YMDataStore");
//     const request = poolYMDataStore.request();
//     const query = `
//       SELECT
//         FORMAT(CAST(BillDate AS DATE), 'MM-dd-yyyy') AS InspectionDate,
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END) AS TotalQtyT38,
//         SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END) AS TotalQtyT39
//       FROM
//       (
//         SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2023
//         UNION ALL
//         SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2024
//         UNION ALL
//         SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2025
//       ) AS CombinedData
//       WHERE
//         SeqNo IN (38, 39)
//         AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
//         AND CAST(BillDate AS DATE) >= DATEADD(DAY, -7, GETDATE())
//         AND CAST(BillDate AS DATE) < DATEADD(DAY, 1, GETDATE())
//       GROUP BY
//         CAST(BillDate AS DATE),
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName;
//     `;
//     const result = await request.query(query);
//     console.log(
//       `Fetched ${result.recordset.length} Output records from the last 7 days`
//     );
//     return result.recordset;
//   } catch (err) {
//     console.error("Error fetching Output data:", err);
//     throw err;
//   }
// };

// // Helper function to determine Buyer based on MONo
// const determineBuyer = (MONo) => {
//   if (!MONo) return "Other";
//   if (MONo.includes("CO")) return "Costco";
//   if (MONo.includes("AR")) return "Aritzia";
//   if (MONo.includes("RT")) return "Reitmans";
//   if (MONo.includes("AF")) return "ANF";
//   if (MONo.includes("NT")) return "STORI";
//   return "Other";
// };

// // Function to sync data to MongoDB - Only process last 7 days and update if modified
// const syncQC1SunriseData = async () => {
//   try {
//     console.log("Starting QC1 Sunrise data sync at", new Date().toISOString());

//     // Fetch data from both sources (last 7 days only)
//     const [rs18Data, outputData] = await Promise.all([
//       fetchRS18Data(),
//       fetchOutputData()
//     ]);

//     if (outputData.length === 0) {
//       console.log(
//         "No output data fetched from SQL Server for the last 7 days. Sync aborted."
//       );
//       return;
//     }

//     // Create a map for defect data for quick lookup
//     const defectMap = new Map();
//     rs18Data.forEach((defect) => {
//       const key = `${defect.InspectionDate}-${defect.WorkLine}-${defect.MONo}-${defect.SizeName}-${defect.ColorNo}-${defect.ColorName}`;
//       if (!defectMap.has(key)) {
//         defectMap.set(key, []);
//       }
//       defectMap.get(key).push({
//         defectCode: defect.ReworkCode,
//         defectName: defect.ReworkName,
//         defectQty: defect.DefectsQty
//       });
//     });
//     console.log(`Defect Map contains ${defectMap.size} entries with defects`);

//     // Prepare MongoDB documents starting from output data
//     const documents = [];
//     outputData.forEach((output) => {
//       const key = `${output.InspectionDate}-${output.WorkLine}-${output.MONo}-${output.SizeName}-${output.ColorNo}-${output.ColorName}`;
//       const defectArray = defectMap.get(key) || []; // Empty array if no defects

//       const totalDefectsQty = defectArray.reduce(
//         (sum, defect) => sum + defect.defectQty,
//         0
//       );
//       const checkedQty = Math.max(
//         output.TotalQtyT38 || 0,
//         output.TotalQtyT39 || 0
//       );

//       const doc = {
//         inspectionDate: output.InspectionDate,
//         lineNo: output.WorkLine,
//         MONo: output.MONo,
//         Size: output.SizeName,
//         Color: output.ColorName,
//         ColorNo: output.ColorNo,
//         Buyer: determineBuyer(output.MONo),
//         CheckedQtyT38: output.TotalQtyT38 || 0,
//         CheckedQtyT39: output.TotalQtyT39 || 0,
//         CheckedQty: checkedQty,
//         DefectArray: defectArray, // Will be empty if no defects
//         totalDefectsQty: totalDefectsQty
//       };
//       documents.push(doc);
//     });
//     console.log(`Prepared ${documents.length} documents for MongoDB`);

//     // Log a sample document
//     if (documents.length > 0) {
//       console.log("Sample Document:", documents[0]);
//     }

//     // Fetch existing documents from MongoDB for comparison (only for the last 7 days)
//     const existingDocs = await QC1Sunrise.find({
//       inspectionDate: {
//         $gte: new Date(new Date().setDate(new Date().getDate() - 7))
//           .toISOString()
//           .split("T")[0]
//       }
//     }).lean();
//     const existingDocsMap = new Map();
//     existingDocs.forEach((doc) => {
//       const key = `${doc.inspectionDate}-${doc.lineNo}-${doc.MONo}-${doc.Size}-${doc.ColorNo}`;
//       existingDocsMap.set(key, doc);
//     });
//     console.log(
//       `Fetched ${existingDocsMap.size} existing documents from qc1_sunrise for comparison`
//     );

//     // Filter documents to only include those that are new or have changed
//     const documentsToUpdate = [];
//     for (const doc of documents) {
//       const key = `${doc.inspectionDate}-${doc.lineNo}-${doc.MONo}-${doc.Size}-${doc.ColorNo}`;
//       const existingDoc = existingDocsMap.get(key);

//       if (!existingDoc) {
//         // New document, include it
//         documentsToUpdate.push(doc);
//       } else {
//         // Compare fields to check for changes
//         const hasChanged =
//           existingDoc.CheckedQtyT38 !== doc.CheckedQtyT38 ||
//           existingDoc.CheckedQtyT39 !== doc.CheckedQtyT39 ||
//           existingDoc.CheckedQty !== doc.CheckedQty ||
//           existingDoc.totalDefectsQty !== doc.totalDefectsQty ||
//           JSON.stringify(existingDoc.DefectArray) !==
//             JSON.stringify(doc.DefectArray);

//         if (hasChanged) {
//           documentsToUpdate.push(doc);
//         }
//       }
//     }
//     console.log(
//       `Filtered down to ${documentsToUpdate.length} documents that are new or modified`
//     );

//     // Bulk upsert into MongoDB
//     const bulkOps = documentsToUpdate.map((doc) => ({
//       updateOne: {
//         filter: {
//           inspectionDate: doc.inspectionDate,
//           lineNo: doc.lineNo,
//           MONo: doc.MONo,
//           Size: doc.Size,
//           ColorNo: doc.ColorNo
//         },
//         update: { $set: doc },
//         upsert: true
//       }
//     }));

//     if (bulkOps.length > 0) {
//       const result = await QC1Sunrise.bulkWrite(bulkOps);
//       console.log(
//         `Bulk write result: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`
//       );
//       console.log(
//         `Successfully synced ${bulkOps.length} documents to qc1_sunrise.`
//       );
//     } else {
//       console.log("No new or modified documents to upsert");
//       console.log("Successfully synced 0 documents to qc1_sunrise.");
//     }

//     // Verify collection contents
//     const collectionCount = await QC1Sunrise.countDocuments();
//     console.log(
//       `Total documents in qc1_sunrise collection: ${collectionCount}`
//     );

//     console.log(
//       `Successfully completed QC1 Sunrise sync with ${documentsToUpdate.length} new or modified records`
//     );
//   } catch (err) {
//     console.error("Error syncing QC1 Sunrise data:", err);
//     throw err;
//   }
// };

// // Endpoint to manually trigger QC1 Sunrise sync
// app.get("/api/sunrise/sync-qc1", async (req, res) => {
//   try {
//     await syncQC1SunriseData();
//     res.json({ message: "QC1 Sunrise data synced successfully" });
//   } catch (err) {
//     console.error("Error in /api/sunrise/sync-qc1 endpoint:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to sync QC1 Sunrise data", error: err.message });
//   }
// });

// // Schedule daily sync at midnight
// cron.schedule("0 0 * * *", async () => {
//   console.log("Running daily QC1 Sunrise data sync...");
//   try {
//     await syncQC1SunriseData();
//   } catch (err) {
//     console.error("Error in daily QC1 Sunrise sync:", err);
//   }
// });

// /* ------------------------------
//    Fetch inline data from SQL to ym_prod
// ------------------------------ */

// async function syncInlineOrders() {
//   // MODIFICATION: Add connection status check
//   if (!sqlConnectionStatus.YMCE_SYSTEM) {
//     console.warn(
//       "Skipping syncInlineOrders: YMCE_SYSTEM database is not connected."
//     );
//     return;
//   }
//   try {
//     console.log("Starting inline_orders sync at", new Date().toISOString());
//     await ensurePoolConnected(poolYMCE, "YMCE_SYSTEM");

//     const request = poolYMCE.request();

//     console.log(
//       "Using connection to:",
//       poolYMCE.config.server,
//       "database:",
//       poolYMCE.config.database
//     );

//     const query = `
//       SELECT
//         St_No,
//         By_Style,
//         Tg_No,
//         Tg_Code,
//         Ma_Code,
//         ch_name,
//         kh_name,
//         Dept_Type
//       FROM
//         dbo.ViewTg vt
//       WHERE
//         Dept_Type = 'Sewing';
//     `;

//     const result = await request.query(query);
//     const data = result.recordset;

//     if (data.length === 0) {
//       console.log("No data to sync to inline_orders.");
//       return;
//     }

//     // Group data by St_No, By_Style, and Dept_Type
//     const groupedData = data.reduce((acc, row) => {
//       const key = `${row.St_No}_${row.By_Style}_${row.Dept_Type}`;
//       if (!acc[key]) {
//         acc[key] = {
//           St_No: row.St_No,
//           By_Style: row.By_Style,
//           Dept_Type: row.Dept_Type,
//           orderData: []
//         };
//       }
//       acc[key].orderData.push({
//         Tg_No: row.Tg_No,
//         Tg_Code: row.Tg_Code,
//         Ma_Code: row.Ma_Code,
//         ch_name: row.ch_name,
//         kh_name: row.kh_name,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });
//       return acc;
//     }, {});

//     const documents = Object.values(groupedData);

//     // Use bulkWrite with upsert to update or insert documents
//     const bulkOps = documents.map((doc) => ({
//       updateOne: {
//         filter: {
//           St_No: doc.St_No,
//           By_Style: doc.By_Style,
//           Dept_Type: doc.Dept_Type
//         },
//         update: {
//           $set: {
//             St_No: doc.St_No,
//             By_Style: doc.By_Style,
//             Dept_Type: doc.Dept_Type,
//             orderData: doc.orderData,
//             updatedAt: new Date()
//           },
//           $setOnInsert: {
//             createdAt: new Date()
//           }
//         },
//         upsert: true
//       }
//     }));

//     await InlineOrders.bulkWrite(bulkOps);
//     console.log(
//       `Successfully synced ${documents.length} documents to inline_orders.`
//     );

//     // Optional: Remove documents that no longer exist in the source data
//     const existingKeys = documents.map(
//       (doc) => `${doc.St_No}_${doc.By_Style}_${doc.Dept_Type}`
//     );
//     await InlineOrders.deleteMany({
//       $and: [
//         { St_No: { $exists: true } },
//         { By_Style: { $exists: true } },
//         { Dept_Type: { $exists: true } },
//         {
//           $expr: {
//             $not: {
//               $in: [
//                 { $concat: ["$St_No", "_", "$By_Style", "_", "$Dept_Type"] },
//                 existingKeys
//               ]
//             }
//           }
//         }
//       ]
//     });
//     console.log("Removed outdated documents from inline_orders.");
//   } catch (err) {
//     console.error("Error during inline_orders sync:", err);
//     throw err;
//   }
// }

// // New API Endpoint to manually trigger the sync
// app.post("/api/sync-inline-orders", async (req, res) => {
//   try {
//     await syncInlineOrders();
//     res
//       .status(200)
//       .json({ message: "Inline orders sync completed successfully." });
//   } catch (err) {
//     console.error("Error in /api/sync-inline-orders endpoint:", err);
//     res.status(500).json({
//       message: "Failed to sync inline orders",
//       error: err.message
//     });
//   }
// });

// // Schedule the sync to run every day at 11 AM
// cron.schedule("0 11 * * *", async () => {
//   console.log("Running scheduled inline_orders sync at 11 AM...");
//   await syncInlineOrders();
// });

// // Run the sync immediately on server start (optional, for testing)
// syncInlineOrders().then(() => {
//   console.log(
//     "Initial inline_orders sync completed. Scheduler is now running..."
//   );
// });

// // New Endpoint for YMCE_SYSTEM Data
// app.get("/api/ymce-system-data", async (req, res) => {
//   // MODIFICATION: Add connection status check
//   if (!sqlConnectionStatus.YMCE_SYSTEM) {
//     return res.status(503).json({
//       message:
//         "Service Unavailable: The YMCE_SYSTEM database is not connected.",
//       error: "Database connection failed"
//     });
//   }

//   //let pool;
//   try {
//     await ensurePoolConnected(poolYMCE, "YMCE_SYSTEM");
//     const request = poolYMCE.request();
//     const query = `
//       SELECT
//         St_No,
//         By_Style,
//         Tg_No,
//         Tg_Code,
//         Ma_Code,
//         ch_name,
//         kh_name,
//         Dept_Type,
//         SUM(Tg_Pcs) AS PiecesQty,
//         SUM(Tg_Price) AS OperationPrice,
//         SUM(GST_SAM) AS GST
//       FROM
//         dbo.ViewTg vt
//       WHERE
//         Dept_Type = 'Sewing'
//       GROUP BY
//         St_No,
//         By_Style,
//         Tg_No,
//         Tg_Code,
//         Ma_Code,
//         ch_name,
//         kh_name,
//         Dept_Type;
//     `;

//     const result = await request.query(query);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching YMCE_SYSTEM data:", err);
//     res.status(500).json({
//       message: "Failed to fetch YMCE_SYSTEM data",
//       error: err.message
//     });
//   }
// });

// /* --------------------------------------------------------
//    Cut Panel Orders Sync with GATEKEEPER to prevent deadlocks
// -------------------------------------------------------- */

// // *** 1. THE GATEKEEPER VARIABLE ***
// let isCutPanelSyncRunning = false;

// async function syncCutPanelOrders() {
//   // *** 2. THE GATEKEEPER CHECK ***
//   if (isCutPanelSyncRunning) {
//     console.log(
//       "[CutPanelOrders] Sync is already in progress. Skipping this run."
//     );
//     return;
//   }

//   // *** 3. THE TRY...FINALLY BLOCK TO ENSURE THE LOCK IS RELEASED ***
//   try {
//     isCutPanelSyncRunning = true; // Set the lock
//     console.log("[CutPanelOrders] Starting sync at", new Date().toISOString());

//     if (!sqlConnectionStatus.YMWHSYS2) {
//       console.warn(
//         "[CutPanelOrders] Skipping sync: YMWHSYS2 database is not connected."
//       );
//       return; // The 'finally' block will still run to release the lock
//     }

//     await ensurePoolConnected(poolYMWHSYS2, "YMWHSYS2");

//     // This is your query for a rolling 3-day update. This is perfect for the cron job.
//     const query = `
//       DECLARE @StartDate DATE = CAST(DATEADD(DAY, -3, GETDATE()) AS DATE);
//       -- The rest of your optimized SQL query...
//       WITH
//       LotData AS (
//           SELECT v.Style, v.TableNo, STUFF((SELECT DISTINCT ', ' + v_inner.Lot FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v_inner WHERE v_inner.Style = v.Style AND v_inner.TableNo = v.TableNo AND v_inner.Lot IS NOT NULL AND v_inner.Lot <> '' FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS LotNos
//           FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v INNER JOIN [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS inv_filter ON v.TxnNo = inv_filter.TxnNo
//           WHERE v.Lot IS NOT NULL AND v.Lot <> '' AND inv_filter.Create_Date >= @StartDate
//           GROUP BY v.Style, v.TableNo
//       ),
//       OrderData AS (
//           SELECT Style, EngColor, Size1, Size2, Size3, Size4, Size5, Size6, Size7, Size8, Size9, Size10,
//               OrderQty1, OrderQty2, OrderQty3, OrderQty4, OrderQty5, OrderQty6, OrderQty7, OrderQty8, OrderQty9, OrderQty10,
//               TotalOrderQty, SUM(TotalOrderQty) OVER (PARTITION BY Style) AS TotalOrderQtyStyle
//           FROM (
//               SELECT o.Style, o.EngColor, MAX(o.Size1) AS Size1, MAX(o.Size2) AS Size2, MAX(o.Size3) AS Size3, MAX(o.Size4) AS Size4, MAX(o.Size5) AS Size5, MAX(o.Size6) AS Size6, MAX(o.Size7) AS Size7, MAX(o.Size8) AS Size8, MAX(o.Size9) AS Size9, MAX(o.Size10) AS Size10,
//                   SUM(ISNULL(o.Qty1, 0)) AS OrderQty1, SUM(ISNULL(o.Qty2, 0)) AS OrderQty2, SUM(ISNULL(o.Qty3, 0)) AS OrderQty3, SUM(ISNULL(o.Qty4, 0)) AS OrderQty4, SUM(ISNULL(o.Qty5, 0)) AS OrderQty5, SUM(ISNULL(o.Qty6, 0)) AS OrderQty6, SUM(ISNULL(o.Qty7, 0)) AS OrderQty7, SUM(ISNULL(o.Qty8, 0)) AS OrderQty8, SUM(ISNULL(o.Qty9, 0)) AS OrderQty9, SUM(ISNULL(o.Qty10, 0)) AS OrderQty10,
//                   SUM(ISNULL(o.Total, 0)) AS TotalOrderQty
//               FROM [FC_SYSTEM].[dbo].[ViewOrderQty] AS o
//               WHERE EXISTS (SELECT 1 FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] vi WHERE vi.Style = o.Style AND vi.EngColor = o.EngColor AND vi.Create_Date >= @StartDate)
//               GROUP BY o.Style, o.EngColor
//           ) AS OrderColorAggregates
//       )
//       SELECT
//           v.Style AS StyleNo, v.Create_Date AS TxnDate, v.TxnNo, CASE WHEN v.Buyer = 'ABC' THEN 'ANF' ELSE v.Buyer END AS Buyer, v.BuyerStyle,
//           v.EngColor AS Color, v.ChnColor, v.ColorNo AS ColorCode, v.Fabric_Type AS FabricType, v.Material,
//           CASE WHEN PATINDEX('%[_ ]%', v.PreparedBy) > 0 THEN LTRIM(SUBSTRING(v.PreparedBy, PATINDEX('%[_ ]%', v.PreparedBy) + 1, LEN(v.PreparedBy))) ELSE v.PreparedBy END AS SpreadTable,
//           v.TableNo, v.RollQty, ROUND(v.SpreadYds, 3) AS SpreadYds, v.Unit, ROUND(v.GrossKgs, 3) AS GrossKgs, ROUND(v.NetKgs, 3) AS NetKgs,
//           v.PlanLayer, v.ActualLayer, CAST(ISNULL(v.PlanLayer, 0) * (ISNULL(v.Ratio1, 0) + ISNULL(v.Ratio2, 0) + ISNULL(v.Ratio3, 0) + ISNULL(v.Ratio4, 0) + ISNULL(v.Ratio5, 0) + ISNULL(v.Ratio6, 0) + ISNULL(v.Ratio7, 0) + ISNULL(v.Ratio8, 0) + ISNULL(v.Ratio9, 0) + ISNULL(v.Ratio10, 0)) AS INT) AS TotalPcs,
//           v.Pattern AS MackerNo, ROUND(v.MarkerLength, 3) AS MackerLength, ld.LotNos, od.OrderQty1, od.OrderQty2, od.OrderQty3, od.OrderQty4, od.OrderQty5,
//           od.OrderQty6, od.OrderQty7, od.OrderQty8, od.OrderQty9, od.OrderQty10, od.TotalOrderQty, od.TotalOrderQtyStyle, v.Ratio1 AS CuttingRatio1,
//           v.Ratio2 AS CuttingRatio2, v.Ratio3 AS CuttingRatio3, v.Ratio4 AS CuttingRatio4, v.Ratio5 AS CuttingRatio5, v.Ratio6 AS CuttingRatio6,
//           v.Ratio7 AS CuttingRatio7, v.Ratio8 AS CuttingRatio8, v.Ratio9 AS CuttingRatio9, v.Ratio10 AS CuttingRatio10, v.Size1, v.Size2, v.Size3,
//           v.Size4, v.Size5, v.Size6, v.Size7, v.Size8, v.Size9, v.Size10,
//           NULL AS TotalTTLRoll, NULL AS TotalTTLQty, NULL AS TotalBiddingQty, NULL AS TotalBiddingRollQty,
//           NULL AS SendFactory, NULL AS SendTxnDate, NULL AS SendTxnNo, NULL AS SendTotalQty
//       FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS v
//       LEFT JOIN LotData AS ld ON v.Style = ld.Style AND v.TableNo = ld.TableNo
//       LEFT JOIN OrderData AS od ON v.Style = od.Style AND v.EngColor = od.EngColor
//       WHERE v.TableNo IS NOT NULL AND v.TableNo <> '' AND v.Create_Date >= @StartDate
//       ORDER BY v.Create_Date DESC;
//     `;

//     const result = await poolYMWHSYS2.request().query(query);
//     const records = result.recordset;

//     if (records.length > 0) {
//       const bulkOps = records.map((row) => ({
//         updateOne: {
//           filter: { TxnNo: row.TxnNo },
//           update: {
//             $set: {
//               StyleNo: row.StyleNo,
//               TxnDate: row.TxnDate ? new Date(row.TxnDate) : null,
//               TxnNo: row.TxnNo,
//               Buyer: row.Buyer,
//               Color: row.Color,
//               SpreadTable: row.SpreadTable,
//               TableNo: row.TableNo,
//               BuyerStyle: row.BuyerStyle,
//               ChColor: row.ChColor,
//               ColorCode: row.ColorCode,
//               FabricType: row.FabricType,
//               Material: row.Material,
//               RollQty: row.RollQty,
//               SpreadYds: row.SpreadYds,
//               Unit: row.Unit,
//               GrossKgs: row.GrossKgs,
//               NetKgs: row.NetKgs,
//               MackerNo: row.MackerNo,
//               MackerLength: row.MackerLength,
//               SendFactory: row.SendFactory,
//               SendTxnDate: row.SendTxnDate ? new Date(row.SendTxnDate) : null,
//               SendTxnNo: row.SendTxnNo,
//               SendTotalQty: row.SendTotalQty,
//               PlanLayer: row.PlanLayer,
//               ActualLayer: row.ActualLayer,
//               TotalPcs: row.TotalPcs,
//               LotNos: row.LotNos
//                 ? row.LotNos.split(",").map((lot) => lot.trim())
//                 : [],
//               TotalOrderQty: row.TotalOrderQty,
//               TotalTTLRoll: row.TotalTTLRoll,
//               TotalTTLQty: row.TotalTTLQty,
//               TotalBiddingQty: row.TotalBiddingQty,
//               TotalBiddingRollQty: row.TotalBiddingRollQty,
//               TotalOrderQtyStyle: row.TotalOrderQtyStyle,
//               MarkerRatio: Array.from({ length: 10 }, (_, k) => ({
//                 no: k + 1,
//                 size: row[`Size${k + 1}`],
//                 cuttingRatio: row[`CuttingRatio${k + 1}`],
//                 orderQty: row[`OrderQty${k + 1}`]
//               }))
//             }
//           },
//           upsert: true
//         }
//       }));
//       await CutPanelOrders.bulkWrite(bulkOps);
//       console.log(
//         `[CutPanelOrders] Successfully synced ${bulkOps.length} documents.`
//       );
//     } else {
//       console.log(
//         "[CutPanelOrders] No new documents to sync in the last 3 days."
//       );
//     }
//   } catch (err) {
//     console.error("Error during cutpanelorders sync:", err);
//   } finally {
//     isCutPanelSyncRunning = false; // Release the lock
//   }
// }

// // Schedule the syncCutPanelOrders function to run every 5 minutes
// cron.schedule("*/5 * * * *", syncCutPanelOrders);
// console.log("Scheduled cutpanelorders sync with deadlock protection.");

// /* ------------------------------
//    Manual Sync Endpoint & Server Start
// ------------------------------ */

// app.post("/api/sync-cutpanel-orders", async (req, res) => {
//   // This manual trigger will also respect the gatekeeper
//   syncCutPanelOrders();
//   res.status(202).json({
//     message:
//       "Cut panel orders sync initiated successfully. Check logs for progress."
//   });
// });

/* 

/*---------------------------------------------------------------------------------------

// * ------------------------------
//     Manual Sync Endpoint & Server Start
//  ------------------------------ */

//  const formatDateSQL = (date) => {
//   const d = new Date(date);
//   return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
// };

// async function syncQC1WorkerData(startDate = "2025-07-01", endDate = new Date()) {
//   await ensurePoolConnected(poolYMDataStore, "YMDataStore");
//   const request = poolYMDataStore.request();

//   // Output Data
//   const outputQuery = `
//     SELECT
//       CONVERT(varchar, BillDate, 23) AS BillDate,
//       EmpID,
//       WorkLine,
//       MONo,
//       SeqNo,
//       ColorNo,
//       ColorName,
//       SizeName,
//       SUM(Qty) AS Qty
//     FROM YMDataStore.SunRise_G.tWork2025
//     WHERE TRY_CAST(SeqNo AS INT) IN (38,39)
//       AND BillDate >= '${formatDateSQL(startDate)}'
//       AND BillDate <= '${formatDateSQL(endDate)}'
//      AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
//     GROUP BY BillDate, EmpID, WorkLine, MONo, SeqNo, ColorNo, ColorName, SizeName
//   `;
//   const outputResult = await request.query(outputQuery);

//   // Defect Data
//   const defectQuery = `
//     SELECT
//       CONVERT(varchar, dDate, 23) AS dDate,
//       EmpID_QC,
//       WorkLine,
//       MONo,
//       ColorNo,
//       ColorName,
//       SizeName,
//       ReworkCode,
//       ReworkName,
//       SUM(QtyRework) AS Defect_Qty
//     FROM YMDataStore.SUNRISE.RS18
//     WHERE dDate >= '${formatDateSQL(startDate)}'
//       AND dDate <= '${formatDateSQL(endDate)}'
//       AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
//   AND TRY_CAST(ReworkCode AS INT) BETWEEN 1 AND 44
//     GROUP BY dDate, EmpID_QC, WorkLine, MONo,  ColorNo, ColorName, SizeName, ReworkCode, ReworkName
//   `;
//   const defectResult = await request.query(defectQuery);

//   // Standardize field names for easier mapping
//   const outputRows = outputResult.recordset.map(row => ({
//     ...row,
//     Inspection_date: row.BillDate,
//     QC_ID: row.EmpID
//   }));

//   const defectRows = defectResult.recordset.map(row => ({
//     ...row,
//     Inspection_date: row.dDate,
//     QC_ID: row.EmpID_QC
//   }));

//   // Use a unified key for both output and defect data
//   function makeKey(row) {
//     return [
//       row.Inspection_date,
//       row.QC_ID
//     ].join("|");
//   }

//   // Build outputMap
//   const outputMap = new Map();
//   for (const row of outputRows) {
//     const key = makeKey(row);
//     if (!outputMap.has(key)) outputMap.set(key, []);
//     outputMap.get(key).push(row);
//   }

//   // Build defectMap
//   const defectMap = new Map();
//   for (const row of defectRows) {
//     const key = makeKey(row);
//     if (!defectMap.has(key)) defectMap.set(key, []);
//     defectMap.get(key).push(row);
//   }

//   // Merge and Build Documents
//   const docs = new Map();
//   const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);

//   for (const key of allKeys) {
//     const outputRows = outputMap.get(key) || [];
//     const defectRows = defectMap.get(key) || [];
//     const [Inspection_date_str, QC_ID_raw] = key.split("|");

//     // 1. QC_ID renaming
//     const QC_ID = QC_ID_raw === "6335" ? "YM6335" : QC_ID_raw;

//     // 2. Date as Date object, time 00:00:00
//     const Inspection_date = new Date(Inspection_date_str + "T00:00:00Z");

//     // Output grouping (group by line/mo/color/size)
//     const outputGroup = {};
//     for (const r of outputRows) {
//       const oKey = [r.WorkLine, r.MONo, r.ColorName, r.SizeName].join("|");
//       if (!outputGroup[oKey]) outputGroup[oKey] = [];
//       outputGroup[oKey].push(r);
//     }
//     const Output_data = Object.values(outputGroup).map(rows => ({
//       Line_no: rows[0].WorkLine,
//       MONo: rows[0].MONo,
//       Color: rows[0].ColorName,
//       Size: rows[0].SizeName,
//       Qty: rows.reduce((sum, r) => sum + Number(r.Qty), 0)
//     }));
//    // Group Output_data by (Line_no, MONo)
//       const outputSummaryMap = new Map();
//       for (const o of Output_data) {
//         const key = `${o.Line_no}|${o.MONo}`;
//         if (!outputSummaryMap.has(key)) {
//           outputSummaryMap.set(key, { Line: o.Line_no, MONo: o.MONo, Qty: 0 });
//         }
//         outputSummaryMap.get(key).Qty += o.Qty;
//       }
//       const Output_data_summary = Array.from(outputSummaryMap.values());

//     const TotalOutput = Output_data_summary.reduce((sum, o) => sum + o.Qty, 0);

//     // Defect grouping (group by line/mo/color/size)
//     const defectGroup = {};
//     for (const d of defectRows) {
//       const dKey = [d.WorkLine, d.MONo, d.ColorName, d.SizeName].join("|");
//       if (!defectGroup[dKey]) defectGroup[dKey] = [];
//       defectGroup[dKey].push(d);
//     }
//     const Defect_data = Object.entries(defectGroup).map(([dKey, rows]) => {
//       let TotalDefect = 0;
//       const defectDetailsMap = new Map();
//       for (const d of rows) {
//         const ddKey = d.ReworkCode + "|" + d.ReworkName;
//         if (!defectDetailsMap.has(ddKey)) {
//           defectDetailsMap.set(ddKey, {
//             Defect_code: Number(d.ReworkCode),
//             Defect_name: d.ReworkName,
//             Qty: 0
//           });
//         }
//         defectDetailsMap.get(ddKey).Qty += Number(d.Defect_Qty);
//         TotalDefect += Number(d.Defect_Qty);
//       }
//       const [Line_no, MONo, Color, Size] = dKey.split("|");
//       return {
//         Line_no,
//         MONo,
//         Color,
//         Size,
//         Defect_qty: TotalDefect,
//         DefectDetails: Array.from(defectDetailsMap.values())
//       };
//     });
//     // Group Defect_data by (Line_no, MONo)
//       const defectSummaryMap = new Map();
//       for (const d of Defect_data) {
//         const key = `${d.Line_no}|${d.MONo}`;
//         if (!defectSummaryMap.has(key)) {
//           defectSummaryMap.set(key, { Line_no: d.Line_no, MONo: d.MONo, Defect_Qty: 0, Defect_Details: [] });
//         }
//         // Sum defect qty
//         defectSummaryMap.get(key).Defect_Qty += d.Defect_qty;

//         // Merge DefectDetails by code/name
//         const detailsMap = new Map(defectSummaryMap.get(key).Defect_Details.map(dd => [
//           `${dd.Defect_code}|${dd.Defect_name}`, { ...dd }
//         ]));
//         for (const dd of d.DefectDetails) {
//           const ddKey = `${dd.Defect_code}|${dd.Defect_name}`;
//           if (!detailsMap.has(ddKey)) {
//             detailsMap.set(ddKey, { ...dd });
//           } else {
//             detailsMap.get(ddKey).Qty += dd.Qty;
//           }
//         }
//         defectSummaryMap.get(key).Defect_Details = Array.from(detailsMap.values());
//       }
//       const Defect_data_summary = Array.from(defectSummaryMap.values());

//     const TotalDefect = Defect_data_summary.reduce((sum, d) => sum + d.Defect_Qty, 0);

//     // 3. Add report_type
//     docs.set(key, {
//       Inspection_date,
//       QC_ID,
//       report_type: "Inline Sewing",
//       Seq_No: [
//         ...new Set(
//           outputRows.map(r => Number(r.SeqNo))
//         )
//       ],

//       TotalOutput,
//       TotalDefect,
//       Output_data,
//       Output_data_summary,
//       Defect_data,
//       Defect_data_summary
//     });
//   }

//   // Save to MongoDB
//   const finalDocs = Array.from(docs.values());
//   const bulkOps = finalDocs.map(doc => ({
//     updateOne: {
//       filter: {
//         Inspection_date: doc.Inspection_date,
//         QC_ID: doc.QC_ID
//       },
//       update: { $set: doc },
//       upsert: true
//     }
//   }));
//   if (bulkOps.length) {
//     const result = await QCWorkers.bulkWrite(bulkOps);
//     console.log(`QC1_Worker sync: Matched ${result.matchedCount}, Upserted ${result.upsertedCount}, Modified ${result.modifiedCount}`);
//   }
// }
// /*--------------------------------------------------------------------------------*/


// // 1. On server start, fetch all data from 2025-07-10 to today
// // syncQC1WorkerData("2025-07-01", new Date())
// //   .then(() => {
// //     console.log("✅ Initial QC1 Worker Data Sync completed (all data).");
// //   })
// //   .catch((err) => {
// //     console.error("❌ Initial QC1 Worker Data Sync failed:", err);
// //   });

// // Schedule to run every day at 11:00 PM
// cron.schedule("0 23 * * *", () => {
//   const endDate = new Date();
//   const startDate = new Date();
//   startDate.setDate(endDate.getDate() - 2); // last 3 days: today, yesterday, day before

//   syncQC1WorkerData(startDate, endDate)
//     .then(() => {
//       console.log("✅ QC1 Worker Data Sync completed (last 3 days, scheduled 11pm).");
//     })
//     .catch((err) => {
//       console.error("❌ QC1 Worker Data Sync failed (last 3 days, scheduled 11pm):", err);
//     });
// });


// DT Orders Data Migration Function
async function syncDTOrdersData() {
  try {
    console.log("🔄 Starting DT Orders data migration...");
    
    // Ensure DTrade connection
    await ensurePoolConnected(poolDTrade, "DTrade_CONN");
    
    // Ensure FC_SYSTEM connection
    await ensurePoolConnected(poolYMWHSYS2, "FC_SYSTEM");
    const request = poolDTrade.request();
    const requestFC = poolYMWHSYS2.request();

    // 1. Fetch Order Headers WITH actual size names AND Order Colors and Shipping in one query
    // console.log("📊 Fetching order headers with size names and shipping data...");
    const orderHeaderQuery = `
      SELECT 
        h.[SC_Heading], h.[Factory], h.[SalesTeamName], h.[Cust_Code], h.[ShortName],
        h.[EngName], h.[Order_No], h.[Ccy], h.[Style], h.[CustStyle], h.[NoOfCol],
        h.[Size_Seq10], h.[Size_Seq20], h.[Size_Seq30], h.[Size_Seq40], h.[Size_Seq50],
        h.[Size_Seq60], h.[Size_Seq70], h.[Size_Seq80], h.[Size_Seq90], h.[Size_Seq100],
        h.[Size_Seq110], h.[Size_Seq120], h.[Size_Seq130], h.[Size_Seq140], h.[Size_Seq150],
        h.[Size_Seq160], h.[Size_Seq170], h.[Size_Seq180], h.[Size_Seq190], h.[Size_Seq200],
        h.[Size_Seq210], h.[Size_Seq220], h.[Size_Seq230], h.[Size_Seq240], h.[Size_Seq250],
        h.[Size_Seq260], h.[Size_Seq270], h.[Size_Seq280], h.[Size_Seq290], h.[Size_Seq300],
        h.[Size_Seq310], h.[Size_Seq320], h.[Size_Seq330], h.[Size_Seq340], h.[Size_Seq350],
        h.[Size_Seq360], h.[Size_Seq370], h.[Size_Seq380], h.[Size_Seq390], h.[Size_Seq400],
        h.[OrderQuantity], h.[Det_ID]
      FROM [DTrade_CONN].[dbo].[vCustOrd_SzHdr] h
      ORDER BY h.[Order_No]
    `;
    const orderHeaderResult = await request.query(orderHeaderQuery);

    // 2. Fetch Size Names for each order (FIXED query)
    // console.log("📏 Fetching size names for each order...");
    const sizeNamesQuery = `
      SELECT DISTINCT
        [Order_No],
        CASE WHEN [Size_Seq10] IS NOT NULL AND [Size_Seq10] != '' THEN [Size_Seq10] END as Size_10_Name,
        CASE WHEN [Size_Seq20] IS NOT NULL AND [Size_Seq20] != '' THEN [Size_Seq20] END as Size_20_Name,
        CASE WHEN [Size_Seq30] IS NOT NULL AND [Size_Seq30] != '' THEN [Size_Seq30] END as Size_30_Name,
        CASE WHEN [Size_Seq40] IS NOT NULL AND [Size_Seq40] != '' THEN [Size_Seq40] END as Size_40_Name,
        CASE WHEN [Size_Seq50] IS NOT NULL AND [Size_Seq50] != '' THEN [Size_Seq50] END as Size_50_Name,
        CASE WHEN [Size_Seq60] IS NOT NULL AND [Size_Seq60] != '' THEN [Size_Seq60] END as Size_60_Name,
        CASE WHEN [Size_Seq70] IS NOT NULL AND [Size_Seq70] != '' THEN [Size_Seq70] END as Size_70_Name,
        CASE WHEN [Size_Seq80] IS NOT NULL AND [Size_Seq80] != '' THEN [Size_Seq80] END as Size_80_Name,
        CASE WHEN [Size_Seq90] IS NOT NULL AND [Size_Seq90] != '' THEN [Size_Seq90] END as Size_90_Name,
        CASE WHEN [Size_Seq100] IS NOT NULL AND [Size_Seq100] != '' THEN [Size_Seq100] END as Size_100_Name,
        CASE WHEN [Size_Seq110] IS NOT NULL AND [Size_Seq110] != '' THEN [Size_Seq110] END as Size_110_Name,
        CASE WHEN [Size_Seq120] IS NOT NULL AND [Size_Seq120] != '' THEN [Size_Seq120] END as Size_120_Name,
        CASE WHEN [Size_Seq130] IS NOT NULL AND [Size_Seq130] != '' THEN [Size_Seq130] END as Size_130_Name,
        CASE WHEN [Size_Seq140] IS NOT NULL AND [Size_Seq140] != '' THEN [Size_Seq140] END as Size_140_Name,
        CASE WHEN [Size_Seq150] IS NOT NULL AND [Size_Seq150] != '' THEN [Size_Seq150] END as Size_150_Name,
        CASE WHEN [Size_Seq160] IS NOT NULL AND [Size_Seq160] != '' THEN [Size_Seq160] END as Size_160_Name,
        CASE WHEN [Size_Seq170] IS NOT NULL AND [Size_Seq170] != '' THEN [Size_Seq170] END as Size_170_Name,
        CASE WHEN [Size_Seq180] IS NOT NULL AND [Size_Seq180] != '' THEN [Size_Seq180] END as Size_180_Name,
        CASE WHEN [Size_Seq190] IS NOT NULL AND [Size_Seq190] != '' THEN [Size_Seq190] END as Size_190_Name,
        CASE WHEN [Size_Seq200] IS NOT NULL AND [Size_Seq200] != '' THEN [Size_Seq200] END as Size_200_Name,
        CASE WHEN [Size_Seq210] IS NOT NULL AND [Size_Seq210] != '' THEN [Size_Seq210] END as Size_210_Name,
        CASE WHEN [Size_Seq220] IS NOT NULL AND [Size_Seq220] != '' THEN [Size_Seq220] END as Size_220_Name,
        CASE WHEN [Size_Seq230] IS NOT NULL AND [Size_Seq230] != '' THEN [Size_Seq230] END as Size_230_Name,
        CASE WHEN [Size_Seq240] IS NOT NULL AND [Size_Seq240] != '' THEN [Size_Seq240] END as Size_240_Name,
        CASE WHEN [Size_Seq250] IS NOT NULL AND [Size_Seq250] != '' THEN [Size_Seq250] END as Size_250_Name,
        CASE WHEN [Size_Seq260] IS NOT NULL AND [Size_Seq260] != '' THEN [Size_Seq260] END as Size_260_Name,
        CASE WHEN [Size_Seq270] IS NOT NULL AND [Size_Seq270] != '' THEN [Size_Seq270] END as Size_270_Name,
        CASE WHEN [Size_Seq280] IS NOT NULL AND [Size_Seq280] != '' THEN [Size_Seq280] END as Size_280_Name,
        CASE WHEN [Size_Seq290] IS NOT NULL AND [Size_Seq290] != '' THEN [Size_Seq290] END as Size_290_Name,
        CASE WHEN [Size_Seq300] IS NOT NULL AND [Size_Seq300] != '' THEN [Size_Seq300] END as Size_300_Name,
        CASE WHEN [Size_Seq310] IS NOT NULL AND [Size_Seq310] != '' THEN [Size_Seq310] END as Size_310_Name,
        CASE WHEN [Size_Seq320] IS NOT NULL AND [Size_Seq320] != '' THEN [Size_Seq320] END as Size_320_Name,
        CASE WHEN [Size_Seq330] IS NOT NULL AND [Size_Seq330] != '' THEN [Size_Seq330] END as Size_330_Name,
        CASE WHEN [Size_Seq340] IS NOT NULL AND [Size_Seq340] != '' THEN [Size_Seq340] END as Size_340_Name,
        CASE WHEN [Size_Seq350] IS NOT NULL AND [Size_Seq350] != '' THEN [Size_Seq350] END as Size_350_Name,
        CASE WHEN [Size_Seq360] IS NOT NULL AND [Size_Seq360] != '' THEN [Size_Seq360] END as Size_360_Name,
        CASE WHEN [Size_Seq370] IS NOT NULL AND [Size_Seq370] != '' THEN [Size_Seq370] END as Size_370_Name,
        CASE WHEN [Size_Seq380] IS NOT NULL AND [Size_Seq380] != '' THEN [Size_Seq380] END as Size_380_Name,
        CASE WHEN [Size_Seq390] IS NOT NULL AND [Size_Seq390] != '' THEN [Size_Seq390] END as Size_390_Name,
        CASE WHEN [Size_Seq400] IS NOT NULL AND [Size_Seq400] != '' THEN [Size_Seq400] END as Size_400_Name
      FROM [DTrade_CONN].[dbo].[vCustOrd_SzHdr]
      WHERE [Order_No] IS NOT NULL
    `;
    const sizeNamesResult = await request.query(sizeNamesQuery);

    // 3. Fetch Order Colors and Shipping WITH Ship_ID
    // console.log("🎨 Fetching order colors and shipping data with Ship_ID...");
    const orderColorsQuery = `
      SELECT 
        [Order_No], [ColorCode], [Color], [ChnColor], [Color_Seq], [ship_seq_no],
        [Ship_ID], [Mode], [Country], [Origin], [CustPORef],
        [Size_Seq10], [Size_Seq20], [Size_Seq30], [Size_Seq40], [Size_Seq50], [Size_Seq60],
        [Size_Seq70], [Size_Seq80], [Size_Seq90], [Size_Seq100], [Size_Seq110], [Size_Seq120],
        [Size_Seq130], [Size_Seq140], [Size_Seq150], [Size_Seq160], [Size_Seq170], [Size_Seq180],
        [Size_Seq190], [Size_Seq200], [Size_Seq210], [Size_Seq220], [Size_Seq230], [Size_Seq240],
        [Size_Seq250], [Size_Seq260], [Size_Seq270], [Size_Seq280], [Size_Seq290], [Size_Seq300],
        [Size_Seq310], [Size_Seq320], [Size_Seq330], [Size_Seq340], [Size_Seq350], [Size_Seq360],
        [Size_Seq370], [Size_Seq380], [Size_Seq390], [Size_Seq400]
      FROM [DTrade_CONN].[dbo].[vBuyerPOColQty_BySz]
      ORDER BY [Order_No], [ColorCode], [ship_seq_no]
    `;
    const orderColorsResult = await request.query(orderColorsQuery);

    // 4. Fetch Size Specifications
    // console.log("📏 Fetching size specifications...");
    const sizeSpecQuery = `
      SELECT 
        [JobNo], [SizeSpecId], [DetId], [Seq], [AtoZ], [Area],
        [ChineseArea], [EnglishRemark], [ChineseRemark], [AreaCode],
        [IsMiddleCalc], [Tolerance], [Tolerance2], [SpecMemo], [SizeSpecMeasUnit],
        [Size1], [Size2], [Size3], [Size4], [Size5], [Size6], [Size7], [Size8], [Size9], [Size10],
        [Size11], [Size12], [Size13], [Size14], [Size15], [Size16], [Size17], [Size18], [Size19], [Size20],
        [Size21], [Size22], [Size23], [Size24], [Size25], [Size26], [Size27], [Size28], [Size29], [Size30],
        [Size31], [Size32], [Size33], [Size34], [Size35], [Size36], [Size37], [Size38], [Size39], [Size40]
      FROM [DTrade_CONN].[dbo].[vTx_JobSizeSpec_Fty]
      ORDER BY [JobNo], [Seq]
    `;
    const sizeSpecResult = await request.query(sizeSpecQuery);

    // 5. Fetch Cut Quantity data from FC_SYSTEM
    // console.log("✂️ Fetching cut quantity data from FC_SYSTEM...");
    const cutQtyQuery = `
      SELECT 
        [BuyerStyle], [StyleNo], [ColorCode], [ChColor], [EngColor], [SIZE],
        SUM(CAST([PlanQty] AS INT)) as TotalPlanQty, 
        SUM(CAST([CutQty] AS INT)) as TotalCutQty
      FROM [FC_SYSTEM].[dbo].[ViewOrderPlanQty]
      WHERE [StyleNo] IS NOT NULL 
        AND [ColorCode] IS NOT NULL 
        AND [SIZE] IS NOT NULL
        AND [PlanQty] IS NOT NULL 
        AND [CutQty] IS NOT NULL
      GROUP BY [BuyerStyle], [StyleNo], [ColorCode], [ChColor], [EngColor], [SIZE]
      ORDER BY [StyleNo], [ColorCode], [SIZE]
    `;
    const cutQtyResult = await requestFC.query(cutQtyQuery);

    // Create size mapping from database for each order
    const orderSizeMapping = new Map();
    sizeNamesResult.recordset.forEach(sizeRecord => {
      const orderNo = sizeRecord.Order_No;
      const sizeMapping = {};
      
      // Map size sequences to actual size names from database
      const sizeColumns = [
        '10', '20', '30', '40', '50', '60', '70', '80', '90', '100',
        '110', '120', '130', '140', '150', '160', '170', '180', '190', '200',
        '210', '220', '230', '240', '250', '260', '270', '280', '290', '300',
        '310', '320', '330', '340', '350', '360', '370', '380', '390', '400'
      ];
      sizeColumns.forEach(seq => {
        const sizeNameColumn = `Size_${seq}_Name`;
        if (sizeRecord[sizeNameColumn] && sizeRecord[sizeNameColumn] !== null) {
          // Use the actual size name from database (like "34B", "34C", etc.)
          sizeMapping[seq] = sizeRecord[sizeNameColumn].toString();
        }
      });
      orderSizeMapping.set(orderNo, sizeMapping);
    });

    // Process Cut Quantity data and create mapping
    // console.log("🔄 Processing cut quantity data...");
    const cutQtyMapping = new Map();
    cutQtyResult.recordset.forEach(record => {
      const styleNo = record.StyleNo;        // This should match Order_No in MongoDB
      const colorCode = record.ColorCode;    // This should match ColorCode in MongoDB
      const size = record.SIZE;              // Size like "XS", "S", "M", etc.
      const planQty = Number(record.TotalPlanQty) || 0;
      const cutQty = Number(record.TotalCutQty) || 0;
      
      // Create mapping key: StyleNo_ColorCode
      const key = `${styleNo}_${colorCode}`;
      
      if (!cutQtyMapping.has(key)) {
        cutQtyMapping.set(key, {});
      }
      
      const colorCutData = cutQtyMapping.get(key);
      
      // Set the aggregated quantities for this size
      colorCutData[size] = {
        PlanCutQty: planQty,
        ActualCutQty: cutQty
      };
    });

    // Helper Functions (keeping all existing helper functions)
    function extractSizeDataAsObject(record, prefix = 'Size_Seq', orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const sizeObject = {};
      
      // Use all possible size columns
      const allSizeColumns = [
        '10', '20', '30', '40', '50', '60', '70', '80', '90', '100',
        '110', '120', '130', '140', '150', '160', '170', '180', '190', '200',
        '210', '220', '230', '240', '250', '260', '270', '280', '290', '300',
        '310', '320', '330', '340', '350', '360', '370', '380', '390', '400'
      ];
      allSizeColumns.forEach(seq => {
        const columnName = `${prefix}${seq}`;
        if (record[columnName] && record[columnName] !== null && record[columnName] !== 0) {
          // Use the actual size name from database mapping
          const sizeName = sizeMapping[seq] || `Size${seq}`;
          sizeObject[sizeName] = Number(record[columnName]);
        }
      });
      return sizeObject;
    }

    function convertSizeObjectToArray(sizeObject, orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      
      // Create reverse mapping: sizeName -> sequence number
      const sizeToSeqMapping = {};
      Object.entries(sizeMapping).forEach(([seq, sizeName]) => {
        sizeToSeqMapping[sizeName] = parseInt(seq);
      });
      
      // Convert and sort by sequence number instead of alphabetically
      return Object.entries(sizeObject)
        .sort(([sizeNameA], [sizeNameB]) => {
          const seqA = sizeToSeqMapping[sizeNameA] || 999;
          const seqB = sizeToSeqMapping[sizeNameB] || 999;
          return seqA - seqB;
        })
        .map(([sizeName, qty]) => {
          const obj = {};
          obj[sizeName] = qty;
          return obj;
        });
    }

    function parseToleranceValue(toleranceStr) {
  if (!toleranceStr) return { fraction: '', decimal: 0 };
  
  let str = toleranceStr.toString().trim();
  let decimal = 0;
  
  // Clean up the string - remove extra quotes and spaces
  str = str.replace(/['"]/g, '').trim();
  
  // Replace all types of fraction slashes with regular slash
  str = str.replace(/[⁄∕／]/g, '/'); // Unicode: U+2044, U+2215, U+FF0F
  
  // Handle negative values
  let isNegative = false;
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1);
  }
  
  try {
    // Handle mixed numbers with various separators
    // Match patterns like: "12 3/4", "12-3/4", "12　3/4" (with different spaces)
    const mixedNumberPattern = /^(\d+(?:\.\d+)?)\s*[-\s　]\s*(\d+)\s*\/\s*(\d+)$/;
    const mixedMatch = str.match(mixedNumberPattern);
    
    if (mixedMatch) {
      const wholePart = parseFloat(mixedMatch[1]) || 0;
      const numerator = parseFloat(mixedMatch[2]) || 0;
      const denominator = parseFloat(mixedMatch[3]) || 1;
      decimal = wholePart + (numerator / denominator);
    }
    // Handle simple fractions like "3/4"
    else if (str.includes('/')) {
      const fractionPattern = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
      const fractionMatch = str.match(fractionPattern);
      
      if (fractionMatch) {
        const numerator = parseFloat(fractionMatch[1]) || 0;
        const denominator = parseFloat(fractionMatch[2]) || 1;
        decimal = numerator / denominator;
      } else {
        // Fallback: split by / and try to parse
        const parts = str.split('/');
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0].trim()) || 0;
          const denominator = parseFloat(parts[1].trim()) || 1;
          decimal = numerator / denominator;
        } else {
          decimal = parseFloat(str) || 0;
        }
      }
    }
    // Handle whole numbers or decimals
    else {
      decimal = parseFloat(str) || 0;
    }
    
    // Apply negative sign if needed
    if (isNegative) {
      decimal = -decimal;
    }
    
  } catch (error) {
    console.error(`Error parsing tolerance value "${toleranceStr}":`, error);
    // Fallback: try to extract any numbers and make a reasonable guess
    const numbers = str.match(/\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 1) {
      decimal = parseFloat(numbers[0]) || 0;
    } else {
      decimal = 0;
    }
  }
  
  // Ensure decimal is a valid number
  if (isNaN(decimal)) {
    decimal = 0;
  }
  
  return {
    fraction: toleranceStr.toString(),
    decimal: Math.round(decimal * 10000) / 10000 // Round to 4 decimal places
  };
}

// Enhanced extractSpecsDataAsArray function
function extractSpecsDataAsArray(record, orderNo) {
  const sizeMapping = orderSizeMapping.get(orderNo) || {};
  const specsArray = [];
  
  for (let i = 1; i <= 40; i++) {
    const sizeColumn = `Size${i}`;
    if (record[sizeColumn] && record[sizeColumn] !== null) {
      const value = record[sizeColumn].toString().trim();
      const seqNumber = (i * 10).toString();
      // Use actual size name from database mapping
      const sizeName = sizeMapping[seqNumber] || `Size${i}`;
      
      // Convert fraction to decimal using the enhanced parsing
      let decimal = 0;
      try {
        // Replace all types of fraction slashes with regular slash
        let cleanValue = value.replace(/[⁄∕／]/g, '/');
        
        // Handle mixed numbers with various separators
        const mixedNumberPattern = /^(\d+(?:\.\d+)?)\s*[-\s　]\s*(\d+)\s*\/\s*(\d+)$/;
        const mixedMatch = cleanValue.match(mixedNumberPattern);
        
        if (mixedMatch) {
          const wholePart = parseFloat(mixedMatch[1]) || 0;
          const numerator = parseFloat(mixedMatch[2]) || 0;
          const denominator = parseFloat(mixedMatch[3]) || 1;
          decimal = wholePart + (numerator / denominator);
        }
        // Handle simple fractions like "3/4"
        else if (cleanValue.includes('/')) {
          const fractionPattern = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
          const fractionMatch = cleanValue.match(fractionPattern);
          
          if (fractionMatch) {
            const numerator = parseFloat(fractionMatch[1]) || 0;
            const denominator = parseFloat(fractionMatch[2]) || 1;
            decimal = numerator / denominator;
          } else {
            // Fallback: split by / and try to parse
            const parts = cleanValue.split('/');
            if (parts.length === 2) {
              const numerator = parseFloat(parts[0].trim()) || 0;
              const denominator = parseFloat(parts[1].trim()) || 1;
              decimal = numerator / denominator;
            } else {
              decimal = parseFloat(cleanValue) || 0;
            }
          }
        }
        // Handle whole numbers or decimals
        else {
          decimal = parseFloat(cleanValue) || 0;
        }
      } catch (error) {
        console.error(`Error parsing spec value "${value}":`, error);
        // Fallback: try to extract any numbers and make a reasonable guess
        const numbers = value.match(/\d+(?:\.\d+)?/g);
        if (numbers && numbers.length >= 1) {
          decimal = parseFloat(numbers[0]) || 0;
        } else {
          decimal = 0;
        }
      }
      
      // Ensure decimal is a valid number
      if (isNaN(decimal)) {
        decimal = 0;
      }
      
      const specObject = {};
      specObject[sizeName] = {
        fraction: value,
        decimal: Math.round(decimal * 10000) / 10000 // Round to 4 decimal places
      };
      specsArray.push(specObject);
    }
  }
  return specsArray;
}

    function isEmptyOrContainsNumbers(value) {
      if (!value || value === null || value === undefined || value === '') {
        return true;
      }
      
      const str = value.toString().trim();
      if (str === '') {
        return true;
      }
      
      // Check if string contains any numbers (0-9)
      return /^\d+$/.test(str);
    }

    // Helper function to convert empty strings to null
    function convertEmptyToNull(value) {
      if (!value || value === null || value === undefined || value === '') {
        return null;
      }
      
      const str = value.toString().trim();
      return str === '' ? null : str;
    }

    // Process Data
    // console.log("🔄 Processing and organizing data...");
    const orderMap = new Map();

    // 1. Process Order Headers
    orderHeaderResult.recordset.forEach(header => {
      const orderNo = header.Order_No;
      if (!orderMap.has(orderNo)) {
        const sizeData = extractSizeDataAsObject(header, 'Size_Seq', orderNo);
        
        orderMap.set(orderNo, {
          SC_Heading: convertEmptyToNull(header.SC_Heading),
          Factory: convertEmptyToNull(header.Factory),
          SalesTeamName: convertEmptyToNull(header.SalesTeamName),
          Cust_Code: convertEmptyToNull(header.Cust_Code),
          ShortName: convertEmptyToNull(header.ShortName),
          EngName: convertEmptyToNull(header.EngName),
          Order_No: header.Order_No,
          Ccy: convertEmptyToNull(header.Ccy),
          Style: convertEmptyToNull(header.Style),
          CustStyle: convertEmptyToNull(header.CustStyle),
          TotalQty: Number(header.OrderQuantity) || 0,
          NoOfSize: Object.keys(sizeData).length,
          OrderColors: [],
          OrderColorShip: [],
          SizeSpec: []
        });
      }
    });

    // 2. Process Order Colors and Shipping
    const colorSummaryMap = new Map();
    const shipMap = new Map();
    orderColorsResult.recordset.forEach(record => {
      const orderNo = record.Order_No;
      const colorCode = record.ColorCode;
      const shipSeqNo = record.ship_seq_no;
      const shipId = record.Ship_ID; // Added Ship_ID
      
      if (orderMap.has(orderNo)) {
        const order = orderMap.get(orderNo);
        
        // Update order details from shipping data
        order.Mode = convertEmptyToNull(record.Mode);
        order.Country = convertEmptyToNull(record.Country);
        order.Origin = convertEmptyToNull(record.Origin);
        order.CustPORef = convertEmptyToNull(record.CustPORef);

        // Sum quantities for OrderColors
        const colorKey = `${orderNo}_${colorCode}`;
        if (!colorSummaryMap.has(colorKey)) {
          colorSummaryMap.set(colorKey, {
            ColorCode: record.ColorCode,
            Color: record.Color,
            ChnColor: record.ChnColor,
            ColorKey: Number(record.Color_Seq) || 0,
            sizeTotals: {}
          });
        }

        const colorSummary = colorSummaryMap.get(colorKey);
        const sizes = extractSizeDataAsObject(record, 'Size_Seq', orderNo);
        
        // Sum up quantities for each size
        Object.entries(sizes).forEach(([sizeName, qty]) => {
          if (!colorSummary.sizeTotals[sizeName]) {
            colorSummary.sizeTotals[sizeName] = 0;
          }
          colorSummary.sizeTotals[sizeName] += qty;
        });

        // Process OrderColorShip WITH Ship_ID
        const shipKey = `${orderNo}_${colorCode}`;
        if (!shipMap.has(shipKey)) {
          shipMap.set(shipKey, {
            ColorCode: record.ColorCode,
            Color: record.Color,
            ChnColor: record.ChnColor,
            ColorKey: Number(record.Color_Seq) || 0,
            ShipSeqNo: []
          });
        }

        const shipRecord = shipMap.get(shipKey);
        const existingSeq = shipRecord.ShipSeqNo.find(seq => seq.seqNo === shipSeqNo);
        if (!existingSeq && shipSeqNo) {
          // Convert sizes object to array format like OrderQty
          const sizesArray = convertSizeObjectToArray(sizes, orderNo);
          
          shipRecord.ShipSeqNo.push({
            seqNo: Number(shipSeqNo),
            Ship_ID: convertEmptyToNull(shipId), // Added Ship_ID here
            sizes: sizesArray  // Now this will be in format [{"XS": 44}, {"S": 130}, ...]
          });
        }
      }
    });

    // Convert color summaries to the desired format
    const colorMap = new Map();
    for (const [colorKey, colorSummary] of colorSummaryMap) {
      const orderNo = colorKey.split('_')[0]; // Extract order number from colorKey
      const orderQtyArray = convertSizeObjectToArray(colorSummary.sizeTotals, orderNo); // Pass orderNo
      
      colorMap.set(colorKey, {
        ColorCode: colorSummary.ColorCode,
        Color: colorSummary.Color,
        ChnColor: colorSummary.ChnColor,
        ColorKey: colorSummary.ColorKey,
        OrderQty: orderQtyArray, 
        CutQty: {} // Will be populated with cut quantity data
      });
    }

    // Add cut quantity data to colors
    // console.log("🔄 Mapping cut quantity data to orders...");
    let cutQtyMatchCount = 0;
    let totalColorProcessed = 0;
    
    for (const [orderNo, order] of orderMap) {
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + '_')) {
          totalColorProcessed++;
          const colorCode = colorData.ColorCode;
          
          // Create the mapping key: Order_No_ColorCode
          const cutKey = `${orderNo}_${colorCode}`;
          
          if (cutQtyMapping.has(cutKey)) {
            const cutData = cutQtyMapping.get(cutKey);
            
            // Clear existing CutQty data and set new data
            colorData.CutQty = {};
            
            // Set the cut data for each size
            Object.entries(cutData).forEach(([size, quantities]) => {
              colorData.CutQty[size] = {
                ActualCutQty: quantities.ActualCutQty,
                PlanCutQty: quantities.PlanCutQty
              };
            });
            
            cutQtyMatchCount++;
          }
        }
      }
    }

    // console.log(`📊 Cut quantity matching results:`);
    
    // Verify CutQty data is actually in the colorData objects
    // console.log("🔍 Verifying CutQty data in colorMap...");
    let colorsWithCutQty = 0;
    for (const [colorKey, colorData] of colorMap) {
      if (Object.keys(colorData.CutQty).length > 0) {
        colorsWithCutQty++;
    //     if (colorsWithCutQty <= 3) { // Log first 3 examples
    //       console.log(`✅ Color ${colorKey} has CutQty:`, colorData.CutQty);
        }
      }
    // }

    // Add colors and shipping to orders
    for (const [orderNo, order] of orderMap) {
      // Add OrderColors
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + '_')) {
          order.OrderColors.push(colorData);
        }
      }

      // Add OrderColorShip
      for (const [shipKey, shipData] of shipMap) {
        if (shipKey.startsWith(orderNo + '_')) {
                   order.OrderColorShip.push(shipData);
        }
      }
    }

    // 3. Process Size Specifications (keeping existing logic)
    sizeSpecResult.recordset.forEach(spec => {
      const jobNo = spec.JobNo;
      
      if (orderMap.has(jobNo)) {
        const order = orderMap.get(jobNo);
        
        try {
          // Use the fixed parseToleranceValue function
          const toleranceMinus = parseToleranceValue(spec.Tolerance);
          const tolerancePlus = parseToleranceValue(spec.Tolerance2);
          const specs = extractSpecsDataAsArray(spec, jobNo);
          
          // Handle ChineseName logic - DEFINE THE VARIABLES FIRST
          const chineseArea = convertEmptyToNull(spec.ChineseArea);
          const chineseRemark = convertEmptyToNull(spec.ChineseRemark);
          let chineseName = null;
          
          // If ChineseArea is null/empty/only numbers, use ChineseRemark
          if (isEmptyOrContainsNumbers(spec.ChineseArea)) {
            chineseName = chineseRemark;
          }
          // If ChineseRemark is null/empty/only numbers, use ChineseArea
          else if (isEmptyOrContainsNumbers(spec.ChineseRemark)) {
            chineseName = chineseArea;
          }
          // If both are valid, prefer ChineseArea
          else {
            chineseName = chineseArea;
          }
          
          const sizeSpecData = {
            Seq: Number(spec.Seq) || 0,
            AtoZ: convertEmptyToNull(spec.AtoZ),
            Area: convertEmptyToNull(spec.Area),
            ChineseArea: chineseArea,
            EnglishRemark: convertEmptyToNull(spec.EnglishRemark),
            ChineseRemark: chineseRemark,
            ChineseName: chineseName,
            AreaCode: convertEmptyToNull(spec.AreaCode),
            IsMiddleCalc: spec.IsMiddleCalc || null,
            ToleranceMinus: {
              fraction: toleranceMinus.fraction || '',
              decimal: toleranceMinus.decimal
            },
            TolerancePlus: {
              fraction: tolerancePlus.fraction || '',
              decimal: tolerancePlus.decimal
            },
            SpecMemo: convertEmptyToNull(spec.SpecMemo),
            SizeSpecMeasUnit: convertEmptyToNull(spec.SizeSpecMeasUnit),
            Specs: specs || []
          };
          
          order.SizeSpec.push(sizeSpecData);
          
        } catch (error) {
          console.error(`Error processing spec for job ${jobNo}, seq ${spec.Seq}:`, error.message); 
        }
      }
    });

    // 4. Save to MongoDB
    console.log("💾 Saving to MongoDB...");
    const finalDocs = Array.from(orderMap.values());
    
    // Clean and validate data before saving
    const cleanedDocs = finalDocs.map(doc => {
      if (doc.SizeSpec) {
        doc.SizeSpec = doc.SizeSpec.filter(spec => {
          return spec.Seq && !isNaN(spec.Seq) && 
                !isNaN(spec.ToleranceMinus.decimal) && 
                !isNaN(spec.TolerancePlus.decimal);
        });
      }
      return doc;
    });

    const bulkOps = cleanedDocs.map(doc => ({
      updateOne: {
        filter: { Order_No: doc.Order_No },
        update: { $set: doc },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      try {
        const result = await DtOrder.bulkWrite(bulkOps);
        
        console.log("✅ DT Orders data migration completed successfully!");
        
        return {
          success: true,
          totalOrders: finalDocs.length,
          // matched: result.matchedCount,
          // upserted: result.upsertedCount,
          modified: result.modifiedCount,
          cutQtyRecords: cutQtyResult.recordset.length,
          cutQtyMatchCount: cutQtyMatchCount,
          colorsWithCutQty: colorsWithCutQty
        };
        
      } catch (bulkError) {
        console.error("❌ Bulk operation failed:", bulkError);
        throw bulkError;
      }
    } else {
      console.log("⚠️ No data to sync");
      return { success: true, message: "No data to sync" };
    }

  } catch (error) {
    console.error("❌ DT Orders sync failed:", error);
    throw error;
  }
}

// Add API endpoint for manual sync
app.get("/api/sync-dt-orders", async (req, res) => {
  try {
    const result = await syncDTOrdersData();
    res.json({
      success: true,
      message: "DT Orders data sync completed successfully",
      data: result
    });
  } catch (error) {
    console.error("DT Orders sync API error:", error);
    res.status(500).json({
      success: false,
      message: "DT Orders data sync failed",
      error: error.message
    });
  }
});

// // Initial sync on server start (uncomment when ready)
// syncDTOrdersData()
//   .then((result) => {
//     console.log("✅ Initial DT Orders Data Sync completed:", result);
//   })
//   .catch((err) => {
//     console.error("❌ Initial DT Orders Data Sync failed:", err);
//   });

// Schedule to run every day at 2:00 AM
  cron.schedule("0 */2 * * *", () => {
  syncDTOrdersData()
    .then((result) => {
      console.log("✅ DT Orders Data Sync completed ", result);
    })
    .catch((err) => {
      console.error("❌ DT Orders Data Sync failed", err);
    });
});

// Update your initialization to include DTrade connection
// initializeConnections();
// 
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
   Inline Orders Endpoints
------------------------------ */

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
   Graceful Shutdown
------------------------------ */

process.on("SIGINT", async () => {
  try {
    await poolYMDataStore.close();
    await poolYMCE.close();
    await poolYMWHSYS2.close();
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
   Helper Function to Convert Date to MM/DD/YYYY
------------------------------ */

// Helper function to normalize date strings (ensure MM/DD/YYYY format)
const normalizeDateString = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    console.error("Error normalizing date string:", dateStr, e);
    // If parsing fails, try to return as is or handle error appropriately
    // For this use case, if it's already MM/DD/YYYY, it might be fine
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      // Attempt to reformat if it looks like YYYY-MM-DD or DD-MM-YYYY
      if (parts[0].length === 4) return `${parts[1]}/${parts[2]}/${parts[0]}`; // YYYY/MM/DD -> MM/DD/YYYY
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`; // DD/MM/YYYY -> MM/DD/YYYY
      if (parts[3].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`; // MM/DD/YYYY -> MM/DD/YYYY
    }
    return dateStr; // Fallback
  }
};

/* ------------------------------
   End Points - SewingDefects
------------------------------ */
app.get("/api/sewing-defects", async (req, res) => {
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

// Endpoint to search users by emp_id or name (partial match)
app.get("/api/users/search-by-empid", async (req, res) => {
  try {
    const searchTerm = req.query.term;

    if (!searchTerm || searchTerm.trim() === "") {
      return res
        .status(400)
        .json({ error: "Search term is required and cannot be empty." });
    }

    const trimmedSearchTerm = searchTerm.trim();
    const escapedSearchTerm = escapeRegex(trimmedSearchTerm);

    const query = {
      $or: [
        { emp_id: trimmedSearchTerm }, // Try exact match first
        { emp_id: { $regex: escapedSearchTerm, $options: "i" } },
        { eng_name: { $regex: escapedSearchTerm, $options: "i" } }
      ]
    };

    const users = await UserMain.find(
      query,
      "emp_id eng_name face_photo" 
    )
      .limit(10) // Limit results
      .lean();

    res.json(users); 
  } catch (error) {
    console.error(
      "[API /api/users/search-by-empid] Error searching users:",
      error
    );
    res.status(500).json({ error: "Failed to search users" });
  }
});

/* ------------------------------
   Helper function for buyer mapping
------------------------------ */

// Helper function to get buyer name from buyer code

const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";

  // Check for the more specific "COM" first to correctly identify MWW
  if (moNo.includes("COM")) return "MWW";

  // Then, check for the more general "CO" for Costco
  if (moNo.includes("CO")) return "Costco";

  // The rest of the original rules
  if (moNo.includes("AR")) return "Aritzia";
  if (moNo.includes("RT")) return "Reitmans";
  if (moNo.includes("AF")) return "ANF";
  if (moNo.includes("NT")) return "STORI";

  // Default case if no other rules match
  return "Other";
};

/* =============================================================================
   End Points - Sub-Con Factories
   ============================================================================= */

// GET - Fetch all sub-con factories
app.get("/api/subcon-factories", async (req, res) => {
  try {
    const factories = await SubconFactory.find({}).sort({ no: 1 }).lean();
    res.json(factories);
  } catch (error) {
    console.error("Error fetching sub-con factories:", error);
    res.status(500).json({ message: "Server error fetching factories" });
  }
});

// POST - Add a new sub-con factory
app.post("/api/subcon-factories", async (req, res) => {
  try {
    const { no, factory } = req.body;

    if (no === undefined || no === null || !factory) {
      return res
        .status(400)
        .json({ message: "Factory No and Name are required." });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Factory No must be a positive number." });
    }

    const existingFactoryByNo = await SubconFactory.findOne({ no: Number(no) });
    if (existingFactoryByNo) {
      return res
        .status(409)
        .json({ message: `Factory No '${no}' already exists.` });
    }

    const existingFactoryByName = await SubconFactory.findOne({ factory });
    if (existingFactoryByName) {
      return res
        .status(409)
        .json({ message: `Factory name '${factory}' already exists.` });
    }

    const newFactory = new SubconFactory({
      no: Number(no),
      factory
    });
    await newFactory.save();

    res.status(201).json({
      message: "Sub-con factory added successfully",
      factory: newFactory
    });
  } catch (error) {
    console.error("Error adding sub-con factory:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Factory No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add sub-con factory", error: error.message });
  }
});

// PUT - Update an existing sub-con factory by ID
app.put("/api/subcon-factories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { no, factory } = req.body;

    if (no === undefined || no === null || !factory) {
      return res
        .status(400)
        .json({ message: "Factory No and Name are required for update." });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Factory No must be a positive number." });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid factory ID format." });
    }

    // Check for duplicates, excluding the current document being updated
    const existingFactoryByNo = await SubconFactory.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingFactoryByNo) {
      return res.status(409).json({
        message: `Factory No '${no}' already exists for another factory.`
      });
    }

    const existingFactoryByName = await SubconFactory.findOne({
      factory,
      _id: { $ne: id }
    });
    if (existingFactoryByName) {
      return res.status(409).json({
        message: `Factory name '${factory}' already exists for another factory.`
      });
    }

    const updatedFactory = await SubconFactory.findByIdAndUpdate(
      id,
      { no: Number(no), factory },
      { new: true, runValidators: true }
    );

    if (!updatedFactory) {
      return res.status(404).json({ message: "Sub-con factory not found." });
    }

    res.status(200).json({
      message: "Sub-con factory updated successfully",
      factory: updatedFactory
    });
  } catch (error) {
    console.error("Error updating sub-con factory:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Update failed due to duplicate Factory No or Name."
      });
    }
    res.status(500).json({
      message: "Failed to update sub-con factory",
      error: error.message
    });
  }
});

// DELETE - Delete a sub-con factory by ID
app.delete("/api/subcon-factories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid factory ID format." });
    }

    const deletedFactory = await SubconFactory.findByIdAndDelete(id);
    if (!deletedFactory) {
      return res.status(404).json({ message: "Sub-con factory not found." });
    }

    res.status(200).json({ message: "Sub-con factory deleted successfully" });
  } catch (error) {
    console.error("Error deleting sub-con factory:", error);
    res.status(500).json({
      message: "Failed to delete sub-con factory",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - QC2 Defects
------------------------------ */

// GET - Fetch all QC2 defects
app.get("/api/qc2-defects", async (req, res) => {
  try {
    const defects = await QC2Defects.find({}).sort({ code: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QC2 defects:", error);
    res.status(500).json({ message: "Server error fetching defects" });
  }
});

// POST - Add a new QC2 defect
app.post("/api/qc2-defects", async (req, res) => {
  try {
    const { code, defectLetter, english, khmer } = req.body;
    if (code === undefined || !defectLetter || !english || !khmer) {
      return res.status(400).json({
        message: "Code, Defect Letter, English & Khmer names are required."
      });
    }
    const existingByCode = await QC2Defects.findOne({ code });
    if (existingByCode) {
      return res
        .status(409)
        .json({ message: `Defect code '${code}' already exists.` });
    }
    const newDefect = new QC2Defects(req.body);
    await newDefect.save();
    res
      .status(201)
      .json({ message: "QC2 defect added successfully", defect: newDefect });
  } catch (error) {
    console.error("Error adding QC2 defect:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate entry. Defect code or name might exist." });
    res
      .status(500)
      .json({ message: "Failed to add QC2 defect", error: error.message });
  }
});

// PUT - Update an existing QC2 defect by ID
app.put("/api/qc2-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }
    const updatedDefect = await QC2Defects.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedDefect) {
      return res.status(404).json({ message: "QC2 Defect not found." });
    }
    res.status(200).json({
      message: "QC2 defect updated successfully",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error updating QC2 defect:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate code or name." });
    res
      .status(500)
      .json({ message: "Failed to update QC2 defect", error: error.message });
  }
});

// DELETE - Delete a QC2 defect by ID
app.delete("/api/qc2-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }
    const defect = await QC2Defects.findById(id);
    if (!defect) {
      return res.status(404).json({ message: "QC2 Defect not found." });
    }
    // Delete associated image file before deleting the record
    if (defect.image) {
      const imagePath = path.join(
        "storage",
        defect.image.replace("/storage/", "")
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await QC2Defects.findByIdAndDelete(id);
    res.status(200).json({
      message: "QC2 defect and associated image deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting QC2 defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete QC2 defect", error: error.message });
  }
});

// =================================================================
// MULTER CONFIGURATION (Memory Storage Pattern)
// =================================================================

// Use memoryStorage to handle the file as a buffer in memory first.
const qc2MemoryStorage = multer.memoryStorage();

// Configure multer with memory storage, file filter, and limits.
const uploadQc2Image = multer({
  storage: qc2MemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  }
});




/* ----------------------------------------------------
   End Points - QC2 Defects Image Management (New Pattern)
---------------------------------------------------- */

// ENDPOINT 1: UPLOAD A NEW IMAGE (Generic)
// Use this when creating a NEW defect. The frontend uploads the image first,
// gets the URL back, then includes that URL in the POST request to create the defect.
app.post(
  "/api/qc2-defects/upload-image",
  uploadQc2Image.single("defectImage"), // "defectImage" is the form field name
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file provided." });
      }

      const uploadPath = path.join(
        __dirname,
        "public",
        "storage",
        "qc2_images"
      );
      //await fs.promises.mkdir(uploadPath, { recursive: true });

      const fileExtension = path.extname(req.file.originalname);
      const newFilename = `qc2-defect-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${fileExtension}`;

      const fullFilePath = path.join(uploadPath, newFilename);
      await fs.promises.writeFile(fullFilePath, req.file.buffer);

      // Return the relative URL path for the database
      const relativeUrl = `/storage/qc2_images/${newFilename}`;

      res.status(200).json({ success: true, url: relativeUrl });
    } catch (error) {
      console.error("Error in /api/qc2-defects/upload-image:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error during image upload." });
    }
  }
);

// ENDPOINT 2: REPLACE IMAGE FOR AN EXISTING DEFECT
// Use this to upload a new image for a defect that already exists.
app.put( "/api/qc2-defects/:id/image",
  uploadQc2Image.single("defectImage"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No new image file provided." });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid defect ID." });
      }

      const defect = await QC2Defects.findById(id);
      if (!defect) {
        return res
          .status(404)
          .json({ success: false, message: "Defect not found." });
      }

      // --- Delete the old image file if it exists ---
      if (defect.image) {
        const oldImagePath = path.join(__dirname, "public", defect.image);
        if (fs.existsSync(oldImagePath)) {
          await fs.promises.unlink(oldImagePath);
        }
      }

      // --- Save the new image file ---
      const uploadPath = path.join(
        __dirname,
        "public",
        "storage",
        "qc2_images"
      );
      const fileExtension = path.extname(req.file.originalname);
      const newFilename = `qc2-defect-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${fileExtension}`;
      const fullFilePath = path.join(uploadPath, newFilename);
      await fs.promises.writeFile(fullFilePath, req.file.buffer);

      // --- Update the database with the new path ---
      const newRelativeUrl = `/storage/qc2_images/${newFilename}`;
      defect.image = newRelativeUrl;
      const updatedDefect = await defect.save();

      res.status(200).json({
        success: true,
        message: "Image replaced successfully.",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error replacing defect image:", error);
      res.status(500).json({
        success: false,
        message: "Server error while replacing image."
      });
    }
  }
);

// ENDPOINT 3: DELETE IMAGE FROM AN EXISTING DEFECT
// Use this to remove an image without uploading a new one.
app.delete("/api/qc2-defects/:id/image", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid defect ID." });
    }

    const defect = await QC2Defects.findById(id);
    if (!defect) {
      return res
        .status(404)
        .json({ success: false, message: "Defect not found." });
    }

    if (!defect.image) {
      return res
        .status(200)
        .json({ success: true, message: "No image to delete." });
    }

    // --- Delete the image file from the filesystem ---
    const imagePath = path.join(__dirname, "public", defect.image);
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }

    // --- Update the database to remove the image path ---
    defect.image = ""; // Set to empty string or null
    const updatedDefect = await defect.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error deleting defect image:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting image." });
  }
});

/* -------------------------------------
   NEW End Point - QC2 Defect Categories
------------------------------------- */

// GET - Fetch all unique QC2 defect categories
app.get("/api/qc2-defect-categories", async (req, res) => {
  try {
    // Use the distinct() method to get a unique list of values from the specified field
    const categories = await QC2Defects.distinct("categoryEnglish");

    // The result is an array of strings, e.g., ["Fabric", "Workmanship", ...]
    // We sort them alphabetically for a consistent order in the UI.
    res.json(categories.sort());
  } catch (error) {
    console.error("Error fetching QC2 defect categories:", error);
    res
      .status(500)
      .json({ message: "Server error fetching defect categories" });
  }
});

/* ------------------------------
   IE - Task No Allocation Endpoints
------------------------------ */

// GET - Fetch all tasks with filtering
// server.js

// UPDATED - GET - Fetch all tasks with filtering AND pagination
app.post("/api/ie/tasks", async (req, res) => {
  try {
    const {
      department,
      productType,
      processName,
      taskNo,
      page = 1,
      limit = 10
    } = req.body;
    const filter = {};

    if (department) filter.department = department;
    if (productType) filter.productType = productType;
    if (processName)
      filter.processName = { $regex: new RegExp(processName, "i") };
    if (taskNo) filter.taskNo = Number(taskNo);

    const skip = (page - 1) * limit;

    const tasks = await QC2Task.find(filter)
      .sort({ record_no: 1 })
      .skip(skip)
      .limit(limit);

    const totalTasks = await QC2Task.countDocuments(filter);

    res.json({
      tasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching IE tasks:", error);
    res.status(500).json({ message: "Server error fetching tasks." });
  }
});

// GET - Fetch distinct values for filters
app.get("/api/ie/tasks/filter-options", async (req, res) => {
  try {
    const [departments, productTypes, processNames] = await Promise.all([
      QC2Task.distinct("department"),
      QC2Task.distinct("productType"),
      QC2Task.distinct("processName")
    ]);
    res.json({
      departments: departments.sort(),
      productTypes: productTypes.sort(),
      processNames: processNames.sort()
    });
  } catch (error) {
    console.error("Error fetching task filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options." });
  }
});

// PUT - Update a task by its ID
app.put("/api/ie/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { taskNo } = req.body;

    if (taskNo === undefined || isNaN(Number(taskNo))) {
      return res.status(400).json({ message: "A valid Task No is required." });
    }

    const updatedTask = await QC2Task.findByIdAndUpdate(
      id,
      { taskNo: Number(taskNo) },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error updating task." });
  }
});

// DELETE - Delete a task by its ID
app.delete("/api/ie/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await QC2Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error deleting task." });
  }
});

/* ------------------------------
   End Points - dt_orders
------------------------------ */

// Update the MONo search endpoint to handle partial matching
app.get("/api/search-mono", async (req, res) => {
  try {
    const term = req.query.term; // Changed from 'digits' to 'term'
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const collection = ymProdConnection.db.collection("dt_orders");

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
    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono
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
          sizes: new Map()
        });
      }

      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];
        const cleanSize = sizeName.split(";")[0].trim();

        if (quantity > 0) {
          colorMap.get(colorKey).sizes.set(cleanSize, {
            orderQty: quantity,
            planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
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
        key: c.colorKey
      })),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = {
          sizes: Array.from(curr.sizes.keys()),
          details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
            size,
            orderQty: data.orderQty,
            planCutQty: data.planCutQty
          }))
        };
        return acc;
      }, {})
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
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
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
          total: { $sum: "$totalBundleQty" } // Correct sum using field reference with $
        }
      }
    ]);
    res.json({ total: total[0]?.total || 0 }); // Return the summed total or 0 if no documents
  } catch (error) {
    console.error("Error fetching total bundle quantity:", error);
    res.status(500).json({ error: "Failed to fetch total bundle quantity" });
  }
});

// Endpoint to get total garments count for a specific MONo, Color, Size, and Type
app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
  try {
    const { mono, color, size } = req.params;
    const { type } = req.query; // Get type from query string, e.g., ?type=end

    // Validate type parameter
    if (!type || !["end", "repack"].includes(type)) {
      return res
        .status(400)
        .json({ message: "A valid type ('end' or 'repack') is required." });
    }

    const totalCount = await QC2OrderData.aggregate([
      // Add the new 'type' field to the match criteria
      { $match: { selectedMono: mono, color: color, size: size, type: type } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" }
        }
      }
    ]);

    res.json({ totalCount: totalCount[0]?.totalCount || 0 });
  } catch (error) {
    console.error("Error fetching total garments count:", error);
    res.status(500).json({ error: "Failed to fetch total garments count" });
  }
});

// // Endpoint to get total garments count for a specific MONo, Color, and Size

// app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
//   try {
//     const { mono, color, size } = req.params;

//     const totalCount = await QC2OrderData.aggregate([
//       { $match: { selectedMono: mono, color: color, size: size } },
//       {
//         $group: {
//           _id: null,
//           totalCount: { $sum: "$count" } // Sum the count field
//         }
//       }
//     ]);

//     res.json({ totalCount: totalCount[0]?.totalCount || 0 }); // Return total count or 0
//   } catch (error) {
//     console.error("Error fetching total garments count:", error);
//     res.status(500).json({ error: "Failed to fetch total garments count" });
//   }
// });

// This endpoint is unused
async function fetchOrderDetails(mono) {
  const collection = ymProdConnection.db.collection("dt_orders");
  const order = await collection.findOne({ Order_No: mono });

  const colorMap = new Map();
  order.OrderColors.forEach((c) => {
    const key = c.Color.toLowerCase().trim();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        originalColor: c.Color.trim(),
        sizes: new Map()
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
    }, {})
  };
}

/* ------------------------------
   End Points - Update dt_orders with Washing Specs
------------------------------ */

app.post("/api/washing-specs/save", async (req, res) => {
  const { moNo, washingSpecsData } = req.body;

  if (!moNo || !washingSpecsData || washingSpecsData.length === 0) {
    return res
      .status(400)
      .json({ message: "Missing MO Number or specs data." });
  }

  try {
   const collection = ymProdConnection.db.collection("dt_orders");
    const orderDocument = await collection.findOne({ Order_No: moNo });
    // const orderDocument = await DtOrder.findOne({ Order_No: moNo });

    if (!orderDocument) {
      return res.status(404).json({
        message: `Order with MO No '${moNo}' not found in dt_orders.`
      });
    }

    // --- DATA TRANSFORMATION LOGIC ---

    const afterWashSpecs = [];
    const beforeWashSpecs = [];

    // Process AfterWashSpecs from the first sheet
    const firstSheetData = washingSpecsData[0];
    if (firstSheetData && firstSheetData.rows) {
      firstSheetData.rows.forEach((row, rowIndex) => {
        const specsArray = [];
        firstSheetData.headers.forEach((header, headerIndex) => {
          const specData = row.specs[header.size]["After Washing"];
          if (specData) {
            specsArray.push({
              index: headerIndex + 1,
              size: header.size,
              // Save BOTH fraction and decimal for the spec value
              fraction: specData.raw,
              decimal: specData.decimal
            });
          }
        });

        afterWashSpecs.push({
          no: rowIndex + 1,
          kValue: "NA",
          MeasurementPointEngName: row["Measurement Point - Eng"],
          MeasurementPointChiName: row["Measurement Point - Chi"],
          // Save the full object for TolMinus and TolPlus
          TolMinus: {
            fraction: row["Tol Minus"].raw,
            decimal: row["Tol Minus"].decimal
          },
          TolPlus: {
            fraction: row["Tol Plus"].raw,
            decimal: row["Tol Plus"].decimal
          },
          Specs: specsArray
        });
      });
    }

    // Process BeforeWashSpecs from ALL sheets
    washingSpecsData.forEach((sheetData) => {
      if (sheetData && sheetData.rows) {
        sheetData.rows.forEach((row, rowIndex) => {
          const specsArray = [];
          sheetData.headers.forEach((header, headerIndex) => {
            const specData = row.specs[header.size]["Before Washing"];
            if (specData) {
              specsArray.push({
                index: headerIndex + 1,
                size: header.size,
                // Save BOTH fraction and decimal for the spec value
                fraction: specData.raw,
                decimal: specData.decimal
              });
            }
          });

          beforeWashSpecs.push({
            no: rowIndex + 1,
            kValue: sheetData.sheetName,
            MeasurementPointEngName: row["Measurement Point - Eng"],
            MeasurementPointChiName: row["Measurement Point - Chi"],
            // Save the full object for TolMinus and TolPlus
            TolMinus: {
              fraction: row["Tol Minus"].raw,
              decimal: row["Tol Minus"].decimal
            },
            TolPlus: {
              fraction: row["Tol Plus"].raw,
              decimal: row["Tol Plus"].decimal
            },
            Specs: specsArray
          });
        });
      }
    });

    // --- UPDATE DATABASE ---
    const updateResult = await collection.updateOne(
      { _id: orderDocument._id },
      {
        $set: {
          AfterWashSpecs: afterWashSpecs,
          BeforeWashSpecs: beforeWashSpecs
        }
      }
    );

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
      return res
        .status(200)
        .json({ message: "Washing specs data is already up to date." });
    }

    res.status(200).json({
      message: `Successfully updated washing specs for MO No '${moNo}'.`
    });
  } catch (error) {
    console.error("Error saving washing specs:", error);
    res.status(500).json({
      message: "An internal server error occurred while saving the data."
    });
  }
});

/* ------------------------------
   End Points - qc2_orderdata
------------------------------ */

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

app.post("/api/save-bundle-data", async (req, res) => {
  try {
    const { bundleData } = req.body;
    if (!bundleData || !Array.isArray(bundleData)) {
      return res.status(400).json({ message: "Invalid bundle data format." });
    }
    const savedRecords = [];

    // Since all bundles in a single generation request are the same, we only need to calculate the starting package_no once.
    const firstBundle = bundleData[0];
    if (!firstBundle.task_no || !firstBundle.type) {
      return res
        .status(400)
        .json({ message: "Task No and Type are required fields." });
    }

    let package_no_counter = 1;

    if (firstBundle.type === "end") {
      const lastEndBundle = await QC2OrderData.findOne({
        selectedMono: firstBundle.selectedMono,
        color: firstBundle.color,
        size: firstBundle.size,
        type: "end"
      }).sort({ package_no: -1 });

      if (lastEndBundle) {
        package_no_counter = lastEndBundle.package_no + 1;
      }
    }

    for (const bundle of bundleData) {
      const randomId = await generateRandomId();
      const now = new Date();
      const updated_date_seperator = now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      });
      const updated_time_seperator = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const newBundle = new QC2OrderData({
        ...bundle,
        package_no: package_no_counter, // Use the calculated package number
        bundle_random_id: randomId,
        bundle_id: `${bundle.date}:${bundle.lineNo}:${bundle.selectedMono}:${bundle.color}:${bundle.size}:${package_no_counter}`,
        updated_date_seperator,
        updated_time_seperator
      });

      await newBundle.save();
      savedRecords.push(newBundle);

      // If type is 'end', increment package_no for the next bundle in the same batch. For 'repack', it stays 1.
      if (bundle.type === "end") {
        package_no_counter++;
      }
    }

    res.status(201).json({
      message: "Bundle data saved successfully",
      data: savedRecords
    });
  } catch (error) {
    console.error("Error saving bundle data:", error);
    res
      .status(500)
      .json({ message: "Failed to save bundle data", error: error.message });
  }
});

// app.post("/api/save-bundle-data", async (req, res) => {
//   try {
//     const { bundleData } = req.body;
//     if (!bundleData || !Array.isArray(bundleData)) {
//       return res.status(400).json({ message: "Invalid bundle data format." });
//     }
//     const savedRecords = [];

//     // Save each bundle record
//     for (const bundle of bundleData) {
//       // Basic validation for required fields from the new logic
//       if (!bundle.task_no) {
//         return res
//           .status(400)
//           .json({ message: "Task No is a required field." });
//       }
//       // Get current package number for this MONo-Color-Size combination
//       const packageCount = await QC2OrderData.countDocuments({
//         selectedMono: bundle.selectedMono
//         //color: bundle.color,
//         //size: bundle.size,
//       });

//       const randomId = await generateRandomId();

//       const now = new Date();

//       // Format timestamps
//       const updated_date_seperator = now.toLocaleDateString("en-US", {
//         month: "2-digit",
//         day: "2-digit",
//         year: "numeric"
//       });

//       const updated_time_seperator = now.toLocaleTimeString("en-US", {
//         hour12: false,
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit"
//       });

//       const newBundle = new QC2OrderData({
//         ...bundle,
//         package_no: packageCount + 1,
//         bundle_random_id: randomId,
//         factory: bundle.factory || "N/A", // Handle null factory
//         custStyle: bundle.custStyle || "N/A", // Handle null custStyle
//         country: bundle.country || "N/A", // Handle null country
//         department: bundle.department,
//         sub_con: bundle.sub_con || "No",
//         sub_con_factory:
//           bundle.sub_con === "Yes" ? bundle.sub_con_factory || "" : "N/A",
//         updated_date_seperator,
//         updated_time_seperator,
//         // Ensure user fields are included
//         emp_id: bundle.emp_id,
//         eng_name: bundle.eng_name,
//         kh_name: bundle.kh_name || "",
//         job_title: bundle.job_title || "",
//         dept_name: bundle.dept_name,
//         sect_name: bundle.sect_name || ""
//       });
//       await newBundle.save();
//       savedRecords.push(newBundle);
//     }
//     // const savedRecords = await QC2OrderData.insertMany(bundleData);

//     res.status(201).json({
//       message: "Bundle data saved successfully",
//       data: savedRecords
//     });
//   } catch (error) {
//     console.error("Error saving bundle data:", error);
//     res.status(500).json({
//       message: "Failed to save bundle data",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */

app.put("/api/update-bundle-data/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await QC2OrderData.findByIdAndUpdate(id, updateData, {
      new: true
    });
    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.send(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// NEW ENDPOINT: Get distinct values for filters
app.get("/api/bundle-data/distinct-filters", async (req, res) => {
  try {
    const [
      distinctMonos,
      distinctBuyers,
      distinctQcIds,
      distinctLineNos,
      distinctTaskNos
    ] = await Promise.all([
      QC2OrderData.distinct("selectedMono"),
      QC2OrderData.distinct("buyer"),
      QC2OrderData.distinct("emp_id"),
      QC2OrderData.distinct("lineNo"),
      QC2OrderData.distinct("task_no")
    ]);

    res.json({
      monos: distinctMonos.sort(),
      buyers: distinctBuyers.sort(),
      qcIds: distinctQcIds.sort(),
      lineNos: distinctLineNos.sort((a, b) => {
        // Custom sort for alphanumeric line numbers
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1; // Numbers first
        if (!isNaN(numB)) return 1;
        return a.localeCompare(b); // Then string compare
      }),
      taskNos: distinctTaskNos.sort((a, b) => a - b) // Add task numbers
    });
  } catch (error) {
    console.error("Error fetching distinct filter values:", error);
    res.status(500).json({ message: "Failed to fetch distinct filter values" });
  }
});

// MODIFIED ENDPOINT: Fetch filtered bundle data with pagination and aggregated stats
app.get("/api/filtered-bundle-data", async (req, res) => {
  try {
    const {
      date,
      lineNo,
      selectedMono,
      packageNo,
      buyer,
      emp_id,
      task_no, // New filter param
      page = 1,
      limit = 15, // Pagination params, default to page 1, 10 items per page
      sortBy = "updated_date_seperator", // Default sort field
      sortOrder = "desc" // Default sort order (descending for latest first)
    } = req.query;

    let matchQuery = {};

    if (date) {
      const normalizedQueryDate = normalizeDateString(date);
      if (normalizedQueryDate) {
        matchQuery.updated_date_seperator = normalizedQueryDate;
      }
    }
    if (lineNo) matchQuery.lineNo = lineNo;
    if (selectedMono) matchQuery.selectedMono = selectedMono;
    if (packageNo) {
      const pkgNo = parseInt(packageNo);
      if (!isNaN(pkgNo)) matchQuery.package_no = pkgNo;
    }
    if (buyer) matchQuery.buyer = buyer;
    if (emp_id) matchQuery.emp_id = emp_id;
    if (task_no) matchQuery.task_no = parseInt(task_no, 10); // Add task_no to query

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    let sortOptions = {};
    if (sortBy === "updated_date_seperator") {
      // For date and time, sort by date then time if dates are equal
      sortOptions = {
        updated_date_seperator: sortDirection,
        updated_time_seperator: sortDirection
      };
    } else {
      sortOptions[sortBy] = sortDirection;
    }

    // Fetch total count of matching documents for pagination
    const totalRecords = await QC2OrderData.countDocuments(matchQuery);

    // Fetch paginated and sorted records
    const records = await QC2OrderData.find(matchQuery)
      .sort(sortOptions) // Apply sorting
      .skip(skip) // Apply skip for pagination
      .limit(limitNum); // Apply limit for pagination

    // Calculate aggregated stats based on ALL filtered records (not just the current page)
    // This might be resource-intensive if the filtered set is very large.
    // Consider if stats should also be paginated or if an approximation is okay for large sets.

    // --- New Stats Aggregation ---
    const statsPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: { task_no: "$task_no", mono: "$selectedMono" },
          garmentQty: { $sum: "$count" },
          bundleCount: { $sum: 1 } // Use 1 to count documents, not bundleQty
        }
      },
      {
        $group: {
          _id: "$_id.task_no",
          totalGarmentQty: { $sum: "$garmentQty" },
          totalBundles: { $sum: "$bundleCount" },
          uniqueStyles: { $addToSet: "$_id.mono" }
        }
      }
    ];

    const statsResults = await QC2OrderData.aggregate(statsPipeline);

    //const allFilteredRecordsForStats = await QC2OrderData.find(matchQuery); // Re-query without pagination for stats

    let totalGarmentQty = 0;
    let totalBundles = 0;
    let totalStylesSet = new Set();
    let garmentQtyByTask = {};
    let bundleCountByTask = {};

    statsResults.forEach((result) => {
      const task = result._id || "unknown"; // Handle null task_no if any
      totalGarmentQty += result.totalGarmentQty;
      totalBundles += result.totalBundles;
      result.uniqueStyles.forEach((style) => totalStylesSet.add(style));
      garmentQtyByTask[task] = result.totalGarmentQty;
      bundleCountByTask[task] = result.totalBundles;
    });

    const stats = {
      totalGarmentQty,
      totalBundles,
      totalStyles: totalStylesSet.size,
      garmentQtyByTask, // e.g., { '51': 500, '52': 734 }
      bundleCountByTask
    };

    res.json({
      records,
      stats,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords: totalRecords,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("Error fetching filtered bundle data:", error);
    res.status(500).json({ message: "Failed to fetch filtered bundle data" });
  }
});

// Ensure existing /api/user-batches is either removed or updated if it's now redundant

app.get("/api/user-batches", async (req, res) => {
  try {
    const { emp_id } = req.query;
    if (!emp_id) {
      return res.status(400).json({ message: "emp_id is required" });
    }

    const batches = await QC2OrderData.find({ emp_id }).sort({
      updated_date_seperator: -1,
      updated_time_seperator: -1
    });
    res.json(batches);
  } catch (error) {
    console.error("Error fetching user batches:", error);
    res.status(500).json({ message: "Failed to fetch user batches" });
  }
});

/* ------------------------------
   End Points - Reprint - qc2_orderdata
------------------------------ */

// NEW ENDPOINT: Get distinct values for ReprintTab filters from qc2_orderdata
app.get("/api/reprint-distinct-filters", async (req, res) => {
  try {
    const distinctMonos = await QC2OrderData.distinct("selectedMono");
    const distinctPackageNos = await QC2OrderData.distinct("package_no"); // Might be many if not filtered first
    const distinctEmpIds = await QC2OrderData.distinct("emp_id");
    const distinctLineNos = await QC2OrderData.distinct("lineNo");
    const distinctBuyers = await QC2OrderData.distinct("buyer");

    res.json({
      monos: distinctMonos.sort(),
      packageNos: distinctPackageNos
        .map(String)
        .sort((a, b) => parseInt(a) - parseInt(b)), // Ensure string for select, sort numerically
      empIds: distinctEmpIds.sort(),
      lineNos: distinctLineNos.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.localeCompare(b);
      }),
      buyers: distinctBuyers.sort()
    });
  } catch (error) {
    console.error("Error fetching distinct filter values for reprint:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct filter values for reprint" });
  }
});

// MODIFIED ENDPOINT: /api/reprint-search to support new filters, pagination, and sorting
app.get("/api/reprint-search", async (req, res) => {
  try {
    const {
      date,
      lineNo,
      selectedMono,
      packageNo,
      buyer,
      empId, // Renamed from selectedEmpId to empId for consistency
      page = 1,
      limit = 15,
      sortBy = "updated_date_seperator", // Default sort for latest
      sortOrder = "desc"
    } = req.query;

    let matchQuery = {};

    if (date) {
      const normalizedQueryDate = normalizeDateString(date);
      if (normalizedQueryDate) {
        matchQuery.updated_date_seperator = normalizedQueryDate;
      }
    }
    if (lineNo) matchQuery.lineNo = lineNo;
    if (selectedMono) matchQuery.selectedMono = selectedMono;
    if (packageNo) {
      const pkgNo = parseInt(packageNo);
      if (!isNaN(pkgNo)) matchQuery.package_no = pkgNo;
    }
    if (buyer) matchQuery.buyer = buyer;
    if (empId) matchQuery.emp_id = empId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    let sortOptions = {};
    if (sortBy === "updated_date_seperator") {
      sortOptions = {
        updated_date_seperator: sortDirection,
        updated_time_seperator: sortDirection
      };
    } else {
      sortOptions[sortBy] = sortDirection;
    }

    const totalRecords = await QC2OrderData.countDocuments(matchQuery);
    const records = await QC2OrderData.find(matchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // For reprint, we don't necessarily need global stats like in the other tab,
    // but we do need pagination info.
    res.json({
      records,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("Error searching qc2_orderdata for reprint:", error);
    res.status(500).json({ error: "Failed to search records for reprint" });
  }
});

// The /api/reprint-colors-sizes/:mono endpoint might become less relevant
// if filtering is primarily done via the new filter pane.
// However, it could still be used if you want to populate color/size dropdowns
// AFTER a MONo is selected in the filter pane for further refinement,
// though the main table will already be filtered by MONo.
// For now, I'll keep it, but its usage in the frontend might change.
app.get("/api/reprint-colors-sizes/:mono", async (req, res) => {
  try {
    const mono = req.params.mono;
    // This fetches distinct color/size combinations for a given MONO from qc2_orderdata
    const result = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } },
      { $group: { _id: { color: "$color", size: "$size" } } },
      { $group: { _id: "$_id.color", sizes: { $addToSet: "$_id.size" } } }, // Use $addToSet for unique sizes
      { $project: { color: "$_id", sizes: 1, _id: 0 } },
      { $sort: { color: 1 } } // Sort colors
    ]);
    // Further sort sizes within each color if needed client-side or here
    result.forEach((item) => item.sizes.sort());
    res.json(result);
  } catch (error) {
    console.error("Error fetching colors/sizes for reprint:", error);
    res.status(500).json({ error: "Failed to fetch colors/sizes for reprint" });
  }
});

/* ------------------------------
   End Points - Ironing
------------------------------ */

// New Endpoint to Get Bundle by Random ID
app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId
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

// Endpoint to check if a bundle ID already exists
app.post("/api/check-bundle-id", async (req, res) => {
  try {
    const { date, lineNo, selectedMono, color, size } = req.body;

    // Find all bundle IDs matching the criteria
    const existingBundles = await QC2OrderData.find({
      bundle_id: {
        $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`
      }
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
      error: error.message
    });
  }
});

// Check if ironing record exists
app.get("/api/check-ironing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Ironing.findOne({
      ironing_bundle_id: req.params.bundleId
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
      "printArray.isCompleted": false
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
      bundle_random_id: defectRecord.bundle_random_id
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

// NEW ENDPOINT: Get distinct filter values for Ironing Records
app.get("/api/ironing-records/distinct-filters", async (req, res) => {
  try {
    // Run all distinct queries on the Ironing collection in parallel
    const [
      distinctTaskNos,
      moNosFromMoNoField,
      moNosFromSelectedMonoField,
      distinctPackageNos,
      distinctDepartments,
      distinctLineNos, // ADDED
      distinctQcIds // ADDED
    ] = await Promise.all([
      Ironing.distinct("task_no_ironing").exec(),
      Ironing.distinct("moNo").exec(),
      Ironing.distinct("selectedMono").exec(),
      Ironing.distinct("package_no").exec(),
      Ironing.distinct("department").exec(),
      Ironing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
      Ironing.distinct("emp_id_ironing").exec() // ADDED: Fetch distinct QC IDs
    ]);

    // Combine MO numbers from two different fields and get unique values
    const combinedMoNos = [
      ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
    ];

    // Send the cleaned and sorted data in the JSON response
    res.json({
      taskNos: distinctTaskNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),
      moNos: combinedMoNos.filter((item) => item != null).sort(),
      packageNos: distinctPackageNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),
      departments: distinctDepartments.filter((item) => item != null).sort(),
      lineNos: distinctLineNos
        .filter((item) => item != null)
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return String(a).localeCompare(String(b));
        }),
      qcIds: distinctQcIds.filter((item) => item != null).sort()
    });
  } catch (error) {
    console.error("Error fetching distinct ironing filter options:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct ironing filter options" });
  }
});

/* ------------------------------
   End Points - Washing
------------------------------ */

app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId
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
      washing_bundle_id: req.params.bundleId
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
      "printArray.isCompleted": false
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
      bundle_random_id: defectRecord.bundle_random_id
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

// NEW ENDPOINT: Get distinct filter values for Washing Records
app.get("/api/washing-records/distinct-filters", async (req, res) => {
  try {
    // Run all distinct queries in parallel for better performance
    const [
      distinctTaskNos,
      moNosFromMoNoField,
      moNosFromSelectedMonoField,
      distinctPackageNos,
      distinctDepartments,
      distinctLineNos, // ADDED
      distinctQcIds // ADDED
    ] = await Promise.all([
      Washing.distinct("task_no_washing").exec(),
      Washing.distinct("moNo").exec(),
      Washing.distinct("selectedMono").exec(),
      Washing.distinct("package_no").exec(),
      Washing.distinct("department").exec(),
      Washing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
      Washing.distinct("emp_id_washing").exec() // ADDED: Fetch distinct QC IDs from washing records
    ]);

    // Post-processing: Combine, filter, and sort the results after they are fetched

    // 1. Combine MO numbers from two different fields and get only unique values
    const combinedMoNos = [
      ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
    ];

    // 2. Send the cleaned and sorted data in the JSON response
    res.json({
      taskNos: distinctTaskNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      moNos: combinedMoNos.filter((item) => item != null).sort(),

      packageNos: distinctPackageNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      departments: distinctDepartments.filter((item) => item != null).sort(),

      // ADDED: lineNos field
      lineNos: distinctLineNos
        .filter((item) => item != null)
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return String(a).localeCompare(String(b));
        }),

      // ADDED: qcIds field
      qcIds: distinctQcIds.filter((item) => item != null).sort()

      // REMOVED: custStyles field is no longer sent
      // custStyles: distinctCustStyles.filter((item) => item != null).sort()
    });
  } catch (error) {
    console.error("Error fetching distinct washing filter options:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct filter options" });
  }
});

/* ------------------------------
   End Points - OPA
------------------------------ */

app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId
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
      opa_bundle_id: req.params.bundleId
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
      "printArray.isCompleted": false
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
      bundle_random_id: defectRecord.bundle_random_id
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

// NEW ENDPOINT: Get distinct filter values for OPA Records
app.get("/api/opa-records/distinct-filters", async (req, res) => {
  try {
    // Run all distinct queries in parallel for better performance
    const [
      distinctTaskNos,
      moNosFromMoNoField,
      moNosFromSelectedMonoField,
      distinctPackageNos,
      distinctDepartments,
      distinctLineNos, // ADDED
      distinctQcIds // ADDED
    ] = await Promise.all([
      OPA.distinct("task_no_opa").exec(), // Querying the OPA collection
      OPA.distinct("moNo").exec(),
      OPA.distinct("selectedMono").exec(),
      OPA.distinct("package_no").exec(),
      OPA.distinct("department").exec(),
      OPA.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
      OPA.distinct("emp_id_opa").exec() // ADDED: Fetch distinct QC IDs from OPA records
    ]);

    // Combine MO numbers from two different fields and get only unique values
    const combinedMoNos = [
      ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
    ];

    // Send the cleaned and sorted data in the JSON response
    res.json({
      taskNos: distinctTaskNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      moNos: combinedMoNos.filter((item) => item != null).sort(),

      packageNos: distinctPackageNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      departments: distinctDepartments.filter((item) => item != null).sort(),

      lineNos: distinctLineNos
        .filter((item) => item != null)
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return String(a).localeCompare(String(b));
        }),

      qcIds: distinctQcIds.filter((item) => item != null).sort()
    });
  } catch (error) {
    console.error("Error fetching distinct OPA filter options:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct OPA filter options" });
  }
});

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

// ENDPOINT 1: Get data for a scanned card (Order or Defect) and check for uniqueness.
// This is the primary endpoint the scanner will call.
app.post("/api/packing/get-scan-data", async (req, res) => {
  const { randomId, taskNo } = req.body;

  if (!randomId || !taskNo) {
    return res
      .status(400)
      .json({ message: "Card ID and Task No are required." });
  }

  // --- TASK-SPECIFIC UNIQUENESS CHECK ---
  // The unique ID for a packing operation is the card's ID combined with the task number.
  const uniquePackingId = `${randomId}-${taskNo}`;
  const existingScan = await Packing.findOne({
    packing_bundle_id: uniquePackingId
  });

  if (existingScan) {
    return res.status(409).json({
      message: `This card has already been scanned for Task No ${taskNo}.`
    }); // 409 Conflict
  }

  try {
    // First, check if the ID corresponds to an Order Card by looking for bundle_random_id.
    let inspectionDoc = await QC2InspectionPassBundle.findOne({
      bundle_random_id: randomId
    });

    if (inspectionDoc) {
      // --- It's an ORDER CARD ---
      // Calculate packing quantity as per the new logic.
      const packingQty =
        (inspectionDoc.checkedQty || 0) - (inspectionDoc.totalRejects || 0);

      const responseData = {
        isDefectCard: false,
        bundle_id: inspectionDoc.bundle_id,
        bundle_random_id: inspectionDoc.bundle_random_id,
        package_no: inspectionDoc.package_no,
        moNo: inspectionDoc.moNo,
        custStyle: inspectionDoc.custStyle,
        buyer: inspectionDoc.buyer,
        color: inspectionDoc.color,
        size: inspectionDoc.size,
        lineNo: inspectionDoc.lineNo,
        department: inspectionDoc.department,
        factory: inspectionDoc.factory,
        country: inspectionDoc.country,
        sub_con: inspectionDoc.sub_con,
        sub_con_factory: inspectionDoc.sub_con_factory,
        count: packingQty,
        passQtyPacking: packingQty
      };
      return res.json(responseData);
    }

    // If not an Order Card, check if it's a Defect Card.
    inspectionDoc = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": randomId
    });

    if (inspectionDoc) {
      // --- It's a DEFECT CARD ---
      const printEntry = inspectionDoc.printArray.find(
        (p) => p.defect_print_id === randomId
      );
      if (!printEntry) {
        return res
          .status(404)
          .json({ message: "Defect card data not found within the bundle." });
      }

      // Calculate packing quantity for defect card.
      const packingQty =
        (inspectionDoc.totalRejects || 0) -
        (printEntry.totalRejectGarment_Var || 0);

      const responseData = {
        isDefectCard: true,
        defect_print_id: printEntry.defect_print_id,
        bundle_id: inspectionDoc.bundle_id,
        bundle_random_id: inspectionDoc.bundle_random_id,
        package_no: inspectionDoc.package_no,
        moNo: inspectionDoc.moNo,
        custStyle: inspectionDoc.custStyle,
        buyer: inspectionDoc.buyer,
        color: inspectionDoc.color,
        size: inspectionDoc.size,
        lineNo: inspectionDoc.lineNo,
        department: inspectionDoc.department,
        factory: inspectionDoc.factory,
        country: inspectionDoc.country,
        sub_con: inspectionDoc.sub_con,
        sub_con_factory: inspectionDoc.sub_con_factory,
        count: packingQty,
        passQtyPacking: packingQty
      };
      return res.json(responseData);
    }

    // If the ID is not found in either context, it's invalid.
    return res.status(404).json({
      message: "Invalid QR Code. Not found as an Order Card or a Defect Card."
    });
  } catch (error) {
    console.error("Error fetching packing scan data:", error);
    res.status(500).json({ message: "Server error fetching data." });
  }
});

// ENDPOINT 2: Save a new packing record. This remains simple.
app.post("/api/packing/save-record", async (req, res) => {
  try {
    const newRecordData = req.body;

    if (!newRecordData.packing_bundle_id) {
      return res
        .status(400)
        .json({ message: "packing_bundle_id is required." });
    }

    const existingScan = await Packing.findOne({
      packing_bundle_id: newRecordData.packing_bundle_id
    });
    if (existingScan) {
      return res.status(409).json({
        message: `This card has already been scanned for Task No ${newRecordData.task_no_packing}.`
      });
    }

    const newRecord = new Packing(newRecordData);
    await newRecord.save();

    res
      .status(201)
      .json({ message: "Packing record saved successfully", data: newRecord });
  } catch (error) {
    console.error("Error saving packing record:", error);
    res.status(500).json({ message: "Failed to save packing record." });
  }
});

// ENDPOINT 3: Get all packing records for the data table.
app.get("/api/packing/get-all-records", async (req, res) => {
  try {
    const records = await Packing.find().sort({
      packing_updated_date: -1,
      packing_update_time: -1
    });
    res.json(records);
  } catch (error) {
    console.error("Error fetching packing records:", error);
    res.status(500).json({ message: "Failed to fetch packing records." });
  }
});

// NEW ENDPOINT: Get distinct filter values for Packing Records
app.get("/api/packing-records/distinct-filters", async (req, res) => {
  try {
    // Run all distinct queries on the Packing collection in parallel
    const [
      distinctTaskNos,
      moNosFromMoNoField,
      distinctPackageNos,
      distinctDepartments,
      distinctLineNos, // ADDED
      distinctQcIds // ADDED
    ] = await Promise.all([
      Packing.distinct("task_no_packing").exec(),
      Packing.distinct("moNo").exec(),
      Packing.distinct("package_no").exec(),
      Packing.distinct("department").exec(),
      Packing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
      Packing.distinct("emp_id_packing").exec() // ADDED: Fetch distinct QC IDs
    ]);

    // Send the cleaned and sorted data in the JSON response
    res.json({
      taskNos: distinctTaskNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),
      moNos: distinctMoNos.filter((item) => item != null).sort(),
      packageNos: distinctPackageNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),
      departments: distinctDepartments.filter((item) => item != null).sort(),
      lineNos: distinctLineNos
        .filter((item) => item != null)
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return String(a).localeCompare(String(b));
        }),
      qcIds: distinctQcIds.filter((item) => item != null).sort()
    });
  } catch (error) {
    console.error("Error fetching distinct packing filter options:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct packing filter options" });
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
          customers: { $addToSet: "$headerData.customer" }
        }
      }
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
          defectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          lineNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    // Get defect rate by MO
    const defectRateByMO = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.moNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          moNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    // Get defect rate by customer
    const defectRateByCustomer = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.customer",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          customer: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    // Get the latest record with defect array to get accurate defect counts
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
      latestHeaderData: {}
    };

    const totalInspected = dashboardData.totalCheckedQty || 0;

    res.json({
      filters: filterValues[0] || {
        factories: [],
        lineNos: [],
        moNos: [],
        customers: []
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
            message: error.errors[key].message
          }))
        : undefined
    });
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
          buyers: { $addToSet: "$buyer" }
        }
      }
    ]);

    const result = uniqueValues[0] || {
      moNos: [],
      styleNos: [],
      lineNos: [],
      colors: [],
      sizes: [],
      buyers: []
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
      limit = 50
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
    const dateField = isIroning
      ? "ironing_updated_date"
      : "updated_date_seperator";

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

    console.log("Match Query:", matchQuery); // For debugging

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
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching download data:", error);
    res.status(500).json({ error: "Failed to fetch download data" });
  }
});

/* ------------------------------
   QC2 - Inspection Pass Bundle
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
      printArray
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
      error: error.message
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
        runValidators: true
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
        data: updatedRecord
      });
    } catch (error) {
      console.error("Error updating inspection pass bundle:", error);
      res.status(500).json({
        message: "Failed to update inspection pass bundle",
        error: error.message
      });
    }
  }
);

/* ------------------------------
   QC2 - Workers Scan Data Tracking
------------------------------ */

app.post("/api/qc2-workers-data/log-scan", async (req, res) => {
  try {
    const { qc_id, moNo, taskNo, qty, random_id } = req.body;

    if (!qc_id || !moNo || !taskNo || qty === undefined || !random_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const inspection_date = new Date().toLocaleDateString("en-US");

    // --- FIX: Conditional Duplicate Check ---
    // Only check for duplicates if it's an Order Card (taskNo 54)
    if (taskNo === 54) {
      const workerData = await QC2WorkersData.findOne({
        qc_id,
        inspection_date
      });

      // If a record for the worker exists today, check if this Order Card has already been scanned.
      if (
        workerData &&
        workerData.dailyData.some(
          (d) => d.random_id === random_id && d.taskNo === 54
        )
      ) {
        return res.status(200).json({
          message: "You have already scanned this Order Card today.",
          data: workerData
        });
      }
    }
    // If taskNo is 84 (Defect Card), we skip this check and always allow the entry.

    // Find the current document to correctly calculate the next 'no'
    const currentWorkerData = await QC2WorkersData.findOne({
      qc_id,
      inspection_date
    });
    const dailyDataNo = currentWorkerData
      ? currentWorkerData.dailyData.length + 1
      : 1;

    // Determine which quantity to increment based on the task number
    const qtyIncrementField =
      taskNo === 54 ? "totalQtyTask54" : "totalQtyTask84";

    // Use findOneAndUpdate with upsert to create or update the document
    const updatedWorkerData = await QC2WorkersData.findOneAndUpdate(
      { qc_id, inspection_date },
      {
        $inc: {
          totalCheckedQty: qty,
          [qtyIncrementField]: qty
        },
        $push: {
          dailyData: {
            no: dailyDataNo,
            moNo,
            taskNo,
            qty,
            random_id
          }
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Worker scan data logged successfully.",
      data: updatedWorkerData
    });
  } catch (error) {
    console.error("Error logging worker scan data:", error);
    res.status(500).json({ message: "Server error logging scan data." });
  }
});

/* ------------------------------
   QC2 - Fetch Worker's Daily Data
------------------------------ */

// This endpoint fetches today's summary and detailed data for a specific QC worker.
app.get("/api/qc2-workers-data/today/:qc_id", async (req, res) => {
  try {
    const { qc_id } = req.params;
    if (!qc_id) {
      return res.status(400).json({ message: "QC ID is required." });
    }

    const inspection_date = new Date().toLocaleDateString("en-US");

    const workerData = await QC2WorkersData.findOne({
      qc_id,
      inspection_date
    }).lean();

    if (!workerData) {
      // If no data exists for today, return a default empty structure.
      return res.json({
        totalCheckedQty: 0,
        totalQtyTask54: 0,
        totalQtyTask84: 0,
        dailyData: []
      });
    }

    // Group daily data by MO Number for the popup view
    const moSummary = workerData.dailyData.reduce((acc, item) => {
      if (!acc[item.moNo]) {
        acc[item.moNo] = {
          moNo: item.moNo,
          totalQty: 0,
          task54Qty: 0,
          task84Qty: 0
        };
      }
      acc[item.moNo].totalQty += item.qty;
      if (item.taskNo === 54) {
        acc[item.moNo].task54Qty += item.qty;
      } else if (item.taskNo === 84) {
        acc[item.moNo].task84Qty += item.qty;
      }
      return acc;
    }, {});

    workerData.moSummary = Object.values(moSummary);

    res.json(workerData);
  } catch (error) {
    console.error("Error fetching today's worker data:", error);
    res.status(500).json({ message: "Server error fetching worker data." });
  }
});

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
          repair: { $addToSet: "$repair" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          package_no: 1,
          repair: 1
        }
      }
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
        bundle_random_id
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
        "printArray.defect_print_id": defect_print_id
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
// const normalizeDateString = (dateStr) => {
//   if (!dateStr) return null;
//   try {
//     const [month, day, year] = dateStr.split("/").map((part) => part.trim());
//     if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) {
//       throw new Error("Invalid date format");
//     }
//     // Add leading zeros to month and day
//     const normalizedMonth = ("0" + parseInt(month, 10)).slice(-2);
//     const normalizedDay = ("0" + parseInt(day, 10)).slice(-2);
//     return `${normalizedMonth}/${normalizedDay}/${year}`;
//   } catch (error) {
//     console.error(`Invalid date string: ${dateStr}`, error);
//     return null;
//   }
// };

// Helper function to escape special characters in regex
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escapes . * + ? ^ $ { } ( ) | [ ] \
};

// GET endpoint to fetch all inspection records
app.get("/api/qc2-inspection-pass-bundle/search", async (req, res) => {
  try {
    const {
      moNo,
      package_no,
      emp_id_inspection,
      line_no, // Added
      taskNo,  // Added
      date, 
      startDate,
      endDate,
      color,
      size,
      department,
      page = 1,
      limit = 50 // Default to 50 records per page
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
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };

      if (line_no) {
      match.lineNo = line_no;
    }
    // Handle taskNo from query, matching against the 'taskNo' field in the database
    if (taskNo) {
      match.taskNo = taskNo;
    }
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;

    if (date) {
       if (date) match.inspection_date = normalizeDateString(date);
      
    } 
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
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2InspectionPassBundle.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    console.log("Search result:", { data, total });
    res.json({ data, total });
  } catch (error) {
    console.error("Error searching data cards:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/qc2-defect-print/search", async (req, res) => {
  try {
    const { moNo, package_no, repair,date, page = 1, limit = 50 } = req.query;
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (date) match.inspection_date = normalizeDateString(date);
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
          total: [{ $count: "count" }]
        }
      }
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
    console.log(`Received request to update record with ID: ${id}`);
    console.log(`Update Data: ${JSON.stringify(updateData)}`);
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

// CORRECTED Endpoint to get summary data with all new fields and correct logic
// FINAL CORRECTED Endpoint to get summary data with all fields calculated correctly

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
      lineNo
    } = req.query;

    // --- Filter logic (This part is correct and remains unchanged) ---
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

    if (startDate || endDate) {
      match.$expr = match.$expr || { $and: [] };
      const parseDate = (dateStr) => {
        const [month, day, year] = dateStr.split("/");
        return new Date(
          `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}T00:00:00.000Z`
        );
      };
      if (startDate) {
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            parseDate(startDate)
          ]
        });
      }
      if (endDate) {
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            parseDate(endDate)
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
      // Stage 1: Match documents based on user's filters
      { $match: match },

      // Stage 2: Group all matching documents to get the final totals for all fields.
      {
        $group: {
          _id: null,
          totalGarments: { $sum: "$checkedQty" },
          totalPass: { $sum: "$totalPass" },
          totalRejects: { $sum: "$totalRejects" },
          defectsQty: { $sum: "$defectQty" },

          // Repair Left is the sum of the `totalRepair`
          totalRepair: { $sum: "$totalRepair" },

          // B-Grade Qty calculation
          sumOfAllRejects: { $sum: "$totalRejects" },
          sumOfAllVar: { $sum: { $sum: "$printArray.totalRejectGarment_Var" } },

          totalBundles: { $sum: 1 }
        }
      },

      // Stage 3: Project the final shape, calculate B-Grade Qty, and rates
      {
        $project: {
          _id: 0,
          totalGarments: 1,
          totalPass: 1,
          totalRejects: 1,
          totalRepair: 1,
          defectsQty: 1,
          bGradeQty: { $subtract: ["$sumOfAllRejects", "$sumOfAllVar"] },
          totalBundles: 1,
          defectRate: {
            $cond: [
              { $eq: ["$totalGarments", 0] },
              0,
              { $divide: ["$defectsQty", "$totalGarments"] }
            ]
          },
          defectRatio: {
            $cond: [
              { $eq: ["$totalGarments", 0] },
              0,
              { $divide: ["$totalRejects", "$totalGarments"] }
            ]
          }
        }
      }
    ]);

    if (data.length > 0) {
      res.json(data[0]);
    } else {
      // Return a default object with all fields if no data is found
      res.json({
        totalGarments: 0,
        totalPass: 0,
        totalRejects: 0,
        totalRepair: 0,
        bGradeQty: 0,
        defectsQty: 0,
        totalBundles: 0,
        defectRate: 0,
        defectRatio: 0
      });
    }
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

// app.get("/api/qc2-inspection-summary", async (req, res) => {
//   try {
//     const {
//       moNo,
//       emp_id_inspection,
//       startDate,
//       endDate,
//       color,
//       size,
//       department,
//       buyer,
//       lineNo // Add Line No
//     } = req.query;

//     let match = {};
//     if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
//     if (emp_id_inspection)
//       match.emp_id_inspection = {
//         $regex: new RegExp(emp_id_inspection.trim(), "i")
//       };
//     if (color) match.color = color;
//     if (size) match.size = size;
//     if (department) match.department = department;
//     if (buyer)
//       match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
//     if (lineNo) match.lineNo = lineNo.trim();
//     //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") }; // Add Line No filter

//     // Normalize and convert dates to Date objects for proper comparison
//     if (startDate || endDate) {
//       match.$expr = match.$expr || {}; // Initialize $expr if not present
//       match.$expr.$and = match.$expr.$and || [];

//       if (startDate) {
//         const normalizedStartDate = normalizeDateString(startDate);
//         match.$expr.$and.push({
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$inspection_date",
//                 format: "%m/%d/%Y"
//               }
//             },
//             {
//               $dateFromString: {
//                 dateString: normalizedStartDate,
//                 format: "%m/%d/%Y"
//               }
//             }
//           ]
//         });
//       }
//       if (endDate) {
//         const normalizedEndDate = normalizeDateString(endDate);
//         match.$expr.$and.push({
//           $lte: [
//             {
//               $dateFromString: {
//                 dateString: "$inspection_date",
//                 format: "%m/%d/%Y"
//               }
//             },
//             {
//               $dateFromString: {
//                 dateString: normalizedEndDate,
//                 format: "%m/%d/%Y"
//               }
//             }
//           ]
//         });
//       }
//     }
//     const data = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: null,
//           checkedQty: { $sum: "$checkedQty" },
//           totalPass: { $sum: "$totalPass" },
//           totalRejects: { $sum: "$totalRejects" },
//           defectsQty: { $sum: "$defectQty" },
//           totalBundles: { $sum: 1 }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           checkedQty: 1,
//           totalPass: 1,
//           totalRejects: 1,
//           defectsQty: 1,
//           totalBundles: 1,
//           defectRate: {
//             $cond: [
//               { $eq: ["$checkedQty", 0] },
//               0,
//               { $divide: ["$defectsQty", "$checkedQty"] }
//             ]
//           },
//           defectRatio: {
//             $cond: [
//               { $eq: ["$checkedQty", 0] },
//               0,
//               { $divide: ["$totalRejects", "$checkedQty"] }
//             ]
//           }
//         }
//       }
//     ]);

//     if (data.length > 0) {
//       res.json(data[0]);
//     } else {
//       res.json({
//         checkedQty: 0,
//         totalPass: 0,
//         totalRejects: 0,
//         defectsQty: 0,
//         totalBundles: 0,
//         defectRate: 0,
//         defectRatio: 0
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching summary data:", error);
//     res.status(500).json({ error: "Failed to fetch summary data" });
//   }
// });

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
        $regex: new RegExp(emp_id_inspection.trim(), "i")
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
            $sum: { $cond: [{ $gt: ["$totalRepair", 0] }, 1, 0] }
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
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$defectsQty", "$checkedQty"] }
            ]
          },
          defectRatio: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$totalRejects", "$checkedQty"] }
            ]
          },
          _id: 0
        }
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
      buyer
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
          _id: { moNo: "$moNo", hour: "$hour" },
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
          _id: { moNo: "$_id.moNo", hour: "$_id.hour" },
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
          _id: "$_id.moNo",
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
      { $sort: { moNo: 1 } }
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
                : 0
          }))
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
      if (key !== "grand") {
        hours.forEach((hour) => {
          if (!result[key][hour]) {
            result[key][hour] = {
              rate: 0,
              hasCheckedQty: false,
              checkedQty: 0,
              defects: []
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
   QC2 - B-Grade Tracking
------------------------------ */

// --- NEW ENDPOINT: To save or update B-Grade garment data ---

app.post("/api/qc2-bgrade", async (req, res) => {
  try {
    const { defect_print_id, garmentData, headerData } = req.body;

    if (!defect_print_id || !garmentData || !headerData) {
      return res.status(400).json({ message: "Missing required data." });
    }

    // First, check if this garment is already in the B-Grade document to prevent duplicates
    const existingBGrade = await QC2BGrade.findOne({
      defect_print_id,
      "bgradeArray.garmentNumber": garmentData.garmentNumber
    });

    if (existingBGrade) {
      return res.status(200).json({
        message: "This garment has already been marked as B-Grade.",
        data: existingBGrade
      });
    }

    const updateOperations = {
      $setOnInsert: headerData, // Set header data only when creating a new document
      $push: { bgradeArray: garmentData } // Always add the new garment to the array
    };

    // Conditionally increment the new `totalBgradeQty` field.
    // The default `leader_status` in your schema is "B Grade", so this will work for new entries.
    if (garmentData.leader_status !== "Not B Grade") {
      updateOperations.$inc = { totalBgradeQty: 1 };
    }

    // If not a duplicate, proceed with saving and decrementing
    const bGradeRecord = await QC2BGrade.findOneAndUpdate(
      { defect_print_id },
      updateOperations, // Use the new, more complex update object
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // --- THIS IS THE CRUCIAL NEW LOGIC ---
    // After successfully saving the B-Grade record, decrement the count in the main inspection document
    await QC2InspectionPassBundle.updateOne(
      { "printArray.defect_print_id": defect_print_id },
      {
        $inc: {
          "printArray.$.totalRejectGarmentCount": -1,
          "printArray.$.totalRejectGarment_Var": -1 // Also decrement the static variable
        }
      }
    );

    res.status(200).json({
      message: "B-Grade garment recorded successfully.",
      data: bGradeRecord
    });
  } catch (error) {
    console.error("Error saving B-Grade data:", error);
    res.status(500).json({ message: "Server error saving B-Grade data." });
  }
});

// --- NEW ENDPOINT: To fetch B-Grade data by defect_print_id ---

app.get("/api/qc2-bgrade/by-defect-id/:defect_print_id", async (req, res) => {
  try {
    const { defect_print_id } = req.params;
    const bGradeData = await QC2BGrade.findOne({ defect_print_id }).lean();

    if (!bGradeData) {
      return res.status(404).json({ message: "No B-Grade records found." });
    }
    res.json(bGradeData);
  } catch (error) {
    console.error("Error fetching B-Grade data by defect ID:", error);
    res.status(500).json({ message: "Server error." });
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
            ? repairRecord.repairArray.find(
                (r) =>
                  r.defectName === defect.name &&
                  r.garmentNumber === garment.garmentNumber
              )
            : null;
          return {
            name: defect.name,
            count: defect.count,
            repair: defect.repair,
            status: repairItem ? repairItem.status : "Fail",
            repair_date: repairItem ? repairItem.repair_date : "",
            repair_time: repairItem ? repairItem.repair_time : "",
            pass_bundle: repairItem ? repairItem.pass_bundle : "Not Checked",
            garmentNumber: garment.garmentNumber
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

    // // Check if a record already exists
    // let existingRecord = await QC2RepairTracking.findOne({ defect_print_id });

    // if (existingRecord) {
    //   // Update existing record
    //   existingRecord.repairArray = existingRecord.repairArray.map((item) => {
    //     const updatedItem = repairArray.find(
    //       (newItem) =>
    //         newItem.defectName === item.defectName &&
    //         newItem.garmentNumber === item.garmentNumber
    //     );
    //     if (updatedItem) {
    //       // Determine if pass_bundle needs to be updated
    //       let newPassBundle = item.pass_bundle;
    //       if (updatedItem.status !== item.status) {
    //         newPassBundle =
    //           updatedItem.status === "Fail"
    //             ? "Not Checked"
    //             : updatedItem.status === "OK"
    //             ? "Pass"
    //             : updatedItem.status === "B-Grade"
    //             ? "Fail"
    //             : "Fail";
    //       }
    //       return {
    //         ...item,
    //         status: updatedItem.status,
    //         repair_date: updatedItem.repair_date,
    //         repair_time: updatedItem.repair_time,
    //         pass_bundle: newPassBundle
    //       };
    //     }
    //     return item;
    //   });

    //   //Add new items
    //   const newItems = repairArray.filter(
    //     (newItem) =>
    //       !existingRecord.repairArray.some(
    //         (existingItem) =>
    //           existingItem.defectName === newItem.defectName &&
    //           existingItem.garmentNumber === newItem.garmentNumber
    //       )
    //   );

    //   if (newItems.length > 0) {
    //     existingRecord.repairArray.push(...newItems);
    //   }

    //   await existingRecord.save();
    //   res.status(200).json({
    //     message: "Repair tracking updated successfully",
    //     data: existingRecord
    //   });
    // } else {
    //   // Create new record
    //   const newRecord = new QC2RepairTracking({

    if (!defect_print_id || !repairArray) {
      return res
        .status(400)
        .json({ message: "Missing defect_print_id or repairArray." });
    }

    const now = new Date();

    // 1. Enhance the incoming array with correct timestamps based on status
    const enhancedRepairArray = repairArray.map((item) => ({
      ...item,
      repair_date:
        item.status === "OK" ? now.toLocaleDateString("en-US") : null,
      repair_time:
      item.status === "OK"
          ? now.toLocaleTimeString("en-US", { hour12: false })
          : null
    }));

    // 2. Use a single, atomic operation to update or create the document
    const updatedRecord = await QC2RepairTracking.findOneAndUpdate(
      { defect_print_id }, // Query: Find the document by its unique ID
      {
        // Update payload:
        $set: {
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
      //   defect_print_id,
      //   repairArray: repairArray.map((item) => ({
      //     defectName: item.defectName,
      //     defectCount: item.defectCount,
      //     repairGroup: item.repairGroup,
      //     garmentNumber: item.garmentNumber,
      //     status: item.status || "Fail",
      //     repair_date: item.repair_date || "",
      //     repair_time: item.repair_time || "",
      //     pass_bundle:
      //       item.status === "Fail"
      //         ? "Not Checked"
      //         : item.status === "OK"
      //         ? "Fail"
      //         : "Not Checked"
      //   }))
      // });
      // await newRecord.save();
      // res.status(201).json({
      repairArray: enhancedRepairArray // Replace the entire array with our enhanced one
        },
        $setOnInsert: { defect_print_id } // If creating, ensure defect_print_id is set
      },
      {
        new: true, // Return the updated document
        upsert: true // Create the document if it doesn't exist
      }
    );
        res.status(200).json({
        message: "Repair tracking saved successfully",
        // data: newRecord
        data: updatedRecord
      });
    // }
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
  // const { defect_print_id, garmentNumber, failedDefects, isRejecting } =
  //   req.body;
  const { defect_print_id, garmentNumber, failedDefects } = req.body;
  try {
    // const repairTracking = await QC2RepairTracking.find({ defect_print_id });
    // if (!repairTracking || repairTracking.length == 0) {
    //   return res.status(404).json({ message: "Repair tracking not found" });
    if (!failedDefects || failedDefects.length === 0) {
      return res.status(400).json({ message: "No failed defects provided." });
    }

//     const rt = repairTracking[0];

//     rt.repairArray = rt.repairArray.map((item) => {
//   if (item.garmentNumber === garmentNumber) {
//     if (
//       isRejecting &&
//       failedDefects.some((fd) => fd.name === item.defectName)
//     ) {
//       item.status = "Fail";
//       item.repair_date = null;
//       item.repair_time = null;
//       item.pass_bundle = "Fail";
//     } 
//     // If rejecting but not in failedDefects, do nothing
//   }

//   // New condition: If status is B-Grade, pass_bundle must be Fail
//   if (item.status === "B-Grade") {
//     item.pass_bundle = "Fail";
//   }

//   return item;
// });


//     await rt.save();
const defectNamesToFail = failedDefects.map((d) => d.name);

    const result = await QC2RepairTracking.updateOne(
      { defect_print_id },
      {
        $set: {
          "repairArray.$[elem].status": "Fail",
          "repairArray.$[elem].repair_date": null,
          "repairArray.$[elem].repair_time": null,
          "repairArray.$[elem].pass_bundle": "Fail"
        }
      },
      {
        arrayFilters: [
          {
            "elem.garmentNumber": garmentNumber,
            "elem.defectName": { $in: defectNamesToFail }
          }
        ]
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Repair tracking not found" });
    }
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating re-rejected garment status:", error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to update pass_bundle status for all garments
app.post(
  "/api/qc2-repair-tracking/update-pass-bundle-status",
  async (req, res) => {
    try {
      // const { defect_print_id, pass_bundle } = req.body;

      // const repairTracking = await QC2RepairTracking.findOne({
      //   defect_print_id
      // });

      // if (!repairTracking) {
      const { defect_print_id } = req.body;
      const result = await QC2RepairTracking.updateOne(
        { defect_print_id }, // Find the document
        { $set: { "repairArray.$[elem].pass_bundle": "Pass" } }, // The update to apply
        {
          // This filter tells MongoDB to only apply the update to elements where status is "OK"
          arrayFilters: [{ "elem.status": "OK" }],
          new: true
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Repair tracking not found" });
      }

      // const updatedRepairArray = repairTracking.repairArray.map((item) => {
      //   return {
      //     ...item.toObject(),
      //     pass_bundle: item.status === "OK" ? "Pass" : item.pass_bundle
      //   };
      // });

      // repairTracking.repairArray = updatedRepairArray;
      // await repairTracking.save();

      res
        .status(200)
        .json({ message: "pass_bundle status updated successfully" });
    } catch (error) {
      console.error("Error updating pass_bundle status:", error);
      res.status(500).json({
        message: "Failed to update pass_bundle status",
        error: error.message
      });
    }
  }
);

// app.post(
//   "/api/qc2-repair-tracking/update-pass-bundle-status",
//   async (req, res) => {
//     try {
//       const { defect_print_id, pass_bundle } = req.body;

//       const repairTracking = await QC2RepairTracking.findOne({
//         defect_print_id
//       });

//       if (!repairTracking) {
//         return res.status(404).json({ message: "Repair tracking not found" });
//       }

//       const updatedRepairArray = repairTracking.repairArray.map((item) => {
//         return {
//           ...item.toObject(),
//           pass_bundle: item.status === "OK" ? "Pass" : item.pass_bundle
//         };
//       });

//       repairTracking.repairArray = updatedRepairArray;
//       await repairTracking.save();

//       res
//         .status(200)
//         .json({ message: "pass_bundle status updated successfully" });
//     } catch (error) {
//       console.error("Error updating pass_bundle status:", error);
//       res.status(500).json({
//         message: "Failed to update pass_bundle status",
//         error: error.message
//       });
//     }
//   }
// );

// Endpoint to update defect status by defect name and garment number
// Endpoint to update defect status by defect name and garment number (ATOMIC VERSION)
app.post(
  "/api/qc2-repair-tracking/update-defect-status-by-name",
  async (req, res) => {
    // const { defect_print_id, garmentNumber, defectName, status } = req.body;
    // try {
    //   const repairTracking = await QC2RepairTracking.findOne({
    //     defect_print_id
    //   });
    //   if (!repairTracking) {
    //     console.error(
    //       `No repair tracking found for defect_print_id: ${defect_print_id}`
    //     ); // Add this line
    //     return res.status(404).json({ message: "Repair tracking not found" });
    //   }

    //   // Find the specific defect and update it
    //   const updatedRepairArray = repairTracking.repairArray.map((item) => {
    //     if (
    //       item.garmentNumber === garmentNumber &&
    //       item.defectName === defectName
    //     ) {
    //       const shouldUpdate = item.status !== status;
    //       if (shouldUpdate) {
    const { defect_print_id, garmentNumber, defectName, status, pass_bundle } =
      req.body;
    try {
            const now = new Date();

              // ...item,
              // status: status,
              // repair_date:
              const updatePayload = {
              "repairArray.$.status": status,
               "repairArray.$.repair_date":
                status === "OK" ? now.toLocaleDateString("en-US") : null,
              // repair_time:
              "repairArray.$.repair_time":
                status === "OK"
                  ? now.toLocaleTimeString("en-US", { hour12: false })
                  : null,
               // pass_bundle: status === "OK" ? "Pass" : status === "Fail" ? "Fail" : item.pass_bundle
      //         pass_bundle: status === "OK" ? "Fail" : item.pass_bundle
      //       };
      //     }
      //   }
      //   return item;
      // });
      // // Check if any changes were made
      // const hasChanges = repairTracking.repairArray.some((item, index) => {
      //   return (
      //     JSON.stringify(item) !== JSON.stringify(updatedRepairArray[index])
      //   );
      // });
      // if (hasChanges) {
      //   repairTracking.repairArray = updatedRepairArray;
      //   await repairTracking.save();
        // console.log("Updated Repair Array:", updatedRepairArray);
        "repairArray.$.pass_bundle": pass_bundle // Pass this directly from the frontend
      };

      // This is the atomic update. It finds the document AND the array element and updates it in one go.
      const result = await QC2RepairTracking.updateOne(
        {
          defect_print_id,
          "repairArray.garmentNumber": garmentNumber,
          "repairArray.defectName": defectName
        },
        { $set: updatePayload }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ message: "Repair tracking or specific defect not found." });
      }

      if (result.modifiedCount === 0) {
        return res.status(200).json({ message: "No changes were needed." });
      }

        res.status(200).json({ message: "Defect status updated successfully" });
      // } else {
      //   res.status(200).json({ message: "No changes were made" });
      // }
    } catch (error) {
      console.error("Error updating defect status:", error);
      res.status(500).json({
        message: "Failed to update defect status",
        error: error.message
      });
    }
  }
);

// B grade confirmation endpoint -- need to update;
// Endpoint to PROCESS leader decisions (Accept / Not B Grade)
// This endpoint is completely separate and handles the leader's actions.
// server.js

// --- CORRECTED ENDPOINT for B-Grade Leader Decisions (WITHOUT TRANSACTION) ---
// This removes the `mongoose.startSession()` call that is causing the timeout.
app.post("/api/b-grade-defects/process-decisions", async (req, res) => {
  const { defect_print_id, decisions } = req.body;

  if (!defect_print_id || !decisions || !Object.keys(decisions).length) {
    return res.status(400).json({ message: "Missing required data." });
  }

  try {
    // NOTE: We are NOT starting a session here.

    // Step 1: Find the B-Grade document to get its bundle_random_id.
    const bGradeDoc = await QC2BGrade.findOne({ defect_print_id });
    if (!bGradeDoc) {
      throw new Error(
        `B-Grade document not found for defect ID: ${defect_print_id}`
      );
    }

    let garmentsChangedToNotBGrade = 0;

    // Step 2: Update the bGradeDoc based on decisions.
    bGradeDoc.bgradeArray.forEach((garment) => {
      const garmentNumberStr = String(garment.garmentNumber);
      if (
        decisions[garmentNumberStr] === "Not B Grade" &&
        garment.leader_status === "B Grade"
      ) {
        garment.leader_status = "Not B Grade";
        garmentsChangedToNotBGrade++;
      }
    });

    if (garmentsChangedToNotBGrade === 0) {
      return res
        .status(200)
        .json({ message: "No changes to 'Not B-Grade' were made." });
    }

    // Step 3: Update counts and save the B-Grade document.
    bGradeDoc.totalBgradeQty -= garmentsChangedToNotBGrade;
    bGradeDoc.markModified("bgradeArray");
    // We save this document first.
    await bGradeDoc.save();

    // Step 4: Find and update the Inspection document.
    // This is the second, separate database operation.
    const filter = { bundle_random_id: bGradeDoc.bundle_random_id };
    const update = {
      $inc: {
        totalPass: garmentsChangedToNotBGrade,
        // We also need to find the correct printArray element to decrement its Var count
        "printArray.$[elem].totalRejectGarment_Var": -garmentsChangedToNotBGrade
      }
    };
    const options = {
      arrayFilters: [{ "elem.defect_print_id": defect_print_id }]
    };

    await QC2InspectionPassBundle.updateOne(filter, update, options);

    // If both operations succeed, send a success response.
    res.status(200).json({
      message: "B-Grade decisions processed successfully."
    });
  } catch (error) {
    // If either operation fails, this catch block will be triggered.
    console.error("Error processing B-Grade decisions:", error);
    // Note: Since this is not a transaction, the first save might have succeeded
    // while the second one failed. This is the trade-off.
    res.status(500).json({
      message: "An error occurred while processing the request.",
      error: error.message
    });
  }
});

/* ------------------------------
   B-Grade Stock Page Endpoints
------------------------------ */

// ENDPOINT 1: Fetch B-Grade Stock Data based on filters
app.post("/api/b-grade-stock", async (req, res) => {
  try {
    const { date, moNo, lineNo, packageNo, color, size, department } = req.body;

    // --- Build the main query filter ---
    const matchFilter = {
      // Only include documents that have a positive B-Grade quantity
      totalBgradeQty: { $gt: 0 }
    };

    if (date) {
      // The 'createdAt' field is automatically added by `timestamps: true`
      // and is a proper ISODate, which is better for date range queries.
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      matchFilter.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    if (moNo) matchFilter.moNo = moNo;
    if (lineNo) matchFilter.lineNo = lineNo;
    if (packageNo) matchFilter.package_no = Number(packageNo);
    if (color) matchFilter.color = color;
    if (size) matchFilter.size = size;
    if (department) matchFilter.department = department;

    const bGradeStock = await QC2BGrade.aggregate([
      // Stage 1: Initial filtering based on user's criteria
      { $match: matchFilter },

      // Stage 2: Deconstruct the bgradeArray to process each garment individually
      { $unwind: "$bgradeArray" },

      // Stage 3: Filter out garments that are marked as "Not B Grade"
      { $match: { "bgradeArray.leader_status": "B Grade" } },

      // Stage 4: Group the valid B-Grade garments back by their parent document ID
      {
        $group: {
          _id: "$_id", // Group by the original document ID
          // Bring the header fields along
          moNo: { $first: "$moNo" },
          package_no: { $first: "$package_no" },
          lineNo: { $first: "$lineNo" },
          color: { $first: "$color" },
          size: { $first: "$size" },
          // Re-assemble the array of valid B-Grade garments
          bgradeArray: { $push: "$bgradeArray" }
        }
      },

      // Stage 5: Calculate the B-Grade Qty for each document (which is the size of the filtered array)
      {
        $project: {
          moNo: 1,
          package_no: 1,
          lineNo: 1,
          color: 1,
          size: 1,
          bGradeQty: { $size: "$bgradeArray" },
          // We now call it defectDetails to match the frontend table's expectation
          defectDetails: "$bgradeArray",
          _id: 0
        }
      },

      // Sort the final results
      { $sort: { package_no: 1, moNo: 1 } }
    ]);

    res.json(bGradeStock);
  } catch (error) {
    console.error("Error fetching B-Grade stock:", error);
    res
      .status(500)
      .json({ message: "Server error fetching B-Grade stock data." });
  }
});

// ENDPOINT 2: Fetch distinct filter options based on a selected date
app.get("/api/b-grade-stock/filter-options", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ message: "A date is required to fetch filter options." });
    }

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Filter for documents on the selected date that have B-Grade items
    const matchFilter = {
      createdAt: { $gte: startDate, $lte: endDate },
      totalBgradeQty: { $gt: 0 }
    };

    // Use an aggregation pipeline to get all distinct values in one DB call
    const [filterOptions] = await QC2BGrade.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          moNos: { $addToSet: "$moNo" },
          lineNos: { $addToSet: "$lineNo" },
          packageNos: { $addToSet: "$package_no" },
          colors: { $addToSet: "$color" },
          sizes: { $addToSet: "$size" },
          departments: { $addToSet: "$department" }
        }
      },
      {
        $project: {
          _id: 0,
          moNos: 1,
          lineNos: 1,
          packageNos: 1,
          colors: 1,
          sizes: 1,
          departments: 1
        }
      }
    ]);

    // If no records found for that date, return empty arrays
    if (!filterOptions) {
      return res.json({
        moNos: [],
        lineNos: [],
        packageNos: [],
        colors: [],
        sizes: [],
        departments: []
      });
    }

    // Sort the arrays before sending
    for (const key in filterOptions) {
      filterOptions[key].sort();
    }

    res.json(filterOptions);
  } catch (error) {
    console.error("Error fetching B-Grade filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options." });
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
      bundle_random_id
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
      bundle_random_id
    });
    await newRecord.save();
    res.status(201).json({
      message: "Reworks data saved successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error saving reworks data:", error);
    res.status(500).json({
      message: "Failed to save reworks data",
      error: error.message
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
      bundle_random_id
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
      bundle_random_id
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
      createdAt: -1
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
      details: error.message
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

// Helper function to determine Buyer based on mo_no (Corrected Logic)

// const getBuyerFromMoNumber = (moNo) => {
//   if (!moNo) return "Other";

//   // Check for the more specific "COM" first to correctly identify MWW
//   if (moNo.includes("COM")) return "MWW";

//   // Then, check for the more general "CO" for Costco
//   if (moNo.includes("CO")) return "Costco";

//   // The rest of the original rules
//   if (moNo.includes("AR")) return "Aritzia";
//   if (moNo.includes("RT")) return "Reitmans";
//   if (moNo.includes("AF")) return "ANF";
//   if (moNo.includes("NT")) return "STORI";

//   // Default case if no other rules match
//   return "Other";
// };

/* ------------------------------
   End Points - Roving Sewing Defects
------------------------------ */

// GET - Fetch all sewing defects with optional filtering (This is the better, more flexible version)
app.get("/api/sewing-defects", async (req, res) => {
  try {
    const { categoryEnglish, type, isCommon } = req.query;
    const filter = {};
    if (categoryEnglish) filter.categoryEnglish = categoryEnglish;
    if (type) filter.type = type;
    if (isCommon) filter.isCommon = isCommon;

    // Fetch defects, sort by code for consistent order, and use lean() for performance
    const defects = await SewingDefects.find(filter).sort({ code: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching sewing defects:", error);
    res.status(500).json({ message: "Server error fetching sewing defects" });
  }
});

// GET - Fetch options for the 'Add Defect' form
app.get("/api/sewing-defects/options", async (req, res) => {
  try {
    const [repairs, types, lastDefect, categoryGroups] = await Promise.all([
      SewingDefects.distinct("repair"),
      SewingDefects.distinct("type"),
      SewingDefects.findOne().sort({ code: -1 }),
      SewingDefects.aggregate([
        {
          $group: {
            _id: {
              english: "$categoryEnglish",
              khmer: "$categoryKhmer",
              chinese: "$categoryChinese"
            }
          }
        },
        {
          $project: {
            _id: 0,
            english: "$_id.english",
            khmer: "$_id.khmer",
            chinese: "$_id.chinese"
          }
        },
        { $match: { english: { $ne: null, $ne: "" } } },
        { $sort: { english: 1 } }
      ])
    ]);

    const nextCode = lastDefect ? lastDefect.code + 1 : 1001;

    res.json({
      repairs: repairs.filter(Boolean),
      types: types.filter(Boolean),
      categories: categoryGroups,
      nextCode
    });
  } catch (error) {
    console.error("Error fetching defect options:", error);
    res.status(500).json({ message: "Server error fetching options" });
  }
});

// POST - Add a new sewing defect
app.post("/api/sewing-defects", async (req, res) => {
  try {
    const {
      shortEng,
      english,
      khmer,
      chinese,
      repair,
      categoryEnglish,
      categoryKhmer,
      categoryChinese,
      type,
      isCommon
    } = req.body;

    if (
      !shortEng ||
      !english ||
      !khmer ||
      !categoryEnglish ||
      !repair ||
      !type
    ) {
      return res.status(400).json({
        message:
          "Required fields are missing. Please fill out all fields marked with *."
      });
    }

    const existingDefect = await SewingDefects.findOne({
      $or: [{ shortEng }, { english }]
    });
    if (existingDefect) {
      return res.status(409).json({
        message: `Defect with name '${
          existingDefect.shortEng === shortEng ? shortEng : english
        }' already exists.`
      });
    }

    const lastDefect = await SewingDefects.findOne().sort({ code: -1 });
    const newCode = lastDefect ? lastDefect.code + 1 : 1001;

    // *** FIX IS HERE ***
    // Instead of querying a 'Buyer' model, we use the hardcoded list from your /api/buyers endpoint.
    const allBuyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];

    // Now, we map this array of strings to the required object structure.
    const statusByBuyer = allBuyers.map((buyerName) => ({
      buyerName: buyerName, // The buyer's name from the array
      defectStatus: ["Major"],
      isCommon: "Major"
    }));

    const newSewingDefect = new SewingDefects({
      code: newCode,
      shortEng,
      english,
      khmer,
      chinese: chinese || "",
      image: "",
      repair,
      categoryEnglish,
      categoryKhmer,
      categoryChinese,
      type,
      isCommon,
      statusByBuyer,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newSewingDefect.save();
    res.status(201).json({
      message: "Sewing defect added successfully",
      defect: newSewingDefect
    });
  } catch (error) {
    console.error("Error adding sewing defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Defect code or name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add sewing defect", error: error.message });
  }
});

// DELETE - Delete a sewing defect by its code (This is the better, more robust version)
app.delete("/api/sewing-defects/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const defectCode = parseInt(code, 10);
    if (isNaN(defectCode)) {
      return res.status(400).json({ message: "Invalid defect code format." });
    }
    const deletedDefect = await SewingDefects.findOneAndDelete({
      code: defectCode
    });
    if (!deletedDefect) {
      return res.status(404).json({ message: "Sewing Defect not found." });
    }
    res.status(200).json({ message: "Sewing defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting sewing defect:", error);
    res.status(500).json({
      message: "Failed to delete sewing defect",
      error: error.message
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
    const transformedDefects = defects.map((defect) => ({
      code: defect.code.toString(),
      name_en: defect.english,
      name_kh: defect.khmer,
      name_ch: defect.chinese,
      categoryEnglish: defect.categoryEnglish,
      type: defect.type,
      repair: defect.repair,
      statusByBuyer: defect.statusByBuyer || []
    }));
    res.json(transformedDefects);
  } catch (error) {
    console.error("Error fetching all defect details:", error);
    res.status(500).json({
      message: "Failed to fetch defect details",
      error: error.message
    });
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
      return res
        .status(400)
        .json({ message: "Invalid payload: Expected an array of statuses." });
    }
    const updatesByDefect = statusesPayload.reduce((acc, status) => {
      const defectCode = status.defectCode;
      if (!acc[defectCode]) {
        acc[defectCode] = [];
      }
      acc[defectCode].push({
        buyerName: status.buyerName,
        defectStatus: Array.isArray(status.defectStatus)
          ? status.defectStatus
          : [],
        isCommon: ["Critical", "Major", "Minor"].includes(status.isCommon)
          ? status.isCommon
          : "Minor"
      });
      return acc;
    }, {});

    const bulkOps = [];
    for (const defectCodeStr in updatesByDefect) {
      const defectCodeNum = parseInt(defectCodeStr, 10);
      if (isNaN(defectCodeNum)) {
        console.warn(
          `Invalid defectCode received: ${defectCodeStr}, skipping.`
        );
        continue;
      }
      const newStatusByBuyerArray = updatesByDefect[defectCodeStr];
      bulkOps.push({
        updateOne: {
          filter: { code: defectCodeNum },
          update: {
            $set: {
              statusByBuyer: newStatusByBuyerArray,
              updatedAt: new Date()
            }
          }
        }
      });
    }
    if (bulkOps.length > 0) {
      await SewingDefects.bulkWrite(bulkOps);
    }
    res.status(200).json({
      message: "Defect buyer statuses updated successfully in SewingDefects."
    });
  } catch (error) {
    console.error("Error updating defect buyer statuses:", error);
    res.status(500).json({
      message: "Failed to update defect buyer statuses",
      error: error.message
    });
  }
});

/* ------------------------------
   QC Inline Roving New
------------------------------ */

// CORRECTED ENDPOINT: Get the buyer name based on MO number
app.get("/api/buyer-by-mo", (req, res) => {
  const { moNo } = req.query;
  if (!moNo) {
    return res.status(400).json({ message: "MO number is required" });
  }

  // Call the new, separated helper function with corrected logic
  const buyerName = getBuyerFromMoNumber(moNo);

  res.json({ buyerName });
});

//get the each line related working worker count
app.get("/api/line-summary", async (req, res) => {
  try {
    const lineSummaries = await UserMain.aggregate([
      {
        $match: {
          sect_name: { $ne: null, $ne: "" },
          working_status: "Working",
          job_title: "Sewing Worker"
        }
      },
      {
        $group: {
          _id: "$sect_name",
          worker_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          line_no: "$_id",
          real_worker_count: "$worker_count"
        }
      },
      { $sort: { line_no: 1 } }
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
      edited_worker_count: editedCountsMap.get(realSummary.line_no)
    }));

    res.json(mergedSummaries);
  } catch (error) {
    console.error("Error fetching line summary:", error);
    res.status(500).json({
      message: "Failed to fetch line summary data.",
      error: error.message
    });
  }
});

//Get the completed inspect operators
app.get("/api/inspections-completed", async (req, res) => {
  const { line_no, inspection_date, mo_no, operation_id, inspection_rep_name } =
    req.query;

  try {
    const findQuery = {
      line_no,
      inspection_date
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

    const completeInspectOperators =
      specificRep.complete_inspect_operators || 0;

    res.json({ completeInspectOperators });
  } catch (error) {
    console.error("Error fetching inspections completed:", error);
    res.status(500).json({ message: "Internal server error" });
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
          job_title: "Sewing Worker"
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const current_real_worker_count =
      realCountResult.length > 0 ? realCountResult[0].count : 0;

    const historyEntry = {
      edited_worker_count,
      updated_at: now
    };

    const updatedLineWorker = await LineSewingWorker.findOneAndUpdate(
      { line_no: lineNo },
      {
        $set: {
          real_worker_count: current_real_worker_count,
          edited_worker_count,
          updated_at: now
        },
        $push: { history: historyEntry }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Line worker count updated successfully.",
      data: updatedLineWorker
    });
  } catch (error) {
    console.error(
      `Error updating line worker count for line ${lineNo}:`,
      error
    );
    res.status(500).json({
      message: "Failed to update line worker count.",
      error: error.message
    });
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
      inspection_rep_item
    } = req.body;

    if (!inspection_date || !mo_no || !line_no || !inspection_rep_item) {
      return res.status(400).json({
        message:
          "Missing required fields: inspection_date, mo_no, line_no, or inspection_rep_item."
      });
    }

    if (
      typeof inspection_rep_item !== "object" ||
      inspection_rep_item === null
    ) {
      return res
        .status(400)
        .json({ message: "inspection_rep_item must be a valid object." });
    }

    if (
      !inspection_rep_item.inspection_rep_name ||
      !inspection_rep_item.emp_id ||
      !inspection_rep_item.eng_name
    ) {
      return res.status(400).json({
        message:
          "inspection_rep_item is missing required fields like inspection_rep_name, emp_id, or eng_name."
      });
    }

    let doc = await QCInlineRoving.findOne({ inspection_date, mo_no, line_no });

    if (doc) {
      const existingRepIndex = doc.inspection_rep.findIndex(
        (rep) =>
          rep.inspection_rep_name === inspection_rep_item.inspection_rep_name
      );

      if (existingRepIndex !== -1) {
        const repToUpdate = doc.inspection_rep[existingRepIndex];

        if (!Array.isArray(repToUpdate.inlineData)) {
          repToUpdate.inlineData = [];
        }

        if (
          inspection_rep_item.inlineData &&
          inspection_rep_item.inlineData.length > 0
        ) {
          repToUpdate.inlineData.push(inspection_rep_item.inlineData[0]);
        }

        repToUpdate.inspection_rep_name =
          inspection_rep_item.inspection_rep_name;
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
          return res.status(400).json({
            message:
              "Maximum number of 5 inspection reports already recorded for this combination."
          });
        }
      }

      if (report_name && doc.report_name !== report_name) {
        doc.report_name = report_name;
      }

      await doc.save();
      res.status(200).json({
        message: "QC Inline Roving data updated successfully.",
        data: doc
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

      initialRepItem.complete_inspect_operators =
        initialRepItem.inlineData.length;
      initialRepItem.Inspect_status =
        initialRepItem.total_operators > 0 &&
        initialRepItem.complete_inspect_operators >=
          initialRepItem.total_operators
          ? "Completed"
          : "Not Complete";

      const newQCInlineRovingDoc = new QCInlineRoving({
        inline_roving_id: newId,
        report_name:
          report_name ||
          `Report for ${inspection_date} - ${line_no} - ${mo_no}`,
        inspection_date,
        mo_no,
        line_no,
        inspection_rep: [initialRepItem]
      });

      await newQCInlineRovingDoc.save();
      res.status(201).json({
        message:
          "QC Inline Roving data saved successfully (new record created).",
        data: newQCInlineRovingDoc
      });
    }
  } catch (error) {
    console.error("Error saving/updating QC Inline Roving data:", error);
    res.status(500).json({
      message: "Failed to save/update QC Inline Roving data",
      error: error.message
    });
  }
});

/* ------------------------------
   QC Inline Roving Data / Reports
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

        const dateRegex = new RegExp(
          `^${monthRegexPart}\\/${dayRegexPart}\\/${year}$`
        );
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
    res.status(500).json({
      message: "Failed to fetch filtered reports",
      error: error.message
    });
  }
});

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
    const { startDate, endDate, line_no, mo_no, emp_id, buyer_name } =
      req.query;

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
    // In the report, qcId is passed as emp_id
    if (emp_id) {
      match["inspection_rep.emp_id"] = emp_id;
    }

    // First, fetch reports using the filters that can be applied at the database level
    const reportsFromDb = await QCInlineRoving.find(match);

    // *** NEW LOGIC: Apply the derived buyer filter after fetching from DB ***
    let finalFilteredReports = reportsFromDb;

    if (buyer_name) {
      finalFilteredReports = reportsFromDb.filter((report) => {
        // For each report, determine the buyer from its MO number
        const derivedBuyer = getBuyerFromMoNumber(report.mo_no);
        // Keep the report only if its derived buyer matches the filter
        return derivedBuyer === buyer_name;
      });
    }

    // Send the final, fully filtered data to the client
    res.json(finalFilteredReports);

    // const reports = await QCInlineRoving.find(match);
    // res.json(reports);
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

// --------------------------------------------------------------------------

// --- Helper function for sanitizing filenames ---
const sanitize = (input) => {
  if (typeof input !== "string") input = String(input);
  // Allow dots for file extensions but sanitize everything else
  let sane = input.replace(/[^a-zA-Z0-9-._]/g, "_");
  if (sane === "." || sane === "..") return "_";
  return sane;
};

// --------------------------------------------------------------------------
// Roving Image Upload (MODIFIED FOR PERFORMANCE)
// --------------------------------------------------------------------------

// 1. Use memoryStorage to handle the file in memory.
const rovingStorage = multer.memoryStorage();

// 2. Configure the multer instance.
const rovingUpload = multer({
  storage: rovingStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // Increase limit to 25MB for uncompressed files
});

// 3. The main endpoint, now with sharp processing.
app.post(
  "/api/roving/upload-roving-image",
  rovingUpload.single("imageFile"),
  async (req, res) => {
    try {
      // --- Validation ---
      const { imageType, date, lineNo, moNo, operationId } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          message: "No image file provided."
        });
      }

      if (!imageType || !date || !lineNo || !moNo || !operationId) {
        return res.status(400).json({
          success: false,
          message: "Missing required metadata fields for image."
        });
      }

      // --- File Saving Logic with Sharp ---
      const qcinlineUploadPath = path.join(
        __dirname,
        "public",
        "storage",
        "qcinline" // existing path is preserved
      );
      // await fsPromises.mkdir(qcinlineUploadPath, { recursive: true });

      // Sanitize metadata for the filename (existing logic is good)
      const sanitizedImageType = sanitize(imageType.toUpperCase());
      const sanitizedDate = sanitize(date);
      const sanitizedLineNo = sanitize(lineNo);
      const sanitizedMoNo = sanitize(moNo);
      const sanitizedOperationId = sanitize(operationId);

      // Construct the unique prefix
      const imagePrefix = `${sanitizedImageType}_${sanitizedDate}_${sanitizedLineNo}_${sanitizedMoNo}_${sanitizedOperationId}_`;

      // Find the next available index for this prefix
      const filesInDir = await fsPromises.readdir(qcinlineUploadPath);
      const existingImageCount = filesInDir.filter((f) =>
        f.startsWith(imagePrefix)
      ).length;
      const imageIndex = existingImageCount + 1;

      // Create the new filename with a .webp extension
      const newFilename = `${imagePrefix}${imageIndex}.webp`;
      const finalDiskPath = path.join(qcinlineUploadPath, newFilename);

      // Process the image from memory buffer with sharp and save to disk
      await sharp(imageFile.buffer)
        .resize({
          width: 1024,
          height: 1024,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(finalDiskPath);

      // Construct the public URL for the client
      const publicUrl = `${API_BASE_URL}/storage/qcinline/${newFilename}`;

      res.json({
        success: true,
        filePath: publicUrl,
        filename: newFilename
      });
    } catch (error) {
      console.error("Error in /api/roving/upload-roving-image:", error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `File upload error: ${error.message}`
        });
      }
      res.status(500).json({
        success: false,
        message: "Server error during image processing."
      });
    }
  }
);

/* ------------------------------
  USERS ENDPOINTS ---- Reporting
------------------------------ */

// Endpoint to fetch user data by emp_id
app.get("/api/user-by-emp-id", async (req, res) => {
  try {
    const empId = req.query.emp_id;
    if (!empId) {
      return res.status(400).json({ error: "emp_id is required" });
    }

    const user = await UserMain.findOne({ emp_id: empId }).exec(); // Use UserMain
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emp_id: user.emp_id,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name
    });
  } catch (err) {
    console.error("Error fetching user by emp_id:", err);
    res.status(500).json({
      message: "Failed to fetch user data",
      error: err.message
    });
  }
});

app.get("/api/users-paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const jobTitle = req.query.jobTitle || ""; // Optional jobTitle filter
    const empId = req.query.empId || ""; // Optional empId filter
    const section = req.query.section || ""; // Optional section filter

    // Build the query object
    const query = {};
    if (jobTitle) {
      query.job_title = jobTitle;
    }
    if (empId) {
      query.emp_id = empId;
    }
    if (section) {
      query.sect_name = section;
    }
    query.working_status = "Working"; // Ensure only working users are fetched

    // Fetch users with pagination and filters
    const users = await UserMain.find(query)
      .skip(skip)
      .limit(limit)
      .select("emp_id eng_name kh_name dept_name sect_name job_title")
      .exec();

    // Get total count for pagination (with filters applied)
    const total = await UserMain.countDocuments(query);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Error fetching paginated users:", err);
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message
    });
  }
});

app.get("/api/sections", async (req, res) => {
  try {
    const sections = await UserMain.distinct("sect_name", {
      working_status: "Working"
    });
    res.json(sections.filter((section) => section)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
});

/* ------------------------------
  QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

// Endpoint to fetch filtered QC1 Sunrise data for the dashboard
app.get("/api/sunrise/qc1-data", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    // Build the match stage for the aggregation pipeline
    const matchStage = {};

    // Other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) {
      matchStage["DefectArray.defectName"] = defectName;
    }

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Add a new field with the converted date
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
                "-",
                { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
                "-",
                { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate); // startDate is in YYYY-MM-DD
      const end = new Date(endDate); // endDate is in YYYY-MM-DD

      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          },
          ...matchStage // Include other filters
        }
      });
    } else {
      // If no date range, just apply other filters
      pipeline.push({
        $match: matchStage
      });
    }

    // Stage 3: Filter DefectArray to only include the selected defectName (if provided)
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

    // Stage 5: Sort by lineNo
    pipeline.push({
      $sort: { lineNo: 1 } // Sort by Line No (1 to 30)
    });

    // Fetch data from MongoDB using aggregation
    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Transform the inspectionDate to DD/MM/YYYY format for display
    const transformedData = data.map((item) => {
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

    // Build the match stage for the aggregation pipeline
    const matchStage = {};

    // Apply other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Add a new field with the converted date
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
                "-",
                { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
                "-",
                { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate); // startDate is in YYYY-MM-DD
      const end = new Date(endDate); // endDate is in YYYY-MM-DD

      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          },
          ...matchStage // Include other filters
        }
      });
    } else {
      // If no date range, just apply other filters
      pipeline.push({
        $match: matchStage
      });
    }

    // Fetch unique values for each filter using aggregation
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
        { $group: { _id: "$lineNo" } }
      ]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$MONo" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Color" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Size" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Buyer" } }]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $unwind: "$DefectArray" },
        { $group: { _id: "$DefectArray.defectName" } }
      ]).exec()
    ]);

    res.json({
      lineNos: uniqueLineNos
        .map((item) => item._id)
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b)), // Sort numerically
      MONos: uniqueMONos
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Colors: uniqueColors
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Sizes: uniqueSizes
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Buyers: uniqueBuyers
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      defectNames: uniqueDefectNames
        .map((item) => item._id)
        .filter(Boolean)
        .sort()
    });
  } catch (err) {
    console.error("Error fetching QC1 Sunrise filter values:", err);
    res.status(500).json({
      message: "Failed to fetch filter values",
      error: err.message
    });
  }
});

/* ------------------------------
   Cutting Inspection ENDPOINTS
------------------------------ */

app.post("/api/save-cutting-inspection", async (req, res) => {
  try {
    const {
      inspectionDate,
      cutting_emp_id,
      cutting_emp_engName,
      cutting_emp_khName,
      cutting_emp_dept,
      cutting_emp_section,
      moNo,
      tableNo,
      buyerStyle,
      buyer,
      color,
      lotNo,
      orderQty,
      totalOrderQtyStyle,
      fabricDetails,
      cuttingTableDetails,
      mackerRatio,
      totalBundleQty,
      bundleQtyCheck,
      totalInspectionQty,
      cuttingtype,
      garmentType,
      inspectionData
    } = req.body;

    // Basic validation
    if (!inspectionData || !Array.isArray(inspectionData)) {
      return res.status(400).json({ message: "Invalid inspectionData format" });
    }

    // Validate that each bundleInspectionData entry has measurementInsepctionData
    for (const data of inspectionData) {
      if (
        !data.bundleInspectionData ||
        !Array.isArray(data.bundleInspectionData)
      ) {
        return res
          .status(400)
          .json({ message: "Invalid bundleInspectionData format" });
      }
      for (const bundle of data.bundleInspectionData) {
        if (
          !bundle.measurementInsepctionData ||
          !Array.isArray(bundle.measurementInsepctionData)
        ) {
          return res.status(400).json({
            message: "Missing or invalid measurementInsepctionData for bundle"
          });
        }
      }
    }

    const existingDoc = await CuttingInspection.findOne({
      inspectionDate,
      moNo,
      tableNo,
      color
    });

    if (existingDoc) {
      existingDoc.inspectionData.push(...inspectionData);
      existingDoc.updated_at = new Date();
      await existingDoc.save();
      res.status(200).json({ message: "Data appended successfully" });
    } else {
      const newDoc = new CuttingInspection({
        inspectionDate,
        cutting_emp_id,
        cutting_emp_engName,
        cutting_emp_khName,
        cutting_emp_dept,
        cutting_emp_section,
        moNo,
        tableNo,
        buyerStyle,
        buyer,
        color,
        lotNo,
        orderQty,
        totalOrderQtyStyle,
        fabricDetails,
        cuttingTableDetails,
        mackerRatio,
        totalBundleQty,
        bundleQtyCheck,
        totalInspectionQty,
        cuttingtype,
        garmentType,
        inspectionData
      });
      await newDoc.save();
      res.status(200).json({ message: "Data saved successfully" });
    }
  } catch (error) {
    console.error("Error saving cutting inspection data:", error);
    res
      .status(500)
      .json({ message: "Failed to save data", error: error.message });
  }
});

app.get("/api/cutting-inspection-progress", async (req, res) => {
  try {
    const { moNo, tableNo, garmentType } = req.query;

    // Validate required query parameters
    if (!moNo || !tableNo || !garmentType) {
      return res
        .status(400)
        .json({ message: "moNo, tableNo, and garmentType are required" });
    }

    // Find the inspection document
    const inspection = await CuttingInspection.findOne({
      moNo,
      tableNo,
      garmentType
    });

    if (!inspection) {
      return res.status(200).json({
        progress: null,
        inspectedSizes: [],
        message: "No inspection record found"
      });
    }

    // Calculate progress and stats
    const bundleQtyCheck = inspection.bundleQtyCheck || 0;
    let completedBundles = 0;
    let totalInspected = 0;
    let totalPass = 0;
    let totalReject = 0;
    const inspectedSizes = [];

    // Iterate through inspectionData to aggregate stats
    if (inspection.inspectionData && Array.isArray(inspection.inspectionData)) {
      inspection.inspectionData.forEach((data) => {
        if (data.inspectedSize) {
          inspectedSizes.push(data.inspectedSize);
        }
        if (data.bundleQtyCheckSize) {
          completedBundles += data.bundleQtyCheckSize;
        }
        if (data.pcsSize && data.pcsSize.total) {
          totalInspected += data.pcsSize.total;
        }
        if (data.passSize && data.passSize.total) {
          totalPass += data.passSize.total;
        }
        if (data.rejectSize && data.rejectSize.total) {
          totalReject += data.rejectSize.total;
        }
      });
    }

    // Calculate pass rate
    const passRate =
      totalInspected > 0 ? (totalPass / totalInspected) * 100 : 0;

    // Prepare response
    const progress = {
      completed: completedBundles,
      total: bundleQtyCheck,
      inspected: totalInspected,
      pass: totalPass,
      reject: totalReject,
      passRate: parseFloat(passRate.toFixed(2))
    };

    res.status(200).json({
      progress,
      inspectedSizes: [...new Set(inspectedSizes)], // Remove duplicates
      message: "Inspection progress retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching cutting inspection progress:", error);
    res.status(500).json({
      message: "Failed to fetch inspection progress",
      error: error.message
    });
  }
});

// GET unique MO Numbers from cuttinginspections
app.get("/api/cutting-inspections/mo-numbers", async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { moNo: { $regex: search, $options: "i" } } : {};
    const moNumbers = await CuttingInspection.distinct("moNo", query);
    res.json(moNumbers.sort());
  } catch (error) {
    console.error("Error fetching MO numbers from cutting inspections:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch MO numbers", error: error.message });
  }
});

// GET unique Table Numbers for a given MO from cuttinginspections
app.get("/api/cutting-inspections/table-numbers", async (req, res) => {
  try {
    const { moNo, search } = req.query;
    if (!moNo) {
      return res.status(400).json({ message: "MO Number is required" });
    }
    const query = { moNo };
    if (search) {
      query.tableNo = { $regex: search, $options: "i" };
    }
    const tableNumbers = await CuttingInspection.distinct("tableNo", query);
    res.json(tableNumbers.sort());
  } catch (error) {
    console.error(
      "Error fetching Table numbers from cutting inspections:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch Table numbers", error: error.message });
  }
});

// GET full cutting inspection document for modification
app.get("/api/cutting-inspection-details-for-modify", async (req, res) => {
  try {
    const { moNo, tableNo } = req.query;
    if (!moNo || !tableNo) {
      return res
        .status(400)
        .json({ message: "MO Number and Table Number are required" });
    }
    // To ensure we get the garmentType, we might need to fetch based on a unique combination if color is involved
    // For simplicity, assuming moNo and tableNo are enough to find a unique parent document.
    // If multiple documents can exist for moNo+tableNo (e.g. different colors), add color to query.
    const inspectionDoc = await CuttingInspection.findOne({ moNo, tableNo });
    if (!inspectionDoc) {
      return res.status(404).json({ message: "Inspection document not found" });
    }
    res.json(inspectionDoc);
  } catch (error) {
    console.error("Error fetching inspection details for modify:", error);
    res.status(500).json({
      message: "Failed to fetch inspection details",
      error: error.message
    });
  }
});

// PUT update cutting inspection document
app.put("/api/cutting-inspection-update", async (req, res) => {
  try {
    const { moNo, tableNo, updatedFields, updatedInspectionDataItem } =
      req.body;

    if (!moNo || !tableNo) {
      return res.status(400).json({
        message: "MO Number and Table Number are required for update."
      });
    }
    if (
      !updatedInspectionDataItem ||
      !updatedInspectionDataItem.inspectedSize
    ) {
      return res.status(400).json({
        message:
          "Valid 'updatedInspectionDataItem' with 'inspectedSize' is required."
      });
    }

    const inspectionDoc = await CuttingInspection.findOne({ moNo, tableNo });

    if (!inspectionDoc) {
      return res
        .status(404)
        .json({ message: "Inspection document not found to update." });
    }

    // Update top-level fields if provided
    if (updatedFields) {
      if (updatedFields.totalBundleQty !== undefined)
        inspectionDoc.totalBundleQty = updatedFields.totalBundleQty;
      if (updatedFields.bundleQtyCheck !== undefined)
        inspectionDoc.bundleQtyCheck = updatedFields.bundleQtyCheck;
      if (updatedFields.totalInspectionQty !== undefined)
        inspectionDoc.totalInspectionQty = updatedFields.totalInspectionQty;
      if (updatedFields.cuttingtype !== undefined)
        inspectionDoc.cuttingtype = updatedFields.cuttingtype;
      // Potentially mackerRatio if it becomes editable
    }

    // Find and update the specific item in inspectionData array
    const itemIndex = inspectionDoc.inspectionData.findIndex(
      (item) => item.inspectedSize === updatedInspectionDataItem.inspectedSize
    );

    if (itemIndex > -1) {
      // Ensure all nested structures are preserved or correctly updated
      // The updatedInspectionDataItem comes from the client and should be complete for that size.
      inspectionDoc.inspectionData[itemIndex] = {
        ...inspectionDoc.inspectionData[itemIndex], // Preserve any fields not sent from client (like _id)
        ...updatedInspectionDataItem, // Apply all changes from client
        updated_at: new Date() // Ensure updated_at is set here
      };
    } else {
      // This case means the client is trying to update a size that doesn't exist in the DB record's inspectionData.
      // Depending on requirements, you could add it or return an error.
      // For "modify", usually it means the item should exist.
      // If adding new sizes is allowed through this "modify" screen, then:
      // inspectionDoc.inspectionData.push({ ...updatedInspectionDataItem, created_at: new Date(), updated_at: new Date() });
      return res.status(400).json({
        message: `Inspection data for size ${updatedInspectionDataItem.inspectedSize} not found in the document. Cannot update.`
      });
    }

    inspectionDoc.updated_at = new Date(); // Update top-level document timestamp
    inspectionDoc.markModified("inspectionData"); // Important for nested array updates

    await inspectionDoc.save();

    res.status(200).json({
      message: "Cutting inspection data updated successfully.",
      data: inspectionDoc
    });
  } catch (error) {
    console.error("Error updating cutting inspection data:", error);
    res.status(500).json({
      message: "Failed to update cutting inspection data",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - Pairing Defects
------------------------------ */

// GET - Fetch all Pairing Defects
app.get("/api/pairing-defects", async (req, res) => {
  try {
    const defects = await PairingDefect.find({}).sort({ no: 1 }).lean(); // Fetch all defects, sorted by 'no'
    res.json(defects);
  } catch (error) {
    console.error("Error fetching Pairing defects:", error);
    res.status(500).json({ message: "Server error fetching defects" });
  }
});

// POST - Add a new Pairing defect
app.post("/api/pairing-defects", async (req, res) => {
  try {
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !defectNameEng ||
      !defectNameKhmer ||
      !defectNameChinese
    ) {
      return res.status(400).json({
        message:
          "Defect No, English Name, Khmer Name, and Chinese Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    // Check for duplicate 'no'
    const existingDefectByNo = await PairingDefect.findOne({ no: Number(no) });
    if (existingDefectByNo) {
      return res
        .status(409)
        .json({ message: `Defect No '${no}' already exists.` });
    }
    // Check for duplicate English name
    const existingDefectByName = await PairingDefect.findOne({ defectNameEng });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newPairingDefect = new PairingDefect({
      no: Number(no),
      defectNameEng,
      defectNameKhmer,
      defectNameChinese
    });
    await newPairingDefect.save();
    res.status(201).json({
      message: "Pairing defect added successfully",
      defect: newPairingDefect
    });
  } catch (error) {
    console.error("Error adding Pairing defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Defect No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add Pairing defect", error: error.message });
  }
});

// PUT - Update an existing Pairing defect by ID
app.put("/api/pairing-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !defectNameEng ||
      !defectNameKhmer ||
      !defectNameChinese
    ) {
      return res.status(400).json({
        message:
          "Defect No, English Name, Khmer Name, and Chinese Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    // Check for duplicate 'no' (excluding the current document being updated)
    const existingDefectByNo = await PairingDefect.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingDefectByNo) {
      return res.status(409).json({
        message: `Defect No '${no}' already exists for another defect.`
      });
    }
    // Check for duplicate English name (excluding the current document)
    const existingDefectByName = await PairingDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedPairingDefect = await PairingDefect.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChinese
      },
      { new: true, runValidators: true }
    );

    if (!updatedPairingDefect) {
      return res.status(404).json({ message: "Pairing Defect not found." });
    }
    res.status(200).json({
      message: "Pairing defect updated successfully",
      defect: updatedPairingDefect
    });
  } catch (error) {
    console.error("Error updating Pairing defect:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate Defect No or Name." });
    }
    res.status(500).json({
      message: "Failed to update Pairing defect",
      error: error.message
    });
  }
});

// DELETE - Delete a Pairing defect by ID
app.delete("/api/pairing-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    const deletedPairingDefect = await PairingDefect.findByIdAndDelete(id);
    if (!deletedPairingDefect) {
      return res.status(404).json({ message: "Pairing Defect not found." });
    }
    res.status(200).json({ message: "Pairing defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting Pairing defect:", error);
    res.status(500).json({
      message: "Failed to delete Pairing defect",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - Accessory Issues
------------------------------ */

// GET - Fetch all Accessory Issues
app.get("/api/accessory-issues", async (req, res) => {
  try {
    const issues = await AccessoryIssue.find({}).sort({ no: 1 }).lean();
    res.json(issues);
  } catch (error) {
    console.error("Error fetching Accessory issues:", error);
    res.status(500).json({ message: "Server error fetching issues" });
  }
});

// POST - Add a new Accessory issue
app.post("/api/accessory-issues", async (req, res) => {
  try {
    const { no, issueEng, issueKhmer, issueChi } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !issueEng ||
      !issueKhmer ||
      !issueChi
    ) {
      return res.status(400).json({
        message:
          "Issue No, English Name, Khmer Name, and Chinese Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Issue No must be a positive number." });
    }

    // Check for duplicate 'no'
    const existingIssueByNo = await AccessoryIssue.findOne({ no: Number(no) });
    if (existingIssueByNo) {
      return res
        .status(409)
        .json({ message: `Issue No '${no}' already exists.` });
    }
    // Check for duplicate English name
    const existingIssueByName = await AccessoryIssue.findOne({ issueEng });
    if (existingIssueByName) {
      return res.status(409).json({
        message: `Issue name (English) '${issueEng}' already exists.`
      });
    }

    const newAccessoryIssue = new AccessoryIssue({
      no: Number(no),
      issueEng,
      issueKhmer,
      issueChi
    });
    await newAccessoryIssue.save();
    res.status(201).json({
      message: "Accessory issue added successfully",
      issue: newAccessoryIssue
    });
  } catch (error) {
    console.error("Error adding Accessory issue:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Issue No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add Accessory issue", error: error.message });
  }
});

// PUT - Update an existing Accessory issue by ID
app.put("/api/accessory-issues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { no, issueEng, issueKhmer, issueChi } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !issueEng ||
      !issueKhmer ||
      !issueChi
    ) {
      return res.status(400).json({
        message:
          "Issue No, English Name, Khmer Name, and Chinese Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Issue No must be a positive number." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID format." });
    }

    // Check for duplicate 'no' (excluding the current document)
    const existingIssueByNo = await AccessoryIssue.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingIssueByNo) {
      return res.status(409).json({
        message: `Issue No '${no}' already exists for another issue.`
      });
    }
    // Check for duplicate English name (excluding the current document)
    const existingIssueByName = await AccessoryIssue.findOne({
      issueEng,
      _id: { $ne: id }
    });
    if (existingIssueByName) {
      return res.status(409).json({
        message: `Issue name (English) '${issueEng}' already exists for another issue.`
      });
    }

    const updatedAccessoryIssue = await AccessoryIssue.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        issueEng,
        issueKhmer,
        issueChi
      },
      { new: true, runValidators: true }
    );

    if (!updatedAccessoryIssue) {
      return res.status(404).json({ message: "Accessory Issue not found." });
    }
    res.status(200).json({
      message: "Accessory issue updated successfully",
      issue: updatedAccessoryIssue
    });
  } catch (error) {
    console.error("Error updating Accessory issue:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate Issue No or Name." });
    }
    res.status(500).json({
      message: "Failed to update Accessory issue",
      error: error.message
    });
  }
});

// DELETE - Delete an Accessory issue by ID
app.delete("/api/accessory-issues/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID format." });
    }

    const deletedAccessoryIssue = await AccessoryIssue.findByIdAndDelete(id);
    if (!deletedAccessoryIssue) {
      return res.status(404).json({ message: "Accessory Issue not found." });
    }
    res.status(200).json({ message: "Accessory issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting Accessory issue:", error);
    res.status(500).json({
      message: "Failed to delete Accessory issue",
      error: error.message
    });
  }
});

/* ------------------------------
   QC Roving Pairing Endpoint
------------------------------ */

app.post("/api/save-qc-roving-pairing", async (req, res) => {
  try {
    const {
      inspection_date,
      moNo,
      lineNo,
      report_name,
      emp_id,
      eng_name,
      operationNo,
      operationName,
      operationName_kh,
      pairingDataItem
    } = req.body;

    // --- Basic Validation ---
    if (!inspection_date || !moNo || !lineNo || !pairingDataItem || !emp_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (
      typeof pairingDataItem !== "object" ||
      !pairingDataItem.inspection_rep_name
    ) {
      return res.status(400).json({
        message: "pairingDataItem is malformed or missing inspection_rep_name."
      });
    }

    // ---------------------------------------------------------------------

    if (
      pairingDataItem.accessoryComplete === "No" &&
      !Array.isArray(pairingDataItem.accessoryIssues)
    ) {
      return res.status(400).json({
        message:
          "Accessory status is 'No' but the list of accessory issues is missing or not an array."
      });
    }
    // If accessory is complete, ensure the issues array is empty.
    if (pairingDataItem.accessoryComplete === "Yes") {
      pairingDataItem.accessoryIssues = [];
    }

    // ---------------------------------------------------------------------

    //Add the current server timestamp to the object from the frontend
    pairingDataItem.inspectionTime = new Date();

    // --- Find or Create Document ---
    let doc = await QCRovingPairing.findOne({ inspection_date, moNo, lineNo });

    if (doc) {
      // Document exists, update it
      const existingRepIndex = doc.pairingData.findIndex(
        (rep) => rep.inspection_rep_name === pairingDataItem.inspection_rep_name
      );

      if (existingRepIndex !== -1) {
        // This inspection repetition already exists, so we overwrite it.
        doc.pairingData[existingRepIndex] = pairingDataItem;
      } else {
        // This is a new inspection repetition for this document, add it.
        doc.pairingData.push(pairingDataItem);
      }

      // Sort pairingData by inspection_rep_name (e.g., "1st", "2nd")
      doc.pairingData.sort((a, b) => {
        const numA = parseInt(a.inspection_rep_name, 10);
        const numB = parseInt(b.inspection_rep_name, 10);
        return numA - numB;
      });

      await doc.save();
      res.status(200).json({
        message: "QC Roving Pairing data updated successfully.",
        data: doc
      });
    } else {
      // Document does not exist, create a new one
      const lastDoc = await QCRovingPairing.findOne().sort({ pairing_id: -1 });
      const newId =
        lastDoc && typeof lastDoc.pairing_id === "number"
          ? lastDoc.pairing_id + 1
          : 1;

      const newDoc = new QCRovingPairing({
        pairing_id: newId,
        report_name,
        inspection_date,
        moNo,
        lineNo,
        emp_id,
        eng_name,
        operationNo,
        operationName,
        operationName_kh,
        pairingData: [pairingDataItem] // Start with the first item
      });

      await newDoc.save();
      res.status(201).json({
        message: "New QC Roving Pairing record created successfully.",
        data: newDoc
      });
    }
  } catch (error) {
    console.error("Error saving QC Roving Pairing data:", error);
    res.status(500).json({
      message: "Failed to save QC Roving Pairing data.",
      error: error.message
    });
  }
});

/* -------------------------------------------------------------------------- */
/*             NEW ENDPOINTS FOR ROVING PAIRING DATA REPORT                   */
/* -------------------------------------------------------------------------- */

// --- Endpoint to get dynamic filter options ---
app.get("/api/roving-pairing/filters", async (req, res) => {
  try {
    const { date } = req.query; // Expecting date in 'M/D/YYYY' format
    if (!date) {
      return res.status(400).json({ message: "Date is a required parameter." });
    }

    const matchQuery = { inspection_date: date };

    const [uniqueQCs, uniqueOperators, uniqueLines, uniqueMOs] =
      await Promise.all([
        // Get unique QC IDs (emp_id)
        QCRovingPairing.distinct("emp_id", matchQuery),
        // Get unique Operator IDs (operator_emp_id)
        QCRovingPairing.distinct("pairingData.operator_emp_id", matchQuery),
        // Get unique Line Numbers
        QCRovingPairing.distinct("lineNo", matchQuery),
        // Get unique MO Numbers
        QCRovingPairing.distinct("moNo", matchQuery)
      ]);

    res.json({
      qcIds: uniqueQCs.sort(),
      operatorIds: uniqueOperators.sort(),
      lineNos: uniqueLines.sort((a, b) => Number(a) - Number(b)),
      moNos: uniqueMOs.sort()
    });
  } catch (error) {
    console.error("Error fetching filter options for Roving Pairing:", error);
    res.status(500).json({
      message: "Failed to fetch filter options.",
      error: error.message
    });
  }
});

// --- Endpoint to get aggregated data for the report table ---
app.get("/api/roving-pairing/report-data", async (req, res) => {
  try {
    const { date, qcId, operatorId, lineNo, moNo } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    // Build the initial match pipeline stage
    const matchPipeline = { inspection_date: date };
    if (qcId) matchPipeline.emp_id = qcId;
    if (lineNo) matchPipeline.lineNo = lineNo;
    if (moNo) matchPipeline.moNo = moNo;

    const pipeline = [{ $match: matchPipeline }, { $unwind: "$pairingData" }];

    if (operatorId) {
      pipeline.push({
        $match: { "pairingData.operator_emp_id": operatorId }
      });
    }

    pipeline.push({
      $group: {
        _id: {
          operatorId: "$pairingData.operator_emp_id",
          lineNo: "$lineNo",
          moNo: "$moNo"
        },
        operatorName: { $first: "$pairingData.operator_eng_name" },
        inspections: {
          $push: {
            rep_name: "$pairingData.inspection_rep_name",
            accessoryComplete: "$pairingData.accessoryComplete",
            totalSummary: "$pairingData.totalSummary"
          }
        }
      }
    });

    // **** START OF CORRECTION ****
    // The keys being accessed here now correctly match the keys defined in the $group stage's _id object.
    pipeline.push({
      $project: {
        _id: 0,
        operatorId: "$_id.operatorId", // Was "$_id.opId"
        lineNo: "$_id.lineNo", // Was "$_id.line"
        moNo: "$_id.moNo", // Was "$_id.mo"
        operatorName: "$operatorName",
        inspections: "$inspections"
      }
    });
    // **** END OF CORRECTION ****

    pipeline.push({ $sort: { lineNo: 1, moNo: 1, operatorId: 1 } });

    const reportData = await QCRovingPairing.aggregate(pipeline);

    res.json(reportData);
  } catch (error) {
    console.error("Error fetching report data for Roving Pairing:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch report data.", error: error.message });
  }
});

/* ------------------------------
   Cutting Report ENDPOINTS
------------------------------ */

// Helper to build the buyer logic for aggregation
const getBuyerAggregationSwitch = () => {
  return {
    $switch: {
      branches: [
        {
          case: { $regexMatch: { input: "$moNo", regex: "COM" } },
          then: "MWW"
        },
        {
          case: { $regexMatch: { input: "$moNo", regex: "CO" } },
          then: "Costco"
        },
        {
          case: { $regexMatch: { input: "$moNo", regex: "AR" } },
          then: "Aritzia"
        },
        {
          case: { $regexMatch: { input: "$moNo", regex: "RT" } },
          then: "Reitmans"
        },
        { case: { $regexMatch: { input: "$moNo", regex: "AF" } }, then: "ANF" },
        {
          case: { $regexMatch: { input: "$moNo", regex: "NT" } },
          then: "STORI"
        }
      ],
      default: "Other"
    }
  };
};

// Helper to build the main match pipeline based on filters
const buildReportMatchPipeline = (filters) => {
  const {
    startDate,
    endDate,
    buyer,
    moNo,
    tableNo,
    qcId,
    color,
    garmentType,
    spreadTable,
    material
  } = filters;

  const pipeline = [];
  const match = {};

  // Add buyer field first
  pipeline.push({ $addFields: { buyer: getBuyerAggregationSwitch() } });

  // Build match conditions
  if (buyer) match.buyer = buyer;
  if (moNo) match.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) match.tableNo = tableNo;
  if (qcId) match.cutting_emp_id = qcId;
  if (color) match.color = color;
  if (garmentType) match.garmentType = garmentType;
  if (spreadTable) match["cuttingTableDetails.spreadTable"] = spreadTable;
  if (material) match["fabricDetails.material"] = material;

  // Date filtering
  if (startDate || endDate) {
    match.$expr = match.$expr || {};
    match.$expr.$and = match.$expr.$and || [];
    const dateFromStringExpr = {
      $dateFromString: {
        dateString: "$inspectionDate",
        format: "%m/%d/%Y",
        onError: new Date(0),
        onNull: new Date(0)
      }
    };

    if (startDate) {
      match.$expr.$and.push({
        $gte: [
          dateFromStringExpr,
          new Date(new Date(startDate).setHours(0, 0, 0, 0))
        ]
      });
    }
    if (endDate) {
      match.$expr.$and.push({
        $lte: [
          dateFromStringExpr,
          new Date(new Date(endDate).setHours(23, 59, 59, 999))
        ]
      });
    }
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  return pipeline;
};

/* ------------------------------
   Cutting Report ENDPOINTS
------------------------------ */

// GET Dynamic Filter Options for the Report Page
app.get("/api/cutting-report-filter-options", async (req, res) => {
  try {
    const pipeline = buildReportMatchPipeline(req.query);

    pipeline.push({
      $facet: {
        moNos: [
          { $group: { _id: "$moNo" } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, value: "$_id", label: "$_id" } }
        ],
        tableNos: [
          { $group: { _id: "$tableNo" } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, value: "$_id", label: "$_id" } }
        ],
        colors: [
          { $group: { _id: "$color" } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, value: "$_id", label: "$_id" } }
        ],
        garmentTypes: [
          { $group: { _id: "$garmentType" } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, value: "$_id", label: "$_id" } }
        ],
        spreadTables: [
          { $group: { _id: "$cuttingTableDetails.spreadTable" } },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, value: "$_id", label: "$_id" } }
        ],
        materials: [
          { $group: { _id: "$fabricDetails.material" } },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, value: "$_id", label: "$_id" } }
        ]
      }
    });

    const result = await CuttingInspection.aggregate(pipeline);
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching cutting report filter options:", error);
    res.status(500).json({
      message: "Failed to fetch filter options",
      error: error.message
    });
  }
});

// GET QC IDs (cutting_emp_id and names) from cuttinginspections
app.get("/api/cutting-inspections/qc-inspectors", async (req, res) => {
  try {
    const inspectors = await CuttingInspection.aggregate([
      {
        $group: {
          _id: "$cutting_emp_id",
          engName: { $first: "$cutting_emp_engName" },
          khName: { $first: "$cutting_emp_khName" }
        }
      },
      {
        $project: {
          _id: 0,
          emp_id: "$_id",
          eng_name: "$engName",
          kh_name: "$khName"
        }
      },
      { $sort: { emp_id: 1 } }
    ]);
    res.json(inspectors);
  } catch (error) {
    console.error(
      "Error fetching QC inspectors from cutting inspections:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch QC inspectors", error: error.message });
  }
});

// GET Paginated Cutting Inspection Reports (MODIFIED)
app.get("/api/cutting-inspections-report", async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;

    const pipeline = buildReportMatchPipeline(req.query);
    const countPipeline = [...pipeline]; // For counting total documents

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add sorting, skipping, and limiting for the data fetch
    pipeline.push(
      {
        $addFields: {
          convertedDate: {
            $dateFromString: {
              dateString: "$inspectionDate",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          }
        }
      },
      { $sort: { convertedDate: -1, moNo: 1, tableNo: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          inspectionDate: 1,
          buyer: 1,
          moNo: 1,
          tableNo: 1,
          buyerStyle: 1, // Cust. Style
          cuttingTableDetails: 1, // For Spread Table, Layer Details, Macker No
          fabricDetails: 1, // For Material
          lotNo: 1,
          cutting_emp_id: 1,
          color: 1,
          garmentType: 1,
          mackerRatio: 1,
          totalBundleQty: 1,
          bundleQtyCheck: 1,
          totalInspectionQty: 1,
          numberOfInspectedSizes: {
            $size: { $ifNull: ["$inspectionData", []] }
          },
          sumTotalPcs: { $sum: "$inspectionData.totalPcsSize" },
          sumTotalPass: { $sum: "$inspectionData.passSize.total" },
          sumTotalReject: { $sum: "$inspectionData.rejectSize.total" },
          sumTotalRejectMeasurement: {
            $sum: "$inspectionData.rejectMeasurementSize.total"
          },
          sumTotalRejectDefects: {
            $sum: "$inspectionData.rejectGarmentSize.total"
          }
        }
      },
      {
        $addFields: {
          overallPassRate: {
            $cond: [
              { $gt: ["$sumTotalPcs", 0] },
              {
                $multiply: [{ $divide: ["$sumTotalPass", "$sumTotalPcs"] }, 100]
              },
              0
            ]
          }
        }
      }
    );

    const reports = await CuttingInspection.aggregate(pipeline);

    // Get total count
    countPipeline.push({ $count: "total" });
    const countResult = await CuttingInspection.aggregate(countPipeline);
    const totalDocuments = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
      reports,
      totalPages: Math.ceil(totalDocuments / parseInt(limit)),
      currentPage: parseInt(page),
      totalReports: totalDocuments
    });
  } catch (error) {
    console.error("Error fetching cutting inspection reports:", error);
    res.status(500).json({
      message: "Failed to fetch cutting inspection reports",
      error: error.message
    });
  }
});

// GET Single Cutting Inspection Report Detail (remains the same)
app.get("/api/cutting-inspection-report-detail/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID format" });
    }
    const report = await CuttingInspection.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (error) {
    console.error("Error fetching cutting inspection report detail:", error);
    res.status(500).json({
      message: "Failed to fetch report detail",
      error: error.message
    });
  }
});

// Get summarized measurement issues for a specific report
app.get("/api/cutting-report-measurement-issues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID format" });
    }

    const measurementIssuesPipeline = [
      // Step 1: Match the specific report document
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Step 2: Deconstruct the nested arrays to get to individual measurements
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
      },

      // Step 3: Filter for only the measurements that have a status of "Fail"
      {
        $match: {
          "inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status":
            "Fail"
        }
      },

      // Step 4: Group the results by Inspected Size and Measurement Point Name
      {
        $group: {
          _id: {
            inspectedSize: "$inspectionData.inspectedSize",
            measurementPointName:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName"
          },
          // Create an array of all the failed values with their context
          measuredValues: {
            $push: {
              value:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuefraction",

              bundleNo: "$inspectionData.bundleInspectionData.bundleNo",
              pcsName:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.pcsName",
              //partNo: "$inspectionData.bundleInspectionData.measurementInsepctionData.partNo",
              valuedecimal:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal"
            }
          }
        }
      },

      // Step 5: Reshape the data and calculate counts
      {
        $project: {
          _id: 0,
          inspectedSize: "$_id.inspectedSize",
          measurementPointName: "$_id.measurementPointName",
          measuredValues: 1,
          totalCount: { $size: "$measuredValues" },
          totalNegTol: {
            $sum: {
              $map: {
                input: "$measuredValues",
                as: "mv",
                in: { $cond: [{ $lt: ["$$mv.valuedecimal", 0] }, 1, 0] }
              }
            }
          },
          totalPosTol: {
            $sum: {
              $map: {
                input: "$measuredValues",
                as: "mv",
                in: { $cond: [{ $gt: ["$$mv.valuedecimal", 0] }, 1, 0] }
              }
            }
          }
        }
      },
      // Step 6: Sort the final results for consistent display
      { $sort: { inspectedSize: 1, measurementPointName: 1 } }
    ];

    const issues = await CuttingInspection.aggregate(measurementIssuesPipeline);
    res.json(issues);
  } catch (error) {
    console.error("Error fetching measurement issues:", error);
    res.status(500).json({
      message: "Failed to fetch measurement issues",
      error: error.message
    });
  }
});

/* ------------------------------
   Cutting Old ENDPOINTS - START
------------------------------ */

//Old endpoint remove later

app.get("/api/cutting-inspection-detailed-report", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      lotNo,
      buyer,
      color,
      tableNo,
      page = 0,
      limit = 1
    } = req.query;

    let match = {};

    // Date filtering
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
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
                dateString: "$inspectionDate",
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

    // Other filters with case-insensitive regex
    if (moNo) match.moNo = new RegExp(moNo, "i");
    if (lotNo) match.lotNo = new RegExp(lotNo, "i");
    if (buyer) match.buyer = new RegExp(buyer, "i");
    if (color) match.color = new RegExp(color, "i");
    if (tableNo) match.tableNo = new RegExp(tableNo, "i");

    const totalDocs = await CuttingInspection.countDocuments(match);
    const totalPages = Math.ceil(totalDocs / limit);

    const inspections = await CuttingInspection.find(match)
      .skip(page * limit)
      .limit(parseInt(limit))
      .lean();

    // Calculate summary data for each inspection
    inspections.forEach((inspection) => {
      let totalPcs = 0;
      let totalPass = 0;
      let totalReject = 0;
      let totalRejectMeasurement = 0;
      let totalRejectDefects = 0;

      inspection.inspectionData.forEach((data) => {
        totalPcs += data.totalPcs;
        totalPass += data.totalPass;
        totalReject += data.totalReject;
        totalRejectMeasurement += data.totalRejectMeasurement;
        totalRejectDefects += data.totalRejectDefects;
      });

      const passRate =
        totalPcs > 0 ? ((totalPass / totalPcs) * 100).toFixed(2) : "0.00";
      const result = getResult(inspection.bundleQtyCheck, totalReject);

      inspection.summary = {
        totalPcs,
        totalPass,
        totalReject,
        totalRejectMeasurement,
        totalRejectDefects,
        passRate,
        result
      };
    });

    res.status(200).json({ data: inspections, totalPages });
  } catch (error) {
    console.error("Error fetching detailed cutting inspection report:", error);
    res.status(500).json({
      message: "Failed to fetch detailed report",
      error: error.message
    });
  }
});

// Helper function to determine AQL result
function getResult(bundleQtyCheck, totalReject) {
  if (bundleQtyCheck === 5) return totalReject > 1 ? "Fail" : "Pass";
  if (bundleQtyCheck === 9) return totalReject > 3 ? "Fail" : "Pass";
  if (bundleQtyCheck === 14) return totalReject > 5 ? "Fail" : "Pass";
  if (bundleQtyCheck === 20) return totalReject > 7 ? "Fail" : "Pass";
  return "N/A";
}

// Endpoint to fetch distinct MO Nos
app.get("/api/cutting-inspection-mo-nos", async (req, res) => {
  try {
    const moNos = await CuttingInspection.distinct("moNo");
    res.json(moNos.filter((mo) => mo));
  } catch (error) {
    console.error("Error fetching MO Nos:", error);
    res.status(500).json({ message: "Failed to fetch MO Nos" });
  }
});

// Endpoint to fetch distinct filter options based on MO No
app.get("/api/cutting-inspection-filter-options", async (req, res) => {
  try {
    const { moNo } = req.query;
    let match = {};
    if (moNo) match.moNo = new RegExp(moNo, "i");

    const lotNos = await CuttingInspection.distinct("lotNo", match);
    const buyers = await CuttingInspection.distinct("buyer", match); // Add buyer filter options
    const colors = await CuttingInspection.distinct("color", match);
    const tableNos = await CuttingInspection.distinct("tableNo", match);

    res.json({
      lotNos: lotNos.filter((lot) => lot),
      buyers: buyers.filter((buyer) => buyer), // Return distinct buyers
      colors: colors.filter((color) => color),
      tableNos: tableNos.filter((table) => table)
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ message: "Failed to fetch filter options" });
  }
});

/* ------------------------------
   Cutting Old ENDPOINTS - END
------------------------------ */

/* ------------------------------
   Cutting Measurement Points
------------------------------ */

app.get("/api/cutting-measurement-panels", async (req, res) => {
  try {
    /* CHANGE: Fetch panel, panelKhmer, and panelChinese for multilingual support */
    const panels = await CuttingMeasurementPoint.aggregate([
      {
        $group: {
          _id: "$panel",
          panelKhmer: { $first: "$panelKhmer" },
          panelChinese: { $first: "$panelChinese" }
        }
      },
      {
        $project: {
          panel: "$_id",
          panelKhmer: 1,
          panelChinese: 1,
          _id: 0
        }
      },
      { $sort: { panel: 1 } }
    ]).exec();
    res.status(200).json(panels);
  } catch (error) {
    console.error("Error fetching panels:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch panels", error: error.message });
  }
});

// Endpoint to fetch panelIndexNames and related data for a given panel
app.get("/api/cutting-measurement-panel-index-names", async (req, res) => {
  try {
    const { panel } = req.query;
    if (!panel) {
      return res.status(400).json({ message: "Panel is required" });
    }
    // Aggregate to get unique panelIndexName with their latest panelIndex and panelIndexNameKhmer
    const panelIndexData = await CuttingMeasurementPoint.aggregate([
      { $match: { panel } },
      {
        $group: {
          _id: "$panelIndexName",
          panelIndex: { $max: "$panelIndex" },
          panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
          panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
        }
      },
      {
        $project: {
          panelIndexName: "$_id",
          panelIndex: 1,
          panelIndexNameKhmer: 1,
          panelIndexNameChinese: 1,
          _id: 0
        }
      },
      { $sort: { panelIndexName: 1 } }
    ]).exec();
    res.status(200).json(panelIndexData);
  } catch (error) {
    console.error("Error fetching panel index names:", error);
    res.status(500).json({
      message: "Failed to fetch panel index names",
      error: error.message
    });
  }
});

// Endpoint to fetch max panelIndex for a given panel
app.get("/api/cutting-measurement-max-panel-index", async (req, res) => {
  try {
    const { panel } = req.query;
    if (!panel) {
      return res.status(400).json({ message: "Panel is required" });
    }
    const maxPanelIndexDoc = await CuttingMeasurementPoint.findOne({
      panel
    })
      .sort({ panelIndex: -1 })
      .select("panelIndex");
    const maxPanelIndex = maxPanelIndexDoc ? maxPanelIndexDoc.panelIndex : 0;
    res.status(200).json({ maxPanelIndex });
  } catch (error) {
    console.error("Error fetching max panel index:", error);
    res.status(500).json({
      message: "Failed to fetch max panel index",
      error: error.message
    });
  }
});

// Endpoint to save a new measurement point
app.post("/api/save-measurement-point", async (req, res) => {
  try {
    const measurementPoint = req.body; // This will include moNo, which can be "Common" or a specific MO
    // Find the maximum 'no' in the collection
    const maxNoDoc = await CuttingMeasurementPoint.findOne() // Changed variable name
      .sort({ no: -1 })
      .select("no")
      .lean(); // Use lean for performance if only 'no' is needed
    const newNo = maxNoDoc ? maxNoDoc.no + 1 : 1;
    // Create new document
    const newDoc = new CuttingMeasurementPoint({
      ...measurementPoint,
      no: newNo // Assign the new auto-incremented 'no'
    });
    await newDoc.save();
    res
      .status(200)
      .json({ message: "Measurement point saved successfully", point: newDoc }); // Send back the new point
  } catch (error) {
    console.error("Error saving measurement point:", error);
    if (error.code === 11000) {
      // Handle duplicate key errors more gracefully
      // You might need to check which field caused the duplicate error
      // For now, a generic message. schema should have unique indexes defined.
      return res.status(409).json({
        message:
          "Failed to save: Duplicate entry for a unique field (e.g., MO + Panel + Point Name + Index).",
        error: error.message
      });
    }
    res.status(500).json({
      message: "Failed to save measurement point",
      error: error.message
    });
  }
});

/* ------------------------------
   Cutting Measurement Points Edit ENDPOINTS
------------------------------ */

// Endpoint to Search MO Numbers (moNo) from CuttingMeasurementPoint with partial matching
app.get("/api/cutting-measurement-mo-numbers", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const regexPattern = new RegExp(searchTerm, "i");

    const results = await CuttingMeasurementPoint.find({
      moNo: { $regex: regexPattern }
    })
      .select("moNo")
      .limit(100)
      .sort({ moNo: 1 })
      .exec();

    const uniqueMONos = [...new Set(results.map((r) => r.moNo))];

    res.json(uniqueMONos);
  } catch (err) {
    console.error(
      "Error fetching MO numbers from CuttingMeasurementPoint:",
      err
    );
    res.status(500).json({
      message: "Failed to fetch MO numbers from CuttingMeasurementPoint",
      error: err.message
    });
  }
});

// Endpoint to fetch measurement points for a given moNo and panel
app.get("/api/cutting-measurement-points", async (req, res) => {
  try {
    const { moNo, panel } = req.query;
    if (!moNo || !panel) {
      return res.status(400).json({ error: "moNo and panel are required" });
    }

    const points = await CuttingMeasurementPoint.find({
      moNo,
      panel
    }).exec();

    res.json(points);
  } catch (error) {
    console.error("Error fetching measurement points:", error);
    res.status(500).json({
      message: "Failed to fetch measurement points",
      error: error.message
    });
  }
});

// Endpoint to fetch unique panelIndexName and panelIndexNameKhmer for a given moNo and panel, including Common
app.get(
  "/api/cutting-measurement-panel-index-names-by-mo",
  async (req, res) => {
    try {
      const { moNo, panel } = req.query;
      if (!moNo || !panel) {
        return res.status(400).json({ message: "moNo and panel are required" });
      }

      // Check if the moNo exists in CuttingMeasurementPoint
      const moExists = await CuttingMeasurementPoint.exists({ moNo });

      let panelIndexData = [];

      if (moExists) {
        // Fetch unique panelIndexName for the specific moNo and panel
        const specificMoData = await CuttingMeasurementPoint.aggregate([
          { $match: { moNo, panel } },
          {
            $group: {
              _id: "$panelIndexName",
              panelIndex: { $max: "$panelIndex" },
              panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
              panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
            }
          },
          {
            $project: {
              panelIndexName: "$_id",
              panelIndex: 1,
              panelIndexNameKhmer: 1,
              panelIndexNameChinese: 1,
              _id: 0
            }
          }
        ]).exec();

        // Fetch unique panelIndexName for moNo = 'Common' and panel
        const commonData = await CuttingMeasurementPoint.aggregate([
          { $match: { moNo: "Common", panel } },
          {
            $group: {
              _id: "$panelIndexName",
              panelIndex: { $max: "$panelIndex" },
              panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
              panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
            }
          },
          {
            $project: {
              panelIndexName: "$_id",
              panelIndex: 1,
              panelIndexNameKhmer: 1,
              panelIndexNameChinese: 1,
              _id: 0
            }
          }
        ]).exec();

        // Combine data, ensuring no duplicates
        const combinedData = [...commonData];
        specificMoData.forEach((specific) => {
          if (
            !combinedData.some(
              (item) => item.panelIndexName === specific.panelIndexName
            )
          ) {
            combinedData.push(specific);
          }
        });

        panelIndexData = combinedData;
      } else {
        // If moNo doesn't exist, fetch only for moNo = 'Common' and panel
        panelIndexData = await CuttingMeasurementPoint.aggregate([
          { $match: { moNo: "Common", panel } },
          {
            $group: {
              _id: "$panelIndexName",
              panelIndex: { $max: "$panelIndex" },
              panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
              panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
            }
          },
          {
            $project: {
              panelIndexName: "$_id",
              panelIndex: 1,
              panelIndexNameKhmer: 1,
              panelIndexNameChinese: 1,
              _id: 0
            }
          }
        ]).exec();
      }

      // Sort by panelIndexName
      panelIndexData.sort((a, b) =>
        a.panelIndexName.localeCompare(b.panelIndexName)
      );

      res.status(200).json(panelIndexData);
    } catch (error) {
      console.error("Error fetching panel index names by MO:", error);
      res.status(500).json({
        message: "Failed to fetch panel index names",
        error: error.message
      });
    }
  }
);

// Endpoint to update a measurement point by _id
app.put("/api/update-measurement-point/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedPoint = await CuttingMeasurementPoint.findByIdAndUpdate(
      id,
      { $set: { ...updateData, updated_at: new Date() } },
      { new: true }
    );

    if (!updatedPoint) {
      return res.status(404).json({ error: "Measurement point not found" });
    }

    res.status(200).json({ message: "Measurement point updated successfully" });
  } catch (error) {
    console.error("Error updating measurement point:", error);
    res.status(500).json({
      message: "Failed to update measurement point",
      error: error.message
    });
  }
});

// ** NEW: Endpoint to delete a measurement point by _id **
app.delete("/api/delete-measurement-point/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid measurement point ID format." });
    }

    const deletedPoint = await CuttingMeasurementPoint.findByIdAndDelete(id);

    if (!deletedPoint) {
      return res.status(404).json({ message: "Measurement point not found." });
    }

    res
      .status(200)
      .json({ message: "Measurement point deleted successfully." });
  } catch (error) {
    console.error("Error deleting measurement point:", error);
    res.status(500).json({
      message: "Failed to delete measurement point.",
      error: error.message
    });
  }
});

/* ------------------------------
  Cutting Fabric Defects ENDPOINTS
------------------------------ */

app.get("/api/cutting-fabric-defects", async (req, res) => {
  try {
    const defects = await CuttingFabricDefect.find({});
    res.status(200).json(defects);
  } catch (error) {
    console.error("Error fetching cutting fabric defects:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch defects", error: error.message });
  }
});

// POST - Add a new cutting fabric defect
app.post("/api/cutting-fabric-defects", async (req, res) => {
  try {
    const { defectCode, defectNameEng, defectNameKhmer, defectNameChinese } =
      req.body;

    // Chinese name is optional, so only validate the mandatory fields
    if (!defectCode || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message: "Defect Code, English Name, and Khmer Name are required."
      });
    }

    const existingDefectByCode = await CuttingFabricDefect.findOne({
      defectCode
    });
    if (existingDefectByCode) {
      return res
        .status(409)
        .json({ message: `Defect code '${defectCode}' already exists.` });
    }
    const existingDefectByName = await CuttingFabricDefect.findOne({
      defectNameEng
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newDefect = new CuttingFabricDefect({
      defectCode,
      defectName: defectNameEng,
      defectNameEng,
      defectNameKhmer,
      defectNameChinese: defectNameChinese || "" // Save empty string if not provided
    });
    await newDefect.save();
    res.status(201).json({
      message: "Cutting fabric defect added successfully",
      defect: newDefect
    });
  } catch (error) {
    console.error("Error adding cutting fabric defect:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate defect code or name." });
    }
    res
      .status(500)
      .json({ message: "Failed to add defect", error: error.message });
  }
});

// PUT - Update an existing cutting fabric defect by ID
app.put("/api/cutting-fabric-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { defectCode, defectNameEng, defectNameKhmer, defectNameChinese } =
      req.body;

    // Chinese name is optional
    if (!defectCode || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message:
          "Defect Code, English Name, and Khmer Name are required for update."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    const existingDefectByCode = await CuttingFabricDefect.findOne({
      defectCode,
      _id: { $ne: id }
    });
    if (existingDefectByCode) {
      return res.status(409).json({
        message: `Defect code '${defectCode}' already exists for another defect.`
      });
    }
    const existingDefectByName = await CuttingFabricDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedDefect = await CuttingFabricDefect.findByIdAndUpdate(
      id,
      {
        defectCode,
        defectName: defectNameEng,
        defectNameEng,
        defectNameKhmer,
        defectNameChinese: defectNameChinese || "", // Save empty string if not provided
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDefect) {
      return res.status(404).json({ message: "Defect not found." });
    }
    res.status(200).json({
      message: "Cutting fabric defect updated successfully",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error updating cutting fabric defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Update failed due to duplicate defect code or name."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to update defect", error: error.message });
  }
});

// DELETE - Delete a cutting fabric defect by ID (remains the same)
app.delete("/api/cutting-fabric-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }
    const deletedDefect = await CuttingFabricDefect.findByIdAndDelete(id);
    if (!deletedDefect) {
      return res.status(404).json({ message: "Defect not found." });
    }
    res
      .status(200)
      .json({ message: "Cutting fabric defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting cutting fabric defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete defect", error: error.message });
  }
});

/* ------------------------------
  Cutting Issues ENDPOINTS
------------------------------ */

// Add this endpoint after other endpoints
app.get("/api/cutting-issues", async (req, res) => {
  try {
    const issues = await CuttingIssue.find().sort({ no: 1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching cutting issues:", error);
    res.status(500).json({
      message: "Failed to fetch cutting issues",
      error: error.message
    });
  }
});

// --- Multer Configuration for Cutting Images ---

// MODIFIED: Use memoryStorage to handle the file in memory for processing.
const cuttingMemoryStorage = multer.memoryStorage();
const cutting_upload = multer({
  storage: cuttingMemoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // Increased limit to 25MB to handle uncompressed files from client
});

// --- Image Upload Endpoint (MODIFIED) ---
app.post(
  "/api/upload-cutting-image",
  cutting_upload.single("image"), // This uses the memory storage config
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded."
        });
      }

      // --- File Saving Logic with Sharp ---
      const cuttingUploadPath = path.join(
        __dirname,
        "public",
        "storage",
        "cutting" // Your existing path is preserved
      );
      // Ensure the directory exists
      // await fs.promises.mkdir(cuttingUploadPath, { recursive: true });

      // Create a unique filename, saving as .webp
      const newFilename = `cutting-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.webp`;

      const finalDiskPath = path.join(cuttingUploadPath, newFilename);

      // Use sharp to process the image from buffer
      await sharp(req.file.buffer)
        .resize({
          width: 1024,
          height: 1024,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 80 }) // Convert to efficient WebP format
        .toFile(finalDiskPath);

      // --- URL Construction ---
      // Return the relative path, which is what your frontend expects
      const relativeUrl = `/storage/cutting/${newFilename}`;

      res.status(200).json({ success: true, url: relativeUrl });
    } catch (error) {
      console.error("Error in /api/upload-cutting-image:", error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `File upload error: ${error.message}`
        });
      }
      res.status(500).json({
        success: false,
        message: "Server error during image processing."
      });
    }
  }
);

/* ------------------------------
  Cutting Trend Analysis ENDPOINTS
------------------------------ */

// --- Trend Analysis Filter Options ---
app.get("/api/cutting/filter-options/mo-numbers", async (req, res) => {
  try {
    const { search, startDate, endDate, tableNo, buyer } = req.query;
    const match = {};
    if (search) match.moNo = { $regex: search, $options: "i" };
    if (tableNo) match.tableNo = { $regex: tableNo, $options: "i" };
    if (buyer) match.buyer = { $regex: buyer, $options: "i" };
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate)
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y",
                onError: new Date(0)
              }
            },
            {
              $dateFromString: {
                dateString: normalizeDateString(startDate),
                format: "%m/%d/%Y",
                onError: new Date(0)
              }
            }
          ]
        });
      if (endDate)
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y",
                onError: new Date()
              }
            },
            {
              $dateFromString: {
                dateString: normalizeDateString(endDate),
                format: "%m/%d/%Y",
                onError: new Date()
              }
            }
          ]
        });
    }
    const moNumbers = await CuttingInspection.distinct("moNo", match);
    res.json(moNumbers.sort());
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch MO numbers for filter" });
  }
});

app.get("/api/cutting/filter-options/table-numbers", async (req, res) => {
  try {
    const { search, startDate, endDate, moNo, buyer } = req.query;
    const match = {};
    if (moNo) match.moNo = moNo; // Exact match for MO if provided
    else if (search && !moNo)
      match.tableNo = { $regex: search, $options: "i" }; // Search if no MO
    else if (search && moNo) match.tableNo = { $regex: search, $options: "i" };

    if (buyer) match.buyer = { $regex: buyer, $options: "i" };
    if (startDate || endDate) {
      /* ... date filter logic ... */
    }
    const tableNumbers = await CuttingInspection.distinct("tableNo", match);
    res.json(tableNumbers.sort());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch Table numbers for filter" });
  }
});

app.get("/api/cutting/filter-options/buyers", async (req, res) => {
  try {
    const { search, startDate, endDate, moNo, tableNo } = req.query;
    const match = {};
    if (search) match.buyer = { $regex: search, $options: "i" };
    if (moNo) match.moNo = moNo;
    if (tableNo) match.tableNo = tableNo;
    if (startDate || endDate) {
      /* ... date filter logic ... */
    }
    const buyers = await CuttingInspection.distinct("buyer", {
      ...match,
      buyer: { $ne: null, $ne: "" }
    });
    res.json(buyers.sort());
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Buyers for filter" });
  }
});

app.get("/api/cutting/filter-options/garment-types", async (req, res) => {
  try {
    // This can come from CuttingInspection or a master list like CuttingMeasurementPoint
    const garmentTypes = await CuttingInspection.distinct("garmentType", {
      garmentType: { $ne: null, $ne: "" }
    });
    res.json(garmentTypes.sort());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch Garment Types for filter" });
  }
});

app.get("/api/cutting/part-names", async (req, res) => {
  try {
    const { garmentType } = req.query;
    const match = {};
    if (garmentType) match.panel = garmentType; // Assuming 'panel' field in CuttingMeasurementPoint stores garmentType

    // Fetch unique panelIndexName for the given garmentType (panel)
    const partNamesData = await CuttingMeasurementPoint.aggregate([
      { $match: match },
      { $group: { _id: "$panelIndexName" } },
      { $project: { _id: 0, partName: "$_id" } },
      { $sort: { partName: 1 } }
    ]);
    res.json(partNamesData.map((p) => p.partName));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Part Names" });
  }
});

// --- Trend Analysis Data Endpoints ---

// 1. Garment Type Trend Analysis
app.get("/api/cutting/trend/garment-type", async (req, res) => {
  const { startDate, endDate, moNo, tableNo, buyer } = req.query;
  const matchConditions = {};
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };

  if (startDate || endDate) {
    matchConditions.$expr = matchConditions.$expr || {};
    matchConditions.$expr.$and = matchConditions.$expr.$and || [];
    if (startDate)
      matchConditions.$expr.$and.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$inspectionDate",
              format: "%m/%d/%Y",
              onError: new Date(0)
            }
          },
          {
            $dateFromString: {
              dateString: normalizeDateString(startDate),
              format: "%m/%d/%Y",
              onError: new Date(0)
            }
          }
        ]
      });
    if (endDate)
      matchConditions.$expr.$and.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$inspectionDate",
              format: "%m/%d/%Y",
              onError: new Date()
            }
          },
          {
            $dateFromString: {
              dateString: normalizeDateString(endDate),
              format: "%m/%d/%Y",
              onError: new Date()
            }
          }
        ]
      });
  }

  try {
    const data = await CuttingInspection.aggregate([
      { $match: matchConditions },
      // Step 1: Sum inspectionData fields within each document
      {
        $project: {
          garmentType: 1,
          moNo: 1,
          tableNo: 1,
          totalInspectionQty: 1,
          totalBundleQty: 1,
          bundleQtyCheck: 1,
          totalPcsTop: {
            $sum: "$inspectionData.pcsSize.top"
          },
          totalPcsMiddle: {
            $sum: "$inspectionData.pcsSize.middle"
          },
          totalPcsBottom: {
            $sum: "$inspectionData.pcsSize.bottom"
          },
          totalPassTop: {
            $sum: "$inspectionData.passSize.top"
          },
          totalPassMiddle: {
            $sum: "$inspectionData.passSize.middle"
          },
          totalPassBottom: {
            $sum: "$inspectionData.passSize.bottom"
          },
          totalRejectTop: {
            $sum: "$inspectionData.rejectSize.top"
          },
          totalRejectMiddle: {
            $sum: "$inspectionData.rejectSize.middle"
          },
          totalRejectBottom: {
            $sum: "$inspectionData.rejectSize.bottom"
          },
          totalRejectMeasTop: {
            $sum: "$inspectionData.rejectMeasurementSize.top"
          },
          totalRejectMeasMiddle: {
            $sum: "$inspectionData.rejectMeasurementSize.middle"
          },
          totalRejectMeasBottom: {
            $sum: "$inspectionData.rejectMeasurementSize.bottom"
          },
          totalRejectGarmentTop: {
            $sum: "$inspectionData.rejectGarmentSize.top"
          },
          totalRejectGarmentMiddle: {
            $sum: "$inspectionData.rejectGarmentSize.middle"
          },
          totalRejectGarmentBottom: {
            $sum: "$inspectionData.rejectGarmentSize.bottom"
          },
          totalPcsAll: {
            $sum: "$inspectionData.totalPcsSize"
          },
          sumTotalReject: {
            $sum: "$inspectionData.rejectSize.total"
          }
        }
      },
      // Step 2: Group by garmentType, collecting AQL data per record
      {
        $group: {
          _id: "$garmentType",
          noOfInspections: {
            $addToSet: { moNo: "$moNo", tableNo: "$tableNo" }
          },
          totalBundleQty: { $sum: "$totalBundleQty" },
          bundleQtyCheck: { $sum: "$bundleQtyCheck" },
          totalInspectedQty: { $sum: "$totalPcsAll" },
          sumTotalPcsTop: { $sum: "$totalPcsTop" },
          sumTotalPcsMiddle: { $sum: "$totalPcsMiddle" },
          sumTotalPcsBottom: { $sum: "$totalPcsBottom" },
          sumTotalPassTop: { $sum: "$totalPassTop" },
          sumTotalPassMiddle: { $sum: "$totalPassMiddle" },
          sumTotalPassBottom: { $sum: "$totalPassBottom" },
          sumTotalRejectTop: { $sum: "$totalRejectTop" },
          sumTotalRejectMiddle: { $sum: "$totalRejectMiddle" },
          sumTotalRejectBottom: { $sum: "$totalRejectBottom" },
          sumTotalRejectMeasTop: { $sum: "$totalRejectMeasTop" },
          sumTotalRejectMeasMiddle: { $sum: "$totalRejectMeasMiddle" },
          sumTotalRejectMeasBottom: { $sum: "$totalRejectMeasBottom" },
          sumTotalRejectGarmentTop: { $sum: "$totalRejectGarmentTop" },
          sumTotalRejectGarmentMiddle: { $sum: "$totalRejectGarmentMiddle" },
          sumTotalRejectGarmentBottom: { $sum: "$totalRejectGarmentBottom" },
          aqlRelevantData: {
            $push: {
              totalInspectionQty: "$totalInspectionQty",
              sumTotalReject: "$sumTotalReject",
              totalPcsAll: "$totalPcsAll"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          garmentType: "$_id",
          noOfInspections: { $size: "$noOfInspections" },
          totalBundleQty: 1,
          bundleQtyCheck: 1,
          totalInspectedQty: 1,
          totalPcs: {
            top: "$sumTotalPcsTop",
            middle: "$sumTotalPcsMiddle",
            bottom: "$sumTotalPcsBottom"
          },
          totalPass: {
            top: "$sumTotalPassTop",
            middle: "$sumTotalPassMiddle",
            bottom: "$sumTotalPassBottom"
          },
          totalReject: {
            top: "$sumTotalRejectTop",
            middle: "$sumTotalRejectMiddle",
            bottom: "$sumTotalRejectBottom"
          },
          totalRejectMeasurements: {
            top: "$sumTotalRejectMeasTop",
            middle: "$sumTotalRejectMeasMiddle",
            bottom: "$sumTotalRejectMeasBottom"
          },
          totalRejectDefects: {
            top: "$sumTotalRejectGarmentTop",
            middle: "$sumTotalRejectGarmentMiddle",
            bottom: "$sumTotalRejectGarmentBottom"
          },
          aqlRelevantData: 1
        }
      },
      { $sort: { garmentType: 1 } }
    ]);

    const getAQLResultStatusServer = (
      totalInspectionQty,
      sumTotalReject,
      totalPcsAll
    ) => {
      if (!totalInspectionQty || totalPcsAll < totalInspectionQty) {
        return { key: "pending" };
      }
      if (totalInspectionQty >= 30 && totalInspectionQty < 45) {
        return sumTotalReject > 0 ? { key: "reject" } : { key: "pass" };
      }
      if (totalInspectionQty >= 45 && totalInspectionQty < 60) {
        return sumTotalReject > 0 ? { key: "reject" } : { key: "pass" };
      }
      if (totalInspectionQty >= 60 && totalInspectionQty < 90) {
        return sumTotalReject > 1 ? { key: "reject" } : { key: "pass" };
      }
      if (totalInspectionQty >= 90 && totalInspectionQty < 135) {
        return sumTotalReject > 2 ? { key: "reject" } : { key: "pass" };
      }
      if (totalInspectionQty >= 135 && totalInspectionQty < 210) {
        return sumTotalReject > 3 ? { key: "reject" } : { key: "pass" };
      }
      if (totalInspectionQty >= 210 && totalInspectionQty < 315) {
        return sumTotalReject > 5 ? { key: "reject" } : { key: "pass" };
      }
      if (totalInspectionQty >= 315) {
        return sumTotalReject > 7 ? { key: "reject" } : { key: "pass" };
      }
      return { key: "pending" };
    };

    const processedData = data.map((item) => {
      let aqlPass = 0,
        aqlReject = 0,
        aqlPending = 0;
      item.aqlRelevantData.forEach((aqlItem) => {
        const status = getAQLResultStatusServer(
          aqlItem.totalInspectionQty,
          aqlItem.sumTotalReject,
          aqlItem.totalPcsAll
        );
        if (status.key === "pass") aqlPass++;
        else if (status.key === "reject") aqlReject++;
        else aqlPending++;
      });

      const totalPcsOverall =
        (item.totalPcs.top || 0) +
        (item.totalPcs.middle || 0) +
        (item.totalPcs.bottom || 0);
      const totalPassOverall =
        (item.totalPass.top || 0) +
        (item.totalPass.middle || 0) +
        (item.totalPass.bottom || 0);

      return {
        ...item,
        passRate: {
          top:
            item.totalPcs.top > 0
              ? ((item.totalPass.top || 0) / item.totalPcs.top) * 100
              : 0,
          middle:
            item.totalPcs.middle > 0
              ? ((item.totalPass.middle || 0) / item.totalPcs.middle) * 100
              : 0,
          bottom:
            item.totalPcs.bottom > 0
              ? ((item.totalPass.bottom || 0) / item.totalPcs.bottom) * 100
              : 0,
          overall:
            totalPcsOverall > 0 ? (totalPassOverall / totalPcsOverall) * 100 : 0
        },
        aqlSummary: { pass: aqlPass, reject: aqlReject, pending: aqlPending }
      };
    });
    res.json(processedData);
  } catch (error) {
    console.error("Garment Type Trend Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch garment type trend data" });
  }
});

// 2. Measurement Points Trend Analysis
app.get("/api/cutting/trend/measurement-points", async (req, res) => {
  const { startDate, endDate, moNo, tableNo, buyer, garmentType, partName } =
    req.query;
  const matchConditions = {};
  // ... (build matchConditions similar to above, including garmentType and partName if provided) ...
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
  if (garmentType) matchConditions.garmentType = garmentType;
  // For partName, we need to match inside inspectionData.bundleInspectionData.measurementInsepctionData
  // This makes the initial match more complex or requires filtering after unwind.

  if (startDate || endDate) {
    /* ... date filter logic ... */
  }

  try {
    const pipeline = [
      { $match: matchConditions },
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      // Filter by partName if provided
      ...(partName
        ? [
            {
              $match: {
                "inspectionData.bundleInspectionData.measurementInsepctionData.partName":
                  partName
              }
            }
          ]
        : []),
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
      },
      {
        $project: {
          inspectionDate: "$inspectionDate",
          garmentType: "$garmentType",
          partName:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.partName",
          measurementPoint:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
          value:
            "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
          toleranceMin: "$inspectionData.tolerance.min",
          toleranceMax: "$inspectionData.tolerance.max"
        }
      },
      {
        $group: {
          _id: {
            date: "$inspectionDate", // Group by date for columns
            garmentType: "$garmentType",
            partName: "$partName",
            measurementPoint: "$measurementPoint"
          },
          withinTol: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$value", "$toleranceMin"] },
                    { $lte: ["$value", "$toleranceMax"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          outOfTolNeg: {
            $sum: { $cond: [{ $lt: ["$value", "$toleranceMin"] }, 1, 0] }
          },
          outOfTolPos: {
            $sum: { $cond: [{ $gt: ["$value", "$toleranceMax"] }, 1, 0] }
          },
          totalPoints: { $sum: 1 }
        }
      },
      // Further group to structure for the table (rows: GT, PN, MP; cols: Dates)
      {
        $group: {
          _id: {
            garmentType: "$_id.garmentType",
            partName: "$_id.partName",
            measurementPoint: "$_id.measurementPoint"
          },
          dailyData: {
            $push: {
              date: "$_id.date",
              withinTol: "$withinTol",
              outOfTolNeg: "$outOfTolNeg",
              outOfTolPos: "$outOfTolPos",
              passRate: {
                $cond: [
                  { $gt: ["$totalPoints", 0] },
                  {
                    $multiply: [
                      { $divide: ["$withinTol", "$totalPoints"] },
                      100
                    ]
                  },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          garmentType: "$_id.garmentType",
          partName: "$_id.partName",
          measurementPoint: "$_id.measurementPoint",
          dailyData: 1
        }
      },
      { $sort: { garmentType: 1, partName: 1, measurementPoint: 1 } }
    ];

    const result = await CuttingInspection.aggregate(pipeline);

    // Transform data for frontend table (pivot dailyData to columns)
    const dateHeaders = [
      ...new Set(result.flatMap((r) => r.dailyData.map((d) => d.date)))
    ].sort();
    const transformedData = result.map((item) => {
      const valuesByDate = {};
      dateHeaders.forEach((header) => {
        const dayData = item.dailyData.find((d) => d.date === header);
        valuesByDate[header] = dayData
          ? {
              withinTol: dayData.withinTol,
              outOfTolNeg: dayData.outOfTolNeg,
              outOfTolPos: dayData.outOfTolPos,
              passRate: dayData.passRate
            }
          : { withinTol: 0, outOfTolNeg: 0, outOfTolPos: 0, passRate: 0 };
      });
      return {
        garmentType: item.garmentType,
        partName: item.partName,
        measurementPoint: item.measurementPoint,
        values: valuesByDate
      };
    });

    res.json({ headers: dateHeaders, data: transformedData });
  } catch (error) {
    console.error("Measurement Points Trend Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch measurement points trend data" });
  }
});

// 3. Fabric Defect Trend Chart
app.get("/api/cutting/trend/fabric-defects", async (req, res) => {
  const { startDate, endDate, moNo, tableNo, buyer, garmentType, partName } =
    req.query;
  const matchConditions = {};
  // ... (build matchConditions) ...
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
  if (garmentType) matchConditions.garmentType = garmentType;
  if (startDate || endDate) {
    /* ... date filter logic ... */
  }

  try {
    const pipeline = [
      { $match: matchConditions },
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      ...(partName
        ? [
            {
              $match: {
                "inspectionData.bundleInspectionData.measurementInsepctionData.partName":
                  partName
              }
            }
          ]
        : []),
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
      },
      {
        $group: {
          _id: {
            date: "$inspectionDate",
            garmentType: "$garmentType",
            partName:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.partName"
          },
          totalRejectGarmentsForDay: {
            $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.totalDefects"
          }, // Sum of totalDefects from pcs level
          totalPcsForDay: { $sum: "$inspectionData.totalPcsSize" } // This needs to be totalPcs relevant to the part/day
        }
      },
      // Group again to structure for the table
      {
        $group: {
          _id: {
            garmentType: "$_id.garmentType",
            partName: "$_id.partName"
          },
          dailyData: {
            $push: {
              date: "$_id.date",
              rejectCount: "$totalRejectGarmentsForDay",
              // This defect rate needs careful consideration of the denominator (totalPcsForDay)
              // The current totalPcsForDay is summed at a higher level.
              // You might need to sum totalPcs from bundle.pcs for the relevant parts.
              defectRate: {
                $cond: [
                  { $gt: ["$totalPcsForDay", 0] },
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$totalRejectGarmentsForDay",
                          "$totalPcsForDay"
                        ]
                      },
                      100
                    ]
                  },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          garmentType: "$_id.garmentType",
          partName: "$_id.partName",
          dailyData: 1
        }
      },
      { $sort: { garmentType: 1, partName: 1 } }
    ];

    const result = await CuttingInspection.aggregate(pipeline);

    const dateHeaders = [
      ...new Set(result.flatMap((r) => r.dailyData.map((d) => d.date)))
    ].sort();
    const transformedData = result.map((item) => {
      const valuesByDate = {};
      dateHeaders.forEach((header) => {
        const dayData = item.dailyData.find((d) => d.date === header);
        valuesByDate[header] = dayData
          ? { rejectCount: dayData.rejectCount, defectRate: dayData.defectRate }
          : { rejectCount: 0, defectRate: 0 };
      });
      return {
        garmentType: item.garmentType,
        partName: item.partName,
        values: valuesByDate
      };
    });
    res.json({ headers: dateHeaders, data: transformedData });
  } catch (error) {
    console.error("Fabric Defect Trend Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch fabric defect trend data" });
  }
});

// 4. Top Measurement Issues
app.get("/api/cutting/trend/top-measurement-issues", async (req, res) => {
  const { startDate, endDate, moNo, tableNo, buyer } = req.query;
  const matchConditions = {};
  // ... (build matchConditions) ...
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
  if (startDate || endDate) {
    /* ... date filter logic ... */
  }

  try {
    const data = await CuttingInspection.aggregate([
      { $match: matchConditions },
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
      },
      {
        $group: {
          _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
          passPoints: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                    "Pass"
                  ]
                },
                1,
                0
              ]
            }
          },
          rejectTolNegPoints: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                        "Fail"
                      ]
                    },
                    {
                      $lt: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                        "$inspectionData.tolerance.min"
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          rejectTolPosPoints: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                        "Fail"
                      ]
                    },
                    {
                      $gt: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                        "$inspectionData.tolerance.max"
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalPoints: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          measurementPoint: "$_id",
          passPoints: 1,
          rejectTolNegPoints: 1,
          rejectTolPosPoints: 1,
          issuePercentage: {
            $cond: [
              { $gt: ["$totalPoints", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ["$rejectTolNegPoints", "$rejectTolPosPoints"] },
                      "$totalPoints"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { issuePercentage: -1 } },
      { $limit: 10 } // Top 10 issues
    ]);
    res.json(data);
  } catch (error) {
    console.error("Top Measurement Issues Error:", error);
    res.status(500).json({ message: "Failed to fetch top measurement issues" });
  }
});

// 5. Top Defect Issues
app.get("/api/cutting/trend/top-defect-issues", async (req, res) => {
  const { startDate, endDate, moNo, tableNo, buyer } = req.query;
  const matchConditions = {};
  // ... (build matchConditions) ...
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
  if (startDate || endDate) {
    /* ... date filter logic ... */
  }

  try {
    const data = await CuttingInspection.aggregate([
      { $match: matchConditions },
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects"
      },
      {
        $group: {
          _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName",
          defectQty: {
            $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty"
          }
          // To calculate defectRate, we need total pieces inspected where this defect *could* have occurred.
          // This might require summing totalPcsSize from inspectionData at a higher level or making an assumption.
          // For now, we'll pass total pieces inspected across all relevant documents for a rough rate.
          // A more accurate rate would be specific to parts where this defect applies.
        }
      },
      // Second group stage to get total pieces inspected across all filtered documents
      // This is a simplification for the defect rate denominator.
      {
        $lookup: {
          from: "cuttinginspections", // Self-lookup to get total pieces from all matching documents
          pipeline: [
            { $match: matchConditions },
            { $unwind: "$inspectionData" },
            {
              $group: {
                _id: null,
                totalInspectedPieces: { $sum: "$inspectionData.totalPcsSize" }
              }
            }
          ],
          as: "total_inspected_info"
        }
      },
      {
        $unwind: {
          path: "$total_inspected_info",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          defectName: "$_id",
          // defectNameKhmer:  // Would need to join with CuttingFabricDefect model or pass master list
          // defectNameChinese: // Same as above
          defectQty: 1,
          defectRate: {
            $cond: [
              {
                $and: [
                  { $gt: ["$defectQty", 0] },
                  { $gt: ["$total_inspected_info.totalInspectedPieces", 0] }
                ]
              },
              {
                $multiply: [
                  {
                    $divide: [
                      "$defectQty",
                      "$total_inspected_info.totalInspectedPieces"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }, // Or defectQty: -1
      { $limit: 10 } // Top 10 defects
    ]);
    res.json(data);
  } catch (error) {
    console.error("Top Defect Issues Error:", error);
    res.status(500).json({ message: "Failed to fetch top defect issues" });
  }
});

/* ------------------------------
   Cutting Inspection Management ENDPOINTS
------------------------------ */

// GET Full Cutting Inspection Document for Management/Modification
app.get("/api/cutting-inspection-full-details", async (req, res) => {
  try {
    const { moNo, tableNo, color } = req.query; // Color might be needed if moNo+tableNo isn't unique
    if (!moNo || !tableNo) {
      return res
        .status(400)
        .json({ message: "MO Number and Table Number are required" });
    }

    let query = { moNo, tableNo };
    // If your records are uniquely identified by moNo, tableNo, AND color, add color to the query:
    // if (color) query.color = color;
    // For now, assuming moNo + tableNo is sufficient to find a unique parent record.

    const inspectionDoc = await CuttingInspection.findOne(query).lean();

    if (!inspectionDoc) {
      return res.status(404).json({ message: "Inspection document not found" });
    }
    res.json(inspectionDoc);
  } catch (error) {
    console.error("Error fetching full inspection details:", error);
    res.status(500).json({
      message: "Failed to fetch full inspection details",
      error: error.message
    });
  }
});

// GET Full Cutting Inspection Document for Management (similar to modify, but might be simpler)
app.get("/api/cutting-inspection-details-for-manage", async (req, res) => {
  try {
    const { moNo, tableNo } = req.query;
    if (!moNo || !tableNo) {
      return res
        .status(400)
        .json({ message: "MO Number and Table Number are required" });
    }
    // You might want to add color if moNo + tableNo is not unique enough
    const inspectionDoc = await CuttingInspection.findOne({
      moNo,
      tableNo
    }).lean(); // Use lean for read-only

    if (!inspectionDoc) {
      return res.status(404).json({ message: "Inspection document not found" });
    }
    res.json(inspectionDoc);
  } catch (error) {
    console.error("Error fetching inspection details for management:", error);
    res.status(500).json({
      message: "Failed to fetch inspection details for management",
      error: error.message
    });
  }
});

// DELETE Entire Cutting Inspection Record by document _id
app.delete("/api/cutting-inspection-record/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Record ID format." });
    }

    const deletedRecord = await CuttingInspection.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res
        .status(404)
        .json({ message: "Cutting inspection record not found." });
    }
    res
      .status(200)
      .json({ message: "Cutting inspection record deleted successfully." });
  } catch (error) {
    console.error("Error deleting cutting inspection record:", error);
    res.status(500).json({
      message: "Failed to delete cutting inspection record.",
      error: error.message
    });
  }
});

// DELETE Specific Inspected Size from a Cutting Inspection Record
app.delete(
  "/api/cutting-inspection-record/:id/size/:inspectedSize",
  async (req, res) => {
    try {
      const { id, inspectedSize } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Record ID format." });
      }
      if (!inspectedSize) {
        return res
          .status(400)
          .json({ message: "Inspected size to delete is required." });
      }

      const record = await CuttingInspection.findById(id);
      if (!record) {
        return res
          .status(404)
          .json({ message: "Cutting inspection record not found." });
      }

      const initialLength = record.inspectionData.length;
      record.inspectionData = record.inspectionData.filter(
        (dataItem) => dataItem.inspectedSize !== inspectedSize
      );

      if (record.inspectionData.length === initialLength) {
        return res.status(404).json({
          message: `Inspected size '${inspectedSize}' not found in this record.`
        });
      }

      // If all sizes are deleted, consider if the parent document should also be deleted or kept empty.
      // For now, we'll just remove the size. If inspectionData becomes empty, the parent still exists.
      // You might want to add logic here: if (record.inspectionData.length === 0) { await CuttingInspection.findByIdAndDelete(id); ... }

      record.updated_at = new Date();
      record.markModified("inspectionData"); // Important for Mongoose to detect array changes
      await record.save();

      res.status(200).json({
        message: `Inspection data for size '${inspectedSize}' deleted successfully.`,
        data: record
      });
    } catch (error) {
      console.error(`Error deleting inspected size '${inspectedSize}':`, error);
      res.status(500).json({
        message: `Failed to delete inspection data for size '${inspectedSize}'.`,
        error: error.message
      });
    }
  }
);

// PUT to update general information of a CuttingInspection document
app.put("/api/cutting-inspection-general-update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      inspectionDate, // Expecting 'M/D/YYYY' or 'MM/DD/YYYY' string from client
      orderQty,
      totalBundleQty,
      bundleQtyCheck, // These are calculated on client, but we save them
      totalInspectionQty // These are calculated on client, but we save them
      // Add other general fields here if they become editable later
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Record ID format." });
    }

    const recordToUpdate = await CuttingInspection.findById(id);
    if (!recordToUpdate) {
      return res.status(404).json({ message: "Inspection record not found." });
    }

    // Update fields
    if (inspectionDate !== undefined)
      recordToUpdate.inspectionDate = inspectionDate; // Store as string 'M/D/YYYY'
    if (orderQty !== undefined) recordToUpdate.orderQty = Number(orderQty);
    if (totalBundleQty !== undefined)
      recordToUpdate.totalBundleQty = Number(totalBundleQty);
    if (bundleQtyCheck !== undefined)
      recordToUpdate.bundleQtyCheck = Number(bundleQtyCheck);
    if (totalInspectionQty !== undefined)
      recordToUpdate.totalInspectionQty = Number(totalInspectionQty);

    recordToUpdate.updated_at = new Date();

    const updatedRecord = await recordToUpdate.save();

    res.status(200).json({
      message: "General inspection information updated successfully.",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error updating general inspection information:", error);
    res.status(500).json({
      message: "Failed to update general inspection information.",
      error: error.message
    });
  }
});

// ** NEW: PUT Endpoint to update the full/multiple sections of a CuttingInspection document **
app.put("/api/cutting-inspection-full-update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Contains all fields from frontend: general, fabric, cuttingTable, mackerRatio

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Record ID format." });
    }

    const recordToUpdate = await CuttingInspection.findById(id);
    if (!recordToUpdate) {
      return res.status(404).json({ message: "Inspection record not found." });
    }

    // Update General Info
    if (updates.inspectionDate !== undefined)
      recordToUpdate.inspectionDate = updates.inspectionDate;
    if (updates.orderQty !== undefined)
      recordToUpdate.orderQty = Number(updates.orderQty);
    if (updates.totalBundleQty !== undefined)
      recordToUpdate.totalBundleQty = Number(updates.totalBundleQty);
    if (updates.bundleQtyCheck !== undefined)
      recordToUpdate.bundleQtyCheck = Number(updates.bundleQtyCheck); // This is auto-calculated on frontend, but save it
    if (updates.totalInspectionQty !== undefined)
      recordToUpdate.totalInspectionQty = Number(updates.totalInspectionQty); // Also auto-calculated

    // Update Fabric Details
    if (updates.fabricDetails) {
      recordToUpdate.fabricDetails = {
        fabricType:
          updates.fabricDetails.fabricType ||
          recordToUpdate.fabricDetails.fabricType,
        material:
          updates.fabricDetails.material ||
          recordToUpdate.fabricDetails.material,
        rollQty:
          updates.fabricDetails.rollQty !== undefined
            ? Number(updates.fabricDetails.rollQty)
            : recordToUpdate.fabricDetails.rollQty,
        spreadYds:
          updates.fabricDetails.spreadYds !== undefined
            ? Number(updates.fabricDetails.spreadYds)
            : recordToUpdate.fabricDetails.spreadYds,
        unit: updates.fabricDetails.unit || recordToUpdate.fabricDetails.unit,
        grossKgs:
          updates.fabricDetails.grossKgs !== undefined
            ? Number(updates.fabricDetails.grossKgs)
            : recordToUpdate.fabricDetails.grossKgs,
        netKgs:
          updates.fabricDetails.netKgs !== undefined
            ? Number(updates.fabricDetails.netKgs)
            : recordToUpdate.fabricDetails.netKgs,
        totalTTLRoll:
          updates.fabricDetails.totalTTLRoll !== undefined
            ? Number(updates.fabricDetails.totalTTLRoll)
            : recordToUpdate.fabricDetails.totalTTLRoll
      };
    }

    // Update Cutting Table Details (PlanLayers and ActualLayers are display-only on frontend, so we don't update them here from payload)
    // Only update editable fields if provided
    if (updates.cuttingTableDetails) {
      if (updates.cuttingTableDetails.spreadTable !== undefined)
        recordToUpdate.cuttingTableDetails.spreadTable =
          updates.cuttingTableDetails.spreadTable;
      if (updates.cuttingTableDetails.spreadTableNo !== undefined)
        recordToUpdate.cuttingTableDetails.spreadTableNo =
          updates.cuttingTableDetails.spreadTableNo;
      // recordToUpdate.cuttingTableDetails.planLayers remains from DB
      // recordToUpdate.cuttingTableDetails.actualLayers remains from DB
      // recordToUpdate.cuttingTableDetails.totalPcs might need recalculation based on new ratios / layers on server-side if desired for integrity
      if (updates.cuttingTableDetails.mackerNo !== undefined)
        recordToUpdate.cuttingTableDetails.mackerNo =
          updates.cuttingTableDetails.mackerNo;
      if (updates.cuttingTableDetails.mackerLength !== undefined)
        recordToUpdate.cuttingTableDetails.mackerLength = Number(
          updates.cuttingTableDetails.mackerLength
        );
    }

    // Update Macker Ratio - Replace the whole array with the new one
    if (Array.isArray(updates.mackerRatio)) {
      recordToUpdate.mackerRatio = updates.mackerRatio.map((ratio) => ({
        index: Number(ratio.index),
        markerSize: ratio.markerSize,
        ratio: Number(ratio.ratio)
      }));
      recordToUpdate.markModified("mackerRatio");
    }

    recordToUpdate.updated_at = new Date();

    const updatedRecord = await recordToUpdate.save();

    res.status(200).json({
      message: "Cutting inspection record updated successfully.",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error updating full cutting inspection record:", error);
    res.status(500).json({
      message: "Failed to update cutting inspection record.",
      error: error.message
    });
  }
});

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
   User Auth ENDPOINTS
------------------------------ */

const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "your_jwt_secret");
    req.userId = decodedToken.userId; // Set the userId in the request object
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};

const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// ------------------------
// Multer Storage Setup
// ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId;
    if (!userId) {
      return cb(new Error("User ID is not defined"));
    }
    const dir = path.join(
      __dirname,
      "../public/storage/profiles/",
      userId.toString()
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const randomString = Math.random().toString(36).substring(2, 34);
    cb(null, `${randomString}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
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
      cb("Error: Images Only!");
    }
  }
}).single("profile");

/* ------------------------------
   User Management old ENDPOINTS
------------------------------ */

// User routes
app.get("/users", async (req, res) => {
  try {
    const users = await UserMain.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
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
      password
    } = req.body;

    // console.log("Request body:", req.body);

    // >>> NEW: Check if a user with the same name already exists (case-insensitive)
    const existingUserByName = await UserMain.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });
    if (existingUserByName) {
      return res.status(400).json({
        message: "User already exist! Please Use different Name"
      });
    }

    // If emp_id is provided, check if it already exists
    if (emp_id) {
      const existingUser = await UserMain.findOne({ emp_id });
      if (existingUser) {
        return res.status(400).json({
          message: "Employee ID already exists. Please use a different ID."
        });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
      password: hashedPassword
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

//Delete
app.delete("/users/:id", async (req, res) => {
  try {
    await UserMain.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* ------------------------------
   Login Authentication ENDPOINTS
------------------------------ */

// Helper function to get profile image URL
const getProfileImageUrl = (user) => {
  if (user.profile && user.profile.trim() !== "") {
    return `${API_BASE_URL}/public/storage/profiles/${user._id}/${path.basename(
      user.profile
    )}`;
  }
  return user.face_photo || "/IMG/default-profile.png";
};

// When Login get user data
app.post("/api/get-user-data", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const decoded = jwt.verify(token, "your_jwt_secret");
    const user = await UserMain.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      profile: getProfileImageUrl(user), // Use helper function
      face_photo: user.face_photo, // Include face_photo
      //profile: user.profile,
      roles: user.roles,
      sub_roles: user.sub_roles
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch user data", error: error.message });
  }
});

// Avoid Logout when Refresh
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
    res
      .status(500)
      .json({ message: "Failed to refresh token", error: error.message });
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
      $or: [{ email: username }, { name: username }, { emp_id: username }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // console.log("User Details", user);

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

    // console.log("Access Token:", accessToken);
    // console.log("Refresh Token:", refreshToken);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        emp_id: user.emp_id,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        name: user.name,
        email: user.email,
        roles: user.roles,
        sub_roles: user.sub_roles,
        profile: getProfileImageUrl(user), // Use helper function
        face_photo: user.face_photo // Include face_photo
      }
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
        message: "Employee ID, name, and password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    const existingUser = await UserMain.findOne({ emp_id });

    if (existingUser) {
      return res.status(400).json({
        message: "Employee ID already registered"
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
      updated_at: new Date()
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register user",
      error: error.message
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
      profileImage = `${API_BASE_URL}/public/storage/profiles/${
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
      profile: getProfileImageUrl(user), // Use helper function --- profileImage,
      face_photo: user.face_photo
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user profile",
      error: error.message
    });
  }
});

// ------------------------
// PUT /api/user-profile
// ------------------------

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
      email: req.body.email
    };

    // If a new image was uploaded, update the profile field.
    if (req.file) {
      updatedProfile.profile = `profiles/${userId}/${req.file.filename}`;
    }

    // Update the user document in the main collection.
    const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, {
      new: true
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
      error: error.message
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
        users: []
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
      face_photo: userDetails.face_photo
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
        message: "Cannot delete protected Super Admin users"
      });
    }

    // Find the user index in the users array
    const userIndex = superAdminRole.users.findIndex(
      (user) => user.emp_id === empId
    );

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found in Super Admin role"
      });
    }

    // Remove the user from the array using MongoDB update
    const result = await RoleManagment.updateOne(
      { role: "Super Admin" },
      {
        $pull: {
          users: { emp_id: empId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        message: "Failed to remove Super Admin"
      });
    }

    // Fetch the updated document
    const updatedRole = await RoleManagment.findOne({ role: "Super Admin" });

    res.json({
      message: "Super Admin removed successfully",
      updatedRole: updatedRole
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
        working_status: "Working"
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
      working_status: "Working"
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
        working_status: "Working"
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
        working_status: "Working"
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
        face_photo: user.face_photo
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
          face_photo: user.face_photo
        }))
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
      "users.emp_id": empId
    });

    if (superAdminRole) {
      roles.push("Super Admin");
      return res.json({ roles }); // Return early if Super Admin
    }

    // Check Admin role
    const adminRole = await RoleManagment.findOne({
      role: "Admin",
      "users.emp_id": empId
    });

    if (adminRole) {
      roles.push("Admin");
      return res.json({ roles }); // Return early if Admin
    }

    // Get other roles
    const otherRoles = await RoleManagment.find({
      role: { $nin: ["Super Admin", "Admin"] },
      "users.emp_id": empId
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

app.get("/api/role-management", async (req, res) => {
  try {
    const roles = await RoleManagment.find({}).sort({
      role: 1 // Sort by role name
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
      "users.emp_id": empId
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
      message: "User roles updated successfully"
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user roles"
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

    const factories = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("Factory", orderFilter);
    const monos = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("Order_No", orderFilter);
    const custStyles = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("CustStyle", orderFilter);
    const buyers = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("ShortName", orderFilter);
    const modes = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("Mode", orderFilter);
    const countries = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("Country", orderFilter);
    const origins = await ymProdConnection.db
      .collection("dt_orders")
      .distinct("Origin", orderFilter);

    // Fetch distinct stages from measurement_data, filtered by dt_orders
    let measurementFilter = {};
    if (mono) {
      const order = await ymProdConnection.db
        .collection("dt_orders")
        .findOne({ Order_No: mono }, { projection: { _id: 1 } });
      if (order) {
        measurementFilter.style_id = order._id.toString();
      }
    } else {
      const filteredOrders = await ymProdConnection.db
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
    const collection = ymProdConnection.db.collection("dt_orders");
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

    const total = await ymProdConnection.db
      .collection("dt_orders")
      .countDocuments(filter);
    const monos = await ymProdConnection.db
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

    const selectedOrders = await ymProdConnection.db
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

    const result = await ymProdConnection.db
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
    const order = await ymProdConnection.db
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
    const order = await ymProdConnection.db
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
    const order = await ymProdConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo }, { projection: { _id: 1 } });

    if (!order) {
      // console.log("Order not found for MO No:", moNo);
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
      // console.log("No measurement record found for:", { styleId, referenceNo });
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
   End Points - SCC Operaqtors
------------------------------ */

// Helper function to get the correct operator model
const getOperatorModel = (type) => {
  switch (type.toLowerCase()) {
    case "ht":
      return SCCHTOperator;
    case "fu":
      return SCCFUOperator;
    case "elastic":
      return SCCElasticOperator;
    default:
      return null;
  }
};

// Endpoint to fetch operators for a specific type (HT, FU, Elastic)
app.get("/api/scc/operators/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const OperatorModel = getOperatorModel(type);

    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }

    const operators = await OperatorModel.find()
      .populate({
        path: "emp_reference",
        select: "emp_id eng_name face_photo", // Fields to populate from User model
        model: UserMain // Explicitly specify model if on different connection
      })
      .lean();
    res.json(operators);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} operators:`, error);
    res.status(500).json({ error: "Failed to fetch operators" });
  }
});

// Endpoint to save/update an operator
app.post("/api/scc/operators/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { machineNo, emp_id } = req.body;

    if (!machineNo || !emp_id) {
      return res
        .status(400)
        .json({ error: "Machine No and Employee ID are required" });
    }

    const OperatorModel = getOperatorModel(type);
    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }

    const user = await UserMain.findOne({ emp_id })
      .select("_id emp_id eng_name face_photo") // Added emp_id for logging
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ error: `User with emp_id ${emp_id} not found.` });
    }

    const operatorData = {
      machineNo,
      emp_id, // This is the emp_id of the user
      emp_eng_name: user.eng_name, // This should be the string name
      emp_face_photo: user.face_photo,
      emp_reference: user._id
    };

    const updatedOperator = await OperatorModel.findOneAndUpdate(
      { machineNo: machineNo },
      operatorData,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate({
      // Populate after update/insert to return full data
      path: "emp_reference",
      select: "emp_id eng_name face_photo",
      model: UserMain
    });

    res.status(200).json(updatedOperator);
  } catch (error) {
    console.error(
      `[POST /api/scc/operators/${type}] Error saving/updating operator:`,
      error
    );
    if (error.code === 11000) {
      return res.status(409).json({
        error: `Operator for Machine No ${req.body.machineNo} might already exist or another unique constraint violated.`
      });
    }
    res.status(500).json({ error: "Failed to save/update operator" });
  }
});

// Endpoint to remove an operator (optional, if needed)
app.delete("/api/scc/operators/:type/:machineNo", async (req, res) => {
  try {
    const { type, machineNo } = req.params;
    const OperatorModel = getOperatorModel(type);

    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }

    const result = await OperatorModel.deleteOne({ machineNo });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Operator not found or already removed" });
    }

    res.status(200).json({ message: "Operator removed successfully" });
  } catch (error) {
    console.error(
      `Error removing ${req.params.type} operator ${req.params.machineNo}:`,
      error
    );
    res.status(500).json({ error: "Failed to remove operator" });
  }
});

app.get("/api/scc/operator-by-machine/:type/:machineNo", async (req, res) => {
  try {
    const { type, machineNo } = req.params;
    const OperatorModel = getOperatorModel(type); // SCCHTOperator, SCCFUOperator, etc.

    if (!OperatorModel) {
      return res.status(400).json({ error: "Invalid operator type" });
    }
    if (!machineNo) {
      return res.status(400).json({ error: "Machine No is required" });
    }

    // Find the operator assigned to this machine
    const assignedOperator = await OperatorModel.findOne({ machineNo })
      .populate({
        path: "emp_reference", // Path in SCCHTOperator schema etc.
        select: "emp_id eng_name face_photo", // Fields from User model
        model: UserMain // Specify UserMain model
      })
      .lean();

    if (!assignedOperator) {
      return res
        .status(404)
        .json({ message: "OPERATOR_NOT_FOUND", data: null });
    }

    // Structure the response to be easily consumable by the frontend for OperatorData
    const operatorDetails = {
      emp_id: assignedOperator.emp_id, // emp_id from the scc_xx_operator doc
      emp_eng_name: assignedOperator.emp_eng_name, // name from scc_xx_operator doc
      emp_face_photo: assignedOperator.emp_face_photo, // photo from scc_xx_operator doc
      emp_reference_id: assignedOperator.emp_reference?._id // _id from populated User (if exists)
    };

    // If emp_reference was successfully populated, prefer its details for consistency
    if (assignedOperator.emp_reference) {
      operatorDetails.emp_id =
        assignedOperator.emp_reference.emp_id || assignedOperator.emp_id; // Prefer populated
      operatorDetails.emp_eng_name =
        assignedOperator.emp_reference.eng_name ||
        assignedOperator.emp_eng_name;
      operatorDetails.emp_face_photo =
        assignedOperator.emp_reference.face_photo ||
        assignedOperator.emp_face_photo;
    }

    res.json({ data: operatorDetails });
  } catch (error) {
    console.error(
      `[API /api/scc/operator-by-machine] Error fetching operator by machine:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch operator details" });
  }
});

/* ------------------------------
   End Points - SCC Scratch Defects
------------------------------ */

// GET - Fetch all SCC scratch defects
app.get("/api/scc/scratch-defects", async (req, res) => {
  try {
    const defects = await SCCScratchDefect.find({}).sort({ no: 1 }).lean();
    res.json(defects); // Send as a direct array
  } catch (error) {
    console.error("Error fetching SCC scratch defects:", error);
    res.status(500).json({ message: "Server error fetching scratch defects" });
  }
});

// POST - Add a new SCC scratch defect
app.post("/api/scc/scratch-defects", async (req, res) => {
  try {
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message: "Defect No, English Name, and Khmer Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    const existingDefectByNo = await SCCScratchDefect.findOne({
      no: Number(no)
    });
    if (existingDefectByNo) {
      return res
        .status(409)
        .json({ message: `Scratch Defect No '${no}' already exists.` });
    }
    const existingDefectByName = await SCCScratchDefect.findOne({
      defectNameEng
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Scratch Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newScratchDefect = new SCCScratchDefect({
      no: Number(no),
      defectNameEng,
      defectNameKhmer,
      defectNameChinese: defectNameChinese || ""
    });
    await newScratchDefect.save();
    res.status(201).json({
      message: "SCC scratch defect added successfully",
      defect: newScratchDefect
    });
  } catch (error) {
    console.error("Error adding SCC scratch defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. Scratch Defect No or Name might already exist."
      });
    }
    res.status(500).json({
      message: "Failed to add SCC scratch defect",
      error: error.message
    });
  }
});

// PUT - Update an existing SCC scratch defect by ID
app.put("/api/scc/scratch-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message:
          "Defect No, English Name, and Khmer Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid scratch defect ID format." });
    }

    const existingDefectByNo = await SCCScratchDefect.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingDefectByNo) {
      return res.status(409).json({
        message: `Scratch Defect No '${no}' already exists for another defect.`
      });
    }
    const existingDefectByName = await SCCScratchDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Scratch Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedScratchDefect = await SCCScratchDefect.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChinese: defectNameChinese || ""
      },
      { new: true, runValidators: true }
    );

    if (!updatedScratchDefect) {
      return res.status(404).json({ message: "SCC Scratch Defect not found." });
    }
    res.status(200).json({
      message: "SCC scratch defect updated successfully",
      defect: updatedScratchDefect
    });
  } catch (error) {
    console.error("Error updating SCC scratch defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Update failed due to duplicate Scratch Defect No or Name."
      });
    }
    res.status(500).json({
      message: "Failed to update SCC scratch defect",
      error: error.message
    });
  }
});

// DELETE - Delete an SCC scratch defect by ID
app.delete("/api/scc/scratch-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid scratch defect ID format." });
    }
    const deletedScratchDefect = await SCCScratchDefect.findByIdAndDelete(id);
    if (!deletedScratchDefect) {
      return res.status(404).json({ message: "SCC Scratch Defect not found." });
    }
    res
      .status(200)
      .json({ message: "SCC scratch defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting SCC scratch defect:", error);
    res.status(500).json({
      message: "Failed to delete SCC scratch defect",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - EMB Defects
------------------------------ */

// GET - Fetch all EMB defects
app.get("/api/scc/emb-defects", async (req, res) => {
  try {
    const defects = await EMBDefect.find({}).sort({ no: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching EMB defects:", error);
    res.status(500).json({ message: "Server error fetching EMB defects" });
  }
});

// POST - Add a new EMB defect
app.post("/api/scc/emb-defects", async (req, res) => {
  try {
    const { no, defectNameEng, defectNameKhmer, defectNameChine } = req.body;

    // --- Added validation from your example ---
    if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message: "Defect No, English Name, and Khmer Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    const existingDefectByNo = await EMBDefect.findOne({ no: Number(no) });
    if (existingDefectByNo) {
      return res
        .status(409)
        .json({ message: `EMB Defect No '${no}' already exists.` });
    }
    const existingDefectByName = await EMBDefect.findOne({ defectNameEng });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `EMB Defect name (English) '${defectNameEng}' already exists.`
      });
    }
    // --- End of validation ---

    const newDefect = new EMBDefect({
      no: Number(no),
      defectNameEng,
      defectNameKhmer,
      defectNameChine: defectNameChine || ""
    });
    await newDefect.save();
    res
      .status(201)
      .json({ message: "EMB defect added successfully", defect: newDefect });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Defect No or Name might already exist."
      });
    }
    console.error("Error adding EMB defect:", error);
    res
      .status(500)
      .json({ message: "Failed to add EMB defect", error: error.message });
  }
});

// PUT - Update an existing EMB defect by ID
app.put("/api/scc/emb-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { no, defectNameEng, defectNameKhmer, defectNameChine } = req.body;

    if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message:
          "Defect No, English Name, and Khmer Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid EMB defect ID format." });
    }

    const existingDefectByNo = await EMBDefect.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingDefectByNo) {
      return res.status(409).json({
        message: `EMB Defect No '${no}' already exists for another defect.`
      });
    }
    const existingDefectByName = await EMBDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `EMB Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedDefect = await EMBDefect.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChine: defectNameChine || ""
      },
      { new: true, runValidators: true }
    );

    if (!updatedDefect) {
      return res.status(404).json({ message: "EMB Defect not found." });
    }
    res.status(200).json({
      message: "EMB defect updated successfully",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error updating EMB defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Update failed due to duplicate EMB Defect No or Name."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to update EMB defect", error: error.message });
  }
});

// DELETE - Delete an EMB defect by ID
app.delete("/api/scc/emb-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid EMB defect ID format." });
    }
    const deletedDefect = await EMBDefect.findByIdAndDelete(id);
    if (!deletedDefect) {
      return res.status(404).json({ message: "EMB Defect not found." });
    }
    res.status(200).json({ message: "EMB defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting EMB defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete EMB defect", error: error.message });
  }
});

/* ------------------------------
   End Points - Printing Defects
------------------------------ */

// GET - Fetch all Printing defects
app.get("/api/scc/printing-defects", async (req, res) => {
  try {
    const defects = await PrintingDefect.find({}).sort({ no: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching Printing defects:", error);
    res.status(500).json({ message: "Server error fetching Printing defects" });
  }
});

/* ------------------------------
   End Points - Combined Defects
------------------------------ */
app.get("/api/scc/all-defects", async (req, res) => {
  try {
    const [embDefects, printingDefects] = await Promise.all([
      EMBDefect.find({}).sort({ no: 1 }).lean(),
      PrintingDefect.find({}).sort({ no: 1 }).lean()
    ]);

    const allDefects = [...embDefects, ...printingDefects].sort(
      (a, b) => a.no - b.no
    );

    res.json(allDefects);
  } catch (error) {
    console.error("Error fetching all defects:", error);
    res.status(500).json({ message: "Server error fetching all defects" });
  }
});

/* ------------------------------
   End Points - SCC HT/FU
------------------------------ */

// 1. Define the absolute destination path and ensure the directory exists
const sccUploadPath = path.join(__dirname, "public", "storage", "scc_images");
//fs.mkdirSync(sccUploadPath, { recursive: true }); // Make sure directory exists

// 2. MODIFIED: Use memoryStorage to process the image buffer in RAM before saving
const sccMemoryStorage = multer.memoryStorage();
const sccUpload = multer({
  storage: sccMemoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // Optional: Add a limit (e.g., 25MB) to prevent very large files
});

// 3. MODIFIED: Update the endpoint to process the image with sharp and save it
app.post(
  "/api/scc/upload-image",
  sccUpload.single("imageFile"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    try {
      // Generate a unique filename (your existing logic is good)
      const { imageType, inspectionDate } = req.body;
      const datePart = inspectionDate
        ? inspectionDate.replace(/\//g, "-")
        : new Date().toISOString().split("T")[0];
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

      // We will save as .webp for the best compression and web performance
      const newFilename = `${
        imageType || "sccimage"
      }-${datePart}-${uniqueSuffix}.webp`;
      const finalDiskPath = path.join(sccUploadPath, newFilename);

      // Use sharp to process the image from the buffer
      await sharp(req.file.buffer)
        .resize({
          width: 1024,
          height: 1024,
          fit: "inside",
          withoutEnlargement: true
        }) // Resize to max 1024px, don't enlarge small images
        .webp({ quality: 80 }) // Convert to WebP format with 80% quality
        .toFile(finalDiskPath); // Save the processed image to disk

      // The public URL that the frontend will use to display the image
      const publicUrlPath = `${API_BASE_URL}/storage/scc_images/${newFilename}`;
      res.json({
        success: true,
        filePath: publicUrlPath,
        filename: newFilename
      });
    } catch (error) {
      console.error("Error processing or saving image:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to process uploaded image." });
    }
  }
);

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
    const { _id, operatorData, ...dataToSave } = req.body;
    if (!dataToSave.machineNo) {
      return res.status(400).json({ message: "Machine No is required." });
    }
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    // Frontend now sends standardSpecification as an array of 1 or 2 objects
    // Each object should already have tempOffsetPlus and tempOffsetMinus calculated by SCCPage
    if (
      dataToSave.standardSpecification &&
      dataToSave.standardSpecification.length > 0
    ) {
      dataToSave.standardSpecification = dataToSave.standardSpecification.map(
        (spec) => ({
          ...spec, // type, method, timeSec, tempC, tempOffsetPlus, tempOffsetMinus, status
          remarks: spec.remarks?.trim() || "NA",
          pressure:
            spec.pressure !== null && spec.pressure !== undefined
              ? Number(spec.pressure)
              : null
        })
      );
    } else {
      // It's required to have at least one spec
      return res
        .status(400)
        .json({ message: "Standard Specification is required." });
    }

    // Include operatorData if provided
    const finalDataToSave = { ...dataToSave };
    if (operatorData && operatorData.emp_id && operatorData.emp_reference_id) {
      finalDataToSave.operatorData = {
        emp_id: operatorData.emp_id,
        emp_eng_name: operatorData.emp_eng_name || "N/A",
        emp_face_photo: operatorData.emp_face_photo || null,
        emp_reference_id: operatorData.emp_reference_id
      };
    } else {
      console.log(
        "[API /api/scc/ht-first-output] No complete operatorData provided or found, will not be saved."
      );
    }

    let record;
    if (_id) {
      record = await HTFirstOutput.findByIdAndUpdate(_id, finalDataToSave, {
        new: true,
        runValidators: true,
        upsert: false
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Record not found for update." });
    } else {
      const existing = await HTFirstOutput.findOne({
        moNo: finalDataToSave.moNo,
        color: finalDataToSave.color,
        inspectionDate: finalDataToSave.inspectionDate,
        machineNo: finalDataToSave.machineNo
      });
      if (existing) {
        record = await HTFirstOutput.findByIdAndUpdate(
          existing._id,
          finalDataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new HTFirstOutput(finalDataToSave);
        await record.save();
      }
    }
    res
      .status(201)
      .json({ message: "HT First Output saved successfully", data: record });
  } catch (error) {
    console.error("Error saving HT First Output:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. A record with this MO, Color, Date, and Machine No already exists.",
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

// POST /api/scc/fu-first-output - Apply analogous changes as above for HTFirstOutput
app.post("/api/scc/fu-first-output", async (req, res) => {
  try {
    const { _id, operatorData, ...dataToSave } = req.body;
    if (!dataToSave.machineNo) {
      return res.status(400).json({ message: "Machine No is required." });
    }
    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    if (
      dataToSave.standardSpecification &&
      dataToSave.standardSpecification.length > 0
    ) {
      dataToSave.standardSpecification = dataToSave.standardSpecification.map(
        (spec) => ({
          ...spec,
          remarks: spec.remarks?.trim() || "NA",
          pressure:
            spec.pressure !== null && spec.pressure !== undefined
              ? Number(spec.pressure)
              : null
        })
      );
    } else {
      return res
        .status(400)
        .json({ message: "Standard Specification is required." });
    }

    const finalDataToSave = { ...dataToSave };
    if (operatorData && operatorData.emp_id && operatorData.emp_reference_id) {
      finalDataToSave.operatorData = {
        emp_id: operatorData.emp_id,
        emp_eng_name: operatorData.emp_eng_name || "N/A",
        emp_face_photo: operatorData.emp_face_photo || null,
        emp_reference_id: operatorData.emp_reference_id
      };
      //console.log("[API /api/scc/fu-first-output] OperatorData prepared for saving:", finalDataToSave.operatorData);
    } else {
      console.log(
        "[API /api/scc/fu-first-output] No complete operatorData provided, will not be saved."
      );
    }

    let record;
    if (_id) {
      record = await FUFirstOutput.findByIdAndUpdate(_id, finalDataToSave, {
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
        moNo: finalDataToSave.moNo,
        color: finalDataToSave.color,
        inspectionDate: finalDataToSave.inspectionDate,
        machineNo: finalDataToSave.machineNo
      });
      if (existing) {
        record = await FUFirstOutput.findByIdAndUpdate(
          existing._id,
          finalDataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new FUFirstOutput(finalDataToSave);
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
          "Duplicate entry. A record with this MO, Color, Date, and Machine No already exists.",
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

app.get("/api/scc/ht-first-output", async (req, res) => {
  try {
    const { moNo, color, inspectionDate, machineNo } = req.query; // Added machineNo
    if (!moNo || !color || !inspectionDate || !machineNo) {
      // Added machineNo to validation
      return res.status(400).json({
        message: "MO No, Color, Inspection Date, and Machine No are required."
      }); // Updated message
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await HTFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate,
      machineNo // Added machineNo to query
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "HT_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Backend returns full object, not nested under 'data'
  } catch (error) {
    console.error("Error fetching HT First Output:", error);
    res.status(500).json({
      message: "Failed to fetch HT First Output",
      error: error.message
    });
  }
});

app.get("/api/scc/fu-first-output", async (req, res) => {
  try {
    const { moNo, color, inspectionDate, machineNo } = req.query; // Added machineNo
    if (!moNo || !color || !inspectionDate || !machineNo) {
      // Added machineNo to validation
      return res.status(400).json({
        message: "MO No, Color, Inspection Date, and Machine No are required."
      }); // Updated message
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await FUFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate,
      machineNo // Added machineNo to query
    });
    if (!record) {
      return res
        .status(200)
        .json({ message: "FU_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Backend returns full object
  } catch (error) {
    console.error("Error fetching FU First Output:", error);
    res.status(500).json({
      message: "Failed to fetch FU First Output",
      error: error.message
    });
  }
});

// 2. `GET /api/scc/get-first-output-specs` (Updated)
app.get("/api/scc/get-first-output-specs", async (req, res) => {
  try {
    const { moNo, color } = req.query;
    if (!moNo || !color) {
      return res.status(400).json({ message: "MO No and Color are required." });
    }
    //const formattedDate = formatDateToMMDDYYYY(inspectionDate);

    let specs = null;
    const processRecord = (record) => {
      if (record && record.standardSpecification) {
        const secondHeatSpec = record.standardSpecification.find(
          (s) =>
            s.type === "2nd heat" &&
            s.status === "Pass" &&
            s.timeSec &&
            s.tempC &&
            s.pressure !== null
        );
        const firstSpec = record.standardSpecification.find(
          (s) =>
            s.type === "first" &&
            s.status === "Pass" &&
            s.timeSec &&
            s.tempC &&
            s.pressure !== null
        );

        // Prioritize 2nd heat spec if it's 'Pass' and valid
        if (secondHeatSpec) {
          return {
            tempC: secondHeatSpec.tempC,
            timeSec: secondHeatSpec.timeSec,
            pressure: secondHeatSpec.pressure
          };
        } else if (firstSpec) {
          // Fallback to first spec if it's 'Pass' and valid
          return {
            tempC: firstSpec.tempC,
            timeSec: firstSpec.timeSec,
            pressure: firstSpec.pressure
          };
        }
        // If no 'Pass' specs, try any '2nd heat' then any 'first'
        const anySecondHeatSpec = record.standardSpecification.find(
          (s) =>
            s.type === "2nd heat" && s.timeSec && s.tempC && s.pressure !== null
        );
        if (anySecondHeatSpec) {
          return {
            tempC: anySecondHeatSpec.tempC,
            timeSec: anySecondHeatSpec.timeSec,
            pressure: anySecondHeatSpec.pressure
          };
        }
        const anyFirstSpec = record.standardSpecification.find(
          (s) =>
            s.type === "first" && s.timeSec && s.tempC && s.pressure !== null
        );
        if (anyFirstSpec) {
          return {
            tempC: anyFirstSpec.tempC,
            timeSec: anyFirstSpec.timeSec,
            pressure: anyFirstSpec.pressure
          };
        }
      }
      return null;
    };

    // Try HT First Output
    const htRecord = await HTFirstOutput.findOne({
      moNo,
      color
    }).lean();
    specs = processRecord(htRecord);

    // If not found in HT, try FU First Output
    if (!specs) {
      const fuRecord = await FUFirstOutput.findOne({
        moNo,
        color
      }).lean();
      specs = processRecord(fuRecord);
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

/* ------------------------------
   End Points - SCC Daily Testing
------------------------------ */

// Endpoints for SCCDailyTesting
app.post("/api/scc/daily-testing", async (req, res) => {
  try {
    const { _id, operatorData, ...dataToSave } = req.body; // Destructure operatorData

    dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    dataToSave.remarks = dataToSave.remarks?.trim() || "NA";

    if (
      dataToSave.standardSpecifications &&
      dataToSave.standardSpecifications.pressure !== undefined
    ) {
      dataToSave.standardSpecifications.pressure =
        dataToSave.standardSpecifications.pressure !== null &&
        dataToSave.standardSpecifications.pressure !== ""
          ? Number(dataToSave.standardSpecifications.pressure)
          : null;
    }

    if (
      dataToSave.parameterAdjustmentRecords &&
      Array.isArray(dataToSave.parameterAdjustmentRecords)
    ) {
      dataToSave.parameterAdjustmentRecords =
        dataToSave.parameterAdjustmentRecords.map((rec) => ({
          ...rec,
          adjustedTempC:
            rec.adjustedTempC !== null && rec.adjustedTempC !== ""
              ? Number(rec.adjustedTempC)
              : null,
          adjustedTimeSec:
            rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
              ? Number(rec.adjustedTimeSec)
              : null,
          adjustedPressure:
            rec.adjustedPressure !== null && rec.adjustedPressure !== ""
              ? Number(rec.adjustedPressure)
              : null
        }));
    } else {
      dataToSave.parameterAdjustmentRecords = [];
    }

    const finalDataToSave = { ...dataToSave };
    // Include operatorData if provided and valid
    if (operatorData && operatorData.emp_id && operatorData.emp_reference_id) {
      finalDataToSave.operatorData = {
        emp_id: operatorData.emp_id,
        emp_eng_name: operatorData.emp_eng_name || "N/A",
        emp_face_photo: operatorData.emp_face_photo || null,
        emp_reference_id: operatorData.emp_reference_id
      };
    } else {
      console.log(
        "[API /api/scc/daily-testing] No complete operatorData provided, will not be saved."
      );
    }

    let record;
    if (_id) {
      record = await SCCDailyTesting.findByIdAndUpdate(_id, finalDataToSave, {
        // Use finalDataToSave
        new: true,
        runValidators: true
      });
      if (!record)
        return res
          .status(404)
          .json({ message: "Daily Testing record not found for update." });
    } else {
      const existing = await SCCDailyTesting.findOne({
        moNo: finalDataToSave.moNo,
        color: finalDataToSave.color,
        machineNo: finalDataToSave.machineNo,
        inspectionDate: finalDataToSave.inspectionDate
      });
      if (existing) {
        record = await SCCDailyTesting.findByIdAndUpdate(
          existing._id,
          finalDataToSave,
          { new: true, runValidators: true }
        );
      } else {
        record = new SCCDailyTesting(finalDataToSave); // Use finalDataToSave
        await record.save();
      }
    }
    res.status(201).json({
      message: "Daily Testing report saved successfully",
      data: record
    });
  } catch (error) {
    console.error(
      "[API /api/scc/daily-testing] Error saving Daily Testing report:",
      error
    );
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
    // No change needed here for GET, as it returns what's in DB. Frontend handles display.
    res.json(record);
  } catch (error) {
    console.error("Error fetching Daily Testing report:", error);
    res.status(500).json({
      message: "Failed to fetch Daily Testing report",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - SCC Daily HT QC
------------------------------ */

// Helper to parse pressure string to number (if needed, but schema now enforces Number)
const parsePressureToNumber = (pressureStr) => {
  if (pressureStr === null || pressureStr === undefined || pressureStr === "")
    return null;
  const num = parseFloat(pressureStr);
  return isNaN(num) ? null : num;
};

// Helper function to escape special characters for regex
function escapeRegex(string) {
  if (typeof string !== "string") {
    return "";
  }
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// 1. GET /api/scc/ht-first-output/search-active-mos?term=<searchTerm>
//    Searches ht_first_outputs for MOs based on a search term.
app.get("/api/scc/ht-first-output/search-active-mos", async (req, res) => {
  try {
    const { term } = req.query;

    // Uncomment for debugging
    // console.log("[SERVER] /search-active-mos - Received term:", term);

    if (!term || typeof term !== "string" || term.trim() === "") {
      // console.log("[SERVER] /search-active-mos - No valid term, returning [].");
      return res.json([]);
    }

    const trimmedTerm = term.trim();
    if (trimmedTerm === "") {
      return res.json([]);
    }
    const escapedTerm = escapeRegex(trimmedTerm); // Escape the trimmed term

    // Ensure HTFirstOutput is correctly defined and connected
    if (!HTFirstOutput || typeof HTFirstOutput.aggregate !== "function") {
      console.error(
        "[SERVER] HTFirstOutput model is not correctly defined or initialized."
      );
      return res.status(500).json({ message: "Server configuration error." });
    }

    const mos = await HTFirstOutput.aggregate([
      {
        $match: {
          // Changed from `^${escapedTerm}` (starts with) to `escapedTerm` (contains)
          moNo: { $regex: escapedTerm, $options: "i" }
        }
      },
      {
        // Sorting helps $first pick a consistent (e.g., latest) buyer/style if multiple entries exist for an MO
        $sort: { moNo: 1, createdAt: -1 }
      },
      {
        $group: {
          _id: "$moNo", // Group by MO number to get distinct MOs
          moNo: { $first: "$moNo" },
          buyer: { $first: "$buyer" },
          buyerStyle: { $first: "$buyerStyle" }
        }
      },
      {
        $project: {
          _id: 0, // Exclude the default _id from group stage
          moNo: 1,
          buyer: { $ifNull: ["$buyer", ""] }, // Ensure buyer is always a string
          buyerStyle: { $ifNull: ["$buyerStyle", ""] } // Ensure buyerStyle is always a string
        }
      },
      { $limit: 15 } // Limit results for performance, increased slightly
    ]);

    // Uncomment for debugging
    // console.log("[SERVER] /search-active-mos - Found MOs:", mos.length, JSON.stringify(mos));
    res.json(mos);
  } catch (error) {
    console.error(
      "[SERVER] Error searching active MOs from HTFirstOutput:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to search MOs", error: error.message });
  }
});

// 2. GET /api/scc/ht-first-output/mo-details-for-registration?moNo=<moNo>
//    Fetches buyer, buyerStyle, and distinct colors for a given MO from ht_first_outputs.
app.get(
  "/api/scc/ht-first-output/mo-details-for-registration",
  async (req, res) => {
    try {
      const { moNo } = req.query;
      if (!moNo) {
        return res.status(400).json({ message: "MO No is required." });
      }

      const sampleRecord = await HTFirstOutput.findOne({ moNo })
        .sort({ inspectionDate: -1, createdAt: -1 }) // Get the latest overall record for buyer/style consistency
        .lean();

      if (!sampleRecord) {
        return res
          .status(404)
          .json({ message: "MO not found in HT First Output records." });
      }

      // Fetch distinct colors for the MO across all its records.
      const distinctColors = await HTFirstOutput.distinct("color", { moNo });

      res.json({
        buyer: sampleRecord.buyer || "",
        buyerStyle: sampleRecord.buyerStyle || "",
        colors: distinctColors.sort() || [] // Sort colors alphabetically
      });
    } catch (error) {
      console.error("Error fetching MO details for registration:", error);
      res.status(500).json({
        message: "Failed to fetch MO details",
        error: error.message
      });
    }
  }
);

// 3. GET /api/scc/ht-first-output/specs-for-registration?moNo=<moNo>&color=<color>
//    Fetches the standard specs (Temp, Time, Pressure) for a given MO/Color from ht_first_outputs.
app.get("/api/scc/ht-first-output/specs-for-registration", async (req, res) => {
  try {
    const { moNo, color } = req.query;

    if (!moNo || !color || moNo.trim() === "" || color.trim() === "") {
      console.log(
        "[SPECS_ENDPOINT] Validation Error: MO No and Color are required and cannot be empty."
      );
      return res
        .status(400)
        .json({ message: "MO No and Color are required and cannot be empty." });
    }

    const trimmedMoNo = moNo.trim();
    const trimmedColor = color.trim();

    const record = await HTFirstOutput.findOne({
      moNo: trimmedMoNo,
      color: trimmedColor
    })
      .sort({ inspectionDate: -1, createdAt: -1 }) // Get the latest based on date, then creation
      .lean();

    if (!record) {
      return res.status(200).json({
        // Send 200 with message, client handles it
        message: "SPECS_NOT_FOUND_NO_RECORD",
        reqTemp: null,
        reqTime: null,
        reqPressure: null
      });
    }

    if (
      !record.standardSpecification ||
      record.standardSpecification.length === 0
    ) {
      return res.status(200).json({
        message: "SPECS_NOT_FOUND_STANDARD_SPEC_ARRAY_EMPTY",
        reqTemp: null,
        reqTime: null,
        reqPressure: null
      });
    }

    // Primary target: 'first' type spec with all values non-null
    let firstSpec = record.standardSpecification.find(
      (s) =>
        s.type === "first" &&
        s.tempC != null &&
        s.timeSec != null &&
        s.pressure != null
    );

    if (firstSpec) {
      return res.json({
        reqTemp: firstSpec.tempC,
        reqTime: firstSpec.timeSec,
        reqPressure: firstSpec.pressure
      });
    }

    // Fallback: If no complete 'first' spec, try to find any 'first' spec

    firstSpec = record.standardSpecification.find((s) => s.type === "first");

    if (firstSpec) {
      return res.json({
        reqTemp: firstSpec.tempC !== undefined ? firstSpec.tempC : null,
        reqTime: firstSpec.timeSec !== undefined ? firstSpec.timeSec : null,
        reqPressure:
          firstSpec.pressure !== undefined ? firstSpec.pressure : null
      });
    }

    // If no 'first' spec of any kind is found

    return res.status(200).json({
      message: "SPECS_NOT_FOUND_NO_FIRST_TYPE",
      reqTemp: null,
      reqTime: null,
      reqPressure: null
    });
  } catch (error) {
    console.error(
      `[SPECS_ENDPOINT] Critical error fetching specs for MO: "${req.query.moNo}", Color: "${req.query.color}":`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch specifications due to server error",
      error: error.message
    });
  }
});

// 4. POST /api/scc/daily-htfu/register-machine
//    Registers a machine for daily testing. Creates a new document in daily_testing_ht_fus.

app.post("/api/scc/daily-htfu/register-machine", async (req, res) => {
  try {
    const {
      inspectionDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      baseReqTemp,
      baseReqTime,
      baseReqPressure,
      operatorData, // Expecting { emp_id, emp_eng_name, emp_face_photo, emp_reference_id }
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title // Inspector info
    } = req.body;

    const formattedDate = inspectionDate; // Already formatted by frontend's formatDateForAPI

    if (!formattedDate || !machineNo || !moNo || !color) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: Inspection Date, Machine No, MO No, and Color."
      });
    }

    // Validate operatorData if provided
    if (
      operatorData &&
      (!operatorData.emp_id || !operatorData.emp_reference_id)
    ) {
      console.warn(
        "[Register Machine] Received operatorData but it's incomplete:",
        operatorData
      );
      // Decide if this should be an error or if operatorData becomes null
      // return res.status(400).json({ success: false, message: "Incomplete operator data provided." });
    }

    const now = new Date();
    const registrationTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    const existingRegistration = await DailyTestingHTFU.findOne({
      inspectionDate: formattedDate,
      machineNo,
      moNo,
      color
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message:
          "This Machine-MO-Color combination is already registered for this date.",
        data: existingRegistration
      });
    }

    const newRegistrationData = {
      inspectionDate: formattedDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      baseReqTemp: baseReqTemp !== undefined ? baseReqTemp : null,
      baseReqTime: baseReqTime !== undefined ? baseReqTime : null,
      baseReqPressure: baseReqPressure !== undefined ? baseReqPressure : null,
      operatorData:
        operatorData && operatorData.emp_id && operatorData.emp_reference_id
          ? operatorData
          : null, // Save valid operatorData or null
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title,
      inspectionTime: registrationTime,
      inspections: [],
      stretchTestResult: "Pending",
      washingTestResult: "Pending",
      isStretchWashingTestDone: false
    };

    console.log("[Register Machine] Data to save:", newRegistrationData);

    const newRegistration = new DailyTestingHTFU(newRegistrationData);
    await newRegistration.save();

    // Populate operatorData.emp_reference_id for the response
    const populatedRegistration = await DailyTestingHTFU.findById(
      newRegistration._id
    )
      .populate({
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      })
      .lean();

    res.status(201).json({
      success: true,
      message: "Machine registered successfully for daily HT/FU QC.",
      data: populatedRegistration || newRegistration
    });
  } catch (error) {
    console.error("Error registering machine for Daily HT/FU QC:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry. This registration might already exist.",
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to register machine",
      error: error.message
    });
  }
});

// 5. GET /api/scc/daily-htfu/by-date?inspectionDate=<date>
//    Fetches all DailyTestingHTFU records for a given inspection date.

app.get("/api/scc/daily-htfu/by-date", async (req, res) => {
  try {
    const { inspectionDate, moNo: filterMoNo } = req.query; // Add moNo for filtering
    if (!inspectionDate) {
      return res.status(400).json({ message: "Inspection Date is required." });
    }
    const formattedDate = inspectionDate; // Expecting MM/DD/YYYY from frontend

    const query = { inspectionDate: formattedDate };
    if (filterMoNo && filterMoNo !== "All") {
      query.moNo = filterMoNo;
    }

    const records = await DailyTestingHTFU.find(query)
      .populate({
        // Populate the emp_reference_id within operatorData
        path: "operatorData.emp_reference_id",
        model: UserMain, // Your User model
        select: "emp_id eng_name face_photo" // Fields to select from User
      })
      .sort({ machineNo: 1 }) // Consider collation for proper numeric sort if machineNo can be "1", "10", "2"
      .lean();

    // The `operatorData` on each record will now have `emp_reference_id` populated if it was a valid ObjectId
    // The frontend will then use `operatorData.emp_eng_name`, `operatorData.emp_face_photo` etc.
    // which are stored directly, and the populated `emp_reference_id` can be used if needed for consistency.

    res.json(records || []);
  } catch (error) {
    console.error("Error fetching Daily HT/FU records by date:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch daily records", error: error.message });
  }
});

// Endpoint to fetch distinct MO Numbers for a given inspection date from daily_testing_ht_fus
app.get("/api/scc/daily-htfu/distinct-mos", async (req, res) => {
  try {
    const { inspectionDate } = req.query;
    if (!inspectionDate) {
      return res.status(400).json({ message: "Inspection Date is required." });
    }
    const formattedDate = inspectionDate; // Expecting MM/DD/YYYY from frontend

    const distinctMoNos = await DailyTestingHTFU.distinct("moNo", {
      inspectionDate: formattedDate
    });

    res.json(distinctMoNos.sort() || []);
  } catch (error) {
    console.error("Error fetching distinct MOs for Daily HT/FU QC:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct MOs", error: error.message });
  }
});

// 6. POST /api/scc/daily-htfu/submit-slot-inspection
//    Submits inspection data for a specific time slot for ONE machine.
app.post("/api/scc/daily-htfu/submit-slot-inspection", async (req, res) => {
  try {
    const {
      inspectionDate,
      timeSlotKey,
      inspectionNo,
      dailyTestingDocId,
      temp_req, // This will be machineDoc.baseReqTemp from frontend
      temp_actual,
      temp_isNA,
      temp_isUserModified,
      time_req, // machineDoc.baseReqTime
      time_actual,
      time_isNA,
      time_isUserModified,
      pressure_req, // machineDoc.baseReqPressure
      pressure_actual,
      pressure_isNA,
      pressure_isUserModified,
      emp_id
    } = req.body;

    // Validate required fields for a single submission
    if (
      !inspectionDate ||
      !timeSlotKey ||
      !inspectionNo || // Ensure inspectionNo is a valid number
      !dailyTestingDocId ||
      (temp_actual === undefined && !temp_isNA) || // actual is required if not N/A
      (time_actual === undefined && !time_isNA) ||
      (pressure_actual === undefined && !pressure_isNA)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid required fields for slot inspection submission."
      });
    }

    const formattedDate = inspectionDate; // Already formatted

    const record = await DailyTestingHTFU.findById(dailyTestingDocId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Daily testing record not found for ID: ${dailyTestingDocId}`
      });
    }

    if (record.inspectionDate !== formattedDate) {
      return res.status(400).json({
        success: false,
        message: `Date mismatch for record ID: ${dailyTestingDocId}. Expected ${formattedDate}, found ${record.inspectionDate}`
      });
    }

    const slotData = {
      inspectionNo: Number(inspectionNo),
      timeSlotKey,
      temp_req: temp_req !== undefined ? temp_req : null,
      temp_actual: temp_isNA
        ? null
        : temp_actual !== undefined
        ? temp_actual
        : null,
      temp_isNA: !!temp_isNA,
      temp_isUserModified: !!temp_isUserModified,
      time_req: time_req !== undefined ? time_req : null,
      time_actual: time_isNA
        ? null
        : time_actual !== undefined
        ? time_actual
        : null,
      time_isNA: !!time_isNA,
      time_isUserModified: !!time_isUserModified,
      pressure_req: pressure_req !== undefined ? pressure_req : null,
      pressure_actual: pressure_isNA
        ? null
        : pressure_actual !== undefined
        ? pressure_actual
        : null,
      pressure_isNA: !!pressure_isNA,
      pressure_isUserModified: !!pressure_isUserModified,
      inspectionTimestamp: new Date()
    };

    const existingSlotIndex = record.inspections.findIndex(
      (insp) => insp.timeSlotKey === timeSlotKey
    );

    if (existingSlotIndex > -1) {
      // If you want to allow updates, replace the item:
      // record.inspections[existingSlotIndex] = slotData;
      // For now, prevent re-submission as per original logic:
      return res.status(409).json({
        success: false,
        message: `Slot ${timeSlotKey} has already been submitted for this record. Updates are not currently supported via this endpoint.`
      });
    } else {
      record.inspections.push(slotData);
    }

    record.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );

    // Update general record info
    record.emp_id = emp_id;
    const now = new Date();
    record.inspectionTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    await record.save();

    res.status(201).json({
      success: true,
      message: `Inspection for slot ${timeSlotKey} submitted successfully.`,
      data: record // Return the updated document
    });
  } catch (error) {
    console.error("Error submitting slot inspection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit slot inspection",
      error: error.message
    });
  }
});

// 7. PUT /api/scc/daily-htfu/update-test-result/:docId
//    Updates stretch or washing test results for a specific DailyTestingHTFU document.
app.put("/api/scc/daily-htfu/update-test-result/:docId", async (req, res) => {
  try {
    const { docId } = req.params;
    const {
      stretchTestResult,
      stretchTestRejectReasons, // This will be an array of defect names (strings)
      washingTestResult,
      emp_id // Employee performing the update
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Document ID." });
    }

    const record = await DailyTestingHTFU.findById(docId);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Daily testing record not found." });
    }

    const updateFields = {};
    let updated = false;

    if (stretchTestResult !== undefined) {
      if (
        !["Pass", "Reject", "Pending", "", null].includes(stretchTestResult)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Stretch Test Result value."
        });
      }
      updateFields.stretchTestResult =
        stretchTestResult === "" ? "Pending" : stretchTestResult;
      if (updateFields.stretchTestResult === "Reject") {
        updateFields.stretchTestRejectReasons = Array.isArray(
          stretchTestRejectReasons
        )
          ? stretchTestRejectReasons
          : [];
      } else {
        updateFields.stretchTestRejectReasons = []; // Clear reasons if not 'Reject'
      }
      updated = true;
    }

    if (washingTestResult !== undefined) {
      if (
        !["Pass", "Reject", "Pending", "", null].includes(washingTestResult)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Washing Test Result value."
        });
      }
      updateFields.washingTestResult =
        washingTestResult === "" ? "Pending" : washingTestResult;
      updated = true;
    }

    if (updated && !record.isStretchWashingTestDone) {
      if (
        (updateFields.stretchTestResult &&
          updateFields.stretchTestResult !== "Pending") ||
        (updateFields.washingTestResult &&
          updateFields.washingTestResult !== "Pending")
      ) {
        updateFields.isStretchWashingTestDone = true;
      }
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No valid test result fields provided for update."
      });
    }

    if (emp_id) {
      updateFields.emp_id = emp_id;
      const now = new Date();
      updateFields.inspectionTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;
    }

    const updatedRecord = await DailyTestingHTFU.findByIdAndUpdate(
      docId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate({
      path: "operatorData.emp_reference_id",
      model: UserMain,
      select: "emp_id eng_name face_photo"
    });

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Failed to update record, record not found after update attempt."
      });
    }

    res.status(200).json({
      success: true,
      message: "Test result updated successfully.",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error updating test result:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update test result",
      error: error.message
    });
  }
});

/* ------------------------------
   End Point - SCC Daily FUQC
------------------------------ */

// 1. Search Active MOs for FUQC Registration (from fu_first_outputs)
app.get("/api/scc/fu-first-output/search-active-mos", async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || typeof term !== "string" || term.trim() === "")
      return res.json([]);
    const trimmedTerm = term.trim();
    if (trimmedTerm === "") return res.json([]);
    const escapedTerm = escapeRegex(trimmedTerm);

    if (!FUFirstOutput || typeof FUFirstOutput.aggregate !== "function") {
      console.error(
        "[SERVER FUQC] FUFirstOutput model is not correctly defined."
      );
      return res.status(500).json({ message: "Server configuration error." });
    }

    const mos = await FUFirstOutput.aggregate([
      { $match: { moNo: { $regex: escapedTerm, $options: "i" } } },
      { $sort: { moNo: 1, createdAt: -1 } },
      {
        $group: {
          _id: "$moNo",
          moNo: { $first: "$moNo" },
          buyer: { $first: "$buyer" },
          buyerStyle: { $first: "$buyerStyle" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          buyer: { $ifNull: ["$buyer", ""] },
          buyerStyle: { $ifNull: ["$buyerStyle", ""] }
        }
      },
      { $limit: 15 }
    ]);
    res.json(mos);
  } catch (error) {
    console.error("[SERVER FUQC] Error searching active FU MOs:", error);
    res
      .status(500)
      .json({ message: "Failed to search FU MOs", error: error.message });
  }
});

// 2. Get MO Details for FUQC Registration (from fu_first_outputs)
app.get(
  "/api/scc/fu-first-output/mo-details-for-registration",
  async (req, res) => {
    try {
      const { moNo } = req.query;
      if (!moNo) return res.status(400).json({ message: "MO No is required." });

      const sampleRecord = await FUFirstOutput.findOne({ moNo })
        .sort({ inspectionDate: -1, createdAt: -1 })
        .lean();
      if (!sampleRecord)
        return res
          .status(404)
          .json({ message: "MO not found in Fusing First Output records." });

      const distinctColors = await FUFirstOutput.distinct("color", { moNo });
      res.json({
        buyer: sampleRecord.buyer || "",
        buyerStyle: sampleRecord.buyerStyle || "",
        colors: distinctColors.sort() || []
      });
    } catch (error) {
      console.error(
        "[SERVER FUQC] Error fetching FU MO details for registration:",
        error
      );
      res.status(500).json({
        message: "Failed to fetch FU MO details",
        error: error.message
      });
    }
  }
);

// 3. Get Specs (Temp only) for FUQC Registration (from fu_first_outputs)
app.get("/api/scc/fu-first-output/specs-for-registration", async (req, res) => {
  try {
    const { moNo, color } = req.query;
    if (!moNo || !color || moNo.trim() === "" || color.trim() === "") {
      return res.status(400).json({ message: "MO No and Color are required." });
    }
    const record = await FUFirstOutput.findOne({
      moNo: moNo.trim(),
      color: color.trim()
    })
      .sort({ inspectionDate: -1, createdAt: -1 })
      .lean();

    if (
      !record ||
      !record.standardSpecification ||
      record.standardSpecification.length === 0
    ) {
      return res
        .status(200)
        .json({ message: "FU_SPECS_NOT_FOUND", reqTemp: null, reqTime: null });
    }
    // Prioritize 'first' type spec
    let targetSpec = record.standardSpecification.find(
      (s) => s.type === "first"
    );

    if (!targetSpec) {
      // Fallback if no 'first' spec (should ideally not happen)
      targetSpec = record.standardSpecification[0];
    }

    if (!targetSpec) {
      // If still no spec
      return res.status(200).json({
        message: "FU_SPEC_DATA_MISSING",
        reqTemp: null,
        reqTime: null
      });
    }

    res.json({
      reqTemp: targetSpec.tempC !== undefined ? targetSpec.tempC : null,
      reqTime: targetSpec.timeSec !== undefined ? targetSpec.timeSec : null // Added reqTime
    });
  } catch (error) {
    console.error(
      "[SERVER FUQC] Error fetching FU specs for registration:",
      error
    );
    res.status(500).json({
      message: "Failed to fetch FU specifications",
      error: error.message
    });
  }
});

// 4. Register Machine for Daily FUQC
app.post("/api/scc/daily-fuqc/register-machine", async (req, res) => {
  try {
    const {
      inspectionDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      baseReqTemp,
      baseReqTime, // Added baseReqTime
      operatorData, // Expecting { emp_id, emp_eng_name, emp_face_photo, emp_reference_id }
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title
    } = req.body;

    const formattedDate = inspectionDate; // Expecting MM/DD/YYYY from frontend
    if (!formattedDate || !machineNo || !moNo || !color) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for FUQC machine registration."
      });
    }

    const now = new Date();
    const registrationTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    const existingRegistration = await DailyTestingFUQC.findOne({
      inspectionDate: formattedDate,
      machineNo,
      moNo,
      color
    });
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message:
          "This Machine-MO-Color is already registered for FUQC on this date.",
        data: existingRegistration
      });
    }

    const newRegistrationData = {
      inspectionDate: formattedDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      baseReqTemp: baseReqTemp !== undefined ? baseReqTemp : null,
      baseReqTime: baseReqTime !== undefined ? baseReqTime : null, // Save baseReqTime
      temp_offset: 5, // Default, can be from settings if needed
      operatorData:
        operatorData && operatorData.emp_id && operatorData.emp_reference_id
          ? operatorData
          : null,
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title,
      inspectionTime: registrationTime,
      inspections: [],
      remarks: "NA"
    };

    const newRegistration = new DailyTestingFUQC(newRegistrationData);
    await newRegistration.save();

    const populatedRegistration = await DailyTestingFUQC.findById(
      newRegistration._id
    )
      .populate({
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      })
      .lean();

    res.status(201).json({
      success: true,
      message: "Machine registered successfully for Daily FUQC.",
      data: populatedRegistration || newRegistration
    });
  } catch (error) {
    console.error(
      "[SERVER FUQC] Error registering machine for Daily FUQC:",
      error
    );
    if (error.code === 11000)
      return res.status(409).json({
        success: false,
        message: "Duplicate FUQC registration.",
        error: error.message
      });
    res.status(500).json({
      success: false,
      message: "Failed to register machine for FUQC",
      error: error.message
    });
  }
});

// 5. Get Daily FUQC Records by Date
app.get("/api/scc/daily-fuqc/by-date", async (req, res) => {
  try {
    const { inspectionDate, moNo: filterMoNo } = req.query; // Added moNo for filtering
    if (!inspectionDate)
      return res.status(400).json({ message: "Inspection Date is required." });

    const query = { inspectionDate: inspectionDate }; // Ensure consistent date format
    if (filterMoNo && filterMoNo !== "All") {
      query.moNo = filterMoNo;
    }

    const records = await DailyTestingFUQC.find(query)
      .populate({
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      })
      .sort({ machineNo: 1 })
      .lean();
    res.json(records || []);
  } catch (error) {
    console.error(
      "[SERVER FUQC] Error fetching Daily FUQC records by date:",
      error
    );
    res.status(500).json({
      message: "Failed to fetch daily FUQC records",
      error: error.message
    });
  }
});

// NEW Endpoint: Get Distinct MOs for Daily FUQC
app.get("/api/scc/daily-fuqc/distinct-mos", async (req, res) => {
  try {
    const { inspectionDate } = req.query;
    if (!inspectionDate) {
      return res.status(400).json({ message: "Inspection Date is required." });
    }
    const formattedDate = inspectionDate;

    const distinctMoNos = await DailyTestingFUQC.distinct("moNo", {
      inspectionDate: formattedDate
    });
    res.json(distinctMoNos.sort() || []);
  } catch (error) {
    console.error("Error fetching distinct MOs for Daily FUQC:", error);
    res.status(500).json({
      message: "Failed to fetch distinct MOs for FUQC",
      error: error.message
    });
  }
});

// 6. Submit Slot Inspection for Daily FUQC

app.post("/api/scc/daily-fuqc/submit-slot-inspection", async (req, res) => {
  try {
    const {
      inspectionDate,
      timeSlotKey,
      inspectionNo,
      dailyFUQCDocId,
      temp_req,
      temp_actual,
      temp_isNA, // temp_isUserModified removed from FUQC schema
      time_req,
      time_actual,
      time_isNA, // Added time fields
      emp_id
    } = req.body;

    if (
      !inspectionDate ||
      !timeSlotKey ||
      !inspectionNo ||
      !dailyFUQCDocId ||
      (temp_actual === undefined && !temp_isNA) ||
      (time_actual === undefined && !time_isNA) // Validation for time
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for FUQC slot submission."
      });
    }
    const record = await DailyTestingFUQC.findById(dailyFUQCDocId);
    if (!record)
      return res.status(404).json({
        success: false,
        message: `FUQC Record not found: ${dailyFUQCDocId}`
      });
    if (record.inspectionDate !== inspectionDate)
      return res
        .status(400)
        .json({ success: false, message: "Date mismatch for FUQC record." });

    // Calculate results
    let result_temp = "Pending";
    if (temp_isNA) {
      result_temp = "N/A";
    } else if (temp_actual !== null && temp_req !== null) {
      const diff = Math.abs(Number(temp_actual) - Number(temp_req));
      result_temp = diff <= (record.temp_offset || 0) ? "Pass" : "Reject";
    }

    let result_time = "Pending";
    if (time_isNA) {
      result_time = "N/A";
    } else if (time_actual !== null && time_req !== null) {
      // For time, tolerance is 0, so actual must equal req
      result_time =
        Number(time_actual) === Number(time_req) ? "Pass" : "Reject";
    }

    let final_result_slot = "Pending";
    if (result_temp === "N/A" && result_time === "N/A")
      final_result_slot = "N/A";
    else if (result_temp === "Pass" && result_time === "Pass")
      final_result_slot = "Pass";
    else if (result_temp === "Reject" || result_time === "Reject")
      final_result_slot = "Reject";
    // If one is Pass and other is N/A or Pending, it remains Pending unless both are Pass or one is Reject.

    const slotData = {
      inspectionNo: Number(inspectionNo),
      timeSlotKey,
      temp_req: temp_req !== undefined ? temp_req : null,
      temp_actual: temp_isNA
        ? null
        : temp_actual !== undefined
        ? temp_actual
        : null,
      temp_isNA: !!temp_isNA,
      result_temp,
      time_req: time_req !== undefined ? time_req : null,
      time_actual: time_isNA
        ? null
        : time_actual !== undefined
        ? time_actual
        : null,
      time_isNA: !!time_isNA,
      result_time,
      final_result_slot,
      inspectionTimestamp: new Date()
    };

    const existingSlotIndex = record.inspections.findIndex(
      (insp) => insp.timeSlotKey === timeSlotKey
    );
    if (existingSlotIndex > -1) {
      return res.status(409).json({
        success: false,
        message: `Slot ${timeSlotKey} already submitted for this FUQC record.`
      });
    } else {
      record.inspections.push(slotData);
    }
    record.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );
    record.emp_id = emp_id;
    const now = new Date();
    record.inspectionTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;
    await record.save();

    const populatedRecord = await DailyTestingFUQC.findById(record._id)
      .populate({
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      })
      .lean();

    res.status(201).json({
      success: true,
      message: `FUQC Inspection for slot ${timeSlotKey} submitted.`,
      data: populatedRecord || record
    });
  } catch (error) {
    console.error(
      "[SERVER FUQC] Error submitting FUQC slot inspection:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to submit FUQC slot inspection",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - SCC Defects
------------------------------ */

app.get("/api/scc/defects", async (req, res) => {
  try {
    const defects = await SCCDefect.find({}).sort({ no: 1 }).lean(); // Fetch all defects, sorted by 'no'
    res.json(defects);
  } catch (error) {
    console.error("Error fetching SCC defects:", error);
    res.status(500).json({ message: "Server error fetching defects" });
  }
});

// POST - Add a new SCC defect
app.post("/api/scc/defects", async (req, res) => {
  try {
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields (Chinese name is optional)
    if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message: "Defect No, English Name, and Khmer Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    // Check for duplicate 'no'
    const existingDefectByNo = await SCCDefect.findOne({ no: Number(no) });
    if (existingDefectByNo) {
      return res
        .status(409)
        .json({ message: `Defect No '${no}' already exists.` });
    }
    // Check for duplicate English name (optional, but good for data integrity)
    const existingDefectByName = await SCCDefect.findOne({ defectNameEng });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newSccDefect = new SCCDefect({
      no: Number(no),
      defectNameEng,
      defectNameKhmer,
      defectNameChinese: defectNameChinese || "" // Save empty string if not provided
    });
    await newSccDefect.save();
    res
      .status(201)
      .json({ message: "SCC defect added successfully", defect: newSccDefect });
  } catch (error) {
    console.error("Error adding SCC defect:", error);
    if (error.code === 11000) {
      // Mongoose duplicate key error (if unique index is on more than just 'no')
      return res.status(409).json({
        message: "Duplicate entry. Defect No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add SCC defect", error: error.message });
  }
});

// PUT - Update an existing SCC defect by ID
app.put("/api/scc/defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields (Chinese name is optional)
    if (no === undefined || no === null || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message:
          "Defect No, English Name, and Khmer Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Defect No must be a positive number." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    // Check for duplicate 'no' (excluding the current document being updated)
    const existingDefectByNo = await SCCDefect.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingDefectByNo) {
      return res.status(409).json({
        message: `Defect No '${no}' already exists for another defect.`
      });
    }
    // Check for duplicate English name (excluding the current document)
    const existingDefectByName = await SCCDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedSccDefect = await SCCDefect.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        defectNameEng,
        defectNameKhmer,
        defectNameChinese: defectNameChinese || "" // Save empty string if not provided
        // timestamps: true in schema will automatically update updated_at
      },
      { new: true, runValidators: true }
    );

    if (!updatedSccDefect) {
      return res.status(404).json({ message: "SCC Defect not found." });
    }
    res.status(200).json({
      message: "SCC defect updated successfully",
      defect: updatedSccDefect
    });
  } catch (error) {
    console.error("Error updating SCC defect:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate Defect No or Name." });
    }
    res
      .status(500)
      .json({ message: "Failed to update SCC defect", error: error.message });
  }
});

// DELETE - Delete an SCC defect by ID
app.delete("/api/scc/defects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }

    const deletedSccDefect = await SCCDefect.findByIdAndDelete(id);
    if (!deletedSccDefect) {
      return res.status(404).json({ message: "SCC Defect not found." });
    }
    res.status(200).json({ message: "SCC defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting SCC defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete SCC defect", error: error.message });
  }
});

/* ------------------------------
   End Points - SCC HT Inspection
------------------------------ */

// 1. POST /api/scc/ht-inspection-report
app.post("/api/scc/ht-inspection-report", async (req, res) => {
  try {
    const {
      _id,
      inspectionDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      batchNo,
      operatorData, // <-- New: Expect operatorData
      tableNo,
      actualLayers,
      totalBundle,
      totalPcs,
      aqlData,
      // defectsQty, result, defectRate will be calculated by pre-save hook
      defects,
      remarks,
      defectImageUrl,
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title
      // inspectionTime is also generated now
    } = req.body;

    if (
      !inspectionDate ||
      !machineNo ||
      !moNo ||
      !color ||
      !batchNo ||
      !tableNo ||
      actualLayers === undefined ||
      actualLayers === null ||
      !totalPcs ||
      !aqlData
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields for HT Inspection Report." });
    }

    const now = new Date();
    const currentInspectionTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    const reportData = {
      inspectionDate: new Date(inspectionDate), // Store as ISODate
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      batchNo,
      operatorData:
        operatorData && operatorData.emp_id && operatorData.emp_reference_id
          ? operatorData
          : null, // Save valid operatorData
      tableNo,
      actualLayers: Number(actualLayers),
      totalBundle: Number(totalBundle),
      totalPcs: Number(totalPcs),
      aqlData: {
        // Ensure all AQL fields are present or defaulted
        type: aqlData.type || "General",
        level: aqlData.level || "II",
        sampleSizeLetterCode: aqlData.sampleSizeLetterCode || "",
        sampleSize: Number(aqlData.sampleSize) || 0,
        acceptDefect: Number(aqlData.acceptDefect) || 0,
        rejectDefect: Number(aqlData.rejectDefect) || 0
      },
      defects: defects || [], // Ensure defects is an array
      remarks: remarks?.trim() || "NA",
      defectImageUrl: defectImageUrl || null,
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title,
      inspectionTime: currentInspectionTime
      // defectsQty, result, defectRate will be set by pre-save hook
    };

    let savedReport;
    if (_id) {
      // For updates, the pre('findOneAndUpdate') hook will handle calculations
      savedReport = await HTInspectionReport.findByIdAndUpdate(
        _id,
        reportData,
        { new: true, runValidators: true }
      );
      if (!savedReport)
        return res
          .status(404)
          .json({ message: "Report not found for update." });
    } else {
      // For new documents, pre('save') hook handles calculations
      const reportToSave = new HTInspectionReport(reportData);
      savedReport = await reportToSave.save();
    }

    // Populate operatorData for the response
    if (savedReport.operatorData && savedReport.operatorData.emp_reference_id) {
      await savedReport.populate({
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      });
    }

    res.status(201).json({
      message: "HT Inspection Report saved successfully.",
      data: savedReport
    });
  } catch (error) {
    console.error("Error saving HT Inspection Report:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. This report might already exist.",
        error: error.message,
        errorCode: "DUPLICATE_KEY"
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error: " + error.message,
        errors: error.errors
      });
    }
    res.status(500).json({
      message: "Failed to save HT Inspection Report.",
      error: error.message,
      details: error
    });
  }
});

// GET endpoint to load an existing HT Inspection Report (Optional - for editing/viewing later)
app.get("/api/scc/ht-inspection-report", async (req, res) => {
  try {
    const { inspectionDate, machineNo, moNo, color, batchNo, tableNo } =
      req.query; // Added tableNo
    if (
      !inspectionDate ||
      !machineNo ||
      !moNo ||
      !color ||
      !batchNo ||
      !tableNo
    ) {
      return res.status(400).json({
        message:
          "Date, Machine, MO, Color, Batch No, and Table No are required to fetch report."
      });
    }

    // Convert string date from query to Date object for matching if dates are stored as ISODate
    // If dates are stored as "MM/DD/YYYY" strings, this query needs adjustment.
    // Assuming inspectionDate in schema is ISODate
    const searchDateStart = new Date(inspectionDate);
    searchDateStart.setHours(0, 0, 0, 0);
    const searchDateEnd = new Date(inspectionDate);
    searchDateEnd.setHours(23, 59, 59, 999);

    const report = await HTInspectionReport.findOne({
      inspectionDate: { $gte: searchDateStart, $lte: searchDateEnd },
      machineNo,
      moNo,
      color,
      batchNo,
      tableNo
    })
      .populate({
        // Populate operatorData's emp_reference_id
        path: "operatorData.emp_reference_id",
        model: UserMain,
        select: "emp_id eng_name face_photo"
      })
      .lean();

    if (!report) {
      return res
        .status(200)
        .json({ message: "HT_INSPECTION_REPORT_NOT_FOUND", data: null });
    }
    res.json({ message: "REPORT_FOUND", data: report });
  } catch (error) {
    console.error("Error fetching HT Inspection Report:", error);
    res.status(500).json({
      message: "Failed to fetch HT Inspection Report",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - EMB Report
------------------------------ */
app.post("/api/scc/emb-report", async (req, res) => {
  try {
    const {
      _id,
      reportType,
      inspectionDate,
      factoryName,
      moNo,
      buyer,
      buyerStyle,
      color,
      batchNo,
      tableNo,
      actualLayers,
      totalBundle,
      totalPcs,
      aqlData,
      defects,
      remarks,
      defectImageUrl,
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title
    } = req.body;

    if (
      !reportType ||
      !inspectionDate ||
      !factoryName ||
      !moNo ||
      !color ||
      !batchNo ||
      !tableNo ||
      !actualLayers ||
      !totalBundle ||
      !totalPcs ||
      !aqlData
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields for EMB Report." });
    }

    const now = new Date();
    const currentInspectionTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    const reportData = {
      reportType,
      inspectionDate: new Date(inspectionDate),
      factoryName,
      moNo,
      buyer,
      buyerStyle,
      color,
      batchNo,
      tableNo,
      actualLayers: Number(actualLayers),
      totalBundle: Number(totalBundle),
      totalPcs: Number(totalPcs),
      aqlData: {
        type: aqlData.type || "General",
        level: aqlData.level || "II",
        sampleSizeLetterCode: aqlData.sampleSizeLetterCode || "",
        sampleSize: Number(aqlData.sampleSize) || 0,
        acceptDefect: Number(aqlData.acceptDefect) || 0,
        rejectDefect: Number(aqlData.rejectDefect) || 0
      },
      defects: defects || [],
      remarks: remarks?.trim() || "NA",
      defectImageUrl: defectImageUrl || null,
      emp_id,
      emp_kh_name,
      emp_eng_name,
      emp_dept_name,
      emp_sect_name,
      emp_job_title,
      inspectionTime: currentInspectionTime
    };

    let savedReport;
    if (_id) {
      savedReport = await EMBReport.findByIdAndUpdate(_id, reportData, {
        new: true,
        runValidators: true
      });
      if (!savedReport)
        return res
          .status(404)
          .json({ message: "Report not found for update." });
    } else {
      const reportToSave = new EMBReport(reportData);
      savedReport = await reportToSave.save();
    }

    res
      .status(201)
      .json({ message: "EMB Report saved successfully.", data: savedReport });
  } catch (error) {
    console.error("Error saving EMB Report:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. This EMB report might already exist."
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error: " + error.message,
        errors: error.errors
      });
    }
    res
      .status(500)
      .json({ message: "Failed to save EMB Report.", error: error.message });
  }
});

/* ------------------------------
   End Points - SCC Elastic Report
------------------------------ */

// 1. POST /api/scc/elastic-report/register-machine
app.post("/api/scc/elastic-report/register-machine", async (req, res) => {
  try {
    const {
      inspectionDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      operatorData, // <-- MODIFIED: Expect operatorData
      emp_id,
      emp_kh_name,
      emp_eng_name
    } = req.body;

    if (!inspectionDate || !machineNo || !moNo || !color) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: Inspection Date, Machine No, MO No, and Color."
      });
    }

    const now = new Date();
    const registrationTime = `${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    const newRegistrationData = {
      inspectionDate,
      machineNo,
      moNo,
      buyer,
      buyerStyle,
      color,
      operatorData:
        operatorData && operatorData.emp_id && operatorData.emp_reference_id
          ? operatorData
          : null, // <-- MODIFIED: Save valid operatorData
      registeredBy_emp_id: emp_id,
      registeredBy_emp_kh_name: emp_kh_name,
      registeredBy_emp_eng_name: emp_eng_name,
      registrationTime,
      inspections: []
    };

    // Use findOneAndUpdate with upsert to handle both creation and potential updates if logic changes
    const newRegistration = await ElasticReport.findOneAndUpdate(
      { inspectionDate, machineNo, moNo, color },
      { $setOnInsert: newRegistrationData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: "Machine registered successfully for Elastic Report.",
      data: newRegistration
    });
  } catch (error) {
    console.error("Error registering machine for Elastic Report:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "This registration already exists." });
    }
    res.status(500).json({
      success: false,
      message: "Failed to register machine.",
      error: error.message
    });
  }
});

// 2. GET /api/scc/elastic-report/by-date?inspectionDate=<date>
app.get("/api/scc/elastic-report/by-date", async (req, res) => {
  try {
    const { inspectionDate } = req.query;
    if (!inspectionDate) {
      return res.status(400).json({ message: "Inspection Date is required." });
    }

    const records = await ElasticReport.find({ inspectionDate })
      .sort({ machineNo: 1 })
      .populate({
        // <-- MODIFIED: Populate operator data
        path: "operatorData.emp_reference_id",
        model: UserMain, // Assuming UserMain is your user model
        select: "emp_id eng_name face_photo"
      })
      .lean();

    res.json(records || []);
  } catch (error) {
    console.error("Error fetching Elastic Report records by date:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch records", error: error.message });
  }
});

// 3. GET /api/scc/elastic-report/distinct-mos?inspectionDate=<date>
//    NEW endpoint to get distinct MOs for the filter dropdown
app.get("/api/scc/elastic-report/distinct-mos", async (req, res) => {
  try {
    const { inspectionDate } = req.query;
    if (!inspectionDate) {
      return res.status(400).json({ message: "Inspection Date is required." });
    }
    const mos = await ElasticReport.distinct("moNo", { inspectionDate });
    res.json(mos || []);
  } catch (error) {
    console.error("Error fetching distinct MOs for Elastic Report:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct MOs", error: error.message });
  }
});

// 4. POST /api/scc/elastic-report/submit-slot-inspection
app.post("/api/scc/elastic-report/submit-slot-inspection", async (req, res) => {
  try {
    const {
      elasticReportDocId,
      timeSlotKey,
      inspectionNo,
      checkedQty,
      measurement,
      defectDetails, // Expecting an array like [{ name: 'Broken Stich', qty: 1 }]
      emp_id,
      remarks
    } = req.body;

    if (!elasticReportDocId || !timeSlotKey || !checkedQty) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const reportDoc = await ElasticReport.findById(elasticReportDocId);
    if (!reportDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Report document not found." });
    }

    // --- Calculations ---
    const totalDefectQty = (defectDetails || []).reduce(
      (sum, defect) => sum + (defect.qty || 0),
      0
    );
    const defectRate =
      checkedQty > 0 ? parseFloat((totalDefectQty / checkedQty).toFixed(4)) : 0;
    const qualityIssue = totalDefectQty > 0 ? "Reject" : "Pass";
    const result =
      qualityIssue === "Pass" && measurement === "Pass" ? "Pass" : "Reject";

    const slotData = {
      inspectionNo: Number(inspectionNo),
      timeSlotKey,
      checkedQty: Number(checkedQty),
      measurement,
      qualityIssue,
      defectDetails: defectDetails || [],
      totalDefectQty,
      defectRate,
      result,
      remarks: remarks || "",
      emp_id,
      isUserModified: true,
      inspectionTimestamp: new Date()
    };

    const existingSlotIndex = reportDoc.inspections.findIndex(
      (insp) => insp.timeSlotKey === timeSlotKey
    );

    if (existingSlotIndex > -1) {
      reportDoc.inspections[existingSlotIndex] = slotData;
    } else {
      reportDoc.inspections.push(slotData);
    }

    reportDoc.inspections.sort(
      (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
    );
    await reportDoc.save();

    res.status(200).json({
      success: true,
      message: "Inspection slot submitted successfully.",
      data: reportDoc
    });
  } catch (error) {
    console.error("Error submitting Elastic slot inspection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit slot inspection.",
      error: error.message
    });
  }
});

/* -------------------------------------
   End Point - Final Consolidated HT Report
------------------------------------- */

// Helper function to generate all necessary date formats from a single input
const getConsolidatedDateFormats = (dateInput) => {
  const date = new Date(dateInput);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Format for schemas without leading zeros: 'M/D/YYYY'
  const stringDate = `${month}/${day}/${year}`;

  // Format for schemas WITH leading zeros: 'MM/DD/YYYY'
  const paddedStringDate = `${String(month).padStart(2, "0")}/${String(
    day
  ).padStart(2, "0")}/${year}`;

  // Format for ISODate-based schemas (timestamp)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    stringDate,
    paddedStringDate,
    isoStartDate: startOfDay,
    isoEndDate: endOfDay
  };
};

app.get("/api/scc/final-report/ht", async (req, res) => {
  try {
    const { date, empId, moNo, machineNo } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const { stringDate, paddedStringDate, isoStartDate, isoEndDate } =
      getConsolidatedDateFormats(date);

    // --- Build Filter Queries ---
    // These objects will be passed to the find() method for each model
    const stringDateFilter = { inspectionDate: stringDate };
    if (empId && empId !== "All") stringDateFilter.emp_id = empId;
    if (moNo && moNo !== "All") stringDateFilter.moNo = moNo;
    if (machineNo && machineNo !== "All")
      stringDateFilter.machineNo = machineNo;

    const paddedDateFilter = { inspectionDate: paddedStringDate };
    if (empId && empId !== "All") paddedDateFilter.emp_id = empId;
    if (moNo && moNo !== "All") paddedDateFilter.moNo = moNo;
    if (machineNo && machineNo !== "All")
      paddedDateFilter.machineNo = machineNo;

    const isoDateFilter = {
      inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
    };
    if (empId && empId !== "All") isoDateFilter.emp_id = empId;
    if (moNo && moNo !== "All") isoDateFilter.moNo = moNo;
    if (machineNo && machineNo !== "All") isoDateFilter.machineNo = machineNo;

    // --- Execute All Queries Concurrently using Promise.all ---
    const [
      firstOutputData,
      dailyWashingData,
      machineCalibrationData,
      htInspectionData,
      // Queries to get unique filter options for the selected DATE only
      uniqueEmpIds_1,
      uniqueEmpIds_2,
      uniqueEmpIds_3,
      uniqueMoNos_1,
      uniqueMoNos_2,
      uniqueMoNos_3
    ] = await Promise.all([
      // Data queries with filters applied
      HTFirstOutput.find(stringDateFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserProd
        })
        .lean(),
      SCCDailyTesting.find(stringDateFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserProd
        })
        .lean(),
      DailyTestingHTFU.find(paddedDateFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserProd
        })
        .lean(),
      HTInspectionReport.find(isoDateFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserProd
        })
        .lean(),

      // Filter option queries (only filter by date to get all options for that day)
      HTFirstOutput.distinct("emp_id", { inspectionDate: stringDate }),
      SCCDailyTesting.distinct("emp_id", { inspectionDate: stringDate }),
      DailyTestingHTFU.distinct("emp_id", { inspectionDate: paddedStringDate }),
      HTFirstOutput.distinct("moNo", { inspectionDate: stringDate }),
      SCCDailyTesting.distinct("moNo", { inspectionDate: stringDate }),
      DailyTestingHTFU.distinct("moNo", { inspectionDate: paddedStringDate })
    ]);

    // Combine and get unique filter options
    const allEmpIds = [
      ...uniqueEmpIds_1,
      ...uniqueEmpIds_2,
      ...uniqueEmpIds_3,
      ...htInspectionData.map((d) => d.emp_id)
    ];
    const uniqueEmpIds = [...new Set(allEmpIds)].filter(Boolean).sort();

    const allMoNos = [
      ...uniqueMoNos_1,
      ...uniqueMoNos_2,
      ...uniqueMoNos_3,
      ...htInspectionData.map((d) => d.moNo)
    ];
    const uniqueMoNos = [...new Set(allMoNos)].filter(Boolean).sort();

    // Process First Output Data
    const processedFirstOutput = firstOutputData.map((doc) => {
      const firstSpec = doc.standardSpecification.find(
        (s) => s.type === "first"
      );
      const secondSpec = doc.standardSpecification.find(
        (s) => s.type === "2nd heat"
      );
      return {
        ...doc,
        specs: firstSpec
          ? {
              tempC: firstSpec.tempC,
              timeSec: firstSpec.timeSec,
              pressure: firstSpec.pressure
            }
          : {},
        secondHeatSpecs: secondSpec
          ? {
              tempC: secondSpec.tempC,
              timeSec: secondSpec.timeSec,
              pressure: secondSpec.pressure
            }
          : null
      };
    });

    // Process and Consolidate HT Inspection Data
    const consolidatedInspections = {};
    htInspectionData.forEach((doc) => {
      const key = `${doc.machineNo}-${doc.moNo}-${doc.color}-${doc.tableNo}`;
      if (!consolidatedInspections[key]) {
        consolidatedInspections[key] = {
          machineNo: doc.machineNo,
          moNo: doc.moNo,
          buyer: doc.buyer,
          buyerStyle: doc.buyerStyle,
          color: doc.color,
          operatorData: doc.operatorData,
          batchNo: doc.batchNo,
          tableNo: doc.tableNo,
          totalPcs: 0,
          totalInspectedQty: 0,
          totalDefectsQty: 0,
          defectSummary: {},
          defectImageUrls: []
        };
      }
      const group = consolidatedInspections[key];
      group.totalPcs += doc.totalPcs || 0;
      group.totalInspectedQty += doc.aqlData?.sampleSize || 0;
      group.totalDefectsQty += doc.defectsQty || 0;

      if (
        doc.defectImageUrl &&
        !group.defectImageUrls.includes(doc.defectImageUrl)
      ) {
        group.defectImageUrls.push(doc.defectImageUrl);
      }

      doc.defects.forEach((defect) => {
        const name = defect.defectNameEng;
        group.defectSummary[name] =
          (group.defectSummary[name] || 0) + defect.count;
      });
    });

    const finalInspectionArray = Object.values(consolidatedInspections).map(
      (group) => {
        const finalDefectRate =
          group.totalInspectedQty > 0
            ? group.totalDefectsQty / group.totalInspectedQty
            : 0;
        return {
          ...group,
          finalDefectRate,
          defectImageUrl: group.defectImageUrls[0] || null
        };
      }
    );

    res.json({
      firstOutput: processedFirstOutput,
      dailyWashing: dailyWashingData,
      machineCalibration: machineCalibrationData,
      htInspection: finalInspectionArray,
      filterOptions: {
        empIds: uniqueEmpIds,
        moNos: uniqueMoNos
      }
    });
  } catch (error) {
    console.error("Error creating consolidated HT report:", error);
    res.status(500).json({
      message: "Failed to generate consolidated report",
      error: error.message
    });
  }
});

/* -------------------------------------
   End Point - Final Consolidated FU Report
------------------------------------- */
app.get("/api/scc/final-report/fu", async (req, res) => {
  try {
    const { date, empId, moNo, machineNo } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const { stringDate, paddedStringDate } = getConsolidatedDateFormats(date);

    // --- Build Filter Queries ---
    const stringDateFilter = { inspectionDate: stringDate };
    if (empId && empId !== "All") stringDateFilter.emp_id = empId;
    if (moNo && moNo !== "All") stringDateFilter.moNo = moNo;
    if (machineNo && machineNo !== "All")
      stringDateFilter.machineNo = machineNo;

    const paddedDateFilter = { inspectionDate: paddedStringDate };
    if (empId && empId !== "All") paddedDateFilter.emp_id = empId;
    if (moNo && moNo !== "All") paddedDateFilter.moNo = moNo;
    if (machineNo && machineNo !== "All")
      paddedDateFilter.machineNo = machineNo;

    // --- Execute All FU Queries Concurrently ---
    const [
      firstOutputData,
      machineCalibrationData,
      // Queries for filter dropdowns
      uniqueEmpIds_1,
      uniqueEmpIds_2,
      uniqueMoNos_1,
      uniqueMoNos_2
    ] = await Promise.all([
      // Data queries with filters
      FUFirstOutput.find(stringDateFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserProd
        })
        .lean(),
      DailyTestingFUQC.find(paddedDateFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserProd
        })
        .lean(),

      // Filter option queries (only by date)
      FUFirstOutput.distinct("emp_id", { inspectionDate: stringDate }),
      DailyTestingFUQC.distinct("emp_id", { inspectionDate: paddedStringDate }),
      FUFirstOutput.distinct("moNo", { inspectionDate: stringDate }),
      DailyTestingFUQC.distinct("moNo", { inspectionDate: paddedStringDate })
    ]);

    // Combine and get unique filter options
    const allEmpIds = [...uniqueEmpIds_1, ...uniqueEmpIds_2];
    const uniqueEmpIds = [...new Set(allEmpIds)].filter(Boolean).sort();

    const allMoNos = [...uniqueMoNos_1, ...uniqueMoNos_2];
    const uniqueMoNos = [...new Set(allMoNos)].filter(Boolean).sort();

    // Process First Output Data
    const processedFirstOutput = firstOutputData.map((doc) => {
      const firstSpec = doc.standardSpecification.find(
        (s) => s.type === "first"
      );
      return {
        ...doc,
        specs: firstSpec
          ? { tempC: firstSpec.tempC, timeSec: firstSpec.timeSec }
          : {}
      };
    });

    res.json({
      firstOutput: processedFirstOutput,
      machineCalibration: machineCalibrationData,
      filterOptions: {
        empIds: uniqueEmpIds,
        moNos: uniqueMoNos
      }
    });
  } catch (error) {
    console.error("Error creating consolidated FU report:", error);
    res.status(500).json({
      message: "Failed to generate consolidated FU report",
      error: error.message
    });
  }
});

/* -------------------------------------
   End Point - Final Consolidated EMB Report
------------------------------------- */
app.get("/api/scc/final-report/emb", async (req, res) => {
  try {
    const { date, empId, moNo, factoryName } = req.query; // New 'factoryName' filter
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    // The EMBReport schema uses ISODate, so we only need the date range
    const { isoStartDate, isoEndDate } = getConsolidatedDateFormats(date);

    // --- Build Filter Query ---
    const filter = { inspectionDate: { $gte: isoStartDate, $lte: isoEndDate } };
    if (empId && empId !== "All") filter.emp_id = empId;
    if (moNo && moNo !== "All") filter.moNo = moNo;
    if (factoryName && factoryName !== "All") filter.factoryName = factoryName;

    // --- Execute Queries Concurrently ---
    const [
      reportData,
      // Queries to get unique filter options for the selected DATE only
      uniqueEmpIds,
      uniqueMoNos,
      uniqueFactories
    ] = await Promise.all([
      // Data query with all filters applied
      EMBReport.find(filter).lean(),
      // Filter option queries (only filter by date)
      EMBReport.distinct("emp_id", {
        inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
      }),
      EMBReport.distinct("moNo", {
        inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
      }),
      EMBReport.distinct("factoryName", {
        inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
      })
    ]);

    // --- Process and Consolidate Data ---
    // This is similar to the HT Inspection consolidation logic
    const consolidatedReports = {};
    reportData.forEach((doc) => {
      const key = `${doc.factoryName}-${doc.moNo}-${doc.color}-${doc.tableNo}-${doc.batchNo}`;
      if (!consolidatedReports[key]) {
        consolidatedReports[key] = {
          factoryName: doc.factoryName,
          moNo: doc.moNo,
          buyer: doc.buyer,
          buyerStyle: doc.buyerStyle,
          color: doc.color,
          batchNo: doc.batchNo,
          tableNo: doc.tableNo,
          totalPcs: 0,
          totalInspectedQty: 0,
          totalDefectsQty: 0,
          defectSummary: {}
        };
      }
      const group = consolidatedReports[key];
      group.totalPcs += doc.totalPcs || 0;
      group.totalInspectedQty += doc.aqlData?.sampleSize || 0;
      group.totalDefectsQty += doc.defectsQty || 0;

      (doc.defects || []).forEach((defect) => {
        const name = defect.defectNameEng;
        group.defectSummary[name] =
          (group.defectSummary[name] || 0) + defect.count;
      });
    });

    const finalReportArray = Object.values(consolidatedReports).map((group) => {
      const finalDefectRate =
        group.totalInspectedQty > 0
          ? group.totalDefectsQty / group.totalInspectedQty
          : 0;
      return { ...group, finalDefectRate };
    });

    res.json({
      embReport: finalReportArray,
      filterOptions: {
        empIds: uniqueEmpIds.filter(Boolean).sort(),
        moNos: uniqueMoNos.filter(Boolean).sort(),
        factories: uniqueFactories.filter(Boolean).sort()
      }
    });
  } catch (error) {
    console.error("Error creating consolidated EMB report:", error);
    res.status(500).json({
      message: "Failed to generate consolidated EMB report",
      error: error.message
    });
  }
});

/* -------------------------------------
   End Point - Final Consolidated Elastic Report
------------------------------------- */
app.get("/api/scc/final-report/elastic", async (req, res) => {
  try {
    const { date, empId, operatorId, moNo, machineNo } = req.query; // Added operatorId
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const d = new Date(date);
    const formattedDate = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // --- Build Filter Query ---
    const filter = { inspectionDate: formattedDate };
    if (empId && empId !== "All") filter.registeredBy_emp_id = empId; // Filter by Inspector
    if (operatorId && operatorId !== "All")
      filter["operatorData.emp_id"] = operatorId; // Filter by Operator
    if (moNo && moNo !== "All") filter.moNo = moNo;
    if (machineNo && machineNo !== "All") filter.machineNo = machineNo;

    // --- Execute All Elastic Queries Concurrently ---
    const [reportData, uniqueInspectorIds, uniqueOperatorObjects, uniqueMoNos] =
      await Promise.all([
        // Data query with all filters
        ElasticReport.find(filter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserProd
          })
          .lean(),

        // Filter option queries (based on date only)
        ElasticReport.distinct("registeredBy_emp_id", {
          inspectionDate: formattedDate
        }),
        ElasticReport.find({ inspectionDate: formattedDate })
          .select("operatorData.emp_id")
          .lean(),
        ElasticReport.distinct("moNo", { inspectionDate: formattedDate })
      ]);

    // Combine and get unique filter options
    const uniqueOperatorIds = [
      ...new Set(uniqueOperatorObjects.map((item) => item.operatorData?.emp_id))
    ]
      .filter(Boolean)
      .sort();

    // --- Process Data for Aggregation ---
    const processedData = reportData.map((doc) => {
      let totalCheckedQty = 0;
      let totalDefectsQty = 0;
      const defectSummary = {};
      let measurementPassCount = 0;
      let measurementTotalCount = 0;

      doc.inspections.forEach((insp) => {
        totalCheckedQty += insp.checkedQty || 0;
        totalDefectsQty += insp.totalDefectQty || 0;

        if (insp.measurement) {
          measurementTotalCount++;
          if (insp.measurement === "Pass") {
            measurementPassCount++;
          }
        }

        (insp.defectDetails || []).forEach((defect) => {
          defectSummary[defect.name] =
            (defectSummary[defect.name] || 0) + defect.qty;
        });
      });

      const totalDefectRate =
        totalCheckedQty > 0 ? totalDefectsQty / totalCheckedQty : 0;

      return {
        ...doc,
        totalCheckedQty,
        totalDefectsQty,
        defectSummary,
        totalDefectRate,
        measurementSummary: `${measurementPassCount}/${measurementTotalCount} Pass`
      };
    });

    res.json({
      elasticReport: processedData,
      filterOptions: {
        empIds: uniqueInspectorIds.filter(Boolean).sort(),
        operatorIds: uniqueOperatorIds,
        moNos: uniqueMoNos.sort()
      }
    });
  } catch (error) {
    console.error("Error creating consolidated Elastic report:", error);
    res.status(500).json({
      message: "Failed to generate consolidated Elastic report",
      error: error.message
    });
  }
});

/* ------------------------------
Washing Live Dashboard Endpoints
------------------------------ */

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Endpoint to fetch filter options for Washing Dashboard
app.get("/api/washing/filters", async (req, res) => {
  try {
    // Destructure query params, ensuring they are used correctly
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo, // This will be the selectedMono value from the client
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId,
      packageNo: queryPackageNo // This will be the package_no value
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(queryStartDate)
        ]
      });
    }
    if (queryEndDate) {
      const endOfDay = new Date(queryEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }

    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    }

    // Build matchQuery for filtering options based on *other* active filters
    // MO No Filter (selectedMono)
    if (queryMoNo) matchQuery.selectedMono = queryMoNo;
    // Package No Filter
    if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
    // Other text/select filters
    if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
    if (queryBuyer) matchQuery.buyer = queryBuyer;
    if (queryColor) matchQuery.color = queryColor;
    if (querySize) matchQuery.size = querySize;
    if (queryQcId) matchQuery.emp_id_washing = queryQcId;

    // --- Pipelines for distinct values ---
    // MO Nos (from selectedMono)
    const moNosPipeline = [
      { $match: { ...matchQuery, selectedMono: { $ne: null, $ne: "" } } }, // Apply general filters
      { $group: { _id: "$selectedMono" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, value: "$_id", label: "$_id" } }
    ];
    // If a moNo is already selected, we don't need to filter the moNo list by itself.
    // So, if queryMoNo is active, for *this specific pipeline*, remove it from matchQuery
    const moNosMatch = { ...matchQuery };
    if (queryMoNo) delete moNosMatch.selectedMono;
    moNosPipeline[0].$match = {
      ...moNosMatch,
      selectedMono: { $ne: null, $ne: "" }
    };

    // Package Nos
    const packageNosPipeline = [
      { $match: { ...matchQuery, package_no: { $ne: null } } },
      { $group: { _id: "$package_no" } },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: { $toString: "$_id" },
          label: { $toString: "$_id" }
        }
      }
    ];
    const packageNosMatch = { ...matchQuery };
    if (queryPackageNo) delete packageNosMatch.package_no;
    packageNosPipeline[0].$match = {
      ...packageNosMatch,
      package_no: { $ne: null }
    };

    // Similar logic for other filters to ensure cross-filtering
    const createDynamicPipeline = (field, isNumeric = false) => {
      const pipeline = [
        {
          $match: {
            ...matchQuery,
            [field]: isNumeric ? { $ne: null } : { $ne: null, $ne: "" }
          }
        },
        { $group: { _id: `$${field}` } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            value: isNumeric ? { $toString: `$_id` } : `$_id`,
            label: isNumeric ? { $toString: `$_id` } : `$_id`
          }
        }
      ];
      const tempMatch = { ...matchQuery };
      // if the current field is being filtered by (e.g. queryCustStyle for custStyle pipeline), remove it from this pipeline's match
      if (req.query[field === "emp_id_washing" ? "qcId" : field])
        delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        [field]: isNumeric ? { $ne: null } : { $ne: null, $ne: "" }
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_washing: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$emp_id_washing",
          eng_name: { $first: "$eng_name_washing" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: "$_id",
          label: {
            $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
          }
        }
      }
    ];
    const qcIdsMatch = { ...matchQuery };
    if (queryQcId) delete qcIdsMatch.emp_id_washing;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_washing: { $ne: null, $ne: "" }
    };

    const [
      moNosData,
      packageNosData,
      custStylesData,
      buyersData,
      colorsData,
      sizesData,
      qcIdsDataResult
    ] = await Promise.all([
      Washing.aggregate(moNosPipeline).exec(),
      Washing.aggregate(packageNosPipeline).exec(),
      Washing.aggregate(createDynamicPipeline("custStyle")).exec(),
      Washing.aggregate(createDynamicPipeline("buyer")).exec(),
      Washing.aggregate(createDynamicPipeline("color")).exec(),
      Washing.aggregate(createDynamicPipeline("size")).exec(),
      Washing.aggregate(qcIdsPipeline).exec()
    ]);

    res.json({
      moNos: moNosData.filter((item) => item.value),
      packageNos: packageNosData.filter((item) => item.value),
      custStyles: custStylesData.filter((item) => item.value),
      buyers: buyersData.filter((item) => item.value),
      colors: colorsData.filter((item) => item.value),
      sizes: sizesData.filter((item) => item.value),
      qcIds: qcIdsDataResult.filter((item) => item.value)
    });
  } catch (error) {
    console.error("Error fetching washing filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// Endpoint to fetch Washing Dashboard data
app.get("/api/washing/dashboard-data", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo, // This is selectedMono
      packageNo, // This is package_no
      custStyle,
      buyer,
      color,
      size,
      qcId,
      page = 1,
      limit = 20
    } = req.query;

    let baseMatchQuery = {};
    if (moNo) baseMatchQuery.selectedMono = moNo; // Correctly filter by selectedMono
    if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
    if (custStyle) baseMatchQuery.custStyle = custStyle;
    if (buyer) baseMatchQuery.buyer = buyer;
    if (color) baseMatchQuery.color = color;
    if (size) baseMatchQuery.size = size;
    if (qcId) baseMatchQuery.emp_id_washing = qcId;

    // Current period match query
    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      currentDateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (currentDateMatchAnd.length > 0) {
      currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
    } else if (
      Object.keys(currentPeriodMatchQuery).length === 0 &&
      !startDate &&
      !endDate
    ) {
      const todayRange = getDayRange(new Date());
      currentPeriodMatchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
    const prevDate = new Date(referenceDateForPrev);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDayDateRange = getDayRange(prevDate);

    let previousDayMatchQuery = { ...baseMatchQuery };
    previousDayMatchQuery.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$washing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(0),
                onNull: new Date(0)
              }
            },
            prevDayDateRange.start
          ]
        },
        {
          $lte: [
            {
              $dateFromString: {
                dateString: "$washing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(Date.now() + 86400000 * 365 * 10),
                onNull: new Date(Date.now() + 86400000 * 365 * 10)
              }
            },
            prevDayDateRange.end
          ]
        }
      ]
    };

    const summaryAggregation = [
      {
        $group: {
          _id: null,
          totalWashingQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 55] },
                { $ifNull: ["$passQtyWash", 0] },
                0
              ]
            }
          },
          totalRewashQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 86] },
                { $ifNull: ["$passQtyWash", 0] },
                0
              ]
            }
          },
          totalBundles: { $sum: 1 }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      Washing.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      Washing.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalWashingQty: 0,
      totalRewashQty: 0,
      totalBundles: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalWashingQty: 0,
      totalRewashQty: 0,
      totalBundles: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $project: {
          emp_id_washing: 1,
          eng_name_washing: 1,
          washing_updated_date: 1,
          passQtyWash: { $ifNull: ["$passQtyWash", 0] },
          task_no_washing: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            emp_id: "$emp_id_washing",
            date: "$washing_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_washing" },
          dailyWashingQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 55] }, "$passQtyWash", 0]
            }
          },
          dailyRewashQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 86] }, "$passQtyWash", 0]
            }
          },
          dailyBundles: { $sum: 1 }
        }
      },
      { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
      {
        $project: {
          _id: 0,
          emp_id: "$_id.emp_id",
          eng_name: "$eng_name",
          date: "$_id.date",
          dailyWashingQty: 1,
          dailyRewashQty: 1,
          dailyBundles: 1
        }
      }
    ];
    const inspectorSummaryData = await Washing.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          }
        }
      },
      { $sort: { parsedDate: -1, washing_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          washing_updated_date: 1,
          emp_id_washing: 1,
          eng_name_washing: 1,
          dept_name_washing: 1,
          selectedMono: 1, // This is MO No for display
          package_no: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          washing_update_time: 1,
          washingQty: {
            $cond: [
              { $eq: ["$task_no_washing", 55] },
              { $ifNull: ["$passQtyWash", 0] },
              0
            ]
          },
          rewashQty: {
            $cond: [
              { $eq: ["$task_no_washing", 86] },
              { $ifNull: ["$passQtyWash", 0] },
              0
            ]
          },
          bundleCount: 1
        }
      }
    ];
    const detailedRecords = await Washing.aggregate(
      detailedRecordsPipeline
    ).exec();
    const totalRecords = await Washing.countDocuments(
      currentPeriodMatchQuery
    ).exec();

    res.json({
      overallSummary,
      previousDaySummary,
      inspectorSummaryData,
      detailedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching washing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/* ------------------------------------
Endpoint for Hourly Washing Data Chart
------------------------------------ */
app.get("/api/washing/hourly-summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId
    } = req.query;

    let matchQuery = {};
    // Date filtering
    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    } else {
      // Default to today if no date range
      const todayRange = getDayRange(new Date()); // Ensure getDayRange is defined
      matchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    // Other filters
    if (moNo) matchQuery.selectedMono = moNo;
    if (packageNo) matchQuery.package_no = parseInt(packageNo);
    if (custStyle) matchQuery.custStyle = custStyle;
    if (buyer) matchQuery.buyer = buyer;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (qcId) matchQuery.emp_id_washing = qcId;

    const hourlyData = await Washing.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$washing_update_time", 0, 2] }, // Extract HH from HH:MM:SS
          passQtyWash: { $ifNull: ["$passQtyWash", 0] },
          task_no_washing: 1
          // bundle_id: 1 // Assuming each record is one bundle for bundle count
        }
      },
      {
        $group: {
          _id: "$hour",
          totalWashingQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 55] }, "$passQtyWash", 0]
            }
          },
          totalBundles: { $sum: 1 } // Count each document as a bundle
        }
      },
      { $sort: { _id: 1 } } // Sort by hour
    ]).exec();

    // Prepare data for chart (calculate previous hour % change)
    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;

      let washingQtyChange = 0;
      if (prevItem && prevItem.totalWashingQty > 0) {
        washingQtyChange =
          ((item.totalWashingQty - prevItem.totalWashingQty) /
            prevItem.totalWashingQty) *
          100;
      } else if (
        prevItem &&
        prevItem.totalWashingQty === 0 &&
        item.totalWashingQty > 0
      ) {
        washingQtyChange = 100;
      }

      let bundleQtyChange = 0;
      if (prevItem && prevItem.totalBundles > 0) {
        bundleQtyChange =
          ((item.totalBundles - prevItem.totalBundles) /
            prevItem.totalBundles) *
          100;
      } else if (
        prevItem &&
        prevItem.totalBundles === 0 &&
        item.totalBundles > 0
      ) {
        bundleQtyChange = 100;
      }

      return {
        hour: item._id, // HH string
        totalWashingQty: item.totalWashingQty,
        totalBundles: item.totalBundles,
        washingQtyChange: washingQtyChange.toFixed(1),
        bundleQtyChange: bundleQtyChange.toFixed(1)
      };
    });

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly washing summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly summary" });
  }
});

/* ------------------------------
OPA Live Dashboard Endpoints
------------------------------ */

// Endpoint to fetch filter options for OPA Dashboard
app.get("/api/opa/filters", async (req, res) => {
  try {
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo,
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId, // qcId here is emp_id_opa
      packageNo: queryPackageNo
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(queryStartDate)
        ]
      });
    }
    if (queryEndDate) {
      const endOfDay = new Date(queryEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }

    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    }

    if (queryMoNo) matchQuery.selectedMono = queryMoNo;
    if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
    if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
    if (queryBuyer) matchQuery.buyer = queryBuyer;
    if (queryColor) matchQuery.color = queryColor;
    if (querySize) matchQuery.size = querySize;
    if (queryQcId) matchQuery.emp_id_opa = queryQcId;

    const createDynamicPipeline = (
      field,
      isNumeric = false,
      specificMatch = {}
    ) => {
      const baseFieldMatch = isNumeric
        ? { [field]: { $ne: null } }
        : { [field]: { $ne: null, $ne: "" } };
      const pipeline = [
        { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
        { $group: { _id: `$${field}` } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            value: isNumeric ? { $toString: `$_id` } : `$_id`,
            label: isNumeric ? { $toString: `$_id` } : `$_id`
          }
        }
      ];
      const tempMatch = { ...matchQuery };
      if (
        req.query[
          field === "emp_id_opa"
            ? "qcId"
            : field === "selectedMono"
            ? "moNo"
            : field === "package_no"
            ? "packageNo"
            : field
        ]
      )
        delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        ...baseFieldMatch,
        ...specificMatch
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_opa: { $ne: null, $ne: "" } } },
      { $group: { _id: "$emp_id_opa", eng_name: { $first: "$eng_name_opa" } } },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: "$_id",
          label: {
            $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
          }
        }
      }
    ];
    const qcIdsMatch = { ...matchQuery };
    if (queryQcId) delete qcIdsMatch.emp_id_opa;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_opa: { $ne: null, $ne: "" }
    };

    const [
      moNosData,
      packageNosData,
      custStylesData,
      buyersData,
      colorsData,
      sizesData,
      qcIdsDataResult
    ] = await Promise.all([
      OPA.aggregate(createDynamicPipeline("selectedMono")).exec(),
      OPA.aggregate(createDynamicPipeline("package_no", true)).exec(),
      OPA.aggregate(createDynamicPipeline("custStyle")).exec(),
      OPA.aggregate(createDynamicPipeline("buyer")).exec(),
      OPA.aggregate(createDynamicPipeline("color")).exec(),
      OPA.aggregate(createDynamicPipeline("size")).exec(),
      OPA.aggregate(qcIdsPipeline).exec()
    ]);

    res.json({
      moNos: moNosData.filter((item) => item.value),
      packageNos: packageNosData.filter((item) => item.value),
      custStyles: custStylesData.filter((item) => item.value),
      buyers: buyersData.filter((item) => item.value),
      colors: colorsData.filter((item) => item.value),
      sizes: sizesData.filter((item) => item.value),
      qcIds: qcIdsDataResult.filter((item) => item.value)
    });
  } catch (error) {
    console.error("Error fetching OPA filter options:", error);
    res.status(500).json({ error: "Failed to fetch OPA filter options" });
  }
});

// Endpoint to fetch OPA Dashboard data
app.get("/api/opa/dashboard-data", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId, // qcId is emp_id_opa
      page = 1,
      limit = 20
    } = req.query;

    let baseMatchQuery = {};
    if (moNo) baseMatchQuery.selectedMono = moNo;
    if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
    if (custStyle) baseMatchQuery.custStyle = custStyle;
    if (buyer) baseMatchQuery.buyer = buyer;
    if (color) baseMatchQuery.color = color;
    if (size) baseMatchQuery.size = size;
    if (qcId) baseMatchQuery.emp_id_opa = qcId;

    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      currentDateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (currentDateMatchAnd.length > 0) {
      currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
    } else if (
      Object.keys(currentPeriodMatchQuery).length === 0 &&
      !startDate &&
      !endDate
    ) {
      const todayRange = getDayRange(new Date());
      currentPeriodMatchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$opa_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$opa_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
    const prevDate = new Date(referenceDateForPrev);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDayDateRange = getDayRange(prevDate);

    let previousDayMatchQuery = { ...baseMatchQuery };
    previousDayMatchQuery.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$opa_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(0),
                onNull: new Date(0)
              }
            },
            prevDayDateRange.start
          ]
        },
        {
          $lte: [
            {
              $dateFromString: {
                dateString: "$opa_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(Date.now() + 86400000 * 365 * 10),
                onNull: new Date(Date.now() + 86400000 * 365 * 10)
              }
            },
            prevDayDateRange.end
          ]
        }
      ]
    };

    const summaryAggregation = [
      {
        $group: {
          _id: null,
          totalOPAQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_opa", 60] },
                { $ifNull: ["$passQtyOPA", 0] },
                0
              ]
            }
          },
          totalRecheckOPAQty: {
            $sum: {
              $cond: [
                { $ne: ["$task_no_opa", 60] },
                { $ifNull: ["$passQtyOPA", 0] },
                0
              ]
            }
          }, // Assuming non-60 is recheck
          totalBundles: { $sum: 1 }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      OPA.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      OPA.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalOPAQty: 0,
      totalRecheckOPAQty: 0,
      totalBundles: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalOPAQty: 0,
      totalRecheckOPAQty: 0,
      totalBundles: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $project: {
          emp_id_opa: 1,
          eng_name_opa: 1,
          opa_updated_date: 1,
          passQtyOPA: { $ifNull: ["$passQtyOPA", 0] },
          task_no_opa: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            emp_id: "$emp_id_opa",
            date: "$opa_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_opa" },
          dailyOPAQty: {
            $sum: { $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
          },
          dailyRecheckOPAQty: {
            $sum: { $cond: [{ $ne: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
          },
          dailyBundles: { $sum: 1 }
        }
      },
      { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
      {
        $project: {
          _id: 0,
          emp_id: "$_id.emp_id",
          eng_name: "$eng_name",
          date: "$_id.date",
          dailyOPAQty: 1,
          dailyRecheckOPAQty: 1,
          dailyBundles: 1
        }
      }
    ];
    const inspectorSummaryData = await OPA.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          }
        }
      },
      { $sort: { parsedDate: -1, opa_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          opa_updated_date: 1,
          emp_id_opa: 1,
          eng_name_opa: 1,
          dept_name_opa: 1,
          selectedMono: 1,
          package_no: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          opa_update_time: 1,
          opaQty: {
            $cond: [
              { $eq: ["$task_no_opa", 60] },
              { $ifNull: ["$passQtyOPA", 0] },
              0
            ]
          },
          recheckOPAQty: {
            $cond: [
              { $ne: ["$task_no_opa", 60] },
              { $ifNull: ["$passQtyOPA", 0] },
              0
            ]
          },
          bundleCount: 1 // Assuming 'count' field in schema means total pieces in bundle, or 1 if it's bundle count
        }
      }
    ];
    const detailedRecords = await OPA.aggregate(detailedRecordsPipeline).exec();
    const totalRecords = await OPA.countDocuments(
      currentPeriodMatchQuery
    ).exec();

    res.json({
      overallSummary,
      previousDaySummary,
      inspectorSummaryData,
      detailedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching OPA dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch OPA dashboard data" });
  }
});

// Endpoint for Hourly OPA Data Chart
app.get("/api/opa/hourly-summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId
    } = req.query;

    let matchQuery = {};
    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    } else {
      const todayRange = getDayRange(new Date());
      matchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$opa_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$opa_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    if (moNo) matchQuery.selectedMono = moNo;
    if (packageNo) matchQuery.package_no = parseInt(packageNo);
    if (custStyle) matchQuery.custStyle = custStyle;
    if (buyer) matchQuery.buyer = buyer;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (qcId) matchQuery.emp_id_opa = qcId;

    const hourlyData = await OPA.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$opa_update_time", 0, 2] },
          passQtyOPA: { $ifNull: ["$passQtyOPA", 0] },
          task_no_opa: 1
        }
      },
      {
        $group: {
          _id: "$hour",
          totalOPAQty: {
            $sum: { $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
          },
          totalBundles: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;
      let opaQtyChange = 0;
      if (prevItem && prevItem.totalOPAQty > 0)
        opaQtyChange =
          ((item.totalOPAQty - prevItem.totalOPAQty) / prevItem.totalOPAQty) *
          100;
      else if (prevItem && prevItem.totalOPAQty === 0 && item.totalOPAQty > 0)
        opaQtyChange = 100;

      let bundleQtyChange = 0;
      if (prevItem && prevItem.totalBundles > 0)
        bundleQtyChange =
          ((item.totalBundles - prevItem.totalBundles) /
            prevItem.totalBundles) *
          100;
      else if (prevItem && prevItem.totalBundles === 0 && item.totalBundles > 0)
        bundleQtyChange = 100;

      return {
        hour: item._id,
        totalOPAQty: item.totalOPAQty,
        totalBundles: item.totalBundles,
        opaQtyChange: opaQtyChange.toFixed(1),
        bundleQtyChange: bundleQtyChange.toFixed(1)
      };
    });
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly OPA summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly OPA summary" });
  }
});

/* ------------------------------
Ironing Live Dashboard Endpoints
------------------------------ */

app.get("/api/ironing/filters", async (req, res) => {
  try {
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo,
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId,
      packageNo: queryPackageNo
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(queryStartDate)
        ]
      });
    }
    if (queryEndDate) {
      const endOfDay = new Date(queryEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }

    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    }

    if (queryMoNo) matchQuery.selectedMono = queryMoNo;
    if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
    if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
    if (queryBuyer) matchQuery.buyer = queryBuyer;
    if (queryColor) matchQuery.color = queryColor;
    if (querySize) matchQuery.size = querySize;
    if (queryQcId) matchQuery.emp_id_ironing = queryQcId;

    const createDynamicPipeline = (
      field,
      isNumeric = false,
      specificMatch = {}
    ) => {
      const baseFieldMatch = isNumeric
        ? { [field]: { $ne: null } }
        : { [field]: { $ne: null, $ne: "" } };
      const pipeline = [
        { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
        { $group: { _id: `$${field}` } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            value: isNumeric ? { $toString: `$_id` } : `$_id`,
            label: isNumeric ? { $toString: `$_id` } : `$_id`
          }
        }
      ];
      const tempMatch = { ...matchQuery };
      let queryParamName = field;
      if (field === "emp_id_ironing") queryParamName = "qcId";
      else if (field === "selectedMono") queryParamName = "moNo";
      else if (field === "package_no") queryParamName = "packageNo";

      if (req.query[queryParamName]) delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        ...baseFieldMatch,
        ...specificMatch
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_ironing: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$emp_id_ironing",
          eng_name: { $first: "$eng_name_ironing" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: "$_id",
          label: {
            $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
          }
        }
      }
    ];
    const qcIdsMatch = { ...matchQuery };
    if (queryQcId) delete qcIdsMatch.emp_id_ironing;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_ironing: { $ne: null, $ne: "" }
    };

    const [
      moNosData,
      packageNosData,
      custStylesData,
      buyersData,
      colorsData,
      sizesData,
      qcIdsDataResult
    ] = await Promise.all([
      Ironing.aggregate(createDynamicPipeline("selectedMono")).exec(),
      Ironing.aggregate(createDynamicPipeline("package_no", true)).exec(),
      Ironing.aggregate(createDynamicPipeline("custStyle")).exec(),
      Ironing.aggregate(createDynamicPipeline("buyer")).exec(),
      Ironing.aggregate(createDynamicPipeline("color")).exec(),
      Ironing.aggregate(createDynamicPipeline("size")).exec(),
      Ironing.aggregate(qcIdsPipeline).exec()
    ]);

    res.json({
      moNos: moNosData.filter((item) => item.value),
      packageNos: packageNosData.filter((item) => item.value),
      custStyles: custStylesData.filter((item) => item.value),
      buyers: buyersData.filter((item) => item.value),
      colors: colorsData.filter((item) => item.value),
      sizes: sizesData.filter((item) => item.value),
      qcIds: qcIdsDataResult.filter((item) => item.value)
    });
  } catch (error) {
    console.error("Error fetching Ironing filter options:", error);
    res.status(500).json({ error: "Failed to fetch Ironing filter options" });
  }
});

app.get("/api/ironing/dashboard-data", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId,
      page = 1,
      limit = 20
    } = req.query;

    let baseMatchQuery = {};
    if (moNo) baseMatchQuery.selectedMono = moNo;
    if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
    if (custStyle) baseMatchQuery.custStyle = custStyle;
    if (buyer) baseMatchQuery.buyer = buyer;
    if (color) baseMatchQuery.color = color;
    if (size) baseMatchQuery.size = size;
    if (qcId) baseMatchQuery.emp_id_ironing = qcId;

    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      currentDateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (currentDateMatchAnd.length > 0) {
      currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
    } else if (
      Object.keys(currentPeriodMatchQuery).length === 0 &&
      !startDate &&
      !endDate
    ) {
      const todayRange = getDayRange(new Date());
      currentPeriodMatchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$ironing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$ironing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
    const prevDate = new Date(referenceDateForPrev);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDayDateRange = getDayRange(prevDate);

    let previousDayMatchQuery = { ...baseMatchQuery };
    previousDayMatchQuery.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$ironing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(0),
                onNull: new Date(0)
              }
            },
            prevDayDateRange.start
          ]
        },
        {
          $lte: [
            {
              $dateFromString: {
                dateString: "$ironing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(Date.now() + 86400000 * 365 * 10),
                onNull: new Date(Date.now() + 86400000 * 365 * 10)
              }
            },
            prevDayDateRange.end
          ]
        }
      ]
    };

    const summaryAggregation = [
      {
        $group: {
          _id: null,
          totalIroningQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_ironing", 53] },
                { $ifNull: ["$passQtyIron", 0] },
                0
              ]
            }
          },
          totalRecheckIroningQty: {
            $sum: {
              $cond: [
                { $ne: ["$task_no_ironing", 53] },
                { $ifNull: ["$passQtyIron", 0] },
                0
              ]
            }
          },
          totalBundles: { $sum: 1 }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      Ironing.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      Ironing.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalIroningQty: 0,
      totalRecheckIroningQty: 0,
      totalBundles: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalIroningQty: 0,
      totalRecheckIroningQty: 0,
      totalBundles: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $project: {
          emp_id_ironing: 1,
          eng_name_ironing: 1,
          ironing_updated_date: 1,
          passQtyIron: { $ifNull: ["$passQtyIron", 0] },
          task_no_ironing: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            emp_id: "$emp_id_ironing",
            date: "$ironing_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_ironing" },
          dailyIroningQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          dailyRecheckIroningQty: {
            $sum: {
              $cond: [{ $ne: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          dailyBundles: { $sum: 1 }
        }
      },
      { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
      {
        $project: {
          _id: 0,
          emp_id: "$_id.emp_id",
          eng_name: "$eng_name",
          date: "$_id.date",
          dailyIroningQty: 1,
          dailyRecheckIroningQty: 1,
          dailyBundles: 1
        }
      }
    ];
    const inspectorSummaryData = await Ironing.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          }
        }
      },
      { $sort: { parsedDate: -1, ironing_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          ironing_updated_date: 1,
          emp_id_ironing: 1,
          eng_name_ironing: 1,
          dept_name_ironing: 1,
          selectedMono: 1,
          package_no: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          ironing_update_time: 1,
          ironingQty: {
            $cond: [
              { $eq: ["$task_no_ironing", 53] },
              { $ifNull: ["$passQtyIron", 0] },
              0
            ]
          },
          recheckIroningQty: {
            $cond: [
              { $ne: ["$task_no_ironing", 53] },
              { $ifNull: ["$passQtyIron", 0] },
              0
            ]
          },
          bundleCount: 1
        }
      }
    ];
    const detailedRecords = await Ironing.aggregate(
      detailedRecordsPipeline
    ).exec();
    const totalRecords = await Ironing.countDocuments(
      currentPeriodMatchQuery
    ).exec();

    res.json({
      overallSummary,
      previousDaySummary,
      inspectorSummaryData,
      detailedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching Ironing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch Ironing dashboard data" });
  }
});

app.get("/api/ironing/hourly-summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId
    } = req.query;

    let matchQuery = {};
    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    } else {
      const todayRange = getDayRange(new Date());
      matchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$ironing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$ironing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    if (moNo) matchQuery.selectedMono = moNo;
    if (packageNo) matchQuery.package_no = parseInt(packageNo);
    if (custStyle) matchQuery.custStyle = custStyle;
    if (buyer) matchQuery.buyer = buyer;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (qcId) matchQuery.emp_id_ironing = qcId;

    const hourlyData = await Ironing.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$ironing_update_time", 0, 2] },
          passQtyIron: { $ifNull: ["$passQtyIron", 0] },
          task_no_ironing: 1
        }
      },
      {
        $group: {
          _id: "$hour",
          totalIroningQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          totalBundles: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;
      let ironingQtyChange = 0;
      if (prevItem && prevItem.totalIroningQty > 0)
        ironingQtyChange =
          ((item.totalIroningQty - prevItem.totalIroningQty) /
            prevItem.totalIroningQty) *
          100;
      else if (
        prevItem &&
        prevItem.totalIroningQty === 0 &&
        item.totalIroningQty > 0
      )
        ironingQtyChange = 100;

      let bundleQtyChange = 0;
      if (prevItem && prevItem.totalBundles > 0)
        bundleQtyChange =
          ((item.totalBundles - prevItem.totalBundles) /
            prevItem.totalBundles) *
          100;
      else if (prevItem && prevItem.totalBundles === 0 && item.totalBundles > 0)
        bundleQtyChange = 100;

      return {
        hour: item._id,
        totalIroningQty: item.totalIroningQty,
        totalBundles: item.totalBundles,
        ironingQtyChange: ironingQtyChange.toFixed(1),
        bundleQtyChange: bundleQtyChange.toFixed(1)
      };
    });
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly Ironing summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly Ironing summary" });
  }
});

/* ------------------------------
Packing Live Dashboard Endpoints
------------------------------ */

app.get("/api/packing/filters", async (req, res) => {
  try {
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo,
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId, // qcId here is emp_id_packing
      packageNo: queryPackageNo
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(queryStartDate)
        ]
      });
    }
    if (queryEndDate) {
      const endOfDay = new Date(queryEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }

    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    }

    if (queryMoNo) matchQuery.selectedMono = queryMoNo;
    if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
    if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
    if (queryBuyer) matchQuery.buyer = queryBuyer;
    if (queryColor) matchQuery.color = queryColor;
    if (querySize) matchQuery.size = querySize;
    if (queryQcId) matchQuery.emp_id_packing = queryQcId;

    const createDynamicPipeline = (
      field,
      isNumeric = false,
      specificMatch = {}
    ) => {
      const baseFieldMatch = isNumeric
        ? { [field]: { $ne: null } }
        : { [field]: { $ne: null, $ne: "" } };
      const pipeline = [
        { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
        { $group: { _id: `$${field}` } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            value: isNumeric ? { $toString: `$_id` } : `$_id`,
            label: isNumeric ? { $toString: `$_id` } : `$_id`
          }
        }
      ];
      const tempMatch = { ...matchQuery };
      let queryParamName = field;
      if (field === "emp_id_packing") queryParamName = "qcId";
      else if (field === "selectedMono") queryParamName = "moNo";
      else if (field === "package_no") queryParamName = "packageNo";

      if (req.query[queryParamName]) delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        ...baseFieldMatch,
        ...specificMatch
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_packing: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$emp_id_packing",
          eng_name: { $first: "$eng_name_packing" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: "$_id",
          label: {
            $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
          }
        }
      }
    ];
    const qcIdsMatch = { ...matchQuery };
    if (queryQcId) delete qcIdsMatch.emp_id_packing;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_packing: { $ne: null, $ne: "" }
    };

    const [
      moNosData,
      packageNosData,
      custStylesData,
      buyersData,
      colorsData,
      sizesData,
      qcIdsDataResult
    ] = await Promise.all([
      Packing.aggregate(createDynamicPipeline("selectedMono")).exec(),
      Packing.aggregate(createDynamicPipeline("package_no", true)).exec(),
      Packing.aggregate(createDynamicPipeline("custStyle")).exec(),
      Packing.aggregate(createDynamicPipeline("buyer")).exec(),
      Packing.aggregate(createDynamicPipeline("color")).exec(),
      Packing.aggregate(createDynamicPipeline("size")).exec(),
      Packing.aggregate(qcIdsPipeline).exec()
    ]);

    res.json({
      moNos: moNosData.filter((item) => item.value),
      packageNos: packageNosData.filter((item) => item.value),
      custStyles: custStylesData.filter((item) => item.value),
      buyers: buyersData.filter((item) => item.value),
      colors: colorsData.filter((item) => item.value),
      sizes: sizesData.filter((item) => item.value),
      qcIds: qcIdsDataResult.filter((item) => item.value)
    });
  } catch (error) {
    console.error("Error fetching Packing filter options:", error);
    res.status(500).json({ error: "Failed to fetch Packing filter options" });
  }
});

app.get("/api/packing/dashboard-data", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId,
      page = 1,
      limit = 20
    } = req.query;

    let baseMatchQuery = {};
    if (moNo) baseMatchQuery.selectedMono = moNo;
    if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
    if (custStyle) baseMatchQuery.custStyle = custStyle;
    if (buyer) baseMatchQuery.buyer = buyer;
    if (color) baseMatchQuery.color = color;
    if (size) baseMatchQuery.size = size;
    if (qcId) baseMatchQuery.emp_id_packing = qcId;

    // Always filter by task_no_packing = 62 for primary metrics
    baseMatchQuery.task_no_packing = 62;

    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      currentDateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (currentDateMatchAnd.length > 0) {
      currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
    } else if (
      Object.keys(currentPeriodMatchQuery).length === 1 &&
      currentPeriodMatchQuery.task_no_packing &&
      !startDate &&
      !endDate
    ) {
      // Only task_no filter is active
      const todayRange = getDayRange(new Date());
      currentPeriodMatchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$packing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$packing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
    const prevDate = new Date(referenceDateForPrev);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDayDateRange = getDayRange(prevDate);

    let previousDayMatchQuery = { ...baseMatchQuery }; // Includes task_no_packing = 62
    previousDayMatchQuery.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$packing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(0),
                onNull: new Date(0)
              }
            },
            prevDayDateRange.start
          ]
        },
        {
          $lte: [
            {
              $dateFromString: {
                dateString: "$packing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(Date.now() + 86400000 * 365 * 10),
                onNull: new Date(Date.now() + 86400000 * 365 * 10)
              }
            },
            prevDayDateRange.end
          ]
        }
      ]
    };

    const summaryAggregation = [
      {
        $group: {
          _id: null,
          totalPackingQty: { $sum: { $ifNull: ["$passQtyPack", 0] } }, // Sum of passQtyPack for task_no_packing = 62
          totalOrderCardBundles: {
            $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCards: {
            $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCardQty: {
            $sum: {
              $cond: [
                { $eq: ["$packing_record_id", 0] },
                { $ifNull: ["$passQtyPack", 0] },
                0
              ]
            }
          }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      Packing.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      Packing.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalPackingQty: 0,
      totalOrderCardBundles: 0,
      totalDefectCards: 0,
      totalDefectCardQty: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalPackingQty: 0,
      totalOrderCardBundles: 0,
      totalDefectCards: 0,
      totalDefectCardQty: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery }, // This already has task_no_packing = 62
      {
        $project: {
          emp_id_packing: 1,
          eng_name_packing: 1,
          packing_updated_date: 1,
          passQtyPack: { $ifNull: ["$passQtyPack", 0] },
          packing_record_id: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            emp_id: "$emp_id_packing",
            date: "$packing_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_packing" },
          dailyTotalPackingQty: { $sum: "$passQtyPack" },
          dailyOrderCardBundles: {
            $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
          },
          dailyDefectCards: {
            $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
          },
          dailyDefectCardQty: {
            $sum: {
              $cond: [{ $eq: ["$packing_record_id", 0] }, "$passQtyPack", 0]
            }
          }
        }
      },
      { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
      {
        $project: {
          _id: 0,
          emp_id: "$_id.emp_id",
          eng_name: "$eng_name",
          date: "$_id.date",
          dailyTotalPackingQty: 1,
          dailyOrderCardBundles: 1,
          dailyDefectCards: 1,
          dailyDefectCardQty: 1
        }
      }
    ];
    const inspectorSummaryData = await Packing.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery }, // This already has task_no_packing = 62
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          cardType: {
            $cond: [
              { $eq: ["$packing_record_id", 0] },
              "Defect Card",
              "Order Card"
            ]
          }
        }
      },
      { $sort: { parsedDate: -1, packing_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          packing_updated_date: 1,
          emp_id_packing: 1,
          eng_name_packing: 1,
          dept_name_packing: 1,
          selectedMono: 1,
          package_no: 1,
          cardType: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          packing_update_time: 1,
          passQtyPack: 1, // This is the qty for the specific card
          packing_record_id: 1 // For client-side logic if needed, though cardType is better
        }
      }
    ];
    const detailedRecords = await Packing.aggregate(
      detailedRecordsPipeline
    ).exec();
    const totalRecords = await Packing.countDocuments(
      currentPeriodMatchQuery
    ).exec();

    res.json({
      overallSummary,
      previousDaySummary,
      inspectorSummaryData,
      detailedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching Packing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch Packing dashboard data" });
  }
});

app.get("/api/packing/hourly-summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId
    } = req.query;

    let matchQuery = {};
    matchQuery.task_no_packing = 62; // Crucial for packing

    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    } else {
      const todayRange = getDayRange(new Date());
      matchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$packing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$packing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    if (moNo) matchQuery.selectedMono = moNo;
    if (packageNo) matchQuery.package_no = parseInt(packageNo);
    if (custStyle) matchQuery.custStyle = custStyle;
    if (buyer) matchQuery.buyer = buyer;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (qcId) matchQuery.emp_id_packing = qcId;

    const hourlyData = await Packing.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$packing_update_time", 0, 2] },
          passQtyPack: { $ifNull: ["$passQtyPack", 0] },
          packing_record_id: 1
        }
      },
      {
        $group: {
          _id: "$hour",
          totalPackingQty: { $sum: "$passQtyPack" },
          totalOrderCardBundles: {
            $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCards: {
            $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCardQty: {
            $sum: {
              $cond: [{ $eq: ["$packing_record_id", 0] }, "$passQtyPack", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;

      const calculateChange = (current, previous) => {
        if (previous > 0) return ((current - previous) / previous) * 100;
        if (current > 0 && previous === 0) return 100;
        return 0;
      };

      return {
        hour: item._id,
        totalPackingQty: item.totalPackingQty,
        totalOrderCardBundles: item.totalOrderCardBundles,
        totalDefectCards: item.totalDefectCards,
        totalDefectCardQty: item.totalDefectCardQty,
        packingQtyChange: calculateChange(
          item.totalPackingQty,
          prevItem?.totalPackingQty || 0
        ).toFixed(1),
        orderCardBundlesChange: calculateChange(
          item.totalOrderCardBundles,
          prevItem?.totalOrderCardBundles || 0
        ).toFixed(1),
        defectCardsChange: calculateChange(
          item.totalDefectCards,
          prevItem?.totalDefectCards || 0
        ).toFixed(1),
        defectCardQtyChange: calculateChange(
          item.totalDefectCardQty,
          prevItem?.totalDefectCardQty || 0
        ).toFixed(1)
      };
    });
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly Packing summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly Packing summary" });
  }
});

/* ------------------------------------
   End Points - Audit Image
------------------------------------ */

// 1. Define the absolute destination path and ensure the directory exists
const auditUploadPath = path.join(
  __dirname,
  "public",
  "storage",
  "audit_images"
);
//fs.mkdirSync(auditUploadPath, { recursive: true }); // This is the correct way to ensure the directory exists

// 2. Update the multer storage configuration
const audit_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the absolute path variable here
    cb(null, auditUploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize requirementId or use a UUID for more robust filenames
    const requirementId = req.body.requirementId || "unknown";
    cb(
      null,
      `audit-${requirementId}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const audit_image_upload = multer({
  storage: audit_storage,
  fileFilter: (req, file, cb) => {
    // Same fileFilter as your cutting_upload
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"]; // Added GIF
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF images are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Audit Image upload endpoint
app.post(
  "/api/audit/upload-image",
  audit_image_upload.single("auditImage"), // field name in FormData
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    // Store relative path to be used with API_BASE_URL on client
    const relativePath = `/storage/audit_images/${req.file.filename}`;
    res.status(200).json({
      success: true,
      filePath: relativePath,
      message: "Image uploaded successfully"
    });
  }
);

/* ------------------------------------
   End Points - Audit Check Points
------------------------------------ */

// GET all audit checkpoints, sorted by mainTitleNo
app.get("/api/audit-checkpoints", async (req, res) => {
  try {
    const checkpoints = await AuditCheckPoint.find({})
      .sort({ mainTitleNo: 1 })
      .lean();
    res.json(checkpoints);
  } catch (error) {
    console.error("Error fetching audit checkpoints:", error);
    res
      .status(500)
      .json({ message: "Server error fetching audit checkpoints" });
  }
});

// GET unique section titles for dropdowns
app.get("/api/audit-checkpoints/unique-section-titles", async (req, res) => {
  try {
    const titles = await AuditCheckPoint.aggregate([
      {
        $group: {
          _id: null,
          eng: { $addToSet: "$sectionTitleEng" },
          khmer: { $addToSet: "$sectionTitleKhmer" },
          chinese: { $addToSet: "$sectionTitleChinese" }
        }
      },
      { $project: { _id: 0, eng: 1, khmer: 1, chinese: 1 } }
    ]);
    res.json(
      titles.length > 0 ? titles[0] : { eng: [], khmer: [], chinese: [] }
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching unique section titles" });
  }
});

// GET unique main topics for dropdowns (can be filtered by mainTitle if needed)
app.get("/api/audit-checkpoints/unique-main-topics", async (req, res) => {
  try {
    // This gets all unique topics across all checkpoints.
    // You might want to filter by a specific checkpoint if adding to an existing one.
    const topics = await AuditCheckPoint.aggregate([
      { $unwind: "$requirements" },
      {
        $group: {
          _id: null,
          eng: { $addToSet: "$requirements.mainTopicEng" },
          khmer: { $addToSet: "$requirements.mainTopicKhmer" },
          chinese: { $addToSet: "$requirements.mainTopicChinese" }
        }
      },
      { $project: { _id: 0, eng: 1, khmer: 1, chinese: 1 } }
    ]);
    res.json(
      topics.length > 0 ? topics[0] : { eng: [], khmer: [], chinese: [] }
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching unique main topics" });
  }
});

// POST - Create a new audit checkpoint section (e.g., QMS, Fabric)
app.post("/api/audit-checkpoints", async (req, res) => {
  try {
    const {
      mainTitle,
      mainTitleNo,
      sectionTitleEng,
      sectionTitleKhmer,
      sectionTitleChinese
      // requirements array will be empty initially or can be sent
    } = req.body;

    if (
      !mainTitle ||
      mainTitleNo === undefined ||
      !sectionTitleEng ||
      !sectionTitleKhmer ||
      !sectionTitleChinese
    ) {
      return res.status(400).json({
        message: "All main title and section title fields are required."
      });
    }

    const existingCheckpointByNo = await AuditCheckPoint.findOne({
      mainTitleNo
    });
    if (existingCheckpointByNo) {
      return res
        .status(409)
        .json({ message: `Main Title No '${mainTitleNo}' already exists.` });
    }
    const existingCheckpointByTitle = await AuditCheckPoint.findOne({
      mainTitle
    });
    if (existingCheckpointByTitle) {
      return res
        .status(409)
        .json({ message: `Main Title '${mainTitle}' already exists.` });
    }

    const newCheckpoint = new AuditCheckPoint({
      mainTitle,
      mainTitleNo,
      sectionTitleEng,
      sectionTitleKhmer,
      sectionTitleChinese,
      requirements: [] // Start with no requirements, add them separately
    });
    await newCheckpoint.save();
    res.status(201).json({
      message: "Audit checkpoint section created successfully",
      checkpoint: newCheckpoint
    });
  } catch (error) {
    console.error("Error creating audit checkpoint section:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate Main Title or Main Title No." });
    res
      .status(500)
      .json({ message: "Server error creating checkpoint section" });
  }
});

// PUT - Update an audit checkpoint section's titles (not requirements here)
app.put("/api/audit-checkpoints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mainTitle,
      mainTitleNo,
      sectionTitleEng,
      sectionTitleKhmer,
      sectionTitleChinese
    } = req.body;

    if (
      !mainTitle ||
      mainTitleNo === undefined ||
      !sectionTitleEng ||
      !sectionTitleKhmer ||
      !sectionTitleChinese
    ) {
      return res.status(400).json({
        message:
          "All main title and section title fields are required for update."
      });
    }

    // Check for duplicates excluding current
    const existingByNo = await AuditCheckPoint.findOne({
      mainTitleNo,
      _id: { $ne: id }
    });
    if (existingByNo)
      return res
        .status(409)
        .json({ message: `Main Title No '${mainTitleNo}' already taken.` });
    const existingByTitle = await AuditCheckPoint.findOne({
      mainTitle,
      _id: { $ne: id }
    });
    if (existingByTitle)
      return res
        .status(409)
        .json({ message: `Main Title '${mainTitle}' already taken.` });

    const updatedCheckpoint = await AuditCheckPoint.findByIdAndUpdate(
      id,
      {
        mainTitle,
        mainTitleNo,
        sectionTitleEng,
        sectionTitleKhmer,
        sectionTitleChinese
      },
      { new: true, runValidators: true }
    );
    if (!updatedCheckpoint)
      return res
        .status(404)
        .json({ message: "Audit checkpoint section not found." });
    res.json({
      message: "Audit checkpoint section updated successfully",
      checkpoint: updatedCheckpoint
    });
  } catch (error) {
    console.error("Error updating audit checkpoint section:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate Main Title or Main Title No on update." });
    res
      .status(500)
      .json({ message: "Server error updating checkpoint section" });
  }
});

// DELETE - Delete an entire audit checkpoint section
app.delete("/api/audit-checkpoints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCheckpoint = await AuditCheckPoint.findByIdAndDelete(id);
    if (!deletedCheckpoint)
      return res
        .status(404)
        .json({ message: "Audit checkpoint section not found." });
    res.json({ message: "Audit checkpoint section deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit checkpoint section:", error);
    res
      .status(500)
      .json({ message: "Server error deleting checkpoint section" });
  }
});

// --- Requirements within a Checkpoint Section ---

// POST - Add a requirement to a specific checkpoint section
app.post(
  "/api/audit-checkpoints/:checkpointId/requirements",
  async (req, res) => {
    try {
      const { checkpointId } = req.params;
      const requirementData = req.body; // { mainTopicEng, ..., mustHave }

      // Basic validation for requirement data
      if (
        !requirementData.mainTopicEng ||
        !requirementData.no ||
        !requirementData.pointTitleEng ||
        !requirementData.pointDescriptionEng ||
        requirementData.levelValue === undefined ||
        requirementData.mustHave === undefined
      ) {
        return res
          .status(400)
          .json({ message: "Missing required fields for the requirement." });
      }

      const checkpoint = await AuditCheckPoint.findById(checkpointId);
      if (!checkpoint)
        return res
          .status(404)
          .json({ message: "Audit checkpoint section not found." });

      // Check if requirement 'no' already exists in this section
      const existingRequirementNo = checkpoint.requirements.find(
        (r) => r.no === requirementData.no
      );
      if (existingRequirementNo) {
        return res.status(409).json({
          message: `Requirement No. '${requirementData.no}' already exists in this section.`
        });
      }

      checkpoint.requirements.push(requirementData);
      await checkpoint.save();
      res
        .status(201)
        .json({ message: "Requirement added successfully", checkpoint });
    } catch (error) {
      console.error("Error adding requirement:", error);
      res.status(500).json({ message: "Server error adding requirement" });
    }
  }
);

// PUT - Update a specific requirement within a checkpoint section
app.put(
  "/api/audit-checkpoints/:checkpointId/requirements/:requirementId",
  async (req, res) => {
    try {
      const { checkpointId, requirementId } = req.params;
      const updatedRequirementData = req.body;

      const checkpoint = await AuditCheckPoint.findById(checkpointId);
      if (!checkpoint)
        return res
          .status(404)
          .json({ message: "Audit checkpoint section not found." });

      const requirement = checkpoint.requirements.id(requirementId);
      if (!requirement)
        return res.status(404).json({ message: "Requirement not found." });

      // Check for 'no' conflict if 'no' is being changed
      if (
        updatedRequirementData.no &&
        updatedRequirementData.no !== requirement.no
      ) {
        const existingRequirementNo = checkpoint.requirements.find(
          (r) =>
            r.no === updatedRequirementData.no &&
            r._id.toString() !== requirementId
        );
        if (existingRequirementNo) {
          return res.status(409).json({
            message: `Requirement No. '${updatedRequirementData.no}' already exists in this section for another item.`
          });
        }
      }

      Object.assign(requirement, updatedRequirementData); // Update the subdocument
      await checkpoint.save();
      res.json({ message: "Requirement updated successfully", checkpoint });
    } catch (error) {
      console.error("Error updating requirement:", error);
      res.status(500).json({ message: "Server error updating requirement" });
    }
  }
);

// DELETE - Delete a specific requirement from a checkpoint section
app.delete(
  "/api/audit-checkpoints/:checkpointId/requirements/:requirementId",
  async (req, res) => {
    try {
      const { checkpointId, requirementId } = req.params;
      const checkpoint = await AuditCheckPoint.findById(checkpointId);
      if (!checkpoint)
        return res
          .status(404)
          .json({ message: "Audit checkpoint section not found." });

      const requirement = checkpoint.requirements.id(requirementId);
      if (!requirement)
        return res.status(404).json({ message: "Requirement not found." });

      requirement.remove(); // Mongoose subdocument remove method
      await checkpoint.save();
      res.json({ message: "Requirement deleted successfully", checkpoint });
    } catch (error) {
      console.error("Error deleting requirement:", error);
      res.status(500).json({ message: "Server error deleting requirement" });
    }
  }
);

// NEW ENDPOINT: Search for users by emp_id or name
app.get("/api/users/search", async (req, res) => {
  try {
    const searchTerm = req.query.term;
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.json([]); // Return empty if search term is too short
    }

    // Create a case-insensitive regular expression for searching
    const regex = new RegExp(searchTerm, "i");

    const users = await UserMain.find({
      $and: [
        { working_status: "Working" }, // Ensure only active users
        {
          $or: [{ emp_id: { $regex: regex } }, { eng_name: { $regex: regex } }]
        }
      ]
    })
      .limit(10) // Limit results for performance
      .select("emp_id eng_name job_title face_photo") // Select only needed fields
      .exec();

    res.json(users);
  } catch (err) {
    console.error("Error searching users:", err);
    res
      .status(500)
      .json({ message: "Failed to search for users", error: err.message });
  }
});

/* ------------------------------
   IE - Worker Assignment Endpoints (Corrected for Cross-Database)
------------------------------ */

// GET - Fetch distinct values for all filters (ONLY from active workers in ym_eco_board)
app.get("/api/ie/worker-assignment/filter-options", async (req, res) => {
  try {
    const workingStatusFilter = { working_status: "Working" };
    const [empIds, empCodes, departments, sections, jobTitles, taskNos] =
      await Promise.all([
        UserMain.distinct("emp_id", workingStatusFilter),
        UserMain.distinct("emp_code", workingStatusFilter),
        UserMain.distinct("dept_name", workingStatusFilter),
        UserMain.distinct("sect_name", workingStatusFilter),
        UserMain.distinct("job_title", workingStatusFilter),
        QC2Task.distinct("taskNo")
      ]);
    res.json({
      empIds: empIds.filter(Boolean).sort(),
      empCodes: empCodes.filter(Boolean).sort(),
      departments: departments.filter(Boolean).sort(),
      sections: sections.filter(Boolean).sort(),
      jobTitles: jobTitles.filter(Boolean).sort(),
      taskNos: taskNos.filter(Boolean).sort((a, b) => a - b)
    });
  } catch (error) {
    console.error("Error fetching worker assignment filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options." });
  }
});

// POST - Fetch paginated and filtered worker data (from users collection ONLY)
app.post("/api/ie/worker-assignment/workers", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      emp_id,
      emp_code,
      dept_name,
      sect_name,
      job_title
    } = req.body;
    let filter = { working_status: "Working" };
    if (emp_id) filter.emp_id = emp_id;
    if (emp_code) filter.emp_code = emp_code;
    if (dept_name) filter.dept_name = dept_name;
    if (sect_name) filter.sect_name = sect_name;
    if (job_title) filter.job_title = job_title;

    const skip = (page - 1) * limit;
    const totalUsers = await UserMain.countDocuments(filter);
    const workers = await UserMain.find(filter)
      .select(
        "emp_id emp_code eng_name kh_name job_title dept_name sect_name face_photo"
      )
      .sort({ emp_id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      workers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
      totalUsers
    });
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ message: "Server error fetching workers." });
  }
});

// *** NEW ENDPOINT ***
// GET - Fetch ALL assigned tasks from the ie_worker_tasks collection
app.get("/api/ie/worker-assignment/all-tasks", async (req, res) => {
  try {
    const allAssignedTasks = await IEWorkerTask.find({}).lean();
    res.json(allAssignedTasks);
  } catch (error) {
    console.error("Error fetching all worker tasks:", error);
    res
      .status(500)
      .json({ message: "Server error fetching all assigned tasks." });
  }
});

// PUT - Update a worker's assigned tasks (This endpoint is correct and remains unchanged)
app.put("/api/ie/worker-assignment/tasks/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const { tasks, emp_code } = req.body;
    if (!Array.isArray(tasks)) {
      return res
        .status(400)
        .json({ message: "Tasks must be an array of numbers." });
    }
    const updatedWorkerTask = await IEWorkerTask.findOneAndUpdate(
      { emp_id },
      { $set: { tasks, emp_code } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({
      message: "Worker tasks updated successfully",
      data: updatedWorkerTask
    });
  } catch (error) {
    console.error("Error updating worker tasks:", error);
    res.status(500).json({ message: "Server error updating tasks." });
  }
});

/* ------------------------------
   IE - BULK Worker Assignment Endpoints
------------------------------ */

// POST - Assign tasks to all workers with a specific job title
app.post("/api/ie/bulk-assignment/by-job-title", async (req, res) => {
  const { job_title, tasks } = req.body;

  if (!job_title || !Array.isArray(tasks)) {
    return res
      .status(400)
      .json({ message: "Job title and a tasks array are required." });
  }

  try {
    const workersToUpdate = await UserMain.find(
      { job_title: job_title, working_status: "Working" },
      "emp_id emp_code"
    ).lean();

    if (workersToUpdate.length === 0) {
      return res.status(404).json({
        message: `No active workers found with job title: ${job_title}`
      });
    }

    const bulkOps = workersToUpdate.map((worker) => ({
      updateOne: {
        filter: { emp_id: worker.emp_id },
        update: {
          $set: {
            emp_code: worker.emp_code,
            tasks: tasks
          }
        },
        upsert: true
      }
    }));

    const result = await IEWorkerTask.bulkWrite(bulkOps);

    res.json({
      message: "Bulk assignment completed successfully.",
      ...result
    });
  } catch (error) {
    console.error("Error during bulk worker assignment:", error);
    res.status(500).json({ message: "Server error during bulk assignment." });
  }
});

// **** COMPLETELY REBUILT AND CORRECTED GET ENDPOINT ****
// GET - Fetch data for the bulk assignment summary table
app.get("/api/ie/bulk-assignment/summary", async (req, res) => {
  try {
    // The collection name for the UserMain model. Mongoose defaults to pluralizing the model name.
    // If your UserMain model's collection is named differently, change "users" below.
    const usersCollectionName = "users";

    const summary = await IEWorkerTask.aggregate([
      // Stage 1: Start from the tasks collection, which ONLY has assigned workers.
      // This is the key to the fix.

      // Stage 2: Lookup details for each worker from the main users collection.
      {
        $lookup: {
          from: usersCollectionName, // The actual collection name for UserMain
          localField: "emp_id",
          foreignField: "emp_id",
          as: "workerDetails"
        }
      },

      // Stage 3: De-construct the workerDetails array. If a worker in tasks doesn't exist
      // in the users collection anymore, this will correctly discard them.
      {
        $unwind: "$workerDetails"
      },

      // Stage 4: Only include workers who are currently "Working".
      {
        $match: {
          "workerDetails.working_status": "Working"
        }
      },

      // Stage 5: Group the results by the job title found in the worker's details.
      {
        $group: {
          _id: "$workerDetails.job_title",
          workers: {
            $push: {
              emp_id: "$emp_id",
              face_photo: "$workerDetails.face_photo",
              eng_name: "$workerDetails.eng_name",
              tasks: "$tasks" // Get tasks from the original ie_worker_tasks document
            }
          }
        }
      },

      // Stage 6: Format the output for the frontend.
      {
        $project: {
          _id: 0,
          jobTitle: "$_id",
          workers: 1
        }
      },

      { $sort: { jobTitle: 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Error fetching bulk assignment summary:", error);
    res.status(500).json({ message: "Server error fetching summary." });
  }
});

/* -------------------------------------------
   IE - QC2 Role Management Endpoints (NEW & CORRECTED)
------------------------------------------- */

// Helper function to map page identifiers to keywords in processName
const getProcessKeywordForPage = (pageIdentifier) => {
  const keywordMap = {
    "bundle-registration": "bundle",
    washing: "washing",
    opa: "opa",
    ironing: "ironing",
    packing: "packing", // The keyword remains the same
    "qc2-inspection": "qc2"
  };
  return keywordMap[pageIdentifier.toLowerCase()];
};

// GET - Check if a specific user has access to a page based on their assigned tasks.
app.get("/api/ie/role-management/access-check", async (req, res) => {
  try {
    const { emp_id, page } = req.query;

    if (!emp_id || !page) {
      return res
        .status(400)
        .json({ message: "Employee ID and page identifier are required." });
    }

    // Step 1: Check for Super Admin / Admin roles in the 'role_management' collection.
    // We use findOne with an $or condition to see if the user exists in either role.
    const adminCheck = await RoleManagment.findOne({
      $or: [
        { role: "Super Admin", "users.emp_id": emp_id },
        { role: "Admin", "users.emp_id": emp_id }
      ]
    });

    // If adminCheck finds a document, it means the user is an Admin or Super Admin.
    if (adminCheck) {
      return res.json({ hasAccess: true });
    }

    // If not an admin, proceed with the task-based check as before.
    const keyword = getProcessKeywordForPage(page);
    if (!keyword) {
      return res.json({ hasAccess: false }); // Not an admin and page is not IE-controlled
    }

    // const keyword = getProcessKeywordForPage(page);
    // if (!keyword) {
    //   return res.status(400).json({ message: "Invalid page identifier." });
    // }

    // *** THE FIX IS HERE ***
    // Conditionally build the regex based on the keyword.
    let processNameFilter;
    if (keyword.toLowerCase() === "packing") {
      // For 'packing', use word boundaries (\b) to match it as a whole word.
      processNameFilter = { $regex: `\\b${keyword}\\b`, $options: "i" };
    } else {
      // For all other keywords, use the original substring match.
      processNameFilter = { $regex: keyword, $options: "i" };
    }

    // Step 1: Find all unique task numbers using the correct filter.
    const requiredTasksResult = await QC2Task.aggregate([
      { $match: { processName: processNameFilter } },
      { $group: { _id: null, taskNos: { $addToSet: "$taskNo" } } }
    ]);

    const requiredTaskNos =
      requiredTasksResult.length > 0 ? requiredTasksResult[0].taskNos : [];
    if (requiredTaskNos.length === 0) {
      return res.json({ hasAccess: false });
    }

    const workerTask = await IEWorkerTask.findOne({ emp_id }).lean();
    const userTasks = workerTask ? workerTask.tasks : [];
    if (userTasks.length === 0) {
      return res.json({ hasAccess: false });
    }

    const hasOverlap = userTasks.some((task) => requiredTaskNos.includes(task));
    res.json({ hasAccess: hasOverlap });
  } catch (error) {
    console.error("Error during IE access check:", error);
    res.status(500).json({ message: "Server error during access check." });
  }
});

// GET - Get a summary of which users have access to each managed page.
app.get("/api/ie/role-management/summary", async (req, res) => {
  try {
    const pages = [
      { id: "bundle-registration", name: "Bundle Registration" },
      { id: "washing", name: "Washing" },
      { id: "opa", name: "OPA" },
      { id: "ironing", name: "Ironing" },
      { id: "packing", name: "Packing" },
      { id: "qc2-inspection", name: "QC2 Inspection" }
    ];

    const fullSummary = [];

    for (const page of pages) {
      const keyword = getProcessKeywordForPage(page.id);

      // *** THE FIX IS HERE ***
      // Apply the same conditional regex logic in the summary endpoint.
      let processNameFilter;
      if (keyword.toLowerCase() === "packing") {
        processNameFilter = { $regex: `\\b${keyword}\\b`, $options: "i" };
      } else {
        processNameFilter = { $regex: keyword, $options: "i" };
      }

      // Get required task numbers for the page using the correct filter.
      const requiredTasksResult = await QC2Task.aggregate([
        { $match: { processName: processNameFilter } },
        { $group: { _id: null, taskNos: { $addToSet: "$taskNo" } } }
      ]);
      const requiredTaskNos =
        requiredTasksResult.length > 0 ? requiredTasksResult[0].taskNos : [];

      let usersWithAccess = [];
      if (requiredTaskNos.length > 0) {
        usersWithAccess = await IEWorkerTask.aggregate([
          { $match: { tasks: { $in: requiredTaskNos } } },
          {
            $lookup: {
              from: "users",
              localField: "emp_id",
              foreignField: "emp_id",
              as: "details"
            }
          },
          { $unwind: "$details" },
          { $match: { "details.working_status": "Working" } },
          {
            $project: {
              _id: 0,
              emp_id: "$emp_id",
              eng_name: "$details.eng_name",
              face_photo: "$details.face_photo",
              job_title: "$details.job_title",
              tasks: "$tasks"
            }
          },
          { $sort: { emp_id: 1 } }
        ]);
      }

      fullSummary.push({
        pageName: page.name,
        requiredTasks: requiredTaskNos.sort((a, b) => a - b),
        users: usersWithAccess
      });
    }

    res.json(fullSummary);
  } catch (error) {
    console.error("Error fetching IE role summary:", error);
    res.status(500).json({ message: "Server error fetching IE role summary." });
  }
});

/* -------------------------------------------
   IE - Task No Finder Endpoints (NEW)
------------------------------------------- */

// GET - Fetch all unique task numbers for a given department
app.get("/api/ie/tasks-by-department", async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) {
      return res.status(400).json({ message: "Department query is required." });
    }

    const taskNos = await QC2Task.distinct("taskNo", { department });

    res.json(taskNos.sort((a, b) => a - b));
  } catch (error) {
    console.error("Error fetching tasks by department:", error);
    res.status(500).json({ message: "Server error fetching tasks." });
  }
});

// GET - Fetch a user's task access rights (Admin status or assigned tasks)
app.get("/api/ie/user-task-access/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    if (!emp_id) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    // Check for Super Admin or Admin role first
    const adminCheck = await RoleManagment.findOne({
      $or: [
        { role: "Super Admin", "users.emp_id": emp_id },
        { role: "Admin", "users.emp_id": emp_id }
      ]
    });

    if (adminCheck) {
      // User is an admin, has access to all tasks
      return res.json({ isAdmin: true, assignedTasks: [] });
    }

    // If not an admin, find their specific tasks
    const workerTask = await IEWorkerTask.findOne({ emp_id }).lean();

    res.json({
      isAdmin: false,
      assignedTasks: workerTask ? workerTask.tasks : []
    });
  } catch (error) {
    console.error("Error fetching user task access:", error);
    res.status(500).json({ message: "Server error fetching user access." });
  }
});

/* =====================================================================
   ENDPOINTS FOR QA DEFECTS (QC Accuracy)
===================================================================== */

// GET - Fetch all QA defects with optional filtering
app.get("/api/qa-defects", async (req, res) => {
  try {
    const { isCommon } = req.query;
    const filter = {};
    if (isCommon) filter.isCommon = isCommon;

    // Fetch defects from the new model, sort by code, and use lean() for performance
    const defects = await QADefectsModel.find(filter).sort({ code: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QA defects:", error);
    res.status(500).json({ message: "Server error fetching QA defects" });
  }
});

// GET - Fetch options for the 'Add QA Defect' form
app.get("/api/qa-defects/options", async (req, res) => {
  try {
    // This endpoint is simpler as we don't need categories, repairs, etc.
    const lastDefect = await QADefectsModel.findOne().sort({ code: -1 });
    const nextCode = lastDefect ? lastDefect.code + 1 : 1; // Start from 1 or a higher number like 1001

    res.json({ nextCode });
  } catch (error) {
    console.error("Error fetching QA defect options:", error);
    res.status(500).json({ message: "Server error fetching options" });
  }
});

// POST - Add a new QA defect
app.post("/api/qa-defects", async (req, res) => {
  try {
    const { defectLetter, shortEng, english, khmer, chinese, isCommon } =
      req.body;

    if (!defectLetter || !shortEng || !english || !khmer || !isCommon) {
      return res.status(400).json({
        message: "Required fields are missing. Please fill out all fields."
      });
    }

    const existingDefect = await QADefectsModel.findOne({
      $or: [{ shortEng }, { english }, { defectLetter }]
    });
    if (existingDefect) {
      return res.status(409).json({
        message: `Defect with name or letter already exists.`
      });
    }

    const lastDefect = await QADefectsModel.findOne().sort({ code: -1 });
    const newCode = lastDefect ? lastDefect.code + 1 : 1;

    // Re-use the same logic to create default buyer statuses
    const allBuyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];
    const statusByBuyer = allBuyers.map((buyerName) => ({
      buyerName: buyerName,
      defectStatus: ["Major"],
      isCommon: "Major"
    }));

    const newQADefect = new QADefectsModel({
      code: newCode,
      defectLetter,
      shortEng,
      english,
      khmer,
      chinese: chinese || "",
      isCommon,
      statusByBuyer
      // createdAt and updatedAt are handled by timestamps: true in the schema
    });

    await newQADefect.save();
    res.status(201).json({
      message: "QA defect added successfully",
      defect: newQADefect
    });
  } catch (error) {
    console.error("Error adding QA defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. Defect code, name, or letter might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add QA defect", error: error.message });
  }
});

// DELETE - Delete a QA defect by its code
app.delete("/api/qa-defects/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const defectCode = parseInt(code, 10);
    if (isNaN(defectCode)) {
      return res.status(400).json({ message: "Invalid defect code format." });
    }
    const deletedDefect = await QADefectsModel.findOneAndDelete({
      code: defectCode
    });
    if (!deletedDefect) {
      return res.status(404).json({ message: "QA Defect not found." });
    }
    res.status(200).json({ message: "QA defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting QA defect:", error);
    res.status(500).json({
      message: "Failed to delete QA defect",
      error: error.message
    });
  }
});

/* ------------------------------
   QA Defect Buyer Status ENDPOINTS
------------------------------ */

// GET - Endpoint for all QA defect details for the management page
app.get("/api/qa-defects/all-details", async (req, res) => {
  try {
    const defects = await QADefectsModel.find({}).sort({ code: 1 }).lean();
    const transformedDefects = defects.map((defect) => ({
      code: defect.code.toString(),
      defectLetter: defect.defectLetter, // Include the new field
      name_en: defect.english,
      name_kh: defect.khmer,
      name_ch: defect.chinese,
      // The other fields like category, repair, type are not in this model
      statusByBuyer: defect.statusByBuyer || []
    }));
    res.json(transformedDefects);
  } catch (error) {
    console.error("Error fetching all QA defect details:", error);
    res.status(500).json({
      message: "Failed to fetch QA defect details",
      error: error.message
    });
  }
});

// POST - Endpoint for updating QA defect buyer statuses
// POST - Endpoint for updating QA defect buyer statuses (Robust Version)
app.post("/api/qa-defects/buyer-statuses", async (req, res) => {
  try {
    const statusesPayload = req.body;
    if (!Array.isArray(statusesPayload)) {
      return res
        .status(400)
        .json({ message: "Invalid payload: Expected an array of statuses." });
    }

    // Group the payload by defectCode
    const updatesByDefect = statusesPayload.reduce((acc, status) => {
      const defectCode = status.defectCode;
      if (!acc[defectCode]) {
        acc[defectCode] = [];
      }
      // Push the full buyer status object
      acc[defectCode].push({
        buyerName: status.buyerName,
        defectStatus: status.defectStatus || [],
        isCommon: status.isCommon || "Major"
      });
      return acc;
    }, {});

    // Create a bulk operation to update each defect's entire statusByBuyer array
    const bulkOps = Object.keys(updatesByDefect).map((defectCodeStr) => {
      const defectCodeNum = parseInt(defectCodeStr, 10);
      return {
        updateOne: {
          filter: { code: defectCodeNum },
          // Overwrite the entire array. This is simpler and more robust.
          update: {
            $set: {
              statusByBuyer: updatesByDefect[defectCodeStr]
            }
          }
        }
      };
    });

    if (bulkOps.length > 0) {
      await QADefectsModel.bulkWrite(bulkOps);
    }

    res.status(200).json({
      message: "QA Defect buyer statuses updated successfully."
    });
  } catch (error) {
    console.error("Error updating QA defect buyer statuses:", error);
    res.status(500).json({
      message: "Failed to update QA defect buyer statuses",
      error: error.message
    });
  }
});

/* =====================================================================
   ENDPOINTS FOR QA STANDARD DEFECTS
===================================================================== */

// --- FIX #2: NEW CRUD ENDPOINTS ---

// GET all standard defects
app.get("/api/qa-standard-defects", async (req, res) => {
  try {
    const defects = await QAStandardDefectsModel.find({}).sort({ code: 1 });
    res.json(defects);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching standard defects",
      error: error.message
    });
  }
});

// GET next available code
app.get("/api/qa-standard-defects/next-code", async (req, res) => {
  try {
    const lastDefect = await QAStandardDefectsModel.findOne().sort({
      code: -1
    });
    const nextCode = lastDefect ? lastDefect.code + 1 : 1;
    res.json({ nextCode });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching next code", error: error.message });
  }
});

// POST a new standard defect
app.post("/api/qa-standard-defects", async (req, res) => {
  try {
    const newDefect = new QAStandardDefectsModel(req.body);
    await newDefect.save();
    res.status(201).json(newDefect);
  } catch (error) {
    res.status(400).json({
      message: "Error creating standard defect",
      error: error.message
    });
  }
});

// PUT (Update) a standard defect
app.put("/api/qa-standard-defects/:id", async (req, res) => {
  try {
    const updatedDefect = await QAStandardDefectsModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDefect) {
      return res.status(404).json({ message: "Defect not found" });
    }
    res.json(updatedDefect);
  } catch (error) {
    res.status(400).json({
      message: "Error updating standard defect",
      error: error.message
    });
  }
});

// DELETE a standard defect
app.delete("/api/qa-standard-defects/:id", async (req, res) => {
  try {
    const deletedDefect = await QAStandardDefectsModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedDefect) {
      return res.status(404).json({ message: "Defect not found" });
    }
    res.status(200).json({ message: "Defect deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting standard defect",
      error: error.message
    });
  }
});

/* =====================================================================
   ENDPOINTS FOR QC ACCURACY PAGE
===================================================================== */

// --- Helper function for sanitizing filenames (if not already defined globally) ---
// const sanitize = (input) => {
//   if (typeof input !== "string") input = String(input);
//   let sane = input.replace(/[^a-zA-Z0-9-._]/g, "_");
//   if (sane === "." || sane === "..") return "_";
//   return sane;
// };

// --- FIX #2: NEW IMAGE UPLOAD ENDPOINT FOR QA ACCURACY ---
const qaAccuracyStorage = multer.memoryStorage();
const qaAccuracyUpload = multer({
  storage: qaAccuracyStorage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.post(
  "/api/qa-accuracy/upload-image",
  qaAccuracyUpload.single("imageFile"),
  async (req, res) => {
    try {
      const { imageType, moNo, qcId, date } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res
          .status(400)
          .json({ success: false, message: "No image file provided." });
      }
      if (!imageType || !moNo || !qcId || !date) {
        return res.status(400).json({
          success: false,
          message: "Missing required metadata for image."
        });
      }

      // Define the target path for QA Accuracy images
      const qaAccuracyUploadPath = path.join(
        __dirname,
        "public",
        "storage",
        "qa_accuracy"
      );
      // Ensure the directory exists
      await fsPromises.mkdir(qaAccuracyUploadPath, { recursive: true });

      // Sanitize metadata for a unique and safe filename
      const sanitizedImageType = sanitize(imageType); // 'defect' or 'additional'
      const sanitizedMoNo = sanitize(moNo);
      const sanitizedQcId = sanitize(qcId);
      const sanitizedDate = sanitize(date.split("T")[0]); // Use YYYY-MM-DD part of date

      const imagePrefix = `${sanitizedImageType}_${sanitizedMoNo}_${sanitizedDate}_${sanitizedQcId}_`;

      const newFilename = `${imagePrefix}${Date.now()}.webp`;
      const finalDiskPath = path.join(qaAccuracyUploadPath, newFilename);

      // Process and save the image using sharp
      await sharp(imageFile.buffer)
        .resize({
          width: 1024,
          height: 1024,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(finalDiskPath);

      const publicUrl = `${API_BASE_URL}/storage/qa_accuracy/${newFilename}`;

      res.json({ success: true, filePath: publicUrl });
    } catch (error) {
      console.error("Error in /api/qa-accuracy/upload-image:", error);
      res.status(500).json({
        success: false,
        message: "Server error during image processing."
      });
    }
  }
);

// GET - Fetch all QA defects for the dropdown (lightweight version)
app.get("/api/qa-defects-list", async (req, res) => {
  try {
    const defects = await QADefectsModel.find({})
      .sort({ code: 1 })
      .select("code english khmer chinese statusByBuyer") // Select only necessary fields
      .lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QA defects list:", error);
    res.status(500).json({ message: "Server error fetching QA defects list" });
  }
});

// --- FIX #2: NEW ENDPOINT TO FETCH STANDARD DEFECTS FOR THE FORM ---
app.get("/api/qa-standard-defects-list", async (req, res) => {
  try {
    const defects = await QAStandardDefectsModel.find({})
      .sort({ code: 1 })
      .lean(); // Use lean for performance
    res.json(defects);
  } catch (error) {
    console.error("Error fetching standard defects list:", error);
    res
      .status(500)
      .json({ message: "Server error fetching standard defects list" });
  }
});

// POST - Save a new QC Accuracy Inspection Report
app.post("/api/qc-accuracy-reports", async (req, res) => {
  try {
    // Basic validation
    const requiredFields = [
      "reportDate",
      "qcInspector",
      "scannedQc",
      "reportType",
      "moNo",
      "totalCheckedQty",
      "result"
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    const newReport = new QCAccuracyReportModel(req.body);
    await newReport.save();

    res.status(201).json({
      message: "QC Accuracy report saved successfully!",
      report: newReport
    });
  } catch (error) {
    console.error("Error saving QC Accuracy report:", error);
    res
      .status(500)
      .json({ message: "Failed to save report", error: error.message });
  }
});

// --- FIX #1: NEW ENDPOINT TO POPULATE FILTER DROPDOWNS ---
app.get("/api/qa-accuracy/filter-options", async (req, res) => {
  try {
    const [qaIds, qcIds, moNos, lineNos, tableNos] = await Promise.all([
      QCAccuracyReportModel.distinct("qcInspector.empId"),
      QCAccuracyReportModel.distinct("scannedQc.empId"),
      QCAccuracyReportModel.distinct("moNo"),
      QCAccuracyReportModel.distinct("lineNo", { lineNo: { $ne: "NA" } }),
      QCAccuracyReportModel.distinct("tableNo", { tableNo: { $ne: "NA" } })
    ]);

    res.json({
      qaIds: qaIds.sort(),
      qcIds: qcIds.sort(),
      moNos: moNos.sort(),
      lineNos: lineNos.sort((a, b) => a - b), // Sort numbers correctly
      tableNos: tableNos.sort()
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options" });
  }
});

// --- FIX #2: CORRECTED RESULTS AGGREGATION ENDPOINT ---
app.get("/api/qa-accuracy/results", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo
    } = req.query;

    // --- 1. Build the initial match stage for filtering ---
    const matchStage = {};

    // Important: Only add filters if they have a value.
    if (startDate && endDate) {
      matchStage.reportDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (qaId) matchStage["qcInspector.empId"] = qaId;
    if (qcId) matchStage["scannedQc.empId"] = qcId;
    if (reportType) matchStage.reportType = reportType;
    if (moNo) matchStage.moNo = moNo;

    // Correctly handle conditional filtering for Line No / Table No
    if (reportType === "Inline Finishing") {
      if (tableNo) matchStage.tableNo = tableNo;
    } else {
      // For 'First Output', 'Inline Sewing', or if no reportType is selected
      if (lineNo) matchStage.lineNo = lineNo;
    }

    // --- 2. Main Aggregation Pipeline  ---
    const results = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },

      { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          reportDate: { $first: "$reportDate" },
          createdAt: { $first: "$createdAt" },
          scannedQc: { $first: "$scannedQc" },
          qcInspector: { $first: "$qcInspector" },
          reportType: { $first: "$reportType" },
          moNo: { $first: "$moNo" },
          colors: { $first: "$colors" },
          sizes: { $first: "$sizes" },
          lineNo: { $first: "$lineNo" },
          tableNo: { $first: "$tableNo" },
          totalCheckedQty: { $first: "$totalCheckedQty" },
          result: { $first: "$result" },
          grade: { $first: "$grade" },
          totalDefectPoints: { $first: "$totalDefectPoints" },
          totalDefectsInReport: { $sum: "$defects.qty" },
          uniquePcsInReport: { $addToSet: "$defects.pcsNo" },
          defects: { $push: "$defects" }
        }
      },
      {
        $group: {
          _id: "$scannedQc.empId",
          qcName: { $first: "$scannedQc.engName" },
          totalChecked: { $sum: "$totalCheckedQty" },
          totalDefectPoints: { $sum: "$totalDefectPoints" },
          totalReports: { $sum: 1 },
          passCount: { $sum: { $cond: [{ $eq: ["$result", "Pass"] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $eq: ["$result", "Fail"] }, 1, 0] } },
          totalRejectedPcs: {
            $sum: {
              $size: {
                $filter: {
                  input: "$uniquePcsInReport",
                  as: "item",
                  cond: { $ne: ["$$item", null] }
                }
              }
            }
          },
          //totalRejectedPcs: { $sum: { $size: "$uniquePcsInReport" } },
          totalDefects: { $sum: "$totalDefectsInReport" },
          // --- NEW: Calculate counts for each defect status ---
          minorCount: {
            $sum: {
              $size: {
                $filter: {
                  input: "$defects",
                  as: "d",
                  cond: { $eq: ["$$d.standardStatus", "Minor"] }
                }
              }
            }
          },
          majorCount: {
            $sum: {
              $size: {
                $filter: {
                  input: "$defects",
                  as: "d",
                  cond: { $eq: ["$$d.standardStatus", "Major"] }
                }
              }
            }
          },
          criticalCount: {
            $sum: {
              $size: {
                $filter: {
                  input: "$defects",
                  as: "d",
                  cond: { $eq: ["$$d.standardStatus", "Critical"] }
                }
              }
            }
          },
          reports: { $push: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "emp_id",
          as: "qcUserDetails"
        }
      },
      {
        $project: {
          _id: 0,
          qcId: "$_id",
          qcName: "$qcName",
          facePhoto: { $arrayElemAt: ["$qcUserDetails.face_photo", 0] },
          stats: {
            totalChecked: "$totalChecked",
            totalRejectedPcs: "$totalRejectedPcs",
            totalDefects: "$totalDefects",
            passCount: "$passCount",
            failCount: "$failCount",
            minorCount: "$minorCount", // Pass new counts
            majorCount: "$majorCount",
            criticalCount: "$criticalCount",
            accuracy: {
              $cond: [
                { $eq: ["$totalChecked", 0] },
                0,
                {
                  $multiply: [
                    {
                      $subtract: [
                        1,
                        { $divide: ["$totalDefectPoints", "$totalChecked"] }
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          },
          reports: "$reports"
        }
      }
    ]);

    res.json(results);
  } catch (error) {
    console.error("Error fetching QA Accuracy results:", error);
    res
      .status(500)
      .json({ message: "Server error fetching results", error: error.message });
  }
});

// --- FIX #1: NEW ENDPOINT FOR PAGINATED FULL REPORT ---
app.get("/api/qa-accuracy/full-report", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo,
      grade, // This is the new filter parameter from the frontend
      page = 1,
      limit = 50
    } = req.query;

    // 1. Build the match stage for filtering
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.reportDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (qaId) matchStage["qcInspector.empId"] = qaId;
    if (qcId) matchStage["scannedQc.empId"] = qcId;
    if (reportType) matchStage.reportType = reportType;
    if (moNo) matchStage.moNo = moNo;
    if (reportType === "Inline Finishing" && tableNo) {
      matchStage.tableNo = tableNo;
    } else if (lineNo) {
      matchStage.lineNo = lineNo;
    }
    // Add the new grade filter to the match stage
    if (grade) matchStage.grade = grade;

    // 2. Define custom sorting orders
    const reportTypeSortOrder = {
      "Inline Sewing": 1,
      "Inline Finishing": 2,
      "First Output": 3
    };
    const gradeSortOrder = { A: 1, B: 2, C: 3, D: 4 };

    // 3. Create the main aggregation pipeline
    const aggregationPipeline = [
      { $match: matchStage },
      // Add custom sort fields
      {
        $addFields: {
          reportTypeSort: { $ifNull: [reportTypeSortOrder[`$reportType`], 99] },
          gradeSort: { $ifNull: [gradeSortOrder[`$grade`], 99] },
          // --- FIX: USE $CONVERT FOR SAFE TYPE CONVERSION ---
          lineNoNumeric: {
            $convert: {
              input: "$lineNo",
              to: "int",
              onError: 9999, // If conversion fails (e.g., "NA"), use a high number
              onNull: 9999 // If the field is null, also use a high number
            }
          }
          //lineNoNumeric: { $toInt: "$lineNo" } // Convert lineNo to number for proper sorting
        }
      },
      // Apply the complex multi-level sort
      {
        $sort: {
          reportDate: 1,
          reportTypeSort: 1,
          lineNoNumeric: 1,
          gradeSort: 1,
          createdAt: 1
        }
      }
    ];

    // 4. Execute a second pipeline to get the total count for pagination
    const countPipeline = [...aggregationPipeline, { $count: "total" }];
    const totalDocuments = await QCAccuracyReportModel.aggregate(countPipeline);
    const total = totalDocuments.length > 0 ? totalDocuments[0].total : 0;

    // 5. Add pagination to the main pipeline and execute
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limitNum });

    const reports = await QCAccuracyReportModel.aggregate(aggregationPipeline);

    res.json({
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error fetching full report:", error);
    res.status(500).json({
      message: "Server error fetching full report",
      error: error.message
    });
  }
});

// --- FIX #1: NEW ENDPOINT TO GET A SINGLE, FULLY-DETAILED INSPECTION REPORT ---
app.get("/api/qa-accuracy/report/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid Report ID format." });
    }

    // 1. Fetch the main inspection report
    const report = await QCAccuracyReportModel.findById(reportId).lean();
    if (!report) {
      return res.status(404).json({ message: "Inspection report not found." });
    }

    // 2. Fetch related data using Promise.all for efficiency
    const [qaUser, qcUser, orderDetails] = await Promise.all([
      UserMain.findOne({ emp_id: report.qcInspector.empId }) //UserProd
        .select("face_photo eng_name")
        .lean(),
      UserMain.findOne({ emp_id: report.scannedQc.empId })
        .select("face_photo eng_name")
        .lean(),
      ymProdConnection.db
        .collection("dt_orders")
        .findOne({ Order_No: report.moNo })
    ]);

    // 3. Structure the final response object
    const responseData = {
      report, // The main report data
      qaInspectorDetails: qaUser || {
        face_photo: null,
        eng_name: report.qcInspector.engName
      },
      scannedQcDetails: qcUser || {
        face_photo: null,
        eng_name: report.scannedQc.engName
      },
      orderDetails: orderDetails
        ? {
            totalQty: orderDetails.TotalQty,
            custStyle: orderDetails.CustStyle,
            country: orderDetails.Country,
            mode: orderDetails.Mode,
            salesTeamName: orderDetails.SalesTeamName,
            orderColors: orderDetails.OrderColors
          }
        : null // Handle case where order is not found
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching detailed inspection report:", error);
    res.status(500).json({
      message: "Server error fetching report details.",
      error: error.message
    });
  }
});

// --- DASHBOARD SUMMARY ENDPOINT ---
app.get("/api/qa-accuracy/dashboard-summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo,
      grade
    } = req.query;

    const filters = [];
    if (startDate && endDate) {
      filters.push({
        reportDate: {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      });
    }
    if (qaId) filters.push({ "qcInspector.empId": qaId });
    if (qcId) filters.push({ "scannedQc.empId": qcId });
    if (reportType) filters.push({ reportType: reportType });
    if (moNo) filters.push({ moNo: moNo });
    if (grade) filters.push({ grade: grade });
    if (reportType === "Inline Finishing" && tableNo) {
      filters.push({ tableNo: tableNo });
    } else if (lineNo) {
      filters.push({ lineNo: lineNo });
    }

    const matchStage = filters.length > 0 ? { $and: filters } : {};

    const aggregation = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectPoints: { $first: "$totalDefectPoints" },
          defects: { $push: "$defects" },
          rejectedPcsSet: { $addToSet: "$defects.pcsNo" }
        }
      },
      {
        $group: {
          _id: null,
          totalInspected: { $sum: "$totalCheckedQty" },
          totalDefectPoints: { $sum: "$totalDefectPoints" },
          totalRejectedPcs: {
            $sum: {
              $size: {
                $filter: {
                  input: "$rejectedPcsSet",
                  as: "item",
                  cond: { $ne: ["$$item", null] }
                }
              }
            }
          },
          totalDefectsQty: {
            $sum: {
              $size: {
                $filter: {
                  input: "$defects",
                  as: "d",
                  cond: { $ifNull: ["$$d.defectCode", false] }
                }
              }
            }
          }
        }
      }
    ]);

    if (aggregation.length === 0) {
      return res.json({
        inspectedQty: 0,
        rejectPcs: 0,
        defectsQty: 0,
        defectRate: 0,
        defectRatio: 0,
        accuracy: 100
      });
    }

    const stats = aggregation[0];
    const defectRate =
      stats.totalInspected > 0
        ? (stats.totalDefectsQty / stats.totalInspected) * 100
        : 0;
    const defectRatio =
      stats.totalInspected > 0
        ? (stats.totalRejectedPcs / stats.totalInspected) * 100
        : 0;
    const accuracy =
      stats.totalInspected > 0
        ? (1 - stats.totalDefectPoints / stats.totalInspected) * 100
        : 100;

    res.json({
      inspectedQty: stats.totalInspected,
      rejectPcs: stats.totalRejectedPcs,
      defectsQty: stats.totalDefectsQty,
      defectRate,
      defectRatio,
      accuracy
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res
      .status(500)
      .json({ message: "Server error fetching dashboard summary" });
  }
});

// --- NEW ENDPOINT FOR DYNAMIC BAR CHART DATA ---
app.get("/api/qa-accuracy/chart-data", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo,
      grade,
      groupBy
    } = req.query;
    const validGroupByFields = ["lineNo", "moNo", "scannedQc.empId", "tableNo"];
    if (!groupBy || !validGroupByFields.includes(groupBy)) {
      return res
        .status(400)
        .json({ message: "A valid 'groupBy' parameter is required." });
    }

    const filters = [];
    if (startDate && endDate) {
      filters.push({
        reportDate: {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      });
    }
    if (qaId) filters.push({ "qcInspector.empId": qaId });
    if (qcId) filters.push({ "scannedQc.empId": qcId });
    if (reportType) filters.push({ reportType: reportType });
    if (moNo) filters.push({ moNo: moNo });
    if (grade) filters.push({ grade: grade });
    if (lineNo) filters.push({ lineNo: lineNo });
    if (tableNo) filters.push({ tableNo: tableNo });

    // This handles the case where the user might have both selected but then changes report type
    if (reportType === "Inline Finishing") {
      // if the report type is finishing, we must ignore any line filter
      // because line is not applicable.
      const lineFilterIndex = filters.findIndex((f) =>
        f.hasOwnProperty("lineNo")
      );
      if (lineFilterIndex > -1) filters.splice(lineFilterIndex, 1);
    } else if (reportType) {
      // if the report type is anything else, ignore table filter
      const tableFilterIndex = filters.findIndex((f) =>
        f.hasOwnProperty("tableNo")
      );
      if (tableFilterIndex > -1) filters.splice(tableFilterIndex, 1);
    }

    // if (groupBy !== "lineNo" && lineNo) filters.push({ lineNo: lineNo });
    // if (groupBy !== "tableNo" && tableNo) filters.push({ tableNo: tableNo });

    const matchStage = filters.length > 0 ? { $and: filters } : {};

    const results = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: `$${groupBy}`,
          totalCheckedQty: { $sum: "$totalCheckedQty" },
          totalDefectPoints: { $sum: "$totalDefectPoints" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          accuracy: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              100,
              {
                $multiply: [
                  {
                    $subtract: [
                      1,
                      { $divide: ["$totalDefectPoints", "$totalCheckedQty"] }
                    ]
                  },
                  100
                ]
              }
            ]
          }
        }
      },
      { $sort: { accuracy: 1 } }
    ]);

    const filteredResults = results.filter((r) => r.name && r.name !== "NA");
    res.json(filteredResults);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ message: "Server error fetching chart data" });
  }
});

// --- DAILY TREND ENDPOINT ---
app.get("/api/qa-accuracy/daily-trend", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo,
      grade
    } = req.query;

    const filters = [];
    if (startDate && endDate) {
      filters.push({
        reportDate: {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      });
    }
    if (qaId) filters.push({ "qcInspector.empId": qaId });
    if (qcId) filters.push({ "scannedQc.empId": qcId });
    if (reportType) filters.push({ reportType: reportType });
    if (moNo) filters.push({ moNo: moNo });
    if (grade) filters.push({ grade: grade });
    if (reportType === "Inline Finishing" && tableNo) {
      filters.push({ tableNo: tableNo });
    } else if (lineNo) {
      filters.push({ lineNo: lineNo });
    }

    const matchStage = filters.length > 0 ? { $and: filters } : {};

    const results = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$reportDate" } },
          totalCheckedQty: { $sum: "$totalCheckedQty" },
          totalDefectPoints: { $sum: "$totalDefectPoints" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          accuracy: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              100,
              {
                $multiply: [
                  {
                    $subtract: [
                      1,
                      { $divide: ["$totalDefectPoints", "$totalCheckedQty"] }
                    ]
                  },
                  100
                ]
              }
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(results);
  } catch (error) {
    console.error("Error fetching daily trend data:", error);
    res.status(500).json({ message: "Server error fetching daily trend data" });
  }
});

// --- FIX #1: ENHANCED DEFECT RATE ENDPOINT ---
app.get("/api/qa-accuracy/defect-rates", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo,
      grade
    } = req.query;

    const filters = [];
    if (startDate && endDate) {
      filters.push({
        reportDate: {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      });
    }
    if (qaId) filters.push({ "qcInspector.empId": qaId });
    if (qcId) filters.push({ "scannedQc.empId": qcId });
    if (reportType) filters.push({ reportType: reportType });
    if (moNo) filters.push({ moNo: moNo });
    if (grade) filters.push({ grade: grade });
    if (reportType === "Inline Finishing" && tableNo) {
      filters.push({ tableNo: tableNo });
    } else if (lineNo) {
      filters.push({ lineNo: lineNo });
    }

    const matchStage = filters.length > 0 ? { $and: filters } : {};

    // This pipeline will now get the total checked qty for the entire filtered set
    const totalCheckedAggregation = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalChecked: { $sum: "$totalCheckedQty" } } }
    ]);
    const totalCheckedQty =
      totalCheckedAggregation.length > 0
        ? totalCheckedAggregation[0].totalChecked
        : 0;

    // This pipeline gets the defects
    const defectAggregation = await QCAccuracyReportModel.aggregate([
      { $match: matchStage },
      { $unwind: "$defects" },
      { $replaceRoot: { newRoot: "$defects" } },
      {
        $group: {
          _id: { name: "$defectNameEng", status: "$standardStatus" },
          defectQty: { $sum: "$qty" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          status: "$_id.status",
          defectQty: "$defectQty",
          defectRate: {
            $cond: [
              { $eq: [totalCheckedQty, 0] },
              0,
              { $multiply: [{ $divide: ["$defectQty", totalCheckedQty] }, 100] }
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    res.json(defectAggregation);
  } catch (error) {
    console.error("Error fetching defect rates:", error);
    res.status(500).json({ message: "Server error fetching defect rate data" });
  }
});

// --- FINAL CORRECTED ENDPOINT FOR WEEKLY SUMMARY ---
app.get("/api/qa-accuracy/weekly-summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      qaId,
      qcId,
      reportType,
      moNo,
      lineNo,
      tableNo,
      grade,
      groupBy // This is the key for the trend table
    } = req.query;

    // Validate that groupBy is a valid field to prevent injection
    const allowedGroupByFields = [
      "reportType",
      "lineNo",
      "tableNo",
      "moNo",
      "scannedQc.empId"
    ];
    if (!groupBy || !allowedGroupByFields.includes(groupBy)) {
      return res.status(400).json({ message: "Invalid groupBy parameter." });
    }

    // Build the match stage for filtering
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.reportDate = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (qaId) matchStage["qcInspector.empId"] = qaId;
    if (qcId) matchStage["scannedQc.empId"] = qcId;
    if (reportType) matchStage.reportType = reportType;
    if (moNo) matchStage.moNo = moNo;
    if (grade) matchStage.grade = grade;
    if (reportType === "Inline Finishing" && tableNo) {
      matchStage.tableNo = tableNo;
    } else if (lineNo) {
      matchStage.lineNo = lineNo;
    }

    // --- Corrected Aggregation Pipeline ---
    const results = await QCAccuracyReportModel.aggregate([
      // Stage 1: Filter documents based on query parameters
      { $match: matchStage },

      // Stage 2: Group by BOTH week and the dynamic field. This is the main fix.
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$reportDate" },
            week: { $isoWeek: "$reportDate" },
            // Group by the dynamic field's value. Use $ifNull for robustness.
            groupName: { $ifNull: [`$${groupBy}`, "N/A"] }
          },
          totalCheckedQty: { $sum: "$totalCheckedQty" },
          totalDefectPoints: { $sum: "$totalDefectPoints" },
          // Collect all defects arrays to be processed in the next stages
          defects: { $push: "$defects" }
        }
      },

      // Stage 3 & 4: Unwind the collected defects arrays to count them
      // This is an effective way to handle nested arrays
      { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$defects", preserveNullAndEmptyArrays: true } },

      // Stage 5: Re-group to calculate defect quantities and unique rejected pieces
      {
        $group: {
          // Group back using the compound _id from the first group stage
          _id: "$_id",
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectPoints: { $first: "$totalDefectPoints" },
          totalDefectsQty: { $sum: { $ifNull: ["$defects.qty", 0] } },
          // Collect unique piece numbers that had defects
          rejectedPcsSet: { $addToSet: "$defects.pcsNo" }
        }
      },

      // Stage 6: Project the final shape for the frontend
      {
        $project: {
          _id: 0,
          // Deconstruct the _id object into the format the frontend expects
          weekId: {
            year: "$_id.year",
            week: "$_id.week"
          },
          groupName: "$_id.groupName",
          totalChecked: "$totalCheckedQty",
          totalDefectPoints: "$totalDefectPoints",
          totalDefects: "$totalDefectsQty",
          // Count the number of unique rejected pieces
          rejectedPcs: {
            $size: {
              $filter: {
                // $filter to remove potential nulls from the set
                input: "$rejectedPcsSet",
                as: "item",
                cond: { $ne: ["$$item", null] }
              }
            }
          }
        }
      }
    ]);

    res.json(results);
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    res.status(500).json({ message: "Server error fetching weekly summary" });
  }
});

/* ------------------------------
   Cutting Dashboard ENDPOINTS (FINAL & COMPLETE)
------------------------------ */

// Helper function to generate date strings in M/D/YYYY format for filtering
const generateDateStringsCuttingDashboard = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  currentDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  while (currentDate <= lastDate) {
    const M = currentDate.getMonth() + 1;
    const D = currentDate.getDate();
    const Y = currentDate.getFullYear();
    dates.push(`${M}/${D}/${Y}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// This is the logic for the buyer helper, translated into MongoDB aggregation syntax.
// It will be used inside an $addFields stage.
const derivedBuyerLogic = {
  $switch: {
    branches: [
      { case: { $regexMatch: { input: "$moNo", regex: "COM" } }, then: "MWW" },
      {
        case: { $regexMatch: { input: "$moNo", regex: "CO" } },
        then: "Costco"
      },
      {
        case: { $regexMatch: { input: "$moNo", regex: "AR" } },
        then: "Aritzia"
      },
      {
        case: { $regexMatch: { input: "$moNo", regex: "RT" } },
        then: "Reitmans"
      },
      { case: { $regexMatch: { input: "$moNo", regex: "AF" } }, then: "ANF" },
      { case: { $regexMatch: { input: "$moNo", regex: "NT" } }, then: "STORI" }
    ],
    default: "Other"
  }
};

// GET DYNAMIC/CROSS-FILTERED filter options for Cutting Dashboard
app.get("/api/cutting-dashboard/filters", async (req, res) => {
  try {
    const { startDate, endDate, buyer, moNo, tableNo, garmentType } = req.query;

    // 1. Build the initial pipeline with date filtering and derived buyer
    const pipeline = [];
    if (startDate && endDate) {
      const dateStrings = generateDateStringsCuttingDashboard(
        startDate,
        endDate
      );
      if (dateStrings.length > 0) {
        pipeline.push({ $match: { inspectionDate: { $in: dateStrings } } });
      } else {
        return res.json({
          buyers: [],
          moNos: [],
          tableNos: [],
          garmentTypes: [],
          qcIds: []
        });
      }
    }
    pipeline.push({ $addFields: { derivedBuyer: derivedBuyerLogic } });

    // 2. Build the progressive match stage for cross-filtering
    const progressiveMatch = {};
    if (buyer) progressiveMatch.derivedBuyer = buyer;
    if (moNo) progressiveMatch.moNo = moNo;
    if (tableNo) progressiveMatch.tableNo = tableNo;
    if (garmentType) progressiveMatch.garmentType = garmentType;

    if (Object.keys(progressiveMatch).length > 0) {
      pipeline.push({ $match: progressiveMatch });
    }

    // 3. Use a single facet stage to get all unique lists from the filtered dataset
    pipeline.push({
      $facet: {
        buyers: [
          { $group: { _id: "$derivedBuyer" } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } }
        ],
        moNos: [
          { $group: { _id: "$moNo" } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } }
        ],
        tableNos: [
          { $group: { _id: "$tableNo" } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } }
        ],
        garmentTypes: [
          { $group: { _id: "$garmentType" } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } }
        ],
        qcIds: [
          { $group: { _id: "$cutting_emp_id" } },
          { $sort: { _id: 1 } },
          { $project: { value: "$_id", _id: 0 } }
        ]
      }
    });

    const result = await CuttingInspection.aggregate(pipeline);

    const formatResult = (data) =>
      (data || []).map((item) => item.value).filter(Boolean);

    res.json({
      buyers: formatResult(result[0].buyers),
      moNos: formatResult(result[0].moNos),
      tableNos: formatResult(result[0].tableNos),
      garmentTypes: formatResult(result[0].garmentTypes),
      qcIds: formatResult(result[0].qcIds)
    });
  } catch (error) {
    console.error("Error fetching cutting dashboard dynamic filters:", error);
    res.status(500).json({
      message: "Failed to fetch dynamic filter options",
      error: error.message
    });
  }
});

// GET Cutting Dashboard Data
app.get("/api/cutting-dashboard-data", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      buyer,
      moNo,
      tableNo,
      garmentType,
      color,
      qcId,
      topN = 5,
      sortOrder = "top"
    } = req.query;

    // This pipeline will be prepended to all data-fetching aggregations
    const preMatchPipeline = [];

    // Stage 1: Add the derivedBuyer field first
    preMatchPipeline.push({ $addFields: { derivedBuyer: derivedBuyerLogic } });

    // Stage 2: Build the match object using the derived buyer
    const match = {};
    if (startDate && endDate) {
      const dateStrings = generateDateStringsCuttingDashboard(
        startDate,
        endDate
      );
      if (dateStrings.length > 0) {
        match.inspectionDate = { $in: dateStrings };
      } else {
        return res.json({ kpis: {}, charts: {} });
      }
    }
    if (buyer) match.derivedBuyer = buyer; // Filter on the derived buyer
    if (moNo) match.moNo = moNo;
    if (tableNo) match.tableNo = tableNo;
    if (garmentType) match.garmentType = garmentType;
    if (color) match.color = color;
    if (qcId) match.cutting_emp_id = qcId;

    //preMatchPipeline.push({ $match: match });
    if (Object.keys(match).length > 0) {
      preMatchPipeline.push({ $match: match });
    }

    // Pipeline to count the total number of reports (documents) found
    const reportCountPipeline = [
      ...preMatchPipeline,
      { $count: "totalReports" }
    ];

    // The rest of the pipelines now start with the correctly filtered data
    const kpiBasePipeline = [
      ...preMatchPipeline, // Prepend the filtering logic
      {
        $group: {
          _id: null,
          totalInspectionQty: { $sum: { $ifNull: ["$totalInspectionQty", 0] } },
          totalBundleQty: { $sum: { $ifNull: ["$totalBundleQty", 0] } },
          bundleQtyCheck: { $sum: { $ifNull: ["$bundleQtyCheck", 0] } }
        }
      }
    ];

    const unwindPipeline = [
      ...preMatchPipeline, // Prepend the filtering logic
      { $unwind: "$inspectionData" },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalPcs: {
                  $sum: { $ifNull: ["$inspectionData.totalPcsSize", 0] }
                },
                totalPass: {
                  $sum: { $ifNull: ["$inspectionData.passSize.total", 0] }
                },
                totalReject: {
                  $sum: { $ifNull: ["$inspectionData.rejectSize.total", 0] }
                },
                rejectMeasurements: {
                  $sum: {
                    $ifNull: ["$inspectionData.rejectMeasurementSize.total", 0]
                  }
                },
                rejectDefects: {
                  $sum: {
                    $ifNull: ["$inspectionData.rejectGarmentSize.total", 0]
                  }
                },
                inspectedSizes: { $addToSet: "$inspectionData.inspectedSize" }
              }
            },
            {
              $project: {
                _id: 0,
                totalPcs: 1,
                totalPass: 1,
                totalReject: 1,
                rejectMeasurements: 1,
                rejectDefects: 1,
                passRate: {
                  $cond: [
                    { $gt: ["$totalPcs", 0] },
                    {
                      $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                    },
                    0
                  ]
                },
                totalInspectedSizes: { $size: "$inspectedSizes" }
              }
            }
          ],
          passRateByMo: [
            {
              $group: {
                _id: "$moNo",
                totalPcs: { $sum: "$inspectionData.totalPcsSize" },
                totalPass: { $sum: "$inspectionData.passSize.total" },
                totalReject: { $sum: "$inspectionData.rejectSize.total" }
              }
            },
            {
              $project: {
                name: "$_id",
                _id: 0,
                totalPcs: 1, // Pass through the counts
                totalPass: 1,
                totalReject: 1,
                passRate: {
                  $cond: [
                    { $gt: ["$totalPcs", 0] },
                    {
                      $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                    },
                    0
                  ]
                }
              }
            },
            { $sort: { passRate: sortOrder === "bottom" ? 1 : -1 } },
            { $limit: parseInt(topN, 10) }
          ],
          passRateByDate: [
            {
              $group: {
                _id: "$inspectionDate",
                totalPcs: { $sum: "$inspectionData.totalPcsSize" },
                totalPass: { $sum: "$inspectionData.passSize.total" }
              }
            },
            { $addFields: { dateParts: { $split: ["$_id", "/"] } } },
            {
              $addFields: {
                month: { $toInt: { $arrayElemAt: ["$dateParts", 0] } },
                day: { $toInt: { $arrayElemAt: ["$dateParts", 1] } },
                year: { $toInt: { $arrayElemAt: ["$dateParts", 2] } }
              }
            },
            { $sort: { year: 1, month: 1, day: 1 } },
            {
              $project: {
                name: "$_id",
                _id: 0,
                passRate: {
                  $cond: [
                    { $gt: ["$totalPcs", 0] },
                    {
                      $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                    },
                    0
                  ]
                }
              }
            },
            { $limit: 30 }
          ],
          passRateByGarmentType: [
            {
              $group: {
                _id: "$garmentType",
                totalPcs: { $sum: "$inspectionData.totalPcsSize" },
                totalPass: { $sum: "$inspectionData.passSize.total" }
              }
            },
            {
              $project: {
                name: "$_id",
                _id: 0,
                passRate: {
                  $cond: [
                    { $gt: ["$totalPcs", 0] },
                    {
                      $multiply: [{ $divide: ["$totalPass", "$totalPcs"] }, 100]
                    },
                    0
                  ]
                }
              }
            },
            { $sort: { passRate: -1 } }
          ]
        }
      }
    ];

    const [kpiBaseResult, unwindResult, reportCountResult] = await Promise.all([
      CuttingInspection.aggregate(kpiBasePipeline),
      CuttingInspection.aggregate(unwindPipeline),
      CuttingInspection.aggregate(reportCountPipeline)
    ]);

    const defaultKpis = {
      totalInspectedReports: 0,
      totalInspectionQty: 0,
      totalPcs: 0,
      totalPass: 0,
      totalReject: 0,
      rejectMeasurements: 0,
      rejectDefects: 0,
      passRate: 0,
      totalBundleQty: 0,
      bundleQtyCheck: 0,
      totalInspectedSizes: 0
    };

    const kpis = {
      ...defaultKpis,
      ...(kpiBaseResult[0] || {}),
      ...(unwindResult[0]?.kpis[0] || {}),
      totalInspectedReports: reportCountResult[0]?.totalReports || 0 // <-- Add the count result
    };
    delete kpis._id;

    const formattedResult = {
      kpis,
      charts: {
        passRateByMo: unwindResult[0]?.passRateByMo || [],
        passRateByDate: unwindResult[0]?.passRateByDate || [],
        passRateByGarmentType: unwindResult[0]?.passRateByGarmentType || []
      }
    };

    res.json(formattedResult);
  } catch (error) {
    console.error("Error fetching cutting dashboard data:", error);
    res.status(500).json({
      message: "Failed to fetch cutting dashboard data",
      error: error.message
    });
  }
});

/* ------------------------------
   End Points - Buyer Spec Templates
------------------------------ */

// New endpoint to save a buyer-specific measurement spec template
app.post("/api/buyer-spec-templates", async (req, res) => {
  try {
    const { moNo, buyer, specData } = req.body;

    // Basic validation
    if (!moNo || !buyer || !specData || !Array.isArray(specData)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid data provided." });
    }

    // Use findOneAndUpdate with upsert to either create a new template or update an existing one for the same MO No.
    const result = await BuyerSpecTemplate.findOneAndUpdate(
      { moNo: moNo }, // find a document with this filter
      { moNo, buyer, specData, updatedAt: new Date() }, // document to insert when `upsert` is true or to update
      { new: true, upsert: true, runValidators: true } // options
    );

    res.status(201).json({
      message: "Buyer spec template saved successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving buyer spec template:", error);
    res.status(500).json({
      error: "Failed to save buyer spec template.",
      details: error.message
    });
  }
});

// Endpoint to get all MO Nos from the buyer spec templates for the edit dropdown
app.get("/api/buyer-spec-templates/mo-options", async (req, res) => {
  try {
    const monos = await BuyerSpecTemplate.find({}, { moNo: 1, _id: 0 }).sort({
      moNo: 1
    });
    res.json(monos.map((m) => m.moNo));
  } catch (error) {
    console.error("Error fetching MO options for templates:", error);
    res.status(500).json({ error: "Failed to fetch MO options" });
  }
});

// Endpoint to fetch data for both tables on the Edit page
app.get("/api/edit-specs-data/:moNo", async (req, res) => {
  const { moNo } = req.params;
  if (!moNo) {
    return res.status(400).json({ error: "MO Number is required." });
  }

  try {
    // 1. Fetch from BuyerSpecTemplate collection
    const templateData = await BuyerSpecTemplate.findOne({ moNo: moNo }).lean();

    // 2. Fetch AfterWashSpecs from dt_orders collection
    const orderData = await ymProdConnection.db
      .collection("dt_orders")
      .findOne(
        { Order_No: moNo },
        { projection: { AfterWashSpecs: 1, _id: 0 } }
      );

    // Check if AfterWashSpecs exist and are valid
    const patternData =
      orderData &&
      Array.isArray(orderData.AfterWashSpecs) &&
      orderData.AfterWashSpecs.length > 0
        ? orderData
        : null;

    if (!templateData && !patternData) {
      return res.status(404).json({
        error: `No spec data found for MO No: ${moNo} in any source.`
      });
    }

    res.json({ templateData, patternData });
  } catch (error) {
    console.error(`Error fetching edit spec data for MO ${moNo}:`, error);
    res
      .status(500)
      .json({ error: "Failed to fetch data.", details: error.message });
  }
});

// Endpoint to UPDATE an existing buyer spec template
app.put("/api/buyer-spec-templates/:moNo", async (req, res) => {
  const { moNo } = req.params;
  const { specData } = req.body;

  if (!specData) {
    return res.status(400).json({ error: "specData is required for update." });
  }

  try {
    const updatedTemplate = await BuyerSpecTemplate.findOneAndUpdate(
      { moNo: moNo },
      { $set: { specData: specData } },
      { new: true, runValidators: true } // new: true returns the modified document
    );

    if (!updatedTemplate) {
      return res
        .status(404)
        .json({ error: "Template not found for the given MO No." });
    }

    res.status(200).json({
      message: "Spec template updated successfully.",
      data: updatedTemplate
    });
  } catch (error) {
    console.error("Error updating spec template:", error);
    res.status(500).json({
      error: "Failed to update spec template.",
      details: error.message
    });
  }
});

/* -------------------------------------------
   End Points - ANF Digital Measurement
------------------------------------------- */

// Endpoint to get all MO Nos from the buyer spec templates for the search dropdown
app.get("/api/anf-measurement/mo-options", async (req, res) => {
  try {
    // only need the moNo field, and we sort it for a better user experience.
    const monos = await BuyerSpecTemplate.find({}, { moNo: 1, _id: 0 }).sort({
      moNo: 1
    });
    // Return an array of strings
    res.json(monos.map((m) => m.moNo));
  } catch (error) {
    console.error("Error fetching MO options for ANF Measurement:", error);
    res.status(500).json({ error: "Failed to fetch MO options" });
  }
});

// Endpoint to get details from the BuyerSpecTemplate (buyer, available sizes)
app.get("/api/anf-measurement/mo-details/:moNo", async (req, res) => {
  try {
    const { moNo } = req.params;
    const template = await BuyerSpecTemplate.findOne({ moNo: moNo });

    if (!template) {
      return res
        .status(404)
        .json({ error: "Spec Template not found for this MO No." });
    }

    // Extract buyer and all available sizes from the specData array
    const buyer = template.buyer;
    const sizes = template.specData.map((data) => data.size);

    res.json({ buyer, sizes });
  } catch (error) {
    console.error(
      `Error fetching template details for MO No ${req.params.moNo}:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch template details" });
  }
});

// Endpoint to get comprehensive order details (colors, quantities) from the dt_orders collection
app.get("/api/anf-measurement/order-details/:moNo", async (req, res) => {
  try {
    const { moNo } = req.params;
    // Querying the dt_orders collection using the ymEcoConnection
    
    const order = await ymProdConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo });

    if (!order) {
      return res
        .status(404)
        .json({ error: "Order not found in dt_orders collection." });
    }

    // Extract unique colors for the dropdown
    const colorOptions = [
      ...new Set(order.OrderColors.map((c) => c.Color.trim()))
    ];

    // Create a map of color to its size quantities
    const colorQtyBySize = {};
    order.OrderColors.forEach((colorObj) => {
      const color = colorObj.Color.trim();
      colorQtyBySize[color] = {};
      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
        const quantity = sizeEntry[sizeName];
        if (quantity > 0) {
          colorQtyBySize[color][sizeName] = quantity;
        }
      });
    });

    res.json({
      custStyle: order.CustStyle || "N/A",
      mode: order.Mode || "N/A",
      country: order.Country || "N/A",
      origin: order.Origin || "N/A",
      totalOrderQty: order.TotalQty,
      colorOptions: colorOptions.map((c) => ({ value: c, label: c })),
      colorQtyBySize
    });
  } catch (error) {
    console.error(
      `Error fetching order details for MO No ${req.params.moNo}:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch order details." });
  }
});

// Endpoint to get the detailed spec table data for a selected MO No and Size
app.get("/api/anf-measurement/spec-table", async (req, res) => {
  try {
    const { moNo, size } = req.query;
    if (!moNo || !size) {
      return res.status(400).json({ error: "MO No and Size are required." });
    }

    const template = await BuyerSpecTemplate.findOne({ moNo: moNo });
    if (!template) {
      return res
        .status(404)
        .json({ error: "Template not found for this MO No." });
    }

    const sizeData = template.specData.find((sd) => sd.size === size);
    if (!sizeData) {
      return res
        .status(404)
        .json({ error: `No spec data found for size ${size} in this MO.` });
    }

    const sortedSpecDetails = sizeData.specDetails.sort(
      (a, b) => a.orderNo - b.orderNo
    );
    res.json(sortedSpecDetails);
  } catch (error) {
    console.error("Error fetching spec table data:", error);
    res.status(500).json({ error: "Failed to fetch spec table data." });
  }
});

// Endpoint to save or update an ANF Measurement Report
app.post("/api/anf-measurement/reports", async (req, res) => {
  try {
    const {
      inspectionDate,
      qcID,
      moNo,
      buyer,
      color,
      orderDetails,
      measurementDetails
      // We will ignore overallMeasurementSummary from the client and always recalculate it
    } = req.body;

    // Validation
    if (!inspectionDate || !qcID || !moNo || !color || !measurementDetails) {
      return res
        .status(400)
        .json({ error: "Missing required fields for the report." });
    }

    // --- FIX: Create a timezone-agnostic UTC date ---
    // This creates a date object for midnight UTC on the given day, regardless of server timezone.
    const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);

    // The unique key for finding the document
    const filter = {
      //inspectionDate: new Date(new Date(inspectionDate).setHours(0, 0, 0, 0)),
      inspectionDate: reportDate, // Use the standardized UTC date
      qcID,
      moNo,
      color: { $all: color.sort(), $size: color.length } // Sort colors for consistent matching
    };

    // Find the existing report
    let report = await ANFMeasurementReport.findOne(filter);

    const newSizeData = measurementDetails[0]; // We assume one size is saved at a time

    if (report) {
      // --- If Report Exists, Update It ---
      const existingSizeIndex = report.measurementDetails.findIndex(
        (detail) => detail.size === newSizeData.size
      );

      if (existingSizeIndex > -1) {
        // This size's data already exists, so we replace it to prevent duplicates
        report.measurementDetails[existingSizeIndex] = newSizeData;
      } else {
        // This is a new size for this report, so we add it
        report.measurementDetails.push(newSizeData);
      }
    } else {
      // --- If Report Does Not Exist, Create It ---
      // We're creating it in memory first, then we'll calculate the summary before saving
      report = new ANFMeasurementReport({
        //inspectionDate: filter.inspectionDate,
        inspectionDate: reportDate, // Use the standardized UTC date
        qcID,
        moNo,
        buyer,
        color: color.sort(),
        orderDetails,
        measurementDetails // This will contain the first (and only) size's data
      });
    }

    // --- Recalculate the overall summary AFTER updating/creating the report in memory ---
    const newOverallSummary = {
      garmentDetailsCheckedQty: 0,
      garmentDetailsOKGarment: 0,
      garmentDetailsRejected: 0,
      measurementDetailsPoints: 0,
      measurementDetailsPass: 0,
      measurementDetailsTotalIssues: 0,
      measurementDetailsTolPositive: 0,
      measurementDetailsTolNegative: 0
    };

    report.measurementDetails.forEach((detail) => {
      const summary = detail.sizeSummary;
      if (summary) {
        for (const key in newOverallSummary) {
          newOverallSummary[key] += summary[key] || 0;
        }
      }
    });
    // Assign the newly calculated summary to the report
    report.overallMeasurementSummary = newOverallSummary;

    // Save the final document (either the updated one or the brand new one)
    const savedReport = await report.save();

    res.status(201).json({
      message: "Measurement report saved successfully.",
      data: savedReport
    });
  } catch (error) {
    console.error("Error saving ANF Measurement Report:", error);
    // Check for unique key violation (error code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A report with these exact details already exists.",
        details: error.message
      });
    }
    res
      .status(500)
      .json({ error: "Failed to save report.", details: error.message });
  }
});

// --- MODIFIED: Endpoint to update the status of a specific size ---
app.patch("/api/anf-measurement/reports/status", async (req, res) => {
  try {
    const { qcID, moNo, color, size, status, inspectionDate } = req.body;

    // --- Validation (no change) ---
    if (!inspectionDate || !qcID || !moNo || !color || !size || !status) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    if (!["In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const sortedColors = [...color].sort();

    // --- LOGIC FOR THE NEW PERSISTENT STATUS COLLECTION ---
    if (status === "Completed") {
      // If we are finishing the size, create/update the persistent status record.
      // `findOneAndUpdate` with `upsert` is perfect here.
      await SizeCompletionStatus.findOneAndUpdate(
        { qcID, moNo, color: sortedColors, size },
        { status: "Completed" },
        { upsert: true, new: true, runValidators: true }
      );
    } else if (status === "In Progress") {
      // If we are continuing (unlocking), delete the persistent status record.
      await SizeCompletionStatus.deleteOne({
        qcID,
        moNo,
        color: sortedColors,
        size
      });
    }

    // --- KEEP THE LOGIC TO UPDATE THE CURRENT DAY'S REPORT (if it exists) ---
    // This is still useful for the specific report of that day.
    const reportDate = new Date(`${inspectionDate}T00:00:00.000Z`);
    const reportFilter = {
      inspectionDate: reportDate,
      qcID,
      moNo,
      color: { $all: sortedColors, $size: sortedColors.length }
    };

    await ANFMeasurementReport.updateOne(
      { ...reportFilter, "measurementDetails.size": size },
      { $set: { "measurementDetails.$.status": status } }
    );
    // Note: We don't care if this update fails (e.g., no report for today yet).
    // The persistent status is the most important part.

    res
      .status(200)
      .json({ message: `Size status successfully updated to '${status}'.` });
  } catch (error) {
    console.error("Error updating size status:", error);
    if (error.code === 11000) {
      // Catch potential race condition on unique index
      return res
        .status(409)
        .json({ error: "This size status is already being updated." });
    }
    res
      .status(500)
      .json({ error: "Failed to update size status.", details: error.message });
  }
});

// --- MODIFIED: Endpoint to get existing measurement data and PERSISTENT status ---
app.get("/api/anf-measurement/existing-data", async (req, res) => {
  try {
    const { date, qcId, moNo, color, size } = req.query;

    if (!date || !qcId || !moNo || !color || !size) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters." });
    }

    const colorArray = (Array.isArray(color) ? color : color.split(",")).sort();

    // --- QUERY 1: Check for a PERSISTENT "Completed" status ---
    const persistentStatusDoc = await SizeCompletionStatus.findOne({
      qcID: qcId,
      moNo: moNo,
      color: colorArray,
      size: size
    });

    // --- QUERY 2: Get the measurement data FOR THE SPECIFIC DATE provided ---
    let dailyMeasurements = [];
    const reportDate = new Date(`${date}T00:00:00.000Z`);
    const reportFilter = {
      inspectionDate: reportDate,
      qcID: qcId,
      moNo: moNo,
      color: { $all: colorArray, $size: colorArray.length }
    };
    const report = await ANFMeasurementReport.findOne(reportFilter);

    if (report) {
      const sizeData = report.measurementDetails.find(
        (detail) => detail.size === size
      );
      if (sizeData && sizeData.sizeMeasurementData) {
        dailyMeasurements = sizeData.sizeMeasurementData;
      }
    }

    // --- FINAL LOGIC: Determine the status to send to the frontend ---
    // If a persistent "Completed" record exists, the status is ALWAYS 'Completed'.
    // Otherwise, it's 'In Progress'.
    const finalStatus = persistentStatusDoc ? "Completed" : "In Progress";

    // Return the combined result
    res.json({
      measurements: dailyMeasurements,
      status: finalStatus
    });
  } catch (error) {
    console.error("Error fetching existing measurement data:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch existing measurement data." });
  }
});

/* -------------------------------------------
   End Points - ANF Measurement Results
------------------------------------------- */

// Endpoint to get all unique filter options for the results page
app.get("/api/anf-measurement/results/filters", async (req, res) => {
  try {
    const [moNos, colors, qcIDs, buyers] = await Promise.all([
      ANFMeasurementReport.distinct("moNo"),
      ANFMeasurementReport.distinct("color"),
      ANFMeasurementReport.distinct("qcID"),
      ANFMeasurementReport.distinct("buyer")
    ]);

    res.json({
      moOptions: moNos.sort(),
      colorOptions: [...new Set(colors)].sort(), // Ensure unique colors and sort
      qcOptions: qcIDs.sort(),
      buyerOptions: buyers.sort()
    });
  } catch (error) {
    console.error("Error fetching filter options for results:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// Main endpoint to get aggregated summary data
app.get("/api/anf-measurement/results/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // --- Main Aggregation Pipeline ---
    const aggregatedReports = await ANFMeasurementReport.aggregate([
      // 1. Filter by date range first for performance
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end }
        }
      },
      // 2. Deconstruct the measurementDetails array to process each size
      { $unwind: "$measurementDetails" },

      // 3. Group by the unique key: MO, QC, and Size
      {
        $group: {
          _id: {
            moNo: "$moNo",
            qcID: "$qcID",
            size: "$measurementDetails.size"
          },
          // Sum up the summary stats across all reports for this group
          garmentDetailsCheckedQty: {
            $sum: "$measurementDetails.sizeSummary.garmentDetailsCheckedQty"
          },
          garmentDetailsOKGarment: {
            $sum: "$measurementDetails.sizeSummary.garmentDetailsOKGarment"
          },
          garmentDetailsRejected: {
            $sum: "$measurementDetails.sizeSummary.garmentDetailsRejected"
          },
          measurementDetailsPoints: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsPoints"
          },
          measurementDetailsPass: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsPass"
          },
          measurementDetailsTotalIssues: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsTotalIssues"
          },
          measurementDetailsTolPositive: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsTolPositive"
          },
          measurementDetailsTolNegative: {
            $sum: "$measurementDetails.sizeSummary.measurementDetailsTolNegative"
          },

          // Get the first instance of data that doesn't change
          buyer: { $first: "$buyer" },
          colors: { $first: "$color" }, // We'll get all colors from the first report
          orderDetails: { $first: "$orderDetails" }
        }
      },
      // 4. Reshape the data for the frontend
      {
        $project: {
          _id: 0, // Exclude the default _id
          moNo: "$_id.moNo",
          qcID: "$_id.qcID",
          size: "$_id.size",
          buyer: 1,
          colors: 1,
          orderDetails: 1,
          summary: {
            checkedQty: "$garmentDetailsCheckedQty",
            okGarment: "$garmentDetailsOKGarment",
            rejectedGarment: "$garmentDetailsRejected",
            totalPoints: "$measurementDetailsPoints",
            passPoints: "$measurementDetailsPass",
            issuePoints: "$measurementDetailsTotalIssues",
            tolPlus: "$measurementDetailsTolPositive",
            tolNeg: "$measurementDetailsTolNegative"
          }
        }
      },
      // 5. Sort the final results
      {
        $sort: { moNo: 1, qcID: 1, size: 1 }
      }
    ]);

    // --- Post-Aggregation: Check Status and Calculate Order Quantities ---
    const finalResults = await Promise.all(
      aggregatedReports.map(async (report) => {
        // Check persistent status
        const isCompleted = await SizeCompletionStatus.findOne({
          qcID: report.qcID,
          moNo: report.moNo,
          color: { $all: [...report.colors].sort() }, // ensure colors are sorted for matching
          size: report.size
        }).lean();

        // Calculate order quantity for the specific colors in the report
        let orderQtyForColor = 0;
        if (report.orderDetails && report.orderDetails.orderQty_bySize) {
          report.colors.forEach((color) => {
            const sizeData = report.orderDetails.orderQty_bySize[color];
            if (sizeData && sizeData[report.size]) {
              orderQtyForColor += sizeData[report.size];
            }
          });
        }

        return {
          ...report,
          status: isCompleted ? "Completed" : "In Progress",
          orderQty_style: report.orderDetails?.orderQty_style || 0,
          orderQty_color: orderQtyForColor
        };
      })
    );

    res.json(finalResults);
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch summary data.", details: error.message });
  }
});

// --- Endpoint for the Full Report Drill-Down ---
app.get("/api/anf-measurement/results/full-report-detail", async (req, res) => {
  try {
    const { startDate, endDate, moNo, qcID, size, colors } = req.query;

    if (!startDate || !endDate || !moNo || !qcID || !size || !colors) {
      return res
        .status(400)
        .json({ error: "All query parameters are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);
    const colorArray = colors.split(",").sort();

    // The aggregation pipeline to get all details for the selected group
    const result = await ANFMeasurementReport.aggregate([
      // 1. Match documents
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end },
          moNo: moNo,
          qcID: qcID,
          color: { $all: colorArray, $size: colorArray.length }
        }
      },
      // 2. Unwind measurementDetails
      { $unwind: "$measurementDetails" },
      // 3. Match the specific size
      { $match: { "measurementDetails.size": size } },
      // 4. Unwind garment data
      { $unwind: "$measurementDetails.sizeMeasurementData" },
      // 5. Unwind the measurements
      { $unwind: "$measurementDetails.sizeMeasurementData.measurements" },

      // 6. Group by measurement point (orderNo) to collect all its fractions
      {
        $group: {
          _id: "$measurementDetails.sizeMeasurementData.measurements.orderNo",
          fractions: {
            $push:
              "$measurementDetails.sizeMeasurementData.measurements.fractionValue"
          },
          // Pass along the other data we need
          buyerSpecData: { $first: "$measurementDetails.buyerSpecData" },
          inspectedDates: { $addToSet: "$inspectionDate" }
        }
      },

      // 7. Group again to consolidate results into a single document
      {
        $group: {
          _id: null,
          buyerSpecData: { $first: "$buyerSpecData" },
          inspectedDates: { $addToSet: "$inspectedDates" }, // this will be an array of arrays
          measurements: {
            $push: {
              orderNo: "$_id",
              fractions: "$fractions"
            }
          }
        }
      },

      // 8. Project to reshape the final output
      {
        $project: {
          _id: 0,
          buyerSpecData: 1,
          // Flatten and sort the dates array
          inspectedDates: {
            $sortArray: {
              input: {
                $reduce: {
                  input: "$inspectedDates",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this"] }
                }
              },
              sortBy: 1
            }
          },
          // Create the final tally object
          measurementsTally: {
            $arrayToObject: {
              $map: {
                input: "$measurements",
                as: "m",
                in: {
                  k: { $toString: "$$m.orderNo" },
                  v: {
                    $arrayToObject: {
                      $map: {
                        input: { $setUnion: ["$$m.fractions"] }, // Get unique fractions
                        as: "frac",
                        in: {
                          k: "$$frac",
                          v: {
                            $size: {
                              $filter: {
                                input: "$$m.fractions",
                                as: "f",
                                cond: { $eq: ["$$f", "$$frac"] }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ error: "No detailed data found for this selection." });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching full report details:", error);
    res.status(500).json({
      error: "Failed to fetch full report details.",
      details: error.message
    });
  }
});

/* -------------------------------------------
   End Points - ANF QC Daily Report
------------------------------------------- */

// Endpoint to get all daily reports (each document is a report)
app.get("/api/anf-measurement/qc-daily-reports", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const reports = await ANFMeasurementReport.find({
      inspectionDate: { $gte: start, $lte: end }
    }).sort({ inspectionDate: -1, qcID: 1 }); // Sort by most recent first

    res.json(reports);
  } catch (error) {
    console.error("Error fetching QC daily reports:", error);
    res.status(500).json({ error: "Failed to fetch QC daily reports" });
  }
});

// Endpoint to get DYNAMIC filter options based on a date range
app.get("/api/anf-measurement/qc-daily-reports/filters", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Find all reports within the date range
    const reports = await ANFMeasurementReport.find(
      { inspectionDate: { $gte: start, $lte: end } },
      { buyer: 1, moNo: 1, color: 1, qcID: 1, _id: 0 } // Project only necessary fields
    ).lean();

    // Process the data to get unique values and relationships
    const buyers = new Set();
    const moNos = new Set();
    const colors = new Set();
    const qcIDs = new Set();
    const moToColorsMap = {};

    reports.forEach((report) => {
      buyers.add(report.buyer);
      moNos.add(report.moNo);
      qcIDs.add(report.qcID);

      if (!moToColorsMap[report.moNo]) {
        moToColorsMap[report.moNo] = new Set();
      }
      report.color.forEach((c) => {
        colors.add(c);
        moToColorsMap[report.moNo].add(c);
      });
    });

    // Convert the map's sets to arrays
    for (const mo in moToColorsMap) {
      moToColorsMap[mo] = Array.from(moToColorsMap[mo]).sort();
    }

    res.json({
      buyerOptions: Array.from(buyers).sort(),
      moOptions: Array.from(moNos).sort(),
      colorOptions: Array.from(colors).sort(),
      qcOptions: Array.from(qcIDs).sort(),
      moToColorsMap: moToColorsMap
    });
  } catch (error) {
    console.error("Error fetching dynamic filter options:", error);
    res.status(500).json({ error: "Failed to fetch dynamic filter options" });
  }
});

// --- NEW Endpoint for the QC Daily Full Report Page ---
app.get(
  "/api/anf-measurement/qc-daily-report/detail/:pageId",
  async (req, res) => {
    try {
      const { pageId } = req.params;
      if (!pageId) {
        return res.status(400).json({ error: "Page ID is required." });
      }

      // Deconstruct the pageId: e.g., "2023-10-27-QC001-MO12345"
      const parts = pageId.split("-");
      if (parts.length < 3) {
        return res.status(400).json({ error: "Invalid Page ID format." });
      }

      const inspectionDateStr = parts.slice(0, 3).join("-"); // Reassembles the date string
      const qcID = parts[3];
      const moNo = parts.slice(4).join("-"); // Join the rest in case MO No has hyphens

      // Find the specific report document
      const report = await ANFMeasurementReport.findOne({
        // Use a regex to match the date part of the ISODate
        inspectionDate: {
          $gte: new Date(inspectionDateStr),
          $lt: new Date(
            new Date(inspectionDateStr).setDate(
              new Date(inspectionDateStr).getDate() + 1
            )
          )
        },
        qcID: qcID,
        moNo: moNo
      }).lean(); // .lean() for a plain JS object, faster for read-only ops

      if (!report) {
        return res
          .status(404)
          .json({ error: "Report not found for the specified criteria." });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching full QC daily report:", error);
      res.status(500).json({
        error: "Failed to fetch full report.",
        details: error.message
      });
    }
  }
);

/* -------------------------------------------
   End Points - ANF Style View Report
------------------------------------------- */

app.get("/api/anf-measurement/style-view-summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end date are required." });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const styleSummary = await ANFMeasurementReport.aggregate([
      // 1. Filter documents by the date range
      {
        $match: {
          inspectionDate: { $gte: start, $lte: end }
        }
      },
      // 2. Group by moNo to aggregate all data for a style
      {
        $group: {
          _id: "$moNo", // Group by the Manufacturing Order number
          // Sum up all the overall summaries from each report for this MO
          garmentDetailsCheckedQty: {
            $sum: "$overallMeasurementSummary.garmentDetailsCheckedQty"
          },
          garmentDetailsOKGarment: {
            $sum: "$overallMeasurementSummary.garmentDetailsOKGarment"
          },
          garmentDetailsRejected: {
            $sum: "$overallMeasurementSummary.garmentDetailsRejected"
          },
          measurementDetailsPoints: {
            $sum: "$overallMeasurementSummary.measurementDetailsPoints"
          },
          measurementDetailsPass: {
            $sum: "$overallMeasurementSummary.measurementDetailsPass"
          },
          measurementDetailsTotalIssues: {
            $sum: "$overallMeasurementSummary.measurementDetailsTotalIssues"
          },
          measurementDetailsTolPositive: {
            $sum: "$overallMeasurementSummary.measurementDetailsTolPositive"
          },
          measurementDetailsTolNegative: {
            $sum: "$overallMeasurementSummary.measurementDetailsTolNegative"
          },

          // Collect all colors from all reports into a single array
          allColors: { $push: "$color" },

          // Get the first instance of data that is the same for the whole MO
          buyer: { $first: "$buyer" },
          orderQty_style: { $first: "$orderDetails.orderQty_style" }
        }
      },
      // 3. Reshape the data for the frontend
      {
        $project: {
          _id: 0,
          moNo: "$_id",
          buyer: 1,
          orderQty_style: 1,
          // Flatten the array of color arrays, get unique values, and then get the count
          totalColors: {
            $size: {
              $reduce: {
                input: "$allColors",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }
              }
            }
          },
          // Create the summary object
          summary: {
            checkedQty: "$garmentDetailsCheckedQty",
            okGarment: "$garmentDetailsOKGarment",
            rejectedGarment: "$garmentDetailsRejected",
            totalPoints: "$measurementDetailsPoints",
            passPoints: "$measurementDetailsPass",
            issuePoints: "$measurementDetailsTotalIssues",
            tolPlus: "$measurementDetailsTolPositive",
            tolNeg: "$measurementDetailsTolNegative"
          }
        }
      },
      // 4. Sort the final results
      {
        $sort: { moNo: 1 }
      }
    ]);

    res.json(styleSummary);
  } catch (error) {
    console.error("Error fetching style view summary:", error);
    res.status(500).json({
      error: "Failed to fetch style view summary",
      details: error.message
    });
  }
});

// --- NEW Endpoint for the Style View Full Report Page ---
app.get(
  "/api/anf-measurement/style-view-full-report/:moNo",
  async (req, res) => {
    try {
      const { moNo } = req.params;
      if (!moNo) {
        return res.status(400).json({ error: "MO Number is required." });
      }

      // --- Part 1: Fetch Order Details from dt_orders (No Change) ---
      const orderDetails = await ymProdConnection.db
        .collection("dt_orders")
        .findOne({ Order_No: moNo });

      if (!orderDetails) {
        return res
          .status(404)
          .json({ error: "Order Details not found for this MO Number." });
      }

      // --- Part 2: Use MongoDB Aggregation for all processing ---
      const aggregatedData = await ANFMeasurementReport.aggregate([
        // Stage 1: Match all reports for the given MO
        { $match: { moNo: moNo } },

        // Stage 2: Deconstruct the arrays to work with individual documents
        { $unwind: "$color" },
        { $unwind: "$measurementDetails" },

        // Stage 3: Group data by QC, Color, and Size to get all summaries
        {
          $group: {
            _id: {
              qcID: "$qcID",
              color: "$color",
              size: "$measurementDetails.size"
            },
            // Sum up the size summaries
            garmentDetailsCheckedQty: {
              $sum: "$measurementDetails.sizeSummary.garmentDetailsCheckedQty"
            },
            garmentDetailsOKGarment: {
              $sum: "$measurementDetails.sizeSummary.garmentDetailsOKGarment"
            },
            garmentDetailsRejected: {
              $sum: "$measurementDetails.sizeSummary.garmentDetailsRejected"
            },
            measurementDetailsPoints: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsPoints"
            },
            measurementDetailsPass: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsPass"
            },
            measurementDetailsTotalIssues: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsTotalIssues"
            },
            measurementDetailsTolPositive: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsTolPositive"
            },
            measurementDetailsTolNegative: {
              $sum: "$measurementDetails.sizeSummary.measurementDetailsTolNegative"
            },

            // Keep the first buyerSpecData we find for tally later
            buyerSpecData: { $first: "$measurementDetails.buyerSpecData" },
            // Collect all garment measurements for tally
            sizeMeasurementData: {
              $push: "$measurementDetails.sizeMeasurementData"
            }
          }
        },

        // Stage 4: Further group to assemble the final structure
        {
          $group: {
            _id: null,
            // A. Inspector Data: Group by QC ID
            inspectorData: {
              $push: {
                qcID: "$_id.qcID",
                summary: {
                  garmentDetailsCheckedQty: "$garmentDetailsCheckedQty",
                  garmentDetailsOKGarment: "$garmentDetailsOKGarment",
                  garmentDetailsRejected: "$garmentDetailsRejected",
                  measurementDetailsPoints: "$measurementDetailsPoints",
                  measurementDetailsPass: "$measurementDetailsPass",
                  measurementDetailsTotalIssues:
                    "$measurementDetailsTotalIssues",
                  measurementDetailsTolPositive:
                    "$measurementDetailsTolPositive",
                  measurementDetailsTolNegative:
                    "$measurementDetailsTolNegative"
                }
              }
            },
            // B. Color Data: Group by Color
            colorData: {
              $push: {
                color: "$_id.color",
                size: "$_id.size",
                summary: {
                  garmentDetailsCheckedQty: "$garmentDetailsCheckedQty",
                  garmentDetailsOKGarment: "$garmentDetailsOKGarment",
                  garmentDetailsRejected: "$garmentDetailsRejected",
                  measurementDetailsPoints: "$measurementDetailsPoints",
                  measurementDetailsPass: "$measurementDetailsPass",
                  measurementDetailsTotalIssues:
                    "$measurementDetailsTotalIssues",
                  measurementDetailsTolPositive:
                    "$measurementDetailsTolPositive",
                  measurementDetailsTolNegative:
                    "$measurementDetailsTolNegative"
                },
                buyerSpecData: "$buyerSpecData",
                sizeMeasurementData: {
                  $reduce: {
                    input: "$sizeMeasurementData",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] }
                  }
                }
              }
            }
          }
        }
      ]);

      if (!aggregatedData || aggregatedData.length === 0) {
        return res
          .status(404)
          .json({ error: "No inspection data found for this MO Number." });
      }

      // --- Part 3: Final JavaScript processing (much simpler now) ---
      const result = aggregatedData[0];

      // A. Process Inspector Data
      const qcSummaryMap = result.inspectorData.reduce((acc, item) => {
        if (!acc[item.qcID]) acc[item.qcID] = { qcID: item.qcID };
        Object.keys(item.summary).forEach((key) => {
          acc[item.qcID][key] = (acc[item.qcID][key] || 0) + item.summary[key];
        });
        return acc;
      }, {});

      // B. Process Color Data
      const colorMap = result.colorData.reduce((acc, item) => {
        if (!acc[item.color]) {
          acc[item.color] = {
            color: item.color,
            summaryCards: {},
            summaryBySize: [],
            tallyBySize: []
          };
        }
        // Sum for summary cards
        Object.keys(item.summary).forEach((key) => {
          acc[item.color].summaryCards[key] =
            (acc[item.color].summaryCards[key] || 0) + item.summary[key];
        });
        // Add per-size summary
        acc[item.color].summaryBySize.push({
          size: item.size,
          sizeSummary: item.summary
        });
        // Add per-size tally
        const tally = {};
        item.sizeMeasurementData.forEach((garment) => {
          garment.measurements.forEach((m) => {
            const orderNo = m.orderNo;
            const fraction = m.fractionValue;
            if (!tally[orderNo]) tally[orderNo] = {};
            tally[orderNo][fraction] = (tally[orderNo][fraction] || 0) + 1;
          });
        });
        acc[item.color].tallyBySize.push({
          size: item.size,
          buyerSpecData: item.buyerSpecData,
          measurementsTally: tally
        });
        return acc;
      }, {});

      // --- Part 4: Assemble Final Payload ---
      const finalPayload = {
        orderDetails: {
          moNo: orderDetails.Order_No,
          buyer: orderDetails.Buyer,
          orderQty_style: orderDetails.TotalQty,
          custStyle: orderDetails.CustStyle,
          mode: orderDetails.Mode,
          country: orderDetails.Country,
          origin: orderDetails.Origin,
          orderColors: orderDetails.OrderColors
        },
        inspectorData: Object.values(qcSummaryMap),
        summaryByColor: Object.values(colorMap).map((c) => ({
          color: c.color,
          ...c.summaryCards
        })),
        detailsByColor: Object.values(colorMap)
      };

      res.json(finalPayload);
    } catch (error) {
      console.error("Error fetching style view full report:", error);
      res.status(500).json({
        error: "Failed to fetch full report.",
        details: error.message
      });
    }
  }
);

/* ------------------------------
   QC-Washing enpoint Start
  ------------------------------ */

/* ------------------------------
   End Points - Measurement Data In qcWashing
------------------------------ */
const qcWashingDir = path.join(process.cwd(),"backend","public", "storage", "qc_washing_images");
// if (!fs.existsSync(qcWashingDir)) {
//   fs.mkdirSync(qcWashingDir, { recursive: true });
// }

function saveBase64Image(base64String, prefix = "image") {
  const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1].split("/")[1];
  const buffer = Buffer.from(matches[2], "base64");
  // Generate a hash of the image content
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  const filename = `${prefix}-${hash}.${ext}`;
  const filePath = path.join(qcWashingDir, filename);

  // Only save if file does not already exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, buffer);
  }
  return `./public/storage/qc_washing_images/${filename}`;
}

function saveUploadedFile(file) {
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  const filePath = path.join(qcWashingDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `./public/storage/qc_washing_images/${filename}`;
}
const qcWashingMemoryStorage = multer.memoryStorage();

export const uploadQcWashingFiles = multer({
  storage: qcWashingMemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed."), false);
    }
  }
});


// Get order details by style number
app.get('/api/qc-washing/order-details-by-style/:orderNo', async (req, res) => {
  const { orderNo } = req.params;
  const collection = ymProdConnection.db.collection("dt_orders");

  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: `Style '${orderNo}' not found.` });
    }

    // Extract all available colors from OrderColors array
    const colorSet = new Set();
    orders.forEach(order => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        order.OrderColors.forEach(colorObj => {
          if (colorObj && colorObj.Color) {
            colorSet.add(colorObj.Color);
          }
        });
      }
    });
    const availableColors = Array.from(colorSet);
    
    const orderQty = orders.reduce((sum, order) => sum + (order.TotalQty || 0), 0);
    const buyerName = getBuyerFromMoNumber(orderNo);
    

    res.json({
      success: true,
      colors: availableColors,
      orderQty,
      buyer: buyerName,
    });

  } catch (error) {
    console.error(`Error fetching order details for style ${orderNo}:`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching order details.' });
  }
});

// GET - Get total order qty for a specific orderNo and color
app.get('/api/qc-washing/order-color-qty/:orderNo/:color', async (req, res) => {
  const { orderNo, color } = req.params;
  const collection = ymProdConnection.db.collection("dt_orders");
  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: `Order '${orderNo}' not found.` });
    }
    let totalQty = 0;
    orders.forEach(order => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        const colorObj = order.OrderColors.find(c => 
          c.Color.toLowerCase() === color.toLowerCase()
        );
        if (colorObj && Array.isArray(colorObj.OrderQty)) {
          colorObj.OrderQty.forEach(sizeObj => {
            // Each sizeObj is like { "XS": 32 }
            Object.values(sizeObj).forEach(qty => {
              if (typeof qty === "number" && qty > 0) totalQty += qty;
            });
          });
        }
      }
    });
    res.json({ success: true, orderNo, color, colorOrderQty: totalQty });
  } catch (error) {
    console.error(`Error fetching color order qty for ${orderNo} / ${color}:`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching color order qty.' });
  }
});


// Get sizes for a specific order and color
app.get('/api/qc-washing/order-sizes/:orderNo/:color', async (req, res) => {
  const { orderNo, color } = req.params;
  const collection = ymProdConnection.db.collection("dt_orders");

  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: `Order '${orderNo}' not found.` });
    }

    const sizes = new Set();
    orders.forEach(order => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        const matchingColor = order.OrderColors.find(c => 
          c.Color.toLowerCase() === color.toLowerCase()
        );
        
        if (matchingColor && matchingColor.OrderQty) {
          matchingColor.OrderQty.forEach(entry => {
            const sizeName = Object.keys(entry)[0];
            const quantity = entry[sizeName];
            if (quantity > 0) {
              const cleanSize = sizeName.split(";")[0].trim();
              sizes.add(cleanSize);
            }
          });
        }
      }
    });

    const sizesArray = Array.from(sizes);
    res.json({ success: true, sizes: sizesArray });

  } catch (error) {
    console.error(`Error fetching sizes for order ${orderNo} and color ${color}:`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching sizes.' });
  }
});

// Get measurement specifications for a specific order and color
app.get('/api/qc-washing/measurement-specs/:orderNo/:color', async (req, res) => {
  const { orderNo, color } = req.params;
  const collection = ymProdConnection.db.collection("dt_orders");
  
  try {
    const orders = await collection.find({ Order_No: orderNo }).toArray();
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: `Order '${orderNo}' not found.` });
    }

    const order = orders[0];
    
    // Extract measurement specifications from different possible locations
    let measurementSpecs = [];
    
    // Check various possible locations for measurement data
    if (order.MeasurementSpecs && Array.isArray(order.MeasurementSpecs)) {
      measurementSpecs = order.MeasurementSpecs;
    } else if (order.Specs && Array.isArray(order.Specs)) {
      measurementSpecs = order.Specs;
    } else if (order.OrderColors) {
      // Check if measurement specs are in color-specific data
      const colorObj = order.OrderColors.find(c => 
        c.Color.toLowerCase() === color.toLowerCase()
      );
      if (colorObj && colorObj.MeasurementSpecs) {
        measurementSpecs = colorObj.MeasurementSpecs;
      } else if (colorObj && colorObj.Specs) {
        measurementSpecs = colorObj.Specs;
      }
    }
    
    
    const beforeWashSpecs = [];
    const afterWashSpecs = [];
    
    // Group specs by kValue
    const beforeWashByK = {};
    const afterWashByK = {};
    
    // Check for BeforeWashSpecs and AfterWashSpecs arrays
    if (order.BeforeWashSpecs && Array.isArray(order.BeforeWashSpecs)) {
      order.BeforeWashSpecs.forEach(spec => {
        if (spec.MeasurementPointEngName && spec.Specs && Array.isArray(spec.Specs)) {
          const kValue = spec.kValue || 'NA';
          const pointName = spec.MeasurementPointEngName;
          
          if (!beforeWashByK[kValue]) {
            beforeWashByK[kValue] = new Map();
          }
          
          if (!beforeWashByK[kValue].has(pointName)) {
            const sizeSpec = spec.Specs.find(s => s.size === color) || spec.Specs[0];
            beforeWashByK[kValue].set(pointName, {
              MeasurementPointEngName: pointName,
              Specs: {
                fraction: (sizeSpec?.fraction || sizeSpec?.decimal?.toString() || '0').toString().trim()
              },
              ToleranceMinus: (spec.TolMinus?.fraction || spec.TolMinus?.decimal?.toString() || '0').toString().trim(),
              TolerancePlus: (spec.TolPlus?.fraction || spec.TolPlus?.decimal?.toString() || '0').toString().trim(),
              kValue: kValue
            });
          }
        }
      });
    }
    
    if (order.AfterWashSpecs && Array.isArray(order.AfterWashSpecs)) {
      order.AfterWashSpecs.forEach(spec => {
        if (spec.MeasurementPointEngName && spec.Specs && Array.isArray(spec.Specs)) {
          const kValue = spec.kValue || 'NA';
          const pointName = spec.MeasurementPointEngName;
          
          if (!afterWashByK[kValue]) {
            afterWashByK[kValue] = new Map();
          }
          
          if (!afterWashByK[kValue].has(pointName)) {
            const sizeSpec = spec.Specs.find(s => s.size === color) || spec.Specs[0];
            afterWashByK[kValue].set(pointName, {
              MeasurementPointEngName: pointName,
              Specs: {
                fraction: (sizeSpec?.fraction || sizeSpec?.decimal?.toString() || '0').toString().trim()
              },
              ToleranceMinus: (spec.TolMinus?.fraction || spec.TolMinus?.decimal?.toString() || '0').toString().trim(),
              TolerancePlus: (spec.TolPlus?.fraction || spec.TolPlus?.decimal?.toString() || '0').toString().trim(),
              kValue: kValue
            });
          }
        }
      });
    }
    
    // Convert to grouped arrays
    const beforeWashGrouped = {};
    const afterWashGrouped = {};
    
    Object.keys(beforeWashByK).forEach(kValue => {
      beforeWashGrouped[kValue] = Array.from(beforeWashByK[kValue].values());
    });
    
    Object.keys(afterWashByK).forEach(kValue => {
      afterWashGrouped[kValue] = Array.from(afterWashByK[kValue].values());
    });
    
    // For backward compatibility, also provide flat arrays
    Object.values(beforeWashGrouped).forEach(group => {
      beforeWashSpecs.push(...group);
    });
    Object.values(afterWashGrouped).forEach(group => {
      afterWashSpecs.push(...group);
    });
    

    // If no measurement data found, provide default specifications
    if (beforeWashSpecs.length === 0 && afterWashSpecs.length === 0) {
        return res.json({
          success: true,
          beforeWashSpecs: [],
          afterWashSpecs: [],
          beforeWashGrouped: {},
          afterWashGrouped: {},
          isDefault: true,
          message: "No measurement points available for this Mono."
        });
      } else {
        return res.json({ 
          success: true, 
          beforeWashSpecs: beforeWashSpecs,
          afterWashSpecs: afterWashSpecs,
          beforeWashGrouped: beforeWashGrouped,
          afterWashGrouped: afterWashGrouped,
          isDefault: false 
        });
      }

  } catch (error) {
    console.error(`Error fetching measurement specs for Mono ${orderNo} :`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching measurement specs.' });
  }
});

// Get order details by order number
app.get('/api/qc-washing/order-details-by-order/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const orderData = await QCWashing.findOne({ orderNo: orderNo });
    
    if (orderData) {
      res.json({
        success: true,
        orderNo: orderData.orderNo,
        colors: [orderData.color.orderDetails.color],
        orderQty: orderData.color.orderDetails.orderQty,
        buyer: orderData.color.orderDetails.buyer
      });
    } else {
      res.json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});


// Save size data
app.post('/api/qc-washing/save-size', async (req, res) => {
  try {
    const { orderNo, color, sizeData, userId } = req.body;
    
    // Find existing QC record or create new one
    let qcRecord = await QCWashing.findOne({ orderNo: orderNo, isAutoSave: true, userId: userId });
    
    if (!qcRecord) {
      qcRecord = new QCWashing({
        orderNo: orderNo,
        isAutoSave: true,
        userId: userId,
        status: 'auto-saved',
        color: {
          orderDetails: { color: color },
          measurementDetails: new Map()
        }
      });
    }
    
    // Validate measurements against tolerance
    const validateMeasurement = (measurement, specs, tolMinus, tolPlus) => {
      if (!measurement || !specs) return 'pass';
      
      const measValue = parseFloat(measurement);
      const specValue = parseFloat(specs);
      const minTol = parseFloat(tolMinus) || 0;
      const maxTol = parseFloat(tolPlus) || 0;
      
      const minAllowed = specValue + minTol;
      const maxAllowed = specValue + maxTol;
      
      return (measValue >= minAllowed && measValue <= maxAllowed) ? 'pass' : 'fail';
    };
    
  
    const sizeKey = `size_${sizeData.size}`;
    const measurementData = {
      size: sizeData.size,
      qty: sizeData.qty,
      measurements: sizeData.measurements,
      selectedRows: sizeData.selectedRows,
      fullColumns: sizeData.fullColumns,
      results: {},
      savedAt: new Date()
    };
    
    // Add validation results
    Object.keys(sizeData.measurements || {}).forEach(cellKey => {
      const measurement = sizeData.measurements[cellKey];
      measurementData.results[cellKey] = {
        value: measurement.decimal,
        fraction: measurement.fraction,
        result: 'pass'
      };
    });
    
    qcRecord.color.measurementDetails.set(sizeKey, measurementData);
    await qcRecord.save();
    
    res.json({ success: true, message: 'Size data saved successfully' });
  } catch (error) {
    console.error('Save size error:', error);
    res.status(500).json({ success: false, message: 'Failed to save size data' });
  }
});

// Get saved sizes
app.get('/api/qc-washing/saved-sizes/:orderNo/:color', async (req, res) => {
  try {
    const { orderNo, color } = req.params;
    const qcRecord = await QCWashing.findOne({ 
      orderNo: orderNo, 
      colorName: color,
      isAutoSave: true 
    });
    
    if (qcRecord && qcRecord.color && qcRecord.color.measurementDetails) {
      const savedSizes = [];
      qcRecord.color.measurementDetails.forEach((value, key) => {
        if (key.startsWith('size_')) {
          savedSizes.push(value.size);
        }
      });
      res.json({ success: true, savedSizes: savedSizes });
    } else {
      res.json({ success: true, savedSizes: [] });
    }
  } catch (error) {
    console.error('Get saved sizes error:', error);
    res.status(500).json({ success: false, message: 'Failed to get saved sizes' });
  }
});

app.post('/api/qc-washing/submit', async (req, res) => {
  try {
    const { orderNo } = req.body;
    if (!orderNo) {
      return res.status(400).json({ success: false, message: 'orderNo is required' });
    }
    const latestAutoSave = await QCWashing.findOne({
      orderNo,
      status: "processing"
    }).sort({ updatedAt: -1 });

    if (!latestAutoSave) {
      return res.status(404).json({ success: false, message: 'No auto-save record found to submit.' });
    }

    latestAutoSave.isAutoSave = false;
    latestAutoSave.status = 'submitted';
    latestAutoSave.submittedAt = new Date();
    latestAutoSave.savedAt = new Date();
    await latestAutoSave.save();

    res.json({ success: true, submissionId: latestAutoSave._id, message: 'QC Washing data submitted successfully' });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit data', error: error.message, stack: error.stack });
  }
});

// Load color-specific data
app.get('/api/qc-washing/load-color-data/:orderNo/:color', async (req, res) => {
  try {
    const { orderNo, color } = req.params;
    const qcRecord = await QCWashing.findOne({ orderNo: orderNo });
    
    if (qcRecord && qcRecord.colors) {
      const colorData = qcRecord.colors.find(c => c.colorName === color);
      
      if (colorData) {
        // res.json({ success: true, colorData: colorData });
        res.json({ success: true, colorData: {
          ...colorData,
          before_after_wash: qcRecord.before_after_wash,
          washQty: qcRecord.washQty,
          checkedQty: qcRecord.checkedQty,
          totalCheckedPoint: qcRecord.totalCheckedPoint,
          totalPass: qcRecord.totalPass,
          totalFail: qcRecord.totalFail,
          passRate: qcRecord.passRate
        }});
      } else {
        res.json({ success: false, message: 'Color data not found' });
      }
    } else {
      res.json({ success: false, message: 'No saved data found' });
    }
  } catch (error) {
    console.error('Load color data error:', error);
    res.status(500).json({ success: false, message: 'Failed to load color data' });
  }
});

// Get all saved colors for an order
app.get('/api/qc-washing/saved-colors/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const qcRecord = await QCWashing.findOne({ orderNo: orderNo });
    
    if (qcRecord && qcRecord.colors) {
      const savedColors = qcRecord.colors.map(c => c.colorName);
      res.json({ success: true, savedColors: savedColors });
    } else {
      res.json({ success: true, savedColors: [] });
    }
  } catch (error) {
    console.error('Get saved colors error:', error);
    res.status(500).json({ success: false, message: 'Failed to get saved colors' });
  }
});

// Get order numbers
app.get('/api/qc-washing/order-numbers', async (req, res) => {
  try {
    const orders = await QCWashing.distinct('orderNo');
    res.json({ success: true, orderNumbers: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order numbers' });
  }
});

/* ------------------------------
   QC Washing Measurement Endpoints
------------------------------ */

// Check if existing record exists for QC Washing
app.get('/api/qc-washing/check-existing/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const existingRecord = await QCWashing.findOne({ 
      orderNo: orderNo, 
      isAutoSave: true 
    }).sort({ savedAt: -1 });

    if (existingRecord) {
      res.json({ 
        exists: true, 
        recordId: existingRecord._id,
        existingData: {
          formData: existingRecord.color?.orderDetails || {},
          inspectionData: existingRecord.color?.inspectionDetails?.checkedPoints || [],
          processData: existingRecord.color?.inspectionDetails?.parameters || [],
          defectData: existingRecord.color?.defectDetails || {},
          addedDefects: existingRecord.color?.defectDetails?.defects || [],
          comment: existingRecord.color?.defectDetails?.comment || '',
          signatures: existingRecord.signatures || {},
          measurementData: existingRecord.measurementData || []
        }
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking existing record:', error);
    res.status(500).json({ success: false, message: 'Failed to check existing record' });
  }
});

// Update existing QC Washing record
app.put('/api/qc-washing/update/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const updateData = req.body;
    
    const updatedRecord = await QCWashing.findByIdAndUpdate(
      recordId, 
      updateData, 
      { new: true }
    );
    
    if (updatedRecord) {
      res.json({ success: true, id: updatedRecord._id, message: 'Record updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Record not found' });
    }
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ success: false, message: 'Failed to update record' });
  }
});

// GET - Get overall summary for a given orderNo and color
app.get('/api/qc-washing/overall-summary-by-id/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const qcRecord = await QCWashing.findById(recordId);

    if (!qcRecord) {
      return res.status(404).json({ success: false, message: 'No data found for this record.' });
    }

    // Use saved summary fields if available, fallback to 0 or "N/A"
    res.json({
      success: true,
      summary: {
        recordId,
        orderNo: qcRecord.orderNo,
        color: qcRecord.color,
        totalCheckedPcs: qcRecord.totalCheckedPcs ?? 0,
        checkedQty: qcRecord.checkedQty ?? "",
        washQty: qcRecord.washQty ?? "",
        rejectedDefectPcs: qcRecord.rejectedDefectPcs ?? 0,
        totalDefectCount: qcRecord.totalDefectCount ?? 0,
        defectRate: qcRecord.defectRate ?? 0,
        defectRatio: qcRecord.defectRatio ?? 0,
        overallResult: qcRecord.overallFinalResult ?? qcRecord.overallResult ?? "N/A",
        // Optionally include these if you want to show them in the UI:
        passRate: qcRecord.passRate ?? "",
        measurementPoints: qcRecord.measurementPoints ?? "",
        measurementPass: qcRecord.measurementPass ?? "",
        totalFail: qcRecord.totalFail ?? "",
        measurementOverallResult: qcRecord.measurementOverallResult ?? "",
        defectOverallResult: qcRecord.defectDetails?.result ?? "N/A",
        defectDetails: qcRecord.defectDetails ?? {},
      }
    });
  } catch (error) {
    console.error('Error fetching overall summary by id:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching overall summary.' });
  }
});

app.post('/api/qc-washing/save-summary/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const summary = req.body.summary || {};

    const qcRecord = await QCWashing.findById(recordId);
    if (!qcRecord) return res.status(404).json({ success: false, message: 'Record not found.' });

    // Calculate totalCheckedPcs correctly from measurement data
    let totalCheckedPcs = 0;
    if (qcRecord.measurementDetails && qcRecord.measurementDetails.measurement) {
      // Sum up the qty from each size measurement
      qcRecord.measurementDetails.measurement.forEach(measurement => {
        if (typeof measurement.qty === "number" && measurement.qty > 0) {
          totalCheckedPcs += measurement.qty;
        }
      });
    }

    // If no measurement data, use checkedQty as fallback
    if (totalCheckedPcs === 0) {
      totalCheckedPcs = parseInt(qcRecord.checkedQty, 10) || 0;
    }

    // Calculate defect statistics
    let rejectedDefectPcs = 0;
    let totalDefectCount = 0;
    const defectDetails = qcRecord.defectDetails || {};
    
    if (Array.isArray(defectDetails.defectsByPc)) {
      rejectedDefectPcs = defectDetails.defectsByPc.length;
      totalDefectCount = defectDetails.defectsByPc.reduce(
        (sum, pc) => sum + (
          Array.isArray(pc.pcDefects)
            ? pc.pcDefects.reduce((defSum, defect) => defSum + (parseInt(defect.defectQty, 10) || 0), 0)
            : 0
        ), 0
      );
    }

    // Always use calculated values to ensure consistency
    qcRecord.totalCheckedPcs = totalCheckedPcs;
    qcRecord.rejectedDefectPcs = rejectedDefectPcs;
    qcRecord.totalDefectCount = totalDefectCount;
    qcRecord.defectRate = totalCheckedPcs > 0 ? Number(((totalDefectCount / totalCheckedPcs) * 100).toFixed(1)) : 0;
    qcRecord.defectRatio = totalCheckedPcs > 0 ? Number(((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1)) : 0;
    qcRecord.overallFinalResult = summary.overallFinalResult ?? "N/A";


    await qcRecord.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Save summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to save summary.' });
  }
});



const getAqlLevelForBuyer = (buyer) => {
  if (!buyer) return 1.0;
  const buyerUpper = buyer.toUpperCase();
  
  if (buyerUpper.includes('MWW')) return 2.5;
  if (buyerUpper.includes('REITMANS')) return 4.0;
  if (buyerUpper.includes('ARITZIA')) return 1.5;
  if (buyerUpper.includes('A & F') || buyerUpper.includes('A&F') || buyerUpper.includes('ANF')) return 1.5;
  if (buyerUpper.includes('COSCO')) return 1.0;
  
  return 1.0;
};

app.post('/api/qc-washing/aql-chart/find-by-sample-size', async (req, res) => {
  try {
    const { orderNo } = req.body;
    // const sampleSizeNum = parseInt(sampleSize, 10);
    
    const firstOutputRecord = await QCWashingFirstOutput.findOne().sort({ createdAt: -1 }).lean();
    const sampleSizeNum = parseInt(firstOutputRecord.quantity, 10);

    if (isNaN(sampleSizeNum) || sampleSizeNum <= 0) {
      return res.status(400).json({ success: false, message: "A valid sample size must be provided." });
    }

    const buyer = await getBuyerFromMoNumber(orderNo);
    const aqlLevel = getAqlLevelForBuyer(buyer);

    const aqlChart = await AQLChart.findOne({
      Type: "General",
      Level: "II",
      SampleSize: { $gte: sampleSizeNum }
    }).sort({ SampleSize: 1 }).lean();

    if (!aqlChart) {
      return res
        .status(404)
        .json({ success: false, message: `No AQL chart found for a sample size of ${sampleSizeNum} or greater.` });
    }

    // Find the specific AQL entry for level 1.0 within the document.
    const aqlEntry = aqlChart.AQL.find(aql => aql.level === aqlLevel);

    if (!aqlEntry) {
      return res
        .status(404)
        .json({ success: false, message: "AQL level  ${aqlLevel} not found for the matching chart." });
    }

    // Respond with the data in the format expected by the frontend.
    res.json({
      success: true,
      aqlData: {
        sampleSize: aqlChart.SampleSize, // Return the actual sample size from the chart
        acceptedDefect: aqlEntry.AcceptDefect,
        rejectedDefect: aqlEntry.RejectDefect,
        levelUsed: aqlLevel
      }
    });

  } catch (error) {
    console.error('AQL lookup by sample size error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching AQL details by sample size.' });
  }
});
// AQL data endpoint
app.post('/api/qc-washing/aql-chart/find', async (req, res) => {
  try {
    const { lotSize, orderNo } = req.body;

    if (!lotSize || isNaN(lotSize)) {
      return res
        .status(400)
        .json({ success: false, message: "Lot size (wash Qty) is required and must be a number." });
    }
    const lotSizeNum = parseInt(lotSize, 10);

    const buyer = await getBuyerFromMoNumber(orderNo);
    const aqlLevel = getAqlLevelForBuyer(buyer);

    // Find the AQL chart document where the lot size falls within the defined range.
    const aqlChart = await AQLChart.findOne({
      Type: "General", 
      Level: "II",   
      "LotSize.min": { $lte: lotSizeNum },
      $or: [
        { "LotSize.max": { $gte: lotSizeNum } },
        { "LotSize.max": null }
      ]
    }).lean();

    if (!aqlChart) {
      return res
        .status(404)
        .json({ success: false, message: "No AQL chart found for the given lot size." });
    }

    // Find the specific AQL entry for level  within the document.
    const aqlEntry = aqlChart.AQL.find(aql => aql.level === aqlLevel);

    if (!aqlEntry) {
      return res
        .status(404)
        .json({ success: false, message: "AQL level  ${aqlLevel} not found for the matching chart." });
    }

    
    res.json({
      success: true,
      aqlData: {
        sampleSize: aqlChart.SampleSize,
        acceptedDefect: aqlEntry.AcceptDefect,
        rejectedDefect: aqlEntry.RejectDefect,
        levelUsed: aqlLevel 
      }
    });
  } catch (error) {
    console.error('AQL calculation error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching AQL details.' });
  }
});

app.post('/api/qc-washing/first-output-details', async (req, res) => {
  try {
    const { orderNo } = req.body;

    if (!orderNo) {
      return res.status(400).json({ success: false, message: "Order No is required to fetch first output details." });
    }

    // 1. Find the latest 'First Output' record to get the quantity.
    // We sort by createdAt descending and take the first one.
    const firstOutputRecord = await QCWashingFirstOutput.findOne().sort({ createdAt: -1 }).lean();

    if (!firstOutputRecord) {
      return res.status(404).json({ success: false, message: "No 'First Output' quantity has been set in the admin settings." });
    }

       const sampleSizeNum = parseInt(firstOutputRecord.quantity, 10);

    // 2. Get the buyer and AQL level based on the provided orderNo.
    const buyer = await getBuyerFromMoNumber(orderNo);
    const aqlLevel = getAqlLevelForBuyer(buyer);

    // 3. Find the AQL chart document based on the lot size (quantity).
   const aqlChart = await AQLChart.findOne({
      Type: "General",
      Level: "II",
      SampleSize: { $gte: sampleSizeNum }
    }).sort({ SampleSize: 1 }).lean();

    if (!aqlChart) {
      return res.status(404).json({ success: false, message: "No AQL chart found for the given lot size." });
    }

    // 4. Find the specific AQL entry for the buyer's AQL level.
    const aqlEntry = aqlChart.AQL.find(aql => aql.level === aqlLevel);

    if (!aqlEntry) {
      return res.status(404).json({ success: false, message: `AQL level ${aqlLevel} not found for the matching chart.` });
    }

    // 5. Respond with the data in the format expected by the frontend.
    res.json({
      success: true,
      checkedQty: firstOutputRecord.quantity,
      aqlData: {
        sampleSize: aqlChart.SampleSize,
        acceptedDefect: aqlEntry.AcceptDefect,
        rejectedDefect: aqlEntry.RejectDefect,
        levelUsed: aqlLevel
      }
    });

  } catch (error) {
    console.error('Error fetching first output details:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching first output details.' });
  }
});

// POST /api/qc-washing/aql-chart/for-parameter
// app.post('/api/qc-washing/aql-chart/parameter', async (req, res) => {
//   try {
//     const { orderNo, checkedQty } = req.body;
//     if (!orderNo || !checkedQty || isNaN(checkedQty)) {
//       return res.status(400).json({ success: false, message: "Order No and checkedQty are required." });
//     }
//     const lotSizeNum = parseInt(checkedQty, 10);
//     const buyer = await getBuyerFromMoNumber(orderNo);
//     const aqlLevel = getAqlLevelForBuyer(buyer);

//     const aqlChart = await AQLChart.findOne({
//       Type: "General",
//       Level: "II",
//       "LotSize.min": { $lte: lotSizeNum },
//       $or: [
//         { "LotSize.max": { $gte: lotSizeNum } },
//         { "LotSize.max": null }
//       ]
//     }).lean();

//     if (!aqlChart) {
//       return res.status(404).json({ success: false, message: "No AQL chart found for the given lot size." });
//     }
//     if (!Array.isArray(aqlChart.AQL)) {
//       return res.status(404).json({ success: false, message: "AQL data is missing in the chart." });
//     }

//     // Use string comparison to avoid type mismatch
//     const aqlEntry = aqlChart.AQL.find(aql => String(aql.level) === String(aqlLevel));

//     if (!aqlEntry) {
//       // Log for debugging
//       // console.error('AQL for parameter error: No entry found for level', aqlLevel, 'in', aqlChart.AQL);
//       return res.status(404).json({ success: false, message: `AQL level ${aqlLevel} not found for the matching chart.` });
//     }

//     res.json({
//       success: true,
//       aqlData: {
//         sampleSize: aqlChart.SampleSize,
//         acceptedDefect: aqlEntry.AcceptDefect,
//         rejectedDefect: aqlEntry.RejectDefect,
//         aqlLevelUsed: aqlLevel
//       }
//     });
//   } catch (error) {
//     console.error('AQL for parameter error:', error);
//     res.status(500).json({ success: false, message: 'Server error while fetching AQL details for parameter.' });
//   }
// });

// Load submitted data
app.get('/api/qc-washing/load-submitted/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const submittedData = await QCWashing.findOne({ 
      orderNo: orderNo, 
      isAutoSave: false,
      status: 'submitted'
    }).sort({ submittedAt: -1 });

    if (submittedData) {
      res.json({ success: true, data: submittedData });
    } else {
      res.json({ success: false, message: 'No submitted data found' });
    }
  } catch (error) {
    console.error('Load submitted data error:', error);
    res.status(500).json({ success: false, message: 'Failed to load submitted data' });
  }
});

// Check if submitted data exists
app.get('/api/qc-washing/check-submitted/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    const submittedData = await QCWashing.findOne({ 
      orderNo: orderNo, 
      isAutoSave: false,
      status: 'submitted'
    });

    res.json({ 
      exists: !!submittedData,
      isSubmitted: !!submittedData,
      recordId: submittedData?._id
    });
  } catch (error) {
    console.error('Check submitted data error:', error);
    res.status(500).json({ success: false, message: 'Failed to check submitted data' });
  }
});

/* ------------------------------
   QC Washing Check List Endpoints
------------------------------ */

// GET - Fetch all check list items
app.get('/api/qc-washing-checklist', async (req, res) => {
  try {
    const checkList = await QCWashingCheckList.find({}).sort({ code: 1 }).lean();
    res.json(checkList);
  } catch (error) {
    console.error('Error fetching QC Washing check list:', error);
    res.status(500).json({ message: 'Server error fetching check list' });
  }
});

// POST - Add new check list item
app.post('/api/qc-washing-checklist', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const existingByName = await QCWashingCheckList.findOne({ name });
    if (existingByName) {
      return res.status(409).json({ message: `Check list name '${name}' already exists.` });
    }
    
    const newCheckList = new QCWashingCheckList(req.body);
    await newCheckList.save();
    res.status(201).json({ message: 'Check list item added successfully', checkList: newCheckList });
  } catch (error) {
    console.error('Error adding check list item:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate entry. Check list code might exist.' });
    }
    res.status(500).json({ message: 'Failed to add check list item', error: error.message });
  }
});

// GET - Get next available code
app.get('/api/qc-washing-checklist/next-code', async (req, res) => {
  try {
    const lastItem = await QCWashingCheckList.findOne().sort({ code: -1 }).lean();
    let nextCode = 1;
    if (lastItem && lastItem.code) {
      nextCode = parseInt(lastItem.code, 10) + 1;
    }
    res.json({ success: true, nextCode });
  } catch (error) {
    console.error('Error fetching next check list code:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch next code' });
  }
});

// PUT - Update check list item
app.put('/api/qc-washing-checklist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid check list ID format.' });
    }
    
    const updatedItem = await QCWashingCheckList.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Check list item not found.' });
    }
    
    res.status(200).json({ message: 'Check list item updated successfully', checkList: updatedItem });
  } catch (error) {
    console.error('Error updating check list item:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Update failed due to duplicate code.' });
    }
    res.status(500).json({ message: 'Failed to update check list item', error: error.message });
  }
});

// DELETE - Delete check list item
app.delete('/api/qc-washing-checklist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid check list ID format.' });
    }
    
    const deletedItem = await QCWashingCheckList.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Check list item not found.' });
    }
    
    res.status(200).json({ message: 'Check list item deleted successfully' });
  } catch (error) {
    console.error('Error deleting check list item:', error);
    res.status(500).json({ message: 'Failed to delete check list item', error: error.message });
    }
});

// =================================================================
// MULTER CONFIGURATION (Memory Storage Pattern)
// =================================================================

// Use memoryStorage to handle the file as a buffer in memory first.
const qc2_washing_MemoryStorage = multer.memoryStorage();

// Configure multer with memory storage, file filter, and limits.
const uploadQC2_washing_image = multer({
  storage: qc2_washing_MemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  }
});


/* ------------------------------
   End Points - QC Washing Defects
------------------------------ */

// GET - Fetch all QC Washing defects
app.get("/api/qc-washing-defects", async (req, res) => {
  try {
    const defects = await QCWashingDefects.find({}).sort({ code: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QC Washing defects:", error);
    res.status(500).json({ message: "Server error fetching defects" });
  }
});

// POST - Add a new QC Washing defect
app.post("/api/qc-washing-defects", async (req, res) => {
  try {
    const { code, english, khmer, chinese } = req.body;
    if (code === undefined || !english || !khmer) {
      return res.status(400).json({
        message: "Code, Defect Letter, English & Khmer names are required."
      });
    }
    const existingByCode = await QCWashingDefects.findOne({ code });
    if (existingByCode) {
      return res
        .status(409)
        .json({ message: `Defect code '${code}' already exists.` });
    }
    const newDefect = new QCWashingDefects(req.body);
    await newDefect.save();
    res
      .status(201)
      .json({ message: "QC Washing defect added successfully", defect: newDefect });
  } catch (error) {
    console.error("Error adding QC Washing defect:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate entry. Defect code or name might exist." });
    res
      .status(500)
      .json({ message: "Failed to add QC Washing defect", error: error.message });
  }
});

app.get('/api/qc-washing-defects/next-code', async (req, res) => {
  try {
    // Find the defect with the highest 'code' value.
    // The .lean() method is for performance, as we only need to read the data.
    const lastDefect = await QCWashingDefects.findOne().sort({ code: -1 }).lean();

    let nextCode = 1; // Default to 1 if no defects exist
    if (lastDefect && lastDefect.code) {
      // Increment the last code
      nextCode = parseInt(lastDefect.code, 10) + 1;
    }

    res.json({ success: true, nextCode });
  } catch (error) {
    console.error("Error fetching next defect code:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch next defect code' });
  }
});

// PUT - Update an existing QC Washing defect by ID
app.put("/api/qc-washing-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }
    const updatedDefect = await QCWashingDefects.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedDefect) {
      return res.status(404).json({ message: "QC Washing Defect not found." });
    }
    res.status(200).json({
      message: "QC Washing defect updated successfully",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error updating QC Washing defect:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate code or name." });
    res
      .status(500)
      .json({ message: "Failed to update QC Washing defect", error: error.message });
  }
});

// DELETE - Delete a QC Washing defect by ID
app.delete("/api/qc-washing-defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }
    const defect = await QCWashingDefects.findById(id);
    if (!defect) {
      return res.status(404).json({ message: "QC Washing Defect not found." });
    }
    if (defect.image) {
      const imagePath = path.join(
        "storage",
        defect.image.replace("/storage/", "")
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await QCWashingDefects.findByIdAndDelete(id);
    res.status(200).json({
      message: "QC Washing defect and associated image deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting QC Washing defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete QC Washing defect", error: error.message });
  }
});

// PUT - Replace image for an existing QC Washing defect
app.put("/api/qc-washing-defects/:id/image",uploadQC2_washing_image.single("defectImage"), async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No new image file provided." });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid defect ID." });
      }
      const defect = await QCWashingDefects.findById(id);
      if (!defect) {
        return res
          .status(404)
          .json({ success: false, message: "Defect not found." });
      }
      if (defect.image) {
        const oldImagePath = path.join(__dirname, "public", defect.image);
        if (fs.existsSync(oldImagePath)) {
          await fs.promises.unlink(oldImagePath);
        }
      }
      const uploadPath = path.join(
        __dirname,
        "backend",
        "public",
        "storage",
        "qc_washing_images"
      );
      const fileExtension = path.extname(req.file.originalname);
      const newFilename = `qc-washing-defect-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${fileExtension}`;
      const fullFilePath = path.join(uploadPath, newFilename);
      await fs.promises.writeFile(fullFilePath, req.file.buffer);
      const newRelativeUrl = `./public/storage/qc_washing_images/${newFilename}`;
      defect.image = newRelativeUrl;
      const updatedDefect = await defect.save();
      res.status(200).json({
        success: true,
        message: "Image replaced successfully.",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error replacing QC Washing defect image:", error);
      res.status(500).json({
        success: false,
        message: "Server error while replacing image."
      });
    }
  }
);

// DELETE - Delete image from an existing QC Washing defect
app.delete("/api/qc-washing-defects/:id/image", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid defect ID." });
    }
    const defect = await QCWashingDefects.findById(id);
    if (!defect) {
      return res
        .status(404)
        .json({ success: false, message: "Defect not found." });
    }
    if (!defect.image) {
      return res
        .status(200)
        .json({ success: true, message: "No image to delete." });
    }
    const imagePath = path.join(__dirname, "public", defect.image);
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }
    defect.image = "";
    const updatedDefect = await defect.save();
    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error deleting QC Washing defect image:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting image." });
  }
});

// GET all first output records
app.get("/api/qc-washing-first-outputs", async (req, res) => {
  try {
    const outputs = await QCWashingFirstOutput.find().sort({ date: -1 });
    res.json(outputs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching records", error });
  }
});

// POST a new first output record
app.post("/api/qc-washing-first-outputs", async (req, res) => {
  try {
    const newOutput = new QCWashingFirstOutput(req.body);
    const savedOutput = await newOutput.save();
    res.status(201).json(savedOutput);
  } catch (error) {
    res.status(400).json({ message: "Error creating record", error });
  }
});

// PUT (update) a first output record by ID
app.put("/api/qc-washing-first-outputs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOutput = await QCWashingFirstOutput.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOutput) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(updatedOutput);
  } catch (error) {
    res.status(400).json({ message: "Error updating record", error });
  }
});

// DELETE a first output record by ID
app.delete("/api/qc-washing-first-outputs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOutput = await QCWashingFirstOutput.findByIdAndDelete(id);
    if (!deletedOutput) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting record", error });
  }
});

// POST /api/qc-washing/standards
app.post('/api/qc-washing/standards', async (req, res) => {
  try {
    const { washType, washingMachine, tumbleDry } = req.body;
    if (!washType) return res.status(400).json({ success: false, message: "washType is required" });

    let record = await QCWashingMachineStandard.findOne({ washType });
    if (record) {
      record.washingMachine = washingMachine;
      record.tumbleDry = tumbleDry;
      await record.save();
    } else {
      record = await QCWashingMachineStandard.create({ washType, washingMachine, tumbleDry });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/qc-washing/standards
app.get('/api/qc-washing/standards', async (req, res) => {
  try {
    const records = await QCWashingMachineStandard.find({});
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//New QC_Washing Endpoints

app.post("/api/qc-washing/orderData-save", async (req, res) => {
  try {
    const { formData, userId, savedAt } = req.body;
    if (!formData || !formData.orderNo) {
      return res.status(400).json({ success: false, message: "Order No is required." });
    }
    const dateValue = formData.date
    ? new Date(formData.date.length === 10 ? formData.date + "T00:00:00.000Z" : formData.date)
    : undefined;


    // Build the query for uniqueness
    const query = {
      orderNo: formData.orderNo,
      date: dateValue,
      color: formData.color,
      washType: formData.washType,
      before_after_wash: formData.before_after_wash,
      factoryName: formData.factoryName, 
      reportType: formData.reportType,
      inline: formData.inline,
      washQty: formData.washQty,
      "inspector.empId": userId || formData.inspector?.empId
    };
    Object.keys(query).forEach(
      (key) => (query[key] === undefined || query[key] === "") && delete query[key]
    );

    // Find existing record
    let record = await QCWashing.findOne(query);

    if (!record) {
      // Create new record
      record = new QCWashing({
        ...formData,
        colorOrderQty: formData.colorOrderQty,
        userId,
        savedAt,
        status: "processing"
      });
    } else {
      // Update existing record
      Object.assign(record, formData);
      record.userId = userId;
      record.savedAt = savedAt;
      record.status = "processing";
    }

    await record.save();
    res.json({ success: true, id: record._id });
  } catch (err) {
    console.error("OrderData-save error:", err);
    res.status(500).json({ success: false, message: "Server error while saving order data." });
  }
});

app.get('/api/qc-washing/check-measurement-details/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    if (!orderNo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order number is required',
        hasMeasurement: false 
      });
    }

    const collection = ymProdConnection.db.collection("dt_orders");

    // Find the order first
    const order = await collection.findOne({
      $or: [
        { Order_No: orderNo },
        { Style: orderNo }
      ]
    });

    if (!order) {
      return res.json({
        success: true,
        hasMeasurement: false,
        message: 'Order not found',
        debug: {
          orderNo: orderNo,
          foundRecord: false
        }
      });
    }

    // Check if measurement specs exist and have valid data
    const hasBeforeWashSpecs = Array.isArray(order.BeforeWashSpecs) && 
        order.BeforeWashSpecs.length > 0 &&
        order.BeforeWashSpecs.some(spec => 
          spec.MeasurementPointEngName && 
          spec.MeasurementPointEngName.trim() !== ""
        );

    const hasAfterWashSpecs = Array.isArray(order.AfterWashSpecs) && 
          order.AfterWashSpecs.length > 0 &&
          order.AfterWashSpecs.some(spec => 
            spec.MeasurementPointEngName && 
            spec.MeasurementPointEngName.trim() !== ""
          );

    const hasMeasurement = hasBeforeWashSpecs || hasAfterWashSpecs;

    res.json({
      success: true,
      hasMeasurement: hasMeasurement,
      message: hasMeasurement 
        ? 'Measurement details found' 
        : 'No measurement details found for this order',
      debug: {
        orderNo: orderNo,
        foundRecord: true,
        measurementStructure: {
          hasBeforeWashSpecs: hasBeforeWashSpecs,
          hasAfterWashSpecs: hasAfterWashSpecs,
          beforeWashSpecsCount: order.BeforeWashSpecs?.length || 0,
          afterWashSpecsCount: order.AfterWashSpecs?.length || 0,
          orderData: {
            Order_No: order.Order_No,
            Style: order.Style
          }
        }
      }
    });

  } catch (error) {
    console.error('Error checking measurement details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking measurement details',
      hasMeasurement: false,
      error: error.message
    });
  }
});

app.get(
  "/api/qc-washing/check-measurement-details/:orderNo",
  async (req, res) => {
    try {
      const { orderNo } = req.params;

      if (!orderNo) {
        return res.status(400).json({
          success: false,
          message: "Order number is required",
          hasMeasurement: false
        });
      }

      const collection = ymProdConnection.db.collection("dt_orders");

      // Find the order first
      const order = await collection.findOne({
        $or: [{ Order_No: orderNo }, { Style: orderNo }]
      });

      if (!order) {
        return res.json({
          success: true,
          hasMeasurement: false,
          message: "Order not found",
          debug: {
            orderNo: orderNo,
            foundRecord: false
          }
        });
      }

      // Check if measurement specs exist and have valid data
      const hasBeforeWashSpecs =
        Array.isArray(order.BeforeWashSpecs) &&
        order.BeforeWashSpecs.length > 0 &&
        order.BeforeWashSpecs.some(
          (spec) =>
            spec.MeasurementPointEngName &&
            spec.MeasurementPointEngName.trim() !== ""
        );

      const hasAfterWashSpecs =
        Array.isArray(order.AfterWashSpecs) &&
        order.AfterWashSpecs.length > 0 &&
        order.AfterWashSpecs.some(
          (spec) =>
            spec.MeasurementPointEngName &&
            spec.MeasurementPointEngName.trim() !== ""
        );

      const hasMeasurement = hasBeforeWashSpecs || hasAfterWashSpecs;

      res.json({
        success: true,
        hasMeasurement: hasMeasurement,
        message: hasMeasurement
          ? "Measurement details found"
          : "No measurement details found for this order",
        debug: {
          orderNo: orderNo,
          foundRecord: true,
          measurementStructure: {
            hasBeforeWashSpecs: hasBeforeWashSpecs,
            hasAfterWashSpecs: hasAfterWashSpecs,
            beforeWashSpecsCount: order.BeforeWashSpecs?.length || 0,
            afterWashSpecsCount: order.AfterWashSpecs?.length || 0,
            orderData: {
              Order_No: order.Order_No,
              Style: order.Style
            }
          }
        }
      });
    } catch (error) {
      console.error("Error checking measurement details:", error);
      res.status(500).json({
        success: false,
        message: "Server error while checking measurement details",
        hasMeasurement: false,
        error: error.message
      });
    }
  }
);

app.post("/api/qc-washing/find-existing", async (req, res) => {
 
  try {
    const {
      orderNo,
      date,
      color,
      washType,
      before_after_wash,
      factoryName,
      reportType,
      washQty,
      inspectorId
    } = req.body;

    const dateValue = date
      ? new Date(date.length === 10 ? date + "T00:00:00.000Z" : date)
      : undefined;

    // Build the query to match ALL fields
    const query = {
      orderNo,
      date: dateValue,
      color,
      washType,
      before_after_wash,
      factoryName,
      washQty,
      "inspector.empId": inspectorId,
      reportType,
    };

    // Remove undefined or empty string fields from query
    Object.keys(query).forEach(
      (key) => (query[key] === undefined || query[key] === "") && delete query[key]
    );

    const record = await QCWashing.findOne(query);

    if (record) {
      res.json({ success: true, exists: true, record });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// In your Express backend
app.get('/api/qc-washing/load-saved-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const savedData = await QCWashing.findById(id);
    if (savedData) {
      // ...transform as needed, similar to your existing logic...
      res.json({ success: true, savedData });
    } else {
      res.json({ success: false, message: 'No saved data found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load saved data' });
  }
});


const inspectionMemoryStorage = multer.memoryStorage();

const uploadInspectionImage = multer({
  storage: inspectionMemoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  }
});

function normalizeInspectionImagePath(img) {
  if (!img) return "";

  // If new upload, img.file will be handled by fileMap logic in your code
  if (img.preview && typeof img.preview === "string") {
    if (img.preview.startsWith("./public/")) {
      return img.preview; // Keep the ./public format for consistency with defect images
    }
    if (img.preview.startsWith("/public/")) {
      return "." + img.preview; // Convert /public to ./public
    }
    if (img.preview.startsWith("/storage/")) {
      return "./public" + img.preview; // Convert /storage to ./public/storage
    }
    if (img.preview.startsWith("http")) {
      try {
        const url = new URL(img.preview);
        return "./public" + url.pathname; // Convert full URL to ./public path
      } catch (e) {
        return img.preview;
      }
    }

    // If it's just a filename (no slashes)
    if (!img.preview.includes("/")) {
      return `./public/storage/qc_washing_images/inspection/${img.preview}`;
    }

    // If it contains a slash but not at the start, treat as relative path
    if (img.preview[0] !== "/") {
      return `./public/storage/qc_washing_images/inspection/${img.preview}`;
    }

    // Fallback
    return img.preview;
  }

  // Fallback: if img.name exists, reconstruct path
  if (img.name && !img.name.includes("/")) {
    return `./public/storage/qc_washing_images/inspection/${img.name}`;
  }

  return "";
}



app.post('/api/qc-washing/inspection-save', uploadInspectionImage.any(), async (req, res) => {
  const standardValues = JSON.parse(req.body.standardValues || '{}');
  const actualValues = JSON.parse(req.body.actualValues || '{}');
  const machineStatus = JSON.parse(req.body.machineStatus || '{}');

  try {
    const { recordId } = req.body;
    const inspectionData = JSON.parse(req.body.inspectionData || '[]');
    const processData = JSON.parse(req.body.processData || '{}');
    const defectData = JSON.parse(req.body.defectData || '[]');

    if (!recordId) {
      return res.status(400).json({ success: false, message: "recordId is required" });
    }

    // Handle file uploads
    const uploadDir = path.join(__dirname, './public/storage/qc_washing_images/inspection');

    const fileMap = {};
    for (const file of (req.files || [])) {
      const fileExtension = path.extname(file.originalname);
      const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      
      // Use the same format as defect images - with ./public prefix
      fileMap[file.fieldname] = `./public/storage/qc_washing_images/inspection/${newFilename}`;
    }

    // Find or create the record
    let record = await QCWashing.findById(recordId);
    if (!record) {
      record = new QCWashing({ _id: recordId });
    }

    // Build machine processes with the new structure
    const machineProcesses = [];
    
    // Define the machine types and their parameters
    const machineTypes = {
      "Washing Machine": ["temperature", "time", "silicon", "softener"],
      "Tumble Dry": ["temperature", "time"]
    };

    Object.entries(machineTypes).forEach(([machineType, parameters]) => {
      const machineProcess = { machineType };
      
      parameters.forEach(param => {
        const actualVal = actualValues[machineType]?.[param];
        const standardVal = standardValues[machineType]?.[param];
        
        machineProcess[param] = {
          actualValue: actualVal === null || actualVal === undefined ? "" : actualVal,
          standardValue: standardVal === null || standardVal === undefined ? "" : standardVal,
          status: {
            ok: machineStatus[machineType]?.[param]?.ok || false,
            no: machineStatus[machineType]?.[param]?.no || false
          }
        };
      });
      
      machineProcesses.push(machineProcess);
    });

    // Build the inspection details
    record.inspectionDetails = {
      ...record.inspectionDetails,
      checkedPoints: (inspectionData || []).map((item, idx) => ({
        pointName: item.checkedList,
        decision: item.decision,
        comparison: (item.comparisonImages || []).map((img, imgIdx) => {
          if (fileMap[`comparisonImages_${idx}_${imgIdx}`]) {
            return fileMap[`comparisonImages_${idx}_${imgIdx}`];
          }
          return normalizeInspectionImagePath(img);
        }),
        remark: item.remark,
      })),
      
      machineProcesses: machineProcesses,
      parameters: (defectData || []).map(item => ({
        parameterName: item.parameter,
        checkedQty: item.checkedQty,
        defectQty: item.failedQty,
        passRate: item.passRate,
        result: item.result,
        remark: item.remark,
      })),
    };

    record.savedAt = new Date();
    record.status = 'processing';
    await record.save();

    res.json({ success: true, message: "Inspection data saved", data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.post('/api/qc-washing/inspection-update', uploadInspectionImage.any(), async (req, res) => {
  const standardValues = JSON.parse(req.body.standardValues || '{}');
  const actualValues = JSON.parse(req.body.actualValues || '{}');
  const machineStatus = JSON.parse(req.body.machineStatus || '{}');

  try {
    const { recordId } = req.body;
    const inspectionData = JSON.parse(req.body.inspectionData || '[]');
    const processData = JSON.parse(req.body.processData || '{}');
    const defectData = JSON.parse(req.body.defectData || '[]');

    if (!recordId) {
      return res.status(400).json({ success: false, message: "recordId is required" });
    }

    // Handle file uploads
    const uploadDir = path.join(__dirname, './public/storage/qc_washing_images/inspection');

    const fileMap = {};
    for (const file of (req.files || [])) {
      const fileExtension = path.extname(file.originalname);
      const newFilename = `inspection-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      
      // Use the same format as defect images - with ./public prefix
      fileMap[file.fieldname] = `./public/storage/qc_washing_images/inspection/${newFilename}`;
    }

    // Find the record
    let record = await QCWashing.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found for update" });
    }

    // Build machine processes with the new structure
    const machineProcesses = [];
    
    // Define the machine types and their parameters
    const machineTypes = {
      "Washing Machine": ["temperature", "time", "silicon", "softener"],
      "Tumble Dry": ["temperature", "time"]
    };

    Object.entries(machineTypes).forEach(([machineType, parameters]) => {
      const machineProcess = { machineType };
      
      parameters.forEach(param => {
        const actualVal = actualValues[machineType]?.[param];
        const standardVal = standardValues[machineType]?.[param];
        
        machineProcess[param] = {
          actualValue: actualVal === null || actualVal === undefined ? "" : actualVal,
          standardValue: standardVal === null || standardVal === undefined ? "" : standardVal,
          status: {
            ok: machineStatus[machineType]?.[param]?.ok || false,
            no: machineStatus[machineType]?.[param]?.no || false
          }
        };
      });
      
      machineProcesses.push(machineProcess);
    });

    // Build the inspection details
    record.inspectionDetails = {
      ...record.inspectionDetails,
      checkedPoints: (inspectionData || []).map((item, idx) => {
        const images = (item.comparisonImages || []).map((img, imgIdx) => {
          if (fileMap[`comparisonImages_${idx}_${imgIdx}`]) {
            return fileMap[`comparisonImages_${idx}_${imgIdx}`];
          }
          return normalizeInspectionImagePath(img);
        });

        return {
          pointName: item.checkedList,
          decision: item.decision,
          comparison: images,
          remark: item.remark,
        };
      }),
      
      machineProcesses: machineProcesses,
      parameters: (defectData || []).map(item => ({
        parameterName: item.parameter,
        checkedQty: item.checkedQty,
        defectQty: item.failedQty,
        passRate: item.passRate,
        result: item.result,
        remark: item.remark,
      })),
    };

    record.savedAt = new Date();
    await record.save();

    res.json({ success: true, message: "Inspection data updated", data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


const defectMemoryStorage = multer.memoryStorage();
const uploadDefectImage = multer({
  storage: defectMemoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
    }
  }
});
// Save defect details with images
app.post('/api/qc-washing/defect-details-save', uploadDefectImage.any(), async (req, res) => {
  try {
    const { recordId } = req.body;
    const defectDetails = JSON.parse(req.body.defectDetails || '{}');

    if (!recordId) return res.status(400).json({ success: false, message: "Missing recordId" });

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, './public/storage/qc_washing_images/defect');
    // if (!fs.existsSync(uploadDir)) {
    //   fs.mkdirSync(uploadDir, { recursive: true });
    // }

    // Map uploaded files by fieldname and write them to disk
    const fileMap = {};
    for (const file of (req.files || [])) {
      let fileExtension = path.extname(file.originalname);
      if (!fileExtension) {
        fileExtension = '.jpg';
      }
      const newFilename = `defect-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      fileMap[file.fieldname] = `./public/storage/qc_washing_images/defect/${newFilename}`;
    }

    // Attach image URLs to defectDetails.defectsByPc and additionalImages
    if (defectDetails.defectsByPc) {
      defectDetails.defectsByPc.forEach((pc, pcIdx) => {
        (pc.pcDefects || []).forEach((defect, defectIdx) => {
          
          if (defect.defectImages) {
            defect.defectImages = defect.defectImages.map((img, imgIdx) => {
              return fileMap[`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`]
              || (typeof img === "object" && img !== null && img.name ? img.name : img)
              || "";
            });
          }
        });
      });
    }

    if (defectDetails.additionalImages) {
      defectDetails.additionalImages = defectDetails.additionalImages.map((img, imgIdx) => {
        return fileMap[`additionalImages_${imgIdx}`] || (typeof img === "object" && img !== null && img.name ? img.name : img) || "";
      });
    }

    // Save to DB
    const doc = await QCWashing.findByIdAndUpdate(
      recordId,
      { 'defectDetails': defectDetails, updatedAt: new Date() },
      { new: true }
    );

    if (!doc) return res.status(404).json({ success: false, message: "Record not found" });

    res.json({ success: true, data: doc.defectDetails });

  } catch (err) {
    console.error('Defect details save error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update defect details with images
app.post('/api/qc-washing/defect-details-update', uploadDefectImage.any(), async (req, res) => {
  try {
    const { recordId } = req.body;
    const defectDetails = JSON.parse(req.body.defectDetails || '{}');
    if (!recordId) return res.status(400).json({ success: false, message: "Missing recordId" });

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, './public/storage/qc_washing_images/defect');
    // if (!fs.existsSync(uploadDir)) {
    //   fs.mkdirSync(uploadDir, { recursive: true });
    // }

    // Map uploaded files by fieldname and write them to disk
    const fileMap = {};
    for (const file of (req.files || [])) {
     let fileExtension = path.extname(file.originalname);
  if (!fileExtension) {
    // fallback to .jpg if no extension is found
    fileExtension = '.jpg';
  }
      const newFilename = `defect-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const fullFilePath = path.join(uploadDir, newFilename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      fileMap[file.fieldname] = `./public/storage/qc_washing_images/defect/${newFilename}`;
    }

    // Attach image URLs to defectDetails.defectsByPc and additionalImages
    if (defectDetails.defectsByPc) {
      defectDetails.defectsByPc.forEach((pc, pcIdx) => {
        (pc.pcDefects || []).forEach((defect, defectIdx) => {
          if (defect.defectImages) {
            defect.defectImages = defect.defectImages.map((img, imgIdx) => {
              return fileMap[`defectImages_${pcIdx}_${defectIdx}_${imgIdx}`] || img;
            });
          }
        });
      });
    }
    if (defectDetails.additionalImages) {
      defectDetails.additionalImages = defectDetails.additionalImages.map((img, imgIdx) => {
        return fileMap[`additionalImages_${imgIdx}`] || img;
      });
    }

    // Save to DB
    const doc = await QCWashing.findByIdAndUpdate(
      recordId,
      { 'defectDetails': defectDetails, updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, data: doc.defectDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function calculateMeasurementSizeSummary(measurementDetail) {
  if (!measurementDetail || !Array.isArray(measurementDetail.pcs)) {
    return {};
  }
  let checkedPcs = measurementDetail.pcs.length;
  let checkedPoints = 0;
  let totalPass = 0;
  let totalFail = 0;
  let plusToleranceFailCount = 0;
  let minusToleranceFailCount = 0;

  measurementDetail.pcs.forEach(pc => {
    (pc.measurementPoints || []).forEach(point => {
      checkedPoints++;
      if (point.result === 'pass') totalPass++;
      if (point.result === 'fail') {
        totalFail++;
        // Only count fail points for plus/minus tolerance
        const value = typeof point.measured_value_decimal === 'number'
          ? point.measured_value_decimal
          : parseFloat(point.measured_value_decimal);
        const specs = typeof point.specs === 'number'
          ? point.specs
          : parseFloat(point.specs);
        const tolMinus = typeof point.toleranceMinus === 'number'
          ? point.toleranceMinus
          : parseFloat(point.toleranceMinus);
        const tolPlus = typeof point.tolerancePlus === 'number'
          ? point.tolerancePlus
          : parseFloat(point.tolerancePlus);

        if (!isNaN(value) && !isNaN(specs)) {
          if (!isNaN(tolPlus) && value > tolPlus) plusToleranceFailCount++;
          if (!isNaN(tolMinus) && value < tolMinus) minusToleranceFailCount++;
        }
      }
    });
  });

  return {
    size: measurementDetail.size,
    checkedPcs,
    checkedPoints,
    totalPass,
    totalFail,
    plusToleranceFailCount,
    minusToleranceFailCount,
  };
}


// Save or update measurement details for a record
app.post('/api/qc-washing/measurement-save', async (req, res) => {
  try {
    const { recordId, measurementDetail } = req.body;
    if (!recordId || !measurementDetail) {
      return res.status(400).json({ success: false, message: "Missing recordId or measurementDetail" });
    }
    if (!measurementDetail.before_after_wash) {
      return res.status(400).json({ success: false, message: "before_after_wash is required in measurementDetail" });
    }
    const record = await QCWashing.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    // Ensure measurementDetails is an object with two arrays
    if (!record.measurementDetails) {
      record.measurementDetails = { measurement: [], measurementSizeSummary: [] };
    }
    // Remove existing
    record.measurementDetails.measurement = (record.measurementDetails.measurement || []).filter(
      m => !(m.size === measurementDetail.size && m.before_after_wash === measurementDetail.before_after_wash)
    );
    record.measurementDetails.measurementSizeSummary = (record.measurementDetails.measurementSizeSummary || []).filter(
      s => !(s.size === measurementDetail.size && s.before_after_wash === measurementDetail.before_after_wash)
    );
    // Calculate summary
    const summary = calculateMeasurementSizeSummary(measurementDetail);
    // Add new
    record.measurementDetails.measurement.push(measurementDetail);
    record.measurementDetails.measurementSizeSummary.push(summary);
    record.savedAt = new Date();
    await record.save();
    res.json({ success: true, message: "Measurement detail saved", measurementDetails: record.measurementDetails });
  } catch (err) {
    console.error('Measurement save error:', err);
    res.status(500).json({ success: false, message: "Failed to save measurement detail" });
  }
});



app.post('/api/qc-washing/measurement-summary-autosave/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const summary = req.body.summary || {};
    const qcRecord = await QCWashing.findById(recordId);
    if (!qcRecord) return res.status(404).json({ success: false, message: 'Record not found.' });

    // Accept both totalCheckedPoints and totalCheckedPcs for compatibility
    qcRecord.totalCheckedPoint = summary.totalCheckedPoints ?? summary.totalCheckedPcs ?? 0;
    qcRecord.totalCheckedPcs = summary.totalCheckedPcs ?? summary.totalCheckedPoints ?? 0; 
    qcRecord.totalPass = summary.totalPass ?? 0;
    qcRecord.totalFail = summary.totalFail ?? 0;
    qcRecord.passRate = summary.passRate ?? 0;
    qcRecord.measurementOverallResult = summary.overallResult || summary.overallFinalResult || "PENDING";
    qcRecord.savedAt = new Date();

    await qcRecord.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Measurement summary autosave error:', error);
    res.status(500).json({ success: false, message: 'Failed to autosave measurement summary.' });
  }
});

// Get all submitted QC washing data
app.get("/api/qc-washing/all-submitted", async (req, res) => {
  try {
    const submittedData = await QCWashing.find({ status: ['submitted' , 'processing']})
      .sort({ updatedAt: -1 })
      .lean();

    // Return in the format expected by frontend
    res.json({
      success: true,
      data: submittedData,
      count: submittedData.length
    });
  } catch (error) {
    console.error("Error fetching submitted QC washing data:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch submitted QC washing data", 
      message: error.message 
    });
  }
});

// Get specific submitted QC washing data by ID
app.get("/api/qc-washing/submitted/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the ID format (assuming MongoDB ObjectId)
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const reportData = await QCWashing.findById(id).lean();
    
    if (!reportData) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Transform the data to match the expected format for the modal
    const transformedData = {
      ...reportData,
      colorName: reportData.color, // Map color to colorName for consistency
      formData: {
        result: reportData.overallFinalResult,
        remarks: reportData.defectDetails?.comment || "",
        measurements: reportData.measurementDetails?.measurement || []
      }
    };

    res.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error("Error fetching QC washing report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report data",
      error: error.message
    });
  }
});

app.get('/api/qc-washing/comparison', async (req, res) => {
  const { orderNo, color, washType, reportType, factory, before_after_wash } = req.query;
  
  const filter = {
    orderNo,
    color,
    washType,
    reportType,
    factoryName: factory,
    before_after_wash: before_after_wash || 'Before Wash' 
  };
  
  const comparisonRecord = await QCWashing.findOne(filter);
  res.json(comparisonRecord);
});

app.get('/api/qc-washing/results', async (req, res) => {
  try {
    const { orderNo, color, washType, reportType, factory } = req.query;
    
    const query = {};
    if (orderNo) query.orderNo = orderNo;
    if (color) query.color = color;
    if (washType) query.washType = washType;
    if (reportType) query.reportType = reportType;
    if (factory) query.factoryName = factory;
    
    const results = await QCWashing.find(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image proxy endpoint to convert images to base64
app.get('/api/image-base64/*', async (req, res) => {
  try {
    const imagePath = req.params[0];
    console.log('📥 Image request received for:', imagePath);
    
    // Security checks
    if (imagePath.includes('..') || imagePath.includes('~')) {
      console.log('❌ Security check failed: Invalid path characters');
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }
    
    const fullPath = path.resolve(path.join(__dirname, 'public', 'storage', imagePath));
    const allowedDir = path.resolve(path.join(__dirname, 'public', 'storage'));
    
    console.log('📁 Full path:', fullPath);
    console.log('📁 Allowed dir:', allowedDir);
    
    if (!fullPath.startsWith(allowedDir)) {
      console.log('❌ Security check failed: Path outside allowed directory');
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log('❌ File not found:', fullPath);
      return res.status(404).json({ success: false, error: 'Image not found' });
    }
    
    // Check file size
    const stats = fs.statSync(fullPath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    console.log('📊 File stats:', { size: stats.size, modified: stats.mtime });
    
    if (stats.size > maxSize) {
      console.log('❌ File too large:', stats.size);
      return res.status(413).json({ 
        success: false, 
        error: 'Image too large' 
      });
    }
    
    // Generate ETag for caching
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=3600');
    
    // Check if client has cached version
    if (req.headers['if-none-match'] === etag) {
      console.log('✅ Returning cached version (304)');
      return res.status(304).end();
    }
    
    // Read and convert image
    console.log('🔄 Reading and converting image...');
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(fullPath);
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('✅ Image converted successfully:', {
      mimeType,
      originalSize: stats.size,
      base64Length: base64Image.length
    });
    
    res.json({ 
      success: true, 
      dataUrl,
      size: stats.size,
      mimeType 
    });
    
  } catch (error) {
    console.error('❌ Error serving image:', error);
    res.status(500).json({ success: false, error: 'Error serving image' });
  }
});

// Helper function for MIME types
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/jpeg';
};


// Add this to your backend server configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// GET /api/users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const userList = await UserMain.find(
      { working_status: "Working" }, // Optional: only get active users
      {
        _id: 1,
        emp_id: 1,
        eng_name: 1,
        name: 1,
        dept_name: 1,
        sect_name: 1,
        job_title: 1
      }
    ).sort({ eng_name: 1 });

    // Transform the data to match what your frontend expects
    const transformedUsers = userList.map(user => ({
      userId: user.emp_id,        // Map emp_id to userId
      _id: user._id,
      name: user.eng_name,        // Use eng_name as the display name
      username: user.name,        // Keep original name as username
      emp_id: user.emp_id,
      eng_name: user.eng_name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      job_title: user.job_title
    }));

    res.json({
      success: true,
      users: transformedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});


/* -------------------------------------------
   End Points - Supplier Issues Configuration
------------------------------------------- */

// GET all supplier issue configurations
app.get("/api/supplier-issues/defects", async (req, res) => {
  try {
    const configs = await SupplierIssuesDefect.find().sort({ factoryType: 1 });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch configurations." });
  }
});

// GET a specific configuration by factory type
app.get("/api/supplier-issues/defects/:factoryType", async (req, res) => {
  try {
    const config = await SupplierIssuesDefect.findOne({
      factoryType: req.params.factoryType
    });
    if (!config) {
      return res.status(404).json({ error: "Configuration not found." });
    }
    // Sort defect list by the 'no' field
    config.defectList.sort((a, b) => a.no - b.no);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch configuration." });
  }
});

// POST a new Factory Type (creates a new document)
app.post("/api/supplier-issues/defects", async (req, res) => {
  try {
    const { factoryType } = req.body;
    if (!factoryType) {
      return res.status(400).json({ error: "Factory type is required." });
    }
    const newConfig = new SupplierIssuesDefect({ factoryType });
    await newConfig.save();
    res.status(201).json(newConfig);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "This Factory Type already exists." });
    }
    res.status(400).json({ error: "Failed to create configuration." });
  }
});

// POST (add) a new Factory Name to a specific Factory Type's list
app.post(
  "/api/supplier-issues/defects/:factoryType/factories",
  async (req, res) => {
    try {
      const { factoryType } = req.params;
      const { factoryName } = req.body;
      if (!factoryName) {
        return res.status(400).json({ error: "Factory name is required." });
      }
      const result = await SupplierIssuesDefect.updateOne(
        { factoryType },
        { $addToSet: { factoryList: factoryName } } // $addToSet prevents duplicates
      );
      if (result.nModified === 0 && result.n === 0)
        return res.status(404).json({ error: "Factory type not found." });
      res.status(200).json({ message: "Factory name added successfully." });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Server error while adding factory name." });
    }
  }
);

// PUT (update) a Factory Name
app.put(
  "/api/supplier-issues/defects/:factoryType/factories",
  async (req, res) => {
    try {
      const { factoryType } = req.params;
      const { oldName, newName } = req.body;
      if (!oldName || !newName) {
        return res
          .status(400)
          .json({ error: "Old and new factory names are required." });
      }
      const result = await SupplierIssuesDefect.updateOne(
        { factoryType, factoryList: oldName },
        { $set: { "factoryList.$": newName } }
      );
      if (result.nModified === 0)
        return res
          .status(404)
          .json({ error: "Factory name not found or no change made." });
      res.status(200).json({ message: "Factory name updated successfully." });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Server error while updating factory name." });
    }
  }
);

// DELETE a Factory Name
app.delete(
  "/api/supplier-issues/defects/:factoryType/factories",
  async (req, res) => {
    try {
      const { factoryType } = req.params;
      const { factoryName } = req.body;
      const result = await SupplierIssuesDefect.updateOne(
        { factoryType },
        { $pull: { factoryList: factoryName } }
      );
      if (result.nModified === 0)
        return res.status(404).json({ error: "Factory name not found." });
      res.status(200).json({ message: "Factory name deleted successfully." });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Server error while deleting factory name." });
    }
  }
);

// POST (add) a new Defect to a specific Factory Type's list
app.post(
  "/api/supplier-issues/defects/:factoryType/defects",
  async (req, res) => {
    try {
      const { factoryType } = req.params;
      const { defectNameEng, defectNameKhmer, defectNameChi } = req.body;
      if (!defectNameEng) {
        return res
          .status(400)
          .json({ error: "Defect Name (English) is required." });
      }

      const config = await SupplierIssuesDefect.findOne({ factoryType });
      if (!config) {
        return res.status(404).json({ error: "Factory type not found." });
      }

      const nextNo =
        config.defectList.length > 0
          ? Math.max(...config.defectList.map((d) => d.no)) + 1
          : 1;

      const newDefect = {
        no: nextNo,
        defectNameEng,
        defectNameKhmer,
        defectNameChi
      };

      await SupplierIssuesDefect.updateOne(
        { factoryType },
        { $push: { defectList: newDefect } }
      );
      res
        .status(201)
        .json({ message: "Defect added successfully.", defect: newDefect });
    } catch (error) {
      res.status(500).json({ error: "Server error while adding defect." });
    }
  }
);

// PUT (update) a Defect
app.put(
  "/api/supplier-issues/defects/:factoryType/defects/:defectId",
  async (req, res) => {
    try {
      const { factoryType, defectId } = req.params;
      const updateData = req.body;

      const updateFields = {};
      for (const key in updateData) {
        updateFields[`defectList.$.${key}`] = updateData[key];
      }

      const result = await SupplierIssuesDefect.updateOne(
        { factoryType, "defectList._id": defectId },
        { $set: updateFields }
      );

      if (result.nModified === 0)
        return res
          .status(404)
          .json({ error: "Defect not found or no change made." });
      res.status(200).json({ message: "Defect updated successfully." });
    } catch (error) {
      res.status(500).json({ error: "Server error while updating defect." });
    }
  }
);

// DELETE a Defect
app.delete(
  "/api/supplier-issues/defects/:factoryType/defects/:defectId",
  async (req, res) => {
    try {
      const { factoryType, defectId } = req.params;

      const result = await SupplierIssuesDefect.updateOne(
        { factoryType },
        { $pull: { defectList: { _id: defectId } } }
      );

      if (result.nModified === 0)
        return res.status(404).json({ error: "Defect not found." });
      res.status(200).json({ message: "Defect deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: "Server error while deleting defect." });
    }
  }
);

/* -------------------------------------------
   End Points - Supplier Issues Reports
------------------------------------------- */

// NEW: GET an existing report based on key fields
app.get("/api/supplier-issues/reports/find-existing", async (req, res) => {
  try {
    const { reportDate, inspectorId, factoryType, factoryName, moNo, colors } =
      req.query;

    if (
      !reportDate ||
      !inspectorId ||
      !factoryType ||
      !factoryName ||
      !moNo ||
      !colors
    ) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters." });
    }

    const searchDate = new Date(reportDate);
    searchDate.setUTCHours(0, 0, 0, 0);

    const colorArray = Array.isArray(colors) ? colors : colors.split(",");

    const filter = {
      reportDate: searchDate,
      inspectorId,
      factoryType,
      factoryName,
      moNo,
      colors: { $all: colorArray, $size: colorArray.length }
    };

    const report = await SupplierIssueReport.findOne(filter);

    if (!report) {
      return res.status(404).json({ message: "No existing report found." });
    }

    res.json(report);
  } catch (error) {
    console.error("Error finding existing report:", error);
    res.status(500).json({ error: "Failed to fetch existing report data." });
  }
});

// UPDATED: POST endpoint now handles creating AND updating (upsert)
app.post("/api/supplier-issues/reports", async (req, res) => {
  try {
    const {
      reportDate,
      inspectorId,
      factoryType,
      factoryName,
      moNo,
      colors,
      ...updateData
    } = req.body;

    // Standardize date to midnight UTC for consistent querying
    const searchDate = new Date(reportDate);
    searchDate.setUTCHours(0, 0, 0, 0);

    const filter = {
      reportDate: searchDate,
      inspectorId,
      factoryType,
      factoryName,
      moNo,
      // Ensure color array matching is order-agnostic
      colors: { $all: colors.sort(), $size: colors.length }
    };

    // Add the sorted colors to the data that will be set
    const finalUpdateData = {
      ...updateData,
      colors: colors.sort(), // Store colors consistently
      reportDate: searchDate // Store standardized date
    };

    const options = {
      new: true, // Return the modified document
      upsert: true, // Create a new doc if no match is found
      runValidators: true
    };

    const updatedReport = await SupplierIssueReport.findOneAndUpdate(
      filter,
      { $set: finalUpdateData },
      options
    );

    res
      .status(200)
      .json({ message: "Report saved successfully", data: updatedReport });
  } catch (error) {
    console.error("Error saving supplier issue report:", error);
    res
      .status(400)
      .json({ error: "Failed to save report.", details: error.message });
  }
});

// --- NEW ENDPOINT 1: Get filtered supplier issue reports ---
app.get("/api/supplier-issues/reports/summary", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      moNos,
      colors,
      qcIds,
      factoryType,
      factoryNames
    } = req.query;

    const filter = {};

    // 1. Date Range Filter
    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) {
        filter.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        // To include the whole end day, set to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.reportDate.$lte = endOfDay;
      }
    }

    // 2. Array Filters ($in operator)
    if (moNos) filter.moNo = { $in: moNos.split(",") };
    if (colors) filter.colors = { $in: colors.split(",") };
    if (qcIds) filter.inspectorId = { $in: qcIds.split(",") };
    if (factoryNames) filter.factoryName = { $in: factoryNames.split(",") };

    // 3. Single Value Filter
    if (factoryType) filter.factoryType = factoryType;

    const reports = await SupplierIssueReport.find(filter)
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (error) {
    console.error("Error fetching supplier issue reports summary:", error);
    res.status(500).json({ error: "Failed to fetch report data." });
  }
});

// --- NEW ENDPOINT 2: Get all available options for filters ---
app.get("/api/supplier-issues/report-options", async (req, res) => {
  try {
    const [moNos, colors, qcIds, factoryTypes, factoryNames] =
      await Promise.all([
        SupplierIssueReport.distinct("moNo"),
        SupplierIssueReport.distinct("colors"),
        SupplierIssueReport.distinct("inspectorId"),
        SupplierIssueReport.distinct("factoryType"),
        SupplierIssueReport.distinct("factoryName")
      ]);

    res.json({
      moNos: moNos.sort(),
      colors: colors.sort(),
      qcIds: qcIds.sort(),
      factoryTypes: factoryTypes.sort(),
      factoryNames: factoryNames.sort()
    });
  } catch (error) {
    console.error("Error fetching report filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options." });
  }
});


/* ------------------------------
  QC2-Upload-Data
------------------------------ */
// Key function
  function makeKey(row) {
    return [
      row.Inspection_date || '',
      row.QC_ID || ''
    ].join("|");
  }
  
app.post('/api/upload-qc2-data', async (req, res) => {
  try {
    const { outputData, defectData } = req.body;
    
    // Define washing line identifiers
    const washingLineIdentifiers = [
      'Washing',
      'WASHING', 
      'washing',
      'Wash',
      'WASH',
      'wash',
    ];
    
    // Function to check if a line is washing-related
    const isWashingLine = (lineName) => {
      if (!lineName) return false;
      return washingLineIdentifiers.includes(lineName.trim());
    };

    const allDefects = await QC2OlderDefect.find({}).lean();
    const allDefectsArr = allDefects.map(d => ({
      defectName: (d.defectName || '').trim().toLowerCase(),
      defectCode: d.defectCode,
      English: (d.English || '').trim().toLowerCase(),
      Khmer: (d.Khmer || '').trim().toLowerCase(),
      Chinese: (d.Chinese || '').trim().toLowerCase(),
    }));

    // Standardize field names (existing code)
    const outputRows = outputData.map(row => ({
      ...row,
      Inspection_date: row['日期'] || row['BillDate'] || '',
      QC_ID: row['工号'] || row['EmpID'] || '',
      WorkLine: row['打菲组别'] || row['Batch Group'] || row['组名'] || row['WorkLine'] || '',
      MONo: row['款号'] || row['ModelNo'] || row['MoNo'] || row['StyleNo'] || row['Style_No'] || row['型号'] || '',
      SeqNo: row['工序号'] || row['SeqNo'] || '',
      ColorNo: row['颜色'] || row['ColorNo'] || '',
      ColorName: row['颜色'] || row['ColorName'] || '',
      SizeName: row['尺码'] || row['SizeName'] || '',
      Qty: row['数量'] || row['Qty'] || 0,
    }));

    const defectRows = defectData.map(row => {
      const defectNameRaw = (row['疵点名称'] || row['ReworkName'] || '').trim().toLowerCase();
      let found = allDefectsArr.find(d =>
        defectNameRaw === d.defectName ||
        (d.English && defectNameRaw.includes(d.English)) ||
        (d.Khmer && defectNameRaw.includes(d.Khmer)) ||
        (d.Chinese && defectNameRaw.includes(d.Chinese)) ||
        (d.English && d.English.includes(defectNameRaw)) ||
        (d.Khmer && d.Khmer.includes(defectNameRaw)) ||
        (d.Chinese && d.Chinese.includes(defectNameRaw))
      );

      let defectCode = found ? found.defectCode : '';

      return {
        ...row,
        Inspection_date: row['日期'] || row['dDate'] || '',
        QC_ID: row['工号'] || row['EmpID_QC'] || '',
        WorkLine: row['组名'] || row['WorkLine'] || 'N/A',
        MONo: row['款号'] || row['ModelNo'] || row['MoNo'] || row['StyleNo'] || row['Style_No'] || row['型号'] || '',
        ColorNo: row['颜色'] || row['ColorNo'] || '',
        ColorName: row['颜色'] || row['ColorName'] || '',
        SizeName: row['尺码'] || row['SizeName'] || '',
        ReworkCode: defectCode, 
        ReworkName: defectNameRaw,
        Defect_Qty: row['数量'] || row['Defect_Qty'] || 0,
      };
    });

    // Build outputMap and defectMap (existing code)
    const outputMap = new Map();
    for (const row of outputRows) {
      const key = makeKey(row);
      if (!outputMap.has(key)) outputMap.set(key, []);
      outputMap.get(key).push(row);
    }

    const defectMap = new Map();
    for (const row of defectRows) {
      const key = makeKey(row);
      if (!defectMap.has(key)) defectMap.set(key, []);
      defectMap.get(key).push(row);
    }

    // Merge and Build Documents
    const docs = new Map();
    const washingQtyData = new Map(); 

    const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);

    for (const key of allKeys) {
      const outputRows = outputMap.get(key) || [];
      const defectRows = defectMap.get(key) || [];

      const [Inspection_date_str, QC_ID_raw] = key.split("|");
      const QC_ID = QC_ID_raw === "6335" ? "YM6335" : QC_ID_raw;
      const Inspection_date = Inspection_date_str ? new Date(Inspection_date_str + "T00:00:00Z") : null;

      // Output grouping (existing code)
      const outputGroup = {};
      for (const r of outputRows) {
        const oKey = [r.WorkLine, r.MONo, r.ColorName, r.SizeName].join("|");
        if (!outputGroup[oKey]) outputGroup[oKey] = [];
        outputGroup[oKey].push(r);
      }

      const Output_data = Object.values(outputGroup).map(rows => ({
        Line_no: rows[0]?.WorkLine || '',
        MONo: rows[0]?.MONo || '',
        Color: rows[0]?.ColorName || '',
        Size: rows[0]?.SizeName || '',
        Qty: rows.reduce((sum, r) => sum + Number(r.Qty || 0), 0)
      }));

      // Output summary (existing code)
      const outputSummaryMap = new Map();
      for (const o of Output_data) {
        const key = `${o.Line_no}|${o.MONo}`;
        if (!outputSummaryMap.has(key)) {
          outputSummaryMap.set(key, { Line: o.Line_no, MONo: o.MONo, Qty: 0 });
        }
        outputSummaryMap.get(key).Qty += o.Qty;
      }

      const Output_data_summary = Array.from(outputSummaryMap.values());
      const TotalOutput = Output_data_summary.reduce((sum, o) => sum + o.Qty, 0);

      // MODIFIED: Only create washing quantity data for washing lines
      // But don't include Line_no in the washing data structure
      const washingQtyMap = new Map();
      for (const o of Output_data) {
        // Only process if this is a washing line
        if (isWashingLine(o.Line_no)) {
          const washKey = `${Inspection_date_str}|${QC_ID}|${o.MONo}|${o.Color}`;
          if (!washingQtyMap.has(washKey)) {
            washingQtyMap.set(washKey, {
              Inspection_date: Inspection_date,
              QC_ID: QC_ID,
              Style_No: o.MONo,
              Color: o.Color,
              Wash_Qty: 0
              // Note: Line_no is NOT included here
            });
          }
          washingQtyMap.get(washKey).Wash_Qty += o.Qty;
        }
      }

      // Add to global washing quantity data map (only washing lines)
      for (const [washKey, washData] of washingQtyMap) {
        if (!washingQtyData.has(washKey)) {
          washingQtyData.set(washKey, washData);
        } else {
          washingQtyData.get(washKey).Wash_Qty += washData.Wash_Qty;
        }
      }

      // Rest of the existing code for defects processing...
      const defectGroup = {};
      for (const d of defectRows) {
        const dKey = [d.WorkLine, d.MONo, d.ColorName, d.SizeName].join("|");
        if (!defectGroup[dKey]) defectGroup[dKey] = [];
        defectGroup[dKey].push(d);
      }

      const Defect_data = Object.entries(defectGroup).map(([dKey, rows]) => {
        let TotalDefect = 0;
        const defectDetailsMap = new Map();

        for (const d of rows) {
          const ddKey = d.ReworkCode + "|" + d.ReworkName;
          if (!defectDetailsMap.has(ddKey)) {
            defectDetailsMap.set(ddKey, {
              Defect_code: d.ReworkCode || '',
              Defect_name: d.ReworkName || '',
              Qty: 0
            });
          }
          defectDetailsMap.get(ddKey).Qty += Number(d.Defect_Qty || 0);
          TotalDefect += Number(d.Defect_Qty || 0);
        }

        const [Line_no, MONo, Color, Size] = dKey.split("|");
        return {
          Line_no: Line_no || '',
          MONo: MONo || '',
          Color: Color || '',
          Size: Size || '',
          Defect_qty: TotalDefect,
          DefectDetails: Array.from(defectDetailsMap.values())
        };
      });

      // Defect summary
      const defectSummaryMap = new Map();
      for (const d of Defect_data) {
        const key = `${d.Line_no}|${d.MONo}`;
        if (!defectSummaryMap.has(key)) {
          defectSummaryMap.set(key, { Line_no: d.Line_no, MONo: d.MONo, Defect_Qty: 0, Defect_Details: [] });
        }
        defectSummaryMap.get(key).Defect_Qty += d.Defect_qty;

        const detailsMap = new Map(defectSummaryMap.get(key).Defect_Details.map(dd => [
          `${dd.Defect_code}|${dd.Defect_name}`, { ...dd }
        ]));

        for (const dd of d.DefectDetails) {
          const ddKey = `${dd.Defect_code}|${dd.Defect_name}`;
          if (!detailsMap.has(ddKey)) {
            detailsMap.set(ddKey, { ...dd });
          } else {
            detailsMap.get(ddKey).Qty += dd.Qty;
          }
        }

        defectSummaryMap.get(key).Defect_Details = Array.from(detailsMap.values());
      }

      const Defect_data_summary = Array.from(defectSummaryMap.values());
      const TotalDefect = Defect_data_summary.reduce((sum, d) => sum + d.Defect_Qty, 0);

      docs.set(key, {
        Inspection_date,
        QC_ID,
        report_type: "Inline Finishing",
        Seq_No: [
          ...new Set(
            outputRows.map(r => Number(r.SeqNo || 0))
          )
        ],
        TotalOutput,
        TotalDefect,
        Output_data,
        Output_data_summary,
        Defect_data,
        Defect_data_summary
      });
    }

    const finalDocs = Array.from(docs.values());
    const washingQtyDocs = Array.from(washingQtyData.values());

    res.json({ finalDocs, washingQtyDocs });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process and save QC2 data.' });
  }
});


// routes/qc2.js (add this to the same file)
app.get('/api/fetch-qc2-data', async (req, res) => {
  try {
     const results = await QCWorkers.find({}).lean();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch QC2 data.' });
  }
});

app.post('/api/manual-save-qc2-data', async (req, res) => {
  try {
    const { finalDocs, washingQtyData } = req.body;

    if (!Array.isArray(finalDocs) || finalDocs.length === 0) {
      return res.status(400).json({ error: 'No QC data to save.' });
    }

    // QC data bulk operations
    const bulkOps = finalDocs.map(doc => ({
      updateOne: {
        filter: {
          Inspection_date: doc.Inspection_date instanceof Date ? doc.Inspection_date : new Date(doc.Inspection_date),
          QC_ID: doc.QC_ID
        },
        update: { $set: doc },
        upsert: true
      }
    }));

    let washingBulkOps = [];
    if (Array.isArray(washingQtyData) && washingQtyData.length > 0) {
      washingBulkOps = washingQtyData.map(doc => ({
        updateOne: {
          filter: {
            Inspection_date: doc.Inspection_date instanceof Date ? doc.Inspection_date : new Date(doc.Inspection_date),
            QC_ID: doc.QC_ID,
            Style_No: doc.Style_No,
            Color: doc.Color
          },
          update: { $set: doc },
          upsert: true
        }
      }));
    }

    // Execute both bulk operations
    const results = [];
    
    if (bulkOps.length > 0) {
      try {
        const qcResult = await QCWorkers.bulkWrite(bulkOps);
        results.push({ type: 'QC', result: qcResult });
      } catch (qcError) {
        console.error('QC bulk write error:', qcError);
        return res.status(500).json({ 
          error: 'Failed to save QC data', 
          details: qcError.message 
        });
      }
    }

    if (washingBulkOps.length > 0) {
      try {
        const washingResult = await QCWashingQtyOld.bulkWrite(washingBulkOps);
        results.push({ type: 'Washing', result: washingResult });
      } catch (washingError) {
        console.error('Washing bulk write error:', washingError);
        return res.status(500).json({ 
          error: 'Failed to save washing data', 
          details: washingError.message 
        });
      }
    }

    res.json({ 
      success: true, 
      qcDataCount: bulkOps.length,
      washingQtyCount: washingBulkOps.length,
      results: results
    });

  } catch (err) {
    console.error('Manual save error:', err);
    res.status(500).json({ 
      error: 'Failed to manually save QC2 data.',
      details: err.message
    });
  }
});

// New endpoint to fetch washing quantity data
app.get('/api/fetch-washing-qty-data', async (req, res) => {
  try {
    const results = await QCWashingQtyOld.find({}).lean();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch washing quantity data.' });
  }
});

// routes/qc2.js (add this to the same file)
app.get("/api/fetch-qc2-data", async (req, res) => {
  try {
    const results = await QCWorkers.find({}).lean();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch QC2 data." });
  }
});

app.post("/api/manual-save-qc2-data", async (req, res) => {
  try {
    const { finalDocs, washingQtyData } = req.body;

    if (!Array.isArray(finalDocs) || finalDocs.length === 0) {
      return res.status(400).json({ error: "No QC data to save." });
    }

    // QC data bulk operations
    const bulkOps = finalDocs.map((doc) => ({
      updateOne: {
        filter: {
          Inspection_date:
            doc.Inspection_date instanceof Date
              ? doc.Inspection_date
              : new Date(doc.Inspection_date),
          QC_ID: doc.QC_ID
        },
        update: { $set: doc },
        upsert: true
      }
    }));

    // Washing quantity data bulk operations (only washing data, no Line_no field)
    let washingBulkOps = [];
    if (Array.isArray(washingQtyData) && washingQtyData.length > 0) {
      washingBulkOps = washingQtyData.map((doc) => ({
        updateOne: {
          filter: {
            Inspection_date:
              doc.Inspection_date instanceof Date
                ? doc.Inspection_date
                : new Date(doc.Inspection_date),
            QC_ID: doc.QC_ID,
            Style_No: doc.Style_No,
            Color: doc.Color
            // Note: No Line_no in filter since it's not stored
          },
          update: { $set: doc },
          upsert: true
        }
      }));
    }

    // Execute both bulk operations
    const results = [];

    if (bulkOps.length > 0) {
      try {
        const qcResult = await QCWorkers.bulkWrite(bulkOps);
        results.push({ type: "QC", result: qcResult });
      } catch (qcError) {
        console.error("QC bulk write error:", qcError);
        return res.status(500).json({
          error: "Failed to save QC data",
          details: qcError.message
        });
      }
    }

    if (washingBulkOps.length > 0) {
      try {
        const washingResult = await QCWashingQtyOld.bulkWrite(washingBulkOps);
        results.push({ type: "Washing", result: washingResult });
      } catch (washingError) {
        console.error("Washing bulk write error:", washingError);
        return res.status(500).json({
          error: "Failed to save washing data",
          details: washingError.message
        });
      }
    }

    res.json({
      success: true,
      qcDataCount: bulkOps.length,
      washingQtyCount: washingBulkOps.length,
      results: results
    });
  } catch (err) {
    console.error("Manual save error:", err);
    res.status(500).json({
      error: "Failed to manually save QC2 data.",
      details: err.message
    });
  }
});

// New endpoint to fetch washing quantity data
app.get("/api/fetch-washing-qty-data", async (req, res) => {
  try {
    const results = await QCWashingQtyOld.find({}).lean();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch washing quantity data." });
  }
});

/* ------------------------------
   AI Chatbot Proxy Route
------------------------------ */

app.post("/api/ai/ask", async (req, res) => {
  // Destructure both question and selectedModel from the request body
  const { question, selectedModel } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    // Forward the request to the Python Flask AI service
    // This URL must match where your Python service is running.
    const aiServiceResponse = await axios.post("http://localhost:5002/ask", {
      // Pass both pieces of data to the Python service
      question: question,
      selectedModel: selectedModel
    });

    // Send the response from the AI service back to the React client
    res.json(aiServiceResponse.data);
  } catch (error) {
    console.error("Error proxying request to AI service:", error.message);

    // Provide a user-friendly error message
    res.status(502).json({
      answer:
        "Sorry, I'm having trouble connecting to my brain right now. Please try again later."
    });
  }
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ HTTPS Server is running on https://localhost:${PORT}`);
});
