import express from "express";
import {
  createCuttingInlineReport,
  getCuttingInlineReports,
  getCuttingInlineReportById
} from "../../controller/CuttingDefects/cuttingInlineReportController.js";

const router = express.Router();

router.get("/api/cutting-inline-reports", getCuttingInlineReports);
router.get("/api/cutting-inline-reports/:id", getCuttingInlineReportById);
router.post("/api/cutting-inline-reports", createCuttingInlineReport);

export default router;


