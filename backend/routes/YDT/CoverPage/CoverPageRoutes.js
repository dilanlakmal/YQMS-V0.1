import express from 'express';
import {
  searchOrderNo,
  getOrderDetails,
} from '../../../controller/YDT/CoverPage/CoverPageController.js';

const router = express.Router();

router.get('/api/coverPage/orders/search',  searchOrderNo );
router.get('/api/coverPage/orders/:orderNo',  getOrderDetails);

export default router;
