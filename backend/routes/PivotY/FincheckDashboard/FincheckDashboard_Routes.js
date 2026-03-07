import express from "express";
import {
  getTopCardSummary,
  getQADashboardPerformance,
  getOrderSummaryPerformance,
  getTopDefectAnalytics,
  getReportResultSummary,
  getMeasurementResultSummary,
  getDistinctReportTypes,
  getDistinctBuyers,
  getDistinctOrders,
  getDistinctQAs,
  getDefectTrendChart,
} from "../../../controller/PivotY/FincheckDashboard/FincheckDashboard_Controller.js";

const router = express.Router();

// GET: Top Card Summary
router.get("/api/fincheck-dashboard/top-card-summary", getTopCardSummary);

// GET: QA Dashboard Performance Cards
router.get("/api/fincheck-dashboard/qa-performance", getQADashboardPerformance);

// GET: Order No Dashboard Performance Cards
router.get(
  "/api/fincheck-dashboard/order-performance",
  getOrderSummaryPerformance,
);

// GET: Top Defects Chart
router.get("/api/fincheck-dashboard/top-defects", getTopDefectAnalytics);

// GET: Report Results Table
router.get("/api/fincheck-dashboard/report-results", getReportResultSummary);

// GET: Measurement Result Summary
router.get(
  "/api/fincheck-dashboard/measurement-results",
  getMeasurementResultSummary,
);

// GET: Defect Trend Chart
router.get("/api/fincheck-dashboard/defect-trend", getDefectTrendChart);

// GET: QA List
router.get("/api/fincheck-dashboard/qas", getDistinctQAs);

// GET: Report Types List
router.get("/api/fincheck-dashboard/report-types", getDistinctReportTypes);

// GET: Buyer List
router.get("/api/fincheck-dashboard/buyers", getDistinctBuyers);

// GET: Order List
router.get("/api/fincheck-dashboard/orders", getDistinctOrders);

export default router;
