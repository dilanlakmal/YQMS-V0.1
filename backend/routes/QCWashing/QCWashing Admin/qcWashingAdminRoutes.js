import express from 'express';
import {
  getQCWashingCheckList,
  addQCWashingCheckListItem,
  getQCWashingCheckListItem,
  updateQCWashingCheckListItem,
  deleteQCWashingCheckListItem,
  getQCWashingCheckListSummary,
  getQCWashingDefects,
  addQCWashingDefect,
  getQCWashingNextDefectCode,
  updateQCWashingDefect,
  updateQCWashingDefectImage,
  deleteQCWashingDefectImage,
  getAllFirstOutputRecords,
  addFirstOutputRecord,
  updateFirstOutputRecord,
  deleteFirstOutputRecord,
  addQCWashingStandards,
  getQCWashingStandards,
} from '../../../controller/QCWashing/QCWashing Admin/qcWashingAdminController.js';
import { uploadQC2_washing_image} from "../../../helpers/helperFunctions.js";

const router = express.Router();

/* ------------------------------
 Checklist Routes
------------------------------ */

router.get('/api/qc-washing-checklist', getQCWashingCheckList);
router.post('/api/qc-washing-checklist', addQCWashingCheckListItem);
router.get('/api/qc-washing-checklist/:id', getQCWashingCheckListItem);
router.put('/api/qc-washing-checklist/:id', updateQCWashingCheckListItem);
router.delete('/api/qc-washing-checklist/:id', deleteQCWashingCheckListItem);
router.get('/api/qc-washing-checklist/summary', getQCWashingCheckListSummary);

/* ------------------------------
  Defect Routes
------------------------------ */
router.get('/api/qc-washing-defects', getQCWashingDefects);
router.post('/api/qc-washing-defects', addQCWashingDefect);
router.get('/api/qc-washing-defects/next-code', getQCWashingNextDefectCode);
router.put('/api/qc-washing-defects/:id', updateQCWashingDefect);
router.put('/api/qc-washing-defects/:id/image', uploadQC2_washing_image.single("defectImage"),updateQCWashingDefectImage);
router.delete('/api/qc-washing-defects/:id/image', deleteQCWashingDefectImage);

/* ------------------------------
  First Output Routes
------------------------------ */
router.get('/api/qc-washing-first-outputs', getAllFirstOutputRecords);
router.post('/api/qc-washing-first-outputs', addFirstOutputRecord);
router.put('/api/qc-washing-first-outputs/:id', updateFirstOutputRecord);
router.delete('/api/qc-washing-first-outputs/:id', deleteFirstOutputRecord);

/* ------------------------------
  Standards Routes
------------------------------ */
router.post('/api/qc-washing/standards', addQCWashingStandards);
router.get('/api/qc-washing/standards', getQCWashingStandards);

export default router;