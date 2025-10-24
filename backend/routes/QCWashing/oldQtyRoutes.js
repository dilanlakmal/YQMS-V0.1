import express from 'express';
import {
  getQCWashingQty,
  searchQCWashingQty,
} from '../../controller/QCWashing/oldQtyController.js';

const router = express.Router();

router.get('/api/qc-washing/wash-qty', getQCWashingQty);
router.get('/api/qc-washing/search-wash-qty', searchQCWashingQty);

export default router;