/**
 * DocumentIntelligenceService.js
 * Production-ready Azure Document Intelligence integration
 * Handles PDF, DOCX, and image extraction with job tracking
 */

import DocumentIntelligence, { isUnexpected } from "@azure-rest/ai-document-intelligence";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";
import path from "path";

const endpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
const apiKey = process.env.DOCUMENT_INTELLIGENCE_API_KEY;

// Token estimation: ~4 characters per token
const CHARS_PER_TOKEN = 4;

export class DocumentIntelligenceService {
    constructor() {
        if (!endpoint || !apiKey) {
            console.warn("[DocumentIntelligenceService] Azure DI credentials not configured");
        }
        this.client = endpoint && apiKey
            ? DocumentIntelligence(endpoint, { key: apiKey })
            : null;
    }

    /**
     * Main entry point - extract document based on file type
     * @param {Buffer} fileBuffer - File content
     * @param {string} fileName - Original filename
     * @param {string} fileType - File extension (pdf, docx, png, etc.)
     * @param {string} pageRange - Optional page range (e.g. "1,2,5-8")
     * @returns {Promise<{ pages: Array, metadata: Object }>}
     */
    async extractDocument(fileBuffer, fileName, fileType, pageRange = null) {
        const normalizedType = fileType.toLowerCase().replace(".", "");

        switch (normalizedType) {
            case "pdf":
                return await this.extractPdf(fileBuffer, fileName, pageRange);
            case "docx":
            case "doc":
                return await this.extractDocx(fileBuffer, fileName); // mammoth doesn't support page range
            case "png":
            case "jpg":
            case "jpeg":
            case "tiff":
            case "bmp":
                return await this.extractImage(fileBuffer, fileName, normalizedType);
            case "txt":
                return await this.extractPlainText(fileBuffer, fileName);
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
    }

    /**
     * PDF extraction with hybrid approach (local for digital, Azure DI for scanned)
     */
    async extractPdf(fileBuffer, fileName, pageRange = null) {
        // 1. Text density check
        let density = 0;
        let pdfData = null;

        try {
            pdfData = await pdf(fileBuffer);
            const textLength = pdfData.text ? pdfData.text.trim().length : 0;
            const numPages = pdfData.numpages || 1;
            density = numPages > 0 ? textLength / numPages : 0;
            console.log(`[DI Service] PDF density: ${density.toFixed(2)} chars/page`);
        } catch (err) {
            console.warn("[DI Service] PDF density check failed:", err.message);
            density = 0;
        }

        // 2. Choose extraction method
        if (density > 50) {
            console.log("[DI Service] Using local pdf-parse (digital PDF)");
            return await this.extractDigitalPdf(fileBuffer, fileName, pageRange);
        } else {
            console.log("[DI Service] Using Azure DI (scanned/complex PDF)");
            return await this.extractWithAzureDI(fileBuffer, fileName, "pdf", pageRange);
        }
    }

    /**
     * Local PDF extraction with page-aware rendering
     */
    async extractDigitalPdf(fileBuffer, fileName, pageRange = null) {
        const pages = [];
        const targetPages = pageRange ? pageRange.split(",").map(p => parseInt(p.trim())) : null;

        const renderPage = (pageData) => {
            return pageData.getTextContent().then(textContent => {
                let lastY = null;
                let text = "";

                for (const item of textContent.items) {
                    if (lastY === item.transform[5] || lastY === null) {
                        text += item.str;
                    } else {
                        text += "\n" + item.str;
                    }
                    lastY = item.transform[5];
                }

                pages.push({
                    pageNumber: pageData.pageIndex + 1,
                    rawText: text,
                    cleanText: this.cleanText(text)
                });
                return text;
            });
        };

        const data = await pdf(fileBuffer, { pagerender: renderPage });

        // Filter by pageRange if provided
        let filteredPages = pages.sort((a, b) => a.pageNumber - b.pageNumber);
        if (targetPages) {
            filteredPages = filteredPages.filter(p => targetPages.includes(p.pageNumber));
        }

        // Enrich with metrics
        const enrichedPages = filteredPages.map(p => this.enrichPageMetrics(p));

        return {
            pages: enrichedPages,
            metadata: {
                fileName,
                extractionMethod: "pdf-parse",
                pageCount: filteredPages.length,
                totalCharacters: enrichedPages.reduce((sum, p) => sum + p.charCount, 0),
                totalTokenEstimate: enrichedPages.reduce((sum, p) => sum + p.tokenEstimate, 0)
            }
        };
    }

    /**
     * DOCX extraction using mammoth
     */
    async extractDocx(fileBuffer, fileName) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const text = result.value || "";

        // DOCX doesn't have natural page breaks, so we create artificial pages
        // based on paragraph density (~3000 chars per page)
        const pages = this.splitTextIntoPages(text, 3000);

        return {
            pages: pages.map(p => this.enrichPageMetrics(p)),
            metadata: {
                fileName,
                extractionMethod: "mammoth",
                pageCount: pages.length,
                totalCharacters: text.length,
                totalTokenEstimate: Math.ceil(text.length / CHARS_PER_TOKEN)
            }
        };
    }

    /**
     * Image extraction via Azure DI OCR
     */
    async extractImage(fileBuffer, fileName, imageType) {
        return await this.extractWithAzureDI(fileBuffer, fileName, imageType);
    }

    /**
     * Plain text extraction
     */
    async extractPlainText(fileBuffer, fileName) {
        const text = fileBuffer.toString("utf-8");
        const pages = this.splitTextIntoPages(text, 3000);

        return {
            pages: pages.map(p => this.enrichPageMetrics(p)),
            metadata: {
                fileName,
                extractionMethod: "plaintext",
                pageCount: pages.length,
                totalCharacters: text.length,
                totalTokenEstimate: Math.ceil(text.length / CHARS_PER_TOKEN)
            }
        };
    }

    /**
     * Get basic metadata (like page count) without full extraction
     * Used for initial preview stage
     */
    async getQuickMetadata(fileBuffer, fileExt) {
        const normalizedType = fileExt.toLowerCase().replace(".", "");
        let pageCount = 1;

        try {
            if (normalizedType === "pdf") {
                const data = await pdf(fileBuffer);
                pageCount = data.numpages || 1;
            } else if (normalizedType === "docx" || normalizedType === "doc") {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                const text = result.value || "";
                // Estimate pages based on char count (~3000 per page)
                pageCount = Math.max(1, Math.ceil(text.length / 3000));
            }
            // Images etc default to 1
        } catch (err) {
            console.warn("[DI Service] Quick metadata check failed:", err.message);
        }

        return { pageCount };
    }

    /**
     * Azure Document Intelligence extraction (for scanned PDFs and images)
     */
    async extractWithAzureDI(fileBuffer, fileName, fileType, pageRange = null) {
        if (!this.client) {
            throw new Error("Azure Document Intelligence not configured");
        }

        const base64Source = fileBuffer.toString("base64");

        console.log(`[DI Service] Submitting ${fileType} (Pages: ${pageRange || "all"}) to Azure DI...`);

        try {
            // Use prebuilt-layout for better structure extraction
            const queryParams = pageRange ? { pages: pageRange } : {};
            const initialResponse = await this.client
                .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
                .post({
                    contentType: "application/json",
                    body: { base64Source },
                    queryParameters: queryParams
                });

            if (isUnexpected(initialResponse)) {
                throw new Error(`Azure DI request failed: ${JSON.stringify(initialResponse.body)}`);
            }

            // Get operation-location for polling
            const operationLocation = initialResponse.headers["operation-location"];
            if (!operationLocation) {
                throw new Error("No operation-location header in response");
            }

            console.log(`[DI Service] Polling for results...`);

            // Poll for completion manually
            let result = null;
            let attempts = 0;
            const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
            const pollIntervalMs = 2000;

            while (attempts < maxAttempts) {
                attempts++;
                await this.delay(pollIntervalMs);

                // Extract operation ID from the URL
                const operationId = operationLocation.split("/").pop().split("?")[0];

                const statusResponse = await this.client
                    .path("/documentModels/{modelId}/analyzeResults/{resultId}", "prebuilt-layout", operationId)
                    .get();

                if (isUnexpected(statusResponse)) {
                    throw new Error(`Status check failed: ${JSON.stringify(statusResponse.body)}`);
                }

                const status = statusResponse.body.status;
                console.log(`[DI Service] Poll attempt ${attempts}: status = ${status}`);

                if (status === "succeeded") {
                    result = statusResponse.body;
                    break;
                } else if (status === "failed") {
                    throw new Error(`Azure DI analysis failed: ${JSON.stringify(statusResponse.body.error)}`);
                }
                // status === "running" - continue polling
            }

            if (!result) {
                throw new Error("Azure DI analysis timed out after 2 minutes");
            }

            if (!result.analyzeResult) {
                throw new Error("Azure DI returned empty result");
            }

            const analyzeResult = result.analyzeResult;

            // --- Log Raw Result for Debugging ---
            try {
                const debugDir = path.resolve("uploads");
                await fs.mkdir(debugDir, { recursive: true });
                const debugFilename = `debug_azure_result_${Date.now()}_${fileName.replace(/[^a-z0-9]/gi, '_')}.json`;
                const debugPath = path.resolve(debugDir, debugFilename);
                await fs.writeFile(debugPath, JSON.stringify(result, null, 2));
                console.log(`[DI Service] Raw Azure result saved to: ${debugPath}`);

                // --- USER REQUEST: Show raw result in terminal ---
                console.log("\n--- [START] RAW AZURE DOCUMENT INTELLIGENCE RESULT ---");
                console.log(JSON.stringify(result, null, 2));
                console.log("--- [END] RAW AZURE DOCUMENT INTELLIGENCE RESULT ---\n");
                // -------------------------------------------------

            } catch (logErr) {
                console.warn("[DI Service] Failed to save raw debug log:", logErr.message);
            }
            // ------------------------------------

            const fullContent = analyzeResult.content || "";
            const pages = [];

            // Process pages with paragraph/table awareness (Strictly filter for requested pages)
            const targetPages = pageRange ? pageRange.split(",").map(p => parseInt(p.trim())) : null;

            if (analyzeResult.pages) {
                for (const page of analyzeResult.pages) {
                    // Only process if it's in our requested range
                    if (targetPages && !targetPages.includes(page.pageNumber)) {
                        continue;
                    }

                    const pageData = this.processAzureDIPage(page, analyzeResult, fullContent);
                    pages.push(pageData);
                }
            }

            const enrichedPages = pages.map(p => this.enrichPageMetrics(p));

            return {
                pages: enrichedPages,
                metadata: {
                    fileName,
                    extractionMethod: "azure-di",
                    pageCount: pages.length,
                    totalCharacters: enrichedPages.reduce((sum, p) => sum + p.charCount, 0),
                    totalTokenEstimate: enrichedPages.reduce((sum, p) => sum + p.tokenEstimate, 0),
                    azureOperationId: operationLocation.split("/").pop() || null
                }
            };

        } catch (error) {
            console.error("[DI Service] Azure DI error:", error.message);
            throw error;
        }
    }

    /**
     * Delay helper for polling
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Process Azure DI page result with paragraph merging
     */
    processAzureDIPage(page, analyzeResult, fullContent) {
        let rawText = "";
        let paragraphCount = 0;
        let tableCount = 0;
        let hasTable = false;

        // Extract text from spans
        if (page.spans) {
            for (const span of page.spans) {
                rawText += fullContent.substring(span.offset, span.offset + span.length);
            }
        }

        // Count paragraphs in this page
        if (analyzeResult.paragraphs) {
            for (const para of analyzeResult.paragraphs) {
                if (para.boundingRegions?.some(r => r.pageNumber === page.pageNumber)) {
                    paragraphCount++;
                }
            }
        }

        // Count tables in this page
        if (analyzeResult.tables) {
            for (const table of analyzeResult.tables) {
                if (table.boundingRegions?.some(r => r.pageNumber === page.pageNumber)) {
                    tableCount++;
                    hasTable = true;
                }
            }
        }

        return {
            pageNumber: page.pageNumber,
            rawText,
            cleanText: this.cleanText(rawText),
            paragraphCount,
            tableCount,
            hasTable,
            // Visual Layout Data
            width: page.width,
            height: page.height,
            unit: page.unit,
            lines: page.lines ? page.lines.map(l => ({
                content: l.content,
                polygon: l.polygon
            })) : []
        };
    }

    /**
     * Clean text for LLM consumption
     * Removes excessive whitespace, normalizes line breaks
     */
    cleanText(text) {
        if (!text) return "";

        return text
            // Normalize line endings
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            // Remove excessive blank lines (keep max 2)
            .replace(/\n{3,}/g, "\n\n")
            // Remove leading/trailing whitespace from each line
            .split("\n")
            .map(line => line.trim())
            .join("\n")
            // Remove leading/trailing whitespace
            .trim();
    }

    /**
     * Enrich page with computed metrics
     */
    enrichPageMetrics(page) {
        const charCount = page.cleanText.length;
        const lines = page.cleanText.split("\n").filter(l => l.trim());
        const words = page.cleanText.split(/\s+/).filter(w => w.trim());

        return {
            ...page,
            charCount,
            tokenEstimate: Math.ceil(charCount / CHARS_PER_TOKEN),
            lineCount: lines.length,
            wordCount: words.length
        };
    }

    /**
     * Split text into artificial pages (for DOCX/TXT)
     */
    splitTextIntoPages(text, charsPerPage = 3000) {
        const pages = [];
        const paragraphs = text.split(/\n\s*\n/);
        let currentPage = { pageNumber: 1, rawText: "", cleanText: "" };
        let currentLength = 0;

        for (const para of paragraphs) {
            if (currentLength + para.length > charsPerPage && currentLength > 0) {
                currentPage.cleanText = this.cleanText(currentPage.rawText);
                pages.push(currentPage);
                currentPage = { pageNumber: pages.length + 1, rawText: "", cleanText: "" };
                currentLength = 0;
            }
            currentPage.rawText += (currentLength > 0 ? "\n\n" : "") + para;
            currentLength += para.length;
        }

        // Add last page
        if (currentPage.rawText) {
            currentPage.cleanText = this.cleanText(currentPage.rawText);
            pages.push(currentPage);
        }

        return pages;
    }
}

export const documentIntelligenceService = new DocumentIntelligenceService();
export default documentIntelligenceService;
