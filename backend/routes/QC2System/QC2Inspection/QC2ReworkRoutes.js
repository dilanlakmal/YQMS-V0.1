import express from 'express';
import {
  saveQC2ReworksData,
} from '../../../controller/QC2System/QC2Inspection/QC2ReworkController.js';

const router = express.Router();

router.post('/api/reworks', saveQC2ReworksData);

export default router;