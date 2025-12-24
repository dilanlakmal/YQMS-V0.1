import express from 'express';
import {
  getEMBDefects,
  addEMBDefect,
  updateEMBDefect,
  deleteEMBDefect,
} from '../../../controller/SCC/SCC_Admin/embController.js';

const router = express.Router();

router.get('/api/scc/emb-defects', getEMBDefects);
router.post('/api/scc/emb-defects', addEMBDefect);
router.put('/api/scc/emb-defects/:id', updateEMBDefect);
router.delete('/api/scc/emb-defects/:id', deleteEMBDefect);

export default router;