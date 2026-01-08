import express from 'express';
import {
  getCutpanelOrderMoNo,
  getCutpanelOrderTableNo,
  getCutpanelOrderDetails,
  getCutpanelOrderTatalQty,
  getCutpanelOrderAggreTotalQty,
} from '../../../controller/Cutting/Cutting_Orders/cutPanelOrderController.js';

const router = express.Router();

router.get('/api/cutpanel-orders-mo-numbers', getCutpanelOrderMoNo);
router.get('/api/cutpanel-orders-table-nos', getCutpanelOrderTableNo);
router.get('/api/cutpanel-orders-details', getCutpanelOrderDetails);
router.get('/api/cutpanel-orders-total-order-qty', getCutpanelOrderTatalQty);
router.get('/api/cutpanel-orders/aggregated-total-order-qty', getCutpanelOrderAggreTotalQty);

export default router;