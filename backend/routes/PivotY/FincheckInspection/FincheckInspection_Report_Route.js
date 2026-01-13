import express from "express";
import {
  getInspectionReports,
  getDefectImagesForReport,
  getReportMeasurementSpecs,
  checkUserPermission
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Report_Controller.js";

const router = express.Router();

// Get filtered inspection reports
router.get("/api/fincheck-reports/list", getInspectionReports);

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

export default router;
