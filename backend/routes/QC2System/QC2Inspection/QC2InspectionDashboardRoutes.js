import express from 'express';
import {
  getQC2SummaryData,
  getQC2SummaryDataByMoNo,
  getQC2DefectRates,
  getQC2DefectRatesByHour,
  getQC2DefectRatesByLine,
} from '../../../controller/QC2System/QC2Inspection/QC2InspectionDashboardController.js';

const router = express.Router();

router.get('/api/qc2-inspection-summary', getQC2SummaryData);
router.get('/api/qc2-mo-summaries', getQC2SummaryDataByMoNo);
router.get('/api/qc2-defect-rates', getQC2DefectRates);
router.get('/api/qc2-defect-rates-by-hour', getQC2DefectRatesByHour);
router.get('/api/qc2-defect-rates-by-line', getQC2DefectRatesByLine);



export default router;