import express from 'express';
import {
   getActiveMosForFUQC,
   getMoDetailsForFUQC,
   getSpecsForFUQC,
   registerMachineForFUQC,
   getDailyFUQCRecordsByDate,
   getDistinctMosForDailyFUQC,
   submitSlotInspectionForFUQC,
} from '../../../controller/SCC/Daily_FUQC/fuqcController.js'

const router = express.Router();

router.get('/api/scc/fu-first-output/search-active-mos',  getActiveMosForFUQC);
router.get('/api/scc/fu-first-output/mo-details-for-registration',  getMoDetailsForFUQC);
router.get('/api/scc/fu-first-output/specs-for-registration',  getSpecsForFUQC);
router.post('/api/scc/daily-fuqc/register-machine',  registerMachineForFUQC);
router.get('/api/scc/daily-fuqc/by-date',  getDailyFUQCRecordsByDate);
router.get('/api/scc/daily-fuqc/distinct-mos',  getDistinctMosForDailyFUQC);
router.post('/api/scc/daily-fuqc/submit-slot-inspection',  submitSlotInspectionForFUQC);


export default router;