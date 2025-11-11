/* ------------------------------
   Import Required Libraries/Models
------------------------------ */

import { app, server, PORT } from "./Config/appConfig.js";

/* -----------------------------
User Imports
------------------------------ */
import auth from "./routes/User/authRoutes.js";
import roleManagement from "./routes/User/roleManagementRoutes.js";
import user from "./routes/User/userRoutes.js";

/* ------------------------------
   SQL Query Import
/------------------------------ */

// import sqlQuery from "./routes/SQL/sqlQueryRoutes.js";
// import { closeSQLPools } from "./controller/SQL/sqlQueryController.js";

/* ------------------------------
   Cutting
------------------------------ */
import cutPanelOrder from "./routes/Cutting/Cutting_Orders/cutPanelOrderRoutes.js";
import cuttingFabricDefect from "./routes/Cutting/Cutting_Admin_FabricDefects/cuttingFabricDefectRoutes.js";
import cuttingImageUpload from "./routes/Cutting/CuttingInspection/cuttingImageUploadRoutes.js";
import cuttinginspection from "./routes/Cutting/CuttingInspection/cuttingInspectionRoutes.js";
import cuttingissue from "./routes/Cutting/CuttingInspection/cuttingIssueRoutes.js";
import cuttingMeasurementPoints from "./routes/Cutting/Cutting_Admin_MeasurementPoint/cuttingMeasurementPointsRoutes.js";
import cuttingMeasurementPointEdit from "./routes/Cutting/Cutting_Admin_MeasurementPoint/cuttingMeasurementPointEditRoutes.js";
import cuttingInspectionReportManagemenrtt from "./routes/Cutting/Cutting_Admin_Inspection_Report/cuttingInspectionReportManageRoutes.js";
import cuttingTrend from "./routes/Cutting//Cutting_Trend/cuttingTrendRoutes.js";
import cuttingReport from "./routes/Cutting/CuttingReport/reportRoutes.js";
import cuttingDashboard from "./routes/Cutting/CuttingDashboard/cuttingDashboardRoutes.js";
import cuttingImageProxy from "./routes/Cutting/CuttingReport/cuttingImageProxyRoutes.js";

/* ------------------------------
  SCC
------------------------------ */

import SCC from "./routes/SCC/SCC_Inspection/sccDailyTestingRoutes.js";
import sccDefects from "./routes/SCC/SCC_Admin/sccDefectRoutes.js";
import sccImageUpload from "./routes/SCC/SCC_Inspection/sccImageUploadRoutes.js";
import sccOperators from "./routes/SCC/SCC_Admin/sccOperatorsRoutes.js";
import sccScratchedDefect from "./routes/SCC/SCC_Admin/sccScratchedDefectRoutes.js";
import SCCInspection from "./routes/SCC/SCC_Inspection/sccFirstOutPutHTFURoutes.js";
import EMB from "./routes/SCC/SCC_Admin/embDefectsRoutes.js";
import FUQC from "./routes/SCC/SCC_Inspection/fuqcRoutes.js";
import DailyHT from "./routes/SCC/SCC_Inspection/dailyHTRoutes.js";
import HTFU from "./routes/SCC/SCC_Inspection/htfuRoutes.js";
import Elastic from "./routes/SCC/SCC_Inspection/elasticRoutes.js";
import EMBReport from "./routes/SCC/SCC_Inspection/embReportRoutes.js";
import SCCFinalReport from "./routes/SCC/SCC_Final_Consolidate_Report/finalReport.js";
import HTInspection from "./routes/SCC/SCC_Inspection/htInspectionRoutes.js";

/* -----------------------------
Common File Imports
------------------------------ */
/*-------------AQL Imports --------------*/
import aql from "./routes/Common/AQLRoutes.js";
/*-------------Buyer Spec Imports --------------*/
import buyerSpec from "./routes/Common/DTOrdersBuyerSpecRoutes.js";
/*-------------DT-Orders Imports --------------*/
import dtOrders from "./routes/Common/DTOrdersRoutes.js";

/* -----------------------------
Download Data Imports
------------------------------ */
import downloadData from "./routes/DownloadData/downloaddataRoutes.js";

/* -----------------------------
QC1 Inspection Imports
------------------------------ */
import qc1Inspection from "./routes/QC1Inspection/qc1InspectionRoutes.js";

/* -----------------------------
QC1 Sunrise Imports
------------------------------ */
import QC1Sunrise from "./routes/QC1Sunrise/qc1SunriseRoutes.js";

/* -----------------------------
Roving Imports
------------------------------ */
import rovingDefects from "./routes/InlineRoving/Roving/RovingAdminDefectRoutes.js";
import QCInlineImageUpload from "./routes/InlineRoving/Roving/RovingInineImageUploadRoutes.js";
import QCInlineRoving from "./routes/InlineRoving/Roving/RovingInlineOrdersRoutes.js";
import QCInlineWorker from "./routes/InlineRoving/Roving/RovingInspectionRoutes.js";
import rovingDefectBuyerstatus from "./routes/InlineRoving/Roving/RovingAdminDefectBuyserStatusRoutes.js";
import rovingReports from "./routes/InlineRoving/Roving/RovingReportRoutes.js";

/*-------------Paring Imports --------------*/
import pairingDefects from "./routes/InlineRoving/Pairing/ParingDefectRoutes.js";
import rovingPairingInspection from "./routes/InlineRoving/Pairing/RovingPairingInspectionRoutes.js";
import pairingAccessoryIssue from "./routes/InlineRoving/Pairing/PairingAccessoryIssueRoutes.js";
import pairingReport from "./routes/InlineRoving/Pairing/PairingReportsRoutes.js";

/* -----------------------------
  QC2 System Import
------------------------------ */
/* ------------Live Dashboard -----------------*/
import washingLiveDashboard from "./routes/QC2System/Dashboard/WashingLiveDashboardRoutes.js";
import ironingLiveDashboard from "./routes/QC2System/Dashboard/IroningLiveDashboardRoutes.js";
import opaDashLiveboard from "./routes/QC2System/Dashboard/OPALiveDashboardRoutes.js";
import packingLiveDashboard from "./routes/QC2System/Dashboard/PackingLiveDashboardRoutes.js";
/* ------------IE Admin-----------------*/
import ieQCRoleManagement from "./routes/QC2System/IEAdmin/IEQCRolerManagementRoutes.js";
import ieTaskNoAllocation from "./routes/QC2System/IEAdmin/IEAdminTaskNoAllocationRoutes.js";
import ieWorkerAssignement from "./routes/QC2System/IEAdmin/IEWorkerAssignmentRoutes.js";
/* ------------System Admin-----------------*/
import qc2SubConFactory from "./routes/QC2System/SystemAdmin/QC2SubConFactoryRoutes.js";
import qc2Defects from "./routes/QC2System/SystemAdmin/QC2DefectsRoutes.js";
/* ------------Bundle Registarion-----------------*/
import bundleRegistrationInspection from "./routes/QC2System/BundleRegistration/bundelRestrationInspectionRoutes.js";
import bundleRegistrationData from "./routes/QC2System/BundleRegistration/BundleRegistationDataRoutes.js";
import bundleRegistationReprint from "./routes/QC2System/BundleRegistration/BundleRegistrationReprintRoutes.js";
/* ------------Ironing-----------------*/
import ironing from "./routes/QC2System/Ironing/IroningRoutes.js";
/* ------------Washing-----------------*/
import washing from "./routes/QC2System/Washing/WashingRoutes.js";
/* ------------OPA-----------------*/
import opa from "./routes/QC2System/OPA/OPARoutes.js";
/* ------------Packing-----------------*/
import packing from "./routes/QC2System/Packing/PackingRoutes.js";
/* -----------QC2 Inspection-----------------*/
import qc2InspectionDataCapture from "./routes/QC2System/QC2Inspection/QC2InspectionDataCaptureRoutes.js";
import qc2InspectionWorkers from "./routes/QC2System/QC2Inspection/QC2InspectionWorkerRoutes.js";
import qc2InspectionReport from "./routes/QC2System/QC2Inspection/QC2InspectionReportRoutes.js";
import qc2InspectionDashboard from "./routes/QC2System/QC2Inspection/QC2InspectionDashboardRoutes.js";
import qc2OrderDatadashboard from "./routes/QC2System/QC2Inspection/QC2OrderDataDashboardRoutes.js";
import qc2WashIronOpaDashboard from "./routes/QC2System/QC2Inspection/QC2WashIronOpaDashboardRoutes.js";
import qc2BGrade from "./routes/QC2System/QC2Inspection/QC2BGradeRoutes.js";
import qc2RepairTracking from "./routes/QC2System/QC2Inspection/QC2RepairtrackingRoutes.js";
import qc2DefectPrint from "./routes/QC2System/QC2Inspection/QC2DefectPrintRoutes.js";
import qc2Rework from "./routes/QC2System/QC2Inspection/QC2ReworkRoutes.js";

/* -----------------------------
  AI Import
------------------------------ */
import AIChatBot from "./routes/AI/AIChatBotRoutes.js";

/* ------------------------------
  QC2 Data Upload
------------------------------ */
import qc2UploadData from "./routes/QC2_Upload_Data/qc2UploadRoutes.js";

/* ------------------------------
  ANF Washing
------------------------------ */

import ANF from "./routes/ANF/ANFReportRoutes.js";
import ANFInspection from "./routes/ANF/ANFInspectionRoutes.js";
import ANFResult from "./routes/ANF/ANFResultRoutes.js";

/* ------------------------------
  PivotY - QA Sections
------------------------------ */

import QASections_Home from "./routes/PivotY/QASections/QASections_Home_Route.js";
import QASections_Photos from "./routes/PivotY/QASections/QASections_Photos_Route.js";
import QASections_Packing from "./routes/PivotY/QASections/QASections_Packing_Route.js";
import QASections_DefectList from "./routes/PivotY/QASections/QASections_DefectList_Route.js";
import QASections_DefectCategory from "./routes/PivotY/QASections/QASections_DefectCategory_Route.js";

/* -----------------------------
QA Random Inspection Imports
------------------------------ */
import qaDefect from "./routes/QARandomInspection/QAAdmin/QADefectRoutes.js";
import qaDefectBuyerStatus from "./routes/QARandomInspection/QAAdmin/QADefectBuyerStatusRoutes.js";
import qaStandardDefect from "./routes/QARandomInspection/QAAdmin/QAStandardDefectRoutes.js";
import qaRandomInspectionSave from "./routes/QARandomInspection/QARandomInspectionData/QARandomInspectionSaveRoutes.js";
import qaRandomInspection from "./routes/QARandomInspection/QARandomInspectionData/QARandomInspectionRoutes.js";
import qaAccuracyDashboard from "./routes/QARandomInspection/QAaccuracyDashboard/QAAccuracyDashboardRoutes.js";

/* ------------------------------
  Sub Con QC1 Inspection
------------------------------ */

import subConQAInspection from "./routes/Sub-ConQC1/Sub-ConQA/subConQAInspectionRoutes.js";
import SubConQAReport from "./routes/Sub-ConQC1/Sub-ConQA/subConQAReportRoutes.js";
import SubConDefectManagement from "./routes/Sub-ConQC1/Sub-ConQC1 Admin/subConSewingQCDefectsRoutes.js";
import subConSewingQCFactory from "./routes/Sub-ConQC1/Sub-ConQC1 Admin/subConSewingQCFactoryRoutes.js";
import subConSewingQCInspection from "./routes/Sub-ConQC1/Sub-ConQC1 Inspection/subConsewingQCInspectionRoutes.js";
import subConQADashboard from "./routes/Sub-ConQC1/SubConQCDashboard/subConQCDashboardRoutes.js";
import subConSewingQCReport from "./routes/Sub-ConQC1/Sub-ConQC1 Inspection/subConsewingQCReportRoutes.js";

/* ------------------------------
  QC Washing
------------------------------ */

import qcWashingInspection from "./routes/QCWashing/QCWashing Inspection/qcWashingInspectionRoutes.js";
import qcWashingAdmin from "./routes/QCWashing/QCWashing Admin/qcWashingAdminRoutes.js";
import qcWashingReport from "./routes/QCWashing/QCWashing Report/qcWashingReportRoutes.js";
import qcWashingOldQty from "./routes/QCWashing/oldQtyRoutes.js";

/* -----------------------------
Audit Imports
------------------------------ */
import auditAdmin from "./routes/Audit/AuditAdminRoutes.js";
import auditUploadImage from "./routes/Audit/AuditUploadImageRoutes.js";

/* -----------------------------
Digital Measurement Imports
------------------------------ */
import digitalMeasurement from "./routes/DigitalMeasurement/DigitalMeasurmentRoutes.js";

/* ------------------------------
  Supplier Issues
------------------------------ */

import supplierIssuesAdmin from "./routes/SupplierIssue/supplierIssuesAdminRoutes.js";
import supplierIssueReport from "./routes/SupplierIssue/supplierIssueReportRoutes.js";
import supplierIssueInspection from "./routes/SupplierIssue/supplierIssueInspectionRoutes.js";

/* ------------------------------
  Yorksys Orders
------------------------------ */

import YourksysOrders from "./routes/YorksysOrders/uploadOrderRoutes.js";

/* ------------------------------
  Packing List
------------------------------ */

import PackingList from "./routes/PackingList/packingListRoutes.js";

/* -----------------------------
  User Routes
------------------------------ */
app.use(auth);
app.use(roleManagement);
app.use(user);

/* ------------------------------
  SQL Query routes start
------------------------------ */
// app.use(sqlQuery);

/* -----------------------------
Commin file  Routes
------------------------------ */
/* -----------AQL -----------------*/
app.use(aql);
/* -----------Buyer Specs -----------------*/
app.use(buyerSpec);
/* ----------- DT_Orders -----------------*/
app.use(dtOrders);

/* -----------------------------
Download Data Routes
------------------------------ */
app.use(downloadData);

/* -----------------------------
QC1 Inspection Routes
------------------------------ */
app.use(qc1Inspection);

/* -----------------------------
QC1 Sunrise Routes
------------------------------ */
app.use(QC1Sunrise);

/* -----------------------------
Roving Routes
------------------------------ */
/* -----------Roving -----------------*/
app.use(rovingDefects);
app.use(QCInlineImageUpload);
app.use(QCInlineRoving);
app.use(QCInlineWorker);
app.use(rovingDefectBuyerstatus);
app.use(rovingReports);
/* -----------Pairing-----------------*/
app.use(pairingDefects);
app.use(rovingPairingInspection);
app.use(pairingAccessoryIssue);
app.use(pairingReport);

/* -----------------------------
QC2 Upload Data Routes
------------------------------ */
app.use(qc2UploadData);

/* -----------------------------
  QC2 System Routes
------------------------------ */
/* ------------Live Dashboard -----------------*/
app.use(washingLiveDashboard);
app.use(ironingLiveDashboard);
app.use(opaDashLiveboard);
app.use(packingLiveDashboard);
/* -----------IE Admin -----------------*/
app.use(ieQCRoleManagement);
app.use(ieTaskNoAllocation);
app.use(ieWorkerAssignement);
/* -----------System Admin -----------------*/
app.use(qc2SubConFactory);
app.use(qc2Defects);
/* -----------Bundle Registration -----------------*/
app.use(bundleRegistrationInspection);
app.use(bundleRegistrationData);
app.use(bundleRegistationReprint);
/* -----------Ironing-----------------*/
app.use(ironing);
/* -----------Washing-----------------*/
app.use(washing);
/* -----------OPA-----------------*/
app.use(opa);
/* -----------Packing-----------------*/
app.use(packing);
/* -----------QC2 Inspection-----------------*/
app.use(qc2InspectionDataCapture);
app.use(qc2InspectionWorkers);
app.use(qc2InspectionReport);
app.use(qc2InspectionDashboard);
app.use(qc2OrderDatadashboard);
app.use(qc2WashIronOpaDashboard);
app.use(qc2BGrade);
app.use(qc2RepairTracking);
app.use(qc2DefectPrint);
app.use(qc2Rework);

/* -----------------------------
AI Routes
------------------------------ */
app.use(AIChatBot);

/* ------------------------------
  Cutting routes
------------------------------ */
app.use(cutPanelOrder);
app.use(cuttingFabricDefect);
app.use(cuttingImageUpload);
app.use(cuttinginspection);
app.use(cuttingissue);
app.use(cuttingMeasurementPointEdit);
app.use(cuttingMeasurementPoints);
app.use(cuttingInspectionReportManagemenrtt);
app.use(cuttingTrend);
app.use(cuttingReport);
app.use(cuttingDashboard);
app.use(cuttingImageProxy);

/* ------------------------------
  SCC routes
------------------------------ */
app.use(SCC);
app.use(SCCInspection);
app.use(EMB);
app.use(FUQC);
app.use(DailyHT);
app.use(HTFU);
app.use(Elastic);
app.use(EMBReport);
app.use(SCCFinalReport);
app.use(HTInspection);
app.use(sccDefects);
app.use(sccImageUpload);
app.use(sccOperators);
app.use(sccScratchedDefect);

/* ------------------------------
  QC2 Data Upload
------------------------------ */
app.use(qc2UploadData);

/* ------------------------------
  ANF Washing routes
------------------------------ */

app.use(ANF);
app.use(ANFInspection);
app.use(ANFResult);

/* ------------------------------
  PivotY - QA Sections routes
------------------------------ */
app.use(QASections_Home);
app.use(QASections_Photos);
app.use(QASections_Packing);
app.use(QASections_DefectList);
app.use(QASections_DefectCategory);

/* -----------------------------
  QA Random Inspection Routes
------------------------------ */
app.use(qaDefect);
app.use(qaDefectBuyerStatus);
app.use(qaStandardDefect);
app.use(qaRandomInspectionSave);
app.use(qaRandomInspection);
app.use(qaAccuracyDashboard);

/* ------------------------------
  Sub Con QC1 Inspection routes
------------------------------ */

app.use(subConSewingQCFactory);
app.use(SubConQAReport);
app.use(SubConDefectManagement);
app.use(subConQAInspection);
app.use(subConSewingQCInspection);
app.use(subConSewingQCReport);
app.use(subConQADashboard);

/* ------------------------------
  QC Washing routes
------------------------------ */

app.use(qcWashingInspection);
app.use(qcWashingAdmin);
app.use(qcWashingReport);
app.use(qcWashingOldQty);

/* -----------------------------
Audit Routes
------------------------------ */
app.use(auditAdmin);
app.use(auditUploadImage);

/* -----------------------------
Digital Measurement Routes
------------------------------ */
app.use(digitalMeasurement);

/* ------------------------------
  Supplier Issues Routes
------------------------------ */

app.use(supplierIssuesAdmin);
app.use(supplierIssueInspection);
app.use(supplierIssueReport);

/* ------------------------------
  Yorksys Orders routes
------------------------------ */

app.use(YourksysOrders);

/* ------------------------------
  Packing List
------------------------------ */
app.use(PackingList);

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

/* ------------------------------
   Inline Orders Endpoints
------------------------------ */

// // Updated Endpoint to Search MO Numbers (St_No) from inline_orders in MongoDB with partial matching
// app.get("/api/inline-orders-mo-numbers", async (req, res) => {
//   try {
//     const searchTerm = req.query.search; // Get the search term from query params
//     if (!searchTerm) {
//       return res.status(400).json({ error: "Search term is required" });
//     }

//     // Use a case-insensitive regex to match the term anywhere in St_No
//     const regexPattern = new RegExp(searchTerm, "i");

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

// // New Endpoint to Fetch Inline Order Details for a given MO No (St_No)
// app.get("/api/inline-orders-details", async (req, res) => {
//   try {
//     const stNo = req.query.stNo;
//     if (!stNo) {
//       return res.status(400).json({ error: "St_No is required" });
//     }

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
   Graceful Shutdown
------------------------------ */

process.on("SIGINT", async () => {
  try {
    await closeSQLPools();
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

// // Helper function to normalize date strings (ensure MM/DD/YYYY format)
// const normalizeDateString = (dateStr) => {
//   if (!dateStr) return null;
//   try {
//     const date = new Date(dateStr);
//     const month = (date.getMonth() + 1).toString().padStart(2, "0");
//     const day = date.getDate().toString().padStart(2, "0");
//     const year = date.getFullYear();
//     return `${month}/${day}/${year}`;
//   } catch (e) {
//     console.error("Error normalizing date string:", dateStr, e);
//     // If parsing fails, try to return as is or handle error appropriately
//     // For this use case, if it's already MM/DD/YYYY, it might be fine
//     const parts = dateStr.split(/[-/]/);
//     if (parts.length === 3) {
//       // Attempt to reformat if it looks like YYYY-MM-DD or DD-MM-YYYY
//       if (parts[0].length === 4) return `${parts[1]}/${parts[2]}/${parts[0]}`; // YYYY/MM/DD -> MM/DD/YYYY
//       if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`; // DD/MM/YYYY -> MM/DD/YYYY
//     }
//     return dateStr; // Fallback
//   }
// };

/* ------------------------------
   End Points - SewingDefects
------------------------------ */
// app.get("/api/sewing-defects", async (req, res) => {
//   try {
//     // Extract query parameters
//     const { categoryEnglish, type, isCommon } = req.query;

//     // Build filter object based on provided query parameters
//     const filter = {};
//     if (categoryEnglish) filter.categoryEnglish = categoryEnglish;
//     if (type) filter.type = type;
//     if (isCommon) filter.isCommon = isCommon;

//     // Fetch defects from the database
//     const defects = await SewingDefects.find(filter);

//     // Send the response with fetched defects
//     res.json(defects);
//   } catch (error) {
//     // Handle errors
//     res.status(500).json({ message: error.message });
//   }
// });

// //Inspection Detail Defect name
// app.get("/api/defect-definitions", async (req, res) => {
//   try {
//     const defects = await SewingDefects.find({}).sort({ code: 1 });
//     res.json(defects);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch defect definitions" });
//   }
// });

// // Endpoint to search users by emp_id or name (partial match)
// app.get("/api/users/search-by-empid", async (req, res) => {
//   try {
//     const searchTerm = req.query.term;
//     // console.log(`[API /api/users/search-by-empid] Received search term: "${searchTerm}"`);

//     if (!searchTerm || searchTerm.trim() === "") {
//       return res
//         .status(400)
//         .json({ error: "Search term is required and cannot be empty." });
//     }

//     const trimmedSearchTerm = searchTerm.trim();
//     const escapedSearchTerm = escapeRegex(trimmedSearchTerm);

//     const query = {
//       $or: [
//         // Prioritize exact match for emp_id if the term looks like a full ID
//         // This isn't perfect, but helps if user types full ID
//         { emp_id: trimmedSearchTerm }, // Try exact match first
//         { emp_id: { $regex: escapedSearchTerm, $options: "i" } },
//         { eng_name: { $regex: escapedSearchTerm, $options: "i" } }
//       ]
//     };

//     const users = await UserMain.find(
//       query,
//       "emp_id eng_name face_photo" // _id is included by default
//     )
//       .limit(10) // Limit results
//       .lean();

//     // console.log(`[API /api/users/search-by-empid] Found ${users.length} users.`);
//     res.json(users); // Send the array (even if empty)
//   } catch (error) {
//     console.error(
//       "[API /api/users/search-by-empid] Error searching users:",
//       error
//     );
//     res.status(500).json({ error: "Failed to search users" });
//   }
// });

/* =============================================================================
   End Points - Sub-Con Factories
   ============================================================================= */

// // GET - Fetch all sub-con factories
// app.get("/api/subcon-factories", async (req, res) => {
//   try {
//     const factories = await SubconFactory.find({}).sort({ no: 1 }).lean();
//     res.json(factories);
//   } catch (error) {
//     console.error("Error fetching sub-con factories:", error);
//     res.status(500).json({ message: "Server error fetching factories" });
//   }
// });

// // POST - Add a new sub-con factory
// app.post("/api/subcon-factories", async (req, res) => {
//   try {
//     const { no, factory } = req.body;

//     if (no === undefined || no === null || !factory) {
//       return res
//         .status(400)
//         .json({ message: "Factory No and Name are required." });
//     }
//     if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Factory No must be a positive number." });
//     }

//     const existingFactoryByNo = await SubconFactory.findOne({ no: Number(no) });
//     if (existingFactoryByNo) {
//       return res
//         .status(409)
//         .json({ message: `Factory No '${no}' already exists.` });
//     }

//     const existingFactoryByName = await SubconFactory.findOne({ factory });
//     if (existingFactoryByName) {
//       return res
//         .status(409)
//         .json({ message: `Factory name '${factory}' already exists.` });
//     }

//     const newFactory = new SubconFactory({
//       no: Number(no),
//       factory
//     });
//     await newFactory.save();

//     res.status(201).json({
//       message: "Sub-con factory added successfully",
//       factory: newFactory
//     });
//   } catch (error) {
//     console.error("Error adding sub-con factory:", error);
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "Duplicate entry. Factory No or Name might already exist."
//       });
//     }
//     res
//       .status(500)
//       .json({ message: "Failed to add sub-con factory", error: error.message });
//   }
// });

// // PUT - Update an existing sub-con factory by ID
// app.put("/api/subcon-factories/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { no, factory } = req.body;

//     if (no === undefined || no === null || !factory) {
//       return res
//         .status(400)
//         .json({ message: "Factory No and Name are required for update." });
//     }
//     if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Factory No must be a positive number." });
//     }
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid factory ID format." });
//     }

//     // Check for duplicates, excluding the current document being updated
//     const existingFactoryByNo = await SubconFactory.findOne({
//       no: Number(no),
//       _id: { $ne: id }
//     });
//     if (existingFactoryByNo) {
//       return res.status(409).json({
//         message: `Factory No '${no}' already exists for another factory.`
//       });
//     }

//     const existingFactoryByName = await SubconFactory.findOne({
//       factory,
//       _id: { $ne: id }
//     });
//     if (existingFactoryByName) {
//       return res.status(409).json({
//         message: `Factory name '${factory}' already exists for another factory.`
//       });
//     }

//     const updatedFactory = await SubconFactory.findByIdAndUpdate(
//       id,
//       { no: Number(no), factory },
//       { new: true, runValidators: true }
//     );

//     if (!updatedFactory) {
//       return res.status(404).json({ message: "Sub-con factory not found." });
//     }

//     res.status(200).json({
//       message: "Sub-con factory updated successfully",
//       factory: updatedFactory
//     });
//   } catch (error) {
//     console.error("Error updating sub-con factory:", error);
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "Update failed due to duplicate Factory No or Name."
//       });
//     }
//     res.status(500).json({
//       message: "Failed to update sub-con factory",
//       error: error.message
//     });
//   }
// });

// // DELETE - Delete a sub-con factory by ID
// app.delete("/api/subcon-factories/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid factory ID format." });
//     }

//     const deletedFactory = await SubconFactory.findByIdAndDelete(id);
//     if (!deletedFactory) {
//       return res.status(404).json({ message: "Sub-con factory not found." });
//     }

//     res.status(200).json({ message: "Sub-con factory deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting sub-con factory:", error);
//     res.status(500).json({
//       message: "Failed to delete sub-con factory",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   End Points - QC2 Defects
------------------------------ */

// // GET - Fetch all QC2 defects
// app.get("/api/qc2-defects", async (req, res) => {
//   try {
//     const defects = await QC2Defects.find({}).sort({ code: 1 }).lean();
//     res.json(defects);
//   } catch (error) {
//     console.error("Error fetching QC2 defects:", error);
//     res.status(500).json({ message: "Server error fetching defects" });
//   }
// });

// // POST - Add a new QC2 defect
// app.post("/api/qc2-defects", async (req, res) => {
//   try {
//     const { code, defectLetter, english, khmer } = req.body;
//     if (code === undefined || !defectLetter || !english || !khmer) {
//       return res.status(400).json({
//         message: "Code, Defect Letter, English & Khmer names are required."
//       });
//     }
//     const existingByCode = await QC2Defects.findOne({ code });
//     if (existingByCode) {
//       return res
//         .status(409)
//         .json({ message: `Defect code '${code}' already exists.` });
//     }
//     const newDefect = new QC2Defects(req.body);
//     await newDefect.save();
//     res
//       .status(201)
//       .json({ message: "QC2 defect added successfully", defect: newDefect });
//   } catch (error) {
//     console.error("Error adding QC2 defect:", error);
//     if (error.code === 11000)
//       return res
//         .status(409)
//         .json({ message: "Duplicate entry. Defect code or name might exist." });
//     res
//       .status(500)
//       .json({ message: "Failed to add QC2 defect", error: error.message });
//   }
// });

// // PUT - Update an existing QC2 defect by ID
// app.put("/api/qc2-defects/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid defect ID format." });
//     }
//     const updatedDefect = await QC2Defects.findByIdAndUpdate(id, req.body, {
//       new: true,
//       runValidators: true
//     });
//     if (!updatedDefect) {
//       return res.status(404).json({ message: "QC2 Defect not found." });
//     }
//     res.status(200).json({
//       message: "QC2 defect updated successfully",
//       defect: updatedDefect
//     });
//   } catch (error) {
//     console.error("Error updating QC2 defect:", error);
//     if (error.code === 11000)
//       return res
//         .status(409)
//         .json({ message: "Update failed due to duplicate code or name." });
//     res
//       .status(500)
//       .json({ message: "Failed to update QC2 defect", error: error.message });
//   }
// });

// // DELETE - Delete a QC2 defect by ID
// app.delete("/api/qc2-defects/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid defect ID format." });
//     }
//     const defect = await QC2Defects.findById(id);
//     if (!defect) {
//       return res.status(404).json({ message: "QC2 Defect not found." });
//     }
//     // Delete associated image file before deleting the record
//     if (defect.image) {
//       const imagePath = path.join(
//         "storage",
//         defect.image.replace("/storage/", "")
//       );
//       if (fs.existsSync(imagePath)) {
//         fs.unlinkSync(imagePath);
//       }
//     }
//     await QC2Defects.findByIdAndDelete(id);
//     res.status(200).json({
//       message: "QC2 defect and associated image deleted successfully"
//     });
//   } catch (error) {
//     console.error("Error deleting QC2 defect:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to delete QC2 defect", error: error.message });
//   }
// });

// =================================================================
// MULTER CONFIGURATION (Memory Storage Pattern)
// =================================================================

// // Use memoryStorage to handle the file as a buffer in memory first.
// const qc2MemoryStorage = multer.memoryStorage();

// // Configure multer with memory storage, file filter, and limits.
// const uploadQc2Image = multer({
//   storage: qc2MemoryStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only JPEG, PNG, and GIF images are allowed"), false);
//     }
//   }
// });

/* ----------------------------------------------------
   End Points - QC2 Defects Image Management (New Pattern)
---------------------------------------------------- */

// ENDPOINT 1: UPLOAD A NEW IMAGE (Generic)
// Use this when creating a NEW defect. The frontend uploads the image first,
// gets the URL back, then includes that URL in the POST request to create the defect.
// app.post(
//   "/api/qc2-defects/upload-image",
//   uploadQc2Image.single("defectImage"), // "defectImage" is the form field name
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res
//           .status(400)
//           .json({ success: false, message: "No image file provided." });
//       }

//       const uploadPath = path.join(
//         __dirname,
//         "public",
//         "storage",
//         "qc2_images"
//       );
//       //await fs.promises.mkdir(uploadPath, { recursive: true });

//       const fileExtension = path.extname(req.file.originalname);
//       const newFilename = `qc2-defect-${Date.now()}-${Math.round(
//         Math.random() * 1e9
//       )}${fileExtension}`;

//       const fullFilePath = path.join(uploadPath, newFilename);
//       await fs.promises.writeFile(fullFilePath, req.file.buffer);

//       // Return the relative URL path for the database
//       const relativeUrl = `/storage/qc2_images/${newFilename}`;

//       res.status(200).json({ success: true, url: relativeUrl });
//     } catch (error) {
//       console.error("Error in /api/qc2-defects/upload-image:", error);
//       res
//         .status(500)
//         .json({ success: false, message: "Server error during image upload." });
//     }
//   }
// );

// // ENDPOINT 2: REPLACE IMAGE FOR AN EXISTING DEFECT
// // Use this to upload a new image for a defect that already exists.
// app.put(
//   "/api/qc2-defects/:id/image",
//   uploadQc2Image.single("defectImage"),
//   async (req, res) => {
//     try {
//       const { id } = req.params;

//       if (!req.file) {
//         return res
//           .status(400)
//           .json({ success: false, message: "No new image file provided." });
//       }
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid defect ID." });
//       }

//       const defect = await QC2Defects.findById(id);
//       if (!defect) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Defect not found." });
//       }

//       // --- Delete the old image file if it exists ---
//       if (defect.image) {
//         const oldImagePath = path.join(__dirname, "public", defect.image);
//         if (fs.existsSync(oldImagePath)) {
//           await fs.promises.unlink(oldImagePath);
//         }
//       }

//       // --- Save the new image file ---
//       const uploadPath = path.join(
//         __dirname,
//         "public",
//         "storage",
//         "qc2_images"
//       );
//       const fileExtension = path.extname(req.file.originalname);
//       const newFilename = `qc2-defect-${Date.now()}-${Math.round(
//         Math.random() * 1e9
//       )}${fileExtension}`;
//       const fullFilePath = path.join(uploadPath, newFilename);
//       await fs.promises.writeFile(fullFilePath, req.file.buffer);

//       // --- Update the database with the new path ---
//       const newRelativeUrl = `/storage/qc2_images/${newFilename}`;
//       defect.image = newRelativeUrl;
//       const updatedDefect = await defect.save();

//       res.status(200).json({
//         success: true,
//         message: "Image replaced successfully.",
//         defect: updatedDefect
//       });
//     } catch (error) {
//       console.error("Error replacing defect image:", error);
//       res.status(500).json({
//         success: false,
//         message: "Server error while replacing image."
//       });
//     }
//   }
// );

// // ENDPOINT 3: DELETE IMAGE FROM AN EXISTING DEFECT
// // Use this to remove an image without uploading a new one.
// app.delete("/api/qc2-defects/:id/image", async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid defect ID." });
//     }

//     const defect = await QC2Defects.findById(id);
//     if (!defect) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Defect not found." });
//     }

//     if (!defect.image) {
//       return res
//         .status(200)
//         .json({ success: true, message: "No image to delete." });
//     }

//     // --- Delete the image file from the filesystem ---
//     const imagePath = path.join(__dirname, "public", defect.image);
//     if (fs.existsSync(imagePath)) {
//       await fs.promises.unlink(imagePath);
//     }

//     // --- Update the database to remove the image path ---
//     defect.image = ""; // Set to empty string or null
//     const updatedDefect = await defect.save();

//     res.status(200).json({
//       success: true,
//       message: "Image deleted successfully.",
//       defect: updatedDefect
//     });
//   } catch (error) {
//     console.error("Error deleting defect image:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Server error while deleting image." });
//   }
// });

/* -------------------------------------
   NEW End Point - QC2 Defect Categories
------------------------------------- */

// GET - Fetch all unique QC2 defect categories
// app.get("/api/qc2-defect-categories", async (req, res) => {
//   try {
//     // Use the distinct() method to get a unique list of values from the specified field
//     const categories = await QC2Defects.distinct("categoryEnglish");

//     // The result is an array of strings, e.g., ["Fabric", "Workmanship", ...]
//     // We sort them alphabetically for a consistent order in the UI.
//     res.json(categories.sort());
//   } catch (error) {
//     console.error("Error fetching QC2 defect categories:", error);
//     res
//       .status(500)
//       .json({ message: "Server error fetching defect categories" });
//   }
// });

/* ------------------------------
   IE - Task No Allocation Endpoints
------------------------------ */

// // GET - Fetch all tasks with filtering
// // server.js

// // UPDATED - GET - Fetch all tasks with filtering AND pagination
// app.post("/api/ie/tasks", async (req, res) => {
//   try {
//     const {
//       department,
//       productType,
//       processName,
//       taskNo,
//       page = 1,
//       limit = 10
//     } = req.body;
//     const filter = {};

//     if (department) filter.department = department;
//     if (productType) filter.productType = productType;
//     if (processName)
//       filter.processName = { $regex: new RegExp(processName, "i") };
//     if (taskNo) filter.taskNo = Number(taskNo);

//     const skip = (page - 1) * limit;

//     const tasks = await QC2Task.find(filter)
//       .sort({ record_no: 1 })
//       .skip(skip)
//       .limit(limit);

//     const totalTasks = await QC2Task.countDocuments(filter);

//     res.json({
//       tasks,
//       totalPages: Math.ceil(totalTasks / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     console.error("Error fetching IE tasks:", error);
//     res.status(500).json({ message: "Server error fetching tasks." });
//   }
// });

// // GET - Fetch distinct values for filters
// app.get("/api/ie/tasks/filter-options", async (req, res) => {
//   try {
//     const [departments, productTypes, processNames] = await Promise.all([
//       QC2Task.distinct("department"),
//       QC2Task.distinct("productType"),
//       QC2Task.distinct("processName")
//     ]);
//     res.json({
//       departments: departments.sort(),
//       productTypes: productTypes.sort(),
//       processNames: processNames.sort()
//     });
//   } catch (error) {
//     console.error("Error fetching task filter options:", error);
//     res.status(500).json({ message: "Server error fetching filter options." });
//   }
// });

// // PUT - Update a task by its ID
// app.put("/api/ie/tasks/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { taskNo } = req.body;

//     if (taskNo === undefined || isNaN(Number(taskNo))) {
//       return res.status(400).json({ message: "A valid Task No is required." });
//     }

//     const updatedTask = await QC2Task.findByIdAndUpdate(
//       id,
//       { taskNo: Number(taskNo) },
//       { new: true, runValidators: true }
//     );

//     if (!updatedTask) {
//       return res.status(404).json({ message: "Task not found." });
//     }
//     res.json({ message: "Task updated successfully", task: updatedTask });
//   } catch (error) {
//     console.error("Error updating task:", error);
//     res.status(500).json({ message: "Server error updating task." });
//   }
// });

// // DELETE - Delete a task by its ID
// app.delete("/api/ie/tasks/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedTask = await QC2Task.findByIdAndDelete(id);

//     if (!deletedTask) {
//       return res.status(404).json({ message: "Task not found." });
//     }
//     res.json({ message: "Task deleted successfully." });
//   } catch (error) {
//     console.error("Error deleting task:", error);
//     res.status(500).json({ message: "Server error deleting task." });
//   }
// });

/* ------------------------------
   End Points - dt_orders
------------------------------ */

// // Update the MONo search endpoint to handle partial matching
// app.get("/api/search-mono", async (req, res) => {
//   try {
//     const term = req.query.term; // Changed from 'digits' to 'term'
//     if (!term) {
//       return res.status(400).json({ error: "Search term is required" });
//     }

//     const collection = ymProdConnection.db.collection("dt_orders");

//     // Use a case-insensitive regex to match the term anywhere in Order_No
//     const regexPattern = new RegExp(term, "i");

//     const results = await collection
//       .find({
//         Order_No: { $regex: regexPattern }
//       })
//       .project({ Order_No: 1, _id: 0 }) // Only return Order_No field
//       .limit(100) // Limit results to prevent overwhelming the UI
//       .toArray();

//     // Extract unique Order_No values
//     const uniqueMONos = [...new Set(results.map((r) => r.Order_No))];

//     res.json(uniqueMONos);
//   } catch (error) {
//     console.error("Error searching MONo:", error);
//     res.status(500).json({ error: "Failed to search MONo" });
//   }
// });

// // Update /api/order-details endpoint
// app.get("/api/order-details/:mono", async (req, res) => {
//   try {
//     const collection = ymProdConnection.db.collection("dt_orders");
//     const order = await collection.findOne({
//       Order_No: req.params.mono
//     });

//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const colorMap = new Map();
//     order.OrderColors.forEach((colorObj) => {
//       const colorKey = colorObj.Color.toLowerCase().trim();
//       const originalColor = colorObj.Color.trim();

//       if (!colorMap.has(colorKey)) {
//         colorMap.set(colorKey, {
//           originalColor,
//           colorCode: colorObj.ColorCode,
//           chnColor: colorObj.ChnColor,
//           colorKey: colorObj.ColorKey,
//           sizes: new Map()
//         });
//       }

//       colorObj.OrderQty.forEach((sizeEntry) => {
//         const sizeName = Object.keys(sizeEntry)[0];
//         const quantity = sizeEntry[sizeName];
//         const cleanSize = sizeName.split(";")[0].trim();

//         if (quantity > 0) {
//           colorMap.get(colorKey).sizes.set(cleanSize, {
//             orderQty: quantity,
//             planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
//           });
//         }
//       });
//     });

//     const response = {
//       engName: order.EngName,
//       totalQty: order.TotalQty,
//       factoryname: order.Factory || "N/A",
//       custStyle: order.CustStyle || "N/A",
//       country: order.Country || "N/A",
//       colors: Array.from(colorMap.values()).map((c) => ({
//         original: c.originalColor,
//         code: c.colorCode,
//         chn: c.chnColor,
//         key: c.colorKey
//       })),
//       colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
//         acc[curr.originalColor.toLowerCase()] = {
//           sizes: Array.from(curr.sizes.keys()),
//           details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
//             size,
//             orderQty: data.orderQty,
//             planCutQty: data.planCutQty
//           }))
//         };
//         return acc;
//       }, {})
//     };

//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch order details" });
//   }
// });

// // Update /api/order-sizes endpoint
// app.get("/api/order-sizes/:mono/:color", async (req, res) => {
//   try {
//     const collection = ymProdConnection.db.collection("dt_orders");
//     const order = await collection.findOne({ Order_No: req.params.mono });

//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const colorObj = order.OrderColors.find(
//       (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
//     );

//     if (!colorObj) return res.json([]);

//     const sizesWithDetails = colorObj.OrderQty.filter(
//       (entry) => entry[Object.keys(entry)[0]] > 0
//     )
//       .map((entry) => {
//         const sizeName = Object.keys(entry)[0];
//         const cleanSize = sizeName.split(";")[0].trim();
//         return {
//           size: cleanSize,
//           orderQty: entry[sizeName],
//           planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
//         };
//       })
//       .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

//     res.json(sizesWithDetails);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch sizes" });
//   }
// });

// // Bundle Qty Endpoint
// app.get("/api/total-bundle-qty/:mono", async (req, res) => {
//   try {
//     const mono = req.params.mono;
//     const total = await QC2OrderData.aggregate([
//       { $match: { selectedMono: mono } }, // Match documents with the given MONo
//       {
//         $group: {
//           _id: null, // Group all matched documents
//           total: { $sum: "$totalBundleQty" } // Correct sum using field reference with $
//         }
//       }
//     ]);
//     res.json({ total: total[0]?.total || 0 }); // Return the summed total or 0 if no documents
//   } catch (error) {
//     console.error("Error fetching total bundle quantity:", error);
//     res.status(500).json({ error: "Failed to fetch total bundle quantity" });
//   }
// });

// // Endpoint to get total garments count for a specific MONo, Color, Size, and Type
// app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
//   try {
//     const { mono, color, size } = req.params;
//     const { type } = req.query; // Get type from query string, e.g., ?type=end

//     // Validate type parameter
//     if (!type || !["end", "repack"].includes(type)) {
//       return res
//         .status(400)
//         .json({ message: "A valid type ('end' or 'repack') is required." });
//     }

//     const totalCount = await QC2OrderData.aggregate([
//       // Add the new 'type' field to the match criteria
//       { $match: { selectedMono: mono, color: color, size: size, type: type } },
//       {
//         $group: {
//           _id: null,
//           totalCount: { $sum: "$count" }
//         }
//       }
//     ]);

//     res.json({ totalCount: totalCount[0]?.totalCount || 0 });
//   } catch (error) {
//     console.error("Error fetching total garments count:", error);
//     res.status(500).json({ error: "Failed to fetch total garments count" });
//   }
// });

// This endpoint is unused
// async function fetchOrderDetails(mono) {
//   const collection = ymProdConnection.db.collection("dt_orders");
//   const order = await collection.findOne({ Order_No: mono });

//   const colorMap = new Map();
//   order.OrderColors.forEach((c) => {
//     const key = c.Color.toLowerCase().trim();
//     if (!colorMap.has(key)) {
//       colorMap.set(key, {
//         originalColor: c.Color.trim(),
//         sizes: new Map()
//       });
//     }

//     c.OrderQty.forEach((q) => {
//       if (q.Quantity > 0) {
//         const sizeParts = q.Size.split(";");
//         const cleanSize = sizeParts[0].trim();
//         const sizeKey = cleanSize.toLowerCase();
//         if (!colorMap.get(key).sizes.has(sizeKey)) {
//           colorMap.get(key).sizes.set(sizeKey, cleanSize);
//         }
//       }
//     });
//   });

//   return {
//     engName: order.EngName,
//     totalQty: order.TotalQty,
//     colors: Array.from(colorMap.values()).map((c) => c.originalColor),
//     colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
//       acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes.values());
//       return acc;
//     }, {})
//   };
// }

/* ------------------------------
   End Points - Update dt_orders with Washing Specs
------------------------------ */

// app.post("/api/washing-specs/save", async (req, res) => {
//   const { moNo, washingSpecsData } = req.body;

//   if (!moNo || !washingSpecsData || washingSpecsData.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "Missing MO Number or specs data." });
//   }

//   try {
//     const collection = ymProdConnection.db.collection("dt_orders");
//     const orderDocument = await collection.findOne({ Order_No: moNo });

//     if (!orderDocument) {
//       return res.status(404).json({
//         message: `Order with MO No '${moNo}' not found in dt_orders.`
//       });
//     }

//     // --- DATA TRANSFORMATION LOGIC ---

//     const afterWashSpecs = [];
//     const beforeWashSpecs = [];

//     // Process AfterWashSpecs from the first sheet
//     const firstSheetData = washingSpecsData[0];
//     if (firstSheetData && firstSheetData.rows) {
//       firstSheetData.rows.forEach((row, rowIndex) => {
//         const specsArray = [];
//         firstSheetData.headers.forEach((header, headerIndex) => {
//           const specData = row.specs[header.size]["After Washing"];
//           if (specData) {
//             specsArray.push({
//               index: headerIndex + 1,
//               size: header.size,
//               // Save BOTH fraction and decimal for the spec value
//               fraction: specData.raw,
//               decimal: specData.decimal
//             });
//           }
//         });

//         afterWashSpecs.push({
//           no: rowIndex + 1,
//           kValue: "NA",
//           MeasurementPointEngName: row["Measurement Point - Eng"],
//           MeasurementPointChiName: row["Measurement Point - Chi"],
//           // Save the full object for TolMinus and TolPlus
//           TolMinus: {
//             fraction: row["Tol Minus"].raw,
//             decimal: row["Tol Minus"].decimal
//           },
//           TolPlus: {
//             fraction: row["Tol Plus"].raw,
//             decimal: row["Tol Plus"].decimal
//           },
//           Specs: specsArray
//         });
//       });
//     }

//     // Process BeforeWashSpecs from ALL sheets
//     washingSpecsData.forEach((sheetData) => {
//       if (sheetData && sheetData.rows) {
//         sheetData.rows.forEach((row, rowIndex) => {
//           const specsArray = [];
//           sheetData.headers.forEach((header, headerIndex) => {
//             const specData = row.specs[header.size]["Before Washing"];
//             if (specData) {
//               specsArray.push({
//                 index: headerIndex + 1,
//                 size: header.size,
//                 // Save BOTH fraction and decimal for the spec value
//                 fraction: specData.raw,
//                 decimal: specData.decimal
//               });
//             }
//           });

//           beforeWashSpecs.push({
//             no: rowIndex + 1,
//             kValue: sheetData.sheetName,
//             MeasurementPointEngName: row["Measurement Point - Eng"],
//             MeasurementPointChiName: row["Measurement Point - Chi"],
//             // Save the full object for TolMinus and TolPlus
//             TolMinus: {
//               fraction: row["Tol Minus"].raw,
//               decimal: row["Tol Minus"].decimal
//             },
//             TolPlus: {
//               fraction: row["Tol Plus"].raw,
//               decimal: row["Tol Plus"].decimal
//             },
//             Specs: specsArray
//           });
//         });
//       }
//     });

//     // --- UPDATE DATABASE ---
//     const updateResult = await collection.updateOne(
//       { _id: orderDocument._id },
//       {
//         $set: {
//           AfterWashSpecs: afterWashSpecs,
//           BeforeWashSpecs: beforeWashSpecs
//         }
//       }
//     );

//     if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
//       return res
//         .status(200)
//         .json({ message: "Washing specs data is already up to date." });
//     }

//     res.status(200).json({
//       message: `Successfully updated washing specs for MO No '${moNo}'.`
//     });
//   } catch (error) {
//     console.error("Error saving washing specs:", error);
//     res.status(500).json({
//       message: "An internal server error occurred while saving the data."
//     });
//   }
// });

/* ------------------------------
   End Points - qc2_orderdata
------------------------------ */

// const generateRandomId = async () => {
//   let randomId;
//   let isUnique = false;
//   while (!isUnique) {
//     randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
//     const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
//     if (!existing) isUnique = true;
//   }
//   return randomId;
// };

// app.post("/api/save-bundle-data", async (req, res) => {
//   try {
//     const { bundleData } = req.body;
//     if (!bundleData || !Array.isArray(bundleData)) {
//       return res.status(400).json({ message: "Invalid bundle data format." });
//     }
//     const savedRecords = [];

//     // Since all bundles in a single generation request are the same, we only need to calculate the starting package_no once.
//     const firstBundle = bundleData[0];
//     if (!firstBundle.task_no || !firstBundle.type) {
//       return res
//         .status(400)
//         .json({ message: "Task No and Type are required fields." });
//     }

//     let package_no_counter = 1;

//     if (firstBundle.type === "end") {
//       const lastEndBundle = await QC2OrderData.findOne({
//         selectedMono: firstBundle.selectedMono,
//         color: firstBundle.color,
//         size: firstBundle.size,
//         type: "end"
//       }).sort({ package_no: -1 });

//       if (lastEndBundle) {
//         package_no_counter = lastEndBundle.package_no + 1;
//       }
//     }

//     for (const bundle of bundleData) {
//       const randomId = await generateRandomId();
//       const now = new Date();
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
//         package_no: package_no_counter, // Use the calculated package number
//         bundle_random_id: randomId,
//         bundle_id: `${bundle.date}:${bundle.lineNo}:${bundle.selectedMono}:${bundle.color}:${bundle.size}:${package_no_counter}`,
//         updated_date_seperator,
//         updated_time_seperator
//       });

//       await newBundle.save();
//       savedRecords.push(newBundle);

//       // If type is 'end', increment package_no for the next bundle in the same batch. For 'repack', it stays 1.
//       if (bundle.type === "end") {
//         package_no_counter++;
//       }
//     }

//     res.status(201).json({
//       message: "Bundle data saved successfully",
//       data: savedRecords
//     });
//   } catch (error) {
//     console.error("Error saving bundle data:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to save bundle data", error: error.message });
//   }
// });

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */

// app.put("/api/update-bundle-data/:id", async (req, res) => {
//   const { id } = req.params;
//   const updateData = req.body;

//   try {
//     const updatedOrder = await QC2OrderData.findByIdAndUpdate(id, updateData, {
//       new: true
//     });
//     if (!updatedOrder) {
//       return res.status(404).send({ message: "Order not found" });
//     }
//     res.send(updatedOrder);
//   } catch (error) {
//     console.error("Error updating order:", error);
//     res.status(500).send({ message: "Internal Server Error" });
//   }
// });

// // NEW ENDPOINT: Get distinct values for filters
// app.get("/api/bundle-data/distinct-filters", async (req, res) => {
//   try {
//     const [
//       distinctMonos,
//       distinctBuyers,
//       distinctQcIds,
//       distinctLineNos,
//       distinctTaskNos
//     ] = await Promise.all([
//       QC2OrderData.distinct("selectedMono"),
//       QC2OrderData.distinct("buyer"),
//       QC2OrderData.distinct("emp_id"),
//       QC2OrderData.distinct("lineNo"),
//       QC2OrderData.distinct("task_no")
//     ]);

//     res.json({
//       monos: distinctMonos.sort(),
//       buyers: distinctBuyers.sort(),
//       qcIds: distinctQcIds.sort(),
//       lineNos: distinctLineNos.sort((a, b) => {
//         // Custom sort for alphanumeric line numbers
//         const numA = parseInt(a);
//         const numB = parseInt(b);
//         if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//         if (!isNaN(numA)) return -1; // Numbers first
//         if (!isNaN(numB)) return 1;
//         return a.localeCompare(b); // Then string compare
//       }),
//       taskNos: distinctTaskNos.sort((a, b) => a - b) // Add task numbers
//     });
//   } catch (error) {
//     console.error("Error fetching distinct filter values:", error);
//     res.status(500).json({ message: "Failed to fetch distinct filter values" });
//   }
// });

// // MODIFIED ENDPOINT: Fetch filtered bundle data with pagination and aggregated stats
// app.get("/api/filtered-bundle-data", async (req, res) => {
//   try {
//     const {
//       date,
//       lineNo,
//       selectedMono,
//       packageNo,
//       buyer,
//       emp_id,
//       task_no, // New filter param
//       page = 1,
//       limit = 15, // Pagination params, default to page 1, 10 items per page
//       sortBy = "updated_date_seperator", // Default sort field
//       sortOrder = "desc" // Default sort order (descending for latest first)
//     } = req.query;

//     let matchQuery = {};

//     if (date) {
//       const normalizedQueryDate = normalizeDateString(date);
//       if (normalizedQueryDate) {
//         matchQuery.updated_date_seperator = normalizedQueryDate;
//       }
//     }
//     if (lineNo) matchQuery.lineNo = lineNo;
//     if (selectedMono) matchQuery.selectedMono = selectedMono;
//     if (packageNo) {
//       const pkgNo = parseInt(packageNo);
//       if (!isNaN(pkgNo)) matchQuery.package_no = pkgNo;
//     }
//     if (buyer) matchQuery.buyer = buyer;
//     if (emp_id) matchQuery.emp_id = emp_id;
//     if (task_no) matchQuery.task_no = parseInt(task_no, 10); // Add task_no to query

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     // Determine sort direction
//     const sortDirection = sortOrder === "asc" ? 1 : -1;
//     let sortOptions = {};
//     if (sortBy === "updated_date_seperator") {
//       // For date and time, sort by date then time if dates are equal
//       sortOptions = {
//         updated_date_seperator: sortDirection,
//         updated_time_seperator: sortDirection
//       };
//     } else {
//       sortOptions[sortBy] = sortDirection;
//     }

//     // Fetch total count of matching documents for pagination
//     const totalRecords = await QC2OrderData.countDocuments(matchQuery);

//     // Fetch paginated and sorted records
//     const records = await QC2OrderData.find(matchQuery)
//       .sort(sortOptions) // Apply sorting
//       .skip(skip) // Apply skip for pagination
//       .limit(limitNum); // Apply limit for pagination

//     // Calculate aggregated stats based on ALL filtered records (not just the current page)
//     // This might be resource-intensive if the filtered set is very large.
//     // Consider if stats should also be paginated or if an approximation is okay for large sets.

//     // --- New Stats Aggregation ---
//     const statsPipeline = [
//       { $match: matchQuery },
//       {
//         $group: {
//           _id: { task_no: "$task_no", mono: "$selectedMono" },
//           garmentQty: { $sum: "$count" },
//           bundleCount: { $sum: 1 } // Use 1 to count documents, not bundleQty
//         }
//       },
//       {
//         $group: {
//           _id: "$_id.task_no",
//           totalGarmentQty: { $sum: "$garmentQty" },
//           totalBundles: { $sum: "$bundleCount" },
//           uniqueStyles: { $addToSet: "$_id.mono" }
//         }
//       }
//     ];

//     const statsResults = await QC2OrderData.aggregate(statsPipeline);

//     //const allFilteredRecordsForStats = await QC2OrderData.find(matchQuery); // Re-query without pagination for stats

//     let totalGarmentQty = 0;
//     let totalBundles = 0;
//     let totalStylesSet = new Set();
//     let garmentQtyByTask = {};
//     let bundleCountByTask = {};

//     statsResults.forEach((result) => {
//       const task = result._id || "unknown"; // Handle null task_no if any
//       totalGarmentQty += result.totalGarmentQty;
//       totalBundles += result.totalBundles;
//       result.uniqueStyles.forEach((style) => totalStylesSet.add(style));
//       garmentQtyByTask[task] = result.totalGarmentQty;
//       bundleCountByTask[task] = result.totalBundles;
//     });

//     const stats = {
//       totalGarmentQty,
//       totalBundles,
//       totalStyles: totalStylesSet.size,
//       garmentQtyByTask, // e.g., { '51': 500, '52': 734 }
//       bundleCountByTask
//     };

//     res.json({
//       records,
//       stats,
//       pagination: {
//         currentPage: pageNum,
//         totalPages: Math.ceil(totalRecords / limitNum),
//         totalRecords: totalRecords,
//         limit: limitNum
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching filtered bundle data:", error);
//     res.status(500).json({ message: "Failed to fetch filtered bundle data" });
//   }
// });

// // Ensure existing /api/user-batches is either removed or updated if it's now redundant

// app.get("/api/user-batches", async (req, res) => {
//   try {
//     const { emp_id } = req.query;
//     if (!emp_id) {
//       return res.status(400).json({ message: "emp_id is required" });
//     }

//     const batches = await QC2OrderData.find({ emp_id }).sort({
//       updated_date_seperator: -1,
//       updated_time_seperator: -1
//     });
//     res.json(batches);
//   } catch (error) {
//     console.error("Error fetching user batches:", error);
//     res.status(500).json({ message: "Failed to fetch user batches" });
//   }
// });

/* ------------------------------
   End Points - Reprint - qc2_orderdata
------------------------------ */

// // NEW ENDPOINT: Get distinct values for ReprintTab filters from qc2_orderdata
// app.get("/api/reprint-distinct-filters", async (req, res) => {
//   try {
//     const distinctMonos = await QC2OrderData.distinct("selectedMono");
//     const distinctPackageNos = await QC2OrderData.distinct("package_no"); // Might be many if not filtered first
//     const distinctEmpIds = await QC2OrderData.distinct("emp_id");
//     const distinctLineNos = await QC2OrderData.distinct("lineNo");
//     const distinctBuyers = await QC2OrderData.distinct("buyer");

//     res.json({
//       monos: distinctMonos.sort(),
//       packageNos: distinctPackageNos
//         .map(String)
//         .sort((a, b) => parseInt(a) - parseInt(b)), // Ensure string for select, sort numerically
//       empIds: distinctEmpIds.sort(),
//       lineNos: distinctLineNos.sort((a, b) => {
//         const numA = parseInt(a);
//         const numB = parseInt(b);
//         if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//         if (!isNaN(numA)) return -1;
//         if (!isNaN(numB)) return 1;
//         return a.localeCompare(b);
//       }),
//       buyers: distinctBuyers.sort()
//     });
//   } catch (error) {
//     console.error("Error fetching distinct filter values for reprint:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch distinct filter values for reprint" });
//   }
// });

// // MODIFIED ENDPOINT: /api/reprint-search to support new filters, pagination, and sorting
// app.get("/api/reprint-search", async (req, res) => {
//   try {
//     const {
//       date,
//       lineNo,
//       selectedMono,
//       packageNo,
//       buyer,
//       empId, // Renamed from selectedEmpId to empId for consistency
//       page = 1,
//       limit = 15,
//       sortBy = "updated_date_seperator", // Default sort for latest
//       sortOrder = "desc"
//     } = req.query;

//     let matchQuery = {};

//     if (date) {
//       const normalizedQueryDate = normalizeDateString(date);
//       if (normalizedQueryDate) {
//         matchQuery.updated_date_seperator = normalizedQueryDate;
//       }
//     }
//     if (lineNo) matchQuery.lineNo = lineNo;
//     if (selectedMono) matchQuery.selectedMono = selectedMono;
//     if (packageNo) {
//       const pkgNo = parseInt(packageNo);
//       if (!isNaN(pkgNo)) matchQuery.package_no = pkgNo;
//     }
//     if (buyer) matchQuery.buyer = buyer;
//     if (empId) matchQuery.emp_id = empId;

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const sortDirection = sortOrder === "asc" ? 1 : -1;
//     let sortOptions = {};
//     if (sortBy === "updated_date_seperator") {
//       sortOptions = {
//         updated_date_seperator: sortDirection,
//         updated_time_seperator: sortDirection
//       };
//     } else {
//       sortOptions[sortBy] = sortDirection;
//     }

//     const totalRecords = await QC2OrderData.countDocuments(matchQuery);
//     const records = await QC2OrderData.find(matchQuery)
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(limitNum);

//     // For reprint, we don't necessarily need global stats like in the other tab,
//     // but we do need pagination info.
//     res.json({
//       records,
//       pagination: {
//         currentPage: pageNum,
//         totalPages: Math.ceil(totalRecords / limitNum),
//         totalRecords,
//         limit: limitNum
//       }
//     });
//   } catch (error) {
//     console.error("Error searching qc2_orderdata for reprint:", error);
//     res.status(500).json({ error: "Failed to search records for reprint" });
//   }
// });

// // The /api/reprint-colors-sizes/:mono endpoint might become less relevant
// app.get("/api/reprint-colors-sizes/:mono", async (req, res) => {
//   try {
//     const mono = req.params.mono;
//     // This fetches distinct color/size combinations for a given MONO from qc2_orderdata
//     const result = await QC2OrderData.aggregate([
//       { $match: { selectedMono: mono } },
//       { $group: { _id: { color: "$color", size: "$size" } } },
//       { $group: { _id: "$_id.color", sizes: { $addToSet: "$_id.size" } } }, // Use $addToSet for unique sizes
//       { $project: { color: "$_id", sizes: 1, _id: 0 } },
//       { $sort: { color: 1 } } // Sort colors
//     ]);
//     // Further sort sizes within each color if needed client-side or here
//     result.forEach((item) => item.sizes.sort());
//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching colors/sizes for reprint:", error);
//     res.status(500).json({ error: "Failed to fetch colors/sizes for reprint" });
//   }
// });

/* ------------------------------
   End Points - Ironing
------------------------------ */

// // New Endpoint to Get Bundle by Random ID
// app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
//   try {
//     const bundle = await QC2OrderData.findOne({
//       bundle_random_id: req.params.randomId
//     });

//     if (!bundle) {
//       return res.status(404).json({ error: "Bundle not found" });
//     }

//     res.json(bundle);
//   } catch (error) {
//     console.error("Error fetching bundle:", error);
//     res.status(500).json({ error: "Failed to fetch bundle" });
//   }
// });

// // Endpoint to check if a bundle ID already exists
// app.post("/api/check-bundle-id", async (req, res) => {
//   try {
//     const { date, lineNo, selectedMono, color, size } = req.body;

//     // Find all bundle IDs matching the criteria
//     const existingBundles = await QC2OrderData.find({
//       bundle_id: {
//         $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`
//       }
//     });

//     // Extract the largest number from the bundle IDs
//     let largestNumber = 0;
//     existingBundles.forEach((bundle) => {
//       const parts = bundle.bundle_id.split(":");
//       const number = parseInt(parts[parts.length - 1]);
//       if (number > largestNumber) {
//         largestNumber = number;
//       }
//     });

//     res.status(200).json({ largestNumber });
//   } catch (error) {
//     console.error("Error checking bundle ID:", error);
//     res.status(500).json({
//       message: "Failed to check bundle ID",
//       error: error.message
//     });
//   }
// });

// // Check if ironing record exists
// app.get("/api/check-ironing-exists/:bundleId", async (req, res) => {
//   try {
//     const record = await Ironing.findOne({
//       ironing_bundle_id: req.params.bundleId
//     });
//     res.json({ exists: !!record });
//   } catch (error) {
//     res.status(500).json({ error: "Error checking record" });
//   }
// });

// // New endpoint to get the last ironing record ID for a specific emp_id
// app.get("/api/last-ironing-record-id/:emp_id", async (req, res) => {
//   try {
//     const { emp_id } = req.params;
//     const lastRecord = await Ironing.findOne(
//       { emp_id_ironing: emp_id }, // Filter by emp_id_ironing
//       {},
//       { sort: { ironing_record_id: -1 } } // Sort descending to get the highest ID
//     );
//     const lastRecordId = lastRecord ? lastRecord.ironing_record_id : 0; // Start at 0 if no records exist
//     res.json({ lastRecordId });
//   } catch (error) {
//     console.error("Error fetching last ironing record ID:", error);
//     res.status(500).json({ error: "Failed to fetch last ironing record ID" });
//   }
// });

// // Modified endpoint to fetch defect card data with logging
// app.get("/api/check-defect-card/:defectPrintId", async (req, res) => {
//   try {
//     const { defectPrintId } = req.params;
//     //console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log

//     const defectRecord = await QC2InspectionPassBundle.findOne({
//       "printArray.defect_print_id": defectPrintId,
//       "printArray.isCompleted": false
//     });
//     if (!defectRecord) {
//       console.log(
//         `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
//       );
//       return res.status(404).json({ message: "Defect card not found" });
//     }

//     const printData = defectRecord.printArray.find(
//       (item) => item.defect_print_id === defectPrintId
//     );
//     if (!printData) {
//       console.log(
//         `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
//       );
//       return res
//         .status(404)
//         .json({ message: "Defect print ID not found in printArray" });
//     }

//     const formattedData = {
//       defect_print_id: printData.defect_print_id,
//       totalRejectGarmentCount: printData.totalRejectGarmentCount,
//       package_no: defectRecord.package_no, // Include package_no
//       moNo: defectRecord.moNo,
//       selectedMono: defectRecord.moNo,
//       custStyle: defectRecord.custStyle,
//       buyer: defectRecord.buyer,
//       color: defectRecord.color,
//       size: defectRecord.size,
//       factory: defectRecord.factory,
//       country: defectRecord.country,
//       lineNo: defectRecord.lineNo,
//       department: defectRecord.department,
//       count: defectRecord.checkedQty,
//       emp_id_inspection: defectRecord.emp_id_inspection,
//       inspection_date: defectRecord.inspection_date,
//       inspection_time: defectRecord.inspection_time,
//       sub_con: defectRecord.sub_con,
//       sub_con_factory: defectRecord.sub_con_factory,
//       bundle_id: defectRecord.bundle_id,
//       bundle_random_id: defectRecord.bundle_random_id
//     };

//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error checking defect card:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Save ironing record
// app.post("/api/save-ironing", async (req, res) => {
//   try {
//     const newRecord = new Ironing(req.body);
//     await newRecord.save();
//     res.status(201).json({ message: "Record saved successfully" });
//   } catch (error) {
//     if (error.code === 11000) {
//       res.status(400).json({ error: "Duplicate record found" });
//     } else {
//       res.status(500).json({ error: "Failed to save record" });
//     }
//   }
// });

// // For Data tab display records in a table
// app.get("/api/ironing-records", async (req, res) => {
//   try {
//     const records = await Ironing.find();
//     res.json(records);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch ironing records" });
//   }
// });

// // NEW ENDPOINT: Get distinct filter values for Ironing Records
// app.get("/api/ironing-records/distinct-filters", async (req, res) => {
//   try {
//     // Run all distinct queries on the Ironing collection in parallel
//     const [
//       distinctTaskNos,
//       moNosFromMoNoField,
//       moNosFromSelectedMonoField,
//       distinctPackageNos,
//       distinctDepartments,
//       distinctLineNos, // ADDED
//       distinctQcIds // ADDED
//     ] = await Promise.all([
//       Ironing.distinct("task_no_ironing").exec(),
//       Ironing.distinct("moNo").exec(),
//       Ironing.distinct("selectedMono").exec(),
//       Ironing.distinct("package_no").exec(),
//       Ironing.distinct("department").exec(),
//       Ironing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
//       Ironing.distinct("emp_id_ironing").exec() // ADDED: Fetch distinct QC IDs
//     ]);

//     // Combine MO numbers from two different fields and get unique values
//     const combinedMoNos = [
//       ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
//     ];

//     // Send the cleaned and sorted data in the JSON response
//     res.json({
//       taskNos: distinctTaskNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),
//       moNos: combinedMoNos.filter((item) => item != null).sort(),
//       packageNos: distinctPackageNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),
//       departments: distinctDepartments.filter((item) => item != null).sort(),
//       lineNos: distinctLineNos
//         .filter((item) => item != null)
//         .sort((a, b) => {
//           const numA = parseInt(a);
//           const numB = parseInt(b);
//           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//           if (!isNaN(numA)) return -1;
//           if (!isNaN(numB)) return 1;
//           return String(a).localeCompare(String(b));
//         }),
//       qcIds: distinctQcIds.filter((item) => item != null).sort()
//     });
//   } catch (error) {
//     console.error("Error fetching distinct ironing filter options:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch distinct ironing filter options" });
//   }
// });

/* ------------------------------
   End Points - Washing
------------------------------ */

// app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
//   try {
//     const bundle = await QC2OrderData.findOne({
//       bundle_random_id: req.params.randomId
//     });
//     if (!bundle) {
//       return res.status(404).json({ error: "Bundle not found" });
//     }
//     res.json(bundle);
//   } catch (error) {
//     console.error("Error fetching bundle:", error);
//     res.status(500).json({ error: "Failed to fetch bundle" });
//   }
// });

// app.get("/api/check-washing-exists/:bundleId", async (req, res) => {
//   try {
//     const record = await Washing.findOne({
//       washing_bundle_id: req.params.bundleId
//     });
//     res.json({ exists: !!record });
//   } catch (error) {
//     res.status(500).json({ error: "Error checking record" });
//   }
// });

// app.get("/api/check-defect-card-washing/:defectPrintId", async (req, res) => {
//   try {
//     const { defectPrintId } = req.params;
//     const defectRecord = await QC2InspectionPassBundle.findOne({
//       "printArray.defect_print_id": defectPrintId,
//       "printArray.isCompleted": false
//     });
//     if (!defectRecord) {
//       console.log(
//         `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
//       );
//       return res.status(404).json({ message: "Defect card not found" });
//     }
//     const printData = defectRecord.printArray.find(
//       (item) => item.defect_print_id === defectPrintId
//     );
//     if (!printData) {
//       console.log(
//         `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
//       );
//       return res
//         .status(404)
//         .json({ message: "Defect print ID not found in printArray" });
//     }
//     const formattedData = {
//       defect_print_id: printData.defect_print_id,
//       totalRejectGarmentCount: printData.totalRejectGarmentCount,
//       package_no: defectRecord.package_no,
//       moNo: defectRecord.moNo,
//       selectedMono: defectRecord.moNo,
//       custStyle: defectRecord.custStyle,
//       buyer: defectRecord.buyer,
//       color: defectRecord.color,
//       size: defectRecord.size,
//       factory: defectRecord.factory,
//       country: defectRecord.country,
//       lineNo: defectRecord.lineNo,
//       department: defectRecord.department,
//       count: defectRecord.checkedQty,
//       emp_id_inspection: defectRecord.emp_id_inspection,
//       inspection_date: defectRecord.inspection_date,
//       inspection_time: defectRecord.inspection_time,
//       sub_con: defectRecord.sub_con,
//       sub_con_factory: defectRecord.sub_con_factory,
//       bundle_id: defectRecord.bundle_id,
//       bundle_random_id: defectRecord.bundle_random_id
//     };
//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error checking defect card for washing:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// app.get("/api/last-washing-record-id/:emp_id", async (req, res) => {
//   try {
//     const { emp_id } = req.params;
//     const lastRecord = await Washing.findOne(
//       { emp_id_washing: emp_id },
//       {},
//       { sort: { washing_record_id: -1 } }
//     );
//     const lastRecordId = lastRecord ? lastRecord.washing_record_id : 0;
//     res.json({ lastRecordId });
//   } catch (error) {
//     console.error("Error fetching last washing record ID:", error);
//     res.status(500).json({ error: "Failed to fetch last washing record ID" });
//   }
// });

// app.post("/api/save-washing", async (req, res) => {
//   try {
//     const newRecord = new Washing(req.body);
//     await newRecord.save();
//     res.status(201).json({ message: "Record saved successfully" });
//   } catch (error) {
//     if (error.code === 11000) {
//       res.status(400).json({ error: "Duplicate record found" });
//     } else {
//       res.status(500).json({ error: "Failed to save record" });
//     }
//   }
// });

// app.get("/api/washing-records", async (req, res) => {
//   try {
//     const records = await Washing.find();
//     res.json(records);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch washing records" });
//   }
// });

// // NEW ENDPOINT: Get distinct filter values for Washing Records
// app.get("/api/washing-records/distinct-filters", async (req, res) => {
//   try {
//     // Run all distinct queries in parallel for better performance
//     const [
//       distinctTaskNos,
//       moNosFromMoNoField,
//       moNosFromSelectedMonoField,
//       distinctPackageNos,
//       distinctDepartments,
//       distinctLineNos, // ADDED
//       distinctQcIds // ADDED
//     ] = await Promise.all([
//       Washing.distinct("task_no_washing").exec(),
//       Washing.distinct("moNo").exec(),
//       Washing.distinct("selectedMono").exec(),
//       Washing.distinct("package_no").exec(),
//       Washing.distinct("department").exec(),
//       Washing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
//       Washing.distinct("emp_id_washing").exec() // ADDED: Fetch distinct QC IDs from washing records
//     ]);

//     // Post-processing: Combine, filter, and sort the results after they are fetched

//     // 1. Combine MO numbers from two different fields and get only unique values
//     const combinedMoNos = [
//       ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
//     ];

//     // 2. Send the cleaned and sorted data in the JSON response
//     res.json({
//       taskNos: distinctTaskNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),

//       moNos: combinedMoNos.filter((item) => item != null).sort(),

//       packageNos: distinctPackageNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),

//       departments: distinctDepartments.filter((item) => item != null).sort(),

//       // ADDED: lineNos field
//       lineNos: distinctLineNos
//         .filter((item) => item != null)
//         .sort((a, b) => {
//           const numA = parseInt(a);
//           const numB = parseInt(b);
//           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//           if (!isNaN(numA)) return -1;
//           if (!isNaN(numB)) return 1;
//           return String(a).localeCompare(String(b));
//         }),

//       // ADDED: qcIds field
//       qcIds: distinctQcIds.filter((item) => item != null).sort()

//       // REMOVED: custStyles field is no longer sent
//       // custStyles: distinctCustStyles.filter((item) => item != null).sort()
//     });
//   } catch (error) {
//     console.error("Error fetching distinct washing filter options:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch distinct filter options" });
//   }
// });

/* ------------------------------
   End Points - OPA
------------------------------ */

// app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
//   try {
//     const bundle = await QC2OrderData.findOne({
//       bundle_random_id: req.params.randomId
//     });
//     if (!bundle) {
//       return res.status(404).json({ error: "Bundle not found" });
//     }
//     res.json(bundle);
//   } catch (error) {
//     console.error("Error fetching bundle:", error);
//     res.status(500).json({ error: "Failed to fetch bundle" });
//   }
// });

// app.get("/api/check-opa-exists/:bundleId", async (req, res) => {
//   try {
//     const record = await OPA.findOne({
//       opa_bundle_id: req.params.bundleId
//     });
//     res.json({ exists: !!record });
//   } catch (error) {
//     res.status(500).json({ error: "Error checking record" });
//   }
// });

// app.get("/api/check-defect-card-opa/:defectPrintId", async (req, res) => {
//   try {
//     const { defectPrintId } = req.params;
//     const defectRecord = await QC2InspectionPassBundle.findOne({
//       "printArray.defect_print_id": defectPrintId,
//       "printArray.isCompleted": false
//     });
//     if (!defectRecord) {
//       console.log(
//         `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
//       );
//       return res.status(404).json({ message: "Defect card not found" });
//     }
//     const printData = defectRecord.printArray.find(
//       (item) => item.defect_print_id === defectPrintId
//     );
//     if (!printData) {
//       console.log(
//         `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
//       );
//       return res
//         .status(404)
//         .json({ message: "Defect print ID not found in printArray" });
//     }
//     const formattedData = {
//       defect_print_id: printData.defect_print_id,
//       totalRejectGarmentCount: printData.totalRejectGarmentCount,
//       package_no: defectRecord.package_no,
//       moNo: defectRecord.moNo,
//       selectedMono: defectRecord.moNo,
//       custStyle: defectRecord.custStyle,
//       buyer: defectRecord.buyer,
//       color: defectRecord.color,
//       size: defectRecord.size,
//       factory: defectRecord.factory,
//       country: defectRecord.country,
//       lineNo: defectRecord.lineNo,
//       department: defectRecord.department,
//       count: defectRecord.checkedQty,
//       emp_id_inspection: defectRecord.emp_id_inspection,
//       inspection_date: defectRecord.inspection_date,
//       inspection_time: defectRecord.inspection_time,
//       sub_con: defectRecord.sub_con,
//       sub_con_factory: defectRecord.sub_con_factory,
//       bundle_id: defectRecord.bundle_id,
//       bundle_random_id: defectRecord.bundle_random_id
//     };
//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error checking defect card for OPA:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// app.get("/api/last-opa-record-id/:emp_id", async (req, res) => {
//   try {
//     const { emp_id } = req.params;
//     const lastRecord = await OPA.findOne(
//       { emp_id_opa: emp_id },
//       {},
//       { sort: { opa_record_id: -1 } }
//     );
//     const lastRecordId = lastRecord ? lastRecord.opa_record_id : 0;
//     res.json({ lastRecordId });
//   } catch (error) {
//     console.error("Error fetching last OPA record ID:", error);
//     res.status(500).json({ error: "Failed to fetch last OPA record ID" });
//   }
// });

// app.post("/api/save-opa", async (req, res) => {
//   try {
//     const newRecord = new OPA(req.body);
//     await newRecord.save();
//     res.status(201).json({ message: "Record saved successfully" });
//   } catch (error) {
//     if (error.code === 11000) {
//       res.status(400).json({ error: "Duplicate record found" });
//     } else {
//       res.status(500).json({ error: "Failed to save record" });
//     }
//   }
// });

// app.get("/api/opa-records", async (req, res) => {
//   try {
//     const records = await OPA.find();
//     res.json(records);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch OPA records" });
//   }
// });

// // NEW ENDPOINT: Get distinct filter values for OPA Records
// app.get("/api/opa-records/distinct-filters", async (req, res) => {
//   try {
//     // Run all distinct queries in parallel for better performance
//     const [
//       distinctTaskNos,
//       moNosFromMoNoField,
//       moNosFromSelectedMonoField,
//       distinctPackageNos,
//       distinctDepartments,
//       distinctLineNos, // ADDED
//       distinctQcIds // ADDED
//     ] = await Promise.all([
//       OPA.distinct("task_no_opa").exec(), // Querying the OPA collection
//       OPA.distinct("moNo").exec(),
//       OPA.distinct("selectedMono").exec(),
//       OPA.distinct("package_no").exec(),
//       OPA.distinct("department").exec(),
//       OPA.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
//       OPA.distinct("emp_id_opa").exec() // ADDED: Fetch distinct QC IDs from OPA records
//     ]);

//     // Combine MO numbers from two different fields and get only unique values
//     const combinedMoNos = [
//       ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
//     ];

//     // Send the cleaned and sorted data in the JSON response
//     res.json({
//       taskNos: distinctTaskNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),

//       moNos: combinedMoNos.filter((item) => item != null).sort(),

//       packageNos: distinctPackageNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),

//       departments: distinctDepartments.filter((item) => item != null).sort(),

//       lineNos: distinctLineNos
//         .filter((item) => item != null)
//         .sort((a, b) => {
//           const numA = parseInt(a);
//           const numB = parseInt(b);
//           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//           if (!isNaN(numA)) return -1;
//           if (!isNaN(numB)) return 1;
//           return String(a).localeCompare(String(b));
//         }),

//       qcIds: distinctQcIds.filter((item) => item != null).sort()
//     });
//   } catch (error) {
//     console.error("Error fetching distinct OPA filter options:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch distinct OPA filter options" });
//   }
// });

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

// ENDPOINT 1: Get data for a scanned card (Order or Defect) and check for uniqueness.
// This is the primary endpoint the scanner will call.
// app.post("/api/packing/get-scan-data", async (req, res) => {
//   const { randomId, taskNo } = req.body;

//   if (!randomId || !taskNo) {
//     return res
//       .status(400)
//       .json({ message: "Card ID and Task No are required." });
//   }

//   // --- TASK-SPECIFIC UNIQUENESS CHECK ---
//   // The unique ID for a packing operation is the card's ID combined with the task number.
//   const uniquePackingId = `${randomId}-${taskNo}`;
//   const existingScan = await Packing.findOne({
//     packing_bundle_id: uniquePackingId
//   });

//   if (existingScan) {
//     return res.status(409).json({
//       message: `This card has already been scanned for Task No ${taskNo}.`
//     }); // 409 Conflict
//   }

//   try {
//     // First, check if the ID corresponds to an Order Card by looking for bundle_random_id.
//     let inspectionDoc = await QC2InspectionPassBundle.findOne({
//       bundle_random_id: randomId
//     });

//     if (inspectionDoc) {
//       // --- It's an ORDER CARD ---
//       // Calculate packing quantity as per the new logic.
//       const packingQty =
//         (inspectionDoc.checkedQty || 0) - (inspectionDoc.totalRejects || 0);

//       const responseData = {
//         isDefectCard: false,
//         bundle_id: inspectionDoc.bundle_id,
//         bundle_random_id: inspectionDoc.bundle_random_id,
//         package_no: inspectionDoc.package_no,
//         moNo: inspectionDoc.moNo,
//         custStyle: inspectionDoc.custStyle,
//         buyer: inspectionDoc.buyer,
//         color: inspectionDoc.color,
//         size: inspectionDoc.size,
//         lineNo: inspectionDoc.lineNo,
//         department: inspectionDoc.department,
//         factory: inspectionDoc.factory,
//         country: inspectionDoc.country,
//         sub_con: inspectionDoc.sub_con,
//         sub_con_factory: inspectionDoc.sub_con_factory,
//         count: packingQty,
//         passQtyPacking: packingQty
//       };
//       return res.json(responseData);
//     }

//     // If not an Order Card, check if it's a Defect Card.
//     inspectionDoc = await QC2InspectionPassBundle.findOne({
//       "printArray.defect_print_id": randomId
//     });

//     if (inspectionDoc) {
//       // --- It's a DEFECT CARD ---
//       const printEntry = inspectionDoc.printArray.find(
//         (p) => p.defect_print_id === randomId
//       );
//       if (!printEntry) {
//         return res
//           .status(404)
//           .json({ message: "Defect card data not found within the bundle." });
//       }

//       // Calculate packing quantity for defect card.
//       const packingQty =
//         (inspectionDoc.totalRejects || 0) -
//         (printEntry.totalRejectGarment_Var || 0);

//       const responseData = {
//         isDefectCard: true,
//         defect_print_id: printEntry.defect_print_id,
//         bundle_id: inspectionDoc.bundle_id,
//         bundle_random_id: inspectionDoc.bundle_random_id,
//         package_no: inspectionDoc.package_no,
//         moNo: inspectionDoc.moNo,
//         custStyle: inspectionDoc.custStyle,
//         buyer: inspectionDoc.buyer,
//         color: inspectionDoc.color,
//         size: inspectionDoc.size,
//         lineNo: inspectionDoc.lineNo,
//         department: inspectionDoc.department,
//         factory: inspectionDoc.factory,
//         country: inspectionDoc.country,
//         sub_con: inspectionDoc.sub_con,
//         sub_con_factory: inspectionDoc.sub_con_factory,
//         count: packingQty,
//         passQtyPacking: packingQty
//       };
//       return res.json(responseData);
//     }

//     // If the ID is not found in either context, it's invalid.
//     return res.status(404).json({
//       message: "Invalid QR Code. Not found as an Order Card or a Defect Card."
//     });
//   } catch (error) {
//     console.error("Error fetching packing scan data:", error);
//     res.status(500).json({ message: "Server error fetching data." });
//   }
// });

// // ENDPOINT 2: Save a new packing record. This remains simple.
// app.post("/api/packing/save-record", async (req, res) => {
//   try {
//     const newRecordData = req.body;

//     if (!newRecordData.packing_bundle_id) {
//       return res
//         .status(400)
//         .json({ message: "packing_bundle_id is required." });
//     }

//     const existingScan = await Packing.findOne({
//       packing_bundle_id: newRecordData.packing_bundle_id
//     });
//     if (existingScan) {
//       return res.status(409).json({
//         message: `This card has already been scanned for Task No ${newRecordData.task_no_packing}.`
//       });
//     }

//     const newRecord = new Packing(newRecordData);
//     await newRecord.save();

//     res
//       .status(201)
//       .json({ message: "Packing record saved successfully", data: newRecord });
//   } catch (error) {
//     console.error("Error saving packing record:", error);
//     res.status(500).json({ message: "Failed to save packing record." });
//   }
// });

// // ENDPOINT 3: Get all packing records for the data table.
// app.get("/api/packing/get-all-records", async (req, res) => {
//   try {
//     const records = await Packing.find().sort({
//       packing_updated_date: -1,
//       packing_update_time: -1
//     });
//     res.json(records);
//   } catch (error) {
//     console.error("Error fetching packing records:", error);
//     res.status(500).json({ message: "Failed to fetch packing records." });
//   }
// });

// // NEW ENDPOINT: Get distinct filter values for Packing Records
// app.get("/api/packing-records/distinct-filters", async (req, res) => {
//   try {
//     // Run all distinct queries on the Packing collection in parallel
//     const [
//       distinctTaskNos,
//       moNosFromMoNoField,
//       distinctPackageNos,
//       distinctDepartments,
//       distinctLineNos, // ADDED
//       distinctQcIds // ADDED
//     ] = await Promise.all([
//       Packing.distinct("task_no_packing").exec(),
//       Packing.distinct("moNo").exec(),
//       Packing.distinct("package_no").exec(),
//       Packing.distinct("department").exec(),
//       Packing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
//       Packing.distinct("emp_id_packing").exec() // ADDED: Fetch distinct QC IDs
//     ]);

//     // Send the cleaned and sorted data in the JSON response
//     res.json({
//       taskNos: distinctTaskNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),
//       moNos: distinctMoNos.filter((item) => item != null).sort(),
//       packageNos: distinctPackageNos
//         .filter((item) => item != null)
//         .sort((a, b) => a - b),
//       departments: distinctDepartments.filter((item) => item != null).sort(),
//       lineNos: distinctLineNos
//         .filter((item) => item != null)
//         .sort((a, b) => {
//           const numA = parseInt(a);
//           const numB = parseInt(b);
//           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//           if (!isNaN(numA)) return -1;
//           if (!isNaN(numB)) return 1;
//           return String(a).localeCompare(String(b));
//         }),
//       qcIds: distinctQcIds.filter((item) => item != null).sort()
//     });
//   } catch (error) {
//     console.error("Error fetching distinct packing filter options:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch distinct packing filter options" });
//   }
// });

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

// app.get("/api/dashboard-stats", async (req, res) => {
//   try {
//     const { factory, lineNo, moNo, customer, timeInterval = "1" } = req.query;
//     let matchQuery = {};

//     // Apply filters if provided
//     if (factory) matchQuery["headerData.factory"] = factory;
//     if (lineNo) matchQuery["headerData.lineNo"] = lineNo;
//     if (moNo) matchQuery["headerData.moNo"] = moNo;
//     if (customer) matchQuery["headerData.customer"] = customer;

//     // Get unique filter values
//     const filterValues = await QCData.aggregate([
//       {
//         $group: {
//           _id: null,
//           factories: { $addToSet: "$headerData.factory" },
//           lineNos: { $addToSet: "$headerData.lineNo" },
//           moNos: { $addToSet: "$headerData.moNo" },
//           customers: { $addToSet: "$headerData.customer" }
//         }
//       }
//     ]);

//     // Get overall stats
//     const stats = await QCData.aggregate([
//       { $match: matchQuery },
//       {
//         $group: {
//           _id: null,
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" },
//           totalDefectPieces: { $sum: "$defectPieces" },
//           totalReturnDefectQty: { $sum: "$returnDefectQty" },
//           totalGoodOutput: { $sum: "$goodOutput" },
//           latestDefectArray: { $last: "$defectArray" },
//           latestHeaderData: { $last: "$headerData" }
//         }
//       }
//     ]);

//     // Get defect rate by line
//     const defectRateByLine = await QCData.aggregate([
//       { $match: matchQuery },
//       {
//         $group: {
//           _id: "$headerData.lineNo",
//           checkedQty: { $sum: "$checkedQty" },
//           defectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           lineNo: "$_id",
//           defectRate: {
//             $multiply: [
//               { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
//               100
//             ]
//           }
//         }
//       },
//       { $sort: { defectRate: -1 } }
//     ]);

//     // Get defect rate by MO
//     const defectRateByMO = await QCData.aggregate([
//       { $match: matchQuery },
//       {
//         $group: {
//           _id: "$headerData.moNo",
//           checkedQty: { $sum: "$checkedQty" },
//           defectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           moNo: "$_id",
//           defectRate: {
//             $multiply: [
//               { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
//               100
//             ]
//           }
//         }
//       },
//       { $sort: { defectRate: -1 } }
//     ]);

//     // Get defect rate by customer
//     const defectRateByCustomer = await QCData.aggregate([
//       { $match: matchQuery },
//       {
//         $group: {
//           _id: "$headerData.customer",
//           checkedQty: { $sum: "$checkedQty" },
//           defectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           customer: "$_id",
//           defectRate: {
//             $multiply: [
//               { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
//               100
//             ]
//           }
//         }
//       },
//       { $sort: { defectRate: -1 } }
//     ]);

//     // Get the latest record with defect array to get accurate defect counts
//     const topDefects = await QCData.aggregate([
//       { $match: matchQuery },
//       { $unwind: "$defectArray" },
//       {
//         $group: {
//           _id: "$defectArray.name",
//           count: { $sum: "$defectArray.count" }
//         }
//       },
//       { $sort: { count: -1 } }
//     ]);

//     // In server.js, replace the timeSeriesData aggregation with:
//     const timeSeriesData = await QCData.aggregate([
//       { $match: matchQuery },
//       {
//         $addFields: {
//           timeComponents: {
//             $let: {
//               vars: {
//                 timeParts: { $split: ["$formattedTimestamp", ":"] }
//               },
//               in: {
//                 hours: { $toInt: { $arrayElemAt: ["$$timeParts", 0] } },
//                 minutes: { $toInt: { $arrayElemAt: ["$$timeParts", 1] } },
//                 seconds: { $toInt: { $arrayElemAt: ["$$timeParts", 2] } }
//               }
//             }
//           }
//         }
//       },
//       {
//         $addFields: {
//           totalMinutes: {
//             $add: [
//               { $multiply: ["$timeComponents.hours", 60] },
//               "$timeComponents.minutes"
//             ]
//           }
//         }
//       },
//       {
//         $sort: { timestamp: 1 }
//       },
//       {
//         $group: {
//           _id: {
//             $switch: {
//               branches: [
//                 {
//                   case: { $eq: [parseInt(timeInterval), 1] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 1] } },
//                       1
//                     ]
//                   }
//                 },
//                 {
//                   case: { $eq: [parseInt(timeInterval), 15] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 15] } },
//                       15
//                     ]
//                   }
//                 },
//                 {
//                   case: { $eq: [parseInt(timeInterval), 30] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 30] } },
//                       30
//                     ]
//                   }
//                 },
//                 {
//                   case: { $eq: [parseInt(timeInterval), 60] },
//                   then: {
//                     $multiply: [
//                       { $floor: { $divide: ["$totalMinutes", 60] } },
//                       60
//                     ]
//                   }
//                 }
//               ],
//               default: "$totalMinutes"
//             }
//           },
//           // Use last record for the time period to get cumulative values
//           cumulativeChecked: { $last: "$cumulativeChecked" },
//           cumulativeDefects: { $last: "$cumulativeDefects" }
//         }
//       },
//       {
//         $project: {
//           timestamp: {
//             $switch: {
//               branches: [
//                 {
//                   case: { $eq: [parseInt(timeInterval), 60] },
//                   then: { $toString: { $divide: ["$_id", 60] } }
//                 }
//               ],
//               default: { $toString: "$_id" }
//             }
//           },
//           checkedQty: "$cumulativeChecked",
//           defectQty: "$cumulativeDefects",
//           defectRate: {
//             $round: [
//               {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$cumulativeDefects",
//                       { $max: ["$cumulativeChecked", 1] }
//                     ]
//                   },
//                   100
//                 ]
//               },
//               2
//             ]
//           }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     const dashboardData = stats[0] || {
//       totalCheckedQty: 0,
//       totalDefectQty: 0,
//       totalDefectPieces: 0,
//       totalReturnDefectQty: 0,
//       totalGoodOutput: 0,
//       latestHeaderData: {}
//     };

//     const totalInspected = dashboardData.totalCheckedQty || 0;

//     res.json({
//       filters: filterValues[0] || {
//         factories: [],
//         lineNos: [],
//         moNos: [],
//         customers: []
//       },
//       headerInfo: dashboardData.latestHeaderData,
//       stats: {
//         checkedQty: dashboardData.totalCheckedQty || 0,
//         defectQty: dashboardData.totalDefectQty || 0,
//         defectPieces: dashboardData.totalDefectPieces || 0,
//         returnDefectQty: dashboardData.totalReturnDefectQty || 0,
//         goodOutput: dashboardData.totalGoodOutput || 0,
//         defectRate: totalInspected
//           ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
//           : 0,
//         defectRatio: totalInspected
//           ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(
//               2
//             )
//           : 0
//       },
//       defectRateByLine,
//       defectRateByMO,
//       defectRateByCustomer,
//       topDefects,
//       timeSeriesData
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     res.status(500).json({ message: "Failed to fetch dashboard stats" });
//   }
// });

/* ------------------------------
   End Points - QC1
------------------------------ */

// app.post("/api/save-qc-data", async (req, res) => {
//   try {
//     // Sanitize defectDetails
//     const sanitizedDefects = (req.body.defectDetails || []).map((defect) => ({
//       name: defect.name.toString().trim(),
//       count: Math.abs(parseInt(defect.count)) || 0
//     }));
//     const sanitizedData = {
//       ...req.body,
//       defectArray: sanitizedDefects,
//       headerData: {
//         ...req.body.headerData,
//         date: req.body.headerData.date
//           ? new Date(req.body.headerData.date).toISOString()
//           : undefined
//       }
//     };

//     const qcData = new QCData(sanitizedData);
//     const savedData = await qcData.save();

//     res.status(201).json({
//       message: "QC data saved successfully",
//       data: savedData
//     });
//   } catch (error) {
//     console.error("Error saving QC data:", error);
//     res.status(500).json({
//       message: "Failed to save QC data",
//       error: error.message,
//       details: error.errors
//         ? Object.keys(error.errors).map((key) => ({
//             field: key,
//             message: error.errors[key].message
//           }))
//         : undefined
//     });
//   }
// });

/* ------------------------------
   End Points - Download Data
------------------------------ */

// // Helper function to format date to MM/DD/YYYY
// const formatDate = (date) => {
//   const d = new Date(date);
//   return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
//     .getDate()
//     .toString()
//     .padStart(2, "0")}/${d.getFullYear()}`;
// };

// // New endpoint to get unique values for filters
// app.get("/api/unique-values", async (req, res) => {
//   try {
//     const uniqueValues = await QC2OrderData.aggregate([
//       {
//         $group: {
//           _id: null,
//           moNos: { $addToSet: "$selectedMono" },
//           styleNos: { $addToSet: "$custStyle" },
//           lineNos: { $addToSet: "$lineNo" },
//           colors: { $addToSet: "$color" },
//           sizes: { $addToSet: "$size" },
//           buyers: { $addToSet: "$buyer" }
//         }
//       }
//     ]);

//     const result = uniqueValues[0] || {
//       moNos: [],
//       styleNos: [],
//       lineNos: [],
//       colors: [],
//       sizes: [],
//       buyers: []
//     };

//     delete result._id;
//     Object.keys(result).forEach((key) => {
//       result[key] = result[key].filter(Boolean).sort();
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching unique values:", error);
//     res.status(500).json({ error: "Failed to fetch unique values" });
//   }
// });

// // Updated endpoint to get filtered data
// app.get("/api/download-data", async (req, res) => {
//   try {
//     let {
//       startDate,
//       endDate,
//       type,
//       taskNo,
//       moNo,
//       styleNo,
//       lineNo,
//       color,
//       size,
//       buyer,
//       page = 1,
//       limit = 50
//     } = req.query;

//     // Convert page and limit to numbers
//     page = parseInt(page);
//     limit = parseInt(limit);
//     const skip = (page - 1) * limit;

//     // Format dates to match the stored format (MM/DD/YYYY)
//     if (startDate) {
//       startDate = formatDate(new Date(startDate));
//     }
//     if (endDate) {
//       endDate = formatDate(new Date(endDate));
//     }

//     // Build match query
//     const matchQuery = {};

//     // Determine collection and date field based on type/taskNo
//     const isIroning = type === "Ironing" || taskNo === "53";
//     const collection = isIroning ? Ironing : QC2OrderData;
//     const dateField = isIroning
//       ? "ironing_updated_date"
//       : "updated_date_seperator";

//     // Date range filter
//     if (startDate || endDate) {
//       matchQuery[dateField] = {};
//       if (startDate) matchQuery[dateField].$gte = startDate;
//       if (endDate) matchQuery[dateField].$lte = endDate;
//     }

//     // Add other filters if they exist
//     if (moNo) matchQuery.selectedMono = moNo;
//     if (styleNo) matchQuery.custStyle = styleNo;
//     if (lineNo) matchQuery.lineNo = lineNo;
//     if (color) matchQuery.color = color;
//     if (size) matchQuery.size = size;
//     if (buyer) matchQuery.buyer = buyer;

//     // Add task number filter
//     if (taskNo) {
//       matchQuery.task_no = parseInt(taskNo);
//     }

//     // console.log("Match Query:", matchQuery); // For debugging

//     // Get total count
//     const total = await collection.countDocuments(matchQuery);

//     // Get paginated data
//     const data = await collection
//       .find(matchQuery)
//       .sort({ [dateField]: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     // console.log("Found records:", data.length); // For debugging

//     // Transform data for consistent response
//     const transformedData = data.map((item) => ({
//       date: item[dateField],
//       type: isIroning ? "Ironing" : "QC2 Order Data",
//       taskNo: isIroning ? "53" : "52",
//       selectedMono: item.selectedMono,
//       custStyle: item.custStyle,
//       lineNo: item.lineNo,
//       color: item.color,
//       size: item.size,
//       buyer: item.buyer,
//       bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id,
//       factory: item.factory,
//       count: item.count
//     }));

//     res.json({
//       data: transformedData,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit)
//     });
//   } catch (error) {
//     console.error("Error fetching download data:", error);
//     res.status(500).json({ error: "Failed to fetch download data" });
//   }
// });

/* ------------------------------
   QC2 - Inspection Pass Bundle
------------------------------ */

// // Socket.io connection handler
// io.on("connection", (socket) => {
//   //console.log("A client connected:", socket.id);

//   socket.on("disconnect", () => {
//     //console.log("A client disconnected:", socket.id);
//   });
// });

// // Endpoint to save inspection pass bundle data
// app.post("/api/inspection-pass-bundle", async (req, res) => {
//   try {
//     const {
//       package_no,
//       moNo,
//       custStyle,
//       color,
//       size,
//       lineNo,
//       department,
//       buyer,
//       factory,
//       country,
//       sub_con,
//       sub_con_factory,
//       checkedQty,
//       totalPass,
//       totalRejects,
//       totalRepair,
//       defectQty,
//       defectArray,
//       rejectGarments,
//       inspection_time,
//       inspection_date,
//       emp_id_inspection,
//       eng_name_inspection,
//       kh_name_inspection,
//       job_title_inspection,
//       dept_name_inspection,
//       sect_name_inspection,
//       bundle_id,
//       bundle_random_id,
//       printArray
//     } = req.body;

//     const newRecord = new QC2InspectionPassBundle({
//       package_no,
//       //bundleNo,
//       moNo,
//       custStyle,
//       color,
//       size,
//       lineNo,
//       department,
//       buyer: buyer || "N/A",
//       factory: factory || "N/A",
//       country: country || "N/A",
//       sub_con: sub_con || "No",
//       sub_con_factory: sub_con_factory || "N/A",
//       checkedQty,
//       totalPass,
//       totalRejects,
//       totalRepair: totalRepair || 0,
//       defectQty,
//       defectArray: defectArray || [],
//       rejectGarments: rejectGarments || [],
//       inspection_time,
//       inspection_date,
//       emp_id_inspection,
//       eng_name_inspection,
//       kh_name_inspection,
//       job_title_inspection,
//       dept_name_inspection,
//       sect_name_inspection,
//       bundle_id,
//       bundle_random_id,
//       printArray: printArray || []
//     });

//     await newRecord.save();

//     // Emit event to all clients
//     io.emit("qc2_data_updated");

//     res.status(201).json({
//       message: "Inspection pass bundle saved successfully",
//       data: newRecord
//     });
//   } catch (error) {
//     console.error("Error saving inspection pass bundle:", error);
//     res.status(500).json({
//       message: "Failed to save inspection pass bundle",
//       error: error.message
//     });
//   }
// });

// //Update QC2 inspection records for each of reject garments - PUT endpoint to update inspection records
// app.put(
//   "/api/qc2-inspection-pass-bundle/:bundle_random_id",
//   async (req, res) => {
//     try {
//       const { bundle_random_id } = req.params;
//       const { updateOperations, arrayFilters } = req.body || {};

//       let updateData = req.body;
//       if (updateOperations) {
//         updateData = updateOperations;
//       }

//       const updateOperationsFinal = {};
//       if (updateData.$set) {
//         updateOperationsFinal.$set = updateData.$set;
//       }
//       if (updateData.$push) {
//         updateOperationsFinal.$push = updateData.$push;
//       }
//       if (updateData.$inc) {
//         updateOperationsFinal.$inc = updateData.$inc;
//       }
//       if (!updateData.$set && !updateData.$push && !updateData.$inc) {
//         updateOperationsFinal.$set = updateData;
//       }

//       // Ensure totalRejectGarment_Var remains unchanged when updating printArray

//       if (updateOperationsFinal.$set?.printArray) {
//         updateOperationsFinal.$set.printArray =
//           updateOperationsFinal.$set.printArray.map((printEntry) => ({
//             ...printEntry,
//             totalRejectGarment_Var:
//               printEntry.totalRejectGarment_Var ||
//               printEntry.totalRejectGarmentCount
//           }));
//       }

//       const options = {
//         new: true,
//         runValidators: true
//       };
//       if (arrayFilters) {
//         options.arrayFilters = arrayFilters;
//       }

//       const updatedRecord = await QC2InspectionPassBundle.findOneAndUpdate(
//         { bundle_random_id },
//         updateOperationsFinal,
//         options
//       );

//       if (!updatedRecord) {
//         return res.status(404).json({ error: "Record not found" });
//       }

//       // Update qc2_orderdata for qc2InspectionFirst and qc2InspectionDefect
//       const qc2OrderDataRecord = await QC2OrderData.findOne({
//         bundle_random_id
//       });

//       // Case 1: Initial inspection completed (inspection_time is set)
//       if (
//         updateOperationsFinal.$set &&
//         updateOperationsFinal.$set.inspection_time
//       ) {
//         if (qc2OrderDataRecord) {
//           // Check if an entry with the same inspection_time, emp_id, and bundle_random_id already exists
//           const existingEntry = qc2OrderDataRecord.qc2InspectionFirst.find(
//             (entry) =>
//               entry.inspectionRecordId === updatedRecord._id.toString() ||
//               (entry.updated_date === updatedRecord.inspection_date &&
//                 entry.update_time === updatedRecord.inspection_time &&
//                 entry.emp_id === updatedRecord.emp_id_inspection)
//           );

//           if (!existingEntry) {
//             const inspectionFirstEntry = {
//               process: "qc2",
//               task_no: 100,
//               checkedQty: updatedRecord.checkedQty,
//               totalPass: updatedRecord.totalPass,
//               totalRejects: updatedRecord.totalRejects,
//               defectQty: updatedRecord.defectQty,
//               defectArray: updatedRecord.defectArray,
//               rejectGarments: updatedRecord.rejectGarments.map((rg) => ({
//                 totalCount: rg.totalCount,
//                 defects: rg.defects.map((d) => ({
//                   name: d.name,
//                   count: d.count,
//                   repair: d.repair,
//                   status: "Fail"
//                 })),
//                 garment_defect_id: rg.garment_defect_id,
//                 rejectTime: rg.rejectTime
//               })),
//               updated_date: updatedRecord.inspection_date,
//               update_time: updatedRecord.inspection_time,
//               emp_id: updatedRecord.emp_id_inspection,
//               eng_name: updatedRecord.eng_name_inspection,
//               kh_name: updatedRecord.kh_name_inspection,
//               job_title: updatedRecord.job_title_inspection,
//               dept_name: updatedRecord.dept_name_inspection,
//               sect_name: updatedRecord.sect_name_inspection,
//               inspectionRecordId: updatedRecord._id.toString() // Add unique identifier
//             };
//             qc2OrderDataRecord.qc2InspectionFirst.push(inspectionFirstEntry);
//             await qc2OrderDataRecord.save();
//           } else {
//             console.log(
//               "Duplicate entry detected, skipping push to qc2InspectionFirst"
//             );
//           }
//         }
//       }

//       // Case 2: Return inspection completed (repairGarmentsDefects is pushed)
//       if (
//         updateOperationsFinal.$push &&
//         updateOperationsFinal.$push[
//           "printArray.$[elem].repairGarmentsDefects"
//         ] &&
//         updateData.sessionData
//       ) {
//         const sessionData = updateData.sessionData;
//         const {
//           sessionTotalPass,
//           sessionTotalRejects,
//           sessionDefectsQty,
//           sessionRejectedGarments,
//           inspectionNo,
//           defect_print_id
//         } = sessionData;

//         if (qc2OrderDataRecord) {
//           const now = new Date();
//           const inspectionDefectEntry = {
//             process: "qc2",
//             task_no: 101,
//             defect_print_id,
//             inspectionNo,
//             checkedQty: sessionTotalPass + sessionTotalRejects,
//             totalPass: sessionTotalPass,
//             totalRejects: sessionTotalRejects,
//             defectQty: sessionDefectsQty,
//             // Omit defectArray
//             rejectGarments: sessionRejectedGarments.map((rg) => ({
//               totalCount: rg.totalDefectCount,
//               defects: rg.repairDefectArray.map((d) => ({
//                 name: d.name,
//                 count: d.count,
//                 repair:
//                   allDefects.find((def) => def.english === d.name)?.repair ||
//                   "Unknown",
//                 status: "Fail"
//               })),
//               garment_defect_id: generateGarmentDefectId(),
//               rejectTime: now.toLocaleTimeString("en-US", { hour12: false })
//             })),
//             updated_date: now.toLocaleDateString("en-US"),
//             update_time: now.toLocaleTimeString("en-US", { hour12: false }),
//             emp_id: updatedRecord.emp_id_inspection,
//             eng_name: updatedRecord.eng_name_inspection,
//             kh_name: updatedRecord.kh_name_inspection,
//             job_title: updatedRecord.job_title_inspection,
//             dept_name: updatedRecord.dept_name_inspection,
//             sect_name: updatedRecord.sect_name_inspection
//           };
//           qc2OrderDataRecord.qc2InspectionDefect.push(inspectionDefectEntry);
//           await qc2OrderDataRecord.save();
//         }
//       }

//       io.emit("qc2_data_updated");
//       res.json({
//         message: "Inspection pass bundle updated successfully",
//         data: updatedRecord
//       });
//     } catch (error) {
//       console.error("Error updating inspection pass bundle:", error);
//       res.status(500).json({
//         message: "Failed to update inspection pass bundle",
//         error: error.message
//       });
//     }
//   }
// );

/* ------------------------------
   QC2 - Workers Scan Data Tracking
------------------------------ */

// app.post("/api/qc2-workers-data/log-scan", async (req, res) => {
//   try {
//     const { qc_id, moNo, taskNo, qty, random_id } = req.body;

//     if (!qc_id || !moNo || !taskNo || qty === undefined || !random_id) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     const inspection_date = new Date().toLocaleDateString("en-US");

//     // --- FIX: Conditional Duplicate Check ---
//     // Only check for duplicates if it's an Order Card (taskNo 54)
//     if (taskNo === 54) {
//       const workerData = await QC2WorkersData.findOne({
//         qc_id,
//         inspection_date
//       });

//       // If a record for the worker exists today, check if this Order Card has already been scanned.
//       if (
//         workerData &&
//         workerData.dailyData.some(
//           (d) => d.random_id === random_id && d.taskNo === 54
//         )
//       ) {
//         return res.status(200).json({
//           message: "You have already scanned this Order Card today.",
//           data: workerData
//         });
//       }
//     }
//     // If taskNo is 84 (Defect Card), we skip this check and always allow the entry.

//     // Find the current document to correctly calculate the next 'no'
//     const currentWorkerData = await QC2WorkersData.findOne({
//       qc_id,
//       inspection_date
//     });
//     const dailyDataNo = currentWorkerData
//       ? currentWorkerData.dailyData.length + 1
//       : 1;

//     // Determine which quantity to increment based on the task number
//     const qtyIncrementField =
//       taskNo === 54 ? "totalQtyTask54" : "totalQtyTask84";

//     // Use findOneAndUpdate with upsert to create or update the document
//     const updatedWorkerData = await QC2WorkersData.findOneAndUpdate(
//       { qc_id, inspection_date },
//       {
//         $inc: {
//           totalCheckedQty: qty,
//           [qtyIncrementField]: qty
//         },
//         $push: {
//           dailyData: {
//             no: dailyDataNo,
//             moNo,
//             taskNo,
//             qty,
//             random_id
//           }
//         }
//       },
//       { new: true, upsert: true, setDefaultsOnInsert: true }
//     );

//     res.status(200).json({
//       message: "Worker scan data logged successfully.",
//       data: updatedWorkerData
//     });
//   } catch (error) {
//     console.error("Error logging worker scan data:", error);
//     res.status(500).json({ message: "Server error logging scan data." });
//   }
// });

/* ------------------------------
   QC2 - Fetch Worker's Daily Data
------------------------------ */

// This endpoint fetches today's summary and detailed data for a specific QC worker.
// app.get("/api/qc2-workers-data/today/:qc_id", async (req, res) => {
//   try {
//     const { qc_id } = req.params;
//     if (!qc_id) {
//       return res.status(400).json({ message: "QC ID is required." });
//     }

//     const inspection_date = new Date().toLocaleDateString("en-US");

//     const workerData = await QC2WorkersData.findOne({
//       qc_id,
//       inspection_date
//     }).lean();

//     if (!workerData) {
//       // If no data exists for today, return a default empty structure.
//       return res.json({
//         totalCheckedQty: 0,
//         totalQtyTask54: 0,
//         totalQtyTask84: 0,
//         dailyData: []
//       });
//     }

//     // Group daily data by MO Number for the popup view
//     const moSummary = workerData.dailyData.reduce((acc, item) => {
//       if (!acc[item.moNo]) {
//         acc[item.moNo] = {
//           moNo: item.moNo,
//           totalQty: 0,
//           task54Qty: 0,
//           task84Qty: 0
//         };
//       }
//       acc[item.moNo].totalQty += item.qty;
//       if (item.taskNo === 54) {
//         acc[item.moNo].task54Qty += item.qty;
//       } else if (item.taskNo === 84) {
//         acc[item.moNo].task84Qty += item.qty;
//       }
//       return acc;
//     }, {});

//     workerData.moSummary = Object.values(moSummary);

//     res.json(workerData);
//   } catch (error) {
//     console.error("Error fetching today's worker data:", error);
//     res.status(500).json({ message: "Server error fetching worker data." });
//   }
// });

// // Filter Pane for Live Dashboard - EndPoints
// app.get("/api/qc2-inspection-pass-bundle/filter-options", async (req, res) => {
//   try {
//     const filterOptions = await QC2InspectionPassBundle.aggregate([
//       {
//         $group: {
//           _id: null,
//           moNo: { $addToSet: "$moNo" },
//           color: { $addToSet: "$color" },
//           size: { $addToSet: "$size" },
//           department: { $addToSet: "$department" },
//           emp_id_inspection: { $addToSet: "$emp_id_inspection" },
//           buyer: { $addToSet: "$buyer" },
//           package_no: { $addToSet: "$package_no" }, // Added package_no
//           lineNo: { $addToSet: "$lineNo" } // Add Line No
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: 1,
//           color: 1,
//           size: 1,
//           department: 1,
//           emp_id_inspection: 1,
//           buyer: 1,
//           package_no: 1,
//           lineNo: 1 // Include Line No
//         }
//       }
//     ]);

//     const result =
//       filterOptions.length > 0
//         ? filterOptions[0]
//         : {
//             moNo: [],
//             color: [],
//             size: [],
//             department: [],
//             emp_id_inspection: [],
//             buyer: [],
//             package_no: [],
//             lineNo: [] // Include Line No
//           };

//     Object.keys(result).forEach((key) => {
//       result[key] = result[key]
//         .filter(Boolean)
//         .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b))); // Numeric sort for package_no
//       //.sort((a, b) => a.localeCompare(b));
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching filter options:", error);
//     res.status(500).json({ error: "Failed to fetch filter options" });
//   }
// });

// app.get("/api/qc2-defect-print/filter-options", async (req, res) => {
//   try {
//     const filterOptions = await QC2DefectPrint.aggregate([
//       {
//         $group: {
//           _id: null,
//           moNo: { $addToSet: "$moNo" },
//           package_no: { $addToSet: "$package_no" },
//           repair: { $addToSet: "$repair" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: 1,
//           package_no: 1,
//           repair: 1
//         }
//       }
//     ]);
//     const result = filterOptions[0] || { moNo: [], package_no: [], repair: [] };
//     Object.keys(result).forEach((key) => {
//       result[key] = result[key]
//         .filter(Boolean)
//         .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b)));
//     });
//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching filter options:", error);
//     res.status(500).json({ error: "Failed to fetch filter options" });
//   }
// });

// // New endpoint to fetch by bundle_random_id
// app.get(
//   "/api/qc2-inspection-pass-bundle-by-random-id/:bundle_random_id",
//   async (req, res) => {
//     try {
//       const { bundle_random_id } = req.params;
//       const record = await QC2InspectionPassBundle.findOne({
//         bundle_random_id
//       });
//       if (record) {
//         res.json(record);
//       } else {
//         res.status(404).json({ message: "Record not found" });
//       }
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // New GET endpoint to fetch record by defect_print_id
// app.get(
//   "/api/qc2-inspection-pass-bundle-by-defect-print-id/:defect_print_id",
//   async (req, res) => {
//     try {
//       const { defect_print_id } = req.params;
//       const { includeCompleted } = req.query;

//       let query = {
//         "printArray.defect_print_id": defect_print_id
//       };

//       if (includeCompleted !== "true") {
//         query["printArray.isCompleted"] = false;
//       }

//       const record = await QC2InspectionPassBundle.findOne(query);

//       if (record) {
//         res.json(record);
//       } else {
//         res
//           .status(404)
//           .json({ message: "Record not found or already completed" });
//       }
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// Helper function to escape special characters in regex
// const escapeRegExp = (string) => {
//   return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escapes . * + ? ^ $ { } ( ) | [ ] \
// };

// // GET endpoint to fetch all inspection records
// app.get("/api/qc2-inspection-pass-bundle/search", async (req, res) => {
//   try {
//     const {
//       moNo,
//       package_no,
//       emp_id_inspection,
//       startDate,
//       endDate,
//       color,
//       size,
//       department,
//       page = 1,
//       limit = 50 // Default to 50 records per page
//     } = req.query;

//     let match = {};
//     if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
//     if (package_no) {
//       const packageNoNumber = Number(package_no);
//       if (isNaN(packageNoNumber)) {
//         return res.status(400).json({ error: "Package No must be a number" });
//       }
//       match.package_no = packageNoNumber;
//     }
//     if (emp_id_inspection)
//       match.emp_id_inspection = {
//         $regex: new RegExp(emp_id_inspection.trim(), "i")
//       };
//     if (color) match.color = color;
//     if (size) match.size = size;
//     if (department) match.department = department;

//     if (startDate || endDate) {
//       match.inspection_date = {};
//       if (startDate)
//         match.inspection_date.$gte = normalizeDateString(startDate);
//       if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
//     }

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const pipeline = [
//       { $match: match },
//       { $sort: { createdAt: -1 } },
//       {
//         $facet: {
//           data: [{ $skip: skip }, { $limit: limitNum }],
//           total: [{ $count: "count" }]
//         }
//       }
//     ];

//     const result = await QC2InspectionPassBundle.aggregate(pipeline);
//     const data = result[0].data || [];
//     const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

//     // console.log("Search result:", { data, total });
//     res.json({ data, total });
//   } catch (error) {
//     console.error("Error searching data cards:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get("/api/qc2-defect-print/search", async (req, res) => {
//   try {
//     const { moNo, package_no, repair, page = 1, limit = 50 } = req.query;
//     let match = {};
//     if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
//     if (package_no) {
//       const packageNoNumber = Number(package_no);
//       if (isNaN(packageNoNumber))
//         return res.status(400).json({ error: "Package No must be a number" });
//       match.package_no = packageNoNumber;
//     }
//     if (repair) match.repair = { $regex: new RegExp(repair.trim(), "i") };

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const pipeline = [
//       { $match: match },
//       { $sort: { createdAt: -1 } },
//       {
//         $facet: {
//           data: [{ $skip: skip }, { $limit: limitNum }],
//           total: [{ $count: "count" }]
//         }
//       }
//     ];

//     const result = await QC2DefectPrint.aggregate(pipeline);
//     const data = result[0].data || [];
//     const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

//     res.json({ data, total });
//   } catch (error) {
//     console.error("Error searching defect print cards:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// Edit the Inspection Data
// app.put("/api/qc2-inspection-pass-bundle/:id", async (req, res) => {
//   const { id } = req.params;
//   const updateData = req.body;

//   try {
//     // console.log(`Received request to update record with ID: ${id}`);
//     // console.log(`Update Data: ${JSON.stringify(updateData)}`);
//     const updatedRecord = await QC2InspectionPassBundle.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true }
//     );
//     if (!updatedRecord) {
//       console.log(`Record with ID: ${id} not found`);
//       return res.status(404).send({ message: "Record not found" });
//     }
//     console.log(`Record with ID: ${id} updated successfully`);
//     res.send(updatedRecord);
//   } catch (error) {
//     console.error("Error updating record:", error);
//     res.status(500).send({ message: "Internal Server Error" });
//   }
// });

// // Endpoint to get summary data
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
//       lineNo
//     } = req.query;

//     // --- Filter logic (This part is correct and remains unchanged) ---
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

//     if (startDate || endDate) {
//       match.$expr = match.$expr || { $and: [] };
//       const parseDate = (dateStr) => {
//         const [month, day, year] = dateStr.split("/");
//         return new Date(
//           `${year}-${month.padStart(2, "0")}-${day.padStart(
//             2,
//             "0"
//           )}T00:00:00.000Z`
//         );
//       };
//       if (startDate) {
//         match.$expr.$and.push({
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$inspection_date",
//                 format: "%m/%d/%Y"
//               }
//             },
//             parseDate(startDate)
//           ]
//         });
//       }
//       if (endDate) {
//         match.$expr.$and.push({
//           $lte: [
//             {
//               $dateFromString: {
//                 dateString: "$inspection_date",
//                 format: "%m/%d/%Y"
//               }
//             },
//             parseDate(endDate)
//           ]
//         });
//       }
//     }

//     const data = await QC2InspectionPassBundle.aggregate([
//       // Stage 1: Match documents based on user's filters
//       { $match: match },

//       // Stage 2: Group all matching documents to get the final totals for all fields.
//       {
//         $group: {
//           _id: null,
//           totalGarments: { $sum: "$checkedQty" },
//           totalPass: { $sum: "$totalPass" },
//           totalRejects: { $sum: "$totalRejects" },
//           defectsQty: { $sum: "$defectQty" },

//           // Repair Left is the sum of the `totalRepair`
//           totalRepair: { $sum: "$totalRepair" },

//           // B-Grade Qty calculation
//           sumOfAllRejects: { $sum: "$totalRejects" },
//           sumOfAllVar: { $sum: { $sum: "$printArray.totalRejectGarment_Var" } },

//           totalBundles: { $sum: 1 }
//         }
//       },

//       // Stage 3: Project the final shape, calculate B-Grade Qty, and rates
//       {
//         $project: {
//           _id: 0,
//           totalGarments: 1,
//           totalPass: 1,
//           totalRejects: 1,
//           totalRepair: 1,
//           defectsQty: 1,
//           bGradeQty: { $subtract: ["$sumOfAllRejects", "$sumOfAllVar"] },
//           totalBundles: 1,
//           defectRate: {
//             $cond: [
//               { $eq: ["$totalGarments", 0] },
//               0,
//               { $divide: ["$defectsQty", "$totalGarments"] }
//             ]
//           },
//           defectRatio: {
//             $cond: [
//               { $eq: ["$totalGarments", 0] },
//               0,
//               { $divide: ["$totalRejects", "$totalGarments"] }
//             ]
//           }
//         }
//       }
//     ]);

//     if (data.length > 0) {
//       res.json(data[0]);
//     } else {
//       // Return a default object with all fields if no data is found
//       res.json({
//         totalGarments: 0,
//         totalPass: 0,
//         totalRejects: 0,
//         totalRepair: 0,
//         bGradeQty: 0,
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

// // Endpoint to get summaries per MO No with dynamic grouping

// app.get("/api/qc2-mo-summaries", async (req, res) => {
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
//       lineNo,
//       groupByDate, // "true" to group by date
//       groupByLine, // "true" to group by lineNo
//       groupByMO, // "true" to group by moNo
//       groupByBuyer, // "true" to group by buyer
//       groupByColor, // "true" to group by color
//       groupBySize, // "true" to group by size
//       groupByWeek // New parameter for weekly grouping
//     } = req.query;

//     let match = {};

//     if (moNo && moNo.trim()) {
//       match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
//     }
//     if (emp_id_inspection) {
//       match.emp_id_inspection = {
//         $regex: new RegExp(emp_id_inspection.trim(), "i")
//       };
//     }
//     if (color) match.color = color;
//     if (size) match.size = size;
//     if (department) match.department = department;
//     if (buyer) {
//       match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
//     }
//     if (lineNo) match.lineNo = lineNo.trim();

//     // Normalize and convert dates to Date objects for proper comparison
//     if (startDate || endDate) {
//       match.$expr = match.$expr || {};
//       match.$expr.$and = match.$expr.$and || [];

//       if (startDate) {
//         const normalizedStartDate = normalizeDateString(startDate);
//         match.$expr.$and.push({
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$inspection_date",
//                 format: "%m/%d/%Y",
//                 onError: null // Handle invalid dates gracefully
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
//                 format: "%m/%d/%Y",
//                 onError: null // Handle invalid dates gracefully
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

//     // Dynamically build the _id object for grouping based on query params
//     const groupBy = {};
//     const projectFields = {};

//     // Order matters: Week, Date, Line No, MO No, Buyer, Color, Size
//     if (groupByWeek === "true") {
//       groupBy.weekInfo = {
//         $let: {
//           vars: {
//             parsedDate: {
//               $dateFromString: {
//                 dateString: "$inspection_date",
//                 format: "%m/%d/%Y",
//                 onError: null // Return null if date parsing fails
//               }
//             },
//             monday: {
//               $cond: {
//                 if: {
//                   $ne: [
//                     {
//                       $dateFromString: {
//                         dateString: "$inspection_date",
//                         format: "%m/%d/%Y",
//                         onError: null
//                       }
//                     },
//                     null
//                   ]
//                 },
//                 then: {
//                   $dateSubtract: {
//                     startDate: {
//                       $dateFromString: {
//                         dateString: "$inspection_date",
//                         format: "%m/%d/%Y",
//                         onError: null
//                       }
//                     },
//                     unit: "day",
//                     amount: {
//                       $subtract: [
//                         {
//                           $dayOfWeek: {
//                             $dateFromString: {
//                               dateString: "$inspection_date",
//                               format: "%m/%d/%Y",
//                               onError: null
//                             }
//                           }
//                         },
//                         1 // Adjust for Monday (1 = Sunday, 2 = Monday, etc.)
//                       ]
//                     }
//                   }
//                 },
//                 else: null // If date is invalid, set monday to null
//               }
//             }
//           },
//           in: {
//             weekNumber: {
//               $cond: {
//                 if: { $ne: ["$$monday", null] },
//                 then: { $week: "$$monday" },
//                 else: -1 // Use -1 for invalid weeks
//               }
//             },
//             startDate: {
//               $cond: {
//                 if: { $ne: ["$$monday", null] },
//                 then: {
//                   $dateToString: {
//                     format: "%Y-%m-%d",
//                     date: "$$monday"
//                   }
//                 },
//                 else: "Invalid Date"
//               }
//             },
//             endDate: {
//               $cond: {
//                 if: { $ne: ["$$monday", null] },
//                 then: {
//                   $dateToString: {
//                     format: "%Y-%m-%d",
//                     date: {
//                       $dateAdd: {
//                         startDate: "$$monday",
//                         unit: "day",
//                         amount: 6
//                       }
//                     }
//                   }
//                 },
//                 else: "Invalid Date"
//               }
//             }
//           }
//         }
//       };
//       projectFields.weekInfo = "$_id.weekInfo";
//     } else if (groupByDate === "true") {
//       groupBy.inspection_date = {
//         $dateToString: {
//           format: "%Y-%m-%d",
//           date: {
//             $dateFromString: {
//               dateString: "$inspection_date",
//               format: "%m/%d/%Y",
//               onError: null // Handle invalid dates
//             }
//           }
//         }
//       };
//       projectFields.inspection_date = "$_id.inspection_date";
//     }
//     if (groupByLine === "true") {
//       groupBy.lineNo = "$lineNo";
//       projectFields.lineNo = "$_id.lineNo";
//     }
//     if (groupByMO === "true") {
//       groupBy.moNo = "$moNo";
//       projectFields.moNo = "$_id.moNo";
//     }
//     if (groupByBuyer === "true") {
//       groupBy.buyer = "$buyer";
//       projectFields.buyer = "$_id.buyer";
//     }
//     if (groupByColor === "true") {
//       groupBy.color = "$color";
//       projectFields.color = "$_id.color";
//     }
//     if (groupBySize === "true") {
//       groupBy.size = "$size";
//       projectFields.size = "$_id.size";
//     }

//     const data = await QC2InspectionPassBundle.aggregate([
//       // Step 1: Filter out documents with invalid inspection_date
//       {
//         $match: {
//           inspection_date: { $exists: true, $ne: null, $ne: "" },
//           ...match
//         }
//       },
//       // Step 2: Group the data
//       {
//         $group: {
//           _id: groupBy,
//           checkedQty: { $sum: "$checkedQty" },
//           totalPass: { $sum: "$totalPass" },
//           totalRejects: { $sum: "$totalRejects" },
//           defectsQty: { $sum: "$defectQty" },
//           totalBundles: { $sum: 1 },
//           defectiveBundles: {
//             $sum: { $cond: [{ $gt: ["$totalRepair", 0] }, 1, 0] }
//           },
//           defectArray: { $push: "$defectArray" },
//           firstInspectionDate: { $first: "$inspection_date" },
//           firstLineNo: { $first: "$lineNo" },
//           firstMoNo: { $first: "$moNo" },
//           firstBuyer: { $first: "$buyer" },
//           firstColor: { $first: "$color" },
//           firstSize: { $first: "$size" }
//         }
//       },
//       // Step 3: Project the required fields
//       {
//         $project: {
//           ...projectFields,
//           inspection_date:
//             groupByDate !== "true"
//               ? "$firstInspectionDate"
//               : "$_id.inspection_date",
//           weekInfo:
//             groupByWeek !== "true"
//               ? null
//               : {
//                   weekNumber: "$_id.weekInfo.weekNumber",
//                   startDate: "$_id.weekInfo.startDate",
//                   endDate: "$_id.weekInfo.endDate"
//                 },
//           lineNo: groupByLine !== "true" ? "$firstLineNo" : "$_id.lineNo",
//           moNo: groupByMO !== "true" ? "$firstMoNo" : "$_id.moNo",
//           buyer: groupByBuyer !== "true" ? "$firstBuyer" : "$_id.buyer",
//           color: groupByColor !== "true" ? "$firstColor" : "$_id.color",
//           size: groupBySize !== "true" ? "$firstSize" : "$_id.size",
//           checkedQty: 1,
//           totalPass: 1,
//           totalRejects: 1,
//           defectsQty: 1,
//           totalBundles: 1,
//           defectiveBundles: 1,
//           defectArray: {
//             $reduce: {
//               input: "$defectArray",
//               initialValue: [],
//               in: { $concatArrays: ["$$value", "$$this"] }
//             }
//           },
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
//           },
//           _id: 0
//         }
//       },
//       // Step 4: Sort the results
//       {
//         $sort: {
//           ...(groupByWeek === "true" && { "weekInfo.startDate": 1 }),
//           ...(groupByDate === "true" && { inspection_date: 1 }),
//           lineNo: 1,
//           moNo: 1
//         }
//       }
//     ]);

//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching MO summaries:", error);
//     res.status(500).json({ error: "Failed to fetch MO summaries" });
//   }
// });

// app.get("/api/qc2-defect-rates", async (req, res) => {
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
//       lineNo
//     } = req.query;

//     // Build the match stage with filters
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

//     // Date filtering using $expr for string dates
//     if (startDate || endDate) {
//       match.$expr = match.$expr || {};
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

//     // Aggregation pipeline
//     const pipeline = [
//       { $match: match },
//       {
//         $facet: {
//           totalChecked: [
//             {
//               $group: {
//                 _id: null,
//                 totalCheckedQty: { $sum: "$checkedQty" }
//               }
//             }
//           ],
//           defects: [
//             { $unwind: "$defectArray" },
//             {
//               $group: {
//                 _id: "$defectArray.defectName",
//                 totalCount: { $sum: "$defectArray.totalCount" }
//               }
//             }
//           ]
//         }
//       },
//       {
//         $project: {
//           totalCheckedQty: {
//             $arrayElemAt: ["$totalChecked.totalCheckedQty", 0]
//           },
//           defects: "$defects"
//         }
//       },
//       { $unwind: "$defects" },
//       {
//         $project: {
//           defectName: "$defects._id",
//           totalCount: "$defects.totalCount",
//           defectRate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               { $divide: ["$defects.totalCount", "$totalCheckedQty"] }
//             ]
//           }
//         }
//       },
//       { $sort: { defectRate: -1 } }
//     ];

//     const data = await QC2InspectionPassBundle.aggregate(pipeline);
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching defect rates:", error);
//     res.status(500).json({ error: "Failed to fetch defect rates" });
//   }
// });

// //Defect rate by Hour - Endpoint
// app.get("/api/qc2-defect-rates-by-hour", async (req, res) => {
//   try {
//     const {
//       moNo,
//       emp_id_inspection,
//       startDate,
//       endDate,
//       color,
//       size,
//       department,
//       buyer
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

//     // Update date filtering using $expr and $dateFromString
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

//     match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

//     const data = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $project: {
//           moNo: 1,
//           checkedQty: 1,
//           defectQty: 1,
//           defectArray: 1,
//           inspection_time: 1,
//           hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
//           minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
//           second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
//         }
//       },
//       {
//         $match: {
//           minute: { $gte: 0, $lte: 59 },
//           second: { $gte: 0, $lte: 59 }
//         }
//       },
//       {
//         $group: {
//           _id: { moNo: "$moNo", hour: "$hour" },
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" },
//           defectRecords: { $push: "$defectArray" }
//         }
//       },
//       { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
//       { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
//       {
//         $group: {
//           _id: {
//             moNo: "$_id.moNo",
//             hour: "$_id.hour",
//             defectName: "$defectRecords.defectName"
//           },
//           totalCheckedQty: { $first: "$totalCheckedQty" },
//           totalDefectQty: { $first: "$totalDefectQty" },
//           defectCount: { $sum: "$defectRecords.totalCount" }
//         }
//       },
//       {
//         $group: {
//           _id: { moNo: "$_id.moNo", hour: "$_id.hour" },
//           checkedQty: { $first: "$totalCheckedQty" },
//           totalDefectQty: { $first: "$totalDefectQty" },
//           defects: {
//             $push: {
//               name: "$_id.defectName",
//               count: {
//                 $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
//               }
//             }
//           }
//         }
//       },
//       {
//         $group: {
//           _id: "$_id.moNo",
//           hours: {
//             $push: {
//               hour: "$_id.hour",
//               checkedQty: "$checkedQty",
//               defects: "$defects",
//               defectQty: "$totalDefectQty"
//             }
//           },
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$totalDefectQty" }
//         }
//       },
//       {
//         $project: {
//           moNo: "$_id",
//           hourData: {
//             $arrayToObject: {
//               $map: {
//                 input: "$hours",
//                 as: "h",
//                 in: {
//                   k: { $toString: { $add: ["$$h.hour", 1] } },
//                   v: {
//                     rate: {
//                       $cond: [
//                         { $eq: ["$$h.checkedQty", 0] },
//                         0,
//                         {
//                           $multiply: [
//                             { $divide: ["$$h.defectQty", "$$h.checkedQty"] },
//                             100
//                           ]
//                         }
//                       ]
//                     },
//                     hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
//                     checkedQty: "$$h.checkedQty",
//                     defects: "$$h.defects"
//                   }
//                 }
//               }
//             }
//           },
//           totalRate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               {
//                 $multiply: [
//                   { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                   100
//                 ]
//               }
//             ]
//           },
//           _id: 0
//         }
//       },
//       { $sort: { moNo: 1 } }
//     ]);

//     const totalData = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $project: {
//           checkedQty: 1,
//           defectQty: 1,
//           hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
//         }
//       },
//       {
//         $group: {
//           _id: "$hour",
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           hour: "$_id",
//           rate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               {
//                 $multiply: [
//                   { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                   100
//                 ]
//               }
//             ]
//           },
//           hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
//           _id: 0
//         }
//       }
//     ]);

//     const grandTotal = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: null,
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           rate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               {
//                 $multiply: [
//                   { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                   100
//                 ]
//               }
//             ]
//           },
//           _id: 0
//         }
//       }
//     ]);

//     const result = {};
//     data.forEach((item) => {
//       result[item.moNo] = {};
//       Object.keys(item.hourData).forEach((hour) => {
//         const formattedHour = `${hour}:00`.padStart(5, "0");
//         const hourData = item.hourData[hour];
//         result[item.moNo][formattedHour] = {
//           rate: hourData.rate,
//           hasCheckedQty: hourData.hasCheckedQty,
//           checkedQty: hourData.checkedQty,
//           defects: hourData.defects.map((defect) => ({
//             name: defect.name || "No Defect",
//             count: defect.count,
//             rate:
//               hourData.checkedQty > 0
//                 ? (defect.count / hourData.checkedQty) * 100
//                 : 0
//           }))
//         };
//       });
//       result[item.moNo].totalRate = item.totalRate;
//     });

//     result.total = {};
//     totalData.forEach((item) => {
//       const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
//       if (item.hour >= 6 && item.hour <= 20) {
//         result.total[formattedHour] = {
//           rate: item.rate,
//           hasCheckedQty: item.hasCheckedQty
//         };
//       }
//     });

//     result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

//     const hours = [
//       "07:00",
//       "08:00",
//       "09:00",
//       "10:00",
//       "11:00",
//       "12:00",
//       "13:00",
//       "14:00",
//       "15:00",
//       "16:00",
//       "17:00",
//       "18:00",
//       "19:00",
//       "20:00",
//       "21:00"
//     ];
//     Object.keys(result).forEach((key) => {
//       if (key !== "grand") {
//         hours.forEach((hour) => {
//           if (!result[key][hour]) {
//             result[key][hour] = {
//               rate: 0,
//               hasCheckedQty: false,
//               checkedQty: 0,
//               defects: []
//             };
//           }
//         });
//       }
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching defect rates by hour:", error);
//     res.status(500).json({ error: "Failed to fetch defect rates by hour" });
//   }
// });

// // Endpoint to get defect rates by line by hour
// app.get("/api/qc2-defect-rates-by-line", async (req, res) => {
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
//       lineNo
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
//     //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };

//     // Normalize and convert dates to Date objects for proper comparison using $expr
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

//     match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

//     const data = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $project: {
//           lineNo: 1,
//           moNo: 1,
//           checkedQty: 1,
//           defectQty: 1,
//           defectArray: 1,
//           inspection_time: 1,
//           hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
//           minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
//           second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
//         }
//       },
//       {
//         $match: {
//           minute: { $gte: 0, $lte: 59 },
//           second: { $gte: 0, $lte: 59 }
//         }
//       },
//       {
//         $group: {
//           _id: { lineNo: "$lineNo", moNo: "$moNo", hour: "$hour" },
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" },
//           defectRecords: { $push: "$defectArray" }
//         }
//       },
//       { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
//       { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
//       {
//         $group: {
//           _id: {
//             lineNo: "$_id.lineNo",
//             moNo: "$_id.moNo",
//             hour: "$_id.hour",
//             defectName: "$defectRecords.defectName"
//           },
//           totalCheckedQty: { $first: "$totalCheckedQty" },
//           totalDefectQty: { $first: "$totalDefectQty" },
//           defectCount: { $sum: "$defectRecords.totalCount" }
//         }
//       },
//       {
//         $group: {
//           _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo", hour: "$_id.hour" },
//           checkedQty: { $first: "$totalCheckedQty" },
//           totalDefectQty: { $first: "$totalDefectQty" },
//           defects: {
//             $push: {
//               name: "$_id.defectName",
//               count: {
//                 $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
//               }
//             }
//           }
//         }
//       },
//       {
//         $group: {
//           _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo" },
//           hours: {
//             $push: {
//               hour: "$_id.hour",
//               checkedQty: "$checkedQty",
//               defects: "$defects",
//               defectQty: "$totalDefectQty"
//             }
//           },
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$totalDefectQty" }
//         }
//       },
//       {
//         $group: {
//           _id: "$_id.lineNo",
//           moNos: {
//             $push: {
//               moNo: "$_id.moNo",
//               hours: "$hours",
//               totalCheckedQty: "$totalCheckedQty",
//               totalDefectQty: "$totalDefectQty",
//               totalRate: {
//                 $cond: [
//                   { $eq: ["$totalCheckedQty", 0] },
//                   0,
//                   {
//                     $multiply: [
//                       { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                       100
//                     ]
//                   }
//                 ]
//               }
//             }
//           },
//           totalCheckedQty: { $sum: "$totalCheckedQty" },
//           totalDefectQty: { $sum: "$totalDefectQty" }
//         }
//       },
//       {
//         $project: {
//           lineNo: "$_id",
//           moData: {
//             $arrayToObject: {
//               $map: {
//                 input: "$moNos",
//                 as: "mo",
//                 in: {
//                   k: "$$mo.moNo",
//                   v: {
//                     hourData: {
//                       $arrayToObject: {
//                         $map: {
//                           input: "$$mo.hours",
//                           as: "h",
//                           in: {
//                             k: { $toString: { $add: ["$$h.hour", 1] } },
//                             v: {
//                               rate: {
//                                 $cond: [
//                                   { $eq: ["$$h.checkedQty", 0] },
//                                   0,
//                                   {
//                                     $multiply: [
//                                       {
//                                         $divide: [
//                                           "$$h.defectQty",
//                                           "$$h.checkedQty"
//                                         ]
//                                       },
//                                       100
//                                     ]
//                                   }
//                                 ]
//                               },
//                               hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
//                               checkedQty: "$$h.checkedQty",
//                               defects: "$$h.defects"
//                             }
//                           }
//                         }
//                       }
//                     },
//                     totalRate: "$$mo.totalRate"
//                   }
//                 }
//               }
//             }
//           },
//           totalRate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               {
//                 $multiply: [
//                   { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                   100
//                 ]
//               }
//             ]
//           },
//           _id: 0
//         }
//       },
//       { $sort: { lineNo: 1 } }
//     ]);

//     const totalData = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $project: {
//           checkedQty: 1,
//           defectQty: 1,
//           hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
//         }
//       },
//       {
//         $group: {
//           _id: "$hour",
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           hour: "$_id",
//           rate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               {
//                 $multiply: [
//                   { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                   100
//                 ]
//               }
//             ]
//           },
//           hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
//           _id: 0
//         }
//       }
//     ]);

//     const grandTotal = await QC2InspectionPassBundle.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: null,
//           totalCheckedQty: { $sum: "$checkedQty" },
//           totalDefectQty: { $sum: "$defectQty" }
//         }
//       },
//       {
//         $project: {
//           rate: {
//             $cond: [
//               { $eq: ["$totalCheckedQty", 0] },
//               0,
//               {
//                 $multiply: [
//                   { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
//                   100
//                 ]
//               }
//             ]
//           },
//           _id: 0
//         }
//       }
//     ]);

//     const result = {};
//     data.forEach((item) => {
//       result[item.lineNo] = {};
//       Object.keys(item.moData).forEach((moNo) => {
//         result[item.lineNo][moNo] = {};
//         Object.keys(item.moData[moNo].hourData).forEach((hour) => {
//           const formattedHour = `${hour}:00`.padStart(5, "0");
//           const hourData = item.moData[moNo].hourData[hour];
//           result[item.lineNo][moNo][formattedHour] = {
//             rate: hourData.rate,
//             hasCheckedQty: hourData.hasCheckedQty,
//             checkedQty: hourData.checkedQty,
//             defects: hourData.defects.map((defect) => ({
//               name: defect.name || "No Defect",
//               count: defect.count,
//               rate:
//                 hourData.checkedQty > 0
//                   ? (defect.count / hourData.checkedQty) * 100
//                   : 0
//             }))
//           };
//         });
//         result[item.lineNo][moNo].totalRate = item.moData[moNo].totalRate;
//       });
//       result[item.lineNo].totalRate = item.totalRate;
//     });

//     result.total = {};
//     totalData.forEach((item) => {
//       const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
//       if (item.hour >= 6 && item.hour <= 20) {
//         result.total[formattedHour] = {
//           rate: item.rate,
//           hasCheckedQty: item.hasCheckedQty
//         };
//       }
//     });

//     result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

//     const hours = [
//       "07:00",
//       "08:00",
//       "09:00",
//       "10:00",
//       "11:00",
//       "12:00",
//       "13:00",
//       "14:00",
//       "15:00",
//       "16:00",
//       "17:00",
//       "18:00",
//       "19:00",
//       "20:00",
//       "21:00"
//     ];
//     Object.keys(result).forEach((key) => {
//       if (key !== "grand" && key !== "total") {
//         Object.keys(result[key]).forEach((moNo) => {
//           if (moNo !== "totalRate") {
//             hours.forEach((hour) => {
//               if (!result[key][moNo][hour]) {
//                 result[key][moNo][hour] = {
//                   rate: 0,
//                   hasCheckedQty: false,
//                   checkedQty: 0,
//                   defects: []
//                 };
//               }
//             });
//           }
//         });
//       }
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching defect rates by line:", error);
//     res.status(500).json({ error: "Failed to fetch defect rates by line" });
//   }
// });

/* ------------------------------
   Emp id for Inspector Data
------------------------------ */

/* ------------------------------
   QC2 - B-Grade Tracking
------------------------------ */

// --- NEW ENDPOINT: To save or update B-Grade garment data ---

// app.post("/api/qc2-bgrade", async (req, res) => {
//   try {
//     // 1. Add `bundle_random_id` to the destructured body.
//     const { defect_print_id, garmentData, headerData, bundle_random_id } =
//       req.body;

//     // 2. Add validation for bundle_random_id.
//     if (!defect_print_id || !garmentData || !headerData || !bundle_random_id) {
//       return res.status(400).json({ message: "Missing required data." });
//     }

//     // First, check if this garment is already in the B-Grade document to prevent duplicates
//     const existingBGrade = await QC2BGrade.findOne({
//       defect_print_id,
//       "bgradeArray.garmentNumber": garmentData.garmentNumber
//     });

//     if (existingBGrade) {
//       return res.status(200).json({
//         message: "This garment has already been marked as B-Grade.",
//         data: existingBGrade
//       });
//     }

//     // 3. Add bundle_random_id to the $setOnInsert operator.
//     const updateOperations = {
//       $setOnInsert: { ...headerData, bundle_random_id }, // Set header data only when creating a new document
//       $push: { bgradeArray: garmentData }, // Always add the new garment to the array
//       $inc: { totalBgradeQty: 1 }
//     };

//     // Conditionally increment the new `totalBgradeQty` field.
//     // The default `leader_status` in your schema is "B Grade", so this will work for new entries.
//     if (garmentData.leader_status !== "Not B Grade") {
//       updateOperations.$inc = { totalBgradeQty: 1 };
//     }

//     // If not a duplicate, proceed with saving and decrementing
//     const bGradeRecord = await QC2BGrade.findOneAndUpdate(
//       { defect_print_id },
//       updateOperations, // Use the new, more complex update object
//       { new: true, upsert: true, setDefaultsOnInsert: true }
//     );

//     // Define the filter to find the document AND the specific element inside the printArray.
//     const filter = {
//       "printArray.defect_print_id": defect_print_id
//     };

//     // After successfully saving the B-Grade record, decrement the count in the main inspection document
//     // Define the update operation using the positional `$` operator, which now
//     // correctly refers to the element found by the filter.

//     await QC2InspectionPassBundle.updateOne(
//       { "printArray.defect_print_id": defect_print_id },
//       {
//         $inc: {
//           "printArray.$.totalRejectGarmentCount": -1,
//           "printArray.$.totalRejectGarment_Var": -1 // Also decrement the static variable
//         }
//       }
//     );

//     // Execute the update with the corrected filter and update objects.
//     await QC2InspectionPassBundle.updateOne(filter, update);

//     res.status(200).json({
//       message: "B-Grade garment recorded successfully.",
//       data: bGradeRecord
//     });
//   } catch (error) {
//     console.error("Error saving B-Grade data:", error);
//     res.status(500).json({ message: "Server error saving B-Grade data." });
//   }
// });

// // --- NEW ENDPOINT: To fetch B-Grade data by defect_print_id ---

// app.get("/api/qc2-bgrade/by-defect-id/:defect_print_id", async (req, res) => {
//   try {
//     const { defect_print_id } = req.params;
//     const bGradeData = await QC2BGrade.findOne({ defect_print_id }).lean();

//     if (!bGradeData) {
//       return res.status(404).json({ message: "No B-Grade records found." });
//     }
//     res.json(bGradeData);
//   } catch (error) {
//     console.error("Error fetching B-Grade data by defect ID:", error);
//     res.status(500).json({ message: "Server error." });
//   }
// });

/* ------------------------------
   QC2 - Repair Tracking
------------------------------ */

// 1. Fetch Defect Data by defect_print_id

// app.get("/api/defect-track/:defect_print_id", async (req, res) => {
//   try {
//     const { defect_print_id } = req.params;

//     // Fetch from qc2_inspection_pass_bundle
//     const inspectionRecord = await QC2InspectionPassBundle.findOne({
//       "printArray.defect_print_id": defect_print_id
//     });

//     if (!inspectionRecord) {
//       return res.status(404).json({ message: "Defect print ID not found" });
//     }

//     const printData = inspectionRecord.printArray.find(
//       (item) => item.defect_print_id === defect_print_id
//     );

//     if (!printData) {
//       return res
//         .status(404)
//         .json({ message: "Defect print ID not found in printArray" });
//     }

//     // Fetch existing repair tracking data if it exists
//     const repairRecord = await QC2RepairTracking.findOne({ defect_print_id });

//     const formattedData = {
//       package_no: inspectionRecord.package_no,
//       moNo: inspectionRecord.moNo,
//       custStyle: inspectionRecord.custStyle,
//       color: inspectionRecord.color,
//       size: inspectionRecord.size,
//       lineNo: inspectionRecord.lineNo,
//       department: inspectionRecord.department,
//       buyer: inspectionRecord.buyer,
//       factory: inspectionRecord.factory,
//       sub_con: inspectionRecord.sub_con,
//       sub_con_factory: inspectionRecord.sub_con_factory,
//       defect_print_id: printData.defect_print_id,
//       garments: printData.printData.map((garment) => ({
//         garmentNumber: garment.garmentNumber,
//         defects: garment.defects.map((defect) => {
//           const repairItem = repairRecord
//             ? repairRecord.repairArray.find(
//                 (r) =>
//                   r.defectName === defect.name &&
//                   r.garmentNumber === garment.garmentNumber
//               )
//             : null;
//           return {
//             name: defect.name,
//             count: defect.count,
//             repair: defect.repair,
//             status: repairItem ? repairItem.status : "Fail",
//             repair_date: repairItem ? repairItem.repair_date : "",
//             repair_time: repairItem ? repairItem.repair_time : "",
//             pass_bundle: repairItem ? repairItem.pass_bundle : "Not Checked",
//             garmentNumber: garment.garmentNumber
//           };
//         })
//       }))
//     };

//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error fetching defect track data:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // 2. Save/Update Repair Tracking Data

// app.post("/api/repair-tracking", async (req, res) => {
//   try {
//     const {
//       defect_print_id,
//       repairArray,
//       package_no,
//       moNo,
//       custStyle,
//       color,
//       size,
//       lineNo,
//       department,
//       buyer,
//       factory,
//       sub_con,
//       sub_con_factory
//     } = req.body;

//     if (!defect_print_id || !repairArray) {
//       return res
//         .status(400)
//         .json({ message: "Missing defect_print_id or repairArray." });
//     }

//     const now = new Date();

//     // 1. Enhance the incoming array with correct timestamps based on status
//     const enhancedRepairArray = repairArray.map((item) => ({
//       ...item,
//       repair_date:
//         item.status === "OK" ? now.toLocaleDateString("en-US") : null,
//       repair_time:
//         item.status === "OK"
//           ? now.toLocaleTimeString("en-US", { hour12: false })
//           : null
//     }));

//     // 2. Use a single, atomic operation to update or create the document
//     const updatedRecord = await QC2RepairTracking.findOneAndUpdate(
//       { defect_print_id }, // Query: Find the document by its unique ID
//       {
//         // Update payload:
//         $set: {
//           package_no,
//           moNo,
//           custStyle,
//           color,
//           size,
//           lineNo,
//           department,
//           buyer,
//           factory,
//           sub_con,
//           sub_con_factory,
//           repairArray: enhancedRepairArray // Replace the entire array with our enhanced one
//         },
//         $setOnInsert: { defect_print_id } // If creating, ensure defect_print_id is set
//       },
//       {
//         new: true, // Return the updated document
//         upsert: true // Create the document if it doesn't exist
//       }
//     );

//     res.status(200).json({
//       message: "Repair tracking saved successfully",
//       data: updatedRecord
//     });
//   } catch (error) {
//     console.error("Error saving/updating repair tracking:", error);
//     res.status(500).json({
//       message: "Failed to save/update repair tracking",
//       error: error.message
//     });
//   }
// });

// // Endpoint to update defect status for a rejected garment
// app.post("/api/qc2-repair-tracking/update-defect-status", async (req, res) => {
//   const { defect_print_id, garmentNumber, failedDefects } = req.body;
//   try {
//     if (!failedDefects || failedDefects.length === 0) {
//       return res.status(400).json({ message: "No failed defects provided." });
//     }

//     const defectNamesToFail = failedDefects.map((d) => d.name);

//     const result = await QC2RepairTracking.updateOne(
//       { defect_print_id },
//       {
//         $set: {
//           "repairArray.$[elem].status": "Fail",
//           "repairArray.$[elem].repair_date": null,
//           "repairArray.$[elem].repair_time": null,
//           "repairArray.$[elem].pass_bundle": "Fail"
//         }
//       },
//       {
//         arrayFilters: [
//           {
//             "elem.garmentNumber": garmentNumber,
//             "elem.defectName": { $in: defectNamesToFail }
//           }
//         ]
//       }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ message: "Repair tracking not found" });
//     }

//     res.status(200).json({ message: "Updated successfully" });
//   } catch (error) {
//     console.error("Error updating re-rejected garment status:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Endpoint to update pass_bundle status for all garments
// app.post(
//   "/api/qc2-repair-tracking/update-pass-bundle-status",
//   async (req, res) => {
//     try {
//       const { defect_print_id } = req.body;

//       const result = await QC2RepairTracking.updateOne(
//         { defect_print_id }, // Find the document
//         { $set: { "repairArray.$[elem].pass_bundle": "Pass" } }, // The update to apply
//         {
//           // This filter tells MongoDB to only apply the update to elements where status is "OK"
//           arrayFilters: [{ "elem.status": "OK" }],
//           new: true
//         }
//       );

//       if (result.matchedCount === 0) {
//         return res.status(404).json({ message: "Repair tracking not found" });
//       }

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

// // Endpoint to update defect status by defect name and garment number (ATOMIC VERSION)
// app.post(
//   "/api/qc2-repair-tracking/update-defect-status-by-name",
//   async (req, res) => {
//     const { defect_print_id, garmentNumber, defectName, status, pass_bundle } =
//       req.body;
//     try {
//       const now = new Date();
//       const updatePayload = {
//         "repairArray.$.status": status,
//         "repairArray.$.repair_date":
//           status === "OK" ? now.toLocaleDateString("en-US") : null,
//         "repairArray.$.repair_time":
//           status === "OK"
//             ? now.toLocaleTimeString("en-US", { hour12: false })
//             : null,
//         "repairArray.$.pass_bundle": pass_bundle // Pass this directly from the frontend
//       };

//       // This is the atomic update. It finds the document AND the array element and updates it in one go.
//       const result = await QC2RepairTracking.updateOne(
//         {
//           defect_print_id,
//           "repairArray.garmentNumber": garmentNumber,
//           "repairArray.defectName": defectName
//         },
//         { $set: updatePayload }
//       );

//       if (result.matchedCount === 0) {
//         return res
//           .status(404)
//           .json({ message: "Repair tracking or specific defect not found." });
//       }

//       if (result.modifiedCount === 0) {
//         return res.status(200).json({ message: "No changes were needed." });
//       }

//       res.status(200).json({ message: "Defect status updated successfully" });
//     } catch (error) {
//       console.error("Error updating defect status:", error);
//       res.status(500).json({
//         message: "Failed to update defect status",
//         error: error.message
//       });
//     }
//   }
// );

// B grade confirmation endpoint
// Endpoint to PROCESS leader decisions (Accept / Not B Grade)
// ---ENDPOINT for B-Grade Leader Decisions---
// app.post("/api/b-grade-defects/process-decisions", async (req, res) => {
//   const { defect_print_id, decisions } = req.body;

//   if (!defect_print_id || !decisions || !Object.keys(decisions).length) {
//     return res.status(400).json({ message: "Missing required data." });
//   }

//   try {
//     // NOTE: We are NOT starting a session here.

//     // Step 1: Find the B-Grade document to get its bundle_random_id.
//     const bGradeDoc = await QC2BGrade.findOne({ defect_print_id });
//     if (!bGradeDoc) {
//       throw new Error(
//         `B-Grade document not found for defect ID: ${defect_print_id}`
//       );
//     }

//     let garmentsChangedToNotBGrade = 0;

//     // Step 2: Update the bGradeDoc based on decisions.
//     bGradeDoc.bgradeArray.forEach((garment) => {
//       const garmentNumberStr = String(garment.garmentNumber);
//       if (
//         decisions[garmentNumberStr] === "Not B Grade" &&
//         garment.leader_status === "B Grade"
//       ) {
//         garment.leader_status = "Not B Grade";
//         garmentsChangedToNotBGrade++;
//       }
//     });

//     if (garmentsChangedToNotBGrade === 0) {
//       return res
//         .status(200)
//         .json({ message: "No changes to 'Not B-Grade' were made." });
//     }

//     // Step 3: Update counts and save the B-Grade document.
//     bGradeDoc.totalBgradeQty -= garmentsChangedToNotBGrade;
//     bGradeDoc.markModified("bgradeArray");
//     // We save this document first.
//     await bGradeDoc.save();

//     // Step 4: Find and update the Inspection document.
//     // This is the second, separate database operation.
//     const filter = { bundle_random_id: bGradeDoc.bundle_random_id };
//     const update = {
//       $inc: {
//         totalPass: garmentsChangedToNotBGrade,
//         // We also need to find the correct printArray element to decrement its Var count
//         "printArray.$[elem].totalRejectGarment_Var": garmentsChangedToNotBGrade
//       }
//     };
//     const options = {
//       arrayFilters: [{ "elem.defect_print_id": defect_print_id }]
//     };

//     await QC2InspectionPassBundle.updateOne(filter, update, options);

//     // If both operations succeed, send a success response.
//     res.status(200).json({
//       message: "B-Grade decisions processed successfully."
//     });
//   } catch (error) {
//     // If either operation fails, this catch block will be triggered.
//     console.error("Error processing B-Grade decisions:", error);
//     // Note: Since this is not a transaction, the first save might have succeeded
//     // while the second one failed. This is the trade-off.
//     res.status(500).json({
//       message: "An error occurred while processing the request.",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   B-Grade Stock Page Endpoints
------------------------------ */

// // ENDPOINT 1: Fetch B-Grade Stock Data based on filters
// app.post("/api/b-grade-stock", async (req, res) => {
//   try {
//     const { date, moNo, lineNo, packageNo, color, size, department } = req.body;

//     // --- Build the main query filter ---
//     const matchFilter = {
//       // Only include documents that have a positive B-Grade quantity
//       totalBgradeQty: { $gt: 0 }
//     };

//     if (date) {
//       // The 'createdAt' field is automatically added by `timestamps: true`
//       // and is a proper ISODate, which is better for date range queries.
//       const startDate = new Date(date);
//       startDate.setHours(0, 0, 0, 0);

//       const endDate = new Date(date);
//       endDate.setHours(23, 59, 59, 999);

//       matchFilter.createdAt = {
//         $gte: startDate,
//         $lte: endDate
//       };
//     }

//     if (moNo) matchFilter.moNo = moNo;
//     if (lineNo) matchFilter.lineNo = lineNo;
//     if (packageNo) matchFilter.package_no = Number(packageNo);
//     if (color) matchFilter.color = color;
//     if (size) matchFilter.size = size;
//     if (department) matchFilter.department = department;

//     const bGradeStock = await QC2BGrade.aggregate([
//       // Stage 1: Initial filtering based on user's criteria
//       { $match: matchFilter },

//       // Stage 2: Deconstruct the bgradeArray to process each garment individually
//       { $unwind: "$bgradeArray" },

//       // Stage 3: Filter out garments that are marked as "Not B Grade"
//       { $match: { "bgradeArray.leader_status": "B Grade" } },

//       // Stage 4: Group the valid B-Grade garments back by their parent document ID
//       {
//         $group: {
//           _id: "$_id", // Group by the original document ID
//           // Bring the header fields along
//           moNo: { $first: "$moNo" },
//           package_no: { $first: "$package_no" },
//           lineNo: { $first: "$lineNo" },
//           color: { $first: "$color" },
//           size: { $first: "$size" },
//           // Re-assemble the array of valid B-Grade garments
//           bgradeArray: { $push: "$bgradeArray" }
//         }
//       },

//       // Stage 5: Calculate the B-Grade Qty for each document (which is the size of the filtered array)
//       {
//         $project: {
//           moNo: 1,
//           package_no: 1,
//           lineNo: 1,
//           color: 1,
//           size: 1,
//           bGradeQty: { $size: "$bgradeArray" },
//           // We now call it defectDetails to match the frontend table's expectation
//           defectDetails: "$bgradeArray",
//           _id: 0
//         }
//       },

//       // Sort the final results
//       { $sort: { package_no: 1, moNo: 1 } }
//     ]);

//     res.json(bGradeStock);
//   } catch (error) {
//     console.error("Error fetching B-Grade stock:", error);
//     res
//       .status(500)
//       .json({ message: "Server error fetching B-Grade stock data." });
//   }
// });

// // ENDPOINT 2: Fetch distinct filter options based on a selected date
// app.get("/api/b-grade-stock/filter-options", async (req, res) => {
//   try {
//     const { date } = req.query;

//     if (!date) {
//       return res
//         .status(400)
//         .json({ message: "A date is required to fetch filter options." });
//     }

//     const startDate = new Date(date);
//     startDate.setUTCHours(0, 0, 0, 0);

//     const endDate = new Date(date);
//     endDate.setUTCHours(23, 59, 59, 999);

//     // Filter for documents on the selected date that have B-Grade items
//     const matchFilter = {
//       createdAt: { $gte: startDate, $lte: endDate },
//       totalBgradeQty: { $gt: 0 }
//     };

//     // Use an aggregation pipeline to get all distinct values in one DB call
//     const [filterOptions] = await QC2BGrade.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: null,
//           moNos: { $addToSet: "$moNo" },
//           lineNos: { $addToSet: "$lineNo" },
//           packageNos: { $addToSet: "$package_no" },
//           colors: { $addToSet: "$color" },
//           sizes: { $addToSet: "$size" },
//           departments: { $addToSet: "$department" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNos: 1,
//           lineNos: 1,
//           packageNos: 1,
//           colors: 1,
//           sizes: 1,
//           departments: 1
//         }
//       }
//     ]);

//     // If no records found for that date, return empty arrays
//     if (!filterOptions) {
//       return res.json({
//         moNos: [],
//         lineNos: [],
//         packageNos: [],
//         colors: [],
//         sizes: [],
//         departments: []
//       });
//     }

//     // Sort the arrays before sending
//     for (const key in filterOptions) {
//       filterOptions[key].sort();
//     }

//     res.json(filterOptions);
//   } catch (error) {
//     console.error("Error fetching B-Grade filter options:", error);
//     res.status(500).json({ message: "Server error fetching filter options." });
//   }
// });

/* ------------------------------
   QC2 - Reworks
------------------------------ */

// const QC2Reworks = mongoose.model("qc2_reworks", qc2ReworksSchema);

// // Endpoint to save reworks (reject garment) data
// app.post("/api/reworks", async (req, res) => {
//   try {
//     const {
//       package_no,
//       //bundleNo,
//       moNo,
//       custStyle,
//       color,
//       size,
//       lineNo,
//       department,
//       reworkGarments,
//       emp_id_inspection,
//       eng_name_inspection,
//       kh_name_inspection,
//       job_title_inspection,
//       dept_name_inspection,
//       sect_name_inspection,
//       bundle_id,
//       bundle_random_id
//     } = req.body;

//     const newRecord = new QC2Reworks({
//       package_no,
//       //bundleNo,
//       moNo,
//       custStyle,
//       color,
//       size,
//       lineNo,
//       department,
//       reworkGarments,
//       emp_id_inspection,
//       eng_name_inspection,
//       kh_name_inspection,
//       job_title_inspection,
//       dept_name_inspection,
//       sect_name_inspection,
//       bundle_id,
//       bundle_random_id
//     });
//     await newRecord.save();
//     res.status(201).json({
//       message: "Reworks data saved successfully",
//       data: newRecord
//     });
//   } catch (error) {
//     console.error("Error saving reworks data:", error);
//     res.status(500).json({
//       message: "Failed to save reworks data",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   QC2 - Defect Print
------------------------------ */

// // Create new defect print record
// app.post("/api/qc2-defect-print", async (req, res) => {
//   try {
//     const {
//       factory,
//       package_no,
//       moNo,
//       custStyle,
//       color,
//       size,
//       repair,
//       count,
//       count_print,
//       defects,
//       defect_id,
//       emp_id_inspection,
//       eng_name_inspection,
//       kh_name_inspection,
//       job_title_inspection,
//       dept_name_inspection,
//       sect_name_inspection,
//       bundle_id,
//       bundle_random_id
//     } = req.body;

//     const now = new Date();
//     const print_time = now.toLocaleTimeString("en-US", { hour12: false });

//     const defectPrint = new QC2DefectPrint({
//       factory,
//       package_no,
//       moNo,
//       custStyle,
//       color,
//       size,
//       repair,
//       count,
//       count_print,
//       defects,
//       print_time,
//       defect_id,
//       emp_id_inspection,
//       eng_name_inspection,
//       kh_name_inspection,
//       job_title_inspection,
//       dept_name_inspection,
//       sect_name_inspection,
//       bundle_id,
//       bundle_random_id
//     });

//     const savedDefectPrint = await defectPrint.save();
//     res.json(savedDefectPrint);
//   } catch (error) {
//     console.error("Error creating defect print record:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Search defect print records
// app.get("/api/qc2-defect-print/search", async (req, res) => {
//   try {
//     const { moNo, package_no, repair } = req.query;
//     const query = {};

//     // Build the query object based on provided parameters
//     if (moNo) {
//       query.moNo = { $regex: new RegExp(moNo.trim(), "i") };
//     }

//     if (package_no) {
//       const packageNoNumber = Number(package_no);
//       if (isNaN(packageNoNumber)) {
//         return res.status(400).json({ error: "Package No must be a number" });
//       }
//       query.package_no = packageNoNumber;
//     }

//     if (repair) {
//       query.repair = { $regex: new RegExp(repair.trim(), "i") };
//     }

//     // Execute the search query
//     const defectPrints = await QC2DefectPrint.find(query).sort({
//       createdAt: -1
//     });

//     // Return empty array if no results found
//     if (!defectPrints || defectPrints.length === 0) {
//       return res.json([]);
//     }

//     res.json(defectPrints);
//   } catch (error) {
//     console.error("Error searching defect print records:", error);
//     res.status(500).json({
//       error: "Failed to search defect cards",
//       details: error.message
//     });
//   }
// });

// // Fetch all defect print records
// app.get("/api/qc2-defect-print", async (req, res) => {
//   try {
//     const defectPrints = await QC2DefectPrint.find().sort({ createdAt: -1 });

//     if (!defectPrints || defectPrints.length === 0) {
//       return res.json([]);
//     }

//     res.json(defectPrints);
//   } catch (error) {
//     console.error("Error fetching defect print records:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get defect print records by defect_id
// app.get("/api/qc2-defect-print/:defect_id", async (req, res) => {
//   try {
//     const { defect_id } = req.params;
//     const defectPrint = await QC2DefectPrint.findOne({ defect_id });

//     if (!defectPrint) {
//       return res.status(404).json({ error: "Defect print record not found" });
//     }

//     res.json(defectPrint);
//   } catch (error) {
//     console.error("Error fetching defect print record:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

/* ------------------------------
   QC2 OrderData Live Dashboard
------------------------------ */

// app.get("/api/qc2-orderdata/filter-options", async (req, res) => {
//   try {
//     const filterOptions = await QC2OrderData.aggregate([
//       {
//         $group: {
//           _id: null,
//           moNo: { $addToSet: "$selectedMono" },
//           color: { $addToSet: "$color" },
//           size: { $addToSet: "$size" },
//           department: { $addToSet: "$department" },
//           empId: { $addToSet: "$emp_id" },
//           buyer: { $addToSet: "$buyer" },
//           lineNo: { $addToSet: "$lineNo" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: 1,
//           color: 1,
//           size: 1,
//           department: 1,
//           empId: 1,
//           buyer: 1,
//           lineNo: 1
//         }
//       }
//     ]);

//     const result =
//       filterOptions.length > 0
//         ? filterOptions[0]
//         : {
//             moNo: [],
//             color: [],
//             size: [],
//             department: [],
//             empId: [],
//             buyer: [],
//             lineNo: []
//           };

//     Object.keys(result).forEach((key) => {
//       result[key] = result[key]
//         .filter(Boolean)
//         .sort((a, b) => a.localeCompare(b));
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("Error fetching filter options:", error);
//     res.status(500).json({ error: "Failed to fetch filter options" });
//   }
// });

// app.get("/api/qc2-orderdata-summary", async (req, res) => {
//   try {
//     const {
//       moNo,
//       startDate,
//       endDate,
//       color,
//       size,
//       department,
//       empId,
//       buyer,
//       lineNo,
//       page = 1,
//       limit = 50
//     } = req.query;

//     let match = {};
//     if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
//     if (color) match.color = color;
//     if (size) match.size = size;
//     if (department) match.department = department;
//     if (empId) match.emp_id = { $regex: new RegExp(empId.trim(), "i") };
//     if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };
//     if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };
//     if (startDate || endDate) {
//       match.updated_date_seperator = {};
//       if (startDate) match.updated_date_seperator.$gte = startDate;
//       if (endDate) match.updated_date_seperator.$lte = endDate;
//     }

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const pipeline = [
//       { $match: match },
//       {
//         $facet: {
//           summary: [
//             {
//               $group: {
//                 _id: null,
//                 totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
//                 totalGarmentsQty: { $sum: "$count" },
//                 uniqueMONos: { $addToSet: "$selectedMono" },
//                 uniqueColors: { $addToSet: "$color" }, // Add unique colors
//                 uniqueSizes: { $addToSet: "$size" }, // Add unique sizes
//                 uniqueOrderQty: {
//                   $addToSet: { moNo: "$selectedMono", orderQty: "$orderQty" }
//                 }
//               }
//             },
//             {
//               $project: {
//                 _id: 0,
//                 totalRegisteredBundleQty: 1,
//                 totalGarmentsQty: 1,
//                 totalMO: { $size: "$uniqueMONos" },
//                 totalColors: { $size: "$uniqueColors" }, // Count unique colors
//                 totalSizes: { $size: "$uniqueSizes" }, // Count unique sizes
//                 totalOrderQty: {
//                   $sum: {
//                     $map: {
//                       input: "$uniqueOrderQty",
//                       in: "$$this.orderQty"
//                     }
//                   }
//                 }
//               }
//             }
//           ],
//           tableData: [
//             {
//               $group: {
//                 _id: {
//                   lineNo: "$lineNo",
//                   moNo: "$selectedMono",
//                   custStyle: "$custStyle",
//                   country: "$country",
//                   buyer: "$buyer",
//                   color: "$color",
//                   size: "$size",
//                   empId: "$emp_id" // Add emp_id to group
//                 },
//                 totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
//                 totalGarments: { $sum: "$count" },
//                 orderQty: { $first: "$orderQty" } // Use $first to get orderQty for each unique MO
//               }
//             },
//             {
//               $project: {
//                 _id: 0,
//                 lineNo: "$_id.lineNo",
//                 moNo: "$_id.moNo",
//                 custStyle: "$_id.custStyle",
//                 country: "$_id.country",
//                 buyer: "$_id.buyer",
//                 color: "$_id.color",
//                 size: "$_id.size",
//                 empId: "$_id.empId", // Include empId in output
//                 totalRegisteredBundleQty: 1,
//                 totalGarments: 1,
//                 orderQty: 1 // Include orderQty in output
//               }
//             },
//             { $sort: { lineNo: 1, moNo: 1 } },
//             { $skip: skip },
//             { $limit: limitNum }
//           ],
//           total: [{ $count: "count" }]
//         }
//       }
//     ];

//     const result = await QC2OrderData.aggregate(pipeline);
//     const summary = result[0].summary[0] || {
//       totalRegisteredBundleQty: 0,
//       totalGarmentsQty: 0,
//       totalMO: 0,
//       totalColors: 0, // Default for new fields
//       totalSizes: 0,
//       totalOrderQty: 0
//     };
//     const tableData = result[0].tableData || [];
//     const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

//     res.json({ summary, tableData, total });
//   } catch (error) {
//     console.error("Error fetching order data summary:", error);
//     res.status(500).json({ error: "Failed to fetch order data summary" });
//   }
// });

/* ------------------------------
   QC2 Washing Live Dashboard
------------------------------ */
// app.get("/api/washing-autocomplete", async (req, res) => {
//   try {
//     const { field, query } = req.query;

//     // Validate field
//     const validFields = [
//       "selectedMono",
//       "custStyle",
//       "buyer",
//       "color",
//       "size",
//       "emp_id_washing"
//     ];
//     if (!validFields.includes(field)) {
//       return res.status(400).json({ error: "Invalid field" });
//     }

//     // Build match stage for partial search (optional)
//     const match = {};
//     if (query) {
//       match[field] = { $regex: new RegExp(query.trim(), "i") };
//     }

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: `$${field}`
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id"
//         }
//       },
//       { $sort: { value: 1 } },
//       ...(query ? [{ $limit: 10 }] : []) // Limit only when searching
//     ];

//     const results = await Washing.aggregate(pipeline);
//     const suggestions = results.map((item) => item.value).filter(Boolean);

//     res.json(suggestions);
//   } catch (error) {
//     console.error("Error fetching autocomplete suggestions:", error);
//     res.status(500).json({ error: "Failed to fetch suggestions" });
//   }
// });

// app.get("/api/washing-summary", async (req, res) => {
//   try {
//     const {
//       moNo,
//       custStyle, // Added for filtering
//       color,
//       size,
//       empId,
//       buyer,
//       page = 1,
//       limit = 50
//     } = req.query;

//     let match = {};
//     if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
//     if (custStyle)
//       match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
//     if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
//     if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
//     if (empId) match.emp_id_washing = { $regex: new RegExp(empId.trim(), "i") };
//     if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: {
//             moNo: "$selectedMono",
//             custStyle: "$custStyle",
//             buyer: "$buyer",
//             color: "$color",
//             size: "$size"
//           },
//           goodBundleQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_washing", 55] }, "$totalBundleQty", 0]
//             }
//           },
//           defectiveBundleQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_washing", 86] }, "$totalBundleQty", 0]
//             }
//           },
//           goodGarments: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$task_no_washing", 55] },
//                 { $toInt: "$passQtyWash" },
//                 0
//               ]
//             }
//           },
//           defectiveGarments: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$task_no_washing", 86] },
//                 { $toInt: "$passQtyWash" },
//                 0
//               ]
//             }
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: "$_id.moNo",
//           custStyle: "$_id.custStyle",
//           buyer: "$_id.buyer",
//           color: "$_id.color",
//           size: "$_id.size",
//           goodBundleQty: 1,
//           defectiveBundleQty: 1,
//           goodGarments: 1,
//           defectiveGarments: 1
//         }
//       },
//       { $sort: { moNo: 1 } },
//       {
//         $facet: {
//           tableData: [{ $skip: skip }, { $limit: limitNum }],
//           total: [{ $count: "count" }]
//         }
//       }
//     ];

//     const result = await Washing.aggregate(pipeline);
//     const tableData = result[0].tableData || [];
//     const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

//     res.json({ tableData, total });
//   } catch (error) {
//     console.error("Error fetching washing summary:", error);
//     res.status(500).json({ error: "Failed to fetch washing summary" });
//   }
// });

/* ------------------------------
   Ironing Live Dashboard Endpoints
------------------------------ */

// // Summary endpoint for IroningLive table
// app.get("/api/ironing-summary", async (req, res) => {
//   try {
//     const {
//       moNo,
//       custStyle,
//       color,
//       size,
//       empId,
//       buyer,
//       page = 1,
//       limit = 50
//     } = req.query;

//     let match = {};
//     if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
//     if (custStyle)
//       match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
//     if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
//     if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
//     if (empId) match.emp_id_ironing = { $regex: new RegExp(empId.trim(), "i") };
//     if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: {
//             moNo: "$selectedMono",
//             custStyle: "$custStyle",
//             buyer: "$buyer",
//             color: "$color",
//             size: "$size"
//           },
//           goodBundleQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_ironing", 53] }, "$totalBundleQty", 0]
//             }
//           },
//           defectiveBundleQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_ironing", 84] }, "$totalBundleQty", 0]
//             }
//           },
//           goodGarments: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
//             }
//           },
//           defectiveGarments: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_ironing", 84] }, "$passQtyIron", 0]
//             }
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: "$_id.moNo",
//           custStyle: "$_id.custStyle",
//           buyer: "$_id.buyer",
//           color: "$_id.color",
//           size: "$_id.size",
//           goodBundleQty: 1,
//           defectiveBundleQty: 1,
//           goodGarments: 1,
//           defectiveGarments: 1
//         }
//       },
//       { $sort: { moNo: 1 } },
//       {
//         $facet: {
//           tableData: [{ $skip: skip }, { $limit: limitNum }],
//           total: [{ $count: "count" }]
//         }
//       }
//     ];

//     const result = await Ironing.aggregate(pipeline);
//     const tableData = result[0].tableData || [];
//     const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

//     res.json({ tableData, total });
//   } catch (error) {
//     console.error("Error fetching ironing summary:", error);
//     res.status(500).json({ error: "Failed to fetch ironing summary" });
//   }
// });

// // Autocomplete endpoint for IroningLive filters
// app.get("/api/ironing-autocomplete", async (req, res) => {
//   try {
//     const { field, query } = req.query;

//     const validFields = [
//       "selectedMono",
//       "custStyle",
//       "buyer",
//       "color",
//       "size",
//       "emp_id_ironing"
//     ];
//     if (!validFields.includes(field)) {
//       return res.status(400).json({ error: "Invalid field" });
//     }

//     const match = {};
//     if (query) {
//       match[field] = { $regex: new RegExp(query.trim(), "i") };
//     }

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: `$${field}`
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id"
//         }
//       },
//       { $sort: { value: 1 } },
//       ...(query ? [{ $limit: 10 }] : [])
//     ];

//     const results = await Ironing.aggregate(pipeline);
//     const suggestions = results.map((item) => item.value).filter(Boolean);

//     res.json(suggestions);
//   } catch (error) {
//     console.error("Error fetching ironing autocomplete suggestions:", error);
//     res.status(500).json({ error: "Failed to fetch suggestions" });
//   }
// });

/* ------------------------------
   OPA Live Dashboard Endpoints
------------------------------ */

// // Summary endpoint for OPALive table
// app.get("/api/opa-summary", async (req, res) => {
//   try {
//     const {
//       moNo,
//       custStyle,
//       color,
//       size,
//       empId,
//       buyer,
//       page = 1,
//       limit = 50
//     } = req.query;

//     let match = {};
//     if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
//     if (custStyle)
//       match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
//     if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
//     if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
//     if (empId) match.emp_id_opa = { $regex: new RegExp(empId.trim(), "i") };
//     if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: {
//             moNo: "$selectedMono",
//             custStyle: "$custStyle",
//             buyer: "$buyer",
//             color: "$color",
//             size: "$size"
//           },
//           goodBundleQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_opa", 60] }, "$totalBundleQty", 0]
//             }
//           },
//           defectiveBundleQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_opa", 85] }, "$totalBundleQty", 0]
//             }
//           },
//           goodGarments: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0]
//             }
//           },
//           defectiveGarments: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_opa", 85] }, "$passQtyOPA", 0]
//             }
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           moNo: "$_id.moNo",
//           custStyle: "$_id.custStyle",
//           buyer: "$_id.buyer",
//           color: "$_id.color",
//           size: "$_id.size",
//           goodBundleQty: 1,
//           defectiveBundleQty: 1,
//           goodGarments: 1,
//           defectiveGarments: 1
//         }
//       },
//       { $sort: { moNo: 1 } },
//       {
//         $facet: {
//           tableData: [{ $skip: skip }, { $limit: limitNum }],
//           total: [{ $count: "count" }]
//         }
//       }
//     ];

//     const result = await OPA.aggregate(pipeline);
//     const tableData = result[0].tableData || [];
//     const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

//     res.json({ tableData, total });
//   } catch (error) {
//     console.error("Error fetching OPA summary:", error);
//     res.status(500).json({ error: "Failed to fetch OPA summary" });
//   }
// });

// // Autocomplete endpoint for OPALive filters
// app.get("/api/opa-autocomplete", async (req, res) => {
//   try {
//     const { field, query } = req.query;

//     const validFields = [
//       "selectedMono",
//       "custStyle",
//       "buyer",
//       "color",
//       "size",
//       "emp_id_opa"
//     ];
//     if (!validFields.includes(field)) {
//       return res.status(400).json({ error: "Invalid field" });
//     }

//     const match = {};
//     if (query) {
//       match[field] = { $regex: new RegExp(query.trim(), "i") };
//     }

//     const pipeline = [
//       { $match: match },
//       {
//         $group: {
//           _id: `$${field}`
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id"
//         }
//       },
//       { $sort: { value: 1 } },
//       ...(query ? [{ $limit: 10 }] : [])
//     ];

//     const results = await OPA.aggregate(pipeline);
//     const suggestions = results.map((item) => item.value).filter(Boolean);

//     res.json(suggestions);
//   } catch (error) {
//     console.error("Error fetching OPA autocomplete suggestions:", error);
//     res.status(500).json({ error: "Failed to fetch suggestions" });
//   }
// });

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

// // GET - Fetch all sewing defects with optional filtering (This is the better, more flexible version)
// app.get("/api/sewing-defects", async (req, res) => {
//   try {
//     const { categoryEnglish, type, isCommon } = req.query;
//     const filter = {};
//     if (categoryEnglish) filter.categoryEnglish = categoryEnglish;
//     if (type) filter.type = type;
//     if (isCommon) filter.isCommon = isCommon;

//     // Fetch defects, sort by code for consistent order, and use lean() for performance
//     const defects = await SewingDefects.find(filter).sort({ code: 1 }).lean();
//     res.json(defects);
//   } catch (error) {
//     console.error("Error fetching sewing defects:", error);
//     res.status(500).json({ message: "Server error fetching sewing defects" });
//   }
// });

// // GET - Fetch options for the 'Add Defect' form
// app.get("/api/sewing-defects/options", async (req, res) => {
//   try {
//     const [repairs, types, lastDefect, categoryGroups] = await Promise.all([
//       SewingDefects.distinct("repair"),
//       SewingDefects.distinct("type"),
//       SewingDefects.findOne().sort({ code: -1 }),
//       SewingDefects.aggregate([
//         {
//           $group: {
//             _id: {
//               english: "$categoryEnglish",
//               khmer: "$categoryKhmer",
//               chinese: "$categoryChinese"
//             }
//           }
//         },
//         {
//           $project: {
//             _id: 0,
//             english: "$_id.english",
//             khmer: "$_id.khmer",
//             chinese: "$_id.chinese"
//           }
//         },
//         { $match: { english: { $ne: null, $ne: "" } } },
//         { $sort: { english: 1 } }
//       ])
//     ]);

//     const nextCode = lastDefect ? lastDefect.code + 1 : 1001;

//     res.json({
//       repairs: repairs.filter(Boolean),
//       types: types.filter(Boolean),
//       categories: categoryGroups,
//       nextCode
//     });
//   } catch (error) {
//     console.error("Error fetching defect options:", error);
//     res.status(500).json({ message: "Server error fetching options" });
//   }
// });

// // POST - Add a new sewing defect
// app.post("/api/sewing-defects", async (req, res) => {
//   try {
//     const {
//       shortEng,
//       english,
//       khmer,
//       chinese,
//       repair,
//       categoryEnglish,
//       categoryKhmer,
//       categoryChinese,
//       type,
//       isCommon
//     } = req.body;

//     if (
//       !shortEng ||
//       !english ||
//       !khmer ||
//       !categoryEnglish ||
//       !repair ||
//       !type
//     ) {
//       return res.status(400).json({
//         message:
//           "Required fields are missing. Please fill out all fields marked with *."
//       });
//     }

//     const existingDefect = await SewingDefects.findOne({
//       $or: [{ shortEng }, { english }]
//     });
//     if (existingDefect) {
//       return res.status(409).json({
//         message: `Defect with name '${
//           existingDefect.shortEng === shortEng ? shortEng : english
//         }' already exists.`
//       });
//     }

//     const lastDefect = await SewingDefects.findOne().sort({ code: -1 });
//     const newCode = lastDefect ? lastDefect.code + 1 : 1001;

//     // *** FIX IS HERE ***
//     // Instead of querying a 'Buyer' model, we use the hardcoded list from your /api/buyers endpoint.
//     const allBuyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];

//     // Now, we map this array of strings to the required object structure.
//     const statusByBuyer = allBuyers.map((buyerName) => ({
//       buyerName: buyerName, // The buyer's name from the array
//       defectStatus: ["Major"],
//       isCommon: "Major"
//     }));

//     const newSewingDefect = new SewingDefects({
//       code: newCode,
//       shortEng,
//       english,
//       khmer,
//       chinese: chinese || "",
//       image: "",
//       repair,
//       categoryEnglish,
//       categoryKhmer,
//       categoryChinese,
//       type,
//       isCommon,
//       statusByBuyer,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });

//     await newSewingDefect.save();
//     res.status(201).json({
//       message: "Sewing defect added successfully",
//       defect: newSewingDefect
//     });
//   } catch (error) {
//     console.error("Error adding sewing defect:", error);
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "Duplicate entry. Defect code or name might already exist."
//       });
//     }
//     res
//       .status(500)
//       .json({ message: "Failed to add sewing defect", error: error.message });
//   }
// });

// // DELETE - Delete a sewing defect by its code (This is the better, more robust version)
// app.delete("/api/sewing-defects/:code", async (req, res) => {
//   try {
//     const { code } = req.params;
//     const defectCode = parseInt(code, 10);
//     if (isNaN(defectCode)) {
//       return res.status(400).json({ message: "Invalid defect code format." });
//     }
//     const deletedDefect = await SewingDefects.findOneAndDelete({
//       code: defectCode
//     });
//     if (!deletedDefect) {
//       return res.status(404).json({ message: "Sewing Defect not found." });
//     }
//     res.status(200).json({ message: "Sewing defect deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting sewing defect:", error);
//     res.status(500).json({
//       message: "Failed to delete sewing defect",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   Defect Buyer Status ENDPOINTS
------------------------------ */

// // Endpoint for /api/defects/all-details
// app.get("/api/defects/all-details", async (req, res) => {
//   try {
//     const defects = await SewingDefects.find({}).lean();
//     const transformedDefects = defects.map((defect) => ({
//       code: defect.code.toString(),
//       name_en: defect.english,
//       name_kh: defect.khmer,
//       name_ch: defect.chinese,
//       categoryEnglish: defect.categoryEnglish,
//       type: defect.type,
//       repair: defect.repair,
//       statusByBuyer: defect.statusByBuyer || []
//     }));
//     res.json(transformedDefects);
//   } catch (error) {
//     console.error("Error fetching all defect details:", error);
//     res.status(500).json({
//       message: "Failed to fetch defect details",
//       error: error.message
//     });
//   }
// });

// // Endpoint for /api/buyers
// app.get("/api/buyers", (req, res) => {
//   const buyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];
//   res.json(buyers);
// });

// // New Endpoint for updating buyer statuses in SewingDefects
// app.post("/api/sewing-defects/buyer-statuses", async (req, res) => {
//   try {
//     const statusesPayload = req.body;
//     if (!Array.isArray(statusesPayload)) {
//       return res
//         .status(400)
//         .json({ message: "Invalid payload: Expected an array of statuses." });
//     }
//     const updatesByDefect = statusesPayload.reduce((acc, status) => {
//       const defectCode = status.defectCode;
//       if (!acc[defectCode]) {
//         acc[defectCode] = [];
//       }
//       acc[defectCode].push({
//         buyerName: status.buyerName,
//         defectStatus: Array.isArray(status.defectStatus)
//           ? status.defectStatus
//           : [],
//         isCommon: ["Critical", "Major", "Minor"].includes(status.isCommon)
//           ? status.isCommon
//           : "Minor"
//       });
//       return acc;
//     }, {});

//     const bulkOps = [];
//     for (const defectCodeStr in updatesByDefect) {
//       const defectCodeNum = parseInt(defectCodeStr, 10);
//       if (isNaN(defectCodeNum)) {
//         console.warn(
//           `Invalid defectCode received: ${defectCodeStr}, skipping.`
//         );
//         continue;
//       }
//       const newStatusByBuyerArray = updatesByDefect[defectCodeStr];
//       bulkOps.push({
//         updateOne: {
//           filter: { code: defectCodeNum },
//           update: {
//             $set: {
//               statusByBuyer: newStatusByBuyerArray,
//               updatedAt: new Date()
//             }
//           }
//         }
//       });
//     }
//     if (bulkOps.length > 0) {
//       await SewingDefects.bulkWrite(bulkOps);
//     }
//     res.status(200).json({
//       message: "Defect buyer statuses updated successfully in SewingDefects."
//     });
//   } catch (error) {
//     console.error("Error updating defect buyer statuses:", error);
//     res.status(500).json({
//       message: "Failed to update defect buyer statuses",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   QC Inline Roving New
------------------------------ */

// // CORRECTED ENDPOINT: Get the buyer name based on MO number
// app.get("/api/buyer-by-mo", (req, res) => {
//   const { moNo } = req.query;
//   if (!moNo) {
//     return res.status(400).json({ message: "MO number is required" });
//   }

//   // Call the new, separated helper function with corrected logic
//   const buyerName = getBuyerFromMoNumber(moNo);

//   res.json({ buyerName });
// });

// //get the each line related working worker count
// app.get("/api/line-summary", async (req, res) => {
//   try {
//     const lineSummaries = await UserMain.aggregate([
//       {
//         $match: {
//           sect_name: { $ne: null, $ne: "" },
//           working_status: "Working",
//           job_title: "Sewing Worker"
//         }
//       },
//       {
//         $group: {
//           _id: "$sect_name",
//           worker_count: { $sum: 1 }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           line_no: "$_id",
//           real_worker_count: "$worker_count"
//         }
//       },
//       { $sort: { line_no: 1 } }
//     ]);

//     const editedCountsDocs = await LineSewingWorker.find(
//       {},
//       "line_no edited_worker_count"
//     ).lean();

//     const editedCountsMap = new Map(
//       editedCountsDocs.map((doc) => [doc.line_no, doc.edited_worker_count])
//     );

//     const mergedSummaries = lineSummaries.map((realSummary) => ({
//       ...realSummary,
//       edited_worker_count: editedCountsMap.get(realSummary.line_no)
//     }));

//     res.json(mergedSummaries);
//   } catch (error) {
//     console.error("Error fetching line summary:", error);
//     res.status(500).json({
//       message: "Failed to fetch line summary data.",
//       error: error.message
//     });
//   }
// });

// //Get the completed inspect operators
// app.get("/api/inspections-completed", async (req, res) => {
//   const { line_no, inspection_date, mo_no, operation_id, inspection_rep_name } =
//     req.query;

//   try {
//     const findQuery = {
//       line_no,
//       inspection_date
//     };

//     if (mo_no) {
//       findQuery.mo_no = mo_no;
//     }

//     const elemMatchConditions = { inspection_rep_name };

//     if (operation_id) {
//       elemMatchConditions["inlineData.tg_no"] = operation_id;
//     }

//     findQuery.inspection_rep = { $elemMatch: elemMatchConditions };

//     const inspection = await QCInlineRoving.findOne(findQuery);

//     if (!inspection) {
//       return res.json({ completeInspectOperators: 0 });
//     }

//     const specificRep = inspection.inspection_rep.find(
//       (rep) => rep.inspection_rep_name === inspection_rep_name
//     );

//     if (!specificRep) {
//       return res.json({ completeInspectOperators: 0 });
//     }

//     const completeInspectOperators =
//       specificRep.complete_inspect_operators || 0;

//     res.json({ completeInspectOperators });
//   } catch (error) {
//     console.error("Error fetching inspections completed:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// //Edit the line worker count
// app.put("/api/line-sewing-workers/:lineNo", async (req, res) => {
//   const { lineNo } = req.params;
//   const { edited_worker_count } = req.body;

//   if (
//     typeof edited_worker_count !== "number" ||
//     edited_worker_count < 0 ||
//     !Number.isInteger(edited_worker_count)
//   ) {
//     return res
//       .status(400)
//       .json({ message: "Edited worker count must be a non-negative integer." });
//   }
//   try {
//     const now = new Date();
//     const realCountResult = await UserMain.aggregate([
//       {
//         $match: {
//           sect_name: lineNo,
//           working_status: "Working",
//           job_title: "Sewing Worker"
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     const current_real_worker_count =
//       realCountResult.length > 0 ? realCountResult[0].count : 0;

//     const historyEntry = {
//       edited_worker_count,
//       updated_at: now
//     };

//     const updatedLineWorker = await LineSewingWorker.findOneAndUpdate(
//       { line_no: lineNo },
//       {
//         $set: {
//           real_worker_count: current_real_worker_count,
//           edited_worker_count,
//           updated_at: now
//         },
//         $push: { history: historyEntry }
//       },
//       { new: true, upsert: true, runValidators: true }
//     );

//     res.json({
//       message: "Line worker count updated successfully.",
//       data: updatedLineWorker
//     });
//   } catch (error) {
//     console.error(
//       `Error updating line worker count for line ${lineNo}:`,
//       error
//     );
//     res.status(500).json({
//       message: "Failed to update line worker count.",
//       error: error.message
//     });
//   }
// });

// //Save the inline Roving data
// app.post("/api/save-qc-inline-roving", async (req, res) => {
//   try {
//     const {
//       inspection_date,
//       mo_no,
//       line_no,
//       report_name,
//       inspection_rep_item
//     } = req.body;

//     if (!inspection_date || !mo_no || !line_no || !inspection_rep_item) {
//       return res.status(400).json({
//         message:
//           "Missing required fields: inspection_date, mo_no, line_no, or inspection_rep_item."
//       });
//     }

//     if (
//       typeof inspection_rep_item !== "object" ||
//       inspection_rep_item === null
//     ) {
//       return res
//         .status(400)
//         .json({ message: "inspection_rep_item must be a valid object." });
//     }

//     if (
//       !inspection_rep_item.inspection_rep_name ||
//       !inspection_rep_item.emp_id ||
//       !inspection_rep_item.eng_name
//     ) {
//       return res.status(400).json({
//         message:
//           "inspection_rep_item is missing required fields like inspection_rep_name, emp_id, or eng_name."
//       });
//     }

//     let doc = await QCInlineRoving.findOne({ inspection_date, mo_no, line_no });

//     if (doc) {
//       const existingRepIndex = doc.inspection_rep.findIndex(
//         (rep) =>
//           rep.inspection_rep_name === inspection_rep_item.inspection_rep_name
//       );

//       if (existingRepIndex !== -1) {
//         const repToUpdate = doc.inspection_rep[existingRepIndex];

//         if (!Array.isArray(repToUpdate.inlineData)) {
//           repToUpdate.inlineData = [];
//         }

//         if (
//           inspection_rep_item.inlineData &&
//           inspection_rep_item.inlineData.length > 0
//         ) {
//           repToUpdate.inlineData.push(inspection_rep_item.inlineData[0]);
//         }

//         repToUpdate.inspection_rep_name =
//           inspection_rep_item.inspection_rep_name;
//         repToUpdate.emp_id = inspection_rep_item.emp_id;
//         repToUpdate.eng_name = inspection_rep_item.eng_name;
//         repToUpdate.complete_inspect_operators = repToUpdate.inlineData.length;
//         repToUpdate.Inspect_status =
//           repToUpdate.total_operators > 0 &&
//           repToUpdate.complete_inspect_operators >= repToUpdate.total_operators
//             ? "Completed"
//             : "Not Complete";
//       } else {
//         if (doc.inspection_rep.length < 5) {
//           const newRepItem = { ...inspection_rep_item };
//           if (!Array.isArray(newRepItem.inlineData)) {
//             newRepItem.inlineData = [];
//           }

//           newRepItem.complete_inspect_operators = newRepItem.inlineData.length;
//           newRepItem.Inspect_status =
//             newRepItem.total_operators > 0 &&
//             newRepItem.complete_inspect_operators >= newRepItem.total_operators
//               ? "Completed"
//               : "Not Complete";

//           doc.inspection_rep.push(newRepItem);
//         } else {
//           return res.status(400).json({
//             message:
//               "Maximum number of 5 inspection reports already recorded for this combination."
//           });
//         }
//       }

//       if (report_name && doc.report_name !== report_name) {
//         doc.report_name = report_name;
//       }

//       await doc.save();
//       res.status(200).json({
//         message: "QC Inline Roving data updated successfully.",
//         data: doc
//       });
//     } else {
//       const lastDoc = await QCInlineRoving.findOne()
//         .sort({ inline_roving_id: -1 })
//         .select("inline_roving_id");

//       const newId =
//         lastDoc && typeof lastDoc.inline_roving_id === "number"
//           ? lastDoc.inline_roving_id + 1
//           : 1;

//       const initialRepItem = { ...inspection_rep_item };
//       if (!Array.isArray(initialRepItem.inlineData)) {
//         initialRepItem.inlineData = [];
//       }

//       initialRepItem.complete_inspect_operators =
//         initialRepItem.inlineData.length;
//       initialRepItem.Inspect_status =
//         initialRepItem.total_operators > 0 &&
//         initialRepItem.complete_inspect_operators >=
//           initialRepItem.total_operators
//           ? "Completed"
//           : "Not Complete";

//       const newQCInlineRovingDoc = new QCInlineRoving({
//         inline_roving_id: newId,
//         report_name:
//           report_name ||
//           `Report for ${inspection_date} - ${line_no} - ${mo_no}`,
//         inspection_date,
//         mo_no,
//         line_no,
//         inspection_rep: [initialRepItem]
//       });

//       await newQCInlineRovingDoc.save();
//       res.status(201).json({
//         message:
//           "QC Inline Roving data saved successfully (new record created).",
//         data: newQCInlineRovingDoc
//       });
//     }
//   } catch (error) {
//     console.error("Error saving/updating QC Inline Roving data:", error);
//     res.status(500).json({
//       message: "Failed to save/update QC Inline Roving data",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   QC Inline Roving Data / Reports
------------------------------ */

// // Roving data filter function
// app.get("/api/qc-inline-roving-reports/filtered", async (req, res) => {
//   try {
//     const { inspection_date, qcId, operatorId, lineNo, moNo } = req.query;

//     let queryConditions = {};

//     if (inspection_date) {
//       if (/^\d{2}\/\d{2}\/\d{4}$/.test(inspection_date)) {
//         const parts = inspection_date.split("/");

//         const month = parseInt(parts[0], 10);
//         const day = parseInt(parts[1], 10);
//         const year = parseInt(parts[2], 10);

//         const monthRegexPart = month < 10 ? `0?${month}` : `${month}`;
//         const dayRegexPart = day < 10 ? `0?${day}` : `${day}`;

//         const dateRegex = new RegExp(
//           `^${monthRegexPart}\\/${dayRegexPart}\\/${year}$`
//         );
//         queryConditions.inspection_date = { $regex: dateRegex };
//       } else {
//         console.warn(
//           "Received date for filtering is not in MM/DD/YYYY format:",
//           inspection_date,
//           "- Date filter will not be applied effectively."
//         );
//       }
//     }

//     if (qcId) {
//       queryConditions.emp_id = qcId;
//     }

//     if (lineNo) {
//       queryConditions.line_no = lineNo;
//     }

//     if (moNo) {
//       queryConditions.mo_no = moNo;
//     }

//     if (operatorId) {
//       const orConditions = [{ operator_emp_id: operatorId }];
//       if (/^\d+$/.test(operatorId)) {
//         orConditions.push({ operator_emp_id: parseInt(operatorId, 10) });
//       }
//       queryConditions.inlineData = { $elemMatch: { $or: orConditions } };
//     }

//     const reports = await QCInlineRoving.find(queryConditions);

//     res.json(reports);
//   } catch (error) {
//     console.error("Error fetching filtered QC inline roving reports:", error);
//     res.status(500).json({
//       message: "Failed to fetch filtered reports",
//       error: error.message
//     });
//   }
// });

// app.get("/api/qc-inline-roving-reports", async (req, res) => {
//   try {
//     const reports = await QCInlineRoving.find();
//     res.json(reports);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching reports", error });
//   }
// });

// // New endpoint to fetch filtered QC Inline Roving reports with date handling
// app.get("/api/qc-inline-roving-reports-filtered", async (req, res) => {
//   try {
//     const { startDate, endDate, line_no, mo_no, emp_id, buyer_name } =
//       req.query;

//     let match = {};

//     // Date filtering using $expr for string dates
//     if (startDate || endDate) {
//       match.$expr = match.$expr || {};
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

//     // Other filters
//     if (line_no) {
//       match.line_no = line_no;
//     }
//     if (mo_no) {
//       match.mo_no = mo_no;
//     }
//     // In the report, qcId is passed as emp_id
//     if (emp_id) {
//       match["inspection_rep.emp_id"] = emp_id;
//     }

//     // First, fetch reports using the filters that can be applied at the database level
//     const reportsFromDb = await QCInlineRoving.find(match);

//     // *** NEW LOGIC: Apply the derived buyer filter after fetching from DB ***
//     let finalFilteredReports = reportsFromDb;

//     if (buyer_name) {
//       finalFilteredReports = reportsFromDb.filter((report) => {
//         // For each report, determine the buyer from its MO number
//         const derivedBuyer = getBuyerFromMoNumber(report.mo_no);
//         // Keep the report only if its derived buyer matches the filter
//         return derivedBuyer === buyer_name;
//       });
//     }

//     // Send the final, fully filtered data to the client
//     res.json(finalFilteredReports);

//     // const reports = await QCInlineRoving.find(match);
//     // res.json(reports);
//   } catch (error) {
//     console.error("Error fetching filtered roving reports:", error);
//     res.status(500).json({ message: "Error fetching filtered reports", error });
//   }
// });

// // Endpoint to fetch distinct MO Nos
// app.get("/api/qc-inline-roving-mo-nos", async (req, res) => {
//   try {
//     const moNos = await QCInlineRoving.distinct("mo_no");
//     res.json(moNos.filter((mo) => mo)); // Filter out null/empty values
//   } catch (error) {
//     console.error("Error fetching MO Nos:", error);
//     res.status(500).json({ message: "Failed to fetch MO Nos" });
//   }
// });

// --------------------------------------------------------------------------

// // --- Helper function for sanitizing filenames ---
// const sanitize = (input) => {
//   if (typeof input !== "string") input = String(input);
//   // Allow dots for file extensions but sanitize everything else
//   let sane = input.replace(/[^a-zA-Z0-9-._]/g, "_");
//   if (sane === "." || sane === "..") return "_";
//   return sane;
// };

// --------------------------------------------------------------------------
// Roving Image Upload (MODIFIED FOR PERFORMANCE)
// --------------------------------------------------------------------------

// // 1. Use memoryStorage to handle the file in memory.
// const rovingStorage = multer.memoryStorage();

// // 2. Configure the multer instance.
// const rovingUpload = multer({
//   storage: rovingStorage,
//   limits: { fileSize: 25 * 1024 * 1024 } // Increase limit to 25MB for uncompressed files
// });

// // 3. The main endpoint, now with sharp processing.
// app.post(
//   "/api/roving/upload-roving-image",
//   rovingUpload.single("imageFile"),
//   async (req, res) => {
//     try {
//       // --- Validation ---
//       const { imageType, date, lineNo, moNo, operationId } = req.body;
//       const imageFile = req.file;

//       if (!imageFile) {
//         return res.status(400).json({
//           success: false,
//           message: "No image file provided."
//         });
//       }

//       if (!imageType || !date || !lineNo || !moNo || !operationId) {
//         return res.status(400).json({
//           success: false,
//           message: "Missing required metadata fields for image."
//         });
//       }

//       // --- File Saving Logic with Sharp ---
//       const qcinlineUploadPath = path.join(
//         __dirname,
//         "public",
//         "storage",
//         "qcinline" // existing path is preserved
//       );
//       // await fsPromises.mkdir(qcinlineUploadPath, { recursive: true });

//       // Sanitize metadata for the filename (existing logic is good)
//       const sanitizedImageType = sanitize(imageType.toUpperCase());
//       const sanitizedDate = sanitize(date);
//       const sanitizedLineNo = sanitize(lineNo);
//       const sanitizedMoNo = sanitize(moNo);
//       const sanitizedOperationId = sanitize(operationId);

//       // Construct the unique prefix
//       const imagePrefix = `${sanitizedImageType}_${sanitizedDate}_${sanitizedLineNo}_${sanitizedMoNo}_${sanitizedOperationId}_`;

//       // Find the next available index for this prefix
//       const filesInDir = await fsPromises.readdir(qcinlineUploadPath);
//       const existingImageCount = filesInDir.filter((f) =>
//         f.startsWith(imagePrefix)
//       ).length;
//       const imageIndex = existingImageCount + 1;

//       // Create the new filename with a .webp extension
//       const newFilename = `${imagePrefix}${imageIndex}.webp`;
//       const finalDiskPath = path.join(qcinlineUploadPath, newFilename);

//       // Process the image from memory buffer with sharp and save to disk
//       await sharp(imageFile.buffer)
//         .resize({
//           width: 1024,
//           height: 1024,
//           fit: "inside",
//           withoutEnlargement: true
//         })
//         .webp({ quality: 80 })
//         .toFile(finalDiskPath);

//       // Construct the public URL for the client
//       const publicUrl = `${API_BASE_URL}/storage/qcinline/${newFilename}`;

//       res.json({
//         success: true,
//         filePath: publicUrl,
//         filename: newFilename
//       });
//     } catch (error) {
//       console.error("Error in /api/roving/upload-roving-image:", error);
//       if (error instanceof multer.MulterError) {
//         return res.status(400).json({
//           success: false,
//           message: `File upload error: ${error.message}`
//         });
//       }
//       res.status(500).json({
//         success: false,
//         message: "Server error during image processing."
//       });
//     }
//   }
// );

/* ------------------------------
  USERS ENDPOINTS ---- Reporting
------------------------------ */

/* ------------------------------
  QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

// // Endpoint to fetch filtered QC1 Sunrise data for the dashboard
// app.get("/api/sunrise/qc1-data", async (req, res) => {
//   try {
//     const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
//       req.query;

//     // Build the match stage for the aggregation pipeline
//     const matchStage = {};

//     // Other filters
//     if (lineNo) matchStage.lineNo = lineNo;
//     if (MONo) matchStage.MONo = MONo;
//     if (Color) matchStage.Color = Color;
//     if (Size) matchStage.Size = Size;
//     if (Buyer) matchStage.Buyer = Buyer;
//     if (defectName) {
//       matchStage["DefectArray.defectName"] = defectName;
//     }

//     // Aggregation pipeline
//     const pipeline = [];

//     // Stage 1: Add a new field with the converted date
//     pipeline.push({
//       $addFields: {
//         inspectionDateAsDate: {
//           $dateFromString: {
//             dateString: {
//               $concat: [
//                 { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
//                 "-",
//                 { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
//                 "-",
//                 { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
//               ]
//             },
//             format: "%Y-%m-%d"
//           }
//         }
//       }
//     });

//     // Stage 2: Apply date range filter if provided
//     if (startDate && endDate) {
//       const start = new Date(startDate); // startDate is in YYYY-MM-DD
//       const end = new Date(endDate); // endDate is in YYYY-MM-DD

//       // Ensure end date includes the full day
//       end.setHours(23, 59, 59, 999);

//       pipeline.push({
//         $match: {
//           inspectionDateAsDate: {
//             $gte: start,
//             $lte: end
//           },
//           ...matchStage // Include other filters
//         }
//       });
//     } else {
//       // If no date range, just apply other filters
//       pipeline.push({
//         $match: matchStage
//       });
//     }

//     // Stage 3: Filter DefectArray to only include the selected defectName (if provided)
//     if (defectName) {
//       pipeline.push({
//         $addFields: {
//           DefectArray: {
//             $filter: {
//               input: "$DefectArray",
//               as: "defect",
//               cond: { $eq: ["$$defect.defectName", defectName] }
//             }
//           }
//         }
//       });

//       // Stage 4: Recalculate totalDefectsQty based on the filtered DefectArray
//       pipeline.push({
//         $addFields: {
//           totalDefectsQty: {
//             $sum: "$DefectArray.defectQty"
//           }
//         }
//       });
//     }

//     // Stage 5: Sort by lineNo
//     pipeline.push({
//       $sort: { lineNo: 1 } // Sort by Line No (1 to 30)
//     });

//     // Fetch data from MongoDB using aggregation
//     const data = await QC1Sunrise.aggregate(pipeline).exec();

//     // Transform the inspectionDate to DD/MM/YYYY format for display
//     const transformedData = data.map((item) => {
//       const [month, day, year] = item.inspectionDate.split("-");
//       return {
//         ...item,
//         inspectionDate: `${day}/${month}/${year}` // Convert to DD/MM/YYYY
//       };
//     });

//     res.json(transformedData);
//   } catch (err) {
//     console.error("Error fetching QC1 Sunrise data:", err);
//     res.status(500).json({
//       message: "Failed to fetch QC1 Sunrise data",
//       error: err.message
//     });
//   }
// });

// // Endpoint to fetch unique filter values with cross-filtering
// app.get("/api/sunrise/qc1-filters", async (req, res) => {
//   try {
//     const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
//       req.query;

//     // Build the match stage for the aggregation pipeline
//     const matchStage = {};

//     // Apply other filters
//     if (lineNo) matchStage.lineNo = lineNo;
//     if (MONo) matchStage.MONo = MONo;
//     if (Color) matchStage.Color = Color;
//     if (Size) matchStage.Size = Size;
//     if (Buyer) matchStage.Buyer = Buyer;
//     if (defectName) matchStage["DefectArray.defectName"] = defectName;

//     // Aggregation pipeline
//     const pipeline = [];

//     // Stage 1: Add a new field with the converted date
//     pipeline.push({
//       $addFields: {
//         inspectionDateAsDate: {
//           $dateFromString: {
//             dateString: {
//               $concat: [
//                 { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
//                 "-",
//                 { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
//                 "-",
//                 { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
//               ]
//             },
//             format: "%Y-%m-%d"
//           }
//         }
//       }
//     });

//     // Stage 2: Apply date range filter if provided
//     if (startDate && endDate) {
//       const start = new Date(startDate); // startDate is in YYYY-MM-DD
//       const end = new Date(endDate); // endDate is in YYYY-MM-DD

//       // Ensure end date includes the full day
//       end.setHours(23, 59, 59, 999);

//       pipeline.push({
//         $match: {
//           inspectionDateAsDate: {
//             $gte: start,
//             $lte: end
//           },
//           ...matchStage // Include other filters
//         }
//       });
//     } else {
//       // If no date range, just apply other filters
//       pipeline.push({
//         $match: matchStage
//       });
//     }

//     // Fetch unique values for each filter using aggregation
//     const [
//       uniqueLineNos,
//       uniqueMONos,
//       uniqueColors,
//       uniqueSizes,
//       uniqueBuyers,
//       uniqueDefectNames
//     ] = await Promise.all([
//       QC1Sunrise.aggregate([
//         ...pipeline,
//         { $group: { _id: "$lineNo" } }
//       ]).exec(),
//       QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$MONo" } }]).exec(),
//       QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Color" } }]).exec(),
//       QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Size" } }]).exec(),
//       QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Buyer" } }]).exec(),
//       QC1Sunrise.aggregate([
//         ...pipeline,
//         { $unwind: "$DefectArray" },
//         { $group: { _id: "$DefectArray.defectName" } }
//       ]).exec()
//     ]);

//     res.json({
//       lineNos: uniqueLineNos
//         .map((item) => item._id)
//         .filter(Boolean)
//         .sort((a, b) => parseInt(a) - parseInt(b)), // Sort numerically
//       MONos: uniqueMONos
//         .map((item) => item._id)
//         .filter(Boolean)
//         .sort(),
//       Colors: uniqueColors
//         .map((item) => item._id)
//         .filter(Boolean)
//         .sort(),
//       Sizes: uniqueSizes
//         .map((item) => item._id)
//         .filter(Boolean)
//         .sort(),
//       Buyers: uniqueBuyers
//         .map((item) => item._id)
//         .filter(Boolean)
//         .sort(),
//       defectNames: uniqueDefectNames
//         .map((item) => item._id)
//         .filter(Boolean)
//         .sort()
//     });
//   } catch (err) {
//     console.error("Error fetching QC1 Sunrise filter values:", err);
//     res.status(500).json({
//       message: "Failed to fetch filter values",
//       error: err.message
//     });
//   }
// });

/* ------------------------------
   End Points - Pairing Defects
------------------------------ */

// // GET - Fetch all Pairing Defects
// app.get("/api/pairing-defects", async (req, res) => {
//   try {
//     const defects = await PairingDefect.find({}).sort({ no: 1 }).lean(); // Fetch all defects, sorted by 'no'
//     res.json(defects);
//   } catch (error) {
//     console.error("Error fetching Pairing defects:", error);
//     res.status(500).json({ message: "Server error fetching defects" });
//   }
// });

// // POST - Add a new Pairing defect
// app.post("/api/pairing-defects", async (req, res) => {
//   try {
//     const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

//     // Validate required fields
//     if (
//       no === undefined ||
//       no === null ||
//       !defectNameEng ||
//       !defectNameKhmer ||
//       !defectNameChinese
//     ) {
//       return res.status(400).json({
//         message:
//           "Defect No, English Name, Khmer Name, and Chinese Name are required."
//       });
//     }
//     if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Defect No must be a positive number." });
//     }

//     // Check for duplicate 'no'
//     const existingDefectByNo = await PairingDefect.findOne({ no: Number(no) });
//     if (existingDefectByNo) {
//       return res
//         .status(409)
//         .json({ message: `Defect No '${no}' already exists.` });
//     }
//     // Check for duplicate English name
//     const existingDefectByName = await PairingDefect.findOne({ defectNameEng });
//     if (existingDefectByName) {
//       return res.status(409).json({
//         message: `Defect name (English) '${defectNameEng}' already exists.`
//       });
//     }

//     const newPairingDefect = new PairingDefect({
//       no: Number(no),
//       defectNameEng,
//       defectNameKhmer,
//       defectNameChinese
//     });
//     await newPairingDefect.save();
//     res.status(201).json({
//       message: "Pairing defect added successfully",
//       defect: newPairingDefect
//     });
//   } catch (error) {
//     console.error("Error adding Pairing defect:", error);
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "Duplicate entry. Defect No or Name might already exist."
//       });
//     }
//     res
//       .status(500)
//       .json({ message: "Failed to add Pairing defect", error: error.message });
//   }
// });

// // PUT - Update an existing Pairing defect by ID
// app.put("/api/pairing-defects/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { no, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

//     // Validate required fields
//     if (
//       no === undefined ||
//       no === null ||
//       !defectNameEng ||
//       !defectNameKhmer ||
//       !defectNameChinese
//     ) {
//       return res.status(400).json({
//         message:
//           "Defect No, English Name, Khmer Name, and Chinese Name are required for update."
//       });
//     }
//     if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Defect No must be a positive number." });
//     }

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid defect ID format." });
//     }

//     // Check for duplicate 'no' (excluding the current document being updated)
//     const existingDefectByNo = await PairingDefect.findOne({
//       no: Number(no),
//       _id: { $ne: id }
//     });
//     if (existingDefectByNo) {
//       return res.status(409).json({
//         message: `Defect No '${no}' already exists for another defect.`
//       });
//     }
//     // Check for duplicate English name (excluding the current document)
//     const existingDefectByName = await PairingDefect.findOne({
//       defectNameEng,
//       _id: { $ne: id }
//     });
//     if (existingDefectByName) {
//       return res.status(409).json({
//         message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
//       });
//     }

//     const updatedPairingDefect = await PairingDefect.findByIdAndUpdate(
//       id,
//       {
//         no: Number(no),
//         defectNameEng,
//         defectNameKhmer,
//         defectNameChinese
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedPairingDefect) {
//       return res.status(404).json({ message: "Pairing Defect not found." });
//     }
//     res.status(200).json({
//       message: "Pairing defect updated successfully",
//       defect: updatedPairingDefect
//     });
//   } catch (error) {
//     console.error("Error updating Pairing defect:", error);
//     if (error.code === 11000) {
//       return res
//         .status(409)
//         .json({ message: "Update failed due to duplicate Defect No or Name." });
//     }
//     res.status(500).json({
//       message: "Failed to update Pairing defect",
//       error: error.message
//     });
//   }
// });

// // DELETE - Delete a Pairing defect by ID
// app.delete("/api/pairing-defects/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid defect ID format." });
//     }

//     const deletedPairingDefect = await PairingDefect.findByIdAndDelete(id);
//     if (!deletedPairingDefect) {
//       return res.status(404).json({ message: "Pairing Defect not found." });
//     }
//     res.status(200).json({ message: "Pairing defect deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting Pairing defect:", error);
//     res.status(500).json({
//       message: "Failed to delete Pairing defect",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   End Points - Accessory Issues
------------------------------ */

// // GET - Fetch all Accessory Issues
// app.get("/api/accessory-issues", async (req, res) => {
//   try {
//     const issues = await AccessoryIssue.find({}).sort({ no: 1 }).lean();
//     res.json(issues);
//   } catch (error) {
//     console.error("Error fetching Accessory issues:", error);
//     res.status(500).json({ message: "Server error fetching issues" });
//   }
// });

// // POST - Add a new Accessory issue
// app.post("/api/accessory-issues", async (req, res) => {
//   try {
//     const { no, issueEng, issueKhmer, issueChi } = req.body;

//     // Validate required fields
//     if (
//       no === undefined ||
//       no === null ||
//       !issueEng ||
//       !issueKhmer ||
//       !issueChi
//     ) {
//       return res.status(400).json({
//         message:
//           "Issue No, English Name, Khmer Name, and Chinese Name are required."
//       });
//     }
//     if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Issue No must be a positive number." });
//     }

//     // Check for duplicate 'no'
//     const existingIssueByNo = await AccessoryIssue.findOne({ no: Number(no) });
//     if (existingIssueByNo) {
//       return res
//         .status(409)
//         .json({ message: `Issue No '${no}' already exists.` });
//     }
//     // Check for duplicate English name
//     const existingIssueByName = await AccessoryIssue.findOne({ issueEng });
//     if (existingIssueByName) {
//       return res.status(409).json({
//         message: `Issue name (English) '${issueEng}' already exists.`
//       });
//     }

//     const newAccessoryIssue = new AccessoryIssue({
//       no: Number(no),
//       issueEng,
//       issueKhmer,
//       issueChi
//     });
//     await newAccessoryIssue.save();
//     res.status(201).json({
//       message: "Accessory issue added successfully",
//       issue: newAccessoryIssue
//     });
//   } catch (error) {
//     console.error("Error adding Accessory issue:", error);
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "Duplicate entry. Issue No or Name might already exist."
//       });
//     }
//     res
//       .status(500)
//       .json({ message: "Failed to add Accessory issue", error: error.message });
//   }
// });

// // PUT - Update an existing Accessory issue by ID
// app.put("/api/accessory-issues/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { no, issueEng, issueKhmer, issueChi } = req.body;

//     // Validate required fields
//     if (
//       no === undefined ||
//       no === null ||
//       !issueEng ||
//       !issueKhmer ||
//       !issueChi
//     ) {
//       return res.status(400).json({
//         message:
//           "Issue No, English Name, Khmer Name, and Chinese Name are required for update."
//       });
//     }
//     if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Issue No must be a positive number." });
//     }

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid issue ID format." });
//     }

//     // Check for duplicate 'no' (excluding the current document)
//     const existingIssueByNo = await AccessoryIssue.findOne({
//       no: Number(no),
//       _id: { $ne: id }
//     });
//     if (existingIssueByNo) {
//       return res.status(409).json({
//         message: `Issue No '${no}' already exists for another issue.`
//       });
//     }
//     // Check for duplicate English name (excluding the current document)
//     const existingIssueByName = await AccessoryIssue.findOne({
//       issueEng,
//       _id: { $ne: id }
//     });
//     if (existingIssueByName) {
//       return res.status(409).json({
//         message: `Issue name (English) '${issueEng}' already exists for another issue.`
//       });
//     }

//     const updatedAccessoryIssue = await AccessoryIssue.findByIdAndUpdate(
//       id,
//       {
//         no: Number(no),
//         issueEng,
//         issueKhmer,
//         issueChi
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAccessoryIssue) {
//       return res.status(404).json({ message: "Accessory Issue not found." });
//     }
//     res.status(200).json({
//       message: "Accessory issue updated successfully",
//       issue: updatedAccessoryIssue
//     });
//   } catch (error) {
//     console.error("Error updating Accessory issue:", error);
//     if (error.code === 11000) {
//       return res
//         .status(409)
//         .json({ message: "Update failed due to duplicate Issue No or Name." });
//     }
//     res.status(500).json({
//       message: "Failed to update Accessory issue",
//       error: error.message
//     });
//   }
// });

// // DELETE - Delete an Accessory issue by ID
// app.delete("/api/accessory-issues/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid issue ID format." });
//     }

//     const deletedAccessoryIssue = await AccessoryIssue.findByIdAndDelete(id);
//     if (!deletedAccessoryIssue) {
//       return res.status(404).json({ message: "Accessory Issue not found." });
//     }
//     res.status(200).json({ message: "Accessory issue deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting Accessory issue:", error);
//     res.status(500).json({
//       message: "Failed to delete Accessory issue",
//       error: error.message
//     });
//   }
// });

/* ------------------------------
   End Points - Pairing Defects
------------------------------ */
// app.get("/api/pairing-defects", async (req, res) => {
//   try {
//     const defects = await PairingDefect.find({}).sort({ no: 1 }).lean();
//     res.json(defects);
//   } catch (error) {
//     console.error("Error fetching pairing defects:", error);
//     res.status(500).json({ message: "Server error fetching pairing defects" });
//   }
// });

/* ------------------------------
   End Points - Accessory Issues
------------------------------ */
// app.get("/api/accessory-issues", async (req, res) => {
//   try {
//     const issues = await AccessoryIssue.find({}).sort({ no: 1 }).lean();
//     res.json(issues);
//   } catch (error) {
//     console.error("Error fetching accessory issues:", error);
//     res.status(500).json({ message: "Server error fetching accessory issues" });
//   }
// });

// app.post("/api/save-qc-roving-pairing", async (req, res) => {
//   try {
//     const {
//       inspection_date,
//       moNo,
//       lineNo,
//       report_name,
//       emp_id,
//       eng_name,
//       operationNo,
//       operationName,
//       operationName_kh,
//       pairingDataItem
//     } = req.body;

//     // --- Basic Validation ---
//     if (!inspection_date || !moNo || !lineNo || !pairingDataItem || !emp_id) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     if (
//       typeof pairingDataItem !== "object" ||
//       !pairingDataItem.inspection_rep_name
//     ) {
//       return res.status(400).json({
//         message: "pairingDataItem is malformed or missing inspection_rep_name."
//       });
//     }

//     // ---------------------------------------------------------------------

//     if (
//       pairingDataItem.accessoryComplete === "No" &&
//       !Array.isArray(pairingDataItem.accessoryIssues)
//     ) {
//       return res.status(400).json({
//         message:
//           "Accessory status is 'No' but the list of accessory issues is missing or not an array."
//       });
//     }
//     // If accessory is complete, ensure the issues array is empty.
//     if (pairingDataItem.accessoryComplete === "Yes") {
//       pairingDataItem.accessoryIssues = [];
//     }

//     // ---------------------------------------------------------------------

//     //Add the current server timestamp to the object from the frontend
//     pairingDataItem.inspectionTime = new Date();

//     // --- Find or Create Document ---
//     let doc = await QCRovingPairing.findOne({ inspection_date, moNo, lineNo });

//     if (doc) {
//       // Document exists, update it
//       const existingRepIndex = doc.pairingData.findIndex(
//         (rep) => rep.inspection_rep_name === pairingDataItem.inspection_rep_name
//       );

//       if (existingRepIndex !== -1) {
//         // This inspection repetition already exists, so we overwrite it.
//         doc.pairingData[existingRepIndex] = pairingDataItem;
//       } else {
//         // This is a new inspection repetition for this document, add it.
//         doc.pairingData.push(pairingDataItem);
//       }

//       // Sort pairingData by inspection_rep_name (e.g., "1st", "2nd")
//       doc.pairingData.sort((a, b) => {
//         const numA = parseInt(a.inspection_rep_name, 10);
//         const numB = parseInt(b.inspection_rep_name, 10);
//         return numA - numB;
//       });

//       await doc.save();
//       res.status(200).json({
//         message: "QC Roving Pairing data updated successfully.",
//         data: doc
//       });
//     } else {
//       // Document does not exist, create a new one
//       const lastDoc = await QCRovingPairing.findOne().sort({ pairing_id: -1 });
//       const newId =
//         lastDoc && typeof lastDoc.pairing_id === "number"
//           ? lastDoc.pairing_id + 1
//           : 1;

//       const newDoc = new QCRovingPairing({
//         pairing_id: newId,
//         report_name,
//         inspection_date,
//         moNo,
//         lineNo,
//         emp_id,
//         eng_name,
//         operationNo,
//         operationName,
//         operationName_kh,
//         pairingData: [pairingDataItem] // Start with the first item
//       });

//       await newDoc.save();
//       res.status(201).json({
//         message: "New QC Roving Pairing record created successfully.",
//         data: newDoc
//       });
//     }
//   } catch (error) {
//     console.error("Error saving QC Roving Pairing data:", error);
//     res.status(500).json({
//       message: "Failed to save QC Roving Pairing data.",
//       error: error.message
//     });
//   }
// });

/* -------------------------------------------------------------------------- */
/*             NEW ENDPOINTS FOR ROVING PAIRING DATA REPORT                   */
/* -------------------------------------------------------------------------- */

// // --- Endpoint to get dynamic filter options ---
// app.get("/api/roving-pairing/filters", async (req, res) => {
//   try {
//     const { date } = req.query; // Expecting date in 'M/D/YYYY' format
//     if (!date) {
//       return res.status(400).json({ message: "Date is a required parameter." });
//     }

//     const matchQuery = { inspection_date: date };

//     const [uniqueQCs, uniqueOperators, uniqueLines, uniqueMOs] =
//       await Promise.all([
//         // Get unique QC IDs (emp_id)
//         QCRovingPairing.distinct("emp_id", matchQuery),
//         // Get unique Operator IDs (operator_emp_id)
//         QCRovingPairing.distinct("pairingData.operator_emp_id", matchQuery),
//         // Get unique Line Numbers
//         QCRovingPairing.distinct("lineNo", matchQuery),
//         // Get unique MO Numbers
//         QCRovingPairing.distinct("moNo", matchQuery)
//       ]);

//     res.json({
//       qcIds: uniqueQCs.sort(),
//       operatorIds: uniqueOperators.sort(),
//       lineNos: uniqueLines.sort((a, b) => Number(a) - Number(b)),
//       moNos: uniqueMOs.sort()
//     });
//   } catch (error) {
//     console.error("Error fetching filter options for Roving Pairing:", error);
//     res.status(500).json({
//       message: "Failed to fetch filter options.",
//       error: error.message
//     });
//   }
// });

// // --- Endpoint to get aggregated data for the report table ---
// app.get("/api/roving-pairing/report-data", async (req, res) => {
//   try {
//     const { date, qcId, operatorId, lineNo, moNo } = req.query;

//     if (!date) {
//       return res.status(400).json({ message: "Date is required." });
//     }

//     // Build the initial match pipeline stage
//     const matchPipeline = { inspection_date: date };
//     if (qcId) matchPipeline.emp_id = qcId;
//     if (lineNo) matchPipeline.lineNo = lineNo;
//     if (moNo) matchPipeline.moNo = moNo;

//     const pipeline = [{ $match: matchPipeline }, { $unwind: "$pairingData" }];

//     if (operatorId) {
//       pipeline.push({
//         $match: { "pairingData.operator_emp_id": operatorId }
//       });
//     }

//     pipeline.push({
//       $group: {
//         _id: {
//           operatorId: "$pairingData.operator_emp_id",
//           lineNo: "$lineNo",
//           moNo: "$moNo"
//         },
//         operatorName: { $first: "$pairingData.operator_eng_name" },
//         inspections: {
//           $push: {
//             rep_name: "$pairingData.inspection_rep_name",
//             accessoryComplete: "$pairingData.accessoryComplete",
//             totalSummary: "$pairingData.totalSummary"
//           }
//         }
//       }
//     });

//     // **** START OF CORRECTION ****
//     // The keys being accessed here now correctly match the keys defined in the $group stage's _id object.
//     pipeline.push({
//       $project: {
//         _id: 0,
//         operatorId: "$_id.operatorId", // Was "$_id.opId"
//         lineNo: "$_id.lineNo", // Was "$_id.line"
//         moNo: "$_id.moNo", // Was "$_id.mo"
//         operatorName: "$operatorName",
//         inspections: "$inspections"
//       }
//     });
//     // **** END OF CORRECTION ****

//     pipeline.push({ $sort: { lineNo: 1, moNo: 1, operatorId: 1 } });

//     const reportData = await QCRovingPairing.aggregate(pipeline);

//     res.json(reportData);
//   } catch (error) {
//     console.error("Error fetching report data for Roving Pairing:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch report data.", error: error.message });
//   }
// });

/* ------------------------------
   AQL ENDPOINTS
------------------------------ */

// app.get("/api/aqlmappings", async (req, res) => {
//   try {
//     const aqlCharts = await AQLChart.find({}).lean();
//     const mappings = {};

//     // Group by lot size
//     aqlCharts.forEach((entry) => {
//       const lotSizeKey = `${entry.LotSize.min}-${entry.LotSize.max || "null"}`;
//       if (!mappings[lotSizeKey]) {
//         mappings[lotSizeKey] = {
//           LotSize: {
//             min: entry.LotSize.min,
//             max: entry.LotSize.max
//           },
//           General: { I: "", II: "", III: "" },
//           Special: { S1: "", S2: "", S3: "", S4: "" }
//         };
//       }
//       if (entry.Type === "General") {
//         mappings[lotSizeKey].General[entry.Level] = entry.SampleSizeLetterCode;
//       } else if (entry.Type === "Special") {
//         mappings[lotSizeKey].Special[entry.Level] = entry.SampleSizeLetterCode;
//       }
//     });

//     // Convert mappings object to array
//     const mappingsArray = Object.values(mappings);
//     res.json(mappingsArray);
//   } catch (error) {
//     console.error("Error fetching AQL mappings:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// app.get("/api/samplesizecodeletters", async (req, res) => {
//   try {
//     const aqlCharts = await AQLChart.find({}).lean();
//     const codeLettersMap = {};

//     // Group by SampleSizeLetterCode
//     aqlCharts.forEach((entry) => {
//       const code = entry.SampleSizeLetterCode;
//       if (!codeLettersMap[code]) {
//         codeLettersMap[code] = {
//           code,
//           sampleSize: entry.SampleSize,
//           AQL: []
//         };
//       }
//       // Merge AQL entries, avoiding duplicates
//       entry.AQL.forEach((aql) => {
//         if (!codeLettersMap[code].AQL.some((a) => a.level === aql.level)) {
//           codeLettersMap[code].AQL.push({
//             level: aql.level,
//             AcceptDefect: aql.AcceptDefect,
//             RejectDefect: aql.RejectDefect
//           });
//         }
//       });
//     });

//     // Convert to array and sort AQL by level
//     const codeLettersArray = Object.values(codeLettersMap).map((item) => ({
//       ...item,
//       AQL: item.AQL.sort((a, b) => a.level - b.level)
//     }));

//     res.json(codeLettersArray);
//   } catch (error) {
//     console.error("Error fetching sample size code letters:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// //Cutting Page AQL Level display
// app.get("/api/aql-details", async (req, res) => {
//   try {
//     const { lotSize } = req.query;

//     if (!lotSize || isNaN(lotSize)) {
//       return res
//         .status(400)
//         .json({ message: "Lot size is required and must be a number" });
//     }

//     const lotSizeNum = parseInt(lotSize);

//     // Find AQL chart entry where lotSize falls within LotSize.min and LotSize.max
//     const aqlChart = await AQLChart.findOne({
//       Type: "General",
//       Level: "II",
//       "LotSize.min": { $lte: lotSizeNum },
//       $or: [{ "LotSize.max": { $gte: lotSizeNum } }, { "LotSize.max": null }]
//     }).lean();

//     if (!aqlChart) {
//       return res
//         .status(404)
//         .json({ message: "No AQL chart found for the given lot size" });
//     }

//     // Find AQL entry for level 1.0
//     const aqlEntry = aqlChart.AQL.find((aql) => aql.level === 1.0);

//     if (!aqlEntry) {
//       return res
//         .status(404)
//         .json({ message: "AQL level 1.0 not found for the given chart" });
//     }

//     res.json({
//       SampleSizeLetterCode: aqlChart.SampleSizeLetterCode,
//       SampleSize: aqlChart.SampleSize,
//       AcceptDefect: aqlEntry.AcceptDefect,
//       RejectDefect: aqlEntry.RejectDefect
//     });
//   } catch (error) {
//     console.error("Error fetching AQL details:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /* ------------------------------
//    End Points - Digital Measurement
// ------------------------------ */

// // New endpoint for filter options
// app.get("/api/filter-options", async (req, res) => {
//   try {
//     const { factory, mono, custStyle, buyer, mode, country, origin, stage } =
//       req.query;
//     const orderFilter = {};
//     if (factory) orderFilter.Factory = factory;
//     if (mono) orderFilter.Order_No = mono;
//     if (custStyle) orderFilter.CustStyle = custStyle;
//     if (buyer) orderFilter.ShortName = buyer;
//     if (mode) orderFilter.Mode = mode;
//     if (country) orderFilter.Country = country;
//     if (origin) orderFilter.Origin = origin;

//     const factories = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("Factory", orderFilter);
//     const monos = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("Order_No", orderFilter);
//     const custStyles = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("CustStyle", orderFilter);
//     const buyers = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("ShortName", orderFilter);
//     const modes = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("Mode", orderFilter);
//     const countries = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("Country", orderFilter);
//     const origins = await ymProdConnection.db
//       .collection("dt_orders")
//       .distinct("Origin", orderFilter);

//     // Fetch distinct stages from measurement_data, filtered by dt_orders
//     let measurementFilter = {};
//     if (mono) {
//       const order = await ymProdConnection.db
//         .collection("dt_orders")
//         .findOne({ Order_No: mono }, { projection: { _id: 1 } });
//       if (order) {
//         measurementFilter.style_id = order._id.toString();
//       }
//     } else {
//       const filteredOrders = await ymProdConnection.db
//         .collection("dt_orders")
//         .find(orderFilter, { projection: { _id: 1 } })
//         .toArray();
//       const orderIds = filteredOrders.map((order) => order._id.toString());
//       measurementFilter.style_id = { $in: orderIds };
//     }
//     if (stage) {
//       measurementFilter.stage = stage;
//     }

//     const stages = await ymEcoConnection.db
//       .collection("measurement_data")
//       .distinct("stage", measurementFilter);

//     // Fetch distinct emp_ids from UserMain where working_status is "Working"
//     const empIds = await UserMain.distinct("emp_id", {
//       working_status: "Working",
//       emp_id: { $ne: null } // Ensure emp_id is not null
//     });

//     // Add minDate and maxDate from measurement_data
//     const dateRange = await ymEcoConnection.db
//       .collection("measurement_data")
//       .aggregate([
//         {
//           $group: {
//             _id: null,
//             minDate: { $min: "$created_at" },
//             maxDate: { $max: "$created_at" }
//           }
//         }
//       ])
//       .toArray();
//     const minDate = dateRange.length > 0 ? dateRange[0].minDate : null;
//     const maxDate = dateRange.length > 0 ? dateRange[0].maxDate : null;

//     res.json({
//       factories,
//       monos,
//       custStyles,
//       buyers,
//       modes,
//       countries,
//       origins,
//       stages, // Added stages
//       empIds, // Added empIds
//       minDate,
//       maxDate
//     });
//   } catch (error) {
//     console.error("Error fetching filter options:", error);
//     res.status(500).json({ error: "Failed to fetch filter options" });
//   }
// });

// // New endpoint for buyer spec order details
// app.get("/api/buyer-spec-order-details/:mono", async (req, res) => {
//   try {
//     const collection = ymProdConnection.db.collection("dt_orders");
//     const order = await collection.findOne({ Order_No: req.params.mono });

//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const colorSizeMap = {};
//     const sizes = new Set();
//     order.OrderColors.forEach((colorObj) => {
//       const color = colorObj.Color.trim();
//       colorSizeMap[color] = {};
//       colorObj.OrderQty.forEach((sizeEntry) => {
//         const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
//         const quantity = sizeEntry[sizeName];
//         if (quantity > 0) {
//           colorSizeMap[color][sizeName] = quantity;
//           sizes.add(sizeName);
//         }
//       });
//     });

//     // Apply the same tolerance correction logic as in /api/measurement-details
//     const buyerSpec = order.SizeSpec.map((spec) => {
//       // Adjust tolMinus and tolPlus to their fractional parts
//       const tolMinusMagnitude =
//         Math.abs(spec.ToleranceMinus.decimal) >= 1
//           ? Math.abs(spec.ToleranceMinus.decimal) -
//             Math.floor(Math.abs(spec.ToleranceMinus.decimal))
//           : Math.abs(spec.ToleranceMinus.decimal);
//       const tolPlusMagnitude =
//         Math.abs(spec.TolerancePlus.decimal) >= 1
//           ? Math.abs(spec.TolerancePlus.decimal) -
//             Math.floor(Math.abs(spec.TolerancePlus.decimal))
//           : Math.abs(spec.TolerancePlus.decimal);

//       return {
//         seq: spec.Seq,
//         measurementPoint: spec.EnglishRemark,
//         chineseRemark: spec.ChineseArea,
//         tolMinus: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude, // Ensure tolMinus is negative
//         tolPlus: tolPlusMagnitude,
//         specs: spec.Specs.reduce((acc, sizeSpec) => {
//           const sizeName = Object.keys(sizeSpec)[0];
//           acc[sizeName] = sizeSpec[sizeName].decimal;
//           return acc;
//         }, {})
//       };
//     });

//     res.json({
//       moNo: order.Order_No,
//       custStyle: order.CustStyle || "N/A",
//       buyer: order.ShortName || "N/A",
//       mode: order.Mode || "N/A",
//       country: order.Country || "N/A",
//       origin: order.Origin || "N/A",
//       orderQty: order.TotalQty,
//       colors: Object.keys(colorSizeMap),
//       sizes: Array.from(sizes),
//       colorSizeMap,
//       buyerSpec
//     });
//   } catch (error) {
//     console.error("Error fetching buyer spec order details:", error);
//     res.status(500).json({ error: "Failed to fetch buyer spec order details" });
//   }
// });

// // New endpoint for paginated MO Nos
// app.get("/api/paginated-monos", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       factory,
//       custStyle,
//       buyer,
//       mode,
//       country,
//       origin
//     } = req.query;
//     const pageSize = 1; // One MO No per page
//     const skip = (parseInt(page) - 1) * pageSize;

//     const filter = {};
//     if (factory) filter.Factory = factory;
//     if (custStyle) filter.CustStyle = custStyle;
//     if (buyer) filter.ShortName = buyer;
//     if (mode) filter.Mode = mode;
//     if (country) filter.Country = country;
//     if (origin) filter.Origin = origin;

//     const total = await ymProdConnection.db
//       .collection("dt_orders")
//       .countDocuments(filter);
//     const monos = await ymProdConnection.db
//       .collection("dt_orders")
//       .find(filter)
//       .project({ Order_No: 1, _id: 0 })
//       .skip(skip)
//       .limit(pageSize)
//       .toArray();

//     res.json({
//       monos: monos.map((m) => m.Order_No),
//       totalPages: Math.ceil(total / pageSize),
//       currentPage: parseInt(page)
//     });
//   } catch (error) {
//     console.error("Error fetching paginated MONos:", error);
//     res.status(500).json({ error: "Failed to fetch paginated MONos" });
//   }
// });

// // New endpoint for overall measurement summary
// app.get("/api/measurement-summary", async (req, res) => {
//   try {
//     const {
//       factory,
//       startDate,
//       endDate,
//       mono,
//       custStyle,
//       buyer,
//       empId,
//       stage
//     } = req.query;
//     const orderFilter = {};
//     if (factory) orderFilter.Factory = factory;
//     if (mono) orderFilter.Order_No = mono;
//     if (custStyle) orderFilter.CustStyle = custStyle;
//     if (buyer) orderFilter.ShortName = buyer;

//     const selectedOrders = await ymProdConnection.db
//       .collection("dt_orders")
//       .find(orderFilter)
//       .toArray();
//     const orderIds = selectedOrders.map((order) => order._id.toString());

//     const measurementFilter = { style_id: { $in: orderIds } };
//     if (startDate || endDate) {
//       measurementFilter.created_at = {};
//       if (startDate) {
//         measurementFilter.created_at.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         measurementFilter.created_at.$lte = end;
//       }
//     }

//     if (empId) measurementFilter["user.name"] = empId;

//     if (stage) measurementFilter.stage = stage;

//     const measurementRecords = await ymEcoConnection.db
//       .collection("measurement_data")
//       .find(measurementFilter)
//       .toArray();
//     const orderIdToSizeSpec = {};
//     selectedOrders.forEach((order) => {
//       orderIdToSizeSpec[order._id.toString()] = order.SizeSpec.map((spec) => {
//         const tolMinusMagnitude =
//           Math.abs(spec.ToleranceMinus.decimal) >= 1
//             ? Math.abs(spec.ToleranceMinus.decimal) -
//               Math.floor(Math.abs(spec.ToleranceMinus.decimal))
//             : Math.abs(spec.ToleranceMinus.decimal);
//         const tolPlusMagnitude =
//           Math.abs(spec.TolerancePlus.decimal) >= 1
//             ? Math.abs(spec.TolerancePlus.decimal) -
//               Math.floor(Math.abs(spec.TolerancePlus.decimal))
//             : Math.abs(spec.TolerancePlus.decimal);

//         return {
//           ...spec,
//           ToleranceMinus: {
//             decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
//           },
//           TolerancePlus: { decimal: tolPlusMagnitude }
//         };
//       });
//     });

//     let orderQty = selectedOrders.reduce(
//       (sum, order) => sum + order.TotalQty,
//       0
//     );
//     let inspectedQty = measurementRecords.length;
//     let totalPass = 0;

//     measurementRecords.forEach((record) => {
//       const sizeSpec = orderIdToSizeSpec[record.style_id];
//       const size = record.size;
//       let isPass = true;
//       for (let i = 0; i < record.actual.length; i++) {
//         if (record.actual[i].value === 0) continue;
//         const spec = sizeSpec[i];
//         const tolMinus = spec.ToleranceMinus.decimal;
//         const tolPlus = spec.TolerancePlus.decimal;

//         // Fix: Define specValue by extracting the buyer's spec for the given size
//         const specValue = spec.Specs.find((s) => Object.keys(s)[0] === size)[
//           size
//         ].decimal;

//         const lower = specValue + tolMinus;
//         const upper = specValue + tolPlus;
//         const actualValue = record.actual[i].value;
//         if (actualValue < lower || actualValue > upper) {
//           isPass = false;
//           break;
//         }
//       }
//       if (isPass) totalPass++;
//     });

//     const totalReject = inspectedQty - totalPass;
//     const passRate =
//       inspectedQty > 0 ? ((totalPass / inspectedQty) * 100).toFixed(2) : "0.00";

//     res.json({ orderQty, inspectedQty, totalPass, totalReject, passRate });
//   } catch (error) {
//     console.error("Error fetching measurement summary:", error);
//     res.status(500).json({ error: "Failed to fetch measurement summary" });
//   }
// });

// // Updated endpoint for paginated measurement summary per MO No, only including MO Nos with inspectedQty > 0
// app.get("/api/measurement-summary-per-mono", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       pageSize = 10,
//       factory,
//       startDate,
//       endDate,
//       mono,
//       custStyle,
//       buyer,
//       empId,
//       stage
//     } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(pageSize);

//     // Build measurement filter
//     const measurementFilter = {};
//     if (startDate || endDate) {
//       measurementFilter.created_at = {};
//       if (startDate) {
//         measurementFilter.created_at.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         measurementFilter.created_at.$lte = end;
//       }
//     }

//     if (empId) measurementFilter["user.name"] = empId;

//     if (stage) measurementFilter.stage = stage;

//     // Build order filter
//     const orderFilter = {};
//     if (factory) orderFilter.Factory = factory;
//     if (mono) orderFilter.Order_No = mono;
//     if (custStyle) orderFilter.CustStyle = custStyle;
//     if (buyer) orderFilter.ShortName = buyer;

//     // Aggregation pipeline to join dt_orders with measurement_data
//     const pipeline = [
//       { $match: orderFilter },
//       {
//         $lookup: {
//           from: "measurement_data",
//           let: { orderId: { $toString: "$_id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$style_id", "$$orderId"] },
//                 ...measurementFilter
//               }
//             }
//           ],
//           as: "measurements"
//         }
//       },
//       { $match: { measurements: { $ne: [] } } }, // Only include orders with measurements
//       { $sort: { Order_No: 1 } },
//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [{ $skip: skip }, { $limit: parseInt(pageSize) }]
//         }
//       }
//     ];

//     const result = await ymProdConnection.db
//       .collection("dt_orders")
//       .aggregate(pipeline)
//       .toArray();
//     const orders = result[0].data || [];
//     const totalOrders = result[0].metadata[0]?.total || 0;
//     const totalPages = Math.ceil(totalOrders / parseInt(pageSize));

//     const orderIds = orders.map((order) => order._id.toString());
//     const measurementRecords = await ymEcoConnection.db
//       .collection("measurement_data")
//       .find({
//         style_id: { $in: orderIds },
//         ...measurementFilter
//       })
//       .toArray();

//     const recordsByOrder = {};
//     measurementRecords.forEach((record) => {
//       const styleId = record.style_id;
//       if (!recordsByOrder[styleId]) recordsByOrder[styleId] = [];
//       recordsByOrder[styleId].push(record);
//     });

//     const orderIdToSizeSpec = {};
//     orders.forEach((order) => {
//       orderIdToSizeSpec[order._id.toString()] = order.SizeSpec.map((spec) => {
//         const tolMinusMagnitude =
//           Math.abs(spec.ToleranceMinus.decimal) >= 1
//             ? Math.abs(spec.ToleranceMinus.decimal) -
//               Math.floor(Math.abs(spec.ToleranceMinus.decimal))
//             : Math.abs(spec.ToleranceMinus.decimal);
//         const tolPlusMagnitude =
//           Math.abs(spec.TolerancePlus.decimal) >= 1
//             ? Math.abs(spec.TolerancePlus.decimal) -
//               Math.floor(Math.abs(spec.TolerancePlus.decimal))
//             : Math.abs(spec.TolerancePlus.decimal);

//         return {
//           ...spec,
//           ToleranceMinus: {
//             decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
//           },
//           TolerancePlus: { decimal: tolPlusMagnitude }
//         };
//       });
//     });

//     const summaryPerMono = orders.map((order) => {
//       const styleId = order._id.toString();
//       const records = recordsByOrder[styleId] || [];
//       let inspectedQty = records.length;
//       let totalPass = 0;
//       records.forEach((record) => {
//         const sizeSpec = orderIdToSizeSpec[styleId];
//         const size = record.size;
//         let isPass = true;
//         for (let i = 0; i < record.actual.length; i++) {
//           if (record.actual[i].value === 0) continue;
//           const spec = sizeSpec[i];
//           const tolMinus = spec.ToleranceMinus.decimal;
//           const tolPlus = spec.TolerancePlus.decimal;

//           const specValue = spec.Specs.find((s) => Object.keys(s)[0] === size)[
//             size
//           ].decimal;
//           const lower = specValue + tolMinus;
//           const upper = specValue + tolPlus;
//           const actualValue = record.actual[i].value;
//           if (actualValue < lower || actualValue > upper) {
//             isPass = false;
//             break;
//           }
//         }
//         if (isPass) totalPass++;
//       });
//       const totalReject = inspectedQty - totalPass;
//       const passRate =
//         inspectedQty > 0
//           ? ((totalPass / inspectedQty) * 100).toFixed(2)
//           : "0.00";
//       return {
//         moNo: order.Order_No,
//         custStyle: order.CustStyle,
//         buyer: order.ShortName,
//         country: order.Country,
//         origin: order.Origin,
//         mode: order.Mode,
//         orderQty: order.TotalQty,
//         inspectedQty,
//         totalPass,
//         totalReject,
//         passRate
//       };
//     });

//     res.json({ summaryPerMono, totalPages, currentPage: parseInt(page) });
//   } catch (error) {
//     console.error("Error fetching measurement summary per MO No:", error);
//     res
//       .status(500)
//       .json({ error: "Failed to fetch measurement summary per MO No" });
//   }
// });

// // Updated endpoint for measurement details by MO No

// app.get("/api/measurement-details/:mono", async (req, res) => {
//   try {
//     const { startDate, endDate, empId, stage } = req.query;
//     const order = await ymProdConnection.db
//       .collection("dt_orders")
//       .findOne({ Order_No: req.params.mono });
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const styleId = order._id.toString();
//     const measurementFilter = { style_id: styleId };
//     if (startDate || endDate) {
//       measurementFilter.created_at = {};
//       if (startDate) {
//         measurementFilter.created_at.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         measurementFilter.created_at.$lte = end;
//       }
//     }

//     if (empId) measurementFilter["user.name"] = empId;

//     if (stage) measurementFilter.stage = stage;

//     const records = await ymEcoConnection.db
//       .collection("measurement_data")
//       .find(measurementFilter)
//       .toArray();

//     const correctedSizeSpec = order.SizeSpec.map((spec) => {
//       const tolMinusMagnitude =
//         Math.abs(spec.ToleranceMinus.decimal) >= 1
//           ? Math.abs(spec.ToleranceMinus.decimal) -
//             Math.floor(Math.abs(spec.ToleranceMinus.decimal))
//           : Math.abs(spec.ToleranceMinus.decimal);
//       const tolPlusMagnitude =
//         Math.abs(spec.TolerancePlus.decimal) >= 1
//           ? Math.abs(spec.TolerancePlus.decimal) -
//             Math.floor(Math.abs(spec.TolerancePlus.decimal))
//           : Math.abs(spec.TolerancePlus.decimal);

//       return {
//         ...spec,
//         ToleranceMinus: {
//           decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
//         },
//         TolerancePlus: {
//           decimal: tolPlusMagnitude
//         }
//       };
//     });

//     // Calculate the measurement point summary
//     const measurementPointSummary = correctedSizeSpec
//       .map((spec, index) => {
//         const measurementPoint = spec.EnglishRemark;
//         const tolMinus = spec.ToleranceMinus.decimal;
//         const tolPlus = spec.TolerancePlus.decimal;

//         let totalCount = 0;
//         let totalPass = 0;

//         records.forEach((record) => {
//           const actualValue = record.actual[index]?.value || 0;
//           if (actualValue === 0) return; // Skip if the value is 0

//           totalCount++;

//           // Get the buyer spec for the specific size of the record
//           const buyerSpec =
//             spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
//               record.size
//             ]?.decimal || 0;

//           const lower = buyerSpec + tolMinus;
//           const upper = buyerSpec + tolPlus;

//           if (actualValue >= lower && actualValue <= upper) {
//             totalPass++;
//           }
//         });

//         const totalFail = totalCount - totalPass;
//         const passRate =
//           totalCount > 0 ? ((totalPass / totalCount) * 100).toFixed(2) : "0.00";

//         // Use the first valid size as a representative buyer spec (for summary display)
//         const sampleRecord = records.find(
//           (r) => r.size && spec.Specs.find((s) => Object.keys(s)[0] === r.size)
//         );
//         const buyerSpec = sampleRecord
//           ? spec.Specs.find((s) => Object.keys(s)[0] === sampleRecord.size)?.[
//               sampleRecord.size
//             ]?.decimal || 0
//           : 0;

//         return {
//           measurementPoint,
//           buyerSpec,
//           tolMinus,
//           tolPlus,
//           totalCount,
//           totalPass,
//           totalFail,
//           passRate
//         };
//       })
//       .filter((summary) => summary.totalCount > 0); // Only include measurement points with non-zero counts

//     res.json({
//       records: records.map((record) => ({
//         ...record,
//         reference_no: record.reference_no // Include reference_no in the response
//       })),
//       sizeSpec: correctedSizeSpec,
//       measurementPointSummary // Add the new summary data
//     });
//   } catch (error) {
//     console.error("Error fetching measurement details:", error);
//     res.status(500).json({ error: "Failed to fetch measurement details" });
//   }
// });

// // New endpoint to update measurement value

// app.put("/api/update-measurement-value", async (req, res) => {
//   try {
//     const { moNo, referenceNo, index, newValue } = req.body;

//     // Validate inputs
//     if (
//       !moNo ||
//       !referenceNo ||
//       index === undefined ||
//       newValue === undefined
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Convert newValue to a float and ensure it's a valid number
//     const updatedValue = parseFloat(newValue);
//     if (isNaN(updatedValue)) {
//       return res.status(400).json({ error: "Invalid measurement value" });
//     }

//     // Find the dt_orders record to get its _id
//     const order = await ymProdConnection.db
//       .collection("dt_orders")
//       .findOne({ Order_No: moNo });
//     if (!order) {
//       return res.status(404).json({ error: "Order not found for MO No" });
//     }

//     const styleId = order._id.toString();

//     // Find the measurement_data record with matching style_id and reference_no
//     const record = await ymEcoConnection.db
//       .collection("measurement_data")
//       .findOne({ style_id: styleId, reference_no: referenceNo });

//     if (!record) {
//       return res.status(404).json({ error: "Measurement record not found" });
//     }

//     // Validate the index against the actual array length
//     if (!record.actual || index < 0 || index >= record.actual.length) {
//       return res.status(400).json({ error: "Invalid index for actual array" });
//     }

//     // Update the specific index in the actual array
//     const result = await ymEcoConnection.db
//       .collection("measurement_data")
//       .updateOne(
//         { style_id: styleId, reference_no: referenceNo },
//         {
//           $set: {
//             [`actual.${index}.value`]: updatedValue,
//             updated_at: new Date()
//           }
//         }
//       );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ error: "Record not found during update" });
//     }

//     if (result.modifiedCount === 0) {
//       return res.status(500).json({ error: "Failed to update the record" });
//     }

//     res.json({ message: "Measurement value updated successfully" });
//   } catch (error) {
//     console.error(
//       "Error updating measurement value:",
//       error.message,
//       error.stack
//     );
//     res.status(500).json({
//       error: "Failed to update measurement value",
//       details: error.message
//     });
//   }
// });

// // New endpoint to delete measurement record
// app.delete("/api/delete-measurement-record", async (req, res) => {
//   try {
//     const { moNo, referenceNo } = req.body;

//     // Validate input
//     if (!moNo || !referenceNo) {
//       return res
//         .status(400)
//         .json({ error: "moNo and referenceNo are required" });
//     }

//     // Find the dt_orders record to get style_id
//     const order = await ymProdConnection.db
//       .collection("dt_orders")
//       .findOne({ Order_No: moNo }, { projection: { _id: 1 } });

//     if (!order) {
//       console.log("Order not found for MO No:", moNo);
//       return res
//         .status(404)
//         .json({ error: `Order not found for MO No: ${moNo}` });
//     }

//     const styleId = order._id.toString();

//     // Delete the measurement_data record
//     const result = await ymEcoConnection.db
//       .collection("measurement_data")
//       .deleteOne({
//         style_id: styleId,
//         reference_no: referenceNo
//       });

//     if (result.deletedCount === 0) {
//       console.log("No measurement record found for:", { styleId, referenceNo });
//       return res.status(404).json({
//         error: `No measurement record found for reference_no: ${referenceNo}`
//       });
//     }

//     res
//       .status(200)
//       .json({ message: "Measurement record deleted successfully" });
//   } catch (error) {
//     console.error(
//       "Error deleting measurement record:",
//       error.message,
//       error.stack
//     );
//     res.status(500).json({
//       error: "Failed to delete measurement record",
//       details: error.message
//     });
//   }
// });

/* ------------------------------
Washing Live Dashboard Endpoints
------------------------------ */

// const getDayRange = (date) => {
//   const start = new Date(date);
//   start.setHours(0, 0, 0, 0);
//   const end = new Date(date);
//   end.setHours(23, 59, 59, 999);
//   return { start, end };
// };

// // Endpoint to fetch filter options for Washing Dashboard
// app.get("/api/washing/filters", async (req, res) => {
//   try {
//     // Destructure query params, ensuring they are used correctly
//     const {
//       startDate: queryStartDate,
//       endDate: queryEndDate,
//       moNo: queryMoNo, // This will be the selectedMono value from the client
//       custStyle: queryCustStyle,
//       buyer: queryBuyer,
//       color: queryColor,
//       size: querySize,
//       qcId: queryQcId,
//       packageNo: queryPackageNo // This will be the package_no value
//     } = req.query;

//     let matchQuery = {};

//     const dateMatchAnd = [];
//     if (queryStartDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(queryStartDate)
//         ]
//       });
//     }
//     if (queryEndDate) {
//       const endOfDay = new Date(queryEndDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }

//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     }

//     // Build matchQuery for filtering options based on *other* active filters
//     // MO No Filter (selectedMono)
//     if (queryMoNo) matchQuery.selectedMono = queryMoNo;
//     // Package No Filter
//     if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
//     // Other text/select filters
//     if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
//     if (queryBuyer) matchQuery.buyer = queryBuyer;
//     if (queryColor) matchQuery.color = queryColor;
//     if (querySize) matchQuery.size = querySize;
//     if (queryQcId) matchQuery.emp_id_washing = queryQcId;

//     // --- Pipelines for distinct values ---
//     // MO Nos (from selectedMono)
//     const moNosPipeline = [
//       { $match: { ...matchQuery, selectedMono: { $ne: null, $ne: "" } } }, // Apply general filters
//       { $group: { _id: "$selectedMono" } },
//       { $sort: { _id: 1 } },
//       { $project: { _id: 0, value: "$_id", label: "$_id" } }
//     ];
//     // If a moNo is already selected, we don't need to filter the moNo list by itself.
//     // So, if queryMoNo is active, for *this specific pipeline*, remove it from matchQuery
//     const moNosMatch = { ...matchQuery };
//     if (queryMoNo) delete moNosMatch.selectedMono;
//     moNosPipeline[0].$match = {
//       ...moNosMatch,
//       selectedMono: { $ne: null, $ne: "" }
//     };

//     // Package Nos
//     const packageNosPipeline = [
//       { $match: { ...matchQuery, package_no: { $ne: null } } },
//       { $group: { _id: "$package_no" } },
//       { $sort: { _id: 1 } },
//       {
//         $project: {
//           _id: 0,
//           value: { $toString: "$_id" },
//           label: { $toString: "$_id" }
//         }
//       }
//     ];
//     const packageNosMatch = { ...matchQuery };
//     if (queryPackageNo) delete packageNosMatch.package_no;
//     packageNosPipeline[0].$match = {
//       ...packageNosMatch,
//       package_no: { $ne: null }
//     };

//     // Similar logic for other filters to ensure cross-filtering
//     const createDynamicPipeline = (field, isNumeric = false) => {
//       const pipeline = [
//         {
//           $match: {
//             ...matchQuery,
//             [field]: isNumeric ? { $ne: null } : { $ne: null, $ne: "" }
//           }
//         },
//         { $group: { _id: `$${field}` } },
//         { $sort: { _id: 1 } },
//         {
//           $project: {
//             _id: 0,
//             value: isNumeric ? { $toString: `$_id` } : `$_id`,
//             label: isNumeric ? { $toString: `$_id` } : `$_id`
//           }
//         }
//       ];
//       const tempMatch = { ...matchQuery };
//       // if the current field is being filtered by (e.g. queryCustStyle for custStyle pipeline), remove it from this pipeline's match
//       if (req.query[field === "emp_id_washing" ? "qcId" : field])
//         delete tempMatch[field];
//       pipeline[0].$match = {
//         ...tempMatch,
//         [field]: isNumeric ? { $ne: null } : { $ne: null, $ne: "" }
//       };
//       return pipeline;
//     };

//     const qcIdsPipeline = [
//       { $match: { ...matchQuery, emp_id_washing: { $ne: null, $ne: "" } } },
//       {
//         $group: {
//           _id: "$emp_id_washing",
//           eng_name: { $first: "$eng_name_washing" }
//         }
//       },
//       { $sort: { _id: 1 } },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id",
//           label: {
//             $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
//           }
//         }
//       }
//     ];
//     const qcIdsMatch = { ...matchQuery };
//     if (queryQcId) delete qcIdsMatch.emp_id_washing;
//     qcIdsPipeline[0].$match = {
//       ...qcIdsMatch,
//       emp_id_washing: { $ne: null, $ne: "" }
//     };

//     const [
//       moNosData,
//       packageNosData,
//       custStylesData,
//       buyersData,
//       colorsData,
//       sizesData,
//       qcIdsDataResult
//     ] = await Promise.all([
//       Washing.aggregate(moNosPipeline).exec(),
//       Washing.aggregate(packageNosPipeline).exec(),
//       Washing.aggregate(createDynamicPipeline("custStyle")).exec(),
//       Washing.aggregate(createDynamicPipeline("buyer")).exec(),
//       Washing.aggregate(createDynamicPipeline("color")).exec(),
//       Washing.aggregate(createDynamicPipeline("size")).exec(),
//       Washing.aggregate(qcIdsPipeline).exec()
//     ]);

//     res.json({
//       moNos: moNosData.filter((item) => item.value),
//       packageNos: packageNosData.filter((item) => item.value),
//       custStyles: custStylesData.filter((item) => item.value),
//       buyers: buyersData.filter((item) => item.value),
//       colors: colorsData.filter((item) => item.value),
//       sizes: sizesData.filter((item) => item.value),
//       qcIds: qcIdsDataResult.filter((item) => item.value)
//     });
//   } catch (error) {
//     console.error("Error fetching washing filter options:", error);
//     res.status(500).json({ error: "Failed to fetch filter options" });
//   }
// });

// // Endpoint to fetch Washing Dashboard data
// app.get("/api/washing/dashboard-data", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo, // This is selectedMono
//       packageNo, // This is package_no
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId,
//       page = 1,
//       limit = 20
//     } = req.query;

//     let baseMatchQuery = {};
//     if (moNo) baseMatchQuery.selectedMono = moNo; // Correctly filter by selectedMono
//     if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
//     if (custStyle) baseMatchQuery.custStyle = custStyle;
//     if (buyer) baseMatchQuery.buyer = buyer;
//     if (color) baseMatchQuery.color = color;
//     if (size) baseMatchQuery.size = size;
//     if (qcId) baseMatchQuery.emp_id_washing = qcId;

//     // Current period match query
//     let currentPeriodMatchQuery = { ...baseMatchQuery };
//     const currentDateMatchAnd = [];
//     if (startDate) {
//       currentDateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       currentDateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (currentDateMatchAnd.length > 0) {
//       currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
//     } else if (
//       Object.keys(currentPeriodMatchQuery).length === 0 &&
//       !startDate &&
//       !endDate
//     ) {
//       const todayRange = getDayRange(new Date());
//       currentPeriodMatchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$washing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$washing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
//     const prevDate = new Date(referenceDateForPrev);
//     prevDate.setDate(prevDate.getDate() - 1);
//     const prevDayDateRange = getDayRange(prevDate);

//     let previousDayMatchQuery = { ...baseMatchQuery };
//     previousDayMatchQuery.$expr = {
//       $and: [
//         {
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$washing_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(0),
//                 onNull: new Date(0)
//               }
//             },
//             prevDayDateRange.start
//           ]
//         },
//         {
//           $lte: [
//             {
//               $dateFromString: {
//                 dateString: "$washing_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(Date.now() + 86400000 * 365 * 10),
//                 onNull: new Date(Date.now() + 86400000 * 365 * 10)
//               }
//             },
//             prevDayDateRange.end
//           ]
//         }
//       ]
//     };

//     const summaryAggregation = [
//       {
//         $group: {
//           _id: null,
//           totalWashingQty: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$task_no_washing", 55] },
//                 { $ifNull: ["$passQtyWash", 0] },
//                 0
//               ]
//             }
//           },
//           totalRewashQty: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$task_no_washing", 86] },
//                 { $ifNull: ["$passQtyWash", 0] },
//                 0
//               ]
//             }
//           },
//           totalBundles: { $sum: 1 }
//         }
//       }
//     ];

//     const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
//       Washing.aggregate([
//         { $match: currentPeriodMatchQuery },
//         ...summaryAggregation
//       ]).exec(),
//       Washing.aggregate([
//         { $match: previousDayMatchQuery },
//         ...summaryAggregation
//       ]).exec()
//     ]);

//     const overallSummary = currentSummaryResult[0] || {
//       totalWashingQty: 0,
//       totalRewashQty: 0,
//       totalBundles: 0
//     };
//     const previousDaySummary = previousDaySummaryResult[0] || {
//       totalWashingQty: 0,
//       totalRewashQty: 0,
//       totalBundles: 0
//     };

//     const inspectorSummaryPipeline = [
//       { $match: currentPeriodMatchQuery },
//       {
//         $project: {
//           emp_id_washing: 1,
//           eng_name_washing: 1,
//           washing_updated_date: 1,
//           passQtyWash: { $ifNull: ["$passQtyWash", 0] },
//           task_no_washing: 1,
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: null,
//               onNull: null
//             }
//           }
//         }
//       },
//       { $match: { parsedDate: { $ne: null } } },
//       {
//         $group: {
//           _id: {
//             emp_id: "$emp_id_washing",
//             date: "$washing_updated_date",
//             parsedDate: "$parsedDate"
//           },
//           eng_name: { $first: "$eng_name_washing" },
//           dailyWashingQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_washing", 55] }, "$passQtyWash", 0]
//             }
//           },
//           dailyRewashQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_washing", 86] }, "$passQtyWash", 0]
//             }
//           },
//           dailyBundles: { $sum: 1 }
//         }
//       },
//       { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
//       {
//         $project: {
//           _id: 0,
//           emp_id: "$_id.emp_id",
//           eng_name: "$eng_name",
//           date: "$_id.date",
//           dailyWashingQty: 1,
//           dailyRewashQty: 1,
//           dailyBundles: 1
//         }
//       }
//     ];
//     const inspectorSummaryData = await Washing.aggregate(
//       inspectorSummaryPipeline
//     ).exec();

//     const skipRecords = (parseInt(page) - 1) * parseInt(limit);
//     const detailedRecordsPipeline = [
//       { $match: currentPeriodMatchQuery },
//       {
//         $addFields: {
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           }
//         }
//       },
//       { $sort: { parsedDate: -1, washing_update_time: -1 } },
//       { $skip: skipRecords },
//       { $limit: parseInt(limit) },
//       {
//         $project: {
//           washing_updated_date: 1,
//           emp_id_washing: 1,
//           eng_name_washing: 1,
//           dept_name_washing: 1,
//           selectedMono: 1, // This is MO No for display
//           package_no: 1,
//           custStyle: 1,
//           buyer: 1,
//           color: 1,
//           size: 1,
//           washing_update_time: 1,
//           washingQty: {
//             $cond: [
//               { $eq: ["$task_no_washing", 55] },
//               { $ifNull: ["$passQtyWash", 0] },
//               0
//             ]
//           },
//           rewashQty: {
//             $cond: [
//               { $eq: ["$task_no_washing", 86] },
//               { $ifNull: ["$passQtyWash", 0] },
//               0
//             ]
//           },
//           bundleCount: 1
//         }
//       }
//     ];
//     const detailedRecords = await Washing.aggregate(
//       detailedRecordsPipeline
//     ).exec();
//     const totalRecords = await Washing.countDocuments(
//       currentPeriodMatchQuery
//     ).exec();

//     res.json({
//       overallSummary,
//       previousDaySummary,
//       inspectorSummaryData,
//       detailedRecords,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalRecords / parseInt(limit)),
//         totalRecords,
//         limit: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching washing dashboard data:", error);
//     res.status(500).json({ error: "Failed to fetch dashboard data" });
//   }
// });

// /* ------------------------------------
// Endpoint for Hourly Washing Data Chart
// ------------------------------------ */
// app.get("/api/washing/hourly-summary", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId
//     } = req.query;

//     let matchQuery = {};
//     // Date filtering
//     const dateMatchAnd = [];
//     if (startDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$washing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     } else {
//       // Default to today if no date range
//       const todayRange = getDayRange(new Date()); // Ensure getDayRange is defined
//       matchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$washing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$washing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     // Other filters
//     if (moNo) matchQuery.selectedMono = moNo;
//     if (packageNo) matchQuery.package_no = parseInt(packageNo);
//     if (custStyle) matchQuery.custStyle = custStyle;
//     if (buyer) matchQuery.buyer = buyer;
//     if (color) matchQuery.color = color;
//     if (size) matchQuery.size = size;
//     if (qcId) matchQuery.emp_id_washing = qcId;

//     const hourlyData = await Washing.aggregate([
//       { $match: matchQuery },
//       {
//         $project: {
//           hour: { $substr: ["$washing_update_time", 0, 2] }, // Extract HH from HH:MM:SS
//           passQtyWash: { $ifNull: ["$passQtyWash", 0] },
//           task_no_washing: 1
//           // bundle_id: 1 // Assuming each record is one bundle for bundle count
//         }
//       },
//       {
//         $group: {
//           _id: "$hour",
//           totalWashingQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_washing", 55] }, "$passQtyWash", 0]
//             }
//           },
//           totalBundles: { $sum: 1 } // Count each document as a bundle
//         }
//       },
//       { $sort: { _id: 1 } } // Sort by hour
//     ]).exec();

//     // Prepare data for chart (calculate previous hour % change)
//     const chartData = hourlyData.map((item, index, arr) => {
//       const prevItem = index > 0 ? arr[index - 1] : null;

//       let washingQtyChange = 0;
//       if (prevItem && prevItem.totalWashingQty > 0) {
//         washingQtyChange =
//           ((item.totalWashingQty - prevItem.totalWashingQty) /
//             prevItem.totalWashingQty) *
//           100;
//       } else if (
//         prevItem &&
//         prevItem.totalWashingQty === 0 &&
//         item.totalWashingQty > 0
//       ) {
//         washingQtyChange = 100;
//       }

//       let bundleQtyChange = 0;
//       if (prevItem && prevItem.totalBundles > 0) {
//         bundleQtyChange =
//           ((item.totalBundles - prevItem.totalBundles) /
//             prevItem.totalBundles) *
//           100;
//       } else if (
//         prevItem &&
//         prevItem.totalBundles === 0 &&
//         item.totalBundles > 0
//       ) {
//         bundleQtyChange = 100;
//       }

//       return {
//         hour: item._id, // HH string
//         totalWashingQty: item.totalWashingQty,
//         totalBundles: item.totalBundles,
//         washingQtyChange: washingQtyChange.toFixed(1),
//         bundleQtyChange: bundleQtyChange.toFixed(1)
//       };
//     });

//     res.json(chartData);
//   } catch (error) {
//     console.error("Error fetching hourly washing summary:", error);
//     res.status(500).json({ error: "Failed to fetch hourly summary" });
//   }
// });

/* ------------------------------
OPA Live Dashboard Endpoints
------------------------------ */

// // Endpoint to fetch filter options for OPA Dashboard
// app.get("/api/opa/filters", async (req, res) => {
//   try {
//     const {
//       startDate: queryStartDate,
//       endDate: queryEndDate,
//       moNo: queryMoNo,
//       custStyle: queryCustStyle,
//       buyer: queryBuyer,
//       color: queryColor,
//       size: querySize,
//       qcId: queryQcId, // qcId here is emp_id_opa
//       packageNo: queryPackageNo
//     } = req.query;

//     let matchQuery = {};

//     const dateMatchAnd = [];
//     if (queryStartDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(queryStartDate)
//         ]
//       });
//     }
//     if (queryEndDate) {
//       const endOfDay = new Date(queryEndDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }

//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     }

//     if (queryMoNo) matchQuery.selectedMono = queryMoNo;
//     if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
//     if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
//     if (queryBuyer) matchQuery.buyer = queryBuyer;
//     if (queryColor) matchQuery.color = queryColor;
//     if (querySize) matchQuery.size = querySize;
//     if (queryQcId) matchQuery.emp_id_opa = queryQcId;

//     const createDynamicPipeline = (
//       field,
//       isNumeric = false,
//       specificMatch = {}
//     ) => {
//       const baseFieldMatch = isNumeric
//         ? { [field]: { $ne: null } }
//         : { [field]: { $ne: null, $ne: "" } };
//       const pipeline = [
//         { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
//         { $group: { _id: `$${field}` } },
//         { $sort: { _id: 1 } },
//         {
//           $project: {
//             _id: 0,
//             value: isNumeric ? { $toString: `$_id` } : `$_id`,
//             label: isNumeric ? { $toString: `$_id` } : `$_id`
//           }
//         }
//       ];
//       const tempMatch = { ...matchQuery };
//       if (
//         req.query[
//           field === "emp_id_opa"
//             ? "qcId"
//             : field === "selectedMono"
//             ? "moNo"
//             : field === "package_no"
//             ? "packageNo"
//             : field
//         ]
//       )
//         delete tempMatch[field];
//       pipeline[0].$match = {
//         ...tempMatch,
//         ...baseFieldMatch,
//         ...specificMatch
//       };
//       return pipeline;
//     };

//     const qcIdsPipeline = [
//       { $match: { ...matchQuery, emp_id_opa: { $ne: null, $ne: "" } } },
//       { $group: { _id: "$emp_id_opa", eng_name: { $first: "$eng_name_opa" } } },
//       { $sort: { _id: 1 } },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id",
//           label: {
//             $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
//           }
//         }
//       }
//     ];
//     const qcIdsMatch = { ...matchQuery };
//     if (queryQcId) delete qcIdsMatch.emp_id_opa;
//     qcIdsPipeline[0].$match = {
//       ...qcIdsMatch,
//       emp_id_opa: { $ne: null, $ne: "" }
//     };

//     const [
//       moNosData,
//       packageNosData,
//       custStylesData,
//       buyersData,
//       colorsData,
//       sizesData,
//       qcIdsDataResult
//     ] = await Promise.all([
//       OPA.aggregate(createDynamicPipeline("selectedMono")).exec(),
//       OPA.aggregate(createDynamicPipeline("package_no", true)).exec(),
//       OPA.aggregate(createDynamicPipeline("custStyle")).exec(),
//       OPA.aggregate(createDynamicPipeline("buyer")).exec(),
//       OPA.aggregate(createDynamicPipeline("color")).exec(),
//       OPA.aggregate(createDynamicPipeline("size")).exec(),
//       OPA.aggregate(qcIdsPipeline).exec()
//     ]);

//     res.json({
//       moNos: moNosData.filter((item) => item.value),
//       packageNos: packageNosData.filter((item) => item.value),
//       custStyles: custStylesData.filter((item) => item.value),
//       buyers: buyersData.filter((item) => item.value),
//       colors: colorsData.filter((item) => item.value),
//       sizes: sizesData.filter((item) => item.value),
//       qcIds: qcIdsDataResult.filter((item) => item.value)
//     });
//   } catch (error) {
//     console.error("Error fetching OPA filter options:", error);
//     res.status(500).json({ error: "Failed to fetch OPA filter options" });
//   }
// });

// // Endpoint to fetch OPA Dashboard data
// app.get("/api/opa/dashboard-data", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId, // qcId is emp_id_opa
//       page = 1,
//       limit = 20
//     } = req.query;

//     let baseMatchQuery = {};
//     if (moNo) baseMatchQuery.selectedMono = moNo;
//     if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
//     if (custStyle) baseMatchQuery.custStyle = custStyle;
//     if (buyer) baseMatchQuery.buyer = buyer;
//     if (color) baseMatchQuery.color = color;
//     if (size) baseMatchQuery.size = size;
//     if (qcId) baseMatchQuery.emp_id_opa = qcId;

//     let currentPeriodMatchQuery = { ...baseMatchQuery };
//     const currentDateMatchAnd = [];
//     if (startDate) {
//       currentDateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       currentDateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (currentDateMatchAnd.length > 0) {
//       currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
//     } else if (
//       Object.keys(currentPeriodMatchQuery).length === 0 &&
//       !startDate &&
//       !endDate
//     ) {
//       const todayRange = getDayRange(new Date());
//       currentPeriodMatchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$opa_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$opa_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
//     const prevDate = new Date(referenceDateForPrev);
//     prevDate.setDate(prevDate.getDate() - 1);
//     const prevDayDateRange = getDayRange(prevDate);

//     let previousDayMatchQuery = { ...baseMatchQuery };
//     previousDayMatchQuery.$expr = {
//       $and: [
//         {
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$opa_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(0),
//                 onNull: new Date(0)
//               }
//             },
//             prevDayDateRange.start
//           ]
//         },
//         {
//           $lte: [
//             {
//               $dateFromString: {
//                 dateString: "$opa_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(Date.now() + 86400000 * 365 * 10),
//                 onNull: new Date(Date.now() + 86400000 * 365 * 10)
//               }
//             },
//             prevDayDateRange.end
//           ]
//         }
//       ]
//     };

//     const summaryAggregation = [
//       {
//         $group: {
//           _id: null,
//           totalOPAQty: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$task_no_opa", 60] },
//                 { $ifNull: ["$passQtyOPA", 0] },
//                 0
//               ]
//             }
//           },
//           totalRecheckOPAQty: {
//             $sum: {
//               $cond: [
//                 { $ne: ["$task_no_opa", 60] },
//                 { $ifNull: ["$passQtyOPA", 0] },
//                 0
//               ]
//             }
//           }, // Assuming non-60 is recheck
//           totalBundles: { $sum: 1 }
//         }
//       }
//     ];

//     const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
//       OPA.aggregate([
//         { $match: currentPeriodMatchQuery },
//         ...summaryAggregation
//       ]).exec(),
//       OPA.aggregate([
//         { $match: previousDayMatchQuery },
//         ...summaryAggregation
//       ]).exec()
//     ]);

//     const overallSummary = currentSummaryResult[0] || {
//       totalOPAQty: 0,
//       totalRecheckOPAQty: 0,
//       totalBundles: 0
//     };
//     const previousDaySummary = previousDaySummaryResult[0] || {
//       totalOPAQty: 0,
//       totalRecheckOPAQty: 0,
//       totalBundles: 0
//     };

//     const inspectorSummaryPipeline = [
//       { $match: currentPeriodMatchQuery },
//       {
//         $project: {
//           emp_id_opa: 1,
//           eng_name_opa: 1,
//           opa_updated_date: 1,
//           passQtyOPA: { $ifNull: ["$passQtyOPA", 0] },
//           task_no_opa: 1,
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: null,
//               onNull: null
//             }
//           }
//         }
//       },
//       { $match: { parsedDate: { $ne: null } } },
//       {
//         $group: {
//           _id: {
//             emp_id: "$emp_id_opa",
//             date: "$opa_updated_date",
//             parsedDate: "$parsedDate"
//           },
//           eng_name: { $first: "$eng_name_opa" },
//           dailyOPAQty: {
//             $sum: { $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
//           },
//           dailyRecheckOPAQty: {
//             $sum: { $cond: [{ $ne: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
//           },
//           dailyBundles: { $sum: 1 }
//         }
//       },
//       { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
//       {
//         $project: {
//           _id: 0,
//           emp_id: "$_id.emp_id",
//           eng_name: "$eng_name",
//           date: "$_id.date",
//           dailyOPAQty: 1,
//           dailyRecheckOPAQty: 1,
//           dailyBundles: 1
//         }
//       }
//     ];
//     const inspectorSummaryData = await OPA.aggregate(
//       inspectorSummaryPipeline
//     ).exec();

//     const skipRecords = (parseInt(page) - 1) * parseInt(limit);
//     const detailedRecordsPipeline = [
//       { $match: currentPeriodMatchQuery },
//       {
//         $addFields: {
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           }
//         }
//       },
//       { $sort: { parsedDate: -1, opa_update_time: -1 } },
//       { $skip: skipRecords },
//       { $limit: parseInt(limit) },
//       {
//         $project: {
//           opa_updated_date: 1,
//           emp_id_opa: 1,
//           eng_name_opa: 1,
//           dept_name_opa: 1,
//           selectedMono: 1,
//           package_no: 1,
//           custStyle: 1,
//           buyer: 1,
//           color: 1,
//           size: 1,
//           opa_update_time: 1,
//           opaQty: {
//             $cond: [
//               { $eq: ["$task_no_opa", 60] },
//               { $ifNull: ["$passQtyOPA", 0] },
//               0
//             ]
//           },
//           recheckOPAQty: {
//             $cond: [
//               { $ne: ["$task_no_opa", 60] },
//               { $ifNull: ["$passQtyOPA", 0] },
//               0
//             ]
//           },
//           bundleCount: 1 // Assuming 'count' field in schema means total pieces in bundle, or 1 if it's bundle count
//         }
//       }
//     ];
//     const detailedRecords = await OPA.aggregate(detailedRecordsPipeline).exec();
//     const totalRecords = await OPA.countDocuments(
//       currentPeriodMatchQuery
//     ).exec();

//     res.json({
//       overallSummary,
//       previousDaySummary,
//       inspectorSummaryData,
//       detailedRecords,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalRecords / parseInt(limit)),
//         totalRecords,
//         limit: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching OPA dashboard data:", error);
//     res.status(500).json({ error: "Failed to fetch OPA dashboard data" });
//   }
// });

// // Endpoint for Hourly OPA Data Chart
// app.get("/api/opa/hourly-summary", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId
//     } = req.query;

//     let matchQuery = {};
//     const dateMatchAnd = [];
//     if (startDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$opa_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     } else {
//       const todayRange = getDayRange(new Date());
//       matchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$opa_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$opa_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     if (moNo) matchQuery.selectedMono = moNo;
//     if (packageNo) matchQuery.package_no = parseInt(packageNo);
//     if (custStyle) matchQuery.custStyle = custStyle;
//     if (buyer) matchQuery.buyer = buyer;
//     if (color) matchQuery.color = color;
//     if (size) matchQuery.size = size;
//     if (qcId) matchQuery.emp_id_opa = qcId;

//     const hourlyData = await OPA.aggregate([
//       { $match: matchQuery },
//       {
//         $project: {
//           hour: { $substr: ["$opa_update_time", 0, 2] },
//           passQtyOPA: { $ifNull: ["$passQtyOPA", 0] },
//           task_no_opa: 1
//         }
//       },
//       {
//         $group: {
//           _id: "$hour",
//           totalOPAQty: {
//             $sum: { $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
//           },
//           totalBundles: { $sum: 1 }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]).exec();

//     const chartData = hourlyData.map((item, index, arr) => {
//       const prevItem = index > 0 ? arr[index - 1] : null;
//       let opaQtyChange = 0;
//       if (prevItem && prevItem.totalOPAQty > 0)
//         opaQtyChange =
//           ((item.totalOPAQty - prevItem.totalOPAQty) / prevItem.totalOPAQty) *
//           100;
//       else if (prevItem && prevItem.totalOPAQty === 0 && item.totalOPAQty > 0)
//         opaQtyChange = 100;

//       let bundleQtyChange = 0;
//       if (prevItem && prevItem.totalBundles > 0)
//         bundleQtyChange =
//           ((item.totalBundles - prevItem.totalBundles) /
//             prevItem.totalBundles) *
//           100;
//       else if (prevItem && prevItem.totalBundles === 0 && item.totalBundles > 0)
//         bundleQtyChange = 100;

//       return {
//         hour: item._id,
//         totalOPAQty: item.totalOPAQty,
//         totalBundles: item.totalBundles,
//         opaQtyChange: opaQtyChange.toFixed(1),
//         bundleQtyChange: bundleQtyChange.toFixed(1)
//       };
//     });
//     res.json(chartData);
//   } catch (error) {
//     console.error("Error fetching hourly OPA summary:", error);
//     res.status(500).json({ error: "Failed to fetch hourly OPA summary" });
//   }
// });

/* ------------------------------
Ironing Live Dashboard Endpoints
------------------------------ */

// app.get("/api/ironing/filters", async (req, res) => {
//   try {
//     const {
//       startDate: queryStartDate,
//       endDate: queryEndDate,
//       moNo: queryMoNo,
//       custStyle: queryCustStyle,
//       buyer: queryBuyer,
//       color: queryColor,
//       size: querySize,
//       qcId: queryQcId,
//       packageNo: queryPackageNo
//     } = req.query;

//     let matchQuery = {};

//     const dateMatchAnd = [];
//     if (queryStartDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(queryStartDate)
//         ]
//       });
//     }
//     if (queryEndDate) {
//       const endOfDay = new Date(queryEndDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }

//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     }

//     if (queryMoNo) matchQuery.selectedMono = queryMoNo;
//     if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
//     if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
//     if (queryBuyer) matchQuery.buyer = queryBuyer;
//     if (queryColor) matchQuery.color = queryColor;
//     if (querySize) matchQuery.size = querySize;
//     if (queryQcId) matchQuery.emp_id_ironing = queryQcId;

//     const createDynamicPipeline = (
//       field,
//       isNumeric = false,
//       specificMatch = {}
//     ) => {
//       const baseFieldMatch = isNumeric
//         ? { [field]: { $ne: null } }
//         : { [field]: { $ne: null, $ne: "" } };
//       const pipeline = [
//         { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
//         { $group: { _id: `$${field}` } },
//         { $sort: { _id: 1 } },
//         {
//           $project: {
//             _id: 0,
//             value: isNumeric ? { $toString: `$_id` } : `$_id`,
//             label: isNumeric ? { $toString: `$_id` } : `$_id`
//           }
//         }
//       ];
//       const tempMatch = { ...matchQuery };
//       let queryParamName = field;
//       if (field === "emp_id_ironing") queryParamName = "qcId";
//       else if (field === "selectedMono") queryParamName = "moNo";
//       else if (field === "package_no") queryParamName = "packageNo";

//       if (req.query[queryParamName]) delete tempMatch[field];
//       pipeline[0].$match = {
//         ...tempMatch,
//         ...baseFieldMatch,
//         ...specificMatch
//       };
//       return pipeline;
//     };

//     const qcIdsPipeline = [
//       { $match: { ...matchQuery, emp_id_ironing: { $ne: null, $ne: "" } } },
//       {
//         $group: {
//           _id: "$emp_id_ironing",
//           eng_name: { $first: "$eng_name_ironing" }
//         }
//       },
//       { $sort: { _id: 1 } },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id",
//           label: {
//             $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
//           }
//         }
//       }
//     ];
//     const qcIdsMatch = { ...matchQuery };
//     if (queryQcId) delete qcIdsMatch.emp_id_ironing;
//     qcIdsPipeline[0].$match = {
//       ...qcIdsMatch,
//       emp_id_ironing: { $ne: null, $ne: "" }
//     };

//     const [
//       moNosData,
//       packageNosData,
//       custStylesData,
//       buyersData,
//       colorsData,
//       sizesData,
//       qcIdsDataResult
//     ] = await Promise.all([
//       Ironing.aggregate(createDynamicPipeline("selectedMono")).exec(),
//       Ironing.aggregate(createDynamicPipeline("package_no", true)).exec(),
//       Ironing.aggregate(createDynamicPipeline("custStyle")).exec(),
//       Ironing.aggregate(createDynamicPipeline("buyer")).exec(),
//       Ironing.aggregate(createDynamicPipeline("color")).exec(),
//       Ironing.aggregate(createDynamicPipeline("size")).exec(),
//       Ironing.aggregate(qcIdsPipeline).exec()
//     ]);

//     res.json({
//       moNos: moNosData.filter((item) => item.value),
//       packageNos: packageNosData.filter((item) => item.value),
//       custStyles: custStylesData.filter((item) => item.value),
//       buyers: buyersData.filter((item) => item.value),
//       colors: colorsData.filter((item) => item.value),
//       sizes: sizesData.filter((item) => item.value),
//       qcIds: qcIdsDataResult.filter((item) => item.value)
//     });
//   } catch (error) {
//     console.error("Error fetching Ironing filter options:", error);
//     res.status(500).json({ error: "Failed to fetch Ironing filter options" });
//   }
// });

// app.get("/api/ironing/dashboard-data", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId,
//       page = 1,
//       limit = 20
//     } = req.query;

//     let baseMatchQuery = {};
//     if (moNo) baseMatchQuery.selectedMono = moNo;
//     if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
//     if (custStyle) baseMatchQuery.custStyle = custStyle;
//     if (buyer) baseMatchQuery.buyer = buyer;
//     if (color) baseMatchQuery.color = color;
//     if (size) baseMatchQuery.size = size;
//     if (qcId) baseMatchQuery.emp_id_ironing = qcId;

//     let currentPeriodMatchQuery = { ...baseMatchQuery };
//     const currentDateMatchAnd = [];
//     if (startDate) {
//       currentDateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       currentDateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (currentDateMatchAnd.length > 0) {
//       currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
//     } else if (
//       Object.keys(currentPeriodMatchQuery).length === 0 &&
//       !startDate &&
//       !endDate
//     ) {
//       const todayRange = getDayRange(new Date());
//       currentPeriodMatchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$ironing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$ironing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
//     const prevDate = new Date(referenceDateForPrev);
//     prevDate.setDate(prevDate.getDate() - 1);
//     const prevDayDateRange = getDayRange(prevDate);

//     let previousDayMatchQuery = { ...baseMatchQuery };
//     previousDayMatchQuery.$expr = {
//       $and: [
//         {
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$ironing_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(0),
//                 onNull: new Date(0)
//               }
//             },
//             prevDayDateRange.start
//           ]
//         },
//         {
//           $lte: [
//             {
//               $dateFromString: {
//                 dateString: "$ironing_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(Date.now() + 86400000 * 365 * 10),
//                 onNull: new Date(Date.now() + 86400000 * 365 * 10)
//               }
//             },
//             prevDayDateRange.end
//           ]
//         }
//       ]
//     };

//     const summaryAggregation = [
//       {
//         $group: {
//           _id: null,
//           totalIroningQty: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$task_no_ironing", 53] },
//                 { $ifNull: ["$passQtyIron", 0] },
//                 0
//               ]
//             }
//           },
//           totalRecheckIroningQty: {
//             $sum: {
//               $cond: [
//                 { $ne: ["$task_no_ironing", 53] },
//                 { $ifNull: ["$passQtyIron", 0] },
//                 0
//               ]
//             }
//           },
//           totalBundles: { $sum: 1 }
//         }
//       }
//     ];

//     const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
//       Ironing.aggregate([
//         { $match: currentPeriodMatchQuery },
//         ...summaryAggregation
//       ]).exec(),
//       Ironing.aggregate([
//         { $match: previousDayMatchQuery },
//         ...summaryAggregation
//       ]).exec()
//     ]);

//     const overallSummary = currentSummaryResult[0] || {
//       totalIroningQty: 0,
//       totalRecheckIroningQty: 0,
//       totalBundles: 0
//     };
//     const previousDaySummary = previousDaySummaryResult[0] || {
//       totalIroningQty: 0,
//       totalRecheckIroningQty: 0,
//       totalBundles: 0
//     };

//     const inspectorSummaryPipeline = [
//       { $match: currentPeriodMatchQuery },
//       {
//         $project: {
//           emp_id_ironing: 1,
//           eng_name_ironing: 1,
//           ironing_updated_date: 1,
//           passQtyIron: { $ifNull: ["$passQtyIron", 0] },
//           task_no_ironing: 1,
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: null,
//               onNull: null
//             }
//           }
//         }
//       },
//       { $match: { parsedDate: { $ne: null } } },
//       {
//         $group: {
//           _id: {
//             emp_id: "$emp_id_ironing",
//             date: "$ironing_updated_date",
//             parsedDate: "$parsedDate"
//           },
//           eng_name: { $first: "$eng_name_ironing" },
//           dailyIroningQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
//             }
//           },
//           dailyRecheckIroningQty: {
//             $sum: {
//               $cond: [{ $ne: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
//             }
//           },
//           dailyBundles: { $sum: 1 }
//         }
//       },
//       { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
//       {
//         $project: {
//           _id: 0,
//           emp_id: "$_id.emp_id",
//           eng_name: "$eng_name",
//           date: "$_id.date",
//           dailyIroningQty: 1,
//           dailyRecheckIroningQty: 1,
//           dailyBundles: 1
//         }
//       }
//     ];
//     const inspectorSummaryData = await Ironing.aggregate(
//       inspectorSummaryPipeline
//     ).exec();

//     const skipRecords = (parseInt(page) - 1) * parseInt(limit);
//     const detailedRecordsPipeline = [
//       { $match: currentPeriodMatchQuery },
//       {
//         $addFields: {
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           }
//         }
//       },
//       { $sort: { parsedDate: -1, ironing_update_time: -1 } },
//       { $skip: skipRecords },
//       { $limit: parseInt(limit) },
//       {
//         $project: {
//           ironing_updated_date: 1,
//           emp_id_ironing: 1,
//           eng_name_ironing: 1,
//           dept_name_ironing: 1,
//           selectedMono: 1,
//           package_no: 1,
//           custStyle: 1,
//           buyer: 1,
//           color: 1,
//           size: 1,
//           ironing_update_time: 1,
//           ironingQty: {
//             $cond: [
//               { $eq: ["$task_no_ironing", 53] },
//               { $ifNull: ["$passQtyIron", 0] },
//               0
//             ]
//           },
//           recheckIroningQty: {
//             $cond: [
//               { $ne: ["$task_no_ironing", 53] },
//               { $ifNull: ["$passQtyIron", 0] },
//               0
//             ]
//           },
//           bundleCount: 1
//         }
//       }
//     ];
//     const detailedRecords = await Ironing.aggregate(
//       detailedRecordsPipeline
//     ).exec();
//     const totalRecords = await Ironing.countDocuments(
//       currentPeriodMatchQuery
//     ).exec();

//     res.json({
//       overallSummary,
//       previousDaySummary,
//       inspectorSummaryData,
//       detailedRecords,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalRecords / parseInt(limit)),
//         totalRecords,
//         limit: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching Ironing dashboard data:", error);
//     res.status(500).json({ error: "Failed to fetch Ironing dashboard data" });
//   }
// });

// app.get("/api/ironing/hourly-summary", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId
//     } = req.query;

//     let matchQuery = {};
//     const dateMatchAnd = [];
//     if (startDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$ironing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     } else {
//       const todayRange = getDayRange(new Date());
//       matchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$ironing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$ironing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     if (moNo) matchQuery.selectedMono = moNo;
//     if (packageNo) matchQuery.package_no = parseInt(packageNo);
//     if (custStyle) matchQuery.custStyle = custStyle;
//     if (buyer) matchQuery.buyer = buyer;
//     if (color) matchQuery.color = color;
//     if (size) matchQuery.size = size;
//     if (qcId) matchQuery.emp_id_ironing = qcId;

//     const hourlyData = await Ironing.aggregate([
//       { $match: matchQuery },
//       {
//         $project: {
//           hour: { $substr: ["$ironing_update_time", 0, 2] },
//           passQtyIron: { $ifNull: ["$passQtyIron", 0] },
//           task_no_ironing: 1
//         }
//       },
//       {
//         $group: {
//           _id: "$hour",
//           totalIroningQty: {
//             $sum: {
//               $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
//             }
//           },
//           totalBundles: { $sum: 1 }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]).exec();

//     const chartData = hourlyData.map((item, index, arr) => {
//       const prevItem = index > 0 ? arr[index - 1] : null;
//       let ironingQtyChange = 0;
//       if (prevItem && prevItem.totalIroningQty > 0)
//         ironingQtyChange =
//           ((item.totalIroningQty - prevItem.totalIroningQty) /
//             prevItem.totalIroningQty) *
//           100;
//       else if (
//         prevItem &&
//         prevItem.totalIroningQty === 0 &&
//         item.totalIroningQty > 0
//       )
//         ironingQtyChange = 100;

//       let bundleQtyChange = 0;
//       if (prevItem && prevItem.totalBundles > 0)
//         bundleQtyChange =
//           ((item.totalBundles - prevItem.totalBundles) /
//             prevItem.totalBundles) *
//           100;
//       else if (prevItem && prevItem.totalBundles === 0 && item.totalBundles > 0)
//         bundleQtyChange = 100;

//       return {
//         hour: item._id,
//         totalIroningQty: item.totalIroningQty,
//         totalBundles: item.totalBundles,
//         ironingQtyChange: ironingQtyChange.toFixed(1),
//         bundleQtyChange: bundleQtyChange.toFixed(1)
//       };
//     });
//     res.json(chartData);
//   } catch (error) {
//     console.error("Error fetching hourly Ironing summary:", error);
//     res.status(500).json({ error: "Failed to fetch hourly Ironing summary" });
//   }
// });

/* ------------------------------
Packing Live Dashboard Endpoints
------------------------------ */

// app.get("/api/packing/filters", async (req, res) => {
//   try {
//     const {
//       startDate: queryStartDate,
//       endDate: queryEndDate,
//       moNo: queryMoNo,
//       custStyle: queryCustStyle,
//       buyer: queryBuyer,
//       color: queryColor,
//       size: querySize,
//       qcId: queryQcId, // qcId here is emp_id_packing
//       packageNo: queryPackageNo
//     } = req.query;

//     let matchQuery = {};

//     const dateMatchAnd = [];
//     if (queryStartDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(queryStartDate)
//         ]
//       });
//     }
//     if (queryEndDate) {
//       const endOfDay = new Date(queryEndDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }

//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     }

//     if (queryMoNo) matchQuery.selectedMono = queryMoNo;
//     if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
//     if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
//     if (queryBuyer) matchQuery.buyer = queryBuyer;
//     if (queryColor) matchQuery.color = queryColor;
//     if (querySize) matchQuery.size = querySize;
//     if (queryQcId) matchQuery.emp_id_packing = queryQcId;

//     const createDynamicPipeline = (
//       field,
//       isNumeric = false,
//       specificMatch = {}
//     ) => {
//       const baseFieldMatch = isNumeric
//         ? { [field]: { $ne: null } }
//         : { [field]: { $ne: null, $ne: "" } };
//       const pipeline = [
//         { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
//         { $group: { _id: `$${field}` } },
//         { $sort: { _id: 1 } },
//         {
//           $project: {
//             _id: 0,
//             value: isNumeric ? { $toString: `$_id` } : `$_id`,
//             label: isNumeric ? { $toString: `$_id` } : `$_id`
//           }
//         }
//       ];
//       const tempMatch = { ...matchQuery };
//       let queryParamName = field;
//       if (field === "emp_id_packing") queryParamName = "qcId";
//       else if (field === "selectedMono") queryParamName = "moNo";
//       else if (field === "package_no") queryParamName = "packageNo";

//       if (req.query[queryParamName]) delete tempMatch[field];
//       pipeline[0].$match = {
//         ...tempMatch,
//         ...baseFieldMatch,
//         ...specificMatch
//       };
//       return pipeline;
//     };

//     const qcIdsPipeline = [
//       { $match: { ...matchQuery, emp_id_packing: { $ne: null, $ne: "" } } },
//       {
//         $group: {
//           _id: "$emp_id_packing",
//           eng_name: { $first: "$eng_name_packing" }
//         }
//       },
//       { $sort: { _id: 1 } },
//       {
//         $project: {
//           _id: 0,
//           value: "$_id",
//           label: {
//             $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
//           }
//         }
//       }
//     ];
//     const qcIdsMatch = { ...matchQuery };
//     if (queryQcId) delete qcIdsMatch.emp_id_packing;
//     qcIdsPipeline[0].$match = {
//       ...qcIdsMatch,
//       emp_id_packing: { $ne: null, $ne: "" }
//     };

//     const [
//       moNosData,
//       packageNosData,
//       custStylesData,
//       buyersData,
//       colorsData,
//       sizesData,
//       qcIdsDataResult
//     ] = await Promise.all([
//       Packing.aggregate(createDynamicPipeline("selectedMono")).exec(),
//       Packing.aggregate(createDynamicPipeline("package_no", true)).exec(),
//       Packing.aggregate(createDynamicPipeline("custStyle")).exec(),
//       Packing.aggregate(createDynamicPipeline("buyer")).exec(),
//       Packing.aggregate(createDynamicPipeline("color")).exec(),
//       Packing.aggregate(createDynamicPipeline("size")).exec(),
//       Packing.aggregate(qcIdsPipeline).exec()
//     ]);

//     res.json({
//       moNos: moNosData.filter((item) => item.value),
//       packageNos: packageNosData.filter((item) => item.value),
//       custStyles: custStylesData.filter((item) => item.value),
//       buyers: buyersData.filter((item) => item.value),
//       colors: colorsData.filter((item) => item.value),
//       sizes: sizesData.filter((item) => item.value),
//       qcIds: qcIdsDataResult.filter((item) => item.value)
//     });
//   } catch (error) {
//     console.error("Error fetching Packing filter options:", error);
//     res.status(500).json({ error: "Failed to fetch Packing filter options" });
//   }
// });

// app.get("/api/packing/dashboard-data", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId,
//       page = 1,
//       limit = 20
//     } = req.query;

//     let baseMatchQuery = {};
//     if (moNo) baseMatchQuery.selectedMono = moNo;
//     if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
//     if (custStyle) baseMatchQuery.custStyle = custStyle;
//     if (buyer) baseMatchQuery.buyer = buyer;
//     if (color) baseMatchQuery.color = color;
//     if (size) baseMatchQuery.size = size;
//     if (qcId) baseMatchQuery.emp_id_packing = qcId;

//     // Always filter by task_no_packing = 62 for primary metrics
//     baseMatchQuery.task_no_packing = 62;

//     let currentPeriodMatchQuery = { ...baseMatchQuery };
//     const currentDateMatchAnd = [];
//     if (startDate) {
//       currentDateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       currentDateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (currentDateMatchAnd.length > 0) {
//       currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
//     } else if (
//       Object.keys(currentPeriodMatchQuery).length === 1 &&
//       currentPeriodMatchQuery.task_no_packing &&
//       !startDate &&
//       !endDate
//     ) {
//       // Only task_no filter is active
//       const todayRange = getDayRange(new Date());
//       currentPeriodMatchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$packing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$packing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
//     const prevDate = new Date(referenceDateForPrev);
//     prevDate.setDate(prevDate.getDate() - 1);
//     const prevDayDateRange = getDayRange(prevDate);

//     let previousDayMatchQuery = { ...baseMatchQuery }; // Includes task_no_packing = 62
//     previousDayMatchQuery.$expr = {
//       $and: [
//         {
//           $gte: [
//             {
//               $dateFromString: {
//                 dateString: "$packing_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(0),
//                 onNull: new Date(0)
//               }
//             },
//             prevDayDateRange.start
//           ]
//         },
//         {
//           $lte: [
//             {
//               $dateFromString: {
//                 dateString: "$packing_updated_date",
//                 format: "%m/%d/%Y",
//                 onError: new Date(Date.now() + 86400000 * 365 * 10),
//                 onNull: new Date(Date.now() + 86400000 * 365 * 10)
//               }
//             },
//             prevDayDateRange.end
//           ]
//         }
//       ]
//     };

//     const summaryAggregation = [
//       {
//         $group: {
//           _id: null,
//           totalPackingQty: { $sum: { $ifNull: ["$passQtyPack", 0] } }, // Sum of passQtyPack for task_no_packing = 62
//           totalOrderCardBundles: {
//             $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
//           },
//           totalDefectCards: {
//             $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
//           },
//           totalDefectCardQty: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$packing_record_id", 0] },
//                 { $ifNull: ["$passQtyPack", 0] },
//                 0
//               ]
//             }
//           }
//         }
//       }
//     ];

//     const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
//       Packing.aggregate([
//         { $match: currentPeriodMatchQuery },
//         ...summaryAggregation
//       ]).exec(),
//       Packing.aggregate([
//         { $match: previousDayMatchQuery },
//         ...summaryAggregation
//       ]).exec()
//     ]);

//     const overallSummary = currentSummaryResult[0] || {
//       totalPackingQty: 0,
//       totalOrderCardBundles: 0,
//       totalDefectCards: 0,
//       totalDefectCardQty: 0
//     };
//     const previousDaySummary = previousDaySummaryResult[0] || {
//       totalPackingQty: 0,
//       totalOrderCardBundles: 0,
//       totalDefectCards: 0,
//       totalDefectCardQty: 0
//     };

//     const inspectorSummaryPipeline = [
//       { $match: currentPeriodMatchQuery }, // This already has task_no_packing = 62
//       {
//         $project: {
//           emp_id_packing: 1,
//           eng_name_packing: 1,
//           packing_updated_date: 1,
//           passQtyPack: { $ifNull: ["$passQtyPack", 0] },
//           packing_record_id: 1,
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: null,
//               onNull: null
//             }
//           }
//         }
//       },
//       { $match: { parsedDate: { $ne: null } } },
//       {
//         $group: {
//           _id: {
//             emp_id: "$emp_id_packing",
//             date: "$packing_updated_date",
//             parsedDate: "$parsedDate"
//           },
//           eng_name: { $first: "$eng_name_packing" },
//           dailyTotalPackingQty: { $sum: "$passQtyPack" },
//           dailyOrderCardBundles: {
//             $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
//           },
//           dailyDefectCards: {
//             $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
//           },
//           dailyDefectCardQty: {
//             $sum: {
//               $cond: [{ $eq: ["$packing_record_id", 0] }, "$passQtyPack", 0]
//             }
//           }
//         }
//       },
//       { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
//       {
//         $project: {
//           _id: 0,
//           emp_id: "$_id.emp_id",
//           eng_name: "$eng_name",
//           date: "$_id.date",
//           dailyTotalPackingQty: 1,
//           dailyOrderCardBundles: 1,
//           dailyDefectCards: 1,
//           dailyDefectCardQty: 1
//         }
//       }
//     ];
//     const inspectorSummaryData = await Packing.aggregate(
//       inspectorSummaryPipeline
//     ).exec();

//     const skipRecords = (parseInt(page) - 1) * parseInt(limit);
//     const detailedRecordsPipeline = [
//       { $match: currentPeriodMatchQuery }, // This already has task_no_packing = 62
//       {
//         $addFields: {
//           parsedDate: {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           cardType: {
//             $cond: [
//               { $eq: ["$packing_record_id", 0] },
//               "Defect Card",
//               "Order Card"
//             ]
//           }
//         }
//       },
//       { $sort: { parsedDate: -1, packing_update_time: -1 } },
//       { $skip: skipRecords },
//       { $limit: parseInt(limit) },
//       {
//         $project: {
//           packing_updated_date: 1,
//           emp_id_packing: 1,
//           eng_name_packing: 1,
//           dept_name_packing: 1,
//           selectedMono: 1,
//           package_no: 1,
//           cardType: 1,
//           custStyle: 1,
//           buyer: 1,
//           color: 1,
//           size: 1,
//           packing_update_time: 1,
//           passQtyPack: 1, // This is the qty for the specific card
//           packing_record_id: 1 // For client-side logic if needed, though cardType is better
//         }
//       }
//     ];
//     const detailedRecords = await Packing.aggregate(
//       detailedRecordsPipeline
//     ).exec();
//     const totalRecords = await Packing.countDocuments(
//       currentPeriodMatchQuery
//     ).exec();

//     res.json({
//       overallSummary,
//       previousDaySummary,
//       inspectorSummaryData,
//       detailedRecords,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalRecords / parseInt(limit)),
//         totalRecords,
//         limit: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching Packing dashboard data:", error);
//     res.status(500).json({ error: "Failed to fetch Packing dashboard data" });
//   }
// });

// app.get("/api/packing/hourly-summary", async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       moNo,
//       packageNo,
//       custStyle,
//       buyer,
//       color,
//       size,
//       qcId
//     } = req.query;

//     let matchQuery = {};
//     matchQuery.task_no_packing = 62; // Crucial for packing

//     const dateMatchAnd = [];
//     if (startDate) {
//       dateMatchAnd.push({
//         $gte: [
//           {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(0),
//               onNull: new Date(0)
//             }
//           },
//           new Date(startDate)
//         ]
//       });
//     }
//     if (endDate) {
//       const endOfDay = new Date(endDate);
//       endOfDay.setHours(23, 59, 59, 999);
//       dateMatchAnd.push({
//         $lte: [
//           {
//             $dateFromString: {
//               dateString: "$packing_updated_date",
//               format: "%m/%d/%Y",
//               onError: new Date(Date.now() + 86400000 * 365 * 10),
//               onNull: new Date(Date.now() + 86400000 * 365 * 10)
//             }
//           },
//           endOfDay
//         ]
//       });
//     }
//     if (dateMatchAnd.length > 0) {
//       matchQuery.$expr = { $and: dateMatchAnd };
//     } else {
//       const todayRange = getDayRange(new Date());
//       matchQuery.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$packing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(0),
//                   onNull: new Date(0)
//                 }
//               },
//               todayRange.start
//             ]
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$packing_updated_date",
//                   format: "%m/%d/%Y",
//                   onError: new Date(Date.now() + 86400000 * 365 * 10),
//                   onNull: new Date(Date.now() + 86400000 * 365 * 10)
//                 }
//               },
//               todayRange.end
//             ]
//           }
//         ]
//       };
//     }

//     if (moNo) matchQuery.selectedMono = moNo;
//     if (packageNo) matchQuery.package_no = parseInt(packageNo);
//     if (custStyle) matchQuery.custStyle = custStyle;
//     if (buyer) matchQuery.buyer = buyer;
//     if (color) matchQuery.color = color;
//     if (size) matchQuery.size = size;
//     if (qcId) matchQuery.emp_id_packing = qcId;

//     const hourlyData = await Packing.aggregate([
//       { $match: matchQuery },
//       {
//         $project: {
//           hour: { $substr: ["$packing_update_time", 0, 2] },
//           passQtyPack: { $ifNull: ["$passQtyPack", 0] },
//           packing_record_id: 1
//         }
//       },
//       {
//         $group: {
//           _id: "$hour",
//           totalPackingQty: { $sum: "$passQtyPack" },
//           totalOrderCardBundles: {
//             $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
//           },
//           totalDefectCards: {
//             $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
//           },
//           totalDefectCardQty: {
//             $sum: {
//               $cond: [{ $eq: ["$packing_record_id", 0] }, "$passQtyPack", 0]
//             }
//           }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]).exec();

//     const chartData = hourlyData.map((item, index, arr) => {
//       const prevItem = index > 0 ? arr[index - 1] : null;

//       const calculateChange = (current, previous) => {
//         if (previous > 0) return ((current - previous) / previous) * 100;
//         if (current > 0 && previous === 0) return 100;
//         return 0;
//       };

//       return {
//         hour: item._id,
//         totalPackingQty: item.totalPackingQty,
//         totalOrderCardBundles: item.totalOrderCardBundles,
//         totalDefectCards: item.totalDefectCards,
//         totalDefectCardQty: item.totalDefectCardQty,
//         packingQtyChange: calculateChange(
//           item.totalPackingQty,
//           prevItem?.totalPackingQty || 0
//         ).toFixed(1),
//         orderCardBundlesChange: calculateChange(
//           item.totalOrderCardBundles,
//           prevItem?.totalOrderCardBundles || 0
//         ).toFixed(1),
//         defectCardsChange: calculateChange(
//           item.totalDefectCards,
//           prevItem?.totalDefectCards || 0
//         ).toFixed(1),
//         defectCardQtyChange: calculateChange(
//           item.totalDefectCardQty,
//           prevItem?.totalDefectCardQty || 0
//         ).toFixed(1)
//       };
//     });
//     res.json(chartData);
//   } catch (error) {
//     console.error("Error fetching hourly Packing summary:", error);
//     res.status(500).json({ error: "Failed to fetch hourly Packing summary" });
//   }
// });

/* ------------------------------
   IE - Worker Assignment Endpoints (Corrected for Cross-Database)
------------------------------ */

// // GET - Fetch distinct values for all filters (ONLY from active workers in ym_eco_board)
// app.get("/api/ie/worker-assignment/filter-options", async (req, res) => {
//   try {
//     const workingStatusFilter = { working_status: "Working" };
//     const [empIds, empCodes, departments, sections, jobTitles, taskNos] =
//       await Promise.all([
//         UserMain.distinct("emp_id", workingStatusFilter),
//         UserMain.distinct("emp_code", workingStatusFilter),
//         UserMain.distinct("dept_name", workingStatusFilter),
//         UserMain.distinct("sect_name", workingStatusFilter),
//         UserMain.distinct("job_title", workingStatusFilter),
//         QC2Task.distinct("taskNo")
//       ]);
//     res.json({
//       empIds: empIds.filter(Boolean).sort(),
//       empCodes: empCodes.filter(Boolean).sort(),
//       departments: departments.filter(Boolean).sort(),
//       sections: sections.filter(Boolean).sort(),
//       jobTitles: jobTitles.filter(Boolean).sort(),
//       taskNos: taskNos.filter(Boolean).sort((a, b) => a - b)
//     });
//   } catch (error) {
//     console.error("Error fetching worker assignment filter options:", error);
//     res.status(500).json({ message: "Server error fetching filter options." });
//   }
// });

// // POST - Fetch paginated and filtered worker data (from users collection ONLY)
// app.post("/api/ie/worker-assignment/workers", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 12,
//       emp_id,
//       emp_code,
//       dept_name,
//       sect_name,
//       job_title
//     } = req.body;
//     let filter = { working_status: "Working" };
//     if (emp_id) filter.emp_id = emp_id;
//     if (emp_code) filter.emp_code = emp_code;
//     if (dept_name) filter.dept_name = dept_name;
//     if (sect_name) filter.sect_name = sect_name;
//     if (job_title) filter.job_title = job_title;

//     const skip = (page - 1) * limit;
//     const totalUsers = await UserMain.countDocuments(filter);
//     const workers = await UserMain.find(filter)
//       .select(
//         "emp_id emp_code eng_name kh_name job_title dept_name sect_name face_photo"
//       )
//       .sort({ emp_id: 1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     res.json({
//       workers,
//       totalPages: Math.ceil(totalUsers / limit),
//       currentPage: Number(page),
//       totalUsers
//     });
//   } catch (error) {
//     console.error("Error fetching workers:", error);
//     res.status(500).json({ message: "Server error fetching workers." });
//   }
// });

// // *** NEW ENDPOINT ***
// // GET - Fetch ALL assigned tasks from the ie_worker_tasks collection
// app.get("/api/ie/worker-assignment/all-tasks", async (req, res) => {
//   try {
//     const allAssignedTasks = await IEWorkerTask.find({}).lean();
//     res.json(allAssignedTasks);
//   } catch (error) {
//     console.error("Error fetching all worker tasks:", error);
//     res
//       .status(500)
//       .json({ message: "Server error fetching all assigned tasks." });
//   }
// });

// // PUT - Update a worker's assigned tasks (This endpoint is correct and remains unchanged)
// app.put("/api/ie/worker-assignment/tasks/:emp_id", async (req, res) => {
//   try {
//     const { emp_id } = req.params;
//     const { tasks, emp_code } = req.body;
//     if (!Array.isArray(tasks)) {
//       return res
//         .status(400)
//         .json({ message: "Tasks must be an array of numbers." });
//     }
//     const updatedWorkerTask = await IEWorkerTask.findOneAndUpdate(
//       { emp_id },
//       { $set: { tasks, emp_code } },
//       { new: true, upsert: true, runValidators: true }
//     );
//     res.json({
//       message: "Worker tasks updated successfully",
//       data: updatedWorkerTask
//     });
//   } catch (error) {
//     console.error("Error updating worker tasks:", error);
//     res.status(500).json({ message: "Server error updating tasks." });
//   }
// });

/* ------------------------------
   IE - BULK Worker Assignment Endpoints
------------------------------ */

// // POST - Assign tasks to all workers with a specific job title
// app.post("/api/ie/bulk-assignment/by-job-title", async (req, res) => {
//   const { job_title, tasks } = req.body;

//   if (!job_title || !Array.isArray(tasks)) {
//     return res
//       .status(400)
//       .json({ message: "Job title and a tasks array are required." });
//   }

//   try {
//     const workersToUpdate = await UserMain.find(
//       { job_title: job_title, working_status: "Working" },
//       "emp_id emp_code"
//     ).lean();

//     if (workersToUpdate.length === 0) {
//       return res.status(404).json({
//         message: `No active workers found with job title: ${job_title}`
//       });
//     }

//     const bulkOps = workersToUpdate.map((worker) => ({
//       updateOne: {
//         filter: { emp_id: worker.emp_id },
//         update: {
//           $set: {
//             emp_code: worker.emp_code,
//             tasks: tasks
//           }
//         },
//         upsert: true
//       }
//     }));

//     const result = await IEWorkerTask.bulkWrite(bulkOps);

//     res.json({
//       message: "Bulk assignment completed successfully.",
//       ...result
//     });
//   } catch (error) {
//     console.error("Error during bulk worker assignment:", error);
//     res.status(500).json({ message: "Server error during bulk assignment." });
//   }
// });

// // **** COMPLETELY REBUILT AND CORRECTED GET ENDPOINT ****
// // GET - Fetch data for the bulk assignment summary table
// app.get("/api/ie/bulk-assignment/summary", async (req, res) => {
//   try {
//     // The collection name for the UserMain model. Mongoose defaults to pluralizing the model name.
//     // If your UserMain model's collection is named differently, change "users" below.
//     const usersCollectionName = "users";

//     const summary = await IEWorkerTask.aggregate([
//       // Stage 1: Start from the tasks collection, which ONLY has assigned workers.
//       // This is the key to the fix.

//       // Stage 2: Lookup details for each worker from the main users collection.
//       {
//         $lookup: {
//           from: usersCollectionName, // The actual collection name for UserMain
//           localField: "emp_id",
//           foreignField: "emp_id",
//           as: "workerDetails"
//         }
//       },

//       // Stage 3: De-construct the workerDetails array. If a worker in tasks doesn't exist
//       // in the users collection anymore, this will correctly discard them.
//       {
//         $unwind: "$workerDetails"
//       },

//       // Stage 4: Only include workers who are currently "Working".
//       {
//         $match: {
//           "workerDetails.working_status": "Working"
//         }
//       },

//       // Stage 5: Group the results by the job title found in the worker's details.
//       {
//         $group: {
//           _id: "$workerDetails.job_title",
//           workers: {
//             $push: {
//               emp_id: "$emp_id",
//               face_photo: "$workerDetails.face_photo",
//               eng_name: "$workerDetails.eng_name",
//               tasks: "$tasks" // Get tasks from the original ie_worker_tasks document
//             }
//           }
//         }
//       },

//       // Stage 6: Format the output for the frontend.
//       {
//         $project: {
//           _id: 0,
//           jobTitle: "$_id",
//           workers: 1
//         }
//       },

//       { $sort: { jobTitle: 1 } }
//     ]);

//     res.json(summary);
//   } catch (error) {
//     console.error("Error fetching bulk assignment summary:", error);
//     res.status(500).json({ message: "Server error fetching summary." });
//   }
// });

/* -------------------------------------------
   IE - QC2 Role Management Endpoints (NEW & CORRECTED)
------------------------------------------- */

// // Helper function to map page identifiers to keywords in processName
// const getProcessKeywordForPage = (pageIdentifier) => {
//   const keywordMap = {
//     "bundle-registration": "bundle",
//     washing: "washing",
//     opa: "opa",
//     ironing: "ironing",
//     packing: "packing", // The keyword remains the same
//     "qc2-inspection": "qc2"
//   };
//   return keywordMap[pageIdentifier.toLowerCase()];
// };

// // GET - Check if a specific user has access to a page based on their assigned tasks.
// app.get("/api/ie/role-management/access-check", async (req, res) => {
//   try {
//     const { emp_id, page } = req.query;

//     if (!emp_id || !page) {
//       return res
//         .status(400)
//         .json({ message: "Employee ID and page identifier are required." });
//     }

//     // Step 1: Check for Super Admin / Admin roles in the 'role_management' collection.
//     // We use findOne with an $or condition to see if the user exists in either role.
//     const adminCheck = await RoleManagment.findOne({
//       $or: [
//         { role: "Super Admin", "users.emp_id": emp_id },
//         { role: "Admin", "users.emp_id": emp_id }
//       ]
//     });

//     // If adminCheck finds a document, it means the user is an Admin or Super Admin.
//     if (adminCheck) {
//       return res.json({ hasAccess: true });
//     }

//     // If not an admin, proceed with the task-based check as before.
//     const keyword = getProcessKeywordForPage(page);
//     if (!keyword) {
//       return res.json({ hasAccess: false }); // Not an admin and page is not IE-controlled
//     }

//     // const keyword = getProcessKeywordForPage(page);
//     // if (!keyword) {
//     //   return res.status(400).json({ message: "Invalid page identifier." });
//     // }

//     // *** THE FIX IS HERE ***
//     // Conditionally build the regex based on the keyword.
//     let processNameFilter;
//     if (keyword.toLowerCase() === "packing") {
//       // For 'packing', use word boundaries (\b) to match it as a whole word.
//       processNameFilter = { $regex: `\\b${keyword}\\b`, $options: "i" };
//     } else {
//       // For all other keywords, use the original substring match.
//       processNameFilter = { $regex: keyword, $options: "i" };
//     }

//     // Step 1: Find all unique task numbers using the correct filter.
//     const requiredTasksResult = await QC2Task.aggregate([
//       { $match: { processName: processNameFilter } },
//       { $group: { _id: null, taskNos: { $addToSet: "$taskNo" } } }
//     ]);

//     const requiredTaskNos =
//       requiredTasksResult.length > 0 ? requiredTasksResult[0].taskNos : [];
//     if (requiredTaskNos.length === 0) {
//       return res.json({ hasAccess: false });
//     }

//     const workerTask = await IEWorkerTask.findOne({ emp_id }).lean();
//     const userTasks = workerTask ? workerTask.tasks : [];
//     if (userTasks.length === 0) {
//       return res.json({ hasAccess: false });
//     }

//     const hasOverlap = userTasks.some((task) => requiredTaskNos.includes(task));
//     res.json({ hasAccess: hasOverlap });
//   } catch (error) {
//     console.error("Error during IE access check:", error);
//     res.status(500).json({ message: "Server error during access check." });
//   }
// });

// // GET - Get a summary of which users have access to each managed page.
// app.get("/api/ie/role-management/summary", async (req, res) => {
//   try {
//     const pages = [
//       { id: "bundle-registration", name: "Bundle Registration" },
//       { id: "washing", name: "Washing" },
//       { id: "opa", name: "OPA" },
//       { id: "ironing", name: "Ironing" },
//       { id: "packing", name: "Packing" },
//       { id: "qc2-inspection", name: "QC2 Inspection" }
//     ];

//     const fullSummary = [];

//     for (const page of pages) {
//       const keyword = getProcessKeywordForPage(page.id);

//       // *** THE FIX IS HERE ***
//       // Apply the same conditional regex logic in the summary endpoint.
//       let processNameFilter;
//       if (keyword.toLowerCase() === "packing") {
//         processNameFilter = { $regex: `\\b${keyword}\\b`, $options: "i" };
//       } else {
//         processNameFilter = { $regex: keyword, $options: "i" };
//       }

//       // Get required task numbers for the page using the correct filter.
//       const requiredTasksResult = await QC2Task.aggregate([
//         { $match: { processName: processNameFilter } },
//         { $group: { _id: null, taskNos: { $addToSet: "$taskNo" } } }
//       ]);
//       const requiredTaskNos =
//         requiredTasksResult.length > 0 ? requiredTasksResult[0].taskNos : [];

//       let usersWithAccess = [];
//       if (requiredTaskNos.length > 0) {
//         usersWithAccess = await IEWorkerTask.aggregate([
//           { $match: { tasks: { $in: requiredTaskNos } } },
//           {
//             $lookup: {
//               from: "users",
//               localField: "emp_id",
//               foreignField: "emp_id",
//               as: "details"
//             }
//           },
//           { $unwind: "$details" },
//           { $match: { "details.working_status": "Working" } },
//           {
//             $project: {
//               _id: 0,
//               emp_id: "$emp_id",
//               eng_name: "$details.eng_name",
//               face_photo: "$details.face_photo",
//               job_title: "$details.job_title",
//               tasks: "$tasks"
//             }
//           },
//           { $sort: { emp_id: 1 } }
//         ]);
//       }

//       fullSummary.push({
//         pageName: page.name,
//         requiredTasks: requiredTaskNos.sort((a, b) => a - b),
//         users: usersWithAccess
//       });
//     }

//     res.json(fullSummary);
//   } catch (error) {
//     console.error("Error fetching IE role summary:", error);
//     res.status(500).json({ message: "Server error fetching IE role summary." });
//   }
// });

/* -------------------------------------------
   IE - Task No Finder Endpoints (NEW)
------------------------------------------- */

// // GET - Fetch all unique task numbers for a given department
// app.get("/api/ie/tasks-by-department", async (req, res) => {
//   try {
//     const { department } = req.query;
//     if (!department) {
//       return res.status(400).json({ message: "Department query is required." });
//     }

//     const taskNos = await QC2Task.distinct("taskNo", { department });

//     res.json(taskNos.sort((a, b) => a - b));
//   } catch (error) {
//     console.error("Error fetching tasks by department:", error);
//     res.status(500).json({ message: "Server error fetching tasks." });
//   }
// });

// // GET - Fetch a user's task access rights (Admin status or assigned tasks)
// app.get("/api/ie/user-task-access/:emp_id", async (req, res) => {
//   try {
//     const { emp_id } = req.params;
//     if (!emp_id) {
//       return res.status(400).json({ message: "Employee ID is required." });
//     }

//     // Check for Super Admin or Admin role first
//     const adminCheck = await RoleManagment.findOne({
//       $or: [
//         { role: "Super Admin", "users.emp_id": emp_id },
//         { role: "Admin", "users.emp_id": emp_id }
//       ]
//     });

//     if (adminCheck) {
//       // User is an admin, has access to all tasks
//       return res.json({ isAdmin: true, assignedTasks: [] });
//     }

//     // If not an admin, find their specific tasks
//     const workerTask = await IEWorkerTask.findOne({ emp_id }).lean();

//     res.json({
//       isAdmin: false,
//       assignedTasks: workerTask ? workerTask.tasks : []
//     });
//   } catch (error) {
//     console.error("Error fetching user task access:", error);
//     res.status(500).json({ message: "Server error fetching user access." });
//   }
// });

/* ------------------------------
   AI Chatbot Proxy Route
------------------------------ */

// app.post("/api/ai/ask", async (req, res) => {
//   // Destructure both question and selectedModel from the request body
//   const { question, selectedModel } = req.body;

//   if (!question) {
//     return res.status(400).json({ error: "Question is required." });
//   }

//   try {
//     // Forward the request to the Python Flask AI service
//     // This URL must match where your Python service is running.
//     const aiServiceResponse = await axios.post("http://localhost:5002/ask", {
//       // Pass both pieces of data to the Python service
//       question: question,
//       selectedModel: selectedModel
//     });

//     // Send the response from the AI service back to the React client
//     res.json(aiServiceResponse.data);
//   } catch (error) {
//     console.error("Error proxying request to AI service:", error.message);

//     // Provide a user-friendly error message
//     res.status(502).json({
//       answer:
//         "Sorry, I'm having trouble connecting to my brain right now. Please try again later."
//     });
//   }
// });

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});
