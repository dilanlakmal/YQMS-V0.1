import express from 'express';
import {
  saveRegisterMachine,
  getDailyTestingHTFUByDate,
  getDistinctMoNumbersByDate,
  submitSlotInspection,
  updateTestResult,
} from '../../../controller/SCC/SCC_Inspection/htfuController.js'

const router = express.Router();

router.post('/api/scc/daily-htfu/register-machine', saveRegisterMachine);
router.get('/api/scc/daily-htfu/by-date', getDailyTestingHTFUByDate);
router.get('/api/scc/daily-htfu/distinct-mos',  getDistinctMoNumbersByDate);
router.post('/api/scc/daily-htfu/submit-slot-inspection', submitSlotInspection);
router.put('/api/scc/daily-htfu/update-test-result/:docId', updateTestResult);

export default router;
