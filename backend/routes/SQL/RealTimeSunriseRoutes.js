import express from "express";
import {
  getWIPSummaryStats,
  getWIPLineChartData,
  getOutputByMONo,
  getOutputByBuyer,
  getOutputByInspector,
} from "../../controller/SQL/RealTimeSunriseSystemController.js";

const router = express.Router();

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

export default router;
