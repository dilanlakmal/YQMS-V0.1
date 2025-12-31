import express from "express";
import {
  saveReportWashing,
  getReportWashing,
  getReportWashingById,
  updateReportWashing,
  deleteReportWashing,
  getWashingMachineTestImage
} from "../../controller/ReportWashing/reportWashingController.js";
import { uploadWashingMachineTestImage } from "../../helpers/helperFunctions.js";

const router = express.Router();

router.post(
  "/api/report-washing/submit",
  uploadWashingMachineTestImage.array("images", 10), // Allow up to 10 images
  saveReportWashing
);
router.get("/api/report-washing", getReportWashing);
router.get("/api/report-washing/:id", getReportWashingById);
router.put(
  "/api/report-washing/:id",
  uploadWashingMachineTestImage.fields([
    { name: "images", maxCount: 10 },
    { name: "receivedImages", maxCount: 10 },
    { name: "completionImages", maxCount: 10 }
  ]), // Allow up to 10 images for initial, received, and completion
  updateReportWashing
);
router.delete("/api/report-washing/:id", deleteReportWashing);

// Route to serve washing machine test images
router.get("/api/report-washing/image/:filename", getWashingMachineTestImage);

export default router;

