import express from 'express';
import {
  searchMoNumbers,
  getInlineOrderDetails,
} from '../../../controller/InlineRoving/Roving/RovingInlineOrdersController.js';


const router = express.Router();

router.get('/api/inline-orders-mo-numbers',  searchMoNumbers );
router.get('/api/inline-orders-details',  getInlineOrderDetails );

export default router;