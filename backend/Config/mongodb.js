import mongoose from "mongoose";

// Import Model Creators
import createUserModel from "../models/User.js";
import createQCDataModel from "../models/qc1_data.js";
import createRoleModel from "../models/Role.js";
import createIroningModel from "../models/Ironing.js";
import createQc2OrderDataModel from "../models/qc2_orderdata.js";
import createOPAModel from "../models/OPA.js";
import createPackingModel from "../models/Packing.js";
import createWashingModel from "../models/Washing.js";
import createRoleManagmentModel from "../models/RoleManagment.js";
import createQC2InspectionPassBundle from "../models/qc2_inspection_pass_bundle.js";
import createQC2DefectPrintModel from "../models/QC2DefectPrint.js";
import createQC2ReworksModel from "../models/qc2_rework.js";
import createQCInlineRovingModel from "../models/QC_Inline_Roving.js";
import createQC2RepairTrackingModel from "../models/qc2_repair_tracking.js";
import createCuttingOrdersModel from "../models/CuttingOrders.js";
import createQC1SunriseModel from "../models/QC1Sunrise.js";
import createCuttingInspectionModel from "../models/cutting_inspection.js";
import createLineSewingWorkerModel from "../models/LineSewingWorkers.js";
import createInlineOrdersModel from "../models/InlineOrders.js";
import createSewingDefectsModel from "../models/SewingDefects.js";
import createCuttingMeasurementPointModel from "../models/CuttingMeasurementPoints.js";
import createCuttingFabricDefectModel from "../models/CuttingFabricDefects.js";
import createCuttingIssueModel from "../models/CuttingIssues.js";
import createCutPanelOrdersModel from "../models/CutPanelOrders.js";
import createAQLChartModel from "../models/AQLChart.js";
import createHTFirstOutputModel from "../models/HTFirstOutput.js";
import createFUFirstOutputModel from "../models/FUFirstOutput.js";
import createSCCDailyTestingModel from "../models/SCCDailyTesting.js";
import createDailyTestingHTFUtModel from "../models/dailyTestingHTFUModel.js";
import createPairingDefectModel from "../models/PairingDefect.js";
import createAccessoryIssueModel from "../models/AccessoryIssue.js";
import createSCCHTOperatorModel from "../models/SCCHTOperatorModel.js";
import createSCCFUOperatorModel from "../models/SCCFUOperatorModel.js";
import createSCCElasticOperatorModel from "../models/SCCElasticOperatorModel.js";
import createQC2InspectionPassBundleModel from "../models/qc2_inspection.js";
import createQCRovingPairingModel from "../models/QCRovingPairing.js";
import createDailyTestingFUQCModel from "../models/DailyTestingFUQCModel.js";
import createSCCDefectModel from "../models/SCCDefectModel.js";
import createSCCScratchDefectModel from "../models/SCCScratchDefectModel.js";
import createHTInspectionReportModel from "../models/HTInspectionReportModel.js";
import createElasticReportModel from "../models/ElasticReport.js";
import createEMBDefectModel from "../models/EMBdefect.js";
import createEMBReportModel from "../models/EMBReport.js";
import createAuditCheckPointModel from "../models/AuditCheckPoint.js";

// MongoDB Connections
export const ymProdConnection = mongoose.createConnection(process.env.YM_PROD_DB_URI || "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin");
export const ymEcoConnection = mongoose.createConnection(process.env.YM_ECO_DB_URI || "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_eco_board?authSource=admin");

ymProdConnection.on('connected', () => console.log("Connected to ym_prod database"));
ymProdConnection.on('error', (err) => console.error("ym_prod connection error:", err));
ymEcoConnection.on('connected', () => console.log("Connected to ym_Eco database"));
ymEcoConnection.on('error', (err) => console.error("ym_Eco connection error:", err));

// Initialize Models
export const UserMain = createUserModel(ymEcoConnection);
export const QC1Sunrise = createQC1SunriseModel(ymProdConnection);
export const InlineOrders = createInlineOrdersModel(ymProdConnection);
export const CuttingOrders = createCuttingOrdersModel(ymProdConnection);
export const CutPanelOrders = createCutPanelOrdersModel(ymProdConnection);
export const QCData = createQCDataModel(ymProdConnection);
export const Role = createRoleModel(ymProdConnection);
export const Ironing = createIroningModel(ymProdConnection);
export const Washing = createWashingModel(ymProdConnection);
export const OPA = createOPAModel(ymProdConnection);
export const Packing = createPackingModel(ymProdConnection);
export const QC2OrderData = createQc2OrderDataModel(ymProdConnection);
export const RoleManagment = createRoleManagmentModel(ymProdConnection);
export const QC2InspectionPassBundle = createQC2InspectionPassBundle(ymProdConnection);
export const QC2DefectPrint = createQC2DefectPrintModel(ymProdConnection);
export const QC2Reworks = createQC2ReworksModel(ymProdConnection);
export const QCInlineRoving = createQCInlineRovingModel(ymProdConnection);
export const QC2RepairTracking = createQC2RepairTrackingModel(ymProdConnection);
export const CuttingInspection = createCuttingInspectionModel(ymProdConnection);
export const LineSewingWorker = createLineSewingWorkerModel(ymProdConnection);
export const SewingDefects = createSewingDefectsModel(ymProdConnection);
export const CuttingMeasurementPoint = createCuttingMeasurementPointModel(ymProdConnection);
export const CuttingFabricDefect = createCuttingFabricDefectModel(ymProdConnection);
export const CuttingIssue = createCuttingIssueModel(ymProdConnection);
export const AQLChart = createAQLChartModel(ymProdConnection);
export const HTFirstOutput = createHTFirstOutputModel(ymProdConnection);
export const FUFirstOutput = createFUFirstOutputModel(ymProdConnection);
export const SCCDailyTesting = createSCCDailyTestingModel(ymProdConnection);
export const DailyTestingHTFU = createDailyTestingHTFUtModel(ymProdConnection);
export const PairingDefect = createPairingDefectModel(ymProdConnection);
export const AccessoryIssue = createAccessoryIssueModel(ymProdConnection);
export const SCCHTOperator = createSCCHTOperatorModel(ymProdConnection);
export const SCCFUOperator = createSCCFUOperatorModel(ymProdConnection);
export const SCCElasticOperator = createSCCElasticOperatorModel(ymProdConnection);
export const QC2InspectionPassBundleModel = createQC2InspectionPassBundleModel(ymProdConnection);	
export const UserProd = createUserModel(ymProdConnection);
export const QCRovingPairing = createQCRovingPairingModel(ymProdConnection);
export const DailyTestingFUQC = createDailyTestingFUQCModel(ymProdConnection);
export const SCCDefect = createSCCDefectModel(ymProdConnection);
export const SCCScratchDefect = createSCCScratchDefectModel(ymProdConnection);
export const HTInspectionReport = createHTInspectionReportModel(ymProdConnection);
export const ElasticReport = createElasticReportModel(ymProdConnection);
export const EMBDefect = createEMBDefectModel(ymProdConnection);
export const EMBReport = createEMBReportModel(ymProdConnection);
export const AuditCheckPoint = createAuditCheckPointModel(ymProdConnection);

export async function disconnectMongoDB() {
    try {
        await mongoose.disconnect();
        console.log('MongoDB connections closed.');
    } catch (error) {
        console.error('Error disconnecting MongoDB:', error);
        throw error; // Re-throw to allow calling function to handle
    }
}