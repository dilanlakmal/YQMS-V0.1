import express from "express";
import {
  getQADashboardPerformance,
  getOrderSummaryPerformance,
  getTopDefectAnalytics,
  getDistinctReportTypes,
  getDistinctBuyers,
  getDistinctOrders,
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

// GET: Filter Data
router.get("/api/fincheck-dashboard/report-types", getDistinctReportTypes);

// GET: Buyer List
router.get("/api/fincheck-dashboard/buyers", getDistinctBuyers);

// GET: Order List
router.get("/api/fincheck-dashboard/orders", getDistinctOrders);

export default router;
