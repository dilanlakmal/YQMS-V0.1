import express from "express";
import {
  getQASectionsMeasurementSpecs,
  saveQASectionsMeasurementSpecs,
  getQASectionsMeasurementSpecsAW,
  saveQASectionsMeasurementSpecsAW,
  fixAllToleranceValues,
  fixTolerancesByOrder,
  previewToleranceIssues,
  applyBWSelectionToAW,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Controller.js";

// Import update controller
import {
  updateBWSpecsFromMasterData,
  updateAWSpecsFromMasterData,
  previewSpecsUpdate,
  repairCorruptedSpecs,
  repairAWTolerancesFromMaster,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Update_Controller.js";

// Import Name Swap Controller
import {
  previewNameSwap,
  executeNameSwap,
  validatePointNames,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Names_Controller.js";

const router = express.Router();

// Before Wash
router.get(
  "/api/qa-sections/measurement-specs/:moNo",
  getQASectionsMeasurementSpecs,
);
router.post(
  "/api/qa-sections/measurement-specs/save",
  saveQASectionsMeasurementSpecs,
);

// After Wash
router.get(
  "/api/qa-sections/measurement-specs-aw/:moNo",
  getQASectionsMeasurementSpecsAW,
);
router.post(
  "/api/qa-sections/measurement-specs-aw/save",
  saveQASectionsMeasurementSpecsAW,
);

// Fix Tolerance Values
router.post(
  "/api/qa-sections/measurement-specs/fix-tolerances",
  fixAllToleranceValues,
);
router.post(
  "/api/qa-sections/measurement-specs/fix-tolerances/:moNo",
  fixTolerancesByOrder,
);
router.get(
  "/api/qa-sections/measurement-specs/preview-tolerance-issues",
  previewToleranceIssues,
);
router.post(
  "/api/qa-sections/measurement-specs/apply-to-aw",
  applyBWSelectionToAW,
);

// =========================================================================
// Update Specs from Master Data Routes
// =========================================================================

// Update Before Wash Specs from Master Data
router.post(
  "/api/qa-sections/measurement-specs/update-from-master",
  updateBWSpecsFromMasterData,
);

// Update After Wash Specs from Master Data
router.post(
  "/api/qa-sections/measurement-specs-aw/update-from-master",
  updateAWSpecsFromMasterData,
);

// Preview what would be updated (works for both BW and AW)
router.post(
  "/api/qa-sections/measurement-specs/preview-update",
  previewSpecsUpdate,
);

// Repair corrupted specs (removes size: "index" and restores from master)
router.post(
  "/api/qa-sections/measurement-specs/repair-corrupted",
  repairCorruptedSpecs,
);

// Repair AW tolerances based on master data
router.post(
  "/api/qa-sections/measurement-specs-aw/repair-tolerances",
  repairAWTolerancesFromMaster,
);

// =========================================================================
// Name Swap Routes
// =========================================================================
router.post(
  "/api/qa-sections/measurement-specs/preview-name-swap",
  previewNameSwap,
);
router.post(
  "/api/qa-sections/measurement-specs/execute-name-swap",
  executeNameSwap,
);
router.post(
  "/api/qa-sections/measurement-specs/validate-point-names",
  validatePointNames,
);

export default router;
