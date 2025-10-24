import express from 'express';
import {
  getDailyData,
} from '../../controller/SubConQC/qcController.js';

const router = express.Router();

router.get('/api/subcon-qc-dashboard-daily', getDailyData); 

export default router;