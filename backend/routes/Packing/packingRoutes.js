import express from 'express';
import {
  getBundleId,
  getPackingId,
  getLastPackingId,
  getDefectCardData,
  savePacking,
  getPackingRecords,
  getPackingFilterOptions,
} from '../../Controller/Packing/packingController.js';

const router = express.Router();

router.get('/api/bundle-by-random-id/:randomId', getBundleId);
router.get('/api/check-packing-exists/:bundleId', getPackingId);
router.get('/api/last-packing-record-id/:emp_id', getLastPackingId);
router.get('/api/check-defect-card/:defectPrintId', getDefectCardData);
router.post('/api/save-packing', savePacking);
router.get('/api/packing-records', getPackingRecords);
router.get('/api/packing-records/distinct-filters', getPackingFilterOptions);

export default router;