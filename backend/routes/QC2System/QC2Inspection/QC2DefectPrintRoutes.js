import express from 'express';
import {
  createDefectPrintRecord,
  searchDefectPrintRecords,
  fetchAllDefectPrintRecords,
  getDefectPrintRecordsByDefectId,
} from '../../../controller/QC2System/QC2Inspection/QC2DefectPrintController.js';

const router = express.Router();

router.post('/api/qc2-defect-print', createDefectPrintRecord);
router.get('/api/qc2-defect-print/search', searchDefectPrintRecords);
router.get('/api/qc2-defect-print', fetchAllDefectPrintRecords);

router.get('/api/qc2-defect-print/:defect_id', getDefectPrintRecordsByDefectId);






export default router;