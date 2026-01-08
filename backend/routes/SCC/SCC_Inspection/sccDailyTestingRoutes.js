import express from 'express';
import {
  saveSccDailyTesting,
  getSccDailyTesting,
} from '../../../controller/SCC/SCC_Inspection/sccDailyTestingController.js';

const router = express.Router();

router.post('/api/scc/daily-testing', saveSccDailyTesting);
router.get('/api/scc/daily-testing', getSccDailyTesting);


export default router;