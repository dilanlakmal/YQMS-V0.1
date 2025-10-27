import express from 'express';
import {
  saveSubconQAReport,
  getSubConSewingQAReport,
  updateSubConSewingQAReport,
  proxyPDF,
  getSubConQAInspectionData,
  getSubConQCInspectionDataByID,
} from '../../controller/SubConQA/qaReportController.js';

const router = express.Router();

router.post('/api/subcon-sewing-qa-reports', saveSubconQAReport);
router.get('/api/subcon-sewing-qa-report/find',  getSubConSewingQAReport);
router.put('/api/subcon-sewing-qa-reports/:id', updateSubConSewingQAReport);
router.get('/api/image-proxy', proxyPDF);
router.get('/api/subcon-qa-inspection-data', getSubConQAInspectionData);
router.get('/api/subcon-qa-inspection-data/:reportId', getSubConQCInspectionDataByID);

export default router;