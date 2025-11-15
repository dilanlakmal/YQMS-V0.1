import express from "express";
import translateFiles, { uploadMiddleware, listFiles, downloadFile, deleteFile } from "../../controller/translate-files/translateFilesController.js";

const router = express.Router();

// POST /api/translate-files - Translate files
router.post("/api/translate-files", uploadMiddleware, translateFiles);

// GET /api/translate-files/list - List files in containers
router.get("/api/translate-files/list", listFiles);

// GET /api/translate-files/download - Download file from blob storage
router.get("/api/translate-files/download", downloadFile);

// DELETE /api/translate-files/delete - Delete file from blob storage
router.delete("/api/translate-files/delete", deleteFile);

export default router;