import express from "express";
import {
  getInspectionOrderDetails,
  searchInspectionOrders,
  getMultipleOrderDetails,
  findRelatedOrders,
  getOrderColors
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Controller.js";

const router = express.Router();

// Search orders for inspection (supports mode: single, multi)
router.get("/api/fincheck-inspection/search-orders", searchInspectionOrders);

// Get single order details for inspection
router.get(
  "/api/fincheck-inspection/order-details/:moNo",
  getInspectionOrderDetails
);

// Get multiple order details (for Multi/Batch mode)
router.post(
  "/api/fincheck-inspection/multiple-order-details",
  getMultipleOrderDetails
);

// Find related orders by base order number
router.get("/api/fincheck-inspection/find-related-orders", findRelatedOrders);

// Get distinct colors for selected orders
router.post("/api/fincheck-inspection/order-colors", getOrderColors);

export default router;
