import express from "express";
import {
  getQASectionsMeasurementSpecs,
  saveQASectionsMeasurementSpecs,
  getQASectionsMeasurementSpecsAW,
  saveQASectionsMeasurementSpecsAW
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Controller.js";

const router = express.Router();

// Before Wash
router.get(
  "/api/qa-sections/measurement-specs/:moNo",
  getQASectionsMeasurementSpecs
);
router.post(
  "/api/qa-sections/measurement-specs/save",
  saveQASectionsMeasurementSpecs
);

// After Wash
router.get(
  "/api/qa-sections/measurement-specs-aw/:moNo",
  getQASectionsMeasurementSpecsAW
);
router.post(
  "/api/qa-sections/measurement-specs-aw/save",
  saveQASectionsMeasurementSpecsAW
);

export default router;
