import express from 'express';
import {
  getAllPaaring,
  addParing,
  updateParing,
  deleteParing,
} from '../../Controller/ParingDefects/paringDefectController.js';

const router = express.Router();

router.get('/api/pairing-defects', getAllPaaring);
router.post('/api/pairing-defects', addParing);
router.put('/api/pairing-defects/:id', updateParing);
router.delete('/api/pairing-defects/:id', deleteParing);

export default router;