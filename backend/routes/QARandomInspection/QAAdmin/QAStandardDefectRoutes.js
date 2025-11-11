import express from 'express';
import {
  getQAStandardDefects,
  getNextCode,
  addQAStandardDefect,
  updateQAStandardDefect,
  deleteQAStandardDefect,
} from '../../../controller/QARandomInspection/QAAdmin/QAStandardDefectController.js';

const router = express.Router();


router.get('/api/qa-standard-defects', getQAStandardDefects);
router.get('/api/qa-standard-defects/next-code', getNextCode);
router.post('/api/qa-standard-defects', addQAStandardDefect);
router.put('/api/qa-standard-defects/:id', updateQAStandardDefect);
router.delete('/api/qa-standard-defects/:id', deleteQAStandardDefect);



export default router;