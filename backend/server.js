
import axios from "axios";

import multer from "multer";
import path from "path";
import { promises as fsPromises } from "fs";

import mongoose from "mongoose";
import sharp from "sharp";

import { app, server, PORT, API_BASE_URL } from "./Config/appConfig.js";

const __filename = fileURLToPath(import.meta.url);
export const __backendDir = path.dirname(__filename);
import { fileURLToPath } from "url";

import { 
  ymProdConnection ,
  UserMain,
  UserProd,
  RoleManagment,
  QC2Task,
  IEWorkerTask,
  SewingDefects,
  CuttingInspection,
  HTFirstOutput,
  FUFirstOutput,
  SCCDailyTesting,
  DailyTestingFUQC,
  DailyTestingHTFU,
  HTInspectionReport,
  ElasticReport,
  EMBDefect,
  PrintingDefect,
  EMBReport,
  QADefectsModel,
  QCAccuracyReportModel,
  QAStandardDefectsModel,
  BuyerSpecTemplate,
  ANFMeasurementReport,
  SizeCompletionStatus,
  QCWashing,
  SupplierIssueReport,
  SupplierIssuesDefect,
  QC2OlderDefect,
} from "./controller/MongoDB/dbConnectionController.js";
import {    
  sanitize, } from "./Helpers/helperFunctions.js";
import qcRealWashQty from "./routes/QC_Real_Wash_Qty/QcRealWashQtyRoute.js";
import aql from "./routes/AQL/AQLRoutes.js";
import accessoryIssue from "./routes/AccessoryIssue/accessoryIssueRoutes.js";
import audit from "./routes/Audit/auditRoutes.js";
import bundle from "./routes/Bundle/bundelRoutes.js";
import auth from "./routes/User/authRoutes.js";
import roleManagement from "./routes/User/roleManagementRoutes.js";
import user from "./routes/User/userRoutes.js";
import cutPanelOrder from "./routes/Cutting/cutPanelOrderRoutes.js";
import cuttingFabricDefect from "./routes/Cutting/cuttingFabricDefectRoutes.js";
import cuttingImageUpload from "./routes/Cutting/cuttingImageUploadRoutes.js";
import cuttinginspection from "./routes/Cutting/cuttingInspectionRoutes.js";
import cuttingissue from "./routes/Cutting/cuttingIssueRoutes.js";
import cuttingMeasurement from "./routes/Cutting/cuttingMeasurementRoutes.js";
import cuttingOrder from "./routes/Cutting/cuttingOrderRoutes.js";
import cuttingTrend from "./routes/Cutting/cuttingTrendRoutes.js";
import cuttingReport from "./routes/Cutting/reportRoutes.js";
import sewingDefect from "./routes/Defects/sewingDefectRoutes.js";
import digitalMeasurement from "./routes/DigitalMeasurement/digitalMeasurmentRoutes.js";
import downloadData from "./routes/DownloadData/downloaddataRoutes.js";
import ironing from "./routes/Ironing/ironingRoutes.js";
import ironingDashboard from "./routes/LiveDashboard/ironingDashboardRoutes.js";
import opaDashboard from "./routes/LiveDashboard/opaDashboardRoutes.js";
import packingDashboard from "./routes/LiveDashboard/packingDashboardRoutes.js";
import processDashboard from "./routes/LiveDashboard/processDashboardRoutes.js";
import qc1Dashboard from "./routes/LiveDashboard/qc1DashboardRoutes.js";
import qc2dashboard from "./routes/LiveDashboard/qc2DashboardRoutes.js";
import washingDashboard from "./routes/LiveDashboard/washingDashboardRoutes.js";
import opa from "./routes/OPA/opaRoutes.js";
import packing from "./routes/Packing/packingRoutes.js";
import paringDefects from "./routes/ParingDefects/paringDefectRoutes.js";
import qc1Inspection from "./routes/QC1Inspection/qc1InspectionRoutes.js";
import QC1Sunrise from "./routes/QC1Sunrise/qc1SunriseRoutes.js";
import QC2Inspection from "./routes/QC2Inspection/qc2InspectionRoutes.js";
import QC2repairTracking from "./routes/QC2RepairTracking/qc2RepairtrackingRoutes.js";
import QCInlineImageUpload from "./routes/QCInlineRoving/qcInineImageUploadRoutes.js";
import QCInlineRoving from "./routes/QCInlineRoving/qcInlineRovingRoutes.js";
import QCInlineWorker from "./routes/QCInlineRoving/qcInlineWorkersRoutes.js"
import QCRovingParing from "./routes/QCInlineRoving/qcRovingParingRoutes.js";
import SCC from "./routes/SCC/sccRoutes.js";
import sccDefects from "./routes/SCC/sccDefectRoutes.js";
import sccImageUpload from "./routes/SCC/sccImageUploadRoutes.js";
import sccOperators from "./routes/SCC/sccOperatorsRoutes.js";
import sccScratchedDefect from "./routes/SCC/sccScratchedDefectRoutes.js";
import EMB from "./routes/SCC/embRoutes.js"
import washing from "./routes/Washing/washingRoutes.js";
import qcWashing from "./routes/QCWashing/qcWashingRoutes.js";
import qcWashingAdmin from "./routes/QCWashing/qcWashingAdminRoutes.js";
import qcWashingOldQty from "./routes/QCWashing/oldQtyRoutes.js";
import subConFactory from "./routes/SubConFactory/factoryRoutes.js";
import subConQC from "./routes/SubConQC/qcRoutes.js";
import subConQC1Report from "./routes/SubConQC/qc1ReportRoutes.js";
import qcFactoryManagment from "./routes/SubConQC/qcFactoryManagementRoutes.js";
import qcDefectManagement from "./routes/SubConQC/qcDefectManagementRoutes.js";
import ie from "./routes/IE/ieRoutes.js";
import roving from "./routes/Roving/rovingRoutes.js";
import rovingParing from "./routes/Roving/paringRoutes.js";
import washingSpecs from "./routes/WashingSpecs/specRoutes.js";
import qc2Workers from "./routes/QC2Workers/qc2WorkerRoutes.js";


/* ------------------------------
   SQL Query Import
------------------------------ */
// import sqlQuery from "./routes/SQL/sqlQueryRoutes.js";
// import { closeSQLPools } from "./controller/SQL/sqlQueryController.js";


/* ------------------------------
   Connection String
------------------------------ */

/* ------------------------------
   for HTTPS
------------------------------ */


// Define model on connections

//const UserMain = createUserModel(ymProdConnection);


/* ------------------------------
  SQL Query routs
------------------------------ */
// app.use(sqlQuery);

/* ------------------------------
  Functional routs
------------------------------ */
app.use(qcRealWashQty);
app.use(accessoryIssue);
app.use(aql);
app.use(audit);
app.use(bundle);
app.use(auth);
app.use(roleManagement);
app.use(user);
app.use(cutPanelOrder);
app.use(cuttingFabricDefect);
app.use(cuttingImageUpload);
app.use(cuttinginspection);
app.use(cuttingissue);
app.use(cuttingMeasurement);
app.use(cuttingOrder);
app.use(cuttingTrend);
app.use(cuttingReport);
app.use(sewingDefect);
app.use(digitalMeasurement);
app.use(downloadData);
app.use(ironing);
app.use(ironingDashboard);
app.use(opaDashboard);
app.use(packingDashboard);
app.use(processDashboard);
app.use(qc1Dashboard);
app.use(qc2dashboard);
app.use(washingDashboard);
app.use(opa);
app.use(packing);
app.use(paringDefects);
app.use(qc1Inspection);
app.use(QC1Sunrise);
app.use(QC2Inspection);
app.use(QC2repairTracking);
app.use(QCInlineImageUpload);
app.use(QCInlineRoving);
app.use(QCInlineWorker);
app.use(QCRovingParing);
app.use(SCC);
app.use(EMB);
app.use(sccDefects);
app.use(sccImageUpload);
app.use(sccOperators);
app.use(sccScratchedDefect);
app.use(washing);
app.use(qcWashing);
app.use(qcWashingAdmin);
app.use(qcWashingOldQty);
app.use(subConFactory);
app.use(subConQC);
app.use(subConQC1Report);
app.use(qcFactoryManagment);
app.use(qcDefectManagement);
app.use(ie);
app.use(roving);
app.use(washingSpecs);
app.use(qc2Workers);
app.use(rovingParing);

/* ------------------------------
   New Endpoints for CutPanelOrders
------------------------------ */


/* ------------------------------
   Inline Orders Endpoints
------------------------------ */

/* ------------------------------
   Graceful Shutdown
------------------------------ */

// process.on("SIGINT", async () => {
//   try {
//     await closeSQLPools();
//     console.log("SQL connection pools closed.");
//   } catch (err) {
//     console.error("Error closing SQL connection pools:", err);
//   } finally {
//     process.exit(0);
//   }
// });


app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ------------------------------
   Helper Function to Convert Date to MM/DD/YYYY
------------------------------ */

/* ------------------------------
   End Points - Pairing Defects
------------------------------ */

/* ------------------------------
   End Points - Accessory Issues
------------------------------ */
/* ------------------------------
   End Points - SewingDefects
------------------------------ */


/* =============================================================================
   End Points - Sub-Con Factories
   ============================================================================= */

/* ------------------------------
   End Points - QC2 Defects
------------------------------ */

// =================================================================
// MULTER CONFIGURATION (Memory Storage Pattern)
// =================================================================

/* ----------------------------------------------------
   End Points - QC2 Defects Image Management (New Pattern)
---------------------------------------------------- */

/* -------------------------------------
   NEW End Point - QC2 Defect Categories
------------------------------------- */

/* ------------------------------
   IE - Task No Allocation Endpoints
------------------------------ */

// GET - Fetch all tasks with filtering
// server.js
/* ------------------------------
   End Points - dt_orders
------------------------------ */

/* ------------------------------
   End Points - Update dt_orders with Washing Specs
------------------------------ */

/* ------------------------------
   End Points - qc2_orderdata
------------------------------ */

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */

/* ------------------------------
   End Points - Reprint - qc2_orderdata
------------------------------ */

/* ------------------------------
   End Points - Ironing
------------------------------ */

/* ------------------------------
   End Points - Washing
------------------------------ */

/* ------------------------------
   End Points - OPA
------------------------------ */

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

/* ------------------------------
  PUT Endpoints - Update QC2 Order Data
------------------------------ */
/* ------------------------------
   End Points - Live Dashboard - QC1
------------------------------ */

/* ------------------------------
   End Points - QC1
------------------------------ */

/* ------------------------------
   End Points - Download Data
------------------------------ */

/* ------------------------------
   QC2 - Inspection Pass Bundle
------------------------------ */

/* ------------------------------
   QC2 - Workers Scan Data Tracking
------------------------------ */

/* ------------------------------
   QC2 - Fetch Worker's Daily Data
------------------------------ */

/* ------------------------------
   Emp id for Inspector Data
------------------------------ */


/* ------------------------------
   QC2 - B-Grade Tracking
------------------------------ */

/* ------------------------------
   QC2 - Repair Tracking
------------------------------ */

/* ------------------------------
   B-Grade Stock Page Endpoints
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


/* ------------------------------
   QC Inline Roving New
------------------------------ */

/* ------------------------------
   QC Inline Roving Data / Reports
------------------------------ */

// Roving Image Upload (MODIFIED FOR PERFORMANCE)
// ------------------------------------------------------------------------

/* ------------------------------
  USERS ENDPOINTS ---- Reporting
------------------------------ */

/* ------------------------------
  QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

/* ------------------------------
   Cutting Inspection ENDPOINTS
------------------------------ */

/* ------------------------------
   End Points - Pairing Defects
------------------------------ */

/* ------------------------------
   End Points - Accessory Issues
------------------------------ */
/* ------------------------------
   QC Roving Pairing Endpoint
------------------------------ */


/* ------------------------------
   QC Roving Pairing Image Upload Endpoints
------------------------------ */

/* ------------------------------
   End Points - Pairing Defects
------------------------------ */

/* ------------------------------
   End Points - Accessory Issues
------------------------------ */

/* -------------------------------------------------------------------------- */
/*             NEW ENDPOINTS FOR ROVING PAIRING DATA REPORT                   */
/* -------------------------------------------------------------------------- */


/* ------------------------------
   Cutting Report ENDPOINTS
------------------------------ */


// Helper to build the main match pipeline based on filters


/* ------------------------------
   Cutting Report ENDPOINTS
------------------------------ */

/* ------------------------------
   Cutting Old ENDPOINTS - START
------------------------------ */

/* ------------------------------
   Cutting Old ENDPOINTS - END
------------------------------ */

/* ------------------------------
   Cutting Measurement Points
------------------------------ */

/* ------------------------------
   Cutting Measurement Points Edit ENDPOINTS
------------------------------ */

/* ------------------------------
  Cutting Fabric Defects ENDPOINTS
------------------------------ */

/* ------------------------------
  Cutting Issues ENDPOINTS
------------------------------ */


// --- Multer Configuration for Cutting Images ---

/* ------------------------------
  Cutting Trend Analysis ENDPOINTS
------------------------------ */

/* ------------------------------
   Cutting Inspection Management ENDPOINTS
------------------------------ */

/* ------------------------------
   AQL ENDPOINTS
------------------------------ */

/* ------------------------------
   User Auth ENDPOINTS
------------------------------ */
/* ------------------------------
   User Management old ENDPOINTS
------------------------------ */

/* ------------------------------
   Login Authentication ENDPOINTS
------------------------------ */

/* ------------------------------
   Registration - Login Page ENDPOINTS
------------------------------ */
// /* ------------------------------
//    Super Admin ENDPOINTS
// ------------------------------ */

// /* ------------------------------
//    Role Management ENDPOINTS
// ------------------------------ */


// Get all roles from role_management collection
// app.get("/api/role-management", async (req, res) => {
//   try {
//     const roles = await RoleManagment.find({});
//     res.json(roles);
//   } catch (error) {
//     console.error("Error fetching roles:", error);
//     res.status(500).json({ message: "Failed to fetch roles" });
//   }
// });

// /* ------------------------------
//    User Management ENDPOINTS
// ------------------------------ */

/* ------------------------------
   End Points - Digital Measurement
------------------------------ */

/* ------------------------------
   End Points - SCC Operaqtors
------------------------------ */


/* ------------------------------
   End Points - SCC Scratch Defects
------------------------------ */

/* ------------------------------
   End Points - EMB Defects
------------------------------ */

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

/* ------------------------------
   End Points - SCC Daily Testing
------------------------------ */

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

/* -------------------------------------
End Point - Final Consolidated HT Report
------------------------------------- */

app.get("/api/scc/final-report/ht", async (req, res) => {
  try {
    const { startDate, endDate, empId, moNo, machineNo } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }

    // --- Build Filters ---
    const baseFilter = {};
    if (empId && empId !== "All") baseFilter.emp_id = empId;
    if (moNo && moNo !== "All") baseFilter.moNo = moNo;
    if (machineNo && machineNo !== "All") baseFilter.machineNo = machineNo;

    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    const finalFilter = { ...baseFilter, ...dateFilter };
    const dropdownOptionsFilter = { ...dateFilter };

    // --- Execute All Queries Concurrently ---
    // NOTE: For this to work, ensure ALL 4 schemas have `timestamps: true`
    const [
      firstOutputData,
      dailyWashingData,
      machineCalibrationData,
      htInspectionData,
      uniqueEmpIds_1,
      uniqueEmpIds_2,
      uniqueEmpIds_3,
      uniqueEmpIds_4,
      uniqueMoNos_1,
      uniqueMoNos_2,
      uniqueMoNos_3,
      uniqueMoNos_4
    ] = await Promise.all([
      // Data queries
      HTFirstOutput.find(finalFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserMain // MODIFICATION: Changed from UserProd
        })
        .lean(),
      SCCDailyTesting.find(finalFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserMain // MODIFICATION: Changed from UserProd
        })
        .lean(),
      DailyTestingHTFU.find(finalFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserMain // MODIFICATION: Changed from UserProd
        })
        .lean(),
      HTInspectionReport.find(finalFilter)
        .populate({
          path: "operatorData.emp_reference_id",
          select: "emp_id eng_name face_photo",
          model: UserMain // MODIFICATION: Changed from UserProd
        })
        .lean(),

      // Filter option queries
      HTFirstOutput.distinct("emp_id", dropdownOptionsFilter),
      SCCDailyTesting.distinct("emp_id", dropdownOptionsFilter),
      DailyTestingHTFU.distinct("emp_id", dropdownOptionsFilter),
      HTInspectionReport.distinct("emp_id", dropdownOptionsFilter),
      HTFirstOutput.distinct("moNo", dropdownOptionsFilter),
      SCCDailyTesting.distinct("moNo", dropdownOptionsFilter),
      DailyTestingHTFU.distinct("moNo", dropdownOptionsFilter),
      HTInspectionReport.distinct("moNo", dropdownOptionsFilter)
    ]);

    const allEmpIds = [
      ...uniqueEmpIds_1,
      ...uniqueEmpIds_2,
      ...uniqueEmpIds_3,
      ...uniqueEmpIds_4
    ];
    const uniqueEmpIds = [...new Set(allEmpIds)].filter(Boolean).sort();
    const allMoNos = [
      ...uniqueMoNos_1,
      ...uniqueMoNos_2,
      ...uniqueMoNos_3,
      ...uniqueMoNos_4
    ];
    const uniqueMoNos = [...new Set(allMoNos)].filter(Boolean).sort();

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
          : null,
        referenceSampleImage: doc.referenceSampleImage,
        afterWashImage: doc.afterWashImage
      };
    });

    const consolidatedInspections = {};
    htInspectionData.forEach((doc) => {
      const key = `${doc.machineNo}-${doc.moNo}-${doc.color}-${doc.tableNo}`;
      if (!consolidatedInspections[key]) {
        consolidatedInspections[key] = {
          inspectionDate: doc.inspectionDate,
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
      filterOptions: { empIds: uniqueEmpIds, moNos: uniqueMoNos }
    });
  } catch (error) {
    console.error("Error creating consolidated HT report:", error); // Check server logs for this!
    res.status(500).json({
      message: "Failed to generate consolidated report",
      error: error.message
    });
  }
});

// app.get("/api/scc/final-report/ht", async (req, res) => {
//   try {
//     const { date, empId, moNo, machineNo } = req.query;
//     if (!date) {
//       return res.status(400).json({ message: "Date is required." });
//     }

//     const { stringDate, paddedStringDate, isoStartDate, isoEndDate } =
//       getConsolidatedDateFormats(date);

//     // --- Build Filter Queries ---
//     // These objects will be passed to the find() method for each model
//     const stringDateFilter = { inspectionDate: stringDate };
//     if (empId && empId !== "All") stringDateFilter.emp_id = empId;
//     if (moNo && moNo !== "All") stringDateFilter.moNo = moNo;
//     if (machineNo && machineNo !== "All")
//       stringDateFilter.machineNo = machineNo;

//     const paddedDateFilter = { inspectionDate: paddedStringDate };
//     if (empId && empId !== "All") paddedDateFilter.emp_id = empId;
//     if (moNo && moNo !== "All") paddedDateFilter.moNo = moNo;
//     if (machineNo && machineNo !== "All")
//       paddedDateFilter.machineNo = machineNo;

//     const isoDateFilter = {
//       inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
//     };
//     if (empId && empId !== "All") isoDateFilter.emp_id = empId;
//     if (moNo && moNo !== "All") isoDateFilter.moNo = moNo;
//     if (machineNo && machineNo !== "All") isoDateFilter.machineNo = machineNo;

//     // --- Execute All Queries Concurrently using Promise.all ---
//     const [
//       firstOutputData,
//       dailyWashingData,
//       machineCalibrationData,
//       htInspectionData,
//       // Queries to get unique filter options for the selected DATE only
//       uniqueEmpIds_1,
//       uniqueEmpIds_2,
//       uniqueEmpIds_3,
//       uniqueMoNos_1,
//       uniqueMoNos_2,
//       uniqueMoNos_3
//     ] = await Promise.all([
//       // Data queries with filters applied
//       HTFirstOutput.find(stringDateFilter)
//         .populate({
//           path: "operatorData.emp_reference_id",
//           select: "emp_id eng_name face_photo",
//           model: UserProd
//         })
//         .lean(),
//       SCCDailyTesting.find(stringDateFilter)
//         .populate({
//           path: "operatorData.emp_reference_id",
//           select: "emp_id eng_name face_photo",
//           model: UserProd
//         })
//         .lean(),
//       DailyTestingHTFU.find(paddedDateFilter)
//         .populate({
//           path: "operatorData.emp_reference_id",
//           select: "emp_id eng_name face_photo",
//           model: UserProd
//         })
//         .lean(),
//       HTInspectionReport.find(isoDateFilter)
//         .populate({
//           path: "operatorData.emp_reference_id",
//           select: "emp_id eng_name face_photo",
//           model: UserProd
//         })
//         .lean(),

//       // Filter option queries (only filter by date to get all options for that day)
//       HTFirstOutput.distinct("emp_id", { inspectionDate: stringDate }),
//       SCCDailyTesting.distinct("emp_id", { inspectionDate: stringDate }),
//       DailyTestingHTFU.distinct("emp_id", { inspectionDate: paddedStringDate }),
//       HTFirstOutput.distinct("moNo", { inspectionDate: stringDate }),
//       SCCDailyTesting.distinct("moNo", { inspectionDate: stringDate }),
//       DailyTestingHTFU.distinct("moNo", { inspectionDate: paddedStringDate })
//     ]);

//     // Combine and get unique filter options
//     const allEmpIds = [
//       ...uniqueEmpIds_1,
//       ...uniqueEmpIds_2,
//       ...uniqueEmpIds_3,
//       ...htInspectionData.map((d) => d.emp_id)
//     ];
//     const uniqueEmpIds = [...new Set(allEmpIds)].filter(Boolean).sort();

//     const allMoNos = [
//       ...uniqueMoNos_1,
//       ...uniqueMoNos_2,
//       ...uniqueMoNos_3,
//       ...htInspectionData.map((d) => d.moNo)
//     ];
//     const uniqueMoNos = [...new Set(allMoNos)].filter(Boolean).sort();

//     // Process First Output Data
//     const processedFirstOutput = firstOutputData.map((doc) => {
//       const firstSpec = doc.standardSpecification.find(
//         (s) => s.type === "first"
//       );
//       const secondSpec = doc.standardSpecification.find(
//         (s) => s.type === "2nd heat"
//       );
//       return {
//         ...doc,
//         specs: firstSpec
//           ? {
//               tempC: firstSpec.tempC,
//               timeSec: firstSpec.timeSec,
//               pressure: firstSpec.pressure
//             }
//           : {},
//         secondHeatSpecs: secondSpec
//           ? {
//               tempC: secondSpec.tempC,
//               timeSec: secondSpec.timeSec,
//               pressure: secondSpec.pressure
//             }
//           : null
//       };
//     });

//     // Process and Consolidate HT Inspection Data
//     const consolidatedInspections = {};
//     htInspectionData.forEach((doc) => {
//       const key = `${doc.machineNo}-${doc.moNo}-${doc.color}-${doc.tableNo}`;
//       if (!consolidatedInspections[key]) {
//         consolidatedInspections[key] = {
//           machineNo: doc.machineNo,
//           moNo: doc.moNo,
//           buyer: doc.buyer,
//           buyerStyle: doc.buyerStyle,
//           color: doc.color,
//           operatorData: doc.operatorData,
//           batchNo: doc.batchNo,
//           tableNo: doc.tableNo,
//           totalPcs: 0,
//           totalInspectedQty: 0,
//           totalDefectsQty: 0,
//           defectSummary: {},
//           defectImageUrls: []
//         };
//       }
//       const group = consolidatedInspections[key];
//       group.totalPcs += doc.totalPcs || 0;
//       group.totalInspectedQty += doc.aqlData?.sampleSize || 0;
//       group.totalDefectsQty += doc.defectsQty || 0;

//       if (
//         doc.defectImageUrl &&
//         !group.defectImageUrls.includes(doc.defectImageUrl)
//       ) {
//         group.defectImageUrls.push(doc.defectImageUrl);
//       }

//       doc.defects.forEach((defect) => {
//         const name = defect.defectNameEng;
//         group.defectSummary[name] =
//           (group.defectSummary[name] || 0) + defect.count;
//       });
//     });

//     const finalInspectionArray = Object.values(consolidatedInspections).map(
//       (group) => {
//         const finalDefectRate =
//           group.totalInspectedQty > 0
//             ? group.totalDefectsQty / group.totalInspectedQty
//             : 0;
//         return {
//           ...group,
//           finalDefectRate,
//           defectImageUrl: group.defectImageUrls[0] || null
//         };
//       }
//     );

//     res.json({
//       firstOutput: processedFirstOutput,
//       dailyWashing: dailyWashingData,
//       machineCalibration: machineCalibrationData,
//       htInspection: finalInspectionArray,
//       filterOptions: {
//         empIds: uniqueEmpIds,
//         moNos: uniqueMoNos
//       }
//     });
//   } catch (error) {
//     console.error("Error creating consolidated HT report:", error);
//     res.status(500).json({
//       message: "Failed to generate consolidated report",
//       error: error.message
//     });
//   }
// });

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

/* ------------------------------
OPA Live Dashboard Endpoints
------------------------------ */

/* ------------------------------
Ironing Live Dashboard Endpoints
------------------------------ */

/* ------------------------------
Packing Live Dashboard Endpoints
------------------------------ */

/* ------------------------------------
   End Points - Audit Image
------------------------------------ */

// 1. Define the absolute destination path and ensure the directory exists
const auditUploadPath = path.join(
  __backendDir,
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
        __backendDir,
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
   QC Washing PDF Generation
------------------------------ */

/* ------------------------------
   QC Washing Check List Endpoints
------------------------------ */

// =================================================================
// MULTER CONFIGURATION (Memory Storage Pattern)
// =================================================================

/* ------------------------------
   End Points - QC Washing Defects
------------------------------ */
// GET /api/users endpoint
app.get("/api/users", async (req, res) => {
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
    const transformedUsers = userList.map((user) => ({
      userId: user.emp_id, // Map emp_id to userId
      _id: user._id,
      name: user.eng_name, // Use eng_name as the display name
      username: user.name, // Keep original name as username
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
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
});

// Endpoint to update wash qty for a specific record
app.put("/api/qc-washing/update-wash-qty/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { washQty } = req.body;

    const updatedRecord = await QCWashing.findByIdAndUpdate(
      id,
      { washQty: parseInt(washQty) || 0 },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ 
        success: false, 
        message: "Record not found" 
      });
    }

    res.json({ 
      success: true, 
      data: updatedRecord,
      message: "Wash qty updated successfully"
    });

  } catch (error) {
    console.error("Error updating wash qty:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update wash qty", 
      error: error.message 
    });
  }
});

// Endpoint to fetch all submitted QC washing data
app.get("/api/qc-washing/all-submitted", async (req, res) => {
  try {
    const submittedData = await QCWashing.find({ 
      status: { $in: ['submitted', 'processing', 'auto-saved'] }
    }).sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: submittedData,
      count: submittedData.length
    });

  } catch (error) {
    console.error("Error fetching submitted QC washing data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch submitted data", 
      error: error.message 
    });
  }
});

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
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
      'Washing', 'WASHING', 'washing',
      'Wash', 'WASH', 'wash',
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

    // Standardize field names and filter out invalid records
    const outputRows = outputData
      .map(row => ({
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
      }))
      .filter(row => {
        // Filter out records without required fields
        return row.Inspection_date && row.QC_ID && row.MONo;
      });

    const defectRows = defectData
      .map(row => {
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
      })
      .filter(row => {
        // Filter out records without required fields
        return row.Inspection_date && row.QC_ID && row.MONo;
      });

    // Build outputMap and defectMap
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

      // Skip if essential data is missing
      if (!Inspection_date || !QC_ID) {
        continue;
      }

      // Output grouping
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

      // Output summary
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

      // Washing quantity data structure
      for (const o of Output_data) {
        // Only process if this is a washing line and has required data
        if (isWashingLine(o.Line_no) && o.MONo) {
          const washKey = `${Inspection_date_str}|${o.MONo}|${o.Color}`;
          
          if (!washingQtyData.has(washKey)) {
            washingQtyData.set(washKey, {
              Inspection_date: Inspection_date,
              Style_No: o.MONo,
              Color: o.Color,
              Total_Wash_Qty: 0,
              WorkerWashQty: new Map()
            });
          }

          const washData = washingQtyData.get(washKey);
          washData.Total_Wash_Qty += o.Qty;
          
          // Add or update worker quantity
          if (washData.WorkerWashQty.has(QC_ID)) {
            washData.WorkerWashQty.set(QC_ID, washData.WorkerWashQty.get(QC_ID) + o.Qty);
          } else {
            washData.WorkerWashQty.set(QC_ID, o.Qty);
          }
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
    
    // Convert washing quantity data to final format with validation
    const washingQtyDocs = Array.from(washingQtyData.values())
      .filter(washData => {
        // Only include records with required fields
        return washData.Inspection_date && washData.Style_No && washData.WorkerWashQty.size > 0;
      })
      .map(washData => ({
        Inspection_date: washData.Inspection_date,
        Style_No: washData.Style_No,
        Color: washData.Color,
        Total_Wash_Qty: washData.Total_Wash_Qty,
        WorkerWashQty: Array.from(washData.WorkerWashQty.entries()).map(([qc_id, qty]) => ({
          QC_ID: qc_id,
          Wash_Qty: qty
        }))
      }));

    res.json({ finalDocs, washingQtyDocs });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process and save QC2 data.' });
  }
});

/* ------------------------------
   End Points - QC Washing Qty Old
------------------------------ */



// // Test endpoint to check QCWashingQtyOld collection structure
// app.get("/api/qc-washing/test-wash-qty", async (req, res) => {
//   try {
//     const sampleRecord = await QCWashingQtyOld.findOne().limit(1);
//     const totalCount = await QCWashingQtyOld.countDocuments();

//     // Get some recent records for testing
//     const recentRecords = await QCWashingQtyOld.find()
//       .sort({ Inspection_date: -1 })
//       .limit(5)
//       .select("Inspection_date Style_No Color Total_Wash_Qty WorkerWashQty");

//     res.json({
//       success: true,
//       totalRecords: totalCount,
//       sampleRecord: sampleRecord,
//       recentRecords: recentRecords,
//       message: "QCWashingQtyOld collection test successful"
//     });
//   } catch (error) {
//     console.error("Error testing QCWashingQtyOld collection:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to test collection",
//       error: error.message
//     });
//   }
// });

// // Test endpoint to verify specific record matching
// app.get("/api/qc-washing/test-specific-match", async (req, res) => {
//   try {
//     const testDate = "2025-08-23";
//     const testOrderNo = "GPAF6018";
//     const testColor = "500 EGGPLANT";
//     const testQcId = "YM6926";

//     const inspectionDate = new Date(testDate);
//     const startOfDay = new Date(inspectionDate);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(inspectionDate);
//     endOfDay.setHours(23, 59, 59, 999);

//     // Try exact match first
//     let washQtyRecord = await QCWashingQtyOld.findOne({
//       Inspection_date: {
//         $gte: startOfDay,
//         $lt: endOfDay
//       },
//       Style_No: testOrderNo,
//       Color: testColor
//     });

//     // If no exact match, try English extraction
//     if (!washQtyRecord) {
//       const candidates = await QCWashingQtyOld.find({
//         Inspection_date: {
//           $gte: startOfDay,
//           $lt: endOfDay
//         },
//         Style_No: testOrderNo
//       });

//       washQtyRecord = candidates.find((record) => {
//         const dbColor = record.Color;
//         const match = dbColor.match(/\[([^\]]+)\]/);
//         const englishPart = match ? match[1] : dbColor;
//         return englishPart.toLowerCase() === testColor.toLowerCase();
//       });
//     }

//     let result = {
//       testParams: { testDate, testOrderNo, testColor, testQcId },
//       dateRange: { startOfDay, endOfDay },
//       recordFound: !!washQtyRecord,
//       washQty: 0,
//       workerFound: false
//     };

//     if (washQtyRecord) {
//       const workerWashQty = washQtyRecord.WorkerWashQty.find(
//         (worker) => worker.QC_ID === testQcId
//       );

//       result.recordDetails = {
//         dbColor: washQtyRecord.Color,
//         dbStyleNo: washQtyRecord.Style_No,
//         dbDate: washQtyRecord.Inspection_date,
//         totalWashQty: washQtyRecord.Total_Wash_Qty,
//         availableWorkers: washQtyRecord.WorkerWashQty.map((w) => ({
//           id: w.QC_ID,
//           qty: w.Wash_Qty
//         }))
//       };

//       if (workerWashQty) {
//         result.washQty = workerWashQty.Wash_Qty;
//         result.workerFound = true;
//       }
//     }

//     res.json(result);
//   } catch (error) {
//     console.error("Error in test endpoint:", error);
//     res.status(500).json({
//       success: false,
//       message: "Test failed",
//       error: error.message
//     });
//   }
// });

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

/* ------------------------------
   End Points - NEW for Sub-Con QC
------------------------------ */

/* ------------------------------
   End Points - Sub-Con QC Reports
------------------------------ */
/* ------------------------------------------------------------------
   End Points - Sub-Con QC Management (Admin Panel)
------------------------------------------------------------------ */

// --- FACTORY MANAGEMENT ---


// --- DEFECT MANAGEMENT ---


/* ------------------------------------------------------------------
   End Point - Sub-Con QC Dashboard
------------------------------------------------------------------ */

/* ----------------------------------------------------
   End Points - NEW for Sub-Con QA Sample Data
---------------------------------------------------- */

/* -----------------------------------------------------------
   End Points - ADDITIONS for Sub-Con QA Sample Data (Find & Update)
----------------------------------------------------------- */

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ HTTPS Server is running on https://localhost:${PORT}`);
});
