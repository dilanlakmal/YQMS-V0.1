import express from 'express';
import {
  getCuttingInspectDetail,
  getCuttingInspectDetailForManagee,
  deleteCuttingInspection,
  deleteCuttingInspectionSize,
  updateCuttingInspectionGeneral,
  updateCuttingInspectionFull,
} from '../../../controller/Cutting/Cutting_Admin_Inspection_Report/cuttingInspectionReportManageController.js';

const router = express.Router();


router.get('/api/cutting-inspection-full-details', getCuttingInspectDetail);
router.get('/api/cutting-inspection-details-for-manage', getCuttingInspectDetailForManagee);
router.delete('/api/cutting-inspection-record/:id', deleteCuttingInspection);
router.delete('/api/cutting-inspection-record/:id/size/:inspectedSize', deleteCuttingInspectionSize);
router.put('/api/cutting-inspection-general-update/:id', updateCuttingInspectionGeneral);
router.put('/api/cutting-inspection-full-update/:id', updateCuttingInspectionFull);

export default router;