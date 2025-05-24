import express from 'express';
import {
  getSunriseRS18Data,
  getSunriseOutputData,
  getYMCEData,
} from '../../Controller/SQL/sqlQueryController.js';

const router = express.Router();

router.get("/api/sunrise/rs18", getSunriseRS18Data);
router.get("/api/sunrise/output", getSunriseOutputData);
router.get("/api/ymce-system-data", getYMCEData);

export default router;