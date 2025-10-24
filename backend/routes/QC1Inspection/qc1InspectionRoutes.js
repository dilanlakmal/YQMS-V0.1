import express from 'express';
import {
  saveQCData,
} from '../../controller/QC1inspection/qc1InspectionController.js';

const router = express.Router();

router.post('/api/save-qc-data', saveQCData); 

export default router;