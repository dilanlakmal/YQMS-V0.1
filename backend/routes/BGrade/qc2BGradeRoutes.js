import express from 'express';
import {
  saveBGradeData,
  getBGradeDataByDefectId,
  saveBGradeDefect,
  saveBGradeStock,
  getBGradeStockFilters,
} from '../../controller/BGrade/qc2BGradeController.js';

const router = express.Router();

router.post('/api/qc2-bgrade', saveBGradeData);
router.get('/api/qc2-bgrade/by-defect-id/:defect_print_id', getBGradeDataByDefectId);
router.post('/api/b-grade-defects/process-decisions', saveBGradeDefect);
router.post('/api/b-grade-stock', saveBGradeStock);
router.get('/api/b-grade-stock/filter-options', getBGradeStockFilters);

export default router;