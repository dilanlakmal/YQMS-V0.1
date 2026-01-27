import express from "express";
import {
  getQAAnalyticsSummary,
  getQAStyleAnalytics,
  getQATrendAnalytics,
} from "../../../controller/PivotY/FincheckAnalytics/FincheckAnalytics_Controller.js";

const router = express.Router();

// GET: QA Summary Analytics
router.get("/api/fincheck-analytics/qa-summary", getQAAnalyticsSummary);
router.get("/api/fincheck-analytics/qa-style-breakdown", getQAStyleAnalytics);
router.get("/api/fincheck-analytics/qa-trend", getQATrendAnalytics);

export default router;
