import express from 'express';
import {
  getQADefectDetails,
  updateQADefectBuyerStatuses,

} from '../../../controller/QARandomInspection/QAAdmin/QADefectBuyerStatusController.js';

const router = express.Router();

router.get('/api/qa-defects/all-details', getQADefectDetails);
router.post('/api/qa-defects/buyer-statuses', updateQADefectBuyerStatuses);


export default router;