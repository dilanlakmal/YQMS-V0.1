// import express from "express";
// import {
//   getSunriseRS18Data,
//   getSunriseOutputData,
//   getSunriseQC1Sync,
//   getInlineOrdersSync,
//   getYMCESystemData,
//   cutpanelOrdersSync,
//   syncDtOrders
// } from "../../controller/SQL/sqlQueryController.js";

// const router = express.Router();

// router.get("/api/sunrise/rs18", getSunriseRS18Data);
// router.get("/api/sunrise/output", getSunriseOutputData);
// router.get("/api/sunrise/sync-qc1", getSunriseQC1Sync);
// router.get("/api/sync-inline-orders", getInlineOrdersSync);
// router.get("/api/ymce-system-data", getYMCESystemData);
// router.post("/api/sync-cutpanel-orders", cutpanelOrdersSync);
// router.get("/api/sync-dt-orders", syncDtOrders);

// export default router;

import express from "express";
import {
  getSunriseRS18Data,
  getSunriseOutputData,
  getSunriseQC1Sync,
} from "../../controller/SQL/sunriseController.js";
import {
  getInlineOrdersSync,
  getYMCESystemData,
} from "../../controller/SQL/inlineOrdersController.js";
import { cutpanelOrdersSync } from "../../controller/SQL/cuttingController.js";
import { syncDtOrders } from "../../controller/SQL/dtOrdersController.js";

const router = express.Router();

// Sunrise routes
router.get("/api/sunrise/rs18", getSunriseRS18Data);
router.get("/api/sunrise/output", getSunriseOutputData);
router.get("/api/sunrise/sync-qc1", getSunriseQC1Sync);

// Inline Orders routes
router.get("/api/sync-inline-orders", getInlineOrdersSync);
router.get("/api/ymce-system-data", getYMCESystemData);

// Cutting routes
router.post("/api/sync-cutpanel-orders", cutpanelOrdersSync);

// DT Orders routes
router.get("/api/sync-dt-orders", syncDtOrders);

export default router;
