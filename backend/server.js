//Import th appConfig.js
import { app, server, io, PORT } from "./Config/appConfig.js"; 

//Import the Route Files
import user from "./routes/User/userRoutes.js";
import auth from "./routes/User/authRoutes.js";
import roleManagement from "./routes/User/roleManagementRoutes.js";
import sqlQuery from "./routes/sql/sqlQueryRoutes.js";
import sqlSync from "./routes/sql/sqlSyncRoutes.js";
import cutPanelOrder from "./routes/Cutting/cutPanelOrderRoutes.js";
import cuttingFabricDefect from "./routes/Cutting/cuttingFabricDefectRoutes.js";
import cuttingImageUpload from "./routes/Cutting/cuttingImageUploadRoutes.js";
import cuttingInspection from "./routes/Cutting/cuttingInspectionRoutes.js";
import cuttingIssue from "./routes/Cutting/cuttingIssueRoutes.js";
import cuttingMesurment from "./routes/Cutting/cuttingMeasurementRoutes.js";
import cuttingOrder from "./routes/Cutting/cuttingOrderRoutes.js";
import cuttingTrend from "./routes/Cutting/cuttingTrendRoutes.js";
import scc from "./routes/SCC/sccRoutes.js";
import sccScratchDefect from "./routes/SCC/sccScratchDefectRoutes.js";
import sccOperator from "./routes/SCC/sccOperatorsRoutes.js";
import sccImageUpload from "./routes/SCC/sccImageUploadRoutes.js";
import sccDefects from "./routes/SCC/sccDefectsRoutes.js";
import bundle from "./routes/Bundle/bundleRoutes.js";
import washing from "./routes/Washing/washingRoutes.js";
import opa from "./routes/OPA/opaRoutes.js";
import ironing from "./routes/Ironing/ironingRoutes.js";
import packing from "./routes/Packing/packingRoutes.js";
import qcInlineImageUpload from "./routes/QCInlineRoving/qcInlineImageUploadRoutes.js";
import qcInlineRoving from "./routes/QCInlineRoving/qcInlineRovingRoutes.js";
import qcInlineWorker from "./routes/QCInlineRoving/qcInlineWorkerRoutes.js";
// import qcInlineWorkerAttendance from "./routes/QCInlineRoving/qcInlineWorkerAttendanceRoutes.js";
import qc2Inspection from "./routes/QC2Inspection/qc2InspectionRoutes.js";
import qc2RepairTracking from "./routes/QC2RepairTracking/qc2RepairTrackingRoutes.js";
import downloadData from "./routes/DownloadData/downloadDataRoutes.js";
import qc1Dashboard from "./routes/LiveDashboard/qc1DashboardRoutes.js";
import QC2Dashboard from "./routes/LiveDashboard/qc2DashboardRoutes.js";
import washingDashboard from "./routes/LiveDashboard/washingDashboardRoutes.js";
import ironingDashboard from "./routes/LiveDashboard/ironingDashboardRoutes.js";
import opaDashboard from "./routes/LiveDashboard/opaDashboardRoutes.js";
import packingdashboard from "./routes/LiveDashboard/packingDashboardRoutes.js";
import processDashbiard from "./routes/LiveDashboard/processDashboardRoutes.js";
import qc1Sunrise from "./routes/QC1Sunrise/qc1SunriseRoutes.js"; 
import aql from "./routes/AQL/aqlRoutes.js";
import sewingDefect from "./routes/Defects/sewingDefectRoutes.js";
import measurement from "./routes/DigitalMeasurement/measurementRoutes.js";
import paringDefects from "./routes/ParingDefects/paringDefectRoutes.js";
import accessoryIssues from "./routes/AccessoryIssue/accessoryIssuesRoutes.js";
import auditCheckPoints from "./routes/Audit/auditCheckPointsRoutes.js";
import qcRovingPairing from "./routes/QCInlineRoving/qcRovingPairingRoutes.js";
//Import Mongodb.js
import { disconnectMongoDB } from "../backend/Config/mongodb.js";
//Import sqldb.js
import { closeSQLPools } from "./Config/sqldb.js";
//Import Schedule.js
import { initializeSchedulerAndSyncs } from "./Scheduler/syncSchedule.js";



// Routes
app.use(user); 
app.use(auth); 
app.use(roleManagement); 
app.use(sqlQuery); 
app.use(sqlSync); 
app.use(cutPanelOrder); 
app.use(cuttingFabricDefect);
app.use(cuttingImageUpload);
app.use(cuttingInspection);
app.use(cuttingIssue);
app.use(cuttingMesurment);
app.use(cuttingOrder);
app.use(cuttingTrend);
app.use(scc);
app.use(sccScratchDefect);
app.use(sccOperator);
app.use(sccImageUpload);
app.use(sccDefects);
app.use(bundle);
app.use(washing);
app.use(opa);
app.use(ironing);
app.use(packing);
app.use(qcInlineImageUpload);
app.use(qcInlineRoving);
app.use(qcInlineWorker);
// app.use(qcInlineWorkerAttendance);
app.use(qc2Inspection);
app.use(qc2RepairTracking);
app.use(downloadData);
app.use(qc1Dashboard);
app.use(QC2Dashboard);
app.use(washingDashboard);
app.use(ironingDashboard);
app.use(opaDashboard);
app.use(packingdashboard);
app.use(processDashbiard);
app.use(qc1Sunrise);
app.use(aql);
app.use(sewingDefect);
app.use(measurement);
app.use(paringDefects);
app.use(accessoryIssues);
app.use(auditCheckPoints);
app.use(qcRovingPairing);


// Initialize the scheduler, which also handles initial pool setup and data syncs
initializeSchedulerAndSyncs();

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

// Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on https://0.0.0.0:${PORT}`);
});