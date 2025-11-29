import express from "express";
import {
  getInspectionOrderDetails,
  searchInspectionOrders
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Controller.js";

const router = express.Router();

// Search orders for inspection
router.get("/api/fincheck-inspection/search-orders", searchInspectionOrders);

// Get order details for inspection
router.get(
  "/api/fincheck-inspection/order-details/:moNo",
  getInspectionOrderDetails
);

export default router;
