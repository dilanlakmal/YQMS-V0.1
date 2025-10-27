import express from 'express';
import {
  getBuyerSpecMoNos,
  getBuyerSpecData,
  getAnfSpecTable,
  saveBuyerSpecReport,
  updateReportStatus,
  getReportData,
  getFilterOptions,
  getSummaryData,
  getFullReport,
  getDailyReports,
  getDynamicFilterOptions,
  getDailyFullReport,
  getanfStyleViewSummary,
  getStyleViewFullReport,
} from '../../controller/ANF/anfController.js';

const router = express.Router();

router.get('/api/anf-measurement/mo-options', getBuyerSpecMoNos);
router.get('/api/anf-measurement/mo-details/:moNo', getBuyerSpecData);
router.get('/api/anf-measurement/spec-table', getAnfSpecTable);
router.post('/api/anf-measurement/reports', saveBuyerSpecReport);
router.put('/api/anf-measurement/reports/status', updateReportStatus);
router.get('/api/anf-measurement/existing-data', getReportData);
router.get('/api/anf-measurement/results/filters', getFilterOptions);
router.get('/api/anf-measurement/results/summary', getSummaryData);
router.get('/api/anf-measurement/results/full-report-detail', getFullReport);
router.get('/api/anf-measurement/qc-daily-reports', getDailyReports);
router.get('/api/anf-measurement/qc-daily-reports/filters', getDynamicFilterOptions);
router.get('/api/anf-measurement/qc-daily-report/detail/:pageId', getDailyFullReport);
router.get('/api/anf-measurement/style-view-summary', getanfStyleViewSummary);
router.get('//api/anf-measurement/style-view-full-report/:moNo', getStyleViewFullReport);


export default router;