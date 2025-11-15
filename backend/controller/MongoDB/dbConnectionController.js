import mongoose from "mongoose";

//Schemas
import creatQCRealWashQty from "../../models/QCRealWashingQty.js";
import createIroningModel from "../../models/Ironing.js";
import createRoleManagmentModel from "../../models/RoleManagment.js";
import createOPAModel from "../../models/OPA.js";
import createPackingModel from "../../models/Packing.js";
import createQC2DefectPrintModel from "../../models/QC2DefectPrint.js";
import createUserModel from "../../models/User.js";
import createWashingModel from "../../models/Washing.js";
import createQCDataModel from "../../models/qc1_data.js";
import createQc2OrderDataModel from "../../models/qc2_orderdata.js";
import createQC2InspectionPassBundleModel from "../../models/qc2_inspection.js";
import createQC2ReworksModel from "../../models/qc2_rework.js";
import createQC2RepairTrackingModel from "../../models/qc2_repair_tracking.js";
import createSubconFactoryModel from "../../models/SubconFactory.js";
import createQC2DefectsModel from "../../models/QC2DefectsModel.js";
import createQC2WorkersDataModel from "../../models/QC2WorkersData.js";
import createQC2BGradeModel from "../../models/QC2BGrade.js";
import createQC2TaskModel from "../../models/QC2Task.js";
import createIEWorkerTaskModel from "../../models/IEWorkerTask.js";
import createInlineOrdersModel from "../../models/InlineOrders.js";
import createLineSewingWorkerModel from "../../models/LineSewingWorkers.js";
import createQCInlineRovingModel from "../../models/QC_Inline_Roving.js";
import createPairingDefectModel from "../../models/PairingDefect.js";
import createAccessoryIssueModel from "../../models/AccessoryIssue.js";
import createQCRovingPairingModel from "../../models/QCRovingPairing.js";
import createSewingDefectsModel from "../../models/SewingDefects.js";

import createCutPanelOrdersModel from "../../models/CutPanelOrders.js";
import createCuttingInspectionModel from "../../models/cutting_inspection.js";
import createCuttingMeasurementPointModel from "../../models/CuttingMeasurementPoints.js";
import createCuttingFabricDefectModel from "../../models/CuttingFabricDefects.js";
import createCuttingIssueModel from "../../models/CuttingIssues.js";
import createAQLChartModel from "../../models/AQLChart.js";

import createQC1SunriseModel from "../../models/QC1Sunrise.js";
import createQC1SunriseSummaryModel from "../../models/QC1SunriseSummary.js";

import createHTFirstOutputModel from "../../models/SCC/HTFirstOutput.js";
import createFUFirstOutputModel from "../../models/SCC/FUFirstOutput.js";
import createSCCDailyTestingModel from "../../models/SCC/SCCDailyTesting.js";
import createDailyTestingHTFUtModel from "../../models/SCC/dailyTestingHTFUModel.js";
import createDailyTestingFUQCModel from "../../models/SCC/DailyTestingFUQCModel.js";
import createSCCDefectModel from "../../models/SCC/SCCDefectModel.js";
import createSCCScratchDefectModel from "../../models/SCC/SCCScratchDefectModel.js";
import createHTInspectionReportModel from "../../models/SCC/HTInspectionReportModel.js";
import createElasticReportModel from "../../models/SCC/ElasticReport.js";
import createSCCHTOperatorModel from "../../models/SCC/SCCHTOperatorModel.js";
import createSCCFUOperatorModel from "../../models/SCC/SCCFUOperatorModel.js";
import createSCCElasticOperatorModel from "../../models/SCC/SCCElasticOperatorModel.js";

import createEMBDefectModel from "../../models/SCC/EMBdefect.js";
import createPrintingDefectModel from "../../models/SCC/printingDefect.js";
import createEMBReportModel from "../../models/SCC/EMBReport.js";

import createQADefectsModel from "../../models/QADefectsModel.js";
import createQCAccuracyReportModel from "../../models/QCAccuracyReportModel.js";
import createQAStandardDefectsModel from "../../models/QAStandardDefectsModel.js";

import createAuditCheckPointModel from "../../models/AuditCheckPoint.js";

import createBuyerSpecTemplateModel from "../../models/BuyerSpecTemplate.js";
import createANFMeasurementReportModel from "../../models/ANFMeasurementReport.js";
import createSizeCompletionStatusModel from "../../models/SizeCompletionStatus.model.js";

import createQCWashingDefectsModel from "../../models/QCWashingDefectsModel.js";
import createQCWashingCheckpointsModel from "../../models/QCWashingCheckpointsModel.js";
import createQCWashingFirstOutputModel from "../../models/QCWashingFirstOutputModel.js";
import createQCWashingModel from "../../models/QCWashing.js";

import createSupplierIssuesDefectModel from "../../models/SupplierIssuesDefect.js";
import createSupplierIssueReportModel from "../../models/SupplierIssueReport.js";

import createSubConDefectsModel from "../../models/sub_con_defects.js";
import createSubconSewingQAReportModel from "../../models/subconSewingQAReportSchema.js";
import createSubconSewingFactoryModel from "../../models/subcon_sewing_factory.js";
import createSubconSewingQc1ReportModel from "../../models/subcon_sewing_qc1_report.js";

import createQCWashingMachineStandard from "../../models/qcWashingStanderd.js";
import createQC2OlderDefectModel from "../../models/QC2_Older_Defects.js";
import createQCWashingQtyOldSchema from "../../models/QCWashingQtyOld.js";
import createQCWorkersModel from "../../models/QCWorkers.js";
import createDTOrdersSchema from "../../models/dt_orders.js";
import CuttingInlineOrdersModel from "../../models/CuttingInlineOrders.js";
import createPlanPackingListModel from "../../models/PlanPackingList.js";

import createYorksysOrdersModel from "../../models/YorksysOrders.js";

import createQASectionsProductType from "../../models/QA/QASectionsProductType.js";
import createQASectionsHomeModel from "../../models/QA/QASectionsHome.js";
import createQASectionsPhotosModel from "../../models/QA/QASectionsPhotos.js";
import createQASectionsPackingModel from "../../models/QA/QASectionsPacking.js";
import createQASectionsDefectListModel from "../../models/QA/QASectionsDefectList.js";
import createQASectionsDefectCategoryModel from "../../models/QA/QASectionsDefectCategory.js";
import createQASectionsProductLocationModel from "../../models/QA/QASectionsProductLocation.js";

//MongoDB Connections
export const ymProdConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

export const ymEcoConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_eco_board?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

//Connection status
ymProdConnection.on("connected", () =>
  console.log("✅ Connected to ym_prod database in 192.167.1.10:29000...")
);
ymProdConnection.on("error", (err) =>
  console.error("❌ unexpected error:", err)
);

ymEcoConnection.on("connected", () =>
  console.log("✅ Connected to ym_eco_board database in 192.167.1.10:29000...")
);
ymEcoConnection.on("error", (err) =>
  console.error("❌ unexpected error:", err)
);

//Collections
export const QCRealWashQty = creatQCRealWashQty(ymProdConnection);
export const UserMain = createUserModel(ymEcoConnection);
export const UserProd = createUserModel(ymProdConnection);
export const QCData = createQCDataModel(ymProdConnection);
export const QC2OrderData = createQc2OrderDataModel(ymProdConnection);
export const Ironing = createIroningModel(ymProdConnection);
export const Washing = createWashingModel(ymProdConnection);
export const OPA = createOPAModel(ymProdConnection);
export const Packing = createPackingModel(ymProdConnection);
export const RoleManagment = createRoleManagmentModel(ymProdConnection);
export const QC2DefectPrint = createQC2DefectPrintModel(ymProdConnection);
export const QC2InspectionPassBundle =
  createQC2InspectionPassBundleModel(ymProdConnection);
export const QC2Reworks = createQC2ReworksModel(ymProdConnection);
export const QC2RepairTracking = createQC2RepairTrackingModel(ymProdConnection);
export const SubconFactory = createSubconFactoryModel(ymProdConnection);
export const QC2Defects = createQC2DefectsModel(ymProdConnection);
export const QC2WorkersData = createQC2WorkersDataModel(ymProdConnection);
export const QC2BGrade = createQC2BGradeModel(ymProdConnection);
export const QC2Task = createQC2TaskModel(ymProdConnection);
export const IEWorkerTask = createIEWorkerTaskModel(ymProdConnection);
export const InlineOrders = createInlineOrdersModel(ymProdConnection);
export const SewingDefects = createSewingDefectsModel(ymProdConnection);
export const LineSewingWorker = createLineSewingWorkerModel(ymProdConnection);
export const QCInlineRoving = createQCInlineRovingModel(ymProdConnection);
export const PairingDefect = createPairingDefectModel(ymProdConnection);
export const AccessoryIssue = createAccessoryIssueModel(ymProdConnection);
export const QCRovingPairing = createQCRovingPairingModel(ymProdConnection);
export const CuttingInspection = createCuttingInspectionModel(ymProdConnection);
export const CuttingMeasurementPoint =
  createCuttingMeasurementPointModel(ymProdConnection);
export const CutPanelOrders = createCutPanelOrdersModel(ymProdConnection);
export const CuttingFabricDefect =
  createCuttingFabricDefectModel(ymProdConnection);
export const CuttingIssue = createCuttingIssueModel(ymProdConnection);
export const AQLChart = createAQLChartModel(ymProdConnection);

export const QC1Sunrise = createQC1SunriseModel(ymProdConnection);
export const QC1SunriseSummary = createQC1SunriseSummaryModel(ymProdConnection);

export const HTFirstOutput = createHTFirstOutputModel(ymProdConnection);
export const FUFirstOutput = createFUFirstOutputModel(ymProdConnection);
export const SCCDailyTesting = createSCCDailyTestingModel(ymProdConnection);
export const DailyTestingHTFU = createDailyTestingHTFUtModel(ymProdConnection);
export const DailyTestingFUQC = createDailyTestingFUQCModel(ymProdConnection);
export const SCCDefect = createSCCDefectModel(ymProdConnection);
export const SCCScratchDefect = createSCCScratchDefectModel(ymProdConnection);
export const HTInspectionReport =
  createHTInspectionReportModel(ymProdConnection);
export const ElasticReport = createElasticReportModel(ymProdConnection);
export const EMBDefect = createEMBDefectModel(ymProdConnection);
export const PrintingDefect = createPrintingDefectModel(ymProdConnection);
export const EMBReport = createEMBReportModel(ymProdConnection);
export const QADefectsModel = createQADefectsModel(ymProdConnection);
export const QCAccuracyReportModel =
  createQCAccuracyReportModel(ymProdConnection);
export const QAStandardDefectsModel =
  createQAStandardDefectsModel(ymProdConnection);
export const SCCHTOperator = createSCCHTOperatorModel(ymProdConnection);
export const SCCFUOperator = createSCCFUOperatorModel(ymProdConnection);
export const SCCElasticOperator =
  createSCCElasticOperatorModel(ymProdConnection);
export const AuditCheckPoint = createAuditCheckPointModel(ymProdConnection);
export const BuyerSpecTemplate = createBuyerSpecTemplateModel(ymProdConnection);
export const ANFMeasurementReport =
  createANFMeasurementReportModel(ymProdConnection);
export const SizeCompletionStatus =
  createSizeCompletionStatusModel(ymProdConnection);
export const QCWashingDefects = createQCWashingDefectsModel(ymProdConnection);
export const QCWashingCheckList =
  createQCWashingCheckpointsModel(ymProdConnection);
export const QCWashingFirstOutput =
  createQCWashingFirstOutputModel(ymProdConnection);
export const QCWashing = createQCWashingModel(ymProdConnection);
export const SupplierIssuesDefect =
  createSupplierIssuesDefectModel(ymProdConnection);
export const SupplierIssueReport =
  createSupplierIssueReportModel(ymProdConnection);
export const SubconSewingQAReport =
  createSubconSewingQAReportModel(ymProdConnection);
export const QCWashingMachineStandard =
  createQCWashingMachineStandard(ymProdConnection);
export const QCWashingQtyOld = createQCWashingQtyOldSchema(ymProdConnection);
export const QC2OlderDefect = createQC2OlderDefectModel(ymProdConnection);
export const QCWorkers = createQCWorkersModel(ymProdConnection);
export const DtOrder = createDTOrdersSchema(ymProdConnection);
export const SubConDefect = createSubConDefectsModel(ymProdConnection);
export const SubconSewingFactory =
  createSubconSewingFactoryModel(ymProdConnection);
export const SubconSewingQc1Report =
  createSubconSewingQc1ReportModel(ymProdConnection);
export const CuttingInlineOrders = CuttingInlineOrdersModel(ymProdConnection);
export const PlanPackingList = createPlanPackingListModel(ymProdConnection);
export const YorksysOrders = createYorksysOrdersModel(ymProdConnection);

export const QASectionsProductType =
  createQASectionsProductType(ymProdConnection);
export const QASectionsHome = createQASectionsHomeModel(ymProdConnection);
export const QASectionsPhotos = createQASectionsPhotosModel(ymProdConnection);
export const QASectionsPacking = createQASectionsPackingModel(ymProdConnection);
export const QASectionsDefectCategory =
  createQASectionsDefectCategoryModel(ymProdConnection);
export const QASectionsDefectList =
  createQASectionsDefectListModel(ymProdConnection);
export const QASectionsProductLocation =
  createQASectionsProductLocationModel(ymProdConnection);

//Disconnect DB connection
export async function disconnectMongoDB() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB connections closed.");
  } catch (error) {
    console.error("Error disconnecting MongoDB:", error);
    throw error; // Re-throw to allow calling function to handle
  }
}
