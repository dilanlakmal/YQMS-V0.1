import express from 'express';
import {
  getDynamicFilterOptions,
  getCuttingQCInspectors,
  getCuttingInspectionRepo,
  // getCuttingInspectDetailRepo,
  getCuttingInspectionReportDetail,
  getCuttingInspection,
  getMeasurementIssues,

} from '../../../controller/Cutting/CuttingReport/reportController.js';
// import authenticateUser from "../../../middleware/authenticateUser.js";

const router = express.Router();

router.get('/api/cutting-report-filter-options', getDynamicFilterOptions);
router.get('/api/cutting-inspections/qc-inspectors', getCuttingQCInspectors);
// router.get('/api/cutting-inspections-report', authenticateUser, getCuttingInspectionRepo);
router.get('/api/cutting-inspections-report', getCuttingInspectionRepo);
router.get('/api/cutting-inspection-report-detail/:id', getCuttingInspectionReportDetail);
router.get('/api/cutting-inspections/query', getCuttingInspection);
router.get('/api/cutting-report-measurement-issues/:id', getMeasurementIssues);



export default router;