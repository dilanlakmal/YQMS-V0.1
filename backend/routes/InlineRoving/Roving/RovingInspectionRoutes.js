import express from 'express';
import {
  getBuyerStatus,
  getLineSummary,
  getCompletedInspectOperators,
  editLineWorker,
  saveQCInlineRovingData ,
} from '../../../controller/InlineRoving/Roving/RovingINspectioncontroller.js';

const router = express.Router();

router.get('/api/buyer-by-mo',  getBuyerStatus );
router.get('/api/line-summary',  getLineSummary );
router.get('/api/inspections-completed',  getCompletedInspectOperators );
router.put('/api/line-sewing-workers/:lineNo', editLineWorker );
router.post('/api/save-qc-inline-roving', saveQCInlineRovingData );


export default router;