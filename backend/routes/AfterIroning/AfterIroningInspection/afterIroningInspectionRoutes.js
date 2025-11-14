import {
  saveqcwashingFirstOutput,
  getAfterIroningMeasurementData,
  findAfterIroningExistingRecord, 
  checkAfterIroningSubmittedRecord, 
  saveAfterIroningOrderData,
  saveAfterIroningInspectionData,
  getqcwashingSavedColor,
  updateAfterIroningInspectionData,
  saveAfterIroningDefectData,
  updateAfterIroningDefectData,
  savedMeasurementDataSpec,
  getAfterIroningOrderSizes,
  getmeasurmentSpec,
  saveAfterIroningSummary,
  updateAfterIroningMeasurementData,
  getAfterIroningOverAllSummary,
  getAfterIroningOrderColorQty,
  getAfterIroningOrderNumbers,
  getAfterIroningOrderbysize,
  getAfterIroningOrderbyOrderNo, 
  getAfterIroningSaveData,
  saveAfterIroningAQLbySampleSize,
  saveAfterIroningAQLData,
  saveAfterIroningMeasurementData,
  loadAfterIroningColorData,
  getAfterIroningSubmittedData,
  saveAfterIroning,
  getAfterIroningDefects,
  getAfterIroningChecklist,
  checkAfterIroningRecord,
} from '../../../controller/AfterIroning/AfterIroningInspection/afterIroningInspectionController.js';
import express from 'express';
import { 
  uploadInspectionImage,
  uploadDefectImage,
  cleanup,
 } from "../../../helpers/helperFunctions.js";

const router = express.Router();

// Middleware to sanitize color parameter
const  cleanupColor = (req, res, next) => {
  if (req.params.color) {
    req.params.color = cleanup(req.params.color);
  }
  next();
};

/* ------------------------------
  Order Details Section Routes
------------------------------ */

router.post('/api/after-ironing/first-output-details', saveqcwashingFirstOutput)
router.get('/api/after-ironing/check-measurement-details/:orderNo', getAfterIroningMeasurementData);
router.post('/api/after-ironing/find-existing', findAfterIroningExistingRecord);
// Check for any submitted record with the same order no and color
router.post("/api/after-ironing/check-submitted", checkAfterIroningSubmittedRecord);
router.post('/api/after-ironing/check-qc-washing', checkAfterIroningRecord);
router.post('/api/after-ironing/orderData-save', saveAfterIroningOrderData);
router.get('/api/after-ironing/saved-sizes/:orderNo/:color(*)',  cleanupColor, getqcwashingSavedColor);

/* ------------------------------
  Inspection Details Section Routes
------------------------------ */

router.post('/api/after-ironing/inspection-save', uploadInspectionImage.any(),  saveAfterIroningInspectionData);
router.post('/api/after-ironing/inspection-update',   uploadInspectionImage.any(), updateAfterIroningInspectionData);

/* ------------------------------
  Defect Details Section Routes
------------------------------ */

router.post('/api/after-ironing/defect-details-save', uploadDefectImage.any(), saveAfterIroningDefectData);
router.post('/api/after-ironing/defect-details-update', uploadDefectImage.any(), updateAfterIroningDefectData);

/* ------------------------------
  Measurement Details Section Routes
------------------------------ */

router.post('/api/after-ironing/find-saved-measurement', savedMeasurementDataSpec);
router.get('/api/after-ironing/order-sizes/:orderNo/:color(*)',  cleanupColor, getAfterIroningOrderSizes);
router.get('/api/after-ironing/measurement-specs/:orderNo', getmeasurmentSpec);

/* ------------------------------
  OverAll Summary Card Routes
------------------------------ */

router.post('/api/after-ironing/save-summary/:recordId', saveAfterIroningSummary);

/* ------------------------------
  Summary Card Routes
------------------------------ */
router.post('/api/after-ironing/measurement-summary-autosave/:recordId', updateAfterIroningMeasurementData);

/* ------------------------------
  Main page Routes
------------------------------ */
router.get('/api/after-ironing/overall-summary-by-id/:recordId', getAfterIroningOverAllSummary);
router.get('/api/after-ironing/order-color-qty/:orderNo/:color(*)',  cleanupColor, getAfterIroningOrderColorQty);
router.get('/api/after-ironing/order-numbers', getAfterIroningOrderNumbers);
router.get('/api/after-ironing/order-details-by-style/:orderNo', getAfterIroningOrderbysize);
router.get('/api/after-ironing/order-details-by-order/:orderNo', getAfterIroningOrderbyOrderNo);
router.get('/api/after-ironing/load-saved-by-id/:id', getAfterIroningSaveData);
router.post('/api/after-ironing/aql-chart/find-by-sample-size', saveAfterIroningAQLbySampleSize);
router.post('/api/after-ironing/aql-chart/find', saveAfterIroningAQLData);
router.post('/api/after-ironing/measurement-save', saveAfterIroningMeasurementData);
router.post('/api/after-ironing/measurement-size-save', saveAfterIroningMeasurementData);
router.get('/api/after-ironing/load-color-data/:orderNo/:color(*)',  cleanupColor, loadAfterIroningColorData);
router.get('/api/after-ironing/submitted/:id', getAfterIroningSubmittedData);
router.post('/api/after-ironing/submit', saveAfterIroning);

// Routes for defects and checklist
router.get('/api/after-ironing-defects', getAfterIroningDefects);
router.get('/api/after-ironing-checklist', getAfterIroningChecklist);

export default router;
