import express from "express";
import {
  getBuyerSpecMoNos,
  getBuyerSpecData,
  getAnfOrderDetails,
  getAnfSpecTable,
  saveBuyerSpecReport,
  updateReportStatus,
  getReportData
} from "../../controller/ANF/ANFInspectionController.js";

const router = express.Router();

router.get("/api/anf-measurement/mo-options", getBuyerSpecMoNos);
router.get("/api/anf-measurement/mo-details/:moNo", getBuyerSpecData);
router.get("/api/anf-measurement/order-details/:moNo", getAnfOrderDetails);
router.get("/api/anf-measurement/spec-table", getAnfSpecTable);
router.post("/api/anf-measurement/reports", saveBuyerSpecReport);
router.patch("/api/anf-measurement/reports/status", updateReportStatus);
router.get("/api/anf-measurement/existing-data", getReportData);

export default router;
