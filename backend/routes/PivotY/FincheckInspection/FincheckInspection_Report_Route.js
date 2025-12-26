import express from "express";
import { getInspectionReports } from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Report_Controller.js";

const router = express.Router();

// Get filtered inspection reports
router.get("/api/fincheck-reports/list", getInspectionReports);

export default router;
