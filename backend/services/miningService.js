/**
 * Mining Service
 * Orchestrates term extraction from single and parallel documents
 * Uses LLM agents for domain detection, term extraction, and translation
 */

import { handleMiningConflicts } from './conflictHandler.js';

const MAX_CHUNK_SIZE = 4000;
const CONFIDENCE_THRESHOLD = 0.70;

/**
 * Mine terms from a single document
 * Extracts terms and translates them to target language
 * 
 * @param {Object} params - Mining parameters
 * @param {Object} params.GlossaryTerm - Mongoose model
 * @param {Object} params.llmService - LLM service for AI calls
 * @param {Buffer} params.fileBuffer - Document file buffer
 * @param {string} params.fileName - Document filename
 * @param {string} params.sourceLang - Source language code
 * @param {string} params.targetLang - Target language code
 * @param {string} [params.domain] - Optional domain (auto-detect if not provided)
 * @param {string} [params.project] - Optional project name
 * @returns {Promise<Object>} - Mining results
 */
export async function mineSingleDocument({
    GlossaryTerm,
    llmService,
    textExtractor,
    fileBuffer,
    fileName,
    sourceLang,
    targetLang,
    domain = null,
    project = null,
    miningBatchId = null
}) {
    console.log(`[Mining] Starting single doc mining: ${fileName}`);

    // 1. Extract text
    const text = await textExtractor(fileBuffer, fileName);
    if (text.length < 30) {
        throw new Error('Document too short for meaningful mining (min 100 chars)');
    }

    // 2. Detect domain if not provided
    let detectedDomain = domain;
    let domainConfidence = 1.0;
    if (!domain) {
        const domainResult = await llmService.detectDomain(text.slice(0, 2000));
        detectedDomain = domainResult.domain;
        domainConfidence = domainResult.confidence;
        console.log(`[Mining] Detected domain: ${detectedDomain} (${domainConfidence})`);
    }

    // 3. Extract terms in chunks
    const chunks = splitIntoChunks(text, MAX_CHUNK_SIZE);
    const allTerms = [];

    for (let i = 0; i < chunks.length; i++) {
        console.log(`[Mining] Extracting from chunk ${i + 1}/${chunks.length}`);
        const terms = await llmService.extractTerms(chunks[i], sourceLang, detectedDomain);
        allTerms.push(...terms);
    }

    // 4. Deduplicate by source
    const uniqueTerms = deduplicateBySource(allTerms);
    console.log(`[Mining] Found ${uniqueTerms.length} unique terms`);

    // 5. Translate each term
    for (const term of uniqueTerms) {
        const translation = await llmService.translateTerm(
            term.source || term.term,
            sourceLang,
            targetLang,
            detectedDomain,
            term.evidenceSentence || ''
        );
        term.source = term.source || term.term;
        term.target = translation.target;
        term.confidenceScore = translation.confidence;
        term.alternatives = translation.alternatives || [];
    }

    // 6. Prepare terms for insertion
    const projectName = project || fileName.replace(/\.[^.]+$/, '');
    const termsToInsert = uniqueTerms.map(term => ({
        source: term.source,
        target: term.target,
        sourceLang,
        targetLang,
        domain: detectedDomain,
        project: projectName,
        createdBy: {
            agent: 'agent-single-extraction',
            reviewerName: null
        },
        verificationStatus: 'unverified',
        confidenceScore: term.confidenceScore,
        metadata: {
            sourceFile: fileName,
            context: term.evidenceSentence || ''
        },
        miningBatchId
    }));

    // 7. Handle conflicts and insert
    const insertResults = await handleMiningConflicts(GlossaryTerm, termsToInsert);

    // 8. Enrich with review flags
    const enrichedTerms = uniqueTerms.map((term, i) => ({
        ...term,
        _id: insertResults.inserted.find(t => t.source === term.source)?.termId,
        needsReview: term.confidenceScore < CONFIDENCE_THRESHOLD,
        verificationStatus: 'unverified'
    }));

    return {
        success: true,
        miningType: 'single',
        domain: detectedDomain,
        domainConfidence,
        termsExtracted: uniqueTerms.length,
        termsInserted: insertResults.inserted.length,
        termsDuplicate: insertResults.skipped.length,
        termsConflict: insertResults.conflicts.length,
        insertedIds: insertResults.inserted.map(t => t.termId),
        conflicts: insertResults.conflicts,
        terms: enrichedTerms,
        miningBatchId
    };
}

/**
 * Mine terms from parallel documents
 * Extracts aligned bilingual term pairs
 * 
 * @param {Object} params - Mining parameters
 * @returns {Promise<Object>} - Mining results
 */
export async function mineParallelDocuments({
    GlossaryTerm,
    llmService,
    textExtractor,
    sourceBuffer,
    sourceFileName,
    targetBuffer,
    targetFileName,
    sourceLang,
    targetLang,
    domain = null,
    project = null,
    miningBatchId = null
}) {
    console.log(`[Mining] Starting parallel doc mining: ${sourceFileName} + ${targetFileName}`);

    // 1. Extract text from both files
    const sourceText = await textExtractor(sourceBuffer, sourceFileName);
    const targetText = await textExtractor(targetBuffer, targetFileName);

    // 2. Detect domain if not provided
    let detectedDomain = domain;
    if (!domain) {
        const domainResult = await llmService.detectDomain(sourceText.slice(0, 2000));
        detectedDomain = domainResult.domain;
        console.log(`[Mining] Detected domain: ${detectedDomain}`);
    }

    // 3. Align sentences (if alignment service available)
    let alignedPairs;
    try {
        alignedPairs = await llmService.alignSentences(sourceText, targetText, sourceLang, targetLang);
    } catch (e) {
        // Fallback: simple split by paragraphs
        console.log(`[Mining] Using fallback paragraph alignment`);
        alignedPairs = fallbackAlign(sourceText, targetText);
    }

    const alignmentScore = calculateAlignmentQuality(alignedPairs);
    console.log(`[Mining] Alignment score: ${alignmentScore}`);

    // 4. Extract bilingual terms in chunks
    const chunks = chunkAlignedPairs(alignedPairs, 20);
    const allTerms = [];

    for (let i = 0; i < chunks.length; i++) {
        console.log(`[Mining] Extracting pairs from chunk ${i + 1}/${chunks.length}`);
        const sourceChunk = chunks[i].map(p => p.source).join('\n');
        const targetChunk = chunks[i].map(p => p.target).join('\n');

        const terms = await llmService.extractParallelTerms(
            sourceChunk,
            targetChunk,
            sourceLang,
            targetLang,
            detectedDomain
        );
        allTerms.push(...terms);
    }

    // 5. Deduplicate
    const uniqueTerms = deduplicateBySource(allTerms);
    console.log(`[Mining] Found ${uniqueTerms.length} unique term pairs`);

    // 6. Apply review policy (confidence < 0.70 needs review)
    for (const term of uniqueTerms) {
        term.source = term.sourceTerm || term.source;
        term.target = term.targetTermOriginal || term.target;
        term.needsReview = term.confidence < CONFIDENCE_THRESHOLD;
        term.confidenceScore = term.confidence;
        if (term.needsReview) {
            term.reviewReason = 'Low confidence score - requires expert verification';
        }
        // IMPORTANT: Never auto-overwrite target from parallel docs
        // Always require explicit expert verification
    }

    // 7. Prepare for insertion
    const projectName = project || sourceFileName.replace(/\.[^.]+$/, '');
    const termsToInsert = uniqueTerms.map(term => ({
        source: term.source,
        target: term.target,
        sourceLang,
        targetLang,
        domain: detectedDomain,
        project: projectName,
        createdBy: {
            agent: 'agent-parallel-extraction',
            reviewerName: null
        },
        verificationStatus: 'unverified',
        confidenceScore: term.confidenceScore,
        metadata: {
            sourceFile: sourceFileName,
            context: term.evidenceSource || ''
        },
        miningBatchId
    }));

    // 8. Handle conflicts and insert
    const insertResults = await handleMiningConflicts(GlossaryTerm, termsToInsert);

    return {
        success: true,
        miningType: 'parallel',
        domain: detectedDomain,
        alignmentScore,
        termsExtracted: uniqueTerms.length,
        termsInserted: insertResults.inserted.length,
        termsDuplicate: insertResults.skipped.length,
        termsConflict: insertResults.conflicts.length,
        termsWithLowConfidence: uniqueTerms.filter(t => t.needsReview).length,
        insertedIds: insertResults.inserted.map(t => t.termId),
        conflicts: insertResults.conflicts,
        terms: uniqueTerms.map((term, i) => ({
            ...term,
            _id: insertResults.inserted.find(t => t.source === term.source)?.termId,
            verificationStatus: 'unverified'
        })),
        miningBatchId
    };
}

// ========== HELPER FUNCTIONS ==========

function splitIntoChunks(text, maxSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxSize) {
        chunks.push(text.slice(i, i + maxSize));
    }
    return chunks;
}

function deduplicateBySource(terms) {
    const seen = new Map();
    for (const term of terms) {
        const key = (term.source || term.term || term.sourceTerm || '').toLowerCase();
        if (!key) continue;
        const existing = seen.get(key);
        const score = term.confidenceScore || term.confidence || 0;
        if (!existing || score > (existing.confidenceScore || existing.confidence || 0)) {
            seen.set(key, term);
        }
    }
    return Array.from(seen.values());
}

function chunkAlignedPairs(pairs, chunkSize) {
    const chunks = [];
    for (let i = 0; i < pairs.length; i += chunkSize) {
        chunks.push(pairs.slice(i, i + chunkSize));
    }
    return chunks;
}

function calculateAlignmentQuality(pairs) {
    if (!pairs || pairs.length === 0) return 0;
    const validPairs = pairs.filter(p => p.source && p.target);
    return validPairs.length / pairs.length;
}

function fallbackAlign(sourceText, targetText) {
    const sourceParagraphs = sourceText.split(/\n\n+/).filter(p => p.trim());
    const targetParagraphs = targetText.split(/\n\n+/).filter(p => p.trim());
    const minLen = Math.min(sourceParagraphs.length, targetParagraphs.length);

    return Array.from({ length: minLen }, (_, i) => ({
        id: i,
        source: sourceParagraphs[i],
        target: targetParagraphs[i]
    }));
}

export default {
    mineSingleDocument,
    mineParallelDocuments,
    CONFIDENCE_THRESHOLD
};
