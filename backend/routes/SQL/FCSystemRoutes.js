import express from "express";
import {
  getMarkerRatioData,
  getShrinkageTestData,
  getShrinkageSearchList,
  getShrinkageFieldValues,
  getDensityTestData,
  getDensitySearchList,
  getDensityFieldValues,
  getSeperationColorListData,
  getSeperationColorSearchList,
  getSeperationColorFieldValues,
  getCrockingTestData,
  getCrockingSearchList,
  getCrockingFieldValues,
  getSupplierEvaluationList,
  getSupplierEvaluationData,
} from "../../controller/SQL/FCSystemController.js";

const router = express.Router();

router.get("/api/fc-system/marker-ratio", getMarkerRatioData);

router.get("/api/fc-system/shrinkage-test", getShrinkageTestData);
router.get("/api/fc-system/shrinkage-test/search", getShrinkageSearchList);
router.get("/api/fc-system/shrinkage-test/dropdown", getShrinkageFieldValues);

router.get("/api/fc-system/density-test", getDensityTestData);
router.get("/api/fc-system/density-test/search", getDensitySearchList); // Summary List
router.get("/api/fc-system/density-test/dropdown", getDensityFieldValues); // Dropdown

router.get("/api/fc-system/seperation-color-list", getSeperationColorListData);
router.get(
  "/api/fc-system/seperation-color-list/search",
  getSeperationColorSearchList,
);
router.get(
  "/api/fc-system/seperation-color-list/dropdown",
  getSeperationColorFieldValues,
);

router.get("/api/fc-system/crocking-test", getCrockingTestData);
router.get("/api/fc-system/crocking-test/search", getCrockingSearchList);
router.get("/api/fc-system/crocking-test/dropdown", getCrockingFieldValues);

router.get(
  "/api/fc-system/supplier-evaluation/list",
  getSupplierEvaluationList,
);
router.get("/api/fc-system/supplier-evaluation", getSupplierEvaluationData);

export default router;