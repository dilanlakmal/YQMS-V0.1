import express from 'express';
import {
  getBundleQty,
  getTotalGarmentsCount,
  saveBundleData,
  getBundleByRandomId,
  checkBundleIdExists,
  updateQC2OrderData,
} from '../../../controller/QC2System/BundleRegistration/BundleregisrationInspectionController.js';

const router = express.Router();

router.get('/api/total-bundle-qty/:mono', getBundleQty);
router.get('/api/total-garments-count/:mono/:color/:size', getTotalGarmentsCount);
router.post('/api/save-bundle-data', saveBundleData);
//Common route for Ironing, washing and opa
router.get('/api/bundle-by-random-id/:randomId', getBundleByRandomId);
router.post('/api/check-bundle-id', checkBundleIdExists);
router.put('/api/update-qc2-orderdata/:bundleId', updateQC2OrderData);

export default router;