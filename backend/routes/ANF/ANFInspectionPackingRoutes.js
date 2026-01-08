import express from "express";
import {
  getBuyerSpecMoNosM2,
  getBuyerSpecDataM2,
  getAnfOrderDetailsM2,
  getAnfSpecTableM2,
  saveBuyerSpecReportM2,
  updateReportStatusM2,
  getReportDataM2
} from "../../controller/ANF/ANFInspectionPackingController.js";

const router = express.Router();

router.get("/api/anf-measurement-packing/mo-options", getBuyerSpecMoNosM2);
router.get("/api/anf-measurement-packing/mo-details/:moNo", getBuyerSpecDataM2);
router.get(
  "/api/anf-measurement-packing/order-details/:moNo",
  getAnfOrderDetailsM2
);
router.get("/api/anf-measurement-packing/spec-table", getAnfSpecTableM2);
router.post("/api/anf-measurement-packing/reports", saveBuyerSpecReportM2);
router.patch(
  "/api/anf-measurement-packing/reports/status",
  updateReportStatusM2
);
router.get("/api/anf-measurement-packing/existing-data", getReportDataM2);

export default router;
