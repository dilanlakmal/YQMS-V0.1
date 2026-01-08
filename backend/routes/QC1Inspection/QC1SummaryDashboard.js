import express from "express";
import {
  getSunriseFilterOptions,
  getSunriseSummaryData
} from "../../controller/QC1Inspection/QC1SummaryDashboardController.js";

const router = express.Router();

// --- ROUTE for getting dynamic filter options ---
router.get("/api/qc1-summary/filter-options", getSunriseFilterOptions);

// Route to get summarized dashboard data based on a date range and filters
router.get("/api/qc1-summary/dashboard-data", getSunriseSummaryData);

export default router;
