import express from 'express';
import {
  getDynamicFilterOptions,
  getQCIds,
  getCuttingInspection,

} from '../../controller/Cutting/reportController.js';

const router = express.Router();

router.get('/api/cutting-report-filter-options', getDynamicFilterOptions);
router.get('/api/cutting-inspections/qc-inspectors', getQCIds);
router.get('/api/cutting-inspections/query', getCuttingInspection);


export default router;