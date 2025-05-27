import express from 'express';
import {
  saveHtFirstOutput,
  getHtFirstOutput,
  saveFuFirstOutput,
  getFuFirstOutput,
  getFirstOutput,
  saveSccDailyTesting,
  getSccDailyTesting,
  getDailyHtFuTest,
  saveDailyHtFuTest
} from '../../Controller/SCC/sccController.js';

const router = express.Router();

router.post('/api/scc/ht-first-outpu', saveHtFirstOutput);
router.get('/api/scc/ht-first-output', getHtFirstOutput);
router.post('/api/scc/fu-first-output', saveFuFirstOutput);
router.get('/api/scc/fu-first-output', getFuFirstOutput);
router.get('/api/scc/get-first-output-specs', getFirstOutput);
router.post('/api/scc/daily-testing', saveSccDailyTesting);
router.get('/api/scc/daily-testing', getSccDailyTesting);
router.get('/api/scc/daily-htfu-test', getDailyHtFuTest);
router.post('/api/scc/daily-htfu-test', saveDailyHtFuTest); 

export default router;