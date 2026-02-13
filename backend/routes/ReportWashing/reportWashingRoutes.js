import express from "express";
import {
  saveReportWashing,
  getReportWashing,
  getReportWashingById,
  updateReportWashing,
  deleteReportWashing,
  getWashingMachineTestImage,
  getUniqueStyles,
  getUniqueColors,
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
router.get("/api/report-washing/:id", getReportWashingById);
router.put(
  "/api/report-washing/:id",
  uploadWashingMachineTestImage.fields([
    { name: "images", maxCount: 10 },
    { name: "receivedImages", maxCount: 10 },
    { name: "completionImages", maxCount: 10 },
    { name: "careLabelImage", maxCount: 10 }
  ]), // Allow up to 10 images for initial, received, and completion, and care label image array
  updateReportWashing
);
router.delete("/api/report-washing/:id", deleteReportWashing);

// QR Code Scan route
router.patch("/api/report-washing/:id/scan-received", scanReceived);

// Route to serve washing machine test images
router.get("/api/report-washing/image/:filename", getWashingMachineTestImage);

// Autocomplete routes
router.get("/api/report-washing/autocomplete/styles", getUniqueStyles);
router.get("/api/report-washing/autocomplete/colors", getUniqueColors);

export default router;

