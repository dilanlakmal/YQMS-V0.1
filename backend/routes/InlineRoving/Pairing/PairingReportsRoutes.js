import express from "express";
import {
  getDynamicFilterOptions,
  getRovingPairingReportData
} from "../../../controller/InlineRoving/Pairing/PairingReportsController.js";

const router = express.Router();

router.get("/api/roving-pairing/filters", getDynamicFilterOptions);
router.get("/api/roving-pairing/report-data", getRovingPairingReportData);

export default router;
