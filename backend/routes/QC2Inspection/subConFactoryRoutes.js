import express from 'express';
import {
  getAllSubFactory,
  addSubFactory,
  updateSubFactory,
  deleteSubFactory,
} from '../../controller/QC2Inspection/SubConFactoryController.js';

const router = express.Router();

router.get('/api/subcon-factories', getAllSubFactory);
router.post('/api/subcon-factories', addSubFactory);
router.put('/api/subcon-factories/:id', updateSubFactory);
router.delete('/api/subcon-factories/:id', deleteSubFactory);

export default router;