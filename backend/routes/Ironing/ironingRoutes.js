import express from 'express';
import {
  getIroningId,
  getLastIroningId,
  getDefectCardData,
  saveIroning,
  getIroningRecords,
  getIroningFilterOptions,
} from '../../Controller/Ironing/ironingController.js';

const router = express.Router();

router.get('/api/check-ironing-exists/:bundleId', getIroningId);
router.get('/api/last-ironing-record-id/:emp_id', getLastIroningId);
router.get('/api/check-defect-card/:defectPrintId', getDefectCardData);
router.post('/api/save-ironing', saveIroning);
router.get('/api/ironing-records', getIroningRecords);
router.get('/api/ironing-records/distinct-filters', getIroningFilterOptions);

export default router;