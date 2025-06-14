import express from 'express';
import {
  getIroningData,
  getIroningDashboardData,
  getHourlyIroningData,
} from '../../Controller/LiveDashboard/ironingDashboardController.js';

const router = express.Router();

router.get('/api/ironing/filters', getIroningData);
router.get('/api/ironing/dashboard-data', getIroningDashboardData);
router.get('/api/ironing/hourly-summary', getHourlyIroningData);

export default router;