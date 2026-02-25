import express from "express";
import {
  saveCuttingInspection,
  getCuttingInspectionProgress,
  getCuttingInspectionMono,
  getCuttingInspectionTable,
  getCuttinginspectionDetail,
  updateCuttingInspection,
  getCuttingProductTypes,
} from "../../../controller/Cutting/CuttingInspection/cuttingInspectionController.js";

import {
  getInspectionDates,
  getMosByDate,
  getTablesByDateAndMo,
  getFullInspectionReport,
  updateFullInspectionReport,
  getFabricDefectsList,
  getCuttingIssuesList,
  getInspectionAQLStatus,
} from "../../../controller/Cutting/CuttingInspection/cuttingModifyController.js";

import { uploadImage } from "../../../controller/Cutting/CuttingInspection/cuttingImageUploadController.js";
import { getCuttingIssues } from "../../../controller/Cutting/CuttingInspection/cuttingIssueController.js";

import multer from "multer";

// Configure multer for memory storage (used by sharp)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

router.post("/api/save-cutting-inspection", saveCuttingInspection);
router.get("/api/cutting-inspection-progress", getCuttingInspectionProgress);
router.get("/api/cutting-inspections/mo-numbers", getCuttingInspectionMono);
router.get("/api/cutting-inspections/table-numbers", getCuttingInspectionTable);
router.get(
  "/api/cutting-inspection-details-for-modify",
  getCuttinginspectionDetail,
);
router.put("/api/cutting-inspection-update", updateCuttingInspection);

// ROUTE: Get unique moNo and their first garmentType
router.get("/api/cutting-inspections/product-types", getCuttingProductTypes);

// Image upload route (using existing controller)
router.post("/api/upload-cutting-image", upload.single("image"), uploadImage);

// Cutting issues route (using existing controller)
router.get("/api/cutting-issues", getCuttingIssues);

// Modify/Search Routes
router.get("/api/cutting-modify/dates", getInspectionDates);
router.get("/api/cutting-modify/mos", getMosByDate);
router.get("/api/cutting-modify/tables", getTablesByDateAndMo);
router.get("/api/cutting-modify/report", getFullInspectionReport);
router.put("/api/cutting-modify/update", updateFullInspectionReport);
router.get("/api/cutting-modify/aql-status", getInspectionAQLStatus);

// Defects list routes
router.get("/api/cutting-fabric-defects", getFabricDefectsList);
router.get("/api/cutting-issues-list", getCuttingIssuesList);

export default router;
