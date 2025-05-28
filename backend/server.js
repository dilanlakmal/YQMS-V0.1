//Import th appConfig.js
import { app, server, io, PORT } from "./Config/appConfig.js"; 

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
import downloadDataRoutes from "./routes/DownloadData/downloadDataRoutes.js";
import qc1DashboardRoutes from "./routes/LiveDashboard/qc1DashboardRoutes.js";
import QC2DashboardRoutes from "./routes/LiveDashboard/qc2DashboardRoutes.js";
import processDashbiardRoutes from "./routes/LiveDashboard/processDashboardRoutes.js";
import qc1SunriseRoutes from "./routes/QC1Sunrise/qc1SunriseRoutes.js"; 
import aqlRoutes from "./routes/AQL/aqlRoutes.js";
import sewingDefectRoutes from "./routes/Defects/sewingDefectRoutes.js";
import measurementRoutes from "./routes/DigitalMeasurement/measurementRoutes.js";
//Import Mongodb.js
import { disconnectMongoDB } from "../backend/Config/mongodb.js";
//Import sqldb.js
import { closeSQLPools } from "./Config/sqldb.js";
//Import Schedule.js
import { initializeSchedulerAndSyncs } from "./Scheduler/syncSchedule.js";



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
app.use(measurementRoutes);

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