import express from 'express';
import {
  saveQAAccuracyImage,
  getQADefectsForDropdown,
  getStandardDefectsForForm,
  saveQCAccuracyReport,
} from '../../../controller/QARandomInspection/QARandomInspectionData/QARandomInspectionSaveController.js';

import {
  qaAccuracyUpload,
} from "../../../helpers/helperFunctions.js";

const router = express.Router();

router.post('/api/qa-accuracy/upload-image', qaAccuracyUpload.single("imageFile"), saveQAAccuracyImage);
router.get('/api/qa-defects-list', getQADefectsForDropdown);
router.get('/api/qa-standard-defects-list', getStandardDefectsForForm);
router.post('/api/qc-accuracy-reports', saveQCAccuracyReport);

export default router;