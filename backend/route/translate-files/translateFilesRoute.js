import express from "express";
import translateFiles, { uploadMiddleware, listFiles, downloadFile, deleteFile, getCharacterCount } from "../../controller/translate-files/translateFilesController.js";

const router = express.Router();

// POST /api/translate-files - Translate files
router.post("/api/translate-files", uploadMiddleware, translateFiles);

// POST /api/translate-files/character-count - Count characters for translation
router.post("/api/translate-files/character-count", uploadMiddleware, getCharacterCount);

// GET /api/translate-files/list - List files in containers
router.get("/api/translate-files/list", listFiles);

// GET /api/translate-files/download - Download file from blob storage
router.get("/api/translate-files/download", downloadFile);

// DELETE /api/translate-files/delete - Delete file from blob storage
router.delete("/api/translate-files/delete", deleteFile);

export default router;