import express from 'express';
import{
  searchOrderSuggestions,
  getOrderDetails,
  saveOrderDetails,
  getSavedOrderDetails
} from "../../../controller/YDT/CoverPage/OrderDetailsController.js";

const router = express.Router();

router.get('/api/coverPage/orders/search', searchOrderSuggestions);
router.get('/api/coverPage/orders/:orderNo', getOrderDetails);
router.post('/api/coverPage/orders/:orderNo/save', saveOrderDetails);
router.get('/api/coverPage/orders/:orderNo/saved', getSavedOrderDetails);

export default router;