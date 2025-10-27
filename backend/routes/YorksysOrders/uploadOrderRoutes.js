import express from 'express';
import {
  saveYorksysOrderData,
  getYorksysOrder,
} from '../../controller//YorksysOrders/uploadOrderController.js';

const router = express.Router();

router.post('/api/yorksys-orders/save', saveYorksysOrderData);
router.get('/api/yorksys-orders/:moNo', getYorksysOrder);

export default router;