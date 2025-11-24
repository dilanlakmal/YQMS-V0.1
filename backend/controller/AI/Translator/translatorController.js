import fetch from "node-fetch";
import Tesseract from 'tesseract.js';
import { translateSpecSheetWithGemini } from '../../../services/translator.js';

// Configuration for translation - DEFINED AT THE TOP
const TRANSLATION_CONFIG = {
  MAX_CHUNK_SIZE: 400,           // Characters per chunk
  CHUNK_DELAY: 1000,             // Delay between chunks (ms)
  MAX_RETRIES: 3,                // Retry attempts per chunk
  TIMEOUT: 30000,                // Request timeout (ms)
  MAX_TOTAL_LENGTH: 10000        // Maximum total text length
};

export const extractTextFromImage = async (req, res) => {
  try {
    console.log('OCR request received');
    
    const file = req.file;
    
    if (!file) {
      console.log('No file in request');
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    console.log('Processing file:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);
    
    console.log('Running Tesseract OCR...');
    
    // Use Tesseract.js for OCR
    const ocrResult = await Tesseract.recognize(
      file.buffer,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    const extractedText = ocrResult.data.text.trim();
    const confidence = ocrResult.data.confidence;
    
    console.log('Tesseract extracted text:', extractedText);
    console.log('Confidence:', confidence);
    
    res.json({ 
      text: extractedText,
      confidence: confidence 
    });
    
  } catch (error) {
    console.error('OCR extraction error:', error);
    
    res.status(500).json({ 
      error: "OCR failed", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// NEW: Gemini-powered translation endpoint
export const translateWithGemini = async (req, res) => {
  console.log('Gemini translation request received');
  
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing with Gemini:', file.originalname, 'Size:', file.size);
    
    // Use Gemini for direct image-to-translation
    const translatedText = await translateSpecSheetWithGemini(file.buffer, file.mimetype);
    
    console.log('Gemini translation successful');
    
    return res.json({
      success: true,
      translatedText: translatedText,
      method: 'gemini',
      originalFileName: file.originalname
    });

  } catch (error) {
    console.error('Gemini translation error:', error);
    res.status(500).json({ 
      error: 'Gemini translation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const askToTranslate = async (req, res) => {
  console.log('Translation request received:', req.body);
  
  try {
    const { text, target, sourceLanguage, useGemini } = req.body;
    
    if (!text || !target) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const detectedSource = sourceLanguage || autoDetectLanguage(text);
    console.log('Detected source language:', detectedSource);

    // If source and target are the same, return original
    if (detectedSource === target) {
      return res.json({
        data: {
          translations: [{
            translatedText: text,
            detectedSourceLanguage: detectedSource
          }]
        }
      });
    }

    // Check if this looks like a technical specification document
    const isTechnicalDoc = isTechnicalDocument(text);
    console.log('Is technical document:', isTechnicalDoc);

    let translatedText;

    // Use Gemini for technical documents if available, otherwise use chunking
    if (isTechnicalDoc && process.env.GEMINI_API_KEY) {
      console.log('Using enhanced translation for technical document...');
      try {
        // For technical docs, we could use a specialized prompt
        translatedText = await translateTechnicalText(text, detectedSource, target);
      } catch (error) {
        console.log('Enhanced translation failed, falling back to chunking:', error.message);
        translatedText = await translateLargeText(text, detectedSource, target);
      }
    } else {
      // Handle large text by chunking
      translatedText = await translateLargeText(text, detectedSource, target);
    }
    
    return res.json({
      data: {
        translations: [{
          translatedText: translatedText,
          detectedSourceLanguage: detectedSource,
          method: isTechnicalDoc ? 'enhanced' : 'standard'
        }]
      }
    });

  } catch (error) {
    console.error('Translation controller error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Check if text appears to be a technical document
const isTechnicalDocument = (text) => {
  const technicalIndicators = [
    /\d+\.\d+cm/i,           // Measurements like 20.34cm
    /\d+\s*英寸/i,           // Chinese inches
    /GPAR\d+/i,              // Part numbers
    /绣花/i,                 // Embroidery
    /尺寸/i,                 // Size/dimensions
    /做货/i,                 // Manufacturing
    /车制/i,                 // Sewing/manufacturing
    /洗水/i,                 // Washing
    /\d+~\d+\s*针/i,         // Stitching specifications
    /公差/i,                 // Tolerance
    /布种/i,                 // Fabric type
  ];
  
  return technicalIndicators.some(pattern => pattern.test(text));
};

// Enhanced translation for technical documents
const translateTechnicalText = async (text, source, target) => {
  // This could use Gemini with a specialized prompt for technical translation
  // For now, we'll use the existing chunking method but could be enhanced
  return await translateLargeText(text, source, target);
};

// Function to handle large text translation
const translateLargeText = async (text, source, target) => {
  const MAX_CHUNK_SIZE = TRANSLATION_CONFIG.MAX_CHUNK_SIZE;
  
  if (text.length <= MAX_CHUNK_SIZE) {
    console.log('Text is small enough, translating directly...');
    return await translateChunk(text, source, target);
  }
  
  if (text.length > TRANSLATION_CONFIG.MAX_TOTAL_LENGTH) {
    throw new Error(`Text too long. Maximum ${TRANSLATION_CONFIG.MAX_TOTAL_LENGTH} characters allowed.`);
  }
  
  console.log(`Large text detected (${text.length} chars), chunking...`);
  
  const chunks = smartChunkText(text, MAX_CHUNK_SIZE);
  console.log(`Split into ${chunks.length} chunks`);
  
  const translatedChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Translating chunk ${i + 1}/${chunks.length}: "${chunks[i].substring(0, 50)}..."`);
    
    try {
      const translatedChunk = await translateChunk(chunks[i], source, target);
      translatedChunks.push(translatedChunk);
      
      if (i < chunks.length - 1) {
        console.log(`Waiting ${TRANSLATION_CONFIG.CHUNK_DELAY}ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, TRANSLATION_CONFIG.CHUNK_DELAY));
      }
    } catch (error) {
      console.error(`Failed to translate chunk ${i + 1}:`, error);
      translatedChunks.push(chunks[i]);
    }
  }
  
  const result = translatedChunks.join(' ');
  console.log(`Translation complete. Original: ${text.length} chars, Translated: ${result.length} chars`);
  return result;
};

// Smart text chunking that preserves sentence boundaries
const smartChunkText = (text, maxSize) => {
  const chunks = [];
  let currentChunk = '';
  
  const sentences = text.split(/([。！？\.!?])/);
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '');
    
    if (currentChunk.length + sentence.length > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  const finalChunks = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxSize) {
      finalChunks.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += maxSize) {
        finalChunks.push(chunk.substring(i, i + maxSize));
      }
    }
  }
  
  return finalChunks.filter(chunk => chunk.trim().length > 0);
};

// Single chunk translation with multiple service fallbacks
const translateChunk = async (text, source, target) => {
  console.log(`Translating chunk: "${text.substring(0, 100)}..." (${text.length} chars)`);
  
  const services = [
    () => tryMyMemoryTranslate(text, source, target),
    () => tryGoogleTranslateFree(text, source, target),
    () => tryLibreTranslate(text, source, target)
  ];

  for (const service of services) {
    try {
      const result = await service();
      if (result && result.trim()) {
        console.log(`Translation successful: "${result.substring(0, 100)}..."`);
        return result;
      }
    } catch (error) {
      console.log('Translation service failed:', error.message);
      continue;
    }
  }
  
  console.log('All translation services failed for chunk, returning original');
  return text;
};

// Enhanced MyMemory with better error handling
const tryMyMemoryTranslate = async (text, source, target) => {
  if (text.length > 500) {
    throw new Error('Text too long for MyMemory');
  }
  
  console.log(`Trying MyMemory for ${text.length} characters...`);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  
  const response = await fetch(url, { 
    timeout: TRANSLATION_CONFIG.TIMEOUT 
  });
  const data = await response.json();
  
  console.log('MyMemory response status:', data.responseStatus);
  
  if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error(`MyMemory failed: ${data.responseDetails || 'Unknown error'}`);
};

// Enhanced Google Translate alternative
const tryGoogleTranslateFree = async (text, source, target) => {
  console.log(`Trying Google Translate for ${text.length} characters...`);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  
  const response = await fetch(url, { 
    timeout: TRANSLATION_CONFIG.TIMEOUT 
  });
  const data = await response.json();
  
  if (data && data[0] && data[0][0] && data[0][0][0]) {
    return data[0][0][0];
  }
  throw new Error('Google Translate alternative failed');
};

// LibreTranslate service
const tryLibreTranslate = async (text, source, target) => {
  console.log(`Trying LibreTranslate for ${text.length} characters...`);
  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: source,
      target: target,
      format: 'text'
    }),
    timeout: TRANSLATION_CONFIG.TIMEOUT
  });

  if (response.ok) {
    const data = await response.json();
    if (data.translatedText) {
      return data.translatedText;
    }
  }
  throw new Error('LibreTranslate failed');
};

// Auto-detect language function
const autoDetectLanguage = (text) => {
  if (!text) return 'en';
  
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  
  const lowerText = text.toLowerCase();
  if (/[ñáéíóúü]/.test(lowerText)) return 'es';
  if (/[àâäéèêëïîôöùûüÿç]/.test(lowerText)) return 'fr';
  if (/[äöüß]/.test(lowerText)) return 'de';
  if (/[ãõç]/.test(lowerText)) return 'pt';
  
  return 'en';
};
