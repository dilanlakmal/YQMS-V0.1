import express from 'express';
import {
  getDashboardStats,
} from '../../controller/LiveDashboard/qa1DashboardController.js';

const router = express.Router();

router.get('/api/dashboard-stats', getDashboardStats);


export default router;