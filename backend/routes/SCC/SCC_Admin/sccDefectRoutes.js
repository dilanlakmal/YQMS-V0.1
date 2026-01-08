import express from 'express';
import {
  getSccDefects,
  addSccDefect,
  updateSccDefect,
  deleteSccDefect,
  getPrintingDefects,
  getAllCombinedDefects,
} from '../../../controller/SCC/SCC_Admin/sccDefectsController.js';

const router = express.Router();

router.get('/api/scc/defects', getSccDefects);
router.post('/api/scc/defects', addSccDefect);
router.put('/api/scc/defects/:id', updateSccDefect);
router.delete('/api/scc/defects/:id', deleteSccDefect);
router.get('/api/scc/printing-defects', getPrintingDefects);
router.get('/api/scc/all-defects', getAllCombinedDefects);

export default router;