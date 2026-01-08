import express from "express";
import {
  saveqc2UploadData,
  saveManualqc2UploadData,
  getQC2WorkerData,
  getQCWashingOldData
} from "../../controller/QC2_Upload_Data/qc2UploadController.js";

const router = express.Router();

router.post("/api/upload-qc2-data", saveqc2UploadData);
router.post("/api/manual-save-qc2-data", saveManualqc2UploadData);
router.get("/api/fetch-qc2-data", getQC2WorkerData);
router.get("/api/fetch-washing-qty-data", getQCWashingOldData);

export default router;
