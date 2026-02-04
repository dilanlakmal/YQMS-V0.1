import fs from 'fs';
import pdf from 'pdf-parse'; // Using pdf-parse for density check and digital extraction
import DocumentIntelligence, { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";

const endpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
const key = process.env.DOCUMENT_INTELLIGENCE_API_KEY;

export class PdfProcessorService {
    /**
     * Extracts text from a PDF file using a hybrid approach.
     * Returns structured data including page numbers.
     * @param {string} filePath - Path to the PDF file.
     * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string }> }>}
     */
    async extractText(input) {
        // 1. Read file buffer
        let buffer;
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (!fs.existsSync(input)) {
                throw new Error(`File not found: ${input}`);
            }
            buffer = fs.readFileSync(input);
        } else {
            throw new Error("Invalid input: expected file path or buffer");
        }

        // 2. Perform Text Density Check
        let density = 0;
        let pdfData = null;
        let mode = "UNKNOWN";

        try {
            // pdf-parse extracts the text layer
            pdfData = await pdf(buffer);
            const textLength = pdfData.text ? pdfData.text.trim().length : 0;
            const numPages = pdfData.numpages || 1;

            density = numPages > 0 ? textLength / numPages : 0;
            console.log(`[PdfProcessor] Density Analysis: ${textLength} chars / ${numPages} pages = ${density.toFixed(2)} chars/page`);

        } catch (err) {
            console.warn("[PdfProcessor] density check failed, defaulting to Azure DI:", err.message);
            density = 0;
        }

        // 3. Decide Mode
        if (density > 50) {
            mode = "DIGITAL";
            console.log(`[PdfProcessor] Mode: ${mode} -> Using local pdf-parse`);
            // We need to re-parse to get per-page structured data
            return await this.extractDigitalPdf(buffer);
        } else {
            mode = "SCANNED/HYBRID";
            console.log(`[PdfProcessor] Mode: ${mode} -> Using Azure Document Intelligence`);
            return await this.extractWithAzureDI(buffer);
        }
    }

    /**
     * Extracts text using pdf-parse with page awareness
     */
    async extractDigitalPdf(buffer) {
        const pages = [];

        const render_page = (pageData) => {
            return pageData.getTextContent().then(textContent => {
                let lastY, text = '';
                // Simple layout reconstruction
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) {
                        text += item.str;
                    } else {
                        text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                }
                // pdf-parse pageIndex is 0-based? usually, but let's assume so.
                // We push to external array
                pages.push({ pageNumber: pageData.pageIndex + 1, text: text });
                return text;
            });
        }

        const data = await pdf(buffer, { pagerender: render_page });

        // Ensure pages are sorted by pageNumber
        pages.sort((a, b) => a.pageNumber - b.pageNumber);

        return {
            fullText: data.text,
            pages: pages
        };
    }

    /**
     * Uploads file to Azure Document Intelligence and awaits result.
     */
    async extractWithAzureDI(fileBuffer) {
        if (!endpoint || !key) {
            throw new Error("Azure Document Intelligence credentials are missing in .env");
        }

        const client = DocumentIntelligence(endpoint, { key: key });
        const base64Source = fileBuffer.toString('base64');

        console.log("[PdfProcessor] Submitting job to Azure DI...");
        const initialResponse = await client.path("/documentModels/{modelId}:analyze", "prebuilt-read")
            .post({
                contentType: "application/json",
                body: { base64Source: base64Source }
            });

        if (isUnexpected(initialResponse)) {
            throw new Error(`Azure DI Request Failed: ${JSON.stringify(initialResponse.body)}`);
        }

        const poller = await getLongRunningPoller(client, initialResponse);
        const result = await poller.pollUntilDone();

        if (!result.body || !result.body.analyzeResult) {
            throw new Error("Azure DI returned empty result");
        }

        const analyzeResult = result.body.analyzeResult;
        const fullContent = analyzeResult.content;
        const pages = [];

        // Map pages using spans
        if (analyzeResult.pages) {
            for (const page of analyzeResult.pages) {
                let pageText = "";
                // Aggregate text from all spans in this page
                if (page.spans) {
                    for (const span of page.spans) {
                        // span: { offset, length }
                        pageText += fullContent.substring(span.offset, span.offset + span.length);
                    }
                }
                pages.push({
                    pageNumber: page.pageNumber, // Azure returns 1-based pageNumber usually
                    text: pageText
                });
            }
        }

        return {
            fullText: fullContent,
            pages: pages
        };
    }
}

export const pdfProcessor = new PdfProcessorService();
