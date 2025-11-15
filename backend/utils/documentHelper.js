import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text and count characters from a document
 */
export const countDocumentCharacters = async (fileBuffer, fileName) => {
  try {
    const ext = fileName.toLowerCase().split('.').pop();
    let text = '';

    switch (ext) {
      case 'pdf':
        // Dynamic import for CommonJS module
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
        break;
      
      case 'docx':
        // Dynamic import for CommonJS module
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        text = docxResult.value;
        break;
      
      case 'doc':
        // DOC files require different handling (could use antiword or similar)
        // For now, return approximate based on file size
        return {
          characterCount: Math.floor(fileBuffer.length * 0.1), // Rough estimate
          estimated: true,
          message: 'Character count for .doc files is estimated'
        };
      
      case 'txt':
      case 'html':
      case 'xml':
        text = fileBuffer.toString('utf-8');
        break;
      
      case 'xlsx':
      case 'xls':
      case 'pptx':
      case 'ppt':
        // For these formats, we'll estimate based on file size
        return {
          characterCount: Math.floor(fileBuffer.length * 0.15), // Rough estimate
          estimated: true,
          message: 'Character count for spreadsheet/presentation files is estimated'
        };
      
      default:
        // Default: estimate based on file size
        return {
          characterCount: Math.floor(fileBuffer.length * 0.1),
          estimated: true,
          message: 'Character count is estimated for this file type'
        };
    }

    const characterCount = text.length;
    return {
      characterCount,
      estimated: false,
      text: text.substring(0, 100) // Preview first 100 chars
    };
  } catch (error) {
    console.error('Error counting characters:', error);
    // Fallback: estimate based on file size
    return {
      characterCount: Math.floor(fileBuffer.length * 0.1),
      estimated: true,
      message: `Error extracting text: ${error.message}. Using file size estimate.`
    };
  }
};

/**
 * Calculate estimated cost for translation
 */
export const calculateTranslationCost = (characterCount, isDocument = true) => {
  const pricePerMillion = isDocument ? 15 : 10; // Document: $15, Text: $10
  const cost = (characterCount / 1_000_000) * pricePerMillion;
  return {
    cost: cost.toFixed(4),
    characterCount,
    pricePerMillion,
    type: isDocument ? 'Document Translation' : 'Text Translation'
  };
};
