import express from 'express';
import {
  getFilterOptions,
  getSummaryData,
  getFullReport,
} from '../../controller/ANF/ANFResultController.js';

const router = express.Router();

router.get('/api/anf-measurement/results/filters', getFilterOptions);
router.get('/api/anf-measurement/results/summary', getSummaryData);
router.get('/api/anf-measurement/results/full-report-detail', getFullReport);
export default router;