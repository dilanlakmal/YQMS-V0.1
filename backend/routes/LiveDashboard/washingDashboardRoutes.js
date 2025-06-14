import express from 'express';
import {
  getFilterOptions,
  getWashingDashboardData,
  getHourlyWashingData,
} from '../../Controller/LiveDashboard/washingDashboardController.js';

const router = express.Router();

router.get('/api/washing/filters', getFilterOptions);
router.get('/api/washing/dashboard-data', getWashingDashboardData);
router.get('/api/washing/hourly-summary', getHourlyWashingData);

export default router;