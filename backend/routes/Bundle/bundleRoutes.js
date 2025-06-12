import express from 'express';
import {
  getMoNoSearch,
  getOrderDetails,
  getOrderSizes,
  getBundleQty,
  getTotalGarmentsCount,
  getAvailableColors,
  getAvailableSizes,
  saveBundleData,
  editBundleData,
  getUserBatchers,
  checkBundleIdExists,
  updateQC2OrderData,
  searchQC2OrderData,
  fetchColorsAndSizes,
  getDistinctFilters,
  fetchFilteredBundleData,
  getHourlySummary,
  getDistinctReprintFilters,
} from '../../Controller/Bundle/bundleController.js';

const router = express.Router();

router.get('/api/search-mono', getMoNoSearch);
router.get('/api/order-details/:mono', getOrderDetails);
router.get('/api/order-sizes/:mono/:color', getOrderSizes);
router.get('/api/total-bundle-qty/:mono', getBundleQty);
router.get('/api/total-garments-count/:mono/:color/:size', getTotalGarmentsCount);
router.get('/api/colors', getAvailableColors);
router.get('/api/size', getAvailableSizes);
router.post('/api/save-bundle-data', saveBundleData);
router.put('/api/update-bundle-data/:id', editBundleData);
router.get('/api/user-batches', getUserBatchers);
router.post('/api/check-bundle-id', checkBundleIdExists);
router.put('/api/update-qc2-orderdata/:bundleId', updateQC2OrderData);
router.get('/api/reprint-search', searchQC2OrderData);
router.get('/api/reprint-colors-sizes/:mono', fetchColorsAndSizes);
router.get('/api/qc2-order/distinct-filters', getDistinctFilters);
router.get('/api/filtered-bundle-data', fetchFilteredBundleData);
router.get('/api/qc2-order/hourly-summary', getHourlySummary);
router.get('/api/reprint-distinct-filters', getDistinctReprintFilters);

export default router;