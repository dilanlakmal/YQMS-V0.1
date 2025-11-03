import express from 'express';
import {
   saveMachine,
   getElasticReportByDate,
   getDistinctMosByDate,
   submitSlotInspection,
} from '../../../controller/SCC/SCC_Inspection/elasticController.js';

const router = express.Router();

router.post('/api/scc/elastic-report/register-machine',  saveMachine);
router.get('/api/scc/elastic-report/by-date',  getElasticReportByDate);
router.get('/api/scc/elastic-report/distinct-mos',  getDistinctMosByDate);
router.post('/api/scc/elastic-report/submit-slot-inspection',  submitSlotInspection);

export default router;
