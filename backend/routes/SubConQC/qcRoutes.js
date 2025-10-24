import express from 'express';
import {
  getSubConSewingFactory,
  getSubCondefect,
} from '../../controller/SubConQC/qcController.js';

const router = express.Router();

router.get('/api/subcon-sewing-factories', getSubConSewingFactory);
router.get('/api/subcon-defects', getSubCondefect);

export default router;