import express from "express";
import {
  syncAllSunriseData,
  syncLast3DaysSunriseData
} from "../../controller/QC1Inspection/QCReportController.js";

const router = express.Router();

// Route to trigger a full sync of all data
router.post("/api/qc1-sunrise/sync-all", syncAllSunriseData);

// Route to trigger a sync of the last 3 days
router.post("/api/qc1-sunrise/sync-recent", syncLast3DaysSunriseData);

export default router;
