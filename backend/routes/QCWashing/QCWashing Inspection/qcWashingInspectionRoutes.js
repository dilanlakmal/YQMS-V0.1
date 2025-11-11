import {
  saveqcwashingFirstOutput,
  getQCWashingMeasurementData,
  findQCWashingExistingRecord,
  saveQCWashingOrderData,
  saveQCWashingInspectionData,
  getqcwashingSavedColor,
  updateQCWashingInspectionData,
  saveQCWashingDefectData,
  updateQCWashingDefectData,
  savedMeasurementDataSpec,
  getqcwashingOrderSizes,
  getmeasurmentSpec,
  saveqwashingSummary,
  updateQCWashingMeasurementData,
  getqcwashingOverAllSummary,
  getqcwashingOrderColorQty,
  getqcwashingOrderNumbers,
  getqcwashingOrderbysize,
  getqcWashingOrderbyOrderNo,
  getQCWashingSaveData,
  saveqcwashingAQLbySampleSize,
  saveqcWashinAQLData,
  saveQCWashingMeasurementData,
  loadqcwashingColorData,
  getQCWashingSubmittedData,
  saveqcwashing
} from "../../../controller/QCWashing/QCWashing Inspection/qcWashingInspectionController.js";
import express from "express";
import {
  uploadInspectionImage,
  uploadDefectImage,
  sanitize
} from "../../../helpers/helperFunctions.js";

const router = express.Router();

// Middleware to sanitize color parameter
const sanitizeColor = (req, res, next) => {
  if (req.params.color) {
    req.params.color = sanitize(req.params.color);
  }
  next();
};

/* ------------------------------
  Order Details Section Routes
------------------------------ */

router.post("/api/qc-washing/first-output-details", saveqcwashingFirstOutput);
router.get(
  "/api/qc-washing/check-measurement-details/:orderNo",
  getQCWashingMeasurementData
);
router.post("/api/qc-washing/find-existing", findQCWashingExistingRecord);
router.post("/api/qc-washing/orderData-save", saveQCWashingOrderData);
router.get(
  "/api/qc-washing/saved-sizes/:orderNo/:color(*)",
  sanitizeColor,
  getqcwashingSavedColor
);

/* ------------------------------
  Inspection Details Section Routes
------------------------------ */

router.post(
  "/api/qc-washing/inspection-save",
  uploadInspectionImage.any(),
  saveQCWashingInspectionData
);
router.post(
  "/api/qc-washing/inspection-update",
  uploadInspectionImage.any(),
  updateQCWashingInspectionData
);

/* ------------------------------
  Defect Details Section Routes
------------------------------ */

router.post(
  "/api/qc-washing/defect-details-save",
  uploadDefectImage.any(),
  saveQCWashingDefectData
);
router.post(
  "/api/qc-washing/defect-details-update",
  uploadDefectImage.any(),
  updateQCWashingDefectData
);

/* ------------------------------
  Measurement Details Section Routes
------------------------------ */

router.post("/api/qc-washing/find-saved-measurement", savedMeasurementDataSpec);
router.get(
  "/api/qc-washing/order-sizes/:orderNo/:color(*)",
  sanitizeColor,
  getqcwashingOrderSizes
);
router.get(
  "/api/qc-washing/measurement-specs/:orderNo/:color(*)",
  sanitizeColor,
  getmeasurmentSpec
);

/* ------------------------------
  OverAll Summary Card Routes
------------------------------ */

router.post("/api/qc-washing/save-summary/:recordId", saveqwashingSummary);

/* ------------------------------
  Summary Card Routes
------------------------------ */
router.post(
  "/api/qc-washing/measurement-summary-autosave/:recordId",
  updateQCWashingMeasurementData
);

/* ------------------------------
  Main page Routes
------------------------------ */
router.get(
  "/api/qc-washing/overall-summary-by-id/:recordId",
  getqcwashingOverAllSummary
);
router.get(
  "/api/qc-washing/order-color-qty/:orderNo/:color(*)",
  sanitizeColor,
  getqcwashingOrderColorQty
);
router.get("/api/qc-washing/order-numbers", getqcwashingOrderNumbers);
router.get(
  "/api/qc-washing/order-details-by-style/:orderNo",
  getqcwashingOrderbysize
);
router.get(
  "/api/qc-washing/order-details-by-order/:orderNo",
  getqcWashingOrderbyOrderNo
);
router.get("/api/qc-washing/load-saved-by-id/:id", getQCWashingSaveData);
router.post(
  "/api/qc-washing/aql-chart/find-by-sample-size",
  saveqcwashingAQLbySampleSize
);
router.post("/api/qc-washing/aql-chart/find", saveqcWashinAQLData);
router.post("/api/qc-washing/measurement-save", saveQCWashingMeasurementData);
router.get(
  "/api/qc-washing/load-color-data/:orderNo/:color(*)",
  sanitizeColor,
  loadqcwashingColorData
);
router.get("/api/qc-washing/submitted/:id", getQCWashingSubmittedData);
router.post("/api/qc-washing/submit", saveqcwashing);

export default router;
