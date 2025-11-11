import express from 'express';
import {
  getQC2OrderData,
  getQC2OrderDataSummary,
} from '../../../controller/QC2System/QC2Inspection/QC2OrderDataDashboardController.js';

const router = express.Router();


router.get('/api/qc2-orderdata/filter-options', getQC2OrderData);
router.get('/api/qc2-orderdata-summary', getQC2OrderDataSummary);



export default router;