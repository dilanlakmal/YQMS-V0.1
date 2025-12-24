import express from "express";
import {
  saveCuttingInspection,
  getCuttingInspectionProgress,
  getCuttingInspectionMono,
  getCuttingInspectionTable,
  getCuttinginspectionDetail,
  updateCuttingInspection,
  getCuttingProductTypes
} from "../../../controller/Cutting/CuttingInspection/cuttingInspectionController.js";

const router = express.Router();

router.post("/api/save-cutting-inspection", saveCuttingInspection);
router.get("/api/cutting-inspection-progress", getCuttingInspectionProgress);
router.get("/api/cutting-inspections/mo-numbers", getCuttingInspectionMono);
router.get("/api/cutting-inspections/table-numbers", getCuttingInspectionTable);
router.get(
  "/api/cutting-inspection-details-for-modify",
  getCuttinginspectionDetail
);
router.put("/api/cutting-inspection-update", updateCuttingInspection);

// ROUTE: Get unique moNo and their first garmentType
router.get("/api/cutting-inspections/product-types", getCuttingProductTypes);

export default router;
