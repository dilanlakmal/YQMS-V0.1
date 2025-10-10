import express from "express";
import {
  getSunriseRS18Data,
  getSunriseOutputData,
  getSunriseQC1Sync,
  getInlineOrdersSync,
  getYMCESystemData,
  cutpanelOrdersSync,
  syncDtOrders
} from "../../controller/SQL/sqlQueryController.js";

const router = express.Router();

router.get("/api/sunrise/rs18", getSunriseRS18Data);
router.get("/api/sunrise/output", getSunriseOutputData);
router.get("/api/sunrise/sync-qc1", getSunriseQC1Sync);
router.get("/api/sync-inline-orders", getInlineOrdersSync);
router.get("/api/ymce-system-data", getYMCESystemData);
router.post("/api/sync-cutpanel-orders", cutpanelOrdersSync);
router.get("/api/sync-dt-orders", syncDtOrders);

export default router;
