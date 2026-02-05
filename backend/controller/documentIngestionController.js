/**
 * documentIngestionController.js
 * Handles document upload, extraction, chunking, and mining
 */

import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import documentIntelligenceService from "../services/DocumentIntelligenceService.js";
import documentImageService from "../services/DocumentImageService.js";
import tokenAwareChunkingService from "../services/TokenAwareChunkingService.js";
import chunkProcessorService from "../services/ChunkProcessorService.js";
import llmService from "../services/llmService.js";
import { DocumentJob, DocumentPage, DocumentChunk, GlossaryTerm } from "./MongoDB/dbConnectionController.js";

const UPLOAD_DIR = path.resolve("./uploads/documents");

/**
 * POST /api/documents/ingest
 * Light ingestion: Save file and get page count
 */
export async function ingestDocument(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file provided"
            });
        }

        const { sourceLang, targetLang, domain, project } = req.body;
        const file = req.file;
        const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "");
        const jobId = randomUUID();

        console.log(`[Ingest] Light ingestion for job ${jobId} (${file.originalname})`);

        // 1. Save file to disk
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const filePath = path.join(UPLOAD_DIR, `${jobId}.${fileExt}`);
        await fs.writeFile(filePath, file.buffer);

        // 2. Get quick metadata
        const metadata = await documentIntelligenceService.getQuickMetadata(file.buffer, fileExt);

        // 3. Create job record
        await DocumentJob.create({
            jobId,
            fileName: file.originalname,
            fileType: fileExt,
            fileSizeBytes: file.size,
            status: "uploaded",
            sourceLang,
            targetLang,
            domain,
            project,
            pageCount: metadata.pageCount,
            uploadedAt: new Date()
        });

        // 4. Create placeholder pages
        const pageDocuments = [];
        for (let i = 1; i <= metadata.pageCount; i++) {
            pageDocuments.push({
                jobId,
                pageNumber: i,
                rawText: "",
                cleanText: "",
                charCount: 0,
                tokenEstimate: 0,
                isSelected: true
            });
        }
        await DocumentPage.insertMany(pageDocuments);

        return res.status(200).json({
            success: true,
            jobId,
            fileName: file.originalname,
            status: "uploaded",
            pageCount: metadata.pageCount,
            pages: pageDocuments.map(p => ({
                pageNumber: p.pageNumber,
                isSelected: p.isSelected,
                tokenEstimate: 0,
                charCount: 0
            }))
        });

    } catch (error) {
        console.error("[Ingest] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Document ingestion failed",
            message: error.message
        });
    }
}

/**
 * POST /api/documents/:jobId/extract
 * Perform actual extraction for selected pages
 */
export async function extractPages(req, res) {
    try {
        const { jobId } = req.params;
        const { selectedPages } = req.body; // Array of page numbers

        const job = await DocumentJob.findOne({ jobId });
        if (!job) {
            return res.status(404).json({ success: false, error: "Job not found" });
        }

        console.log(`[Extract] Starting analysis for job ${jobId}, pages: ${selectedPages.join(",")}`);

        // Update status
        await DocumentJob.updateOne({ jobId }, { status: "extracting", extractionStartedAt: new Date() });

        // Load file from disk
        const filePath = path.join(UPLOAD_DIR, `${jobId}.${job.fileType}`);
        const fileBuffer = await fs.readFile(filePath);

        // Call extraction service with page range
        const pageRange = selectedPages.join(",");
        const result = await documentIntelligenceService.extractDocument(
            fileBuffer,
            job.fileName,
            job.fileType,
            pageRange
        );

        // Update MongoDB records with extracted data
        for (const pageData of result.pages) {
            await DocumentPage.updateOne(
                { jobId, pageNumber: pageData.pageNumber },
                {
                    rawText: pageData.rawText,
                    cleanText: pageData.cleanText,
                    charCount: pageData.charCount,
                    tokenEstimate: pageData.tokenEstimate,
                    wordCount: pageData.wordCount,
                    lineCount: pageData.lineCount,
                    hasTable: pageData.hasTable,
                    tableCount: pageData.tableCount,
                    paragraphCount: pageData.paragraphCount,
                    width: pageData.width,
                    height: pageData.height,
                    unit: pageData.unit,
                    lines: pageData.lines,
                    isSelected: true
                }
            );
        }

        // Update job record
        await DocumentJob.updateOne(
            { jobId },
            {
                status: "extracted",
                extractionMethod: result.metadata.extractionMethod,
                totalCharacters: result.metadata.totalCharacters,
                totalTokenEstimate: result.metadata.totalTokenEstimate,
                azureOperationId: result.metadata.azureOperationId || null,
                extractionCompletedAt: new Date()
            }
        );

        return res.status(200).json({
            success: true,
            jobId,
            status: "extracted",
            extractCount: result.pages.length,
            metadata: result.metadata
        });

    } catch (error) {
        console.error("[Extract] Error:", error);
        await DocumentJob.updateOne({ jobId: req.params.jobId }, { status: "failed", errorMessage: error.message });
        return res.status(500).json({
            success: false,
            error: "Extraction failed",
            message: error.message
        });
    }
}

/**
 * GET /api/documents/:jobId/pages
 * Get all pages for a document
 */
export async function getDocumentPages(req, res) {
    try {
        const { jobId } = req.params;
        const { preview = "false" } = req.query;

        const job = await DocumentJob.findOne({ jobId });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: "Document not found"
            });
        }

        const pages = await DocumentPage.find({ jobId })
            .sort({ pageNumber: 1 })
            .lean();

        const responsePages = pages.map(p => ({
            pageNumber: p.pageNumber,
            charCount: p.charCount,
            tokenEstimate: p.tokenEstimate,
            wordCount: p.wordCount,
            lineCount: p.lineCount,
            hasTable: p.hasTable,
            // Layout Data (Lite)
            width: p.width,
            height: p.height,
            unit: p.unit,
            lines: p.lines || [],
            rawText: p.rawText || "",
            isSelected: p.isSelected,
            text: preview === "true"
                ? p.cleanText.substring(0, 500) + (p.cleanText.length > 500 ? "..." : "")
                : p.cleanText
        }));

        return res.status(200).json({
            success: true,
            jobId,
            fileName: job.fileName,
            status: job.status,
            pageCount: pages.length,
            totalTokenEstimate: pages.reduce((sum, p) => sum + p.tokenEstimate, 0),
            pages: responsePages
        });

    } catch (error) {
        console.error("[GetPages] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve pages",
            message: error.message
        });
    }
}

/**
 * GET /api/documents/:jobId/pages/:pageNumber
 * Get single page content
 */
export async function getPageContent(req, res) {
    try {
        const { jobId, pageNumber } = req.params;

        const page = await DocumentPage.findOne({
            jobId,
            pageNumber: parseInt(pageNumber)
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                error: "Page not found"
            });
        }

        return res.status(200).json({
            success: true,
            page: {
                pageNumber: page.pageNumber,
                rawText: page.rawText,
                cleanText: page.cleanText,
                charCount: page.charCount,
                tokenEstimate: page.tokenEstimate,
                wordCount: page.wordCount,
                lineCount: page.lineCount,
                hasTable: page.hasTable,
                tableCount: page.tableCount,
                paragraphCount: page.paragraphCount,
                // Layout Data
                width: page.width,
                height: page.height,
                unit: page.unit,
                lines: page.lines,
                isSelected: page.isSelected
            }
        });

    } catch (error) {
        console.error("[GetPage] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve page",
            message: error.message
        });
    }
}

/**
 * POST /api/documents/:jobId/estimate
 * Estimate tokens for selected pages
 */
export async function estimateTokens(req, res) {
    try {
        const { jobId } = req.params;
        const { selectedPages } = req.body; // Array of page numbers

        if (!selectedPages || !Array.isArray(selectedPages)) {
            return res.status(400).json({
                success: false,
                error: "selectedPages array is required"
            });
        }

        const pages = await DocumentPage.find({
            jobId,
            pageNumber: { $in: selectedPages }
        });

        const totalTokens = pages.reduce((sum, p) => sum + p.tokenEstimate, 0);
        const totalCharacters = pages.reduce((sum, p) => sum + p.charCount, 0);

        // Estimate processing with 19k TPM limit
        const TPM_LIMIT = 19000;
        const SAFETY_MARGIN = 0.8;
        const SAFE_TOKENS_PER_CHUNK = 1800;
        const estimatedChunks = Math.ceil(totalTokens / SAFE_TOKENS_PER_CHUNK);
        const estimatedMinutes = Math.ceil(estimatedChunks * 1.1); // ~1 minute per chunk

        return res.status(200).json({
            success: true,
            selectedPageCount: selectedPages.length,
            totalTokenEstimate: totalTokens,
            totalCharacters,
            processing: {
                estimatedChunks,
                estimatedMinutes,
                tpmLimit: TPM_LIMIT,
                safeTokensPerChunk: SAFE_TOKENS_PER_CHUNK
            },
            warning: totalTokens > 50000
                ? "Large document - processing may take several minutes"
                : null
        });

    } catch (error) {
        console.error("[Estimate] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Token estimation failed",
            message: error.message
        });
    }
}

/**
 * PATCH /api/documents/:jobId/pages/selection
 * Update page selection
 */
export async function updatePageSelection(req, res) {
    try {
        const { jobId } = req.params;
        const { selectedPages } = req.body; // Array of page numbers to select

        // First, deselect all pages
        await DocumentPage.updateMany(
            { jobId },
            { isSelected: false }
        );

        // Then select the specified pages
        if (selectedPages && selectedPages.length > 0) {
            await DocumentPage.updateMany(
                { jobId, pageNumber: { $in: selectedPages } },
                { isSelected: true }
            );
        }

        const updatedPages = await DocumentPage.find({ jobId })
            .sort({ pageNumber: 1 })
            .select("pageNumber isSelected tokenEstimate");

        return res.status(200).json({
            success: true,
            selectedCount: selectedPages?.length || 0,
            totalPages: updatedPages.length,
            pages: updatedPages
        });

    } catch (error) {
        console.error("[UpdateSelection] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update selection",
            message: error.message
        });
    }
}

/**
 * GET /api/documents/:jobId/status
 * Get job status
 */
export async function getJobStatus(req, res) {
    try {
        const { jobId } = req.params;

        const job = await DocumentJob.findOne({ jobId });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: "Job not found"
            });
        }

        return res.status(200).json({
            success: true,
            job: {
                jobId: job.jobId,
                fileName: job.fileName,
                fileType: job.fileType,
                status: job.status,
                pageCount: job.pageCount,
                totalCharacters: job.totalCharacters,
                totalTokenEstimate: job.totalTokenEstimate,
                extractionMethod: job.extractionMethod,
                errorMessage: job.errorMessage,
                uploadedAt: job.uploadedAt,
                extractionStartedAt: job.extractionStartedAt,
                extractionCompletedAt: job.extractionCompletedAt,
                miningStartedAt: job.miningStartedAt,
                miningCompletedAt: job.miningCompletedAt
            }
        });

    } catch (error) {
        console.error("[GetStatus] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get job status",
            message: error.message
        });
    }
}

/**
 * POST /api/documents/:jobId/chunk
 * Create chunks from selected pages
 */
export async function createChunks(req, res) {
    try {
        const { jobId } = req.params;
        const { maxTokens = 1800 } = req.body;

        // Get selected pages
        const pages = await DocumentPage.find({
            jobId,
            isSelected: true
        }).sort({ pageNumber: 1 });

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No pages selected for chunking"
            });
        }

        // Update job status
        await DocumentJob.updateOne(
            { jobId },
            { status: "chunking" }
        );

        // Clear any existing chunks for this job (in case of re-run)
        await DocumentChunk.deleteMany({ jobId });

        // Create chunks and save to MongoDB
        const result = await tokenAwareChunkingService.chunkAndSave(
            jobId,
            pages.map(p => ({ pageNumber: p.pageNumber, cleanText: p.cleanText })),
            DocumentChunk,
            { maxTokens }
        );

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("[CreateChunks] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Chunking failed",
            message: error.message
        });
    }
}

/**
 * POST /api/documents/:jobId/process
 * Start sequential chunk processing
 */
export async function processChunks(req, res) {
    try {
        const { jobId } = req.params;
        const { sourceLang, targetLang, domain, project } = req.body;

        if (!sourceLang || !targetLang) {
            return res.status(400).json({
                success: false,
                error: "sourceLang and targetLang are required"
            });
        }

        // Check if already processing
        const status = chunkProcessorService.getStatus();
        if (status.isProcessing) {
            return res.status(409).json({
                success: false,
                error: "Another job is currently processing",
                currentJobId: status.currentJobId
            });
        }

        // Start processing (async - returns immediately)
        chunkProcessorService.processJob(
            jobId,
            { DocumentChunk, GlossaryTerm, DocumentJob },
            { llmService },
            { sourceLang, targetLang, domain, project }
        ).then(result => {
            console.log(`[Process] Job ${jobId} completed:`, result);
        }).catch(err => {
            console.error(`[Process] Job ${jobId} failed:`, err);
        });

        return res.status(202).json({
            success: true,
            message: "Processing started",
            jobId,
            statusEndpoint: `/api/documents/${jobId}/process/status`
        });

    } catch (error) {
        console.error("[ProcessChunks] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to start processing",
            message: error.message
        });
    }
}

/**
 * GET /api/documents/:jobId/process/status
 * Get processing status
 */
export async function getProcessingStatus(req, res) {
    try {
        const { jobId } = req.params;

        const chunks = await DocumentChunk.find({ jobId });

        if (chunks.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No chunks found for this job"
            });
        }

        const pending = chunks.filter(c => c.status === "pending").length;
        const processing = chunks.filter(c => c.status === "processing").length;
        const completed = chunks.filter(c => c.status === "completed").length;
        const failed = chunks.filter(c => c.status === "failed").length;

        const termsExtracted = chunks
            .filter(c => c.status === "completed")
            .reduce((sum, c) => sum + c.termsExtracted, 0);

        return res.status(200).json({
            success: true,
            jobId,
            totalChunks: chunks.length,
            status: {
                pending,
                processing,
                completed,
                failed
            },
            percentComplete: chunks.length > 0
                ? Math.round((completed / chunks.length) * 100)
                : 0,
            termsExtracted,
            isComplete: pending === 0 && processing === 0
        });

    } catch (error) {
        console.error("[GetProcessingStatus] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get status",
            message: error.message
        });
    }
}

/**
 * GET /api/documents/:jobId/pages/:pageNumber/image
 * Render page as image
 */
export async function getPageImage(req, res) {
    try {
        const { jobId, pageNumber } = req.params;

        // Find job to get file extension
        const job = await DocumentJob.findOne({ jobId });
        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        const filePath = path.join(UPLOAD_DIR, `${jobId}.${job.fileType}`);

        // Render image
        const imageBuffer = await documentImageService.renderPage(filePath, parseInt(pageNumber));

        res.set("Content-Type", "image/png");
        res.send(imageBuffer);

    } catch (error) {
        console.error("[GetPageImage] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to render page image",
            message: error.message
        });
    }
}

export default {
    ingestDocument,
    extractPages,
    getDocumentPages,
    getPageContent,
    estimateTokens,
    updatePageSelection,
    getJobStatus,
    createChunks,
    processChunks,
    getProcessingStatus,
    getPageImage
};
