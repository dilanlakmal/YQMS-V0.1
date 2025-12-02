import express from 'express';

import {
  // refreshActualWashQty,
  uploadQcRealWashQty,
  returnFilterData,
  getSummaryStatuctics,
  deleteWashingQty,
  getrealWashQty,
} from '../../controller/QC_Real_Wash_Qty_Upload/QcRealWashQtyController.js';
const router = express.Router();

// router.post('/api/qc-washing/refresh-actual-wash-qty', refreshActualWashQty);
router.post('/api/qc-washing-qty', uploadQcRealWashQty);
router.get('/api/qc-washing-qty', returnFilterData);
router.get('/api/qc-washing-qty/summary', getSummaryStatuctics);
router.delete('/api/qc-washing-qty', deleteWashingQty); 
router.get('/api/qc-real-washing-qty/search', getrealWashQty);

export default router;
