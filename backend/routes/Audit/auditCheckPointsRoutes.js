import express from 'express';
import {
  getMoNoSearch,
  getOrderDetails,
  getOrderSizes,
  getBundleQty,
  getTotalGarmentsCount,
} from '../../Controller/Audit/auditCheckPointsController.js';

const router = express.Router();

router.get('/api/search-mono', getMoNoSearch);
router.get('/api/order-details/:mono', getOrderDetails);
router.get('/api/order-sizes/:mono/:color', getOrderSizes);
router.get('/api/total-bundle-qty/:mono', getBundleQty);
router.get('/api/total-garments-count/:mono/:color/:size', getTotalGarmentsCount);

export default router;