import express from 'express';
import {
  getMoNoSearch,
  getOrderDetails,
  getOrderSizes,
  saveWashingSpecs,
} from '../../controller/Common/DTOrdersController.js';

const router = express.Router();

router.get('/api/search-mono', getMoNoSearch);
router.get('/api/order-details/:mono', getOrderDetails);
router.get('/api/order-sizes/:mono/:color', getOrderSizes);
router.post('/api/washing-specs/save', saveWashingSpecs);

export default router;