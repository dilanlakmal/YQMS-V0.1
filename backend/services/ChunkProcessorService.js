/**
 * ChunkProcessorService.js
 * Sequential chunk processor with TPM-aware rate limiting
 * Processes chunks one-by-one to prevent LLM overload
 */

import { EventEmitter } from "events";

// TPM Configuration
const TPM_LIMIT = 19000;
const SAFETY_MARGIN = 0.85;
const MIN_DELAY_MS = 3000;  // Minimum 3 seconds between chunks
const MAX_DELAY_MS = 60000; // Maximum 1 minute delay

export class ChunkProcessorService extends EventEmitter {

    constructor() {
        super();
        this.isProcessing = false;
        this.currentJobId = null;
        this.abortController = null;
    }

    /**
     * Process all chunks for a job sequentially
     * @param {string} jobId - Document job ID
     * @param {Object} models - { DocumentChunk, GlossaryTerm, DocumentJob }
     * @param {Object} services - { llmService }
     * @param {Object} options - Processing options
     */
    async processJob(jobId, models, services, options = {}) {
        const { DocumentChunk, GlossaryTerm, DocumentJob } = models;
        const { llmService } = services;
        const {
            sourceLang,
            targetLang,
            domain,
            project,
            onProgress
        } = options;

        if (this.isProcessing) {
            throw new Error("Another job is currently being processed");
        }

        this.isProcessing = true;
        this.currentJobId = jobId;
        this.abortController = new AbortController();

        try {
            // Update job status
            await DocumentJob.updateOne(
                { jobId },
                { status: "mining", miningStartedAt: new Date() }
            );

            // Get all pending chunks
            const chunks = await DocumentChunk.find({
                jobId,
                status: "pending"
            }).sort({ chunkIndex: 1 });

            if (chunks.length === 0) {
                await DocumentJob.updateOne(
                    { jobId },
                    { status: "completed", miningCompletedAt: new Date() }
                );
                return { success: true, message: "No pending chunks to process" };
            }

            const totalChunks = chunks.length;
            const totalTokens = chunks.reduce((sum, c) => sum + c.tokenEstimate, 0);

            // Calculate delay based on TPM
            const avgTokensPerChunk = totalTokens / totalChunks;
            const chunksPerMinute = Math.floor((TPM_LIMIT * SAFETY_MARGIN) / avgTokensPerChunk);
            const delayMs = Math.max(
                MIN_DELAY_MS,
                Math.min(MAX_DELAY_MS, Math.ceil(60000 / chunksPerMinute))
            );

            console.log(`[ChunkProcessor] Starting job ${jobId}: ${totalChunks} chunks, ${delayMs}ms delay`);

            let processedCount = 0;
            let totalTermsExtracted = 0;
            const errors = [];

            for (const chunk of chunks) {
                // Check for abort
                if (this.abortController.signal.aborted) {
                    console.log(`[ChunkProcessor] Job ${jobId} aborted`);
                    break;
                }

                try {
                    // Mark as processing
                    await DocumentChunk.updateOne(
                        { _id: chunk._id },
                        { status: "processing" }
                    );

                    const startTime = Date.now();

                    // Extract terms from chunk using LLM
                    const extractedTerms = await llmService.extractTerms(
                        chunk.text,
                        sourceLang,
                        domain
                    );

                    // Translate terms
                    const termsWithTranslation = [];
                    for (const term of extractedTerms) {
                        try {
                            const translation = await llmService.translateTerm(
                                term.term,
                                sourceLang,
                                targetLang,
                                domain,
                                term.evidenceSentence
                            );
                            termsWithTranslation.push({
                                source: term.term,
                                target: translation.target,
                                confidenceScore: (term.confidence + translation.confidence) / 2,
                                category: term.category,
                                context: term.evidenceSentence,
                                noTranslate: translation.no_translate
                            });
                        } catch (transErr) {
                            console.warn(`[ChunkProcessor] Translation failed for "${term.term}":`, transErr.message);
                        }
                    }

                    // Save terms to GlossaryTerm (unverified)
                    let insertedCount = 0;
                    for (const term of termsWithTranslation) {
                        if (term.noTranslate) continue; // Skip no-translate terms

                        try {
                            await GlossaryTerm.create({
                                source: term.source,
                                target: term.target,
                                sourceLang,
                                targetLang,
                                domain: domain || "General",
                                project: project || null,
                                createdBy: {
                                    agent: "agent-single-extraction",
                                    reviewerName: null
                                },
                                verificationStatus: "unverified",
                                confidenceScore: term.confidenceScore,
                                metadata: {
                                    sourceFile: `job:${jobId}`,
                                    context: term.context
                                },
                                miningBatchId: jobId
                            });
                            insertedCount++;
                        } catch (err) {
                            // Skip duplicates (code 11000)
                            if (err.code !== 11000) {
                                console.warn(`[ChunkProcessor] Failed to save term "${term.source}":`, err.message);
                            }
                        }
                    }

                    const processingTime = Date.now() - startTime;

                    // Update chunk as completed
                    await DocumentChunk.updateOne(
                        { _id: chunk._id },
                        {
                            status: "completed",
                            termsExtracted: insertedCount,
                            processingTimeMs: processingTime,
                            processedAt: new Date()
                        }
                    );

                    processedCount++;
                    totalTermsExtracted += insertedCount;

                    // Emit progress
                    const progress = {
                        jobId,
                        processedChunks: processedCount,
                        totalChunks,
                        percentComplete: Math.round((processedCount / totalChunks) * 100),
                        termsExtracted: totalTermsExtracted,
                        currentChunk: chunk.chunkIndex,
                        chunkTerms: insertedCount
                    };

                    this.emit("progress", progress);
                    if (onProgress) onProgress(progress);

                    console.log(`[ChunkProcessor] Chunk ${chunk.chunkIndex + 1}/${totalChunks}: ${insertedCount} terms (${processingTime}ms)`);

                    // Wait before next chunk (TPM rate limiting)
                    if (processedCount < totalChunks) {
                        await this.delay(delayMs);
                    }

                } catch (error) {
                    console.error(`[ChunkProcessor] Error on chunk ${chunk.chunkIndex}:`, error.message);

                    await DocumentChunk.updateOne(
                        { _id: chunk._id },
                        {
                            status: "failed",
                            errorMessage: error.message
                        }
                    );

                    errors.push({
                        chunkIndex: chunk.chunkIndex,
                        error: error.message
                    });

                    // Continue to next chunk despite error
                }
            }

            // Update job status
            await DocumentJob.updateOne(
                { jobId },
                { status: "completed", miningCompletedAt: new Date() }
            );

            return {
                success: true,
                jobId,
                processedChunks: processedCount,
                totalChunks,
                termsExtracted: totalTermsExtracted,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            // Update job status on failure
            await models.DocumentJob.updateOne(
                { jobId },
                { status: "failed", errorMessage: error.message }
            );
            throw error;

        } finally {
            this.isProcessing = false;
            this.currentJobId = null;
            this.abortController = null;
        }
    }

    /**
     * Abort current processing job
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Check if currently processing
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            currentJobId: this.currentJobId
        };
    }

    /**
     * Helper: delay with abort support
     */
    delay(ms) {
        return new Promise((resolve) => {
            const timeout = setTimeout(resolve, ms);

            if (this.abortController) {
                this.abortController.signal.addEventListener("abort", () => {
                    clearTimeout(timeout);
                    resolve();
                });
            }
        });
    }
}

export const chunkProcessorService = new ChunkProcessorService();
export default chunkProcessorService;
