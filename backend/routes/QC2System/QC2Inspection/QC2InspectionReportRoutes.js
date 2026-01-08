import express from 'express';
import {
  getQC2PassbundleDataByBundleRandomId,
  getQC2PassbundleDataByDefectPrintId,
  getQC2PassbundleData,
  getQC2InspectionData,
  getAllQC2PassbundleData,
  getQC2Defect,

} from '../../../controller/QC2System/QC2Inspection/QC2InspectionReportController.js';

const router = express.Router();
//Get data by ID
router.get('/api/qc2-inspection-pass-bundle-by-random-id/:bundle_random_id', getQC2PassbundleDataByBundleRandomId);
router.get('/api/qc2-inspection-pass-bundle-by-defect-print-id/:defect_print_id', getQC2PassbundleDataByDefectPrintId);

//Filter option for dashboard/report
router.get('/api/qc2-inspection-pass-bundle/filter-options', getQC2PassbundleData);
router.get('/api/qc2-defect-print/filter-options', getQC2InspectionData);

//Get all inspection report
router.get('/api/qc2-inspection-pass-bundle/search', getAllQC2PassbundleData);
router.get('/api/qc2-defect-print/search', getQC2Defect);



export default router;