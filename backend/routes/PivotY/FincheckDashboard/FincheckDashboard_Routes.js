import express from "express";
import {
  getQADashboardPerformance,
  getOrderSummaryPerformance,
  getTopDefectAnalytics,
  getReportResultSummary,
  getMeasurementResultSummary,
  getDistinctReportTypes,
  getDistinctBuyers,
  getDistinctOrders,
  getDistinctQAs,
} from "../../../controller/PivotY/FincheckDashboard/FincheckDashboard_Controller.js";

const router = express.Router();

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

// GET: Filter Data
router.get("/api/fincheck-dashboard/report-types", getDistinctReportTypes);

// GET: Buyer List
router.get("/api/fincheck-dashboard/buyers", getDistinctBuyers);

// GET: Order List
router.get("/api/fincheck-dashboard/orders", getDistinctOrders);

// GET: QA List
router.get("/api/fincheck-dashboard/qas", getDistinctQAs);

export default router;
