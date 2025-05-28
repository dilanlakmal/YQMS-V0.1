import express from 'express';
import {
  saveQC2Data,
  updateQC2InspectionData,
  saveQC2ReworksData,
  createDefectPrintRecord,
  searchDefectPrintRecords,
  fetchAllDefectPrintRecords,
  getDefectPrintRecordsByDefectId,
  getQC2InspectionData,
  editInspectionData,
} from '../../Controller/QC2Inspection/qc2InspectionController.js';

const router = express.Router();

router.post('/api/inspection-pass-bundle', saveQC2Data);
router.put('/api/qc2-inspection-pass-bundle/:bundle_random_id', updateQC2InspectionData);
router.post('/api/reworks', saveQC2ReworksData);
router.post('/api/qc2-defect-print', createDefectPrintRecord);
router.get('/api/qc2-defect-print/search', searchDefectPrintRecords);
router.get('/api/qc2-defect-print', fetchAllDefectPrintRecords);
router.get('/api/qc2-defect-print/filter-options', getQC2InspectionData);
router.get('/api/qc2-defect-print/:defect_id', getDefectPrintRecordsByDefectId);
router.put('/api/qc2-inspection-pass-bundle/:id', editInspectionData);


export default router;