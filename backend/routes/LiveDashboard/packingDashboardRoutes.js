import express from 'express';
import {
  getPackingData,
  getPackingDashboardData,
  getHourlyPackingSummary,
} from '../../controller/LiveDashboard/packingDashboardController.js';

const router = express.Router();

router.get('/api/packing/filters', getPackingData);
router.get('/api/packing/dashboard-data', getPackingDashboardData);
router.get('/api/packing/hourly-summary', getHourlyPackingSummary);

export default router;