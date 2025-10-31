import express from 'express';
import {
  getCuttingDashboardFilters,
  getCuttingDashboardData,
} from '../../../controller/Cutting/CuttingDashboard/cuttingDashboardController.js';

const router = express.Router();

router.get('/api/cutting-dashboard/filters', getCuttingDashboardFilters);
router.get('/api/cutting-dashboard-data', getCuttingDashboardData);

export default router;