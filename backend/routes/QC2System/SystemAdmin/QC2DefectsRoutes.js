import express from 'express';
import {
  getAllQC2Defects,
  addQC2Defect,
  updateQC2Defect,
  deleteQC2Defect,
  saveQC2Image,
  editQC2Image,
  deleteQC2Image,
  getAllQC2DefectCategories,
} from '../../../controller/QC2System/SystemAdmin/QC2DefectController.js';
import {uploadQc2Image} from "../../../helpers/helperFunctions.js"

const router = express.Router();
router.get('/api/qc2-defects', getAllQC2Defects); 
router.post('/api/qc2-defects', addQC2Defect); 
router.put('/api/qc2-defects/:id', updateQC2Defect); 
router.delete('/api/qc2-defects/:id', deleteQC2Defect); 
router. post('/api/qc2-defects/upload-image',uploadQc2Image.single("defectImage"), saveQC2Image );
router.put('/api/qc2-defects/:id/image',uploadQc2Image.single("defectImage"), editQC2Image);
router.delete('/api/qc2-defects/:id/image', deleteQC2Image);
router.get('/api/qc2-defect-categories', getAllQC2DefectCategories);



export default router;