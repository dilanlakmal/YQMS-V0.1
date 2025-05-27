import express from 'express';
import {
  saveQCData,
} from '../../Controller/QC1Inspection/qc1InspectionController.js';

const router = express.Router();

router.post('/api/save-qc-data', saveQCData); 

export default router;