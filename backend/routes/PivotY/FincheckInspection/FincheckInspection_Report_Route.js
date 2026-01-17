import express from "express";
import {
  getInspectionReports,
  getDefectImagesForReport,
  getReportMeasurementSpecs,
  checkUserPermission,
  getReportImagesAsBase64,
  getReportDefectHeatmap,
  getFilterOptions,
  autocompleteOrderNo,
  autocompleteCustStyle,
  saveUserPreference,
  getUserPreferences,
  deleteUserFilter
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Report_Controller.js";

const router = express.Router();

// Get filtered inspection reports
router.get("/api/fincheck-reports/list", getInspectionReports);

// Get filter options
router.get("/api/fincheck-reports/filter-options", getFilterOptions);

// Autocomplete endpoints
router.get("/api/fincheck-reports/autocomplete/order-no", autocompleteOrderNo);
router.get(
  "/api/fincheck-reports/autocomplete/cust-style",
  autocompleteCustStyle
);

// Route for Defect Images
router.get(
  "/api/fincheck-reports/:reportId/defect-images",
  getDefectImagesForReport
);

// Get Measurement Specs for a specific Report ID
router.get(
  "/api/fincheck-reports/:reportId/measurement-specs",
  getReportMeasurementSpecs
);

// Route to check permission
router.get("/api/fincheck-reports/check-permission", checkUserPermission);

// Get all report images as base64 for PDF generation
router.get(
  "/api/fincheck-reports/:reportId/images-base64",
  getReportImagesAsBase64
);

// GET - Defect Heatmap/Visual Summary
router.get(
  "/api/fincheck-inspection/report/:reportId/defect-heatmap",
  getReportDefectHeatmap
);

// User Preferences Routes
router.post("/api/fincheck-reports/preferences/save", saveUserPreference);
router.get("/api/fincheck-reports/preferences/get", getUserPreferences);
router.post(
  "/api/fincheck-reports/preferences/delete-filter",
  deleteUserFilter
);

export default router;
