import express from "express";
import multer from "multer";
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  uploadGlossary,
  listGlossaries,
  getGlossariesByLanguagePair,
  deleteGlossary,
  getGlossaryUrlEndpoint,
  addEntriesToGlossary,
  getGlossaryEntries,
  updateGlossaryEntries,
  downloadGlossary,
  alignContent,
  submitCorrection,
  learnFromDocument
} from "../../controller/glossaries/glossaryController.js";

// New imports for expert verification system
import {
  getTerms,
  getTerm,
  createTerm,
  updateTerm,
  deleteTerm,
  verifyTerm,
  bulkVerifyTerms,
  mineSingleDoc,
  mineParallelDocs,
  generateTSV,
  getMiningHistory,
  deleteMiningHistory,
  getMiningSourceSAS
} from "../../controller/glossaries/termController.js";
import { ROLES, requireRole } from "../../middleware/rbac.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max for mining files
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.tsv', '.csv', '.xlsx', '.xls', '.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

// ========== LEGACY GLOSSARY ROUTES (FILE-BASED) ==========

// POST /api/glossaries/upload - Upload glossary file
// router.post("/api/glossaries/upload", upload.single('glossaryFile'), uploadGlossary);

// GET /api/glossaries/list - List all glossaries
router.get("/api/glossaries/list", listGlossaries);

// GET /api/glossaries/:blobName/url - Get glossary SAS URL (must come before :sourceLang/:targetLang)
router.get("/api/glossaries/:blobName/url", getGlossaryUrlEndpoint);

// GET /api/glossaries/:blobName/download - Download glossary file (must come before :sourceLang/:targetLang)
router.get("/api/glossaries/:blobName/download", downloadGlossary);

// GET /api/glossaries/:blobName/entries - Get glossary entries (must come before :sourceLang/:targetLang)
router.get("/api/glossaries/:blobName/entries", getGlossaryEntries);

// PUT /api/glossaries/:blobName/entries - Update glossary entries (must come before :sourceLang/:targetLang)
router.put("/api/glossaries/:blobName/entries", updateGlossaryEntries);

// GET /api/glossaries/:sourceLang/:targetLang - Get glossaries for language pair
router.get("/api/glossaries/:sourceLang/:targetLang", getGlossariesByLanguagePair);

// DELETE /api/glossaries/delete - Delete glossary
router.delete("/api/glossaries/delete", deleteGlossary);

// POST /api/glossaries/add-entries - Add entries to existing glossary
router.post("/api/glossaries/add-entries", addEntriesToGlossary);

// POST /api/glossaries/align - Align text for editor
router.post("/api/glossaries/align", alignContent);

// POST /api/glossaries/feedback - Submit correction feedback
router.post("/api/glossaries/feedback", submitCorrection);

// POST /api/glossaries/learn - Bulk extract and save glossary terms from documents
router.post("/api/glossaries/learn", learnFromDocument);

// ========== NEW EXPERT VERIFICATION ROUTES (DB-BASED) ==========

// === Mining Endpoints (Expert+) ===
// POST /api/glossary/mine/single - Mine terms from single document
router.post("/api/glossary/mine/single", upload.single('document'), requireRole(ROLES.USER), mineSingleDoc);

// POST /api/glossary/mine/parallel - Mine terms from parallel documents
router.post("/api/glossary/mine/parallel", upload.fields([
  { name: 'sourceDoc', maxCount: 1 },
  { name: 'targetDoc', maxCount: 1 }
]), requireRole(ROLES.USER), mineParallelDocs);

// === Term CRUD Endpoints ===
// GET /api/glossary/terms - List terms with filters
router.get("/api/glossary/terms", getTerms);

// GET /api/glossary/terms/:id - Get single term
router.get("/api/glossary/terms/:id", getTerm);

// POST /api/glossary/terms - Create new term (Expert+)
router.post("/api/glossary/terms", requireRole(ROLES.USER), createTerm);

// PATCH /api/glossary/terms/:id - Update term (auto-verifies, Expert+)
router.patch("/api/glossary/terms/:id", requireRole(ROLES.USER), updateTerm);

// DELETE /api/glossary/terms/:id - Delete term (Admin only -> User for testing)
router.delete("/api/glossary/terms/:id", requireRole(ROLES.USER), deleteTerm);

// === Verification Endpoints (Expert+) ===
// POST /api/glossary/terms/:id/verify - Verify/unverify single term
router.post("/api/glossary/terms/:id/verify", requireRole(ROLES.USER), verifyTerm);

// POST /api/glossary/terms/bulk-verify - Bulk verify multiple terms
router.post("/api/glossary/terms/bulk-verify", requireRole(ROLES.USER), bulkVerifyTerms);

// === TSV Generation Endpoint ===
// GET /api/glossary/generate-tsv - Generate TSV from verified terms
router.get("/api/glossary/generate-tsv", generateTSV);

// === History Endpoints ===
// GET /api/glossary/history - List extraction history
router.get("/api/glossary/history", getMiningHistory);

// DELETE /api/glossary/history/:batchId - Delete history entry
router.delete("/api/glossary/history/:batchId", deleteMiningHistory);

// GET /api/glossary/history/:batchId/source - Get SAS URL for source doc
router.get("/api/glossary/history/:batchId/source", getMiningSourceSAS);

export default router;
