import express from "express";
import {
  getWIPSummaryStats,
  getWIPLineChartData,
  getOutputByMONo,
  getOutputByBuyer,
  getOutputByInspector,
} from "../../controller/SQL/RealTimeSunriseSystemController.js";

import {
  getDefectsSummaryStats,
  getDefectsByLine,
  getDefectsByType,
  getDefectsByMONo,
  getDefectsByQCInspector,
  getDefectsByWorker,
} from "../../controller/SQL/SewingDefectsController.js";

const router = express.Router();

// ═══════════════════════════════════════════════
// WIP DASHBOARD - Output ROUTES
// ═══════════════════════════════════════════════

// Stats for Cards (includes TotalOutput)
router.get("/api/realtime-sunrise/wip-stats", getWIPSummaryStats);

// Stats for Bar Chart by Line (Query param: ?taskNo=38 or ?taskNo=39)
router.get("/api/realtime-sunrise/wip-chart", getWIPLineChartData);

// Output by MONo (Horizontal bar chart data)
router.get("/api/realtime-sunrise/output-by-mono", getOutputByMONo);

// Output by Buyer (Table data)
router.get("/api/realtime-sunrise/output-by-buyer", getOutputByBuyer);

// Output by Inspector (Query param: ?taskNo=38, ?taskNo=39, or ?taskNo=all)
router.get("/api/realtime-sunrise/output-by-inspector", getOutputByInspector);

// ═══════════════════════════════════════════════
// SEWING DEFECTS DASHBOARD ROUTES
// ═══════════════════════════════════════════════

// Defects Summary Stats (Output, Defects, Rate)
router.get("/api/realtime-sunrise/defects-stats", getDefectsSummaryStats);

// Defects by Production Line
router.get("/api/realtime-sunrise/defects-by-line", getDefectsByLine);

// Defects by Type (Rework Code)
router.get("/api/realtime-sunrise/defects-by-type", getDefectsByType);

// Defects by MO Number
router.get("/api/realtime-sunrise/defects-by-mono", getDefectsByMONo);

// Defects by QC Inspector
router.get("/api/realtime-sunrise/defects-by-qc", getDefectsByQCInspector);

// Defects by Responsible Worker
router.get("/api/realtime-sunrise/defects-by-worker", getDefectsByWorker);

export default router;