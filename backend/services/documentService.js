import pdf from 'pdf-extraction';
import { renderPdfPagesToImages } from './pdfRenderer.js';
import { recognizeTextFromImages } from './ocrService.js';

/**
 * Hybrid extraction: Tries simple extraction first, falls back to OCR if needed.
 * @param {Buffer} buffer 
 * @param {string} fileName 
 * @param {object} options 
 * @returns {Promise<string>}
 */
export async function extractTextHybrid(buffer, fileName, options = {}) {
    const { sourceLang = 'en', targetLang = 'km' } = options;

    // 1. Try standard extraction
    try {
        console.log(`Attempting standard extraction for ${fileName}...`);
        const data = await pdf(buffer);
        const text = data.text || '';

        // Quality check: if text is too short or empty, it might be a scanned document
        // We can also check for high ratio of "whitespace" or "garbage" if needed.
        if (text.trim().length > 100) {
            console.log(`Standard extraction successful (${text.length} chars).`);
            return text;
        }

        console.log(`Standard extraction returned very little text (${text.trim().length} chars). Falling back to OCR.`);
    } catch (err) {
        console.warn(`Standard extraction failed for ${fileName}:`, err.message);
        console.log("Falling back to OCR...");
    }

    // 2. OCR Fallback
    try {
        // Map language codes to Tesseract codes
        // en -> eng, km -> khm
        const langMap = {
            'en': 'eng',
            'km': 'khm',
            'zh': 'chi_sim',
            'zh-cn': 'chi_sim',
            'zh-tw': 'chi_tra',
            'english': 'eng',
            'khmer': 'khm',
            'chinese': 'chi_sim'
        };

        // For technical documents in this region, it's very common to have English + Khmer + Chinese
        // We combine the requested languages and always include English as a baseline.
        const requestedLangs = [
            langMap[sourceLang] || 'eng',
            langMap[targetLang] || 'khm'
        ];

        // If neither is chi_sim, but we suspect it might be needed, we can add it.
        // For now, let's just make sure we include both plus potentially chi_sim if source is en or zh
        if (sourceLang === 'en' || sourceLang === 'zh' || sourceLang === 'zh-cn') {
            if (!requestedLangs.includes('chi_sim')) requestedLangs.push('chi_sim');
        }

        const uniqueLangs = [...new Set(requestedLangs)];
        const tesserLang = uniqueLangs.join('+');

        // Bump scale to 3.0 for higher resolution - crucial for technical drawings
        const scale = 3.0;

        console.log(`Rendering PDF pages to images for OCR (langs: ${tesserLang}, scale: ${scale})...`);
        const images = await renderPdfPagesToImages(buffer, scale);

        console.log(`Performing OCR on ${images.length} pages...`);
        const ocrText = await recognizeTextFromImages(images, tesserLang);

        console.log(`OCR complete (${ocrText.length} chars extracted).`);
        return ocrText;
    } catch (ocrErr) {
        console.error(`OCR Fallback failed:`, ocrErr);
        throw new Error(`Failed to extract text from ${fileName} using both standard and OCR methods.`);
    }
}
