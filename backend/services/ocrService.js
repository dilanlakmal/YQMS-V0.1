import { createWorker } from 'tesseract.js';

/**
 * Perform OCR on an array of images
 * @param {Buffer[]} imageBuffers 
 * @param {string} lang Tesseract language codes (e.g. 'eng+khm')
 * @returns {Promise<string>}
 */
export async function recognizeTextFromImages(imageBuffers, lang = 'eng+khm') {
    if (!imageBuffers || imageBuffers.length === 0) return '';

    const worker = await createWorker(lang, 1, {
        logger: m => {
            if (m.status === 'recognizing' && m.progress % 0.25 === 0) {
                // console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
            }
        }
    });

    // Set parameters for better accuracy on technical documents
    await worker.setParameters({
        tessedit_pageseg_mode: '3', // Fully automatic page segmentation, but no OSD.
        user_defined_dpi: '300',    // Scale 3.0 is roughly 300 DPI 
        preserve_interword_spaces: '1' // Help keep word boundaries in tables
    });

    let fullText = '';

    try {
        for (let i = 0; i < imageBuffers.length; i++) {
            console.log(`OCRing image ${i + 1}/${imageBuffers.length}...`);
            const { data: { text } } = await worker.recognize(imageBuffers[i]);
            fullText += text + '\n';
        }
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    } finally {
        await worker.terminate();
    }

    return fullText;
}
