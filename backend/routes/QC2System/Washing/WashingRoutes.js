import express from 'express';
import {
  // getBundleId,
  getWashingTaskAccess,
  getWasgingId,
  getWashDefectId,
  getLasrWashId,
  saveWash,
  getWasingRecord,
  getWashingFilterOptions,
} from '../../../controller/QC2System/Washing/WashingContrller.js';

const router = express.Router();

// router.get('/api/bundle-by-random-id/:randomId', getBundleId);
router.get('/api/get-washing-task-access/:emp_id', getWashingTaskAccess);
router.get('/api/check-washing-exists/:bundleId', getWasgingId);
router.get('/api/check-defect-card-washing/:defectPrintId', getWashDefectId);
router.get('/api/last-washing-record-id/:emp_id', getLasrWashId);
router.post('/api/save-washing', saveWash);
router.get('/api/washing-records', getWasingRecord);
router.get('/api/washing-records/distinct-filters', getWashingFilterOptions);


export default router;