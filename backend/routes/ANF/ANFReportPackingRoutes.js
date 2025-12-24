import express from "express";
import {
  getDailyReportsPacking,
  getDynamicFilterOptionsPacking,
  getDailyFullReportPacking,
  getanfStyleViewSummaryPacking,
  getStyleViewFullReportPacking
} from "../../controller/ANF/ANFReportPackingController.js";

const router = express.Router();

/* ------------------------------
   ANF QC DAILY REPORT ROUTES (PACKING)
------------------------------ */
router.get(
  "/api/anf-measurement-packing/qc-daily-reports",
  getDailyReportsPacking
);
router.get(
  "/api/anf-measurement-packing/qc-daily-reports/filters",
  getDynamicFilterOptionsPacking
);
router.get(
  "/api/anf-measurement-packing/qc-daily-report/detail/:pageId",
  getDailyFullReportPacking
);

/* ------------------------------
  ANF STYLE VIEW REPORT ROUTES (PACKING)
------------------------------ */
router.get(
  "/api/anf-measurement-packing/style-view-summary",
  getanfStyleViewSummaryPacking
);
router.get(
  "/api/anf-measurement-packing/style-view-full-report/:moNo",
  getStyleViewFullReportPacking
);

export default router;
