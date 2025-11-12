import express from "express";
import {
  getQcOutputFilters,
  getQcOutputInspectionData,
  getQcOutputFullReport
} from "../../controller/QCOutput/QCOutputController.js";

const router = express.Router();

// Route to get filter options (like QC IDs)
router.get("/api/qc-output/filters", getQcOutputFilters);

// Route to get aggregated data for the main inspection dashboard
router.get("/api/qc-output/inspection-data", getQcOutputInspectionData);

// Route to get detailed data for the full report page
router.get("/api/qc-output/full-report", getQcOutputFullReport);

export default router;
