import express from 'express';
import {
  savePackingList,
} from '../../controller/PackingList/packingListController.js';

const router = express.Router();

router.post('/api/packing-list/upload', savePackingList);

export default router;