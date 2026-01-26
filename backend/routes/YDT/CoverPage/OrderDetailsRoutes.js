import express from 'express';
import{
  searchOrderSuggestions,
  getOrderDetails,
} from "../../../controller/YDT/CoverPage/OrderDetailsController.js";

const router = express.Router();

router.get('/api/coverPage/orders/search', searchOrderSuggestions);
router.get('/api/coverPage/orders/:orderNo', getOrderDetails);


export default router;