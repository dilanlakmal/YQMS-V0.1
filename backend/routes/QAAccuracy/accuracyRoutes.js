import express from 'express';
import {
  saveQAAccuracyImage,
  saveQCAccuracyReport,
  populateFilters,
  getQAAccuracyResults,
  getFullReport,
  getDetailedReport,
  getDashboardSummary,
  getBarChartData,
  getDailyTrend,
  getDefectRate,
  getWeeklySummary,
} from '../../controller/QAAccuracy/accuracyController.js';

import {
  qaAccuracyUpload,
} from "../../helpers/helperFunctions.js";

const router = express.Router();

router.get('/api/qa-accuracy/upload-image', qaAccuracyUpload.single("imageFile"), saveQAAccuracyImage);
router.post('/api/qc-accuracy-reports', saveQCAccuracyReport);
router.get('/api/qa-accuracy/filter-options', populateFilters);
router.get('/api/qa-accuracy/results', getQAAccuracyResults);
router.get('/api/qa-accuracy/full-report', getFullReport);
router.get('/api/qa-accuracy/report/:reportId', getDetailedReport);
router.get('/api/qa-accuracy/dashboard-summary', getDashboardSummary);
router.get('/api/qa-accuracy/chart-data', getBarChartData);
router.get('api/qa-accuracy/daily-trend', getDailyTrend);
router.get('/api/qa-accuracy/defect-rates', getDefectRate);
router.get('/api/qa-accuracy/weekly-summary', getWeeklySummary);

export default router;