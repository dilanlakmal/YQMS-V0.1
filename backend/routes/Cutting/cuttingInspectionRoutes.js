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
  getCuttingInspectFilterOptions,
  getCuttingInspectDetail,
  getCuttingInspectDetailForManagee,
  deleteCuttingInspection,
  deleteCuttingInspectionSize,
  updateCuttingInspectionGeneral,
  updateCuttingInspectionFull,
} from '../../controller/Cutting/cuttingInspectionController.js';

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
router.get('/api/cutting-inspection-full-details', getCuttingInspectDetail);
router.get('/api/cutting-inspection-details-for-manage', getCuttingInspectDetailForManagee);
router.delete('/api/cutting-inspection-record/:id', deleteCuttingInspection);
router.delete('/api/cutting-inspection-record/:id/size/:inspectedSize', deleteCuttingInspectionSize);
router.put('/api/cutting-inspection-general-update/:id', updateCuttingInspectionGeneral);
router.put('/api/cutting-inspection-full-update/:id', updateCuttingInspectionFull);

export default router;