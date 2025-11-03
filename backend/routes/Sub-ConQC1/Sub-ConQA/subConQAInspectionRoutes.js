import express from 'express';
import {
  getStanderdDefect,
  saveQaImageUpload,
  getStandardDefectsForForm,
  saveSubconQAReport,
  getSubConSewingQAReport,
  updateSubConSewingQAReport,
} from '../../../controller/Sub-ConQC1/Sub-ConQA/subConQAInspectionController.js';

import { qaImageUpload } from "../../../helpers/helperFunctions.js";

const router = express.Router();

router.get('/api/qa-standard-defects', getStanderdDefect);
router.post('/api/subcon-qa/upload-image',  qaImageUpload.single("imageFile"), saveQaImageUpload);
router.get('/api/qa-standard-defects-list', getStandardDefectsForForm);
router.post('/api/subcon-sewing-qa-reports', saveSubconQAReport);
router.get('/api/subcon-sewing-qa-report/find',  getSubConSewingQAReport);
router.put('/api/subcon-sewing-qa-reports/:id', updateSubConSewingQAReport);

export default router;