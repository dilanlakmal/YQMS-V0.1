import express from 'express';
import {
  getFilterOptions,
  getOPADashboardData,
  getHourlyOPAData,
} from '../../controller/LiveDashboard/opaDashboardController.js';

const router = express.Router();

router.get('/api/opa/filters', getFilterOptions);
router.get('/api/opa/dashboard-data', getOPADashboardData);
router.get('/api/opa/hourly-summary', getHourlyOPAData);

export default router;