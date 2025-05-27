import express from 'express';
import {
  getDefectPrintRecordsByDefectId,
  saveRepairTrackingData,
  updateDefectStatus,
  updatePassBundleStatus,
  updateDefectStatusByName,
  saveScanData,
  getScanCount,
} from '../../Controller/QC2RepairTracking/qc2RepairTrackingController.js';

const router = express.Router();

router.get('/api/defect-track/:defect_print_id', getDefectPrintRecordsByDefectId);
router.post('/api/repair-tracking', saveRepairTrackingData);
router.post('/api/qc2-repair-tracking/update-defect-status', updateDefectStatus);
router.post('/api/qc2-repair-tracking/update-pass-bundle-status', updatePassBundleStatus);
router.post('/api/qc2-repair-tracking/update-defect-status-by-name', updateDefectStatusByName);
router.post('/api/save-qc2-scan-data', saveScanData);
router.post('/api/get-current-scan-count/:bundle_random_id', getScanCount);

export default router;