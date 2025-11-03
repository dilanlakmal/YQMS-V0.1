import express from 'express';
import {
  getQADefects,
  getQADefectOptions,
  addQADefect,
  deleteQADefect,
  getQADefectDetails,
  updateQADefectBuyerStatuses,
  getQAStandardDefects,
  getNextCode,
  addQAStandardDefect,
  updateQAStandardDefect,
  deleteQAStandardDefect,
  getQADefectsForDropdown,

} from '../../controller/QAAccuracy/qaDefectController.js';

const router = express.Router();

router.get('/api/qa-defects', getQADefects);
router.get('/api/qa-defects/options', getQADefectOptions);
router.post('/api/qa-defects', addQADefect);
router.delete('/api/qa-defects/:code', deleteQADefect);
router.get('/api/qa-defects/all-details', getQADefectDetails);
router.post('/api/qa-defects/buyer-statuses', updateQADefectBuyerStatuses);
router.get('/api/qa-standard-defects', getQAStandardDefects);
router.get('/api/qa-standard-defects/next-code', getNextCode);
router.post('/api/qa-standard-defects', addQAStandardDefect);
router.put('/api/qa-standard-defects/:id', updateQAStandardDefect);
router.delete('/api/qa-standard-defects/:id', deleteQAStandardDefect);
router.get('/api/qa-defects-list', getQADefectsForDropdown);


export default router;