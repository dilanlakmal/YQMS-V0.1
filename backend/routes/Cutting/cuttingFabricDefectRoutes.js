import express from 'express';
import {
  getCuttingFabricDefects,
  updateCuttingFabricDefect,
  updateCuttingFabricDefectById,
  deleteCuttingFabricDefect,
} from '../../controller/Cutting/cuttingFabricDefectController.js';

const router = express.Router();

router.get('/api/cutting-fabric-defects', getCuttingFabricDefects);
router.post('/api/cutting-fabric-defects', updateCuttingFabricDefect);
router.put('/api/cutting-fabric-defects/:id', updateCuttingFabricDefectById);
router.delete('/api/cutting-fabric-defects/:id', deleteCuttingFabricDefect);

export default router;