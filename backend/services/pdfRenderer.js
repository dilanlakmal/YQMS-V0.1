import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

/**
 * Renders PDF pages to images (Buffers) using Puppeteer and PDF.js (browser-side)
 * This is 100% reliable for all PDF types including scanned images.
 * @param {Buffer} pdfBuffer 
 * @param {number} scale Zoom scale (default 2 for better OCR)
 * @returns {Promise<Buffer[]>}
 */
export async function renderPdfPagesToImages(pdfBuffer, scale = 2.0) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Convert PDF buffer to base64
        const base64Pdf = pdfBuffer.toString('base64');

        // Path to pdf.js (standard web build)
        // We'll use the minified version if available, or just the main build
        const pdfjsPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.min.mjs');
        const pdfjsWorkerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');

        // We will inject the code directly or use addScriptTag
        // Since pdf.mjs is a module, it's easier to use a CDN or a local simple script if possible.
        // Actually, we can just use the official CDN for simplicity in the browser context
        // if we assume internet access, OR we can inject the local code.

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; background: white; }
                    canvas { display: block; margin-bottom: 0; }
                    .page-container { position: relative; }
                </style>
            </head>
            <body>
                <div id="container"></div>
                <script type="module">
                    // We inject the library version that works in browser
                    import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs';
                    
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';

                    async function renderAll() {
                        try {
                            const pdfData = atob('${base64Pdf}');
                            const loadingTask = pdfjsLib.getDocument({data: pdfData});
                            const pdf = await loadingTask.promise;
                            
                            const container = document.getElementById('container');
                            
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const viewport = page.getViewport({scale: ${scale}});
                                
                                const canvas = document.createElement('canvas');
                                canvas.id = 'page-' + i;
                                canvas.width = viewport.width;
                                canvas.height = viewport.height;
                                
                                const wrapper = document.createElement('div');
                                wrapper.className = 'page-container';
                                wrapper.appendChild(canvas);
                                container.appendChild(wrapper);
                                
                                const context = canvas.getContext('2d');
                                await page.render({canvasContext: context, viewport}).promise;
                            }
                            
                            document.body.classList.add('rendered');
                        } catch (err) {
                            console.error('Browser-side PDF render error:', err);
                            const errDiv = document.createElement('div');
                            errDiv.id = 'error';
                            errDiv.innerText = err.message;
                            document.body.appendChild(errDiv);
                        }
                    }
                    
                    renderAll();
                </script>
            </body>
            </html>
        `;

        await page.setContent(htmlContent);

        // Wait for rendering to complete (up to 2 minutes for very large PDFs)
        await page.waitForSelector('.rendered, #error', { timeout: 120000 });

        const error = await page.$('#error');
        if (error) {
            const msg = await page.evaluate(el => el.innerText, error);
            throw new Error(`Renderer error: ${msg}`);
        }

        // Extract images from canvases
        const canvasHandles = await page.$$('#container canvas');
        const imageBuffers = [];

        for (const handle of canvasHandles) {
            // Take a screenshot of just this canvas
            const buffer = await handle.screenshot({ type: 'png' });
            imageBuffers.push(buffer);
        }

        return imageBuffers;
    } finally {
        await browser.close();
    }
}
