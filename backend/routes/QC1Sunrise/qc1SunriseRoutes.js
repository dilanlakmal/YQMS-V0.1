import express from 'express';
import {
  fetchFilteredQC1SunriseData,
  fetchUniqueFilterValues,
  // fetchSunriseDailyTrendData,
  // fetchSunriseWeeklyData,
  // fetchSunriseWeeklyFilters,
  // fetchSunriseMonthlyData,
  // fetchSunriseMonthlyTrendData,
  // fetchSunriseMonthlyFilters,
} from '../../controller/QC1Sunrise/qc1SunriseController.js';

const router = express.Router();

router.get('/api/sunrise/qc1-data', fetchFilteredQC1SunriseData);
router.get('/api/sunrise/qc1-filters', fetchUniqueFilterValues);
// router.get('/api/sunrise/qc1-daily-trend', fetchSunriseDailyTrendData);
// router.get('/api/sunrise/qc1-weekly-data', fetchSunriseWeeklyData);
// router.get('/api/sunrise/qc1-weekly-filters', fetchSunriseWeeklyFilters);
// router.get('/api/sunrise/qc1-monthly-data', fetchSunriseMonthlyData);
// router.get('/api/sunrise/qc1-monthly-trend', fetchSunriseMonthlyTrendData);
// router.get('/api/sunrise/qc1-monthly-filters', fetchSunriseMonthlyFilters);

export default router;