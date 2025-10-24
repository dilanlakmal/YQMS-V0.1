import express from 'express';
import {
  getWorkerdate,
  getWorkerCurrentData,
} from '../../controller/QC2Workers/qc2workerController.js';

const router = express.Router();

router.get('/api/qc2-workers-data/log-scan', getWorkerdate);
router.get('/api/qc2-workers-data/today/:qc_id', getWorkerCurrentData);

export default router;