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
  downloadGlossary
} from "../../controller/glossaries/glossaryController.js";

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(process.cwd(), 'temp', 'glossaries');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${randomUUID()}-${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB max for glossary files
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.tsv', '.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

// POST /api/glossaries/upload - Upload glossary file
router.post("/api/glossaries/upload", upload.single('glossaryFile'), uploadGlossary);

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

export default router;

