import express from "express";
import {
  getFilterOptionsPacking,
  getSummaryDataPacking,
  getFullReportPacking
} from "../../controller/ANF/ANFResultPackingController.js";

const router = express.Router();

// Routes for M2 - Packing Results
router.get(
  "/api/anf-measurement-packing/results/filters",
  getFilterOptionsPacking
);
router.get(
  "/api/anf-measurement-packing/results/summary",
  getSummaryDataPacking
);
router.get(
  "/api/anf-measurement-packing/results/full-report-detail",
  getFullReportPacking
);

export default router;
