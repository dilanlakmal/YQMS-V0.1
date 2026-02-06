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
    miningBatchId = null,
    onProgress = () => { }
}) {
    console.log(`[Mining] Starting single doc mining: ${fileName}`);

    // 1. Extract text
    onProgress({ stage: 'Extracting text', percent: 5 });
    const text = await textExtractor(fileBuffer, fileName);
    if (text.length < 30) {
        throw new Error('Document too short for meaningful mining (min 100 chars)');
    }

    // 2. Detect domain if not provided
    let detectedDomain = domain;
    let domainConfidence = 1.0;
    if (!domain) {
        onProgress({ stage: 'Detecting domain', percent: 10 });
        const domainResult = await llmService.detectDomain(text.slice(0, 2000));
        detectedDomain = domainResult.domain;
        domainConfidence = domainResult.confidence;
        console.log(`[Mining] Detected domain: ${detectedDomain} (${domainConfidence})`);
    }

    // 3. Extract terms in chunks
    const chunks = splitIntoChunks(text, MAX_CHUNK_SIZE);
    const allTerms = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunkProgress = 10 + Math.floor(((i + 1) / chunks.length) * 40); // 10% to 50%
        onProgress({
            stage: `Extracting terms (chunk ${i + 1}/${chunks.length})`,
            percent: chunkProgress
        });
        console.log(`[Mining] Extracting from chunk ${i + 1}/${chunks.length}`);
        const terms = await llmService.extractTerms(chunks[i], sourceLang, detectedDomain);
        allTerms.push(...terms);
    }

    // 4. Deduplicate by source
    onProgress({ stage: 'Deduplicating terms', percent: 55 });
    const uniqueTerms = deduplicateBySource(allTerms);
    console.log(`[Mining] Found ${uniqueTerms.length} unique terms`);

    // 5. Translate each term
    const totalTerms = uniqueTerms.length;
    for (let i = 0; i < totalTerms; i++) {
        const term = uniqueTerms[i];
        const translationProgress = 55 + Math.floor(((i + 1) / totalTerms) * 35); // 55% to 90%
        onProgress({
            stage: `Translating terms (${i + 1}/${totalTerms}): ${term.source || term.term}`,
            percent: translationProgress,
            currentTerm: term.source || term.term
        });

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
    onProgress({ stage: 'Saving terms to database', percent: 95 });
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

    onProgress({ stage: 'Completed', percent: 100 });

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
    miningBatchId = null,
    onProgress = () => { }
}) {
    console.log(`[Mining] Starting parallel doc mining: ${sourceFileName} + ${targetFileName}`);

    // 1. Extract text from both files
    onProgress({ stage: 'Extracting text', percent: 5 });
    const sourceText = await textExtractor(sourceBuffer, sourceFileName);
    const targetText = await textExtractor(targetBuffer, targetFileName);

    // 2. Detect domain if not provided
    let detectedDomain = domain;
    if (!domain) {
        onProgress({ stage: 'Detecting domain', percent: 10 });
        const domainResult = await llmService.detectDomain(sourceText.slice(0, 2000));
        detectedDomain = domainResult.domain;
        console.log(`[Mining] Detected domain: ${detectedDomain}`);
    }

    // 3. Align sentences (if alignment service available)
    onProgress({ stage: 'Aligning documents', percent: 20 });
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
        const chunkProgress = 20 + Math.floor(((i + 1) / chunks.length) * 60); // 20% to 80%
        onProgress({
            stage: `Extracting parallel terms (chunk ${i + 1}/${chunks.length})`,
            percent: chunkProgress
        });
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
    onProgress({ stage: 'Deduplicating terms', percent: 85 });
    const uniqueTerms = deduplicateBySource(allTerms);
    console.log(`[Mining] Found ${uniqueTerms.length} unique term pairs`);

    // 6. Apply review policy and "Streamline" terms feedback (suggest ONLY when confidence >= 0.70)
    const validTerms = uniqueTerms.filter(term => {
        const score = term.confidence || term.confidenceScore || 0;
        return score >= CONFIDENCE_THRESHOLD;
    });

    const totalValid = validTerms.length;
    for (let i = 0; i < totalValid; i++) {
        const term = validTerms[i];
        const streamProgress = 85 + Math.floor(((i + 1) / totalValid) * 10); // 85% to 95%

        onProgress({
            stage: `Reviewing parallel terms (${i + 1}/${totalValid}): ${term.sourceTerm || term.source || term.term}`,
            percent: streamProgress,
            currentTerm: term.sourceTerm || term.source || term.term
        });

        term.source = term.sourceTerm || term.source || term.term;
        term.target = term.targetTermOriginal || term.target;
        term.confidenceScore = term.confidence || term.confidenceScore;
        term.needsReview = true; // All parallel terms need review as they should never overwrite silently

        // Small delay to allow the "streamline" effect in the UI
        if (totalValid > 5) {
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }

    console.log(`[Mining] Filtered to ${validTerms.length} terms meeting threshold >= ${CONFIDENCE_THRESHOLD}`);

    // 7. Prepare for insertion
    onProgress({ stage: 'Saving terms to database', percent: 95 });
    const projectName = project || sourceFileName.replace(/\.[^.]+$/, '');
    const termsToInsert = validTerms.map(term => ({
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

    onProgress({ stage: 'Completed', percent: 100 });

    return {
        success: true,
        miningType: 'parallel',
        domain: detectedDomain,
        alignmentScore,
        termsExtracted: uniqueTerms.length,
        termsSuggested: validTerms.length,
        termsInserted: insertResults.inserted.length,
        termsDuplicate: insertResults.skipped.length,
        termsConflict: insertResults.conflicts.length,
        insertedIds: insertResults.inserted.map(t => t.termId),
        conflicts: insertResults.conflicts,
        terms: validTerms.map((term, i) => ({
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
