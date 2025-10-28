import axios from "axios";
import { app, server, PORT} from "./Config/appConfig.js";
import { 
  SewingDefects,
} from "./controller/MongoDB/dbConnectionController.js";
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
import EMB from "./routes/SCC/embRoutes.js";
import FUQC from "./routes/SCC/Daily_FUQC/fuqcRoutes.js";
import DailyHT from "./routes/SCC/Daily_HT_QC/dailyHTRoutes.js";
import HTFU from "./routes/SCC/Daily_HTFU/htfuRoutes.js";
import Elastic from "./routes/SCC/Elastic_Report/elasticRoutes.js";
import EMBReport from "./routes/SCC/EMB_Report/embReportRoutes.js";
import SCCFinalReport from "./routes/SCC/Final_Consolidate_Report/finalReport.js";
import HTInspection from "./routes/SCC/HT_Inspection/htInspectionRoutes.js";
import washing from "./routes/Washing/washingRoutes.js";
import qcWashing from "./routes/QCWashing/qcWashingRoutes.js";
import qcWashingAdmin from "./routes/QCWashing/qcWashingAdminRoutes.js";
import qcWashingOldQty from "./routes/QCWashing/oldQtyRoutes.js";
import subConFactory from "./routes/SubConFactory/factoryRoutes.js";
import subConQC from "./routes/SubConQC/qcRoutes.js";
import subConQC1Report from "./routes/SubConQC/qc1ReportRoutes.js";
import qcFactoryManagment from "./routes/SubConQC/qcFactoryManagementRoutes.js";
import qcDefectManagement from "./routes/SubConQC/qcDefectManagementRoutes.js";
import subConQADefect from "./routes/SubConQA/subConQADefectRoutes.js";
import QAReport from "./routes/SubConQA/qaReportRoutes.js";
import ie from "./routes/IE/ieRoutes.js";
import ieRole from "./routes/IE/ieRolerRoutes.js";
import roving from "./routes/Roving/rovingRoutes.js";
import rovingParing from "./routes/Roving/paringRoutes.js";
import washingSpecs from "./routes/WashingSpecs/specRoutes.js";
import qc2Workers from "./routes/QC2Workers/qc2WorkerRoutes.js";
import qaDefect from "./routes/QAAccuracy/qaDefectRoutes.js";
import qaAccuracy from "./routes/QAAccuracy/accuracyRoutes.js";
import cuttingDashboard from "./routes/Cutting/cuttingDashboardRoutes.js";
import buyerSpec from "./routes/BuyerSpecTemp/buyerSpecRoutes.js";
import ANF from "./routes/ANF/anfRoutes.js";
import supplierIssue from "./routes/SupplierIssue/supplierRoutes.js";
import supplierIssueReport from "./routes/SupplierIssue/supplierIssueReportRoutes.js";
import qc2UploadData from "./routes/QC2_upload_Data/qc2UploadRoutes.js";
import PackingList from "./routes/PackingList/packingListRoutes.js";
import YourksysOrders from "./routes/YorksysOrders/uploadOrderRoutes.js";
import measurementRoutes from "./routes/Measurement/measurementRoutes.js";

/* ------------------------------
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
app.use(washing);
app.use(qcWashing);
app.use(qcWashingAdmin);
app.use(qcWashingOldQty);
app.use(subConFactory);
app.use(subConQC);
app.use(subConQC1Report);
app.use(qcFactoryManagment);
app.use(qcDefectManagement);
app.use(subConQADefect);
app.use(QAReport);
app.use(ie);
app.use(ieRole);
app.use(roving);
app.use(washingSpecs);
app.use(qc2Workers);
app.use(rovingParing);
app.use(qaDefect);
app.use(qaAccuracy);
app.use(cuttingDashboard);
app.use(buyerSpec);
app.use(ANF);
app.use(supplierIssue);
app.use(supplierIssueReport);
app.use(qc2UploadData);
app.use(PackingList);
app.use(YourksysOrders);
app.use(measurementRoutes);

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




// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
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
