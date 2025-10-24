import express from 'express';
import {
  saveWashingSpecs,
} from '../../controller/WashingSpecs/specController.js';

const router = express.Router();

router.post('/api/washing-specs/save', saveWashingSpecs);

export default router;