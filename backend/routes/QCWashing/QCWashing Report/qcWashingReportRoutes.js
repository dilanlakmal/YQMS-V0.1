import express from "express";
import {
  getAllQCWashingSubmittedData,
  getQCWashingImageProxy,
  getQCWashingImgeSelected,
  getqcwashingPDF,
  getqcwashingResult,
  getqcwashingresultFilter,
  updateQCWashingQtySub,
  getIndividualImageProxy
} from "../../../controller/QCWashing/QCWashing Report/qcWashingReportController.js";

const router = express.Router();

/* ------------------------------
  Submitted washing Data Routes
------------------------------ */

router.get("/api/qc-washing/all-submitted", getAllQCWashingSubmittedData);
router.get("/api/image-proxy/:imageUrl(*)", getQCWashingImageProxy);
router.get(
  "/api/qc-washing/image-proxy-selected/:id",
  getQCWashingImgeSelected
);

/* ------------------------------
 QCWashing Result Routes
------------------------------ */

router.get("/api/qc-washing/results/filters", getqcwashingresultFilter);
router.get("/api/qc-washing/results", getqcwashingResult);
router.get("/api/qc-washing/pdf/:id", getqcwashingPDF);
router.get("/api/qc-washing/image-proxy/:encodedUrl", getIndividualImageProxy);

/* ------------------------------
 Sub-Con Edit Routes
------------------------------ */

router.put("/api/qc-washing/update-edited-wash-qty/:id", updateQCWashingQtySub);

export default router;
