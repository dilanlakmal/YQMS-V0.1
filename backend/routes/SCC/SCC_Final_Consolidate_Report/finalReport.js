import express from 'express';
import {
   getFinalHTreport,
   getFinalFUReport,
   getFinalEMBReport,
   getFinalElasticreport,
} from '../../../controller/SCC/Final_Consolidate_Report/finalReportController.js';

const router = express.Router();

router.get('/api/scc/final-report/ht',  getFinalHTreport);
router.get('/api/scc/final-report/fu', getFinalFUReport);
router.get('/api/scc/final-report/emb', getFinalEMBReport);
router.get('/api/scc/final-report/elastic', getFinalElasticreport);

export default router;
