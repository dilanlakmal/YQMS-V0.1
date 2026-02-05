/**
 * TokenAwareChunkingService.js
 * Token-safe chunking for LLM processing with paragraph preservation
 * Designed for 19k TPM limit with GPT-4o
 */

// Token estimation constants
const CHARS_PER_TOKEN = 4;  // Conservative estimate (actual varies by language)
const DEFAULT_MAX_TOKENS = 1800;  // Target 1,500-2,000 range

// TPM configuration
const TPM_LIMIT = 19000;
const SAFETY_MARGIN = 0.85;  // Use 85% of limit
const SAFE_TOKENS_PER_MINUTE = Math.floor(TPM_LIMIT * SAFETY_MARGIN);

export class TokenAwareChunkingService {

    /**
     * Estimate tokens from text
     * @param {string} text - Input text
     * @returns {number} - Estimated token count
     */
    estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / CHARS_PER_TOKEN);
    }

    /**
     * Main chunking method - splits pages into token-safe chunks
     * @param {Array<{pageNumber: number, cleanText: string}>} pages - Extracted pages
     * @param {Object} options - Chunking options
     * @returns {Array<Object>} - Array of chunks with metadata
     */
    chunkPages(pages, options = {}) {
        const {
            maxTokens = DEFAULT_MAX_TOKENS,
            preserveParagraphs = true,
            overlap = 0  // No overlap for glossary mining (avoid duplicate terms)
        } = options;

        if (!pages || pages.length === 0) return [];

        const MAX_CHARS = maxTokens * CHARS_PER_TOKEN;
        const chunks = [];

        let currentChunk = {
            text: "",
            pageRange: new Set(),
            startPage: null,
            endPage: null
        };

        for (const page of pages) {
            const pageText = page.cleanText || "";
            const pageNumber = page.pageNumber;

            // If page fits entirely in current chunk
            if (currentChunk.text.length + pageText.length + 2 <= MAX_CHARS) {
                this.appendToChunk(currentChunk, pageText, pageNumber);
            }
            // Page too big - need to split within page
            else if (pageText.length > MAX_CHARS) {
                // Finalize current chunk if it has content
                if (currentChunk.text.length > 0) {
                    chunks.push(this.finalizeChunk(currentChunk, chunks.length));
                    currentChunk = this.createEmptyChunk();
                }

                // Split large page into paragraphs
                const paragraphs = preserveParagraphs
                    ? this.splitIntoParagraphs(pageText)
                    : [pageText];

                for (const para of paragraphs) {
                    if (para.length > MAX_CHARS) {
                        // Paragraph too large - split by sentences
                        const sentences = this.splitIntoSentences(para);
                        for (const sentence of sentences) {
                            if (currentChunk.text.length + sentence.length + 1 > MAX_CHARS) {
                                if (currentChunk.text.length > 0) {
                                    chunks.push(this.finalizeChunk(currentChunk, chunks.length));
                                    currentChunk = this.createEmptyChunk();
                                }
                            }
                            this.appendToChunk(currentChunk, sentence, pageNumber);
                        }
                    } else if (currentChunk.text.length + para.length + 2 > MAX_CHARS) {
                        // Paragraph doesn't fit - start new chunk
                        if (currentChunk.text.length > 0) {
                            chunks.push(this.finalizeChunk(currentChunk, chunks.length));
                            currentChunk = this.createEmptyChunk();
                        }
                        this.appendToChunk(currentChunk, para, pageNumber);
                    } else {
                        this.appendToChunk(currentChunk, para, pageNumber);
                    }
                }
            }
            // Current chunk would overflow - finalize and start new
            else {
                chunks.push(this.finalizeChunk(currentChunk, chunks.length));
                currentChunk = this.createEmptyChunk();
                this.appendToChunk(currentChunk, pageText, pageNumber);
            }
        }

        // Finalize last chunk
        if (currentChunk.text.length > 0) {
            chunks.push(this.finalizeChunk(currentChunk, chunks.length));
        }

        return chunks;
    }

    /**
     * Create empty chunk structure
     */
    createEmptyChunk() {
        return {
            text: "",
            pageRange: new Set(),
            startPage: null,
            endPage: null
        };
    }

    /**
     * Append text to chunk and track page range
     */
    appendToChunk(chunk, text, pageNumber) {
        if (chunk.text.length > 0) {
            chunk.text += "\n\n";
        }
        chunk.text += text;
        chunk.pageRange.add(pageNumber);

        if (chunk.startPage === null) {
            chunk.startPage = pageNumber;
        }
        chunk.endPage = pageNumber;
    }

    /**
     * Finalize chunk with computed metadata
     */
    finalizeChunk(chunk, index) {
        const text = chunk.text.trim();
        const charCount = text.length;

        return {
            chunkIndex: index,
            text,
            charCount,
            tokenEstimate: Math.ceil(charCount / CHARS_PER_TOKEN),
            pageRange: Array.from(chunk.pageRange).sort((a, b) => a - b),
            startPage: chunk.startPage,
            endPage: chunk.endPage,
            status: "pending"
        };
    }

    /**
     * Split text into paragraphs (preserving structure)
     */
    splitIntoParagraphs(text) {
        return text
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }

    /**
     * Split text into sentences (for very long paragraphs)
     */
    splitIntoSentences(text) {
        // Split on sentence-ending punctuation followed by space or newline
        const sentences = text.split(/(?<=[.!?])\s+/);
        return sentences.filter(s => s.trim().length > 0);
    }

    /**
     * Calculate processing estimates for TPM-aware scheduling
     * @param {Array<Object>} chunks - Array of chunks
     * @returns {Object} - Processing estimates
     */
    calculateProcessingEstimates(chunks) {
        if (chunks.length === 0) {
            return {
                totalChunks: 0,
                totalTokens: 0,
                avgTokensPerChunk: 0,
                tpmLimit: TPM_LIMIT,
                safeTokensPerMinute: SAFE_TOKENS_PER_MINUTE,
                chunksPerMinute: 0,
                estimatedMinutes: 0,
                delayBetweenChunksMs: 0
            };
        }

        const totalTokens = chunks.reduce((sum, c) => sum + c.tokenEstimate, 0);
        const avgTokensPerChunk = totalTokens / chunks.length;

        // How many chunks can we process per minute at safe TPM?
        const chunksPerMinute = Math.floor(SAFE_TOKENS_PER_MINUTE / avgTokensPerChunk);
        const estimatedMinutes = Math.ceil(chunks.length / Math.max(chunksPerMinute, 1));

        // Recommended delay between chunks (in ms)
        const delayBetweenChunks = Math.ceil(60000 / Math.max(chunksPerMinute, 1));

        return {
            totalChunks: chunks.length,
            totalTokens,
            avgTokensPerChunk: Math.round(avgTokensPerChunk),
            tpmLimit: TPM_LIMIT,
            safeTokensPerMinute: SAFE_TOKENS_PER_MINUTE,
            chunksPerMinute,
            estimatedMinutes,
            delayBetweenChunksMs: delayBetweenChunks
        };
    }

    /**
     * Chunk and save to MongoDB
     * @param {string} jobId - Document job ID
     * @param {Array} pages - Extracted pages
     * @param {Object} DocumentChunk - Mongoose model
     * @returns {Promise<Object>} - Chunking result
     */
    async chunkAndSave(jobId, pages, DocumentChunk, options = {}) {
        // Generate chunks
        const chunks = this.chunkPages(pages, options);

        if (chunks.length === 0) {
            return {
                jobId,
                chunksCreated: 0,
                ...this.calculateProcessingEstimates([])
            };
        }

        // Prepare documents for MongoDB
        const chunkDocuments = chunks.map(chunk => ({
            jobId,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            charCount: chunk.charCount,
            tokenEstimate: chunk.tokenEstimate,
            pageRange: chunk.pageRange,
            startPage: chunk.startPage,
            endPage: chunk.endPage,
            status: "pending"
        }));

        // Save to MongoDB
        await DocumentChunk.insertMany(chunkDocuments);

        // Calculate estimates
        const estimates = this.calculateProcessingEstimates(chunks);

        return {
            jobId,
            chunksCreated: chunks.length,
            ...estimates
        };
    }
}

export const tokenAwareChunkingService = new TokenAwareChunkingService();
export default tokenAwareChunkingService;
