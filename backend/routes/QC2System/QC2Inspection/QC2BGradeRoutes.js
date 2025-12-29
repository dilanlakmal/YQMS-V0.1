import express from "express";
import {
  saveBGradeData,
  getBGradeDataByDefectId,
  saveBGradeStock,
  getBGradeStockFilters,
  saveBGradeDefect,
  fixExistingBGradeQty,
} from '../../../controller/QC2System//QC2Inspection/QC2BGradeController.js';

const router = express.Router();

//B-Grade defect & defect tracking
router.post("/api/qc2-bgrade", saveBGradeData);
router.get(
  "/api/qc2-bgrade/by-defect-id/:defect_print_id",
  getBGradeDataByDefectId
);

//B-Grade stock
router.post("/api/b-grade-stock", saveBGradeStock);
router.get("/api/b-grade-stock/filter-options", getBGradeStockFilters);

//Confermation of B-Grade.
router.post('/api/b-grade-defects/process-decisions', saveBGradeDefect);
router.post('/api/fix-bgrade-qty', fixExistingBGradeQty);

export default router;
