import express from 'express';
import {
  getDailyData,
} from '../../../controller/Sub-ConQC1/SubConQCDashboard/subConQCDashboardController.js';

const router = express.Router();

router.get('/api/subcon-qc-dashboard-daily', getDailyData); 

export default router;