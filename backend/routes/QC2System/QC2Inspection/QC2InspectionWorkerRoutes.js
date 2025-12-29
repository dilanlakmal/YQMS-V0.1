import express from "express";
import {
  getWorkerdate,
  getWorkerCurrentData
} from "../../../controller/QC2System/QC2Inspection/QC2InspectionWorkerController.js";

const router = express.Router();

router.post('/api/qc2-workers-data/log-scan', getWorkerdate);
router.get('/api/qc2-workers-data/today/:qc_id', getWorkerCurrentData);

export default router;
