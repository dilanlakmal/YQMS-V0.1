import express from 'express';
import {
  populateFilters,
  getQAAccuracyResults,
  getFullReport,
  getDetailedReport,
} from '../../../controller/QARandomInspection/QARandomInspectionData/QARandomInspectionController.js';

const router = express.Router();


router.get('/api/qa-accuracy/filter-options', populateFilters);
router.get('/api/qa-accuracy/results', getQAAccuracyResults);
router.get('/api/qa-accuracy/full-report', getFullReport);
router.get('/api/qa-accuracy/report/:reportId', getDetailedReport);

export default router;