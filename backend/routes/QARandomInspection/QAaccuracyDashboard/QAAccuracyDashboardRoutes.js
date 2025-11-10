import express from 'express';
import {
  getDashboardSummary,
  getBarChartData,
  getDailyTrend,
  getDefectRate,
  getWeeklySummary,
} from '../../../controller/QARandomInspection/QAaccuracyDashboard/QAAccuracyDashboardController.js';

const router = express.Router();
router.get('/api/qa-accuracy/dashboard-summary', getDashboardSummary);
router.get('/api/qa-accuracy/chart-data', getBarChartData);
router.get('api/qa-accuracy/daily-trend', getDailyTrend);
router.get('/api/qa-accuracy/defect-rates', getDefectRate);
router.get('/api/qa-accuracy/weekly-summary', getWeeklySummary);

export default router;