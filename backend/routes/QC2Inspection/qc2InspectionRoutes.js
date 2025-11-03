import express from 'express';
import {
  saveQC2Data,
  updateQC2InspectionData,
  saveQC2ReworksData,
  createDefectPrintRecord,
  searchDefectPrintRecords,
  fetchAllDefectPrintRecords,
  getDefectPrintRecordsByDefectId,
  getQC2InspectionData,
  // editInspectionData,
  getAllQC2Defects,
  addQC2Defect,
  updateQC2Defect,
  deleteQC2Defect,
  getAllQC2DefectCategories,
  saveQC2Image,
  editQC2Image,
  deleteQC2Image,
} from '../../controller/QC2Inspection/qc2InspectionController.js';
import {uploadQc2Image} from "../../helpers/helperFunctions.js"

const router = express.Router();

router.post('/api/inspection-pass-bundle', saveQC2Data);
router.put('/api/qc2-inspection-pass-bundle/:bundle_random_id', updateQC2InspectionData);
router.post('/api/reworks', saveQC2ReworksData);
router.post('/api/qc2-defect-print', createDefectPrintRecord);
router.get('/api/qc2-defect-print/search', searchDefectPrintRecords);
router.get('/api/qc2-defect-print', fetchAllDefectPrintRecords);
router.get('/api/qc2-defect-print/filter-options', getQC2InspectionData);
router.get('/api/qc2-defect-print/:defect_id', getDefectPrintRecordsByDefectId);
// router.put('/api/qc2-inspection-pass-bundle/:id', editInspectionData);
router.get('/api/qc2-defects', getAllQC2Defects); 
router.post('/api/qc2-defects', addQC2Defect); 
router.put('/api/qc2-defects/:id', updateQC2Defect); 
router.delete('/api/qc2-defects/:id', deleteQC2Defect); 
router.get('/api/qc2-defect-categories', getAllQC2DefectCategories);
router. post('/api/qc2-defects/upload-image',uploadQc2Image.single("defectImage"), saveQC2Image );
router.put('/api/qc2-defects/:id/image',uploadQc2Image.single("defectImage"), editQC2Image);
router.delete('/api/qc2-defects/:id/image', deleteQC2Image);



export default router;