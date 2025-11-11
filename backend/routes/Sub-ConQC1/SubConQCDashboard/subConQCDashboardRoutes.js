import express from "express";
import {
  getDailyData,
  getDailyTrendData
} from "../../../controller/Sub-ConQC1/SubConQCDashboard/subConQCDashboardController.js";

const router = express.Router();

router.get("/api/subcon-qc-dashboard-daily", getDailyData);
router.get("/api/subcon-qc-dashboard-daily-trend", getDailyTrendData);

export default router;
