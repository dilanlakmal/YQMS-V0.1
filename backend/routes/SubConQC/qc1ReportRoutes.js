import express from 'express';
import {
  getSubConSewingQC1Rport,
  addSubConSewingQC1Report,
  updateSubConSewingQC1Report,
  getSubConQC1SewingReportData,
  getSubConQAUserInfo,
} from '../../controller/SubConQC/qc1ReportController.js';

const router = express.Router();

router.get('/api/subcon-sewing-qc1-report/find', getSubConSewingQC1Rport);
router.post('/api/subcon-sewing-qc1-reports', addSubConSewingQC1Report);
router.put('/api/subcon-sewing-qc1-reports/:id', updateSubConSewingQC1Report);
router.get('/api/subcon-sewing-qc1-report-data', getSubConQC1SewingReportData);
router.get('/api/user-info-subcon-qa/:empId', getSubConQAUserInfo);

export default router;