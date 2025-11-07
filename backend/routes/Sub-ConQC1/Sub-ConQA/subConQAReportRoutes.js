import express from 'express';
import {
  
  getSubConQAInspectionData,
  getSubConQCInspectionDataByID,
} from '../../../controller/Sub-ConQC1/Sub-ConQA/subConQAReportController.js';

const router = express.Router();

router.get('/api/subcon-qa-inspection-data', getSubConQAInspectionData);
router.get('/api/subcon-qa-inspection-data/:reportId', getSubConQCInspectionDataByID);

export default router;