import express from "express";
import {
  saveReportWashing,
  getReportWashing,
  getReportWashingById,
  updateReportWashing,
  deleteReportWashing,
  getUniqueStyles,
  getUniqueColors,
  getUsedColors,
  scanReceived
} from "../../controller/ReportWashing/reportWashingController.js";
import { uploadWashingMachineTestImage } from "../../helpers/helperFunctions.js";

const router = express.Router();

router.post(
  "/api/report-washing/submit",
  uploadWashingMachineTestImage.fields([
    { name: "images", maxCount: 10 },
    { name: "careLabelImage", maxCount: 10 }
  ]),
  saveReportWashing
);

router.get("/api/report-washing", getReportWashing);
router.get("/api/report-washing/used-colors", getUsedColors);
router.get("/api/report-washing/:id", getReportWashingById);

router.put(
  "/api/report-washing/:id",
  uploadWashingMachineTestImage.fields([
    { name: "images", maxCount: 10 },
    { name: "receivedImages", maxCount: 10 },
    { name: "completionImages", maxCount: 10 },
    { name: "careLabelImage", maxCount: 10 }
  ]),
  updateReportWashing
);

router.delete("/api/report-washing/:id", deleteReportWashing);

// QR Code Scan route
router.patch("/api/report-washing/:id/scan-received", scanReceived);

// Autocomplete routes
router.get("/api/report-washing/autocomplete/styles", getUniqueStyles);
router.get("/api/report-washing/autocomplete/colors", getUniqueColors);

export default router;
