import express from 'express';
import {
  triggerQC1SunriseSync,
  triggerInlineOrdersSync,
  triggerCuttingOrdersSync,
} from '../../Controller/SQL/sqlSyncController.js';

const router = express.Router();

router.get("/api/sunrise/sync-qc1", triggerQC1SunriseSync); 
router.post("/api/sync-inline-orders", triggerInlineOrdersSync);
router.post("/api/sync-cutting-orders", triggerCuttingOrdersSync);

export default router;