import { app, server, PORT} from "./Config/appConfig.js";

/* -----------------------------
  Notifications
------------------------------ */
import normalNotification from "./routes/Notification/normalNotificationRoutes.js";
/* -----------------------------
Real Wash Qty Imports
------------------------------ */
import qcRealWashQty from "./routes/QC_Real_Wash_Qty/QcRealWashQtyRoute.js";
/* -----------------------------
Common File Imports
------------------------------ */
/*-------------AQL Imports --------------*/
import aql from "./routes/Common/AQLRoutes.js";
/*-------------Buyer Spec Imports --------------*/
import buyerSpec from "./routes/Common/DTOrdersBuyerSpecRoutes.js";
import buyerSpecPacking from "./routes/Common/DTOrdersBuyerSpecPackingRoutes.js";
/*-------------DT-Orders Imports --------------*/
import dtOrders from "./routes/Common/DTOrdersRoutes.js";
/* -----------------------------
Audit Imports
------------------------------ */
import auditAdmin from "./routes/Audit/AuditAdminRoutes.js";
import auditUploadImage from "./routes/Audit/AuditUploadImageRoutes.js";
/* -----------------------------
User Imports
------------------------------ */
import auth from "./routes/User/authRoutes.js";
import roleManagement from "./routes/User/roleManagementRoutes.js";
import user from "./routes/User/userRoutes.js";
/* -----------------------------
Digital Measurement Imports
------------------------------ */
import digitalMeasurement from "./routes/DigitalMeasurement/DigitalMeasurmentRoutes.js";
/* -----------------------------
Measurement Imports
------------------------------ */
import measurement from "./routes/Measurement/measurementRoutes.js";

/* -----------------------------
Download Data Imports
------------------------------ */
import downloadData from "./routes/DownloadData/downloadDataRoutes.js";

/* -----------------------------
QC1 Inspection Imports
------------------------------ */
import qc1Inspection from "./routes/QC1Inspection/qc1InspectionRoutes.js";
import QC1SunriseReportRoutes from "./routes/QC1Inspection/QCReportServer.js";
import QC1SummaryDashboardRoutes from "./routes/QC1Inspection/QC1SummaryDashboard.js";
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
import QCInlineWorker from "./routes/InlineRoving/Roving/RovingInspectionRoutes.js"
import rovingDefectBuyerstatus from "./routes/InlineRoving/Roving/RovingAdminDefectBuyserStatusRoutes.js";
import rovingReports from "./routes/InlineRoving/Roving/RovingReportRoutes.js";

/*-------------Paring Imports --------------*/
import pairingReport from "./routes/InlineRoving/Pairing/PairingReportsRoutes.js";
import pairingDefects from "./routes/InlineRoving/Pairing/ParingDefectRoutes.js";
import rovingPairingInspection from "./routes/InlineRoving/Pairing/RovingPairingInspectionRoutes.js";
import pairingAccessoryIssue from "./routes/InlineRoving/Pairing/PairingAccessoryIssueRoutes.js";


/* -----------------------------
ANF Imports
------------------------------ */
import ANF from "./routes/ANF/ANFReportRoutes.js";
import ANFInspection from "./routes/ANF/ANFInspectionRoutes.js";
import ANFResult from "./routes/ANF/ANFResultRoutes.js";
import ANFInspectionPacking from "./routes/ANF/ANFInspectionPackingRoutes.js";
import ANFReportPacking from "./routes/ANF/ANFReportPackingRoutes.js";
import ANFResultPacking from "./routes/ANF/ANFResultPackingRoutes.js";


/* -----------------------------
QC2 Upload Data Imports
------------------------------ */
import qc2UploadData from "./routes/QC2_upload_Data/qc2UploadRoutes.js";
/* -----------------------------
Supplier Issue Imports
------------------------------ */
import supplierIssuesAdmin from "./routes/SupplierIssue/supplierIssuesAdminRoutes.js";
import supplierIssueReport from "./routes/SupplierIssue/supplierIssueReportRoutes.js";
import supplierIssueInspection from "./routes/SupplierIssue/supplierIssueInspectionRoutes.js";
/* -----------------------------
Packing List Imports
------------------------------ */
import PackingList from "./routes/PackingList/packingListRoutes.js";
/* -----------------------------
Yorksys Orders Imports
------------------------------ */
import YourksysOrders from "./routes/YorksysOrders/uploadOrderRoutes.js";
/* -----------------------------
SCC Imports
------------------------------ */
import SCC from "./routes/SCC/SCC_Inspection/sccDailyTestingRoutes.js";
import sccDefects from "./routes/SCC/SCC_Admin/sccDefectRoutes.js";
import sccImageUpload from "./routes/SCC/SCC_Inspection/sccImageUploadRoutes.js";
import sccOperators from "./routes/SCC/SCC_Admin/sccOperatorsRoutes.js";
import sccScratchedDefect from "./routes/SCC/SCC_Admin/sccScratchedDefectRoutes.js";
import EMB from "./routes/SCC/SCC_Admin/embDefectsRoutes.js";
import FUQC from "./routes/SCC/SCC_Inspection/fuqcRoutes.js";
import DailyHT from "./routes/SCC/SCC_Inspection/dailyHTRoutes.js";
import HTFU from "./routes/SCC/SCC_Inspection/htfuRoutes.js";
import Elastic from "./routes/SCC/SCC_Inspection/elasticRoutes.js";
import EMBReport from "./routes/SCC/SCC_Inspection/embReportRoutes.js";
import SCCFinalReport from "./routes/SCC/SCC_Final_Consolidate_Report/finalReport.js";
import HTInspection from "./routes/SCC/SCC_Inspection/htInspectionRoutes.js";
import SCCInspection from "./routes/SCC/SCC_Inspection/sccFirstOutPutHTFURoutes.js";
/* -----------------------------
Sub Con QC Imports
------------------------------ */
import subConQAInspection from "./routes/Sub-ConQC1/Sub-ConQA/subConQAInspectionRoutes.js";
import SubConQAReport from "./routes/Sub-ConQC1/Sub-ConQA/subConQAReportRoutes.js";
import SubConDefectManagement from "./routes/Sub-ConQC1/Sub-ConQC1 Admin/subConSewingQCDefectsRoutes.js";
import subConSewingQCFactory from "./routes/Sub-ConQC1/Sub-ConQC1 Admin/subConSewingQCFactoryRoutes.js";
import subConSewingQCInspection from "./routes/Sub-ConQC1/Sub-ConQC1 Inspection/subConsewingQCInspectionRoutes.js";
import subConQADashboard from "./routes/Sub-ConQC1/SubConQCDashboard/subConQCDashboardRoutes.js";
import subConSewingQCReport from "./routes/Sub-ConQC1/Sub-ConQC1 Inspection/subConsewingQCReportRoutes.js";
/* -----------------------------
Cutting Imports
------------------------------ */
import cuttingImageProxy from "./routes/Cutting/CuttingReport/cuttingImageProxyRoutes.js";
import cuttingDashboard from "./routes/Cutting/CuttingDashboard/cuttingDashboardRoutes.js";
import cutPanelOrder from "./routes/Cutting/Cutting_Orders/cutPanelOrderRoutes.js";
import cuttingFabricDefect from "./routes/Cutting/Cutting_Admin_FabricDefects/cuttingFabricDefectRoutes.js";
import cuttingImageUpload from "./routes/Cutting/CuttingInspection/cuttingImageUploadRoutes.js";
import cuttinginspection from "./routes/Cutting/CuttingInspection/cuttingInspectionRoutes.js";
import cuttingissue from "./routes/Cutting/CuttingInspection/cuttingIssueRoutes.js";
import cuttingMeasurementPoints from "./routes/Cutting/Cutting_Admin_MeasurementPoint/cuttingMeasurementPointsRoutes.js";
import cuttingMeasurementPointEdit from "./routes/Cutting/Cutting_Admin_MeasurementPoint/cuttingMeasurementPointEditRoutes.js";
import cuttingInspectionReportManagemenrtt from "./routes/Cutting/Cutting_Admin_Inspection_Report/cuttingInspectionReportManageRoutes.js";
import cuttingTrend from "./routes/Cutting/Cutting_Trend/cuttingTrendRoutes.js";
import cuttingReport from "./routes/Cutting/CuttingReport/reportRoutes.js";
/* -----------------------------
QCWashing Imports
------------------------------ */
// import qcWashing from "./routes/QCWashing/qcWashingRoutes.js";
import qcWashingInspection from "./routes/QCWashing/QCWashing Inspection/qcWashingInspectionRoutes.js";
import qcWashingAdmin from "./routes/QCWashing/QCWashing Admin/qcWashingAdminRoutes.js";
import qcWashingReport from "./routes/QCWashing/QCWashing Report/qcWashingReportRoutes.js";
import qcWashingOldQty from "./routes/QCWashing/oldQtyRoutes.js";

/* -----------------------------
QA Random Inspection Imports
------------------------------ */
import qaDefect from "./routes/QARandomInspection/QAAdmin/QADefectRoutes.js";
import qaDefectBuyerStatus from "./routes/QARandomInspection/QAAdmin/QADefectBuyerStatusRoutes.js";
import qaStandardDefect from "./routes/QARandomInspection/QAAdmin/QAStandardDefectRoutes.js";
import qaRandomInspectionSave from "./routes/QARandomInspection/QARandomInspectionData/QARandomInspectionSaveRoutes.js";
import qaRandomInspection from "./routes/QARandomInspection/QARandomInspectionData/QARandomInspectionRoutes.js";
import qaAccuracyDashboard from "./routes/QARandomInspection/QAaccuracyDashboard/QAAccuracyDashboardRoutes.js";

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
import bundleRegistrationInspection from "./routes/QC2System/BundleRegistration/BundelRestrationInspectionRoutes.js";
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
import translator from "./routes/AI/Translator/translatorRoutes.js";

/* ------------------------------
  PivotY - QA Sections
------------------------------ */

import QASections_ProductType from "./routes/PivotY/QASections/QASections_ProductType_Route.js";
import QASections_Home from "./routes/PivotY/QASections/QASections_Home_Route.js";
import QASections_Photos from "./routes/PivotY/QASections/QASections_Photos_Route.js";
import QASections_Packing from "./routes/PivotY/QASections/QASections_Packing_Route.js";
import QASections_Buyer from "./routes/PivotY/QASections/QASections_Buyer_Route.js";
import QASections_DefectList from "./routes/PivotY/QASections/QASections_DefectList_Route.js";
import QASections_DefectCategory from "./routes/PivotY/QASections/QASections_DefectCategory_Route.js";
import QASections_ProductLocation from "./routes/PivotY/QASections/QASections_ProductLocation_Route.js";
import QASections_AQL_Sample_Letters from "./routes/PivotY/QASections/QASections_AQL_Sample_Letter_Route.js";
import QASections_AQL_Values from "./routes/PivotY/QASections/QASections_AQL_Values_Route.js";
import QASections_AQL_Config from "./routes/PivotY/QASections/QASections_AQL_Config_Routes.js";
import QASections_Line from "./routes/PivotY/QASections/QASections_Line_Route.js";
import QASections_Table from "./routes/PivotY/QASections/QASections_Table_Route.js";
import QASections_Shipping_Stage from "./routes/PivotY/QASections/QASections_Shipping_Stage_Route.js";

/* ------------------------------
  PivotY - QA Measurement Specs
------------------------------ */

import QASections_Measurement_Specs from "./routes/PivotY/QASections/QASections_Measurement_Specs_Route.js";

/* ------------------------------
  PivotY - QA Templates
------------------------------ */
import QASections_Templates from "./routes/PivotY/QATemplates/QATemplatesReport_Route.js";

/* ------------------------------
PivotY - Fincheck Inspection
------------------------------ */
import FincheckInspection from "./routes/PivotY/FincheckInspection/FincheckInspection_Route.js";

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
 P88 Data Upoad Routes
------------------------------ */
import p88Upload from './routes/PivotY/P88Data/uploadP88DataRoutes.js';
import p88Summarydata from './routes/PivotY/P88Data/summaryP88DataRoutes.js';


/* -----------------------------
  After Ironing Import
------------------------------ */
import afterIroning from "./routes/AfterIroning/AfterIroningInspection/afterIroningInspectionRoutes.js";

/* ------------------------------
  Humidity Inspection Report
------------------------------ */

import FiberNameRoute from "./routes/YorksysOrders/FIberNameRoute.js";

/* -----------------------------
  QC Output Imports
------------------------------ */
import QCOutputRoute from "./routes/QCOutput/QCOutputRoute.js";

/* -----------------------------
  YDT Imports
------------------------------ */
/* -----------Cover Page-----------------*/
import CoverPage from "./routes/YDT/CoverPage/CoverPageRoutes.js";
/* -----------Sketch Technical-----------------*/
import sketchTechnical from "./routes/YDT/CoverPage/sketchTechnicalRoutes.js";

/* -----------------------------
  CE System
------------------------------ */
import ceMasterRoutes from "./modules/CESystem/Routes/CEMasterRoutes.js";
import ceTargetMasterRoutes from "./modules/CESystem/Routes/CETargetMasterRoutes.js";
/* -----------------------------
   SQL Query Import
------------------------------ */
// import sqlQuery from "./routes/SQL/sqlQueryRoutes.js";
// import { closeSQLPools } from "./controller/SQL/sqlQueryController.js";
/* ------------------------------
  SQL Query routs
------------------------------ */
// app.use(sqlQuery);
/* ------------------------------
  Functional routs
------------------------------ */
/* -----------------------------
  Notifications Routes
------------------------------ */
app.use(normalNotification);
/* -----------------------------
Real Wash QTY Routes
------------------------------ */
app.use(qcRealWashQty);

/* -----------------------------
Commin file  Routes
------------------------------ */
/* -----------AQL -----------------*/
app.use(aql);
/* -----------Buyer Specs -----------------*/
app.use(buyerSpec);
app.use(buyerSpecPacking);
/* ----------- DT_Orders -----------------*/
app.use(dtOrders);
/* -----------------------------
Audit Routes
------------------------------ */
app.use(auditAdmin);
app.use(auditUploadImage);

/* -----------------------------
User Routes
------------------------------ */
app.use(auth);
app.use(roleManagement);
app.use(user);

/* -----------------------------
Digital Measurement Routes
------------------------------ */
app.use(digitalMeasurement);

/* -----------------------------
Measurement Routes
------------------------------ */
app.use(measurement);

/* -----------------------------
Download Data Routes
------------------------------ */
app.use(downloadData);

/* -----------------------------
QC1 Inspection Routes
------------------------------ */
app.use(qc1Inspection);
app.use(QC1SunriseReportRoutes);
app.use(QC1SummaryDashboardRoutes);

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
app.use(pairingReport);
app.use(pairingDefects);
app.use(rovingPairingInspection);
app.use(pairingAccessoryIssue);

/* -----------------------------
Cutting Dashboard Routes
------------------------------ */
app.use(cuttingDashboard);

/* -----------------------------
ANF Routes
------------------------------ */
app.use(ANF);
app.use(ANFInspection); 
app.use(ANFResult);
app.use(ANFInspectionPacking);
app.use(ANFReportPacking);
app.use(ANFResultPacking);

/* -----------------------------
QC2 Upload Data Routes
------------------------------ */
app.use(qc2UploadData);

/* -----------------------------
Supplier Issue Routes
------------------------------ */
app.use(supplierIssuesAdmin);
app.use(supplierIssueInspection);
app.use(supplierIssueReport);

/* -----------------------------
Packing List Routes
------------------------------ */
app.use(PackingList);

/* -----------------------------
SCC Routes
------------------------------ */
app.use(SCC);
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
app.use(SCCInspection);

/* -----------------------------
Yorksys Orders Routes
------------------------------ */
app.use(YourksysOrders);

/* -----------------------------
measurement Routes
------------------------------ */
app.use(measurement);

/* -----------------------------
Sub Con QC Routes
------------------------------ */
app.use(subConSewingQCFactory);
app.use(SubConQAReport);
app.use(SubConDefectManagement);
app.use(subConQAInspection);
app.use(subConSewingQCInspection);
app.use(subConSewingQCReport);
app.use(subConQADashboard);

/* -----------------------------
 Cutting Routes
------------------------------ */
app.use(cuttingImageProxy);
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

/* -----------------------------
  Washing Routes
------------------------------ */
app.use(qcWashingInspection);
app.use(qcWashingAdmin);
app.use(qcWashingReport);
app.use(qcWashingOldQty);

/* -----------------------------
  QA Random Inspection Routes
------------------------------ */
app.use(qaDefect);
app.use(qaDefectBuyerStatus);
app.use(qaStandardDefect);
app.use(qaRandomInspectionSave);
app.use(qaRandomInspection);
app.use(qaAccuracyDashboard);

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

/* ------------------------------
  PivotY - QA Sections routes
------------------------------ */

app.use(QASections_ProductType);
app.use(QASections_Home);
app.use(QASections_Photos);
app.use(QASections_Packing);
app.use(QASections_Buyer);
app.use(QASections_DefectList);
app.use(QASections_DefectCategory);
app.use(QASections_ProductLocation);
app.use(QASections_AQL_Sample_Letters);
app.use(QASections_AQL_Values);
app.use(QASections_AQL_Config);
app.use(QASections_Line);
app.use(QASections_Table);
app.use(QASections_Shipping_Stage);

/* ------------------------------
  PivotY - QA Measurements routes
------------------------------ */
app.use(QASections_Measurement_Specs);

/* ------------------------------
  PivotY - QA Templates routes
------------------------------ */
app.use(QASections_Templates);

/* ------------------------------
PivotY - Fincheck Inspection routes
------------------------------ */
app.use(FincheckInspection);

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
 P88 Data Upoad Routes
------------------------------ */
app.use(p88Upload);
app.use(p88Summarydata);
/* -----------------------------
AI Routes
------------------------------ */
app.use(AIChatBot);
app.use(translator);

/* -----------------------------
After Ironing Routes
------------------------------ */
app.use(afterIroning);

/* -----------------------------
  YDT Imports
------------------------------ */
/* -----------Cover Page-----------------*/
app.use(CoverPage);
/* -----------Sketch Technical-----------------*/
app.use(sketchTechnical);

/* ------------------------------
  CE System Routes
------------------------------ */
app.use(ceMasterRoutes);
app.use(ceTargetMasterRoutes);


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

/* -----------------------------
  QC Output Routes
------------------------------ */
app.use(QCOutputRoute);

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ HTTPS Server is running on https://localhost:${PORT}`);
});
