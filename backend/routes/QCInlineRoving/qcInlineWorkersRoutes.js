import express from 'express';
import {
  getLineSummary,
  editLineWorker,
} from '../../controller/QCInlineRoving/qcInlineWorkercontroller.js';


const router = express.Router();

router.get('/api/line-summary',  getLineSummary );
router.post('/api/line-sewing-workers/:lineNo',  editLineWorker );

export default router;