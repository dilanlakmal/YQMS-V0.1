/**
 * Term Controller
 * Handles CRUD operations, verification, and mining for glossary terms
 */

import { getReviewerName } from '../../middleware/rbac.js';
import { mineSingleDocument, mineParallelDocuments } from '../../services/miningService.js';
import { generateJITGlossary, invalidateGlossaryCache } from '../../services/jitGlossaryService.js';
import llmService from '../../services/llmService.js';
import fs from 'fs';
import path from 'path';
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

// ========== TEXT EXTRACTION ==========

async function extractText(buffer, fileName) {
    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.pdf') {
        // Dynamic import to avoid pdf-parse test file loading on startup
        const pdfParse = (await import('pdf-parse')).default;
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
            domain: domain || 'General',
            project: project || '',
            createdBy: {
                agent: 'None',
                reviewerName
            },
            verificationStatus: 'verified', // Manual creation = auto-verified
            confidenceScore: 1.0 // Human confidence = 100%
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

        term.verificationStatus = verified ? 'verified' : 'unverified';
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

        const result = await Model.updateMany(
            { _id: { $in: termIds } },
            {
                $set: {
                    verificationStatus: newStatus,
                    'createdBy.reviewerName': reviewerName
                }
            }
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

// ========== MINING ==========

/**
 * POST /api/glossary/mine/single
 * Mine terms from single document
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

        const fileBuffer = fs.readFileSync(req.file.path);

        const result = await mineSingleDocument({
            GlossaryTerm: Model,
            llmService,
            textExtractor: extractText,
            fileBuffer,
            fileName: req.file.originalname,
            sourceLang: sourceLang.toLowerCase(),
            targetLang: targetLang.toLowerCase(),
            domain,
            project
        });

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        console.error('[TermController] mineSingleDoc error:', error);
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/glossary/mine/parallel
 * Mine terms from parallel documents
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

        const sourceBuffer = fs.readFileSync(req.files.sourceDoc[0].path);
        const targetBuffer = fs.readFileSync(req.files.targetDoc[0].path);

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
            project
        });

        // Cleanup temp files
        fs.unlinkSync(req.files.sourceDoc[0].path);
        fs.unlinkSync(req.files.targetDoc[0].path);

        res.json(result);
    } catch (error) {
        console.error('[TermController] mineParallelDocs error:', error);
        if (req.files?.sourceDoc?.[0]?.path) {
            try { fs.unlinkSync(req.files.sourceDoc[0].path); } catch (e) { }
        }
        if (req.files?.targetDoc?.[0]?.path) {
            try { fs.unlinkSync(req.files.targetDoc[0].path); } catch (e) { }
        }
        res.status(500).json({ success: false, error: error.message });
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
    generateTSV
};
