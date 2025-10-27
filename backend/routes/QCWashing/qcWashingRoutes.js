import express from 'express';
import {
  getQCWashingDefaltImagePlaceholder,
  getQCWashingImageProxy,
  getQCWashingImgeSelected,
  getqcwashingPDF,
  getqcwashingResult,
  getqcwashingresultFilter,
  getqcwashingOrderbysize,
  getqcwashingOrderColorQty, 
  getqcwashingOrderSizes,
  getmeasurmentSpec,
  getqcWashingOrderbyOrderNo,
  qcwashingaveSize,
  getqcwashingSavedColor,
  saveqcwashing,
  loadqcwashingColorData,
  getqcwashingSavedColors,
  getqcwashingOrderNumbers,
  updateqcwashing,
  saveqwashingSummary,
  getqcwashingOverAllSummary,
  updateqcwashingRecalculater,
  saveqcwashingAQLbySampleSize,
  saveqcWashinAQLData,
  saveqcwashingFirstOutput,
  getqcwashingSavedData,
  checkqcwashingSubmitedData,
  saveQCWashingOrderData,
  getQCWashingMeasurementData,
  findQCWashingExistingRecord,
  getQCWashingSaveData,
  saveQCWashingInspectionData,
  updateQCWashingInspectionData,
  saveQCWashingDefectData,
  updateQCWashingDefectData,
  saveQCWashingMeasurementData,
  updateQCWashingMeasurementData,
  getQCWashingSubmittedData,
  getQCWashingComparison,
  useAditionalImageSaving,
  getQCWashingImageFilename,
  updateQCWashingQty,
  updateQCWashingQtySub,
  getAllQCWashingSubmittedData,
} from '../../controller/QCWashing/qcWashingController.js';
import { uploadInspectionImage, uploadDefectImage} from "../../Helpers/helperFunctions.js";

const router = express.Router();

router.get('/storage/qc2_images/default-placeholder.png', getQCWashingDefaltImagePlaceholder);
router.get('/api/image-proxy/:imageUrl(*)', getQCWashingImageProxy);
router.get('/api/image-proxy-selected/:id', getQCWashingImgeSelected);
router.get('/api/qc-washing/pdf/:id', getqcwashingPDF);
router.get('/api/qc-washing/results', getqcwashingResult);
router.get('/api/qc-washing/results/filters', getqcwashingresultFilter);
router.get('/api/qc-washing/order-details-by-style/:orderNo', getqcwashingOrderbysize);
router.get('/api/qc-washing/order-color-qty/:orderNo/:color', getqcwashingOrderColorQty )
router.get('/api/qc-washing/order-sizes/:orderNo/:color', getqcwashingOrderSizes);
router.get('/api/qc-washing/measurement-specs/:orderNo/:color', getmeasurmentSpec);
router.get('/api/qc-washing/order-details-by-order/:orderNo', getqcWashingOrderbyOrderNo);
router.post('/api/qc-washing/save-size', qcwashingaveSize);
router.get('/api/qc-washing/saved-sizes/:orderNo/:color', getqcwashingSavedColor);
router.post('/api/qc-washing/submit', saveqcwashing);
router.get('/api/qc-washing/load-color-data/:orderNo/:color', loadqcwashingColorData);
router.get('/api/qc-washing/saved-colors/:orderNo', getqcwashingSavedColors);
router.get('/api/qc-washing/order-numbers', getqcwashingOrderNumbers);
router.put('/api/qc-washing/update/:recordId', updateqcwashing);
router.post('/api/qc-washing/save-summary/:recordId', saveqwashingSummary);
router.get('/api/qc-washing/overall-summary-by-id/:recordId', getqcwashingOverAllSummary);
router.post('/api/qc-washing/recalculate-overall-result/:recordId', updateqcwashingRecalculater);
router.post('/api/qc-washing/aql-chart/find-by-sample-size', saveqcwashingAQLbySampleSize);
router.post('/api/qc-washing/aql-chart/find', saveqcWashinAQLData);
router.post('/api/qc-washing/first-output-details', saveqcwashingFirstOutput);
router.get('/api/qc-washing/load-submitted/:orderNo', getqcwashingSavedData);
router.get('/api/qc-washing/check-submitted/:orderNo', checkqcwashingSubmitedData);
router.post('/api/qc-washing/orderData-save', saveQCWashingOrderData);
router.get('/api/qc-washing/check-measurement-details/:orderNo', getQCWashingMeasurementData);
router.post('/api/qc-washing/find-existing', findQCWashingExistingRecord);
router.get('/api/qc-washing/load-saved-by-id/:id', getQCWashingSaveData);
router.post('/api/qc-washing/inspection-save', uploadInspectionImage.any(),  saveQCWashingInspectionData);
router.post('/api/qc-washing/inspection-update',   uploadInspectionImage.any(), updateQCWashingInspectionData);
router.post('/api/qc-washing/defect-details-save', uploadDefectImage.any(), saveQCWashingDefectData);
router.post('/api/qc-washing/defect-details-update', uploadDefectImage.any(), updateQCWashingDefectData);
router.post('/api/qc-washing/measurement-save', saveQCWashingMeasurementData);
router.post('/api/qc-washing/measurement-summary-autosave/:recordId', updateQCWashingMeasurementData);
router.get('/api/qc-washing/submitted/:id', getQCWashingSubmittedData);
router.get('/api/qc-washing/comparison', getQCWashingComparison);
router.use('/storage', useAditionalImageSaving);
router.get('/api/storage/qc_washing_images/:type/:filename', getQCWashingImageFilename);
router.put('/api/qc-washing/update-wash-qty/:id', updateQCWashingQty);
router.put('/api/qc-washing/update-edited-wash-qty/:id', updateQCWashingQtySub);
router.get('/api/qc-washing/all-submitted', getAllQCWashingSubmittedData);

export default router;