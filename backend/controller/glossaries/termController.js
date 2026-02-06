/**
 * Term Controller
 * Handles CRUD operations, verification, and mining for glossary terms
 */

import { getReviewerName } from '../../middleware/rbac.js';
import { mineSingleDocument, mineParallelDocuments } from '../../services/miningService.js';
import { generateJITGlossary, invalidateGlossaryCache } from '../../services/jitGlossaryService.js';
import { uploadFileToBlob } from "../../AISystemUtils/system-translate/azureBlobHelper.js";
import llmService from '../../services/llmService.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
// NOTE: pdf-parse and mammoth are imported dynamically to avoid startup errors

// Dynamic import for GlossaryTerm model
let GlossaryTerm = null;
async function getModel() {
    if (!GlossaryTerm) {
        const { GlossaryTerm: Model } = await import('../../controller/MongoDB/dbConnectionController.js');
        GlossaryTerm = Model;
    }
    return GlossaryTerm;
}

// Dynamic import for MiningHistory model
let MiningHistory = null;
async function getHistoryModel() {
    if (!MiningHistory) {
        const { MiningHistory: Model } = await import('../../controller/MongoDB/dbConnectionController.js');
        MiningHistory = Model;
    }
    return MiningHistory;
}

// ========== TEXT EXTRACTION ==========

async function extractText(buffer, fileName) {
    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.pdf') {
        // Import directly from lib to avoid pdf-parse's problematic debug/test block in index.js
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
        const data = await pdfParse(buffer);
        return data.text;
    } else if (ext === '.docx') {
        // Dynamic import mammoth
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else if (ext === '.txt') {
        return buffer.toString('utf-8');
    } else {
        throw new Error(`Unsupported file format: ${ext}`);
    }
}

// ========== TERM CRUD ==========

/**
 * GET /api/glossary/terms
 * List terms with filters
 */
export async function getTerms(req, res) {
    try {
        const Model = await getModel();
        const {
            sourceLang,
            targetLang,
            domain,
            project,
            verificationStatus,
            search,
            confidenceMin,
            confidenceMax,
            miningBatchId,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        if (sourceLang) filter.sourceLang = sourceLang.toLowerCase();
        if (targetLang) filter.targetLang = targetLang.toLowerCase();
        if (domain) filter.domain = domain;
        if (miningBatchId) filter.miningBatchId = miningBatchId;
        if (project) filter.project = new RegExp(project, 'i');
        if (verificationStatus) filter.verificationStatus = verificationStatus;
        if (search) {
            filter.$or = [
                { source: new RegExp(search, 'i') },
                { target: new RegExp(search, 'i') }
            ];
        }
        if (confidenceMin || confidenceMax) {
            filter.confidenceScore = {};
            if (confidenceMin) filter.confidenceScore.$gte = parseFloat(confidenceMin);
            if (confidenceMax) filter.confidenceScore.$lte = parseFloat(confidenceMax);
        }

        // Filter by creator/source type
        if (req.query.creator) {
            const creator = req.query.creator.toLowerCase();
            if (creator === 'manual') {
                filter['createdBy.agent'] = 'None';
            } else if (creator === 'single') {
                filter['createdBy.agent'] = 'agent-single-extraction';
            } else if (creator === 'parallel') {
                filter['createdBy.agent'] = 'agent-parallel-extraction';
            }
        }

        // Build sort
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [terms, total] = await Promise.all([
            Model.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
            Model.countDocuments(filter)
        ]);

        res.json({
            success: true,
            terms,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('[TermController] getTerms error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/glossary/terms/:id
 * Get single term by ID
 */
export async function getTerm(req, res) {
    try {
        const Model = await getModel();
        const term = await Model.findById(req.params.id).lean();

        if (!term) {
            return res.status(404).json({ success: false, error: 'Term not found' });
        }

        res.json({ success: true, term });
    } catch (error) {
        console.error('[TermController] getTerm error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/glossary/terms
 * Create new term manually (auto-verified)
 */
export async function createTerm(req, res) {
    try {
        const Model = await getModel();
        const { source, target, sourceLang, targetLang, domain, project } = req.body;

        if (!source || !target || !sourceLang || !targetLang) {
            return res.status(400).json({
                success: false,
                error: 'source, target, sourceLang, and targetLang are required'
            });
        }

        const reviewerName = getReviewerName(req);

        const term = await Model.create({
            source,
            target,
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain: domain || 'Garment Industry',
            project: project || '',
            createdBy: {
                agent: 'None',
                reviewerName
            },
            verificationStatus: 'verified', // Manual creation = auto-verified
            confidenceScore: 1.0 // Human confidence = 100%
        });

        // Create manual history entry
        const HistoryModel = await getHistoryModel();
        await HistoryModel.create({
            batchId: `manual-${randomUUID()}`,
            sourceResource: 'Manual Input',
            miningType: 'manual',
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain: domain || 'Garment Industry',
            termCount: 1,
            stats: { verifiedCount: 1 },
            createdBy: { reviewerName }
        });

        res.status(201).json({ success: true, term });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'DUPLICATE',
                message: 'A term with this source already exists for this language pair'
            });
        }
        console.error('[TermController] createTerm error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * PATCH /api/glossary/terms/:id
 * Update term (auto-verifies on edit)
 */
export async function updateTerm(req, res) {
    try {
        const Model = await getModel();
        const { source, target, domain, project, reviewerName: reqReviewerName } = req.body;

        const term = await Model.findById(req.params.id);
        if (!term) {
            return res.status(404).json({ success: false, error: 'Term not found' });
        }

        const reviewerName = reqReviewerName || getReviewerName(req);
        const oldSourceLang = term.sourceLang;
        const oldTargetLang = term.targetLang;

        // Apply updates
        if (source !== undefined) term.source = source;
        if (target !== undefined) term.target = target;
        if (domain !== undefined) term.domain = domain;
        if (project !== undefined) term.project = project;

        // AUTO-VERIFY on any field edit
        if (source !== undefined || target !== undefined || domain !== undefined) {
            term.verificationStatus = 'verified';
        }

        // Update reviewer
        term.createdBy.reviewerName = reviewerName;

        await term.save();

        // Invalidate cache for affected language pair
        invalidateGlossaryCache(oldSourceLang, oldTargetLang);

        res.json({ success: true, term });
    } catch (error) {
        console.error('[TermController] updateTerm error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * DELETE /api/glossary/terms/:id
 * Delete term (Admin only)
 */
export async function deleteTerm(req, res) {
    try {
        const Model = await getModel();
        const term = await Model.findByIdAndDelete(req.params.id);

        if (!term) {
            return res.status(404).json({ success: false, error: 'Term not found' });
        }

        // Invalidate cache
        invalidateGlossaryCache(term.sourceLang, term.targetLang);

        res.json({ success: true, message: 'Term deleted' });
    } catch (error) {
        console.error('[TermController] deleteTerm error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

// ========== VERIFICATION ==========

/**
 * POST /api/glossary/terms/:id/verify
 * Verify or unverify a single term
 */
export async function verifyTerm(req, res) {
    try {
        const Model = await getModel();
        const { verified, reviewerName: reqReviewerName } = req.body;

        const term = await Model.findById(req.params.id);
        if (!term) {
            return res.status(404).json({ success: false, error: 'Term not found' });
        }

        const reviewerName = reqReviewerName || getReviewerName(req);

        if (verified) {
            // Verify: Snapshot original score if needed, set to 1.0
            if (term.originalConfidenceScore == null) {
                term.originalConfidenceScore = term.confidenceScore;
            }
            term.confidenceScore = 1.0;
            term.verificationStatus = 'verified';
        } else {
            // Unverify: Restore original score
            term.verificationStatus = 'unverified';
            if (term.originalConfidenceScore != null) {
                term.confidenceScore = term.originalConfidenceScore;
            }
        }

        term.createdBy.reviewerName = reviewerName;

        await term.save();

        // Invalidate cache
        invalidateGlossaryCache(term.sourceLang, term.targetLang);

        res.json({ success: true, term });
    } catch (error) {
        console.error('[TermController] verifyTerm error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/glossary/terms/bulk-verify
 * Bulk verify multiple terms
 */
export async function bulkVerifyTerms(req, res) {
    try {
        const Model = await getModel();
        const { termIds, verified, reviewerName: reqReviewerName } = req.body;

        if (!termIds || !Array.isArray(termIds) || termIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'termIds array is required'
            });
        }

        const reviewerName = reqReviewerName || getReviewerName(req);
        const newStatus = verified !== false ? 'verified' : 'unverified';

        let updatePipeline;
        if (verified !== false) {
            // Set to Verified (1.0), snapshot original if missing
            updatePipeline = [
                {
                    $set: {
                        originalConfidenceScore: { $ifNull: ["$originalConfidenceScore", "$confidenceScore"] },
                        confidenceScore: 1.0,
                        verificationStatus: 'verified',
                        'createdBy.reviewerName': reviewerName
                    }
                }
            ];
        } else {
            // Set to Unverified, restore original
            updatePipeline = [
                {
                    $set: {
                        confidenceScore: { $ifNull: ["$originalConfidenceScore", "$confidenceScore"] },
                        verificationStatus: 'unverified',
                        'createdBy.reviewerName': reviewerName
                    }
                }
            ];
        }

        const result = await Model.updateMany(
            { _id: { $in: termIds } },
            updatePipeline
        );

        // Get affected language pairs for cache invalidation
        const terms = await Model.find({ _id: { $in: termIds } }).select('sourceLang targetLang').lean();
        const langPairs = new Set(terms.map(t => `${t.sourceLang}-${t.targetLang}`));
        for (const pair of langPairs) {
            const [src, tgt] = pair.split('-');
            invalidateGlossaryCache(src, tgt);
        }

        res.json({
            success: true,
            modified: result.modifiedCount,
            message: `${result.modifiedCount} terms ${verified !== false ? 'verified' : 'unverified'}`
        });
    } catch (error) {
        console.error('[TermController] bulkVerifyTerms error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/glossary/mine/single
 * Mine terms from single document with streaming progress
 */
export async function mineSingleDoc(req, res) {
    try {
        const Model = await getModel();
        const { sourceLang, targetLang, domain, project } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Document file required' });
        }
        if (!sourceLang || !targetLang) {
            return res.status(400).json({ success: false, error: 'sourceLang and targetLang required' });
        }

        const miningBatchId = `single-${randomUUID()}`;
        const fileBuffer = req.file.buffer;

        // Set headers for streaming
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Helper to send progress
        const sendProgress = (data) => {
            res.write(JSON.stringify({ type: 'progress', ...data }) + '\n');
        };

        // 1. Upload source to Azure Blob Storage
        sendProgress({ stage: 'Uploading document to storage', percent: 2 });
        const blobName = `mining-sources/${miningBatchId}/${req.file.originalname}`;
        const sourceUrl = await uploadFileToBlob(
            fileBuffer,
            blobName,
            'glossaries',
            process.env.AZURE_STORAGE_ACCOUNT_NAME,
            process.env.AZURE_STORAGE_ACCOUNT_KEY
        );

        // 2. Mine terms
        const result = await mineSingleDocument({
            GlossaryTerm: Model,
            llmService,
            textExtractor: extractText,
            fileBuffer,
            fileName: req.file.originalname,
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain,
            project,
            miningBatchId,
            onProgress: (p) => sendProgress(p)
        });

        // 3. Create history entry
        const HistoryModel = await getHistoryModel();
        await HistoryModel.create({
            batchId: result.miningBatchId || miningBatchId,
            sourceResource: req.file.originalname,
            miningType: 'single',
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain: result.domain,
            termCount: result.termsExtracted,
            sourceUrl,
            createdBy: { reviewerName: getReviewerName(req) }
        });

        // Send final result
        res.write(JSON.stringify({ type: 'result', ...result }) + '\n');
        res.end();
    } catch (error) {
        console.error('[TermController] mineSingleDoc error:', error);
        // If headers already sent, we can't send a normal JSON error
        try {
            res.write(JSON.stringify({ type: 'error', error: error.message }) + '\n');
            res.end();
        } catch (e) {
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    }
}

/**
 * POST /api/glossary/mine/parallel
 * Mine terms from parallel documents with streaming progress
 */
export async function mineParallelDocs(req, res) {
    try {
        const Model = await getModel();
        const { sourceLang, targetLang, domain, project } = req.body;

        if (!req.files?.sourceDoc?.[0] || !req.files?.targetDoc?.[0]) {
            return res.status(400).json({ success: false, error: 'Both sourceDoc and targetDoc files required' });
        }
        if (!sourceLang || !targetLang) {
            return res.status(400).json({ success: false, error: 'sourceLang and targetLang required' });
        }

        const miningBatchId = `parallel-${randomUUID()}`;
        const sourceBuffer = req.files.sourceDoc[0].buffer;
        const targetBuffer = req.files.targetDoc[0].buffer;

        // Set headers for streaming
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Helper to send progress
        const sendProgress = (data) => {
            res.write(JSON.stringify({ type: 'progress', ...data }) + '\n');
        };

        // 1. Upload sources to Azure Blob Storage
        sendProgress({ stage: 'Uploading documents to storage', percent: 2 });
        const sourceBlobPath = `mining-sources/${miningBatchId}/${req.files.sourceDoc[0].originalname}`;
        const targetBlobPath = `mining-sources/${miningBatchId}/${req.files.targetDoc[0].originalname}`;

        const [sourceUrl, targetUrl] = await Promise.all([
            uploadFileToBlob(
                sourceBuffer,
                sourceBlobPath,
                'glossaries',
                process.env.AZURE_STORAGE_ACCOUNT_NAME,
                process.env.AZURE_STORAGE_ACCOUNT_KEY
            ).then(url => {
                sendProgress({ stage: 'Source document uploaded', percent: 3 });
                return url;
            }),
            uploadFileToBlob(
                targetBuffer,
                targetBlobPath,
                'glossaries',
                process.env.AZURE_STORAGE_ACCOUNT_NAME,
                process.env.AZURE_STORAGE_ACCOUNT_KEY
            ).then(url => {
                sendProgress({ stage: 'Target document uploaded', percent: 4 });
                return url;
            })
        ]);

        // 2. Mine terms
        const result = await mineParallelDocuments({
            GlossaryTerm: Model,
            llmService,
            textExtractor: extractText,
            sourceBuffer,
            sourceFileName: req.files.sourceDoc[0].originalname,
            targetBuffer,
            targetFileName: req.files.targetDoc[0].originalname,
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain,
            project,
            miningBatchId,
            onProgress: (p) => sendProgress(p)
        });

        // 3. Create history entry
        const HistoryModel = await getHistoryModel();
        await HistoryModel.create({
            batchId: result.miningBatchId || miningBatchId,
            sourceResource: `${req.files.sourceDoc[0].originalname} (Parallel)`,
            miningType: 'parallel',
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain: result.domain,
            termCount: result.termsExtracted,
            sourceUrl,
            targetUrl,
            createdBy: { reviewerName: getReviewerName(req) }
        });

        // Send final result
        res.write(JSON.stringify({ type: 'result', ...result }) + '\n');
        res.end();
    } catch (error) {
        console.error('[TermController] mineParallelDocs error:', error);
        try {
            res.write(JSON.stringify({ type: 'error', error: error.message }) + '\n');
            res.end();
        } catch (e) {
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    }
}

// ========== TSV GENERATION ==========

/**
 * GET /api/glossary/generate-tsv
 * Generate TSV from verified terms
 */
export async function generateTSV(req, res) {
    try {
        const Model = await getModel();
        const { sourceLang, targetLang, domain = 'General' } = req.query;

        if (!sourceLang || !targetLang) {
            return res.status(400).json({ success: false, error: 'sourceLang and targetLang required' });
        }

        // Import blob helpers dynamically
        const { uploadFileToBlob, getBlobSASUrl } = await import('../../controller/translate-files/translateFilesController.js');

        // Check if blob exists helper (simple implementation)
        const checkBlobExists = async (container, blobName) => {
            try {
                // Try to get metadata - if works, blob exists
                await getBlobSASUrl(container, blobName, 1);
                return true;
            } catch (e) {
                return false;
            }
        };

        const blobHelpers = { uploadFileToBlob, getBlobSASUrl, checkBlobExists };

        const result = await generateJITGlossary(
            Model,
            blobHelpers,
            sourceLang.toLowerCase(),
            targetLang.toLowerCase(),
            domain
        );

        if (!result) {
            return res.json({
                success: true,
                message: 'No verified terms found for this language pair',
                sasUrl: null
            });
        }

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('[TermController] generateTSV error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

// ========== HISTORY ENDPOINTS ==========

/**
 * GET /api/glossary/history
 * List mining history with statistics
 */
export async function getMiningHistory(req, res) {
    try {
        const HistoryModel = await getHistoryModel();
        const TermModel = await getModel();

        const history = await HistoryModel.find().sort({ createdAt: -1 }).lean();

        // Enhance with real-time stats
        const enrichedHistory = await Promise.all(history.map(async (item) => {
            const stats = await TermModel.aggregate([
                { $match: { miningBatchId: item.batchId } },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        verifiedCount: { $sum: { $cond: [{ $eq: ["$verificationStatus", "verified"] }, 1, 0] } }
                    }
                }
            ]);

            const result = stats[0] || { totalCount: item.termCount || 0, verifiedCount: item.stats?.verifiedCount || 0 };

            return {
                ...item,
                termCount: result.totalCount,
                verifiedCount: result.verifiedCount,
                percentVerified: result.totalCount > 0 ? Math.round((result.verifiedCount / result.totalCount) * 100) : 0
            };
        }));

        res.json({ success: true, history: enrichedHistory });
    } catch (error) {
        console.error('[TermController] getMiningHistory error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/glossary/history/:batchId/source
 * Get SAS URL for downloading a mining source file
 */
export async function getMiningSourceSAS(req, res) {
    try {
        const HistoryModel = await getHistoryModel();
        const { batchId } = req.params;
        const { type = 'source' } = req.query; // 'source' or 'target'

        const history = await HistoryModel.findOne({ batchId }).lean();
        if (!history) {
            return res.status(404).json({ success: false, error: 'History entry not found' });
        }

        const blobUrl = type === 'target' ? history.targetUrl : history.sourceUrl;
        if (!blobUrl) {
            return res.status(404).json({ success: false, error: 'File URL not found' });
        }

        // Extract blob name from URL
        // https://account.blob.core.windows.net/container/blobname -> container/blobname
        const urlObj = new URL(blobUrl);
        const pathParts = urlObj.pathname.split('/');
        const containerName = pathParts[1];
        const blobName = pathParts.slice(2).join('/');

        const { getBlobSASUrl } = await import("../../AISystemUtils/system-translate/azureBlobHelper.js");
        const sasUrl = await getBlobSASUrl(
            containerName,
            blobName,
            process.env.AZURE_STORAGE_ACCOUNT_NAME,
            process.env.AZURE_STORAGE_ACCOUNT_KEY,
            "r", // Read permission
            1 // 1 hour expiry
        );

        res.json({ success: true, sasUrl });
    } catch (error) {
        console.error('[TermController] getMiningSourceSAS error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * DELETE /api/glossary/history/:batchId
 * Delete history entry and optionally its terms
 */
export async function deleteMiningHistory(req, res) {
    try {
        const HistoryModel = await getHistoryModel();
        const TermModel = await getModel();
        const { batchId } = req.params;
        const { deleteTerms = 'false' } = req.query;

        console.log(`[TermController] Deleting history batch: ${batchId}, deleteTerms: ${deleteTerms}`);

        // Delete from history
        await HistoryModel.findOneAndDelete({ batchId });

        // Optionally delete terms
        if (deleteTerms === 'true') {
            await TermModel.deleteMany({ miningBatchId: batchId });
        } else {
            // Or just unlink them
            await TermModel.updateMany({ miningBatchId: batchId }, { $set: { miningBatchId: null } });
        }

        res.json({ success: true, message: 'History entry deleted successfully' });
    } catch (error) {
        console.error('[TermController] deleteMiningHistory error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
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
    deleteMiningHistory
};
