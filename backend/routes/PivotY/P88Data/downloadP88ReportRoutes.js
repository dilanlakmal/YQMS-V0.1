import express from "express";
import {
  downloadBulkReports,
  checkBulkSpace,
  getRecordCount,
  saveDownloadParth,
  checkSpace,
  validateDownloadParth,
  initializeDownloadStatus,
  getDownloadStatusStats,
  resetDownloadStatus,
  getFactories,
  getDateFilteredStats,
  downloadSingleReportDirect,
  downloadBulkReportsAuto,
  downloadBulkReportsUbuntu
} from "../../../controller/PivotY/P88Data/downoloadP88ReportController.js";

const router = express.Router();

router.get("/api/scraping/factories", getFactories);
router.get("/api/scraping/date-filtered-stats", getDateFilteredStats);
router.get("/api/scraping/record-count", getRecordCount);
router.post("/api/scraping/download-bulk-reports", downloadBulkReports);
router.post("/api/scraping/check-bulk-space", checkBulkSpace);
router.post("/api/scraping/print-report", saveDownloadParth);
router.post("/api/scraping/check-space", checkSpace);
router.post("/api/scraping/validate-path", validateDownloadParth);
router.post(
  "/api/scraping/initialize-download-status",
  initializeDownloadStatus
);
router.get("/api/scraping/download-status-stats", getDownloadStatusStats);
router.post("/api/scraping/reset-download-status", resetDownloadStatus);
router.post("/api/scraping/download-single-direct", downloadSingleReportDirect);
router.post(
  "/api/scraping/download-bulk-reports-auto",
  downloadBulkReportsAuto
);
router.post(
  "/api/scraping/download-bulk-reports-ubuntu",
  downloadBulkReportsUbuntu
);

export default router;
