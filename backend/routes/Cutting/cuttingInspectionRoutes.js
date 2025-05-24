import express from 'express';
import {
  saveCuttingInspection,
  getCuttingInspectionProgress,
  getCuttingInspectionMono,
  getCuttingInspectionTable,
  getCuttinginspectionDetail,
  updateCuttingInspection,
  getCuttingQCInspectors,
  getCuttingInspectionRepo,
  getCuttingInspectionReportDetail,
  getCuttingInspectDetailRepo,
  getCuttingInspectMoNo,
  getCuttingInspectFilterOptions
} from '../../Controller/Cutting/cuttingInspectionController.js';

const router = express.Router();

router.post('/api/save-cutting-inspection', saveCuttingInspection);
router.get('/api/cutting-inspection-progress', getCuttingInspectionProgress);
router.get('/api/cutting-inspections/mo-numbers', getCuttingInspectionMono);
router.get('/api/cutting-inspections/table-numbers', getCuttingInspectionTable);
router.get('/api/cutting-inspection-details-for-modify', getCuttinginspectionDetail);
router.put('/api/cutting-inspection-update', updateCuttingInspection);
router.get('/api/cutting-inspections/qc-inspectors', getCuttingQCInspectors);
router.get('/api/cutting-inspections-report', getCuttingInspectionRepo);
router.get('/api/cutting-inspection-report-detail/:id', getCuttingInspectionReportDetail);
router.get('/api/cutting-inspection-detailed-report', getCuttingInspectDetailRepo);
router.get('/api/cutting-inspection-mo-nos', getCuttingInspectMoNo);
router.get('/api/cutting-inspection-filter-options', getCuttingInspectFilterOptions);


export default router;