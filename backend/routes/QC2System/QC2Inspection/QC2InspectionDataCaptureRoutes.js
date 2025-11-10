import express from 'express';
import {
  saveQC2Data,
  updateQC2InspectionData,
  editInspectionData
} from '../../../controller/QC2System/QC2Inspection/QC2InspectionDataCaptureController.js';

const router = express.Router();

router.post('/api/inspection-pass-bundle', saveQC2Data);
router.put('/api/qc2-inspection-pass-bundle/:bundle_random_id', updateQC2InspectionData);
router.put('/api/qc2-inspection-pass-bundle/:id', editInspectionData);



export default router;