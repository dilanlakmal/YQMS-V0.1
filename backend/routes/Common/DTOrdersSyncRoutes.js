import express from "express";
import {
  triggerFullLoad,
  getSyncStatus,
  getSampleSyncedDocument,
  verifyIdPreservation,
} from "../../controller/Common/dtOrdersSyncEcoBoardController.js";

const router = express.Router();

// GET /api/dt-orders-sync/status
router.get("/api/dt-orders-sync/status", getSyncStatus);

// POST /api/dt-orders-sync/full-load
router.post("/api/dt-orders-sync/full-load", triggerFullLoad);

// GET /api/dt-orders-sync/sample/:orderNo?
router.get("/api/dt-orders-sync/sample/:orderNo?", getSampleSyncedDocument);
router.get("/api/dt-orders-sync/sample", getSampleSyncedDocument);

// GET /api/dt-orders-sync/verify-ids
router.get("/api/dt-orders-sync/verify-ids", verifyIdPreservation);

export default router;
