import express from 'express';
import {
  getQC2PassbundleData,
  getQC2PassbundleDataByBundleRandomId,
  getQC2PassbundleDataByDefectPrintId,
  getAllQC2PassbundleData,
  getQC2Defect,
  getQC2SummaryData,
  getQC2SummaryDataByMoNo,
  getQC2DefectRates,
  getQC2DefectRatesByHour,
  getQC2DefectRatesByLine,
  getQC2OrderData,
  getQC2OrderDataSummary,
} from '../../controller/LiveDashboard/qc2DashboardController.js';

const router = express.Router();

router.get('/api/qc2-inspection-pass-bundle/filter-options', getQC2PassbundleData);
router.get('/api/qc2-inspection-pass-bundle-by-random-id/:bundle_random_id', getQC2PassbundleDataByBundleRandomId);
router.get('/api/qc2-inspection-pass-bundle-by-defect-print-id/:defect_print_id', getQC2PassbundleDataByDefectPrintId);
router.get('/api/qc2-inspection-pass-bundle/search', getAllQC2PassbundleData);
router.get('/api/qc2-defect-print/search', getQC2Defect);
router.get('/api/qc2-inspection-summary', getQC2SummaryData);
router.get('/api/qc2-mo-summaries', getQC2SummaryDataByMoNo);
router.get('/api/qc2-defect-rates', getQC2DefectRates);
router.get('/api/qc2-defect-rates-by-hour', getQC2DefectRatesByHour);
router.get('/api/qc2-defect-rates-by-line', getQC2DefectRatesByLine);
router.get('/api/qc2-orderdata/filter-options', getQC2OrderData);
router.get('/api/qc2-orderdata-summary', getQC2OrderDataSummary);



export default router;