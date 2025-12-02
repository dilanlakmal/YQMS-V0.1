import express from "express";
import {
  getCuttingInlineOrderByBarcode,
  getAllCuttingInlineOrders,
  createCuttingInlineOrder,
  updateCuttingInlineOrder,
  deleteCuttingInlineOrder,
  debugDatabase
} from "../../controller/CuttingDefects/cuttingInlineOrdersController.js";

const router = express.Router();

// Get cutting inline order by barcode
router.get("/api/cutting-inline-orders/barcode/:barcode", getCuttingInlineOrderByBarcode);

// Get all cutting inline orders with optional filters
router.get("/api/cutting-inline-orders", getAllCuttingInlineOrders);

// Create a new cutting inline order
router.post("/api/cutting-inline-orders", createCuttingInlineOrder);

// Update cutting inline order
router.put("/api/cutting-inline-orders/:id", updateCuttingInlineOrder);

// Delete cutting inline order
router.delete("/api/cutting-inline-orders/:id", deleteCuttingInlineOrder);

// Debug endpoint to check database and collections
router.get("/api/cutting-inline-orders/debug", debugDatabase);

export default router;
