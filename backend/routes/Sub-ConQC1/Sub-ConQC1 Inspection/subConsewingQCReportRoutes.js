import express from 'express';
import {

  getSubConQC1SewingReportData,
  getSubConQAUserInfo,
} from '../../../controller/Sub-ConQC1/Sub-ConQC1 Inspection/subConsewingQCReportController.js';

const router = express.Router();


router.get('/api/subcon-sewing-qc1-report-data', getSubConQC1SewingReportData);
router.get('/api/user-info-subcon-qa/:empId', getSubConQAUserInfo);

export default router;