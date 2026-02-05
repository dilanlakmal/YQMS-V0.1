/**
 * DocumentImageService.js
 * Renders PDF pages to images using Puppeteer and injected pdf.js
 * Bypasses need for system dependencies like poppler
 */

import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Path to pdf.js bundled with pdf-parse
const PDFJS_PATH = path.resolve("node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");
const PDF_WORKER_PATH = path.resolve("node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.worker.js");

class DocumentImageService {
    constructor() {
        this.browser = null;
        this.pdfJsContent = null;
        this.pdfWorkerContent = null;
    }

    /**
     * Initialize browser instance (lazy)
     */
    async getBrowser() {
        if (!this.browser) {
            console.log("Launching Puppeteer...");
            try {
                this.browser = await puppeteer.launch({
                    headless: "new",
                    args: ["--no-sandbox", "--disable-setuid-sandbox"]
                });
                console.log("Puppeteer launched");
            } catch (e) {
                console.error("Puppeteer launch failed:", e);
                throw e;
            }
        }
        return this.browser;
    }

    /**
     * Load pdf.js library content
     */
    async getPdfJsLib() {
        if (!this.pdfJsContent) {
            console.log("Loading pdf.js from:", PDFJS_PATH);
            try {
                this.pdfJsContent = await fs.readFile(PDFJS_PATH, "utf-8");
                console.log("pdf.js loaded, size:", this.pdfJsContent.length);
            } catch (err) {
                console.error("Failed to load pdf.js from node_modules:", err);
                throw new Error(`PDF Renderer dependency missing: ${err.message}`);
            }
        }
        return this.pdfJsContent;
    }

    /**
     * Load pdf.worker.js library content
     */
    async getPdfWorkerLib() {
        if (!this.pdfWorkerContent) {
            console.log("Loading pdf.worker.js from:", PDF_WORKER_PATH);
            try {
                this.pdfWorkerContent = await fs.readFile(PDF_WORKER_PATH, "utf-8");
                console.log("pdf.worker.js loaded, size:", this.pdfWorkerContent.length);
            } catch (err) {
                console.error("Failed to load pdf.worker.js from node_modules:", err);
                throw new Error(`PDF Renderer worker dependency missing: ${err.message}`);
            }
        }
        return this.pdfWorkerContent;
    }

    /**
     * Render a specific page of a PDF to a PNG buffer
     * @param {string} pdfFilePath - Absolute path to PDF file
     * @param {number} pageNumber - 1-based page number
     * @returns {Promise<Buffer>} - PNG image buffer
     */
    async renderPage(pdfFilePath, pageNumber) {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        // Listen for browser logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        try {
            // Read PDF as base64
            const pdfBuffer = await fs.readFile(pdfFilePath);
            const pdfBase64 = pdfBuffer.toString("base64");
            const pdfJsLib = await this.getPdfJsLib();
            const pdfWorkerLib = await this.getPdfWorkerLib();

            // Inject HTML with Canvas
            await page.setContent(`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { margin: 0; padding: 0; overflow: hidden; }
                        #the-canvas { display: block; }
                    </style>
                </head>
                <body>
                    <canvas id="the-canvas"></canvas>
                </body>
                </html>
            `);

            // Inject pdf.js safely
            console.log("Injecting pdf.js script...");
            await page.addScriptTag({ content: pdfJsLib });

            // Initialize PDFJS with Worker
            await page.evaluate((workerContent) => {
                // Create a Blob for the worker script
                const blob = new Blob([workerContent], { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(blob);

                // Configure PDFJS to use the worker Blob URL
                // @ts-ignore
                window.PDFJS.workerSrc = workerUrl;
                // @ts-ignore
                window.PDFJS.disableWorker = false;

                console.log("PDFJS Configured with Worker URL:", workerUrl);

                // Define render function globally
                // @ts-ignore
                window.render = async function (pdfData, pageNum) {
                    try {
                        console.log("Start Render fn");
                        const pdfDataArray = Uint8Array.from(atob(pdfData), c => c.charCodeAt(0));
                        // @ts-ignore
                        const loadingTask = PDFJS.getDocument({ data: pdfDataArray });
                        const pdf = await loadingTask.promise;
                        console.log("PDF Document Loaded");

                        const page = await pdf.getPage(pageNum);
                        console.log("Page Loaded");

                        const scale = 2.0;
                        const viewport = page.getViewport(scale);

                        const canvas = document.getElementById('the-canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        await page.render(renderContext).promise;
                        console.log("Page Rendered");
                        return true;
                    } catch (e) {
                        console.error("Render Error:", e);
                        return { error: e.message };
                    }
                };
            }, pdfWorkerLib);

            // Execute render function in browser context
            const result = await page.evaluate(async (data, num) => {
                // @ts-ignore
                return await window.render(data, num);
            }, pdfBase64, pageNumber);

            if (result && result.error) {
                throw new Error(`Client-side render failed: ${result.error}`);
            }

            // Get canvas element handle
            const canvas = await page.$("#the-canvas");
            if (!canvas) throw new Error("Canvas not found");

            // Screenshot the canvas
            const imageBuffer = await canvas.screenshot({ type: "png" });
            return imageBuffer;

        } catch (error) {
            console.error(`[PDF Render] Failed page ${pageNumber}:`, error);
            throw error;
        } finally {
            await page.close();
        }
    }

    /**
     * Cleanup browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export const documentImageService = new DocumentImageService();
export default documentImageService;
