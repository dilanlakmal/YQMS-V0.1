import express from "express";
import {
  getDailyData,
  getDailyTrendData,
  getWeeklyData,
  getMonthlyData,
  getWeeklyTrendData,
  getMonthlyTrendData
} from "../../../controller/Sub-ConQC1/SubConQCDashboard/subConQCDashboardController.js";

const router = express.Router();

router.get("/api/subcon-qc-dashboard-daily", getDailyData);
router.get("/api/subcon-qc-dashboard-daily-trend", getDailyTrendData);

// --- WEEKLY VIEW ---
router.get("/api/subcon-qc-dashboard-weekly", getWeeklyData);

// --- MONTHLY VIEW ---
router.get("/api/subcon-qc-dashboard-monthly", getMonthlyData);

// --- WEEKLY TREND VIEW ---
router.get("/api/subcon-qc-dashboard-weekly-trend", getWeeklyTrendData);

// --- MONTHLY TREND VIEW ---
router.get("/api/subcon-qc-dashboard-monthly-trend", getMonthlyTrendData);

export default router;
