import express from 'express';
import {
  getQADefects,
  getQADefectOptions,
  addQADefect,
  deleteQADefect,
} from '../../../controller/QARandomInspection/QAAdmin/QADefectController.js';

const router = express.Router();

router.get('/api/qa-defects', getQADefects);
router.get('/api/qa-defects/options', getQADefectOptions);
router.post('/api/qa-defects', addQADefect);
router.delete('/api/qa-defects/:code', deleteQADefect);

export default router;