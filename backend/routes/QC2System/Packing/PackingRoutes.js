import express from 'express';
import {
  
  updateScanData,
  savePacking,
  getPackingRecords,
  getPackingFilterOptions,
} from '../../../controller/QC2System/Packing/PackingController.js';

const router = express.Router();

router.post('/api/packing/get-scan-data', updateScanData)
router.post('/api/packing/save-record', savePacking);
router.get('/api/packing/get-all-records', getPackingRecords);
router.get('/api/packing-records/distinct-filters', getPackingFilterOptions);

export default router;