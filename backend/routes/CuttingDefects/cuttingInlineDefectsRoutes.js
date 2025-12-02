import express from "express";
import {
  getAllCuttingInlineDefects,
  initializeCuttingInlineDefects,
  createCuttingInlineDefect,
  updateCuttingInlineDefect,
  deleteCuttingInlineDefect
} from "../../controller/CuttingDefects/cuttingInlineDefectsController.js";

const router = express.Router();

// Get all cutting inline defects
router.get("/api/cutting-inline-defects", getAllCuttingInlineDefects);

// Initialize defects (run once)
router.post("/api/cutting-inline-defects/initialize", initializeCuttingInlineDefects);

// Create a new defect
router.post("/api/cutting-inline-defects", createCuttingInlineDefect);

// Update a defect
router.put("/api/cutting-inline-defects/:id", updateCuttingInlineDefect);

// Delete a defect
router.delete("/api/cutting-inline-defects/:id", deleteCuttingInlineDefect);

export default router;


