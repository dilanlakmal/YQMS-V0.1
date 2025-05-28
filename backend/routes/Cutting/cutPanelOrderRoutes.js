import express from 'express';
import {
  getCutpanelOrderMoNo,
  getCutpanelOrderTableNo,
  getCutpanelOrderDetails,
  getCutpanelOrderTatalQty,
  getCutpanelOrderAggreTotalQty,
  getCutpanelOrderAggreTotalQtyPerMo,
} from '../../Controller/Cutting/cutPanelOrderController.js';

const router = express.Router();

router.get('/api/cutpanel-orders-mo-numbers', getCutpanelOrderMoNo);
router.get('/api/cutpanel-orders-table-nos', getCutpanelOrderTableNo);
router.get('/api/cutpanel-orders-details', getCutpanelOrderDetails);
router.get('/api/cutpanel-orders-total-order-qty', getCutpanelOrderTatalQty);
router.get('/api/cutpanel-orders/aggregated-total-order-qty', getCutpanelOrderAggreTotalQty); 
router.get('/api/cutpanel-orders/aggregated-total-order-qty', getCutpanelOrderAggreTotalQtyPerMo); //mention same endpoint name but deferent implementation

export default router;