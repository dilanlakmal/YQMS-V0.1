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
  updateNewKValueSpecs,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Update_Controller.js";

// Import Name Swap Controller
import {
  previewNameSwap,
  executeNameSwap,
  validatePointNames,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Names_Controller.js";

// Import ID Correction Controller
import {
  searchFincheckOrders,
  previewMeasurementIdMapping,
  executeMeasurementIdUpdate,
  checkQASpecsExists,
  analyzeSourceOrder,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_ID_Correction_Controller.js";

const router = express.Router();

// =========================================================================
// ID Correction Routes (From Fincheck Reports)
// =========================================================================

// Search fincheck orders
router.get(
  "/api/qa-sections/measurement-specs/search-fincheck-orders",
  searchFincheckOrders,
);

// Analyze source order for available measurement data
router.get(
  "/api/qa-sections/measurement-specs/analyze-source/:orderNo",
  analyzeSourceOrder,
);

// Check if QA specs exist for an order
router.get(
  "/api/qa-sections/measurement-specs/check-qa-specs/:orderNo",
  checkQASpecsExists,
);

// Preview ID mapping (auto-analyzes all reports)
router.post(
  "/api/qa-sections/measurement-specs/preview-id-mapping",
  previewMeasurementIdMapping,
);

// Execute ID update
router.post(
  "/api/qa-sections/measurement-specs/execute-id-update",
  executeMeasurementIdUpdate,
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

// Update K value specs based on master data
router.post(
  "/api/qa-sections/measurement-specs/update-new-kvalue",
  updateNewKValueSpecs,
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

// =========================================================================
// Parameter Routes
// =========================================================================

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

export default router;
