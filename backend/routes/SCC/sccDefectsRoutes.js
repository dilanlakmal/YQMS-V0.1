import express from 'express';
import {
  getSccDefects,
  addSccDefect,
  updateSccDefect,
  deleteSccDefect,
} from '../../Controller/SCC/sccDefectsController.js';

const router = express.Router();

router.get('/api/scc/defects', getSccDefects);
router.post('/api/scc/defects', addSccDefect);
router.put('/api/scc/defects/:id', updateSccDefect);
router.delete('/api/scc/defects/:id', deleteSccDefect);

export default router;