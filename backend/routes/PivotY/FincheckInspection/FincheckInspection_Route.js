import express from "express";
import {
  getInspectionOrderDetails,
  searchInspectionOrders,
  getMultipleOrderDetails,
  findRelatedOrders,
  getOrderColors,
  getAqlConfigByBuyer,
  getSubConFactories,
  getOrderProductTypeInfo,
  getProductTypeOptions,
  updateOrderProductType,
  createInspectionReport,
  getInspectionReportById,
  checkExistingReport,
  updateHeaderData
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

// Get AQL configuration by buyer
router.get("/api/fincheck-inspection/aql-config", getAqlConfigByBuyer);

// Get Sub-Con Factories
router.get("/api/fincheck-inspection/subcon-factories", getSubConFactories);

// NEW: Get Product Type Info for Orders
router.post(
  "/api/fincheck-inspection/order-product-type",
  getOrderProductTypeInfo
);

// NEW: Get All Product Type Options for Dropdown
router.get(
  "/api/fincheck-inspection/product-type-options",
  getProductTypeOptions
);

// NEW: Update Product Type for Orders
router.put(
  "/api/fincheck-inspection/update-product-type",
  updateOrderProductType
);

// NEW: Create Inspection Report
router.post("/api/fincheck-inspection/create-report", createInspectionReport);

// NEW: Get Inspection Report by ID
router.get(
  "/api/fincheck-inspection/report/:reportId",
  getInspectionReportById
);

// NEW: Check Existing Report
router.post(
  "/api/fincheck-inspection/check-existing-report",
  checkExistingReport
);

// NEW: Save Header Data
router.post("/api/fincheck-inspection/update-header-data", updateHeaderData);

export default router;
