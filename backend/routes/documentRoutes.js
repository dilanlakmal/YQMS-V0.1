/**
 * documentRoutes.js
 * Routes for document ingestion, extraction, chunking, and mining
 */

import express from "express";
import multer from "multer";
import documentIngestionController from "../controller/documentIngestionController.js";

const router = express.Router();

// Configure multer for file uploads (memory storage for processing)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "image/png",
            "image/jpeg",
            "image/tiff",
            "image/bmp",
            "text/plain"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
    }
});

// Document Ingestion Routes
router.post("/ingest", upload.single("file"), documentIngestionController.ingestDocument);
router.get("/:jobId/status", documentIngestionController.getJobStatus);
router.post("/:jobId/extract", documentIngestionController.extractPages);
router.get("/:jobId/pages", documentIngestionController.getDocumentPages);
router.get("/:jobId/pages/:pageNumber", documentIngestionController.getPageContent);
router.get("/:jobId/pages/:pageNumber/image", documentIngestionController.getPageImage);
router.post("/:jobId/estimate", documentIngestionController.estimateTokens);
router.patch("/:jobId/pages/selection", documentIngestionController.updatePageSelection);

// Chunking and Processing Routes
router.post("/:jobId/chunk", documentIngestionController.createChunks);
router.post("/:jobId/process", documentIngestionController.processChunks);
router.get("/:jobId/process/status", documentIngestionController.getProcessingStatus);

export default router;
