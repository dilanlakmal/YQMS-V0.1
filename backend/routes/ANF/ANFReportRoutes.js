import express from 'express';
import {
  getDailyReports,
  getDynamicFilterOptions,
  getDailyFullReport,
  getanfStyleViewSummary,
  getStyleViewFullReport,
} from '../../controller/ANF/ANFReportController.js';

const router = express.Router();

/* ------------------------------
   AND QC DAILY REPORT ROUTES
------------------------------ */
router.get('/api/anf-measurement/qc-daily-reports', getDailyReports);
router.get('/api/anf-measurement/qc-daily-reports/filters', getDynamicFilterOptions);
router.get('/api/anf-measurement/qc-daily-report/detail/:pageId', getDailyFullReport);

/* ------------------------------
  ANF STYLE VIEW REPORT ROUTES
------------------------------ */
router.get('/api/anf-measurement/style-view-summary', getanfStyleViewSummary);
router.get('/api/anf-measurement/style-view-full-report/:moNo', getStyleViewFullReport);
export default router;