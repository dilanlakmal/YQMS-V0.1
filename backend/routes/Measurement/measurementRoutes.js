import express from "express";
import {
  getMeasurementDataByStyle,
  getMatchingStyleNos,
  getMeasurementDataByStyleV2,
  getTemplateByBuyer,
  getTemplateByStyleNo
} from "../../controller/Measurement/measurementController.js";

const router = express.Router();

router.get("/api/measurement/styles/search", getMatchingStyleNos);
router.get("/api/measurement/:styleNo", getMeasurementDataByStyle);
router.get("/api/measurement-v2/:styleNo", getMeasurementDataByStyleV2);
router.get("/api/measurement/buyer-template/:buyerName", getTemplateByBuyer); // Kept for other potential uses
router.get("/api/measurement/template-by-style/:styleNo", getTemplateByStyleNo); // New endpoint

export default router;
