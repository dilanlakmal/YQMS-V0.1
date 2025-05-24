import express from 'express';
import {
  getCuttingFabricDefects,
} from '../../Controller/Cutting/cuttingFabricDefectController.js';

const router = express.Router();

router.get('/api/cutting-fabric-defects', getCuttingFabricDefects);

export default router;