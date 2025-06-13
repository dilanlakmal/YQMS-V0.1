import express from 'express';
import {
  getAllScratchDefects,
  addScratchDefect,
  updateScratchDefect,
  deleteScratchDefect,
} from '../../Controller/SCC/sccScratchdefectsController.js';

const router = express.Router();

router.get('/api/scc/scratch-defects', getAllScratchDefects);
router.post('/api/scc/scratch-defects', addScratchDefect);
router.put('/api/scc/scratch-defects/:id', updateScratchDefect);
router.delete('/api/scc/scratch-defects/:id', deleteScratchDefect); 

export default router;