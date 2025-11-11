import express from "express";
import {
  saveYorksysOrderData,
  getYorksysOrderFilterOptions,
  getYorksysOrdersPagination,
  getYorksysOrder
} from "../../controller//YorksysOrders/uploadOrderController.js";

const router = express.Router();

router.post("/api/yorksys-orders/save", saveYorksysOrderData);

// Route to get unique values for filter dropdowns
router.get("/api/yorksys-orders/filters", getYorksysOrderFilterOptions);

// Route to get all orders with pagination
router.get("/api/yorksys-orders", getYorksysOrdersPagination);

router.get("/api/yorksys-orders/:moNo", getYorksysOrder);

export default router;
