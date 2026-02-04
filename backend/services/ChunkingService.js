export class ChunkingService {
    /**
     * Splits document into semantic chunks with metadata.
     * @param {Array<{pageNumber: number, text: string}>} pages 
     * @param {number} maxTokens Target tokens per chunk (default 4000)
     * @param {number} overlapTokens Overlap tokens (default 500)
     */
    chunkDocument(pages, maxTokens = 4000, overlapTokens = 500) {
        if (!pages || pages.length === 0) return [];

        const CHARS_PER_TOKEN = 4;
        const CHUNK_SIZE = maxTokens * CHARS_PER_TOKEN;
        const OVERLAP = overlapTokens * CHARS_PER_TOKEN;

        // 1. Flatten all text into one string and build Page Map
        let fullText = "";
        const pageMap = []; // [{ start: 0, end: 100, page: 1 }, ...]

        for (const p of pages) {
            const start = fullText.length;
            // Add some spacing between pages to prevent word merge
            const cleanText = (p.text || '').replace(/\r\n/g, '\n');
            fullText += cleanText + "\n\n";
            const end = fullText.length;
            pageMap.push({ start, end, page: p.pageNumber });
        }

        // 2. iterate and split
        const chunks = [];
        let cursor = 0;

        // Safety: Prevent infinite loops
        const MAX_LOOPS = 10000;
        let loopCount = 0;

        while (cursor < fullText.length && loopCount < MAX_LOOPS) {
            loopCount++;

            // Calculate proposed end
            let end = Math.min(cursor + CHUNK_SIZE, fullText.length);

            // 3. Smart Break: Try to find a paragraph or sentence end within the last 15% of the chunk
            if (end < fullText.length) {
                const lookback = Math.min(2000, CHUNK_SIZE * 0.15);
                const segment = fullText.substring(end - lookback, end);

                // Priority: Double Newline > Period+Space > Single Newline
                const breaks = [
                    segment.lastIndexOf('\n\n'),
                    segment.lastIndexOf('. '),
                    segment.lastIndexOf('\n')
                ];

                const bestBreak = breaks.find(b => b !== -1);

                if (bestBreak !== undefined && bestBreak !== -1) {
                    // Adjust end to just after the break
                    // bestBreak is relative to segment start (end - lookback)
                    end = (end - lookback) + bestBreak + 1;
                }
            }

            const chunkText = fullText.substring(cursor, end);

            // 4. Determine Page Range
            const pagesInChunk = new Set();
            for (const map of pageMap) {
                // Check intersection: [chunkStart, chunkEnd] overlaps [pageStart, pageEnd]
                // Overlap if (chunkStart < pageEnd) and (chunkEnd > pageStart)
                if (cursor < map.end && end > map.start) {
                    pagesInChunk.add(map.page);
                }
            }

            chunks.push({
                chunkId: chunks.length + 1,
                text: chunkText,
                pageRange: Array.from(pagesInChunk).sort((a, b) => a - b),
                tokenEstimate: Math.ceil(chunkText.length / CHARS_PER_TOKEN)
            });

            // Stop if we reached end
            if (end >= fullText.length) break;

            // 5. Advance Cursor with Overlap
            const nextCursor = end - OVERLAP;

            // Ensure forward progress
            if (nextCursor <= cursor) {
                cursor = end; // Force move if overlap is too big relative to chunk (unlikely)
            } else {
                cursor = nextCursor;
            }
        }

        return chunks;
    }
}

export const chunkingService = new ChunkingService();
