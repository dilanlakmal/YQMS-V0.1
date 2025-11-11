import express from 'express';
import {
  saveQCData,
  getDashboardStats,
} from '../../controller/QC1inspection/qc1InspectionController.js';

const router = express.Router();

router.post('/api/save-qc-data', saveQCData); 
router.get('/api/dashboard-stats', getDashboardStats);

export default router;