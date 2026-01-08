import express from 'express';
import {
  getSubConSewingFactory,
  getSubCondefect,
  getSubConSewingQC1Rport,
  addSubConSewingQC1Report,
  updateSubConSewingQC1Report,
} from '../../../controller/Sub-ConQC1/Sub-ConQC1 Inspection/subConsewingQCInspectionController.js';

const router = express.Router();

router.get('/api/subcon-sewing-factories', getSubConSewingFactory);
router.get('/api/subcon-defects', getSubCondefect);
router.get('/api/subcon-sewing-qc1-report/find', getSubConSewingQC1Rport);
router.post('/api/subcon-sewing-qc1-reports', addSubConSewingQC1Report);
router.put('/api/subcon-sewing-qc1-reports/:id', updateSubConSewingQC1Report);

export default router;