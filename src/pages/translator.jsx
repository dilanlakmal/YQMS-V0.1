import { useState } from 'react';
import Tesseract from 'tesseract.js';
import FileDropzone from '../components/AI/translator/FileDropZone';
import Spinner from '../components/AI/translator/Spinner';
import { SparkleIcon } from '../components/AI/translator/icon';

// Super aggressive text cleaning for poor OCR
const cleanOCRText = (text) => {
  if (!text) return '';
  
  let cleaned = text;
  
  // Store original for fallback
  const original = text.trim();
  
  // Basic cleaning only
  cleaned = cleaned.replace(/[|]/g, 'I'); // Replace pipes with I
  cleaned = cleaned.replace(/[`']/g, "'"); // Fix quotes
  cleaned = cleaned.replace(/[""]/g, '"'); // Fix smart quotes
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // If cleaning removed everything, return original
  if (cleaned.length === 0 && original.length > 0) {
    console.log('Cleaning removed everything, returning original:', original);
    return original;
  }
  
  // Only apply aggressive cleaning if we have a reasonable amount of text
  if (cleaned.length > 10) {
    // Remove lines that are mostly symbols (but keep if it's all we have)
    const lines = cleaned.split('\n');
    const meaningfulLines = lines.filter(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) return false;
      
      const letters = trimmedLine.match(/[a-zA-Z]/g) || [];
      const ratio = letters.length / trimmedLine.length;
      
      // Keep lines with at least 20% letters (reduced from 30%)
      return ratio >= 0.2 || trimmedLine.length <= 5;
    });
    
    if (meaningfulLines.length > 0) {
      cleaned = meaningfulLines.join('\n').trim();
    }
  }
  
  // Final fallback - if we still have nothing, return original
  if (cleaned.length === 0 && original.length > 0) {
    return original;
  }
  
  return cleaned;
};

const Translator = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [translationResult, setTranslationResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [useGemini, setUseGemini] = useState(false);

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'en', name: 'English' }
  ];

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setTranslationResult(null);
    setProgress(0);
    setError(null);
    setDebugInfo([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Add this function to try different OCR approaches for better text extraction
  const tryMultipleOCRApproaches = async (file, setProgress, setDebugInfo) => {
    // Smart approach - try most likely languages first based on visual analysis
    const smartApproaches = [
      // Start with most common languages
      { name: 'English', options: { lang: 'eng' } },
      { name: 'Chinese Simplified', options: { lang: 'chi_sim' } },
      { name: 'Chinese Traditional', options: { lang: 'chi_tra' } },
      
      // Multi-language combinations for better detection
      { name: 'English + Chinese Simplified', options: { lang: 'eng+chi_sim' } },
      { name: 'English + Chinese Traditional', options: { lang: 'eng+chi_tra' } },
      
      // Other major languages if needed
      { name: 'Spanish', options: { lang: 'spa' } },
      { name: 'French', options: { lang: 'fra' } },
      { name: 'Japanese', options: { lang: 'jpn' } },
      { name: 'Korean', options: { lang: 'kor' } },
      { name: 'Arabic', options: { lang: 'ara' } }
    ];

    let bestResult = { text: '', confidence: 0, rawText: '', method: '', detectedLanguage: '' };
    let allResults = [];

    for (let i = 0; i < smartApproaches.length; i++) {
      const approach = smartApproaches[i];
      try {
        console.log(`Trying OCR approach: ${approach.name}`);
        setDebugInfo(prev => [...prev, `Trying ${approach.name} approach...`]);
        
        const result = await Tesseract.recognize(
          file,
          approach.options.lang,
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                const baseProgress = (i / smartApproaches.length) * 80;
                const currentProgress = baseProgress + (m.progress * 80 / smartApproaches.length);
                setProgress(Math.round(currentProgress));
              }
            },
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            ...approach.options
          }
        );

        const rawText = result.data.text.trim();
        const cleanedText = cleanOCRText(rawText);
        const finalText = cleanedText.length > 0 ? cleanedText : rawText;

        // Detect language based on character patterns
        const detectedLanguage = detectLanguageFromText(finalText);

        allResults.push({
          method: approach.name,
          text: finalText,
          confidence: result.data.confidence,
          rawText: rawText,
          detectedLanguage: detectedLanguage
        });

        setDebugInfo(prev => [...prev, 
          `${approach.name}: "${finalText.substring(0, 30)}${finalText.length > 30 ? '...' : ''}" (${result.data.confidence.toFixed(1)}%) [${detectedLanguage}]`
        ]);

        // Update best result based on confidence and text length
        if ((finalText.length > bestResult.text.length) || 
            (finalText.length === bestResult.text.length && result.data.confidence > bestResult.confidence) ||
            (result.data.confidence > 70 && finalText.length > 0)) {
          bestResult = {
            text: finalText,
            confidence: result.data.confidence,
            rawText: rawText,
            method: approach.name,
            detectedLanguage: detectedLanguage
          };
        }

        // Early exit if we get a very good result
        if (result.data.confidence > 85 && finalText.length > 2) {
          console.log(`High confidence result found with ${approach.name}, stopping early`);
          setDebugInfo(prev => [...prev, `High confidence result found, stopping early`]);
          break;
        }

        // If we found Chinese text with decent confidence, we can stop
        if (detectedLanguage.includes('zh') && result.data.confidence > 60) {
          console.log(`Chinese text detected with good confidence, stopping`);
          setDebugInfo(prev => [...prev, `Chinese text detected with good confidence, stopping`]);
          break;
        }

      } catch (error) {
        console.log(`${approach.name} approach failed:`, error);
        setDebugInfo(prev => [...prev, `${approach.name} approach failed: ${error.message}`]);
      }
    }

    return { bestResult, allResults };
  };

  // Add this new function for Gemini translation
  const translateWithGemini = async (file) => {
    console.log('Using Gemini for direct image translation...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/translate-gemini`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          translatedText: data.translatedText,
          method: 'gemini',
          originalText: 'Direct image translation',
          confidence: 100
        };
      } else {
        throw new Error('Gemini translation failed');
      }
    } catch (error) {
      console.error('Gemini translation error:', error);
      throw error;
    }
  };

  // Language detection function based on character patterns
  const detectLanguageFromText = (text) => {
    if (!text) return 'unknown';
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) {
      return /[\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf]/.test(text) ? 'zh-traditional' : 'zh-simplified';
    }
    
    // Japanese (Hiragana, Katakana, Kanji)
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'japanese';
    }
    
    // Korean
    if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(text)) {
      return 'korean';
    }
    
    // Arabic
    if (/[\u0600-\u06ff\u0750-\u077f]/.test(text)) {
      return 'arabic';
    }
    
    // Thai
    if (/[\u0e00-\u0e7f]/.test(text)) {
      return 'thai';
    }
    
    // Hindi/Devanagari
    if (/[\u0900-\u097f]/.test(text)) {
      return 'hindi';
    }
    
    // Russian/Cyrillic
    if (/[\u0400-\u04ff]/.test(text)) {
      return 'russian';
    }
    
    // European languages (basic detection)
    const text_lower = text.toLowerCase();
    
    // Spanish indicators
    if (/[ñáéíóúü]/.test(text_lower) || /\b(el|la|de|en|con|por|para|que|es|un|una)\b/.test(text_lower)) {
      return 'spanish';
    }
    
    // French indicators
    if (/[àâäéèêëïîôöùûüÿç]/.test(text_lower) || /\b(le|la|de|et|en|avec|pour|que|est|un|une)\b/.test(text_lower)) {
      return 'french';
    }
    
    // German indicators
    if (/[äöüß]/.test(text_lower) || /\b(der|die|das|und|mit|für|ist|ein|eine)\b/.test(text_lower)) {
      return 'german';
    }
    
    // Italian indicators
    if (/\b(il|la|di|e|con|per|che|è|un|una)\b/.test(text_lower)) {
      return 'italian';
    }
    
    // Portuguese indicators
    if (/[ãõç]/.test(text_lower) || /\b(o|a|de|e|com|para|que|é|um|uma)\b/.test(text_lower)) {
      return 'portuguese';
    }
    
    // Default to English
    return 'english';
  };

  const translateText = async (text, targetLanguage, detectedLanguage = null, onProgress = null) => {
    console.log('Translating:', text.length, 'characters to:', targetLanguage);
    
    try {
      // Show progress if callback provided
      if (onProgress) onProgress(0, 'Starting translation...');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target: targetLanguage,
          sourceLanguage: detectedLanguage
        })
      });
      
      if (onProgress) onProgress(50, 'Processing translation...');
      
      if (response.ok) {
        const data = await response.json();
        if (onProgress) onProgress(100, 'Translation complete');
        
        if (data.data && data.data.translations && data.data.translations[0]) {
          return {
            translatedText: data.data.translations[0].translatedText,
            detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage || detectedLanguage
          };
        }
      }
      
      throw new Error('Backend translation failed');
      
    } catch (error) {
      console.error('Backend translation error:', error);
      if (onProgress) onProgress(100, 'Translation failed, returning original');
      
      return {
        translatedText: text,
        detectedSourceLanguage: detectedLanguage || 'unknown'
      };
    }
  };

  const handleTranslate = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setDebugInfo(['Starting translation...']);

    try {
      if (useGemini) {
        setDebugInfo(prev => [...prev, 'Using Gemini AI for direct image translation...']);
        setProgress(50);
        
        try {
          const geminiResult = await translateWithGemini(selectedFile);
          
          setProgress(100);
          setTranslationResult({
            originalText: geminiResult.originalText,
            translatedText: geminiResult.translatedText,
            language: selectedLanguage,
            confidence: geminiResult.confidence,
            method: 'gemini',
            detectedSourceLanguage: 'auto-detected'
          });
          
          setDebugInfo(prev => [...prev, 'Gemini translation completed successfully!']);
          return;
        } catch (geminiError) {
          console.log('Gemini failed, falling back to OCR method:', geminiError.message);
          setDebugInfo(prev => [...prev, 'Gemini failed, using OCR method...']);
        }
      }

      // Original OCR + Translation flow
      const { bestResult, allResults } = await tryMultipleOCRApproaches(
        selectedFile, 
        (progress) => setProgress(progress * 0.8),
        setDebugInfo
      );

      setDebugInfo(prev => [...prev, 
        '--- OCR Complete ---',
        `Extracted ${bestResult.text.length} characters`,
        `Confidence: ${bestResult.confidence.toFixed(1)}%`,
        `Detected Language: ${bestResult.detectedLanguage}`
      ]);

      if (!bestResult.text || bestResult.text.length < 1) {
        setError('Unable to extract any readable text from the image.');
        return;
      }

      setProgress(80);
      setDebugInfo(prev => [...prev, '--- Starting Translation ---']);
      
      const translationResult = await translateText(
        bestResult.text, 
        selectedLanguage, 
        bestResult.detectedLanguage,
        (progress, status) => {
          setProgress(80 + (progress * 0.2));
          setDebugInfo(prev => [...prev, status]);
        }
      );
      
      setProgress(100);
      setTranslationResult({
        originalText: bestResult.text,
        translatedText: translationResult.translatedText,
        language: selectedLanguage,
        confidence: bestResult.confidence,
        rawText: bestResult.rawText,
        detectedSourceLanguage: translationResult.detectedSourceLanguage,
        method: 'ocr+translation'
      });

    } catch (error) {
      console.error('Translation failed:', error);
      setError(`Translation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const resetTranslator = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setTranslationResult(null);
    setIsLoading(false);
    setProgress(0);
    setError(null);
    setDebugInfo([]);
    setProcessedImages([]);
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Translation copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Download translation function
  const downloadTranslation = (result) => {
    const content = `
Original Document Translation
============================

Translation Method: ${result.method === 'gemini' ? 'Gemini AI' : 'OCR + Translation'}
Source Language: ${result.detectedSourceLanguage}
Target Language: ${languages.find(l => l.code === result.language)?.name}
Confidence: ${result.confidence?.toFixed(1)}%
Date: ${new Date().toLocaleString()}

ORIGINAL TEXT:
${result.originalText}

TRANSLATED TEXT:
${result.translatedText}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

// Enhanced function using CONTENT-BASED matching instead of position-based
const renderSentenceBysentenceTranslation = (originalText, translatedText) => {
  return renderContentMatchedTranslation(originalText, translatedText);
};

// NEW APPROACH: Match content by keywords and structure instead of position
const renderContentMatchedTranslation = (originalText, translatedText) => {
  // Clean both texts
  const cleanOriginal = originalText.trim();
  const cleanTranslated = translatedText.trim();
  
  // Split original into logical sections
  const originalSections = smartSplitOriginalText(cleanOriginal);
  
  // Extract all translation content as searchable units
  const translationUnits = extractTranslationUnits(cleanTranslated);
  
  // Match each original section with its best translation
  const matchedPairs = matchContentByKeywords(originalSections, translationUnits);
  
  return (
    <div className="space-y-4">
      {matchedPairs.map((pair, index) => (
        <div key={index} className="border border-gray-600 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-300">
                Section {index + 1}
                {pair.type && (
                  <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                    {pair.type}
                  </span>
                )}
                {pair.matchScore && (
                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                    Match: {pair.matchScore}%
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(pair.original)}
                  className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
                  title="Copy original section"
                >
                  📋 Original
                </button>
                <button
                  onClick={() => copyToClipboard(pair.translated)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                  title="Copy translation"
                >
                  📋 Translation
                </button>
              </div>
            </div>
          </div>
          
          {/* Content Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Original */}
            <div className="p-4 bg-gray-800 border-r border-gray-600">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Original ({translationResult.detectedSourceLanguage || 'Source'})
                </span>
              </div>
              <div className="bg-gray-900 p-3 rounded border border-gray-700 min-h-20">
                <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-wrap">
                  {pair.original || <span className="text-gray-500 italic">No content</span>}
                </p>
              </div>
            </div>
            
            {/* Translation */}
            <div className="p-4 bg-gray-700">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Translation ({languages.find(l => l.code === translationResult.language)?.name})
                </span>
              </div>
              <div className="bg-indigo-900 bg-opacity-20 p-3 rounded border border-indigo-500 border-opacity-30 min-h-20">
                <p className="text-gray-100 leading-relaxed text-sm whitespace-pre-wrap">
                  {pair.translated || <span className="text-gray-500 italic">No matching translation found</span>}
                </p>
              </div>
            </div>
          </div>
          
          {/* Technical indicators */}
          {pair.indicators && pair.indicators.length > 0 && (
            <div className="bg-gray-700 px-4 py-2 border-t border-gray-600">
              <div className="flex flex-wrap gap-2">
                {pair.indicators.map((indicator, idx) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-full ${
                    indicator.type === 'measurement' ? 'bg-yellow-600 text-yellow-100' :
                    indicator.type === 'code' ? 'bg-blue-600 text-blue-100' :
                    indicator.type === 'technical' ? 'bg-purple-600 text-purple-100' :
                    'bg-gray-600 text-gray-100'
                  }`}>
                    {indicator.icon} {indicator.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Content Matching Info */}
      <div className="mt-6 p-4 bg-green-900 bg-opacity-20 border border-green-600 border-opacity-30 rounded-lg">
        <h4 className="text-green-300 font-medium mb-2">🎯 Content Matching Results</h4>
        <div className="text-green-200 text-sm space-y-1">
          <p>• Original sections: {originalSections.length}</p>
          <p>• Translation units extracted: {translationUnits.length}</p>
          <p>• Matched pairs: {matchedPairs.filter(p => p.translated).length}</p>
          <p>• Matching method: Keyword and structure-based content matching</p>
        </div>
      </div>
      
      {/* Complete Document View */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <details>
          <summary className="text-gray-300 cursor-pointer hover:text-white transition-colors">
            📄 View Complete Documents Side-by-Side
          </summary>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Complete Original Document:</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {originalText}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Complete Translation:</h4>
              <div className="bg-indigo-900 bg-opacity-20 p-4 rounded border border-indigo-500 border-opacity-30 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <p className="text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                  {translatedText}
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

// Extract translation units with context
const extractTranslationUnits = (translatedText) => {
  const units = [];
  
  // Split by numbered sections first
  const numberedSections = translatedText.split(/(\d+[.\/][^0-9])/);
  
  for (let i = 0; i < numberedSections.length; i++) {
    const section = numberedSections[i];
    if (section && section.trim()) {
      // If it's a number marker, combine with next section
      if (/^\d+[.\/]/.test(section.trim())) {
        const nextSection = numberedSections[i + 1] || '';
        units.push({
          text: (section + nextSection).trim(),
          keywords: extractKeywords(section + nextSection),
          sectionNumber: section.match(/^\d+/)?.[0] || null
        });
        i++; // Skip next section as we've combined it
      } else {
        // Split long sections into sentences
        const sentences = section.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            units.push({
              text: sentence.trim(),
              keywords: extractKeywords(sentence),
              sectionNumber: null
            });
          }
        });
      }
    }
  }
  
  return units.filter(unit => unit.text.length > 3);
};

// Extract keywords for matching
const extractKeywords = (text) => {
  const keywords = [];
  
  // Extract part numbers
  const partNumbers = text.match(/GPAR\d+|99-\d+-\d+/g) || [];
  keywords.push(...partNumbers);
  
  // Extract measurements
  const measurements = text.match(/\d+\.?\d*\s*(cm|inch|"|mm)/g) || [];
  keywords.push(...measurements);
  
  // Extract section numbers
  const sectionNumbers = text.match(/\d+[.\/]/g) || [];
  keywords.push(...sectionNumbers);
  
  // Extract technical terms
  const technicalTerms = text.match(/embroidery|sewing|washing|manufacturing|azine|car|needle/gi) || [];
  keywords.push(...technicalTerms);
  
  // Extract Chinese technical terms
  const chineseTerms = text.match(/绣花|车制|洗水|做货|尺寸|公差/g) || [];
  keywords.push(...chineseTerms);
  
  return keywords.map(k => k.toLowerCase());
};

// Match content by keywords and structure
const matchContentByKeywords = (originalSections, translationUnits) => {
  const matchedPairs = [];
  const usedUnits = new Set();
  
  originalSections.forEach((originalSection, index) => {
    const originalKeywords = extractKeywords(originalSection);
    let bestMatch = null;
    let bestScore = 0;
    
    // Try to find the best matching translation unit
    translationUnits.forEach((unit, unitIndex) => {
      if (usedUnits.has(unitIndex)) return;
      
      let score = 0;
      
      // Check for exact keyword matches
      const commonKeywords = originalKeywords.filter(keyword => 
        unit.keywords.includes(keyword.toLowerCase())
      );
      score += commonKeywords.length * 20;
      
      // Check for section number match
      const originalSectionNum = originalSection.match(/^\d+[.\/]/)?.[0];
      if (originalSectionNum && unit.sectionNumber === originalSectionNum.replace(/[.\/]/, '')) {
        score += 50;
      }
      
      // Check for part number match
      const originalPartNum = originalSection.match(/GPAR\d+|99-\d+-\d+/);
      const unitPartNum = unit.text.match(/GPAR\d+|99-\d+-\d+/);
      if (originalPartNum && unitPartNum && originalPartNum[0] === unitPartNum[0]) {
        score += 40;
      }
      
      // Check for measurement match
      const originalMeasurement = originalSection.match(/\d+\.?\d*\s*(cm|inch|"|mm)/);
      const unitMeasurement = unit.text.match(/\d+\.?\d*\s*(cm|inch|"|mm)/);
      if (originalMeasurement && unitMeasurement) {
        score += 30;
      }
      
      // Prefer units that haven't been used
      if (score > bestScore) {
        bestMatch = { unit, score, index: unitIndex };
        bestScore = score;
      }
    });
    
    // Create the matched pair
    const indicators = detectContentType(originalSection);
    const type = getContentType(originalSection);
    
    if (bestMatch && bestMatch.score > 10) {
      usedUnits.add(bestMatch.index);
      matchedPairs.push({
        original: originalSection.trim(),
        translated: bestMatch.unit.text.trim(),
        type,
        indicators,
        matchScore: Math.round(bestMatch.score)
      });
    } else {
      // No good match found, try to find any unused unit
      const unusedUnit = translationUnits.find((unit, idx) => !usedUnits.has(idx));
      if (unusedUnit) {
        const unusedIndex = translationUnits.findIndex((unit, idx) => !usedUnits.has(idx));
        usedUnits.add(unusedIndex);
        matchedPairs.push({
          original: originalSection.trim(),
          translated: unusedUnit.text.trim(),
          type,
          indicators,
          matchScore: 0
        });
      } else {
        matchedPairs.push({
          original: originalSection.trim(),
          translated: '',
          type,
          indicators,
          matchScore: 0
        });
      }
    }
  });
  
  return matchedPairs;
};

// Keep your existing helper functions
const smartSplitOriginalText = (text) => {
  if (!text) return [];
  
  const sections = [];
  
  // Split by numbered sections (most reliable for technical documents)
  const numberedSections = text.split(/(?=\d+[.\/]\s)/);
  
  if (numberedSections.length > 1) {
    numberedSections.forEach(section => {
      const trimmed = section.trim();
      if (trimmed && trimmed.length > 1) {
        sections.push(trimmed);
      }
    });
  } else {
    // Fallback splitting methods
    const logicalBreaks = text.split(/(?=GPAR\d+)|(?=大\s*点\s*:)|(?=\*\*\*)|(?=注\s*:)/);
    
    if (logicalBreaks.length > 1) {
      logicalBreaks.forEach(section => {
        const trimmed = section.trim();
        if (trimmed && trimmed.length > 1) {
          sections.push(trimmed);
        }
      });
    } else {
      // Final fallback
      const sentences = text.split(/([。！？])/);
      let currentSection = '';
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i];
        const delimiter = sentences[i + 1] || '';
        
        if (sentence && sentence.trim()) {
          currentSection += sentence + delimiter;
          
          if (currentSection.length > 200) {
            sections.push(currentSection.trim());
            currentSection = '';
          }
        }
      }
      
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
      }
    }
  }
  
  return sections.filter(section => section.length > 1);
};

const detectContentType = (text) => {
  const indicators = [];
  
  if (/\d+\.?\d*\s*(cm|inch|"|mm|英寸)/.test(text)) {
    indicators.push({ type: 'measurement', icon: '📏', label: 'Measurement' });
  }
  
  if (/[A-Z]{2,}\d+|99-\d+-\d+|GPAR\d+/.test(text)) {
    indicators.push({ type: 'code', icon: '🏷️', label: 'Part Number' });
  }
  
  if (/绣花|车制|洗水|做货|尺寸|公差/.test(text)) {
    indicators.push({ type: 'technical', icon: '⚙️', label: 'Technical' });
  }
  
  if (/\d+~\d+|\d+\s*针/.test(text)) {
    indicators.push({ type: 'specification', icon: '📊', label: 'Specification' });
  }
  
  return indicators;
};

const getContentType = (text) => {
  if (/^\d+[.\/]/.test(text.trim())) return 'Section Header';
  if (/GPAR\d+/.test(text)) return 'Part Number';
  if (/\d+\.?\d*\s*(cm|inch|"|mm)/.test(text)) return 'Measurement';
  if (/绣花|车制|洗水/.test(text)) return 'Process';
  return null;
};


// NEW APPROACH: Properly distribute translation content across original sections
const renderProperlyDistributedTranslation = (originalText, translatedText) => {
  // Clean both texts first
  const cleanOriginal = originalText.trim();
  const cleanTranslated = translatedText.trim();
  
  // Split original text into logical sections
  const originalSections = smartSplitOriginalText(cleanOriginal);
  
  // Split and redistribute translated text to match original sections
  const redistributedTranslations = redistributeTranslationContent(cleanTranslated, originalSections.length);
  
  // Create properly aligned pairs
  const alignedPairs = createDistributedAlignment(originalSections, redistributedTranslations);
  
  return (
    <div className="space-y-4">
      {alignedPairs.map((pair, index) => (
        <div key={index} className="border border-gray-600 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-300">
                Section {index + 1}
                {pair.type && (
                  <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                    {pair.type}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(pair.original)}
                  className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
                  title="Copy original section"
                >
                  📋 Original
                </button>
                <button
                  onClick={() => copyToClipboard(pair.translated)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                  title="Copy translation"
                >
                  📋 Translation
                </button>
              </div>
            </div>
          </div>
          
          {/* Content Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Original */}
            <div className="p-4 bg-gray-800 border-r border-gray-600">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Original ({translationResult.detectedSourceLanguage || 'Source'})
                </span>
              </div>
              <div className="bg-gray-900 p-3 rounded border border-gray-700 min-h-20">
                <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-wrap">
                  {pair.original || <span className="text-gray-500 italic">No content</span>}
                </p>
              </div>
            </div>
            
            {/* Translation */}
            <div className="p-4 bg-gray-700">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Translation ({languages.find(l => l.code === translationResult.language)?.name})
                </span>
              </div>
              <div className="bg-indigo-900 bg-opacity-20 p-3 rounded border border-indigo-500 border-opacity-30 min-h-20">
                <p className="text-gray-100 leading-relaxed text-sm whitespace-pre-wrap">
                  {pair.translated || <span className="text-gray-500 italic">Translation distributed across sections</span>}
                </p>
              </div>
            </div>
          </div>
          
          {/* Technical indicators */}
          {pair.indicators && pair.indicators.length > 0 && (
            <div className="bg-gray-700 px-4 py-2 border-t border-gray-600">
              <div className="flex flex-wrap gap-2">
                {pair.indicators.map((indicator, idx) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-full ${
                    indicator.type === 'measurement' ? 'bg-yellow-600 text-yellow-100' :
                    indicator.type === 'code' ? 'bg-blue-600 text-blue-100' :
                    indicator.type === 'technical' ? 'bg-purple-600 text-purple-100' :
                    'bg-gray-600 text-gray-100'
                  }`}>
                    {indicator.icon} {indicator.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Debug Information */}
      <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-600 border-opacity-30 rounded-lg">
        <h4 className="text-blue-300 font-medium mb-2">🔧 Translation Distribution Info</h4>
        <div className="text-blue-200 text-sm space-y-1">
          <p>• Original sections: {originalSections.length}</p>
          <p>• Translation redistributed into: {redistributedTranslations.length} sections</p>
          <p>• Status: Translation content distributed across all original sections</p>
        </div>
      </div>
      
      {/* Complete Document View */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <details>
          <summary className="text-gray-300 cursor-pointer hover:text-white transition-colors">
            📄 View Complete Documents Side-by-Side
          </summary>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Complete Original Document:</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {originalText}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Complete Translation:</h4>
              <div className="bg-indigo-900 bg-opacity-20 p-4 rounded border border-indigo-500 border-opacity-30 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <p className="text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                  {translatedText}
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

// NEW FUNCTION: Redistribute translation content across original sections
const redistributeTranslationContent = (translatedText, targetSectionCount) => {
  if (!translatedText) return [];
  
  // Clean the translated text
  const cleanText = translatedText.replace(/^[-\s\.\,\;]*/, '').trim();
  
  if (!cleanText) return [];
  
  // Split the translation into sentences
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) {
    return [cleanText];
  }
  
  // Calculate how many sentences per section
  const sentencesPerSection = Math.max(1, Math.floor(sentences.length / targetSectionCount));
  const remainder = sentences.length % targetSectionCount;
  
  const redistributed = [];
  let currentIndex = 0;
  
  for (let i = 0; i < targetSectionCount; i++) {
    // Some sections get an extra sentence if there's a remainder
    const extraSentence = i < remainder ? 1 : 0;
    const sectionSentenceCount = sentencesPerSection + extraSentence;
    
    const sectionSentences = sentences.slice(currentIndex, currentIndex + sectionSentenceCount);
    
    if (sectionSentences.length > 0) {
      redistributed.push(sectionSentences.join(' ').trim());
    } else {
      // If we run out of sentences, leave empty (will show "Translation distributed" message)
      redistributed.push('');
    }
    
    currentIndex += sectionSentenceCount;
  }
  
  return redistributed;
};

// Create properly aligned pairs with distributed content
const createDistributedAlignment = (originalSections, redistributedTranslations) => {
  const alignedPairs = [];
  
  for (let i = 0; i < originalSections.length; i++) {
    const original = originalSections[i] || '';
    const translated = redistributedTranslations[i] || '';
    
    const indicators = detectContentType(original);
    const type = getContentType(original);
    
    alignedPairs.push({
      original: original.trim(),
      translated: translated.trim(),
      type,
      indicators
    });
  }
  
  return alignedPairs;
};


  // Calculate match score between two sections
  const calculateMatchScore = (original, translated) => {
    let score = 0;
    
    // Same section number
    if (original.hasSection && translated.hasSection) score += 50;
    
    // Similar length
    const lengthDiff = Math.abs(original.length - translated.length);
    if (lengthDiff < 50) score += 20;
    else if (lengthDiff < 100) score += 10;
    
    // Common keywords
    const commonKeywords = original.keywords.filter(keyword => 
      translated.keywords.some(tk => tk.toLowerCase() === keyword.toLowerCase())
    );
    score += commonKeywords.length * 15;
    
    // Similar content types
    if (original.hasPartNumbers && translated.hasPartNumbers) score += 25;
    if (original.hasMeasurements && translated.hasMeasurements) score += 25;
    
    return score;
  };

  // Render aligned sentences for non-technical documents
  const renderAlignedSentences = (originalText, translatedText) => {
    const originalSentences = originalText.split(/[.!?。！？]/).filter(s => s.trim());
    const translatedSentences = translatedText.split(/[.!?。！？]/).filter(s => s.trim());
    
    const maxLength = Math.max(originalSentences.length, translatedSentences.length);
    
    return (
      <div className="space-y-3">
        {Array.from({ length: maxLength }, (_, index) => (
          <div key={index} className="border border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
              <span className="text-sm font-medium text-indigo-300">
                Sentence {index + 1}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-4 bg-gray-800 border-r border-gray-600">
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Original
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed text-sm">
                  {originalSentences[index]?.trim() || <span className="text-gray-500 italic">No content</span>}
                </p>
              </div>
              
              <div className="p-4 bg-gray-700">
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Translation
                  </span>
                </div>
                <p className="text-gray-100 leading-relaxed text-sm">
                  {translatedSentences[index]?.trim() || <span className="text-gray-500 italic">No translation</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparkleIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Enhanced Image Translator
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Advanced OCR with text cleaning and multiple preprocessing strategies
          </p>
        </div>

        {/* Debug Info */}
        {Array.isArray(debugInfo) && debugInfo.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
            <h4 className="text-gray-300 font-semibold mb-2">🔍 Enhanced Debug Information:</h4>
            <div className="text-xs text-gray-400 font-mono max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {debugInfo.map((info, index) => (
                <div key={index} className={info && info.startsWith && info.startsWith('  ') ? 'ml-4 text-gray-500' : ''}>{info}</div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Images Preview */}
        {Array.isArray(processedImages) && processedImages.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
            <h4 className="text-gray-300 font-semibold mb-2">🖼️ Enhanced Processing Results:</h4>
            <div className="grid grid-cols-2 gap-4">
              {processedImages.map((img, index) => (
                <div key={index} className="text-center">
                  <img src={img.url} alt={img.type} className="w-full h-32 object-contain bg-white rounded" />
                  <p className="text-xs text-gray-400 mt-1">{img.type.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 border-opacity-30 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <p className="text-red-300 whitespace-pre-line text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 ml-4 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {!selectedFile && !isLoading && (
          <FileDropzone onFileSelect={handleFileSelect} />
        )}

        {selectedFile && !isLoading && !translationResult && (
          <div className="space-y-6">
            {imagePreview && (
              <div className="text-center">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-md mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-gray-300">Translate to:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGemini}
                    onChange={(e) => setUseGemini(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                  <span className="text-gray-300">Use Gemini AI (Better for technical documents)</span>
                </label>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleTranslate}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  {useGemini ? 'Translate with Gemini' : 'Enhanced Translate'}
                </button>
                <button
                  onClick={resetTranslator}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Upload New Image
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col justify-center items-center py-12 space-y-4">
            <Spinner />
            {progress > 0 && (
              <div className="w-64 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
            <p className="text-sm text-gray-400">
              Running enhanced OCR with text cleaning...
            </p>
          </div>
        )}

        {translationResult && (
          <div className="space-y-6">
            {/* Image and Translation Method Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Image */}
              {imagePreview && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                    📄 Original Document
                    {translationResult.confidence && (
                      <span className="text-sm text-indigo-400">
                        (Confidence: {translationResult.confidence.toFixed(1)}%)
                      </span>
                    )}
                  </h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <img 
                      src={imagePreview} 
                      alt="Original Document" 
                      className="w-full rounded-lg shadow-lg border border-gray-600"
                    />
                  </div>
                </div>
              )}

              {/* Translation Method Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                  🔄 Translation Method
                  {translationResult.detectedSourceLanguage && (
                    <span className="text-sm text-indigo-400">
                      [{translationResult.detectedSourceLanguage} → {languages.find(l => l.code === translationResult.language)?.name}]
                    </span>
                  )}
                </h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {translationResult.method === 'gemini' ? (
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        🤖 Gemini AI
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        🔍 OCR + Translation
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {translationResult.method === 'gemini' 
                      ? 'Direct AI translation preserving document structure and technical accuracy.'
                      : 'Text extraction followed by intelligent chunked translation.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-Side Translation Display */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-6">
              <h3 className="text-xl font-semibold text-gray-300 border-b border-gray-600 pb-3 flex items-center gap-2">
                📋 Translation Results
                <span className="text-sm text-gray-400 font-normal">
                  (Original ↔ Translation)
                </span>
              </h3>

              {/* Sentence-by-Sentence Translation */}
              <div className="space-y-4">
                {renderSentenceBysentenceTranslation(translationResult.originalText, translationResult.translatedText)}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-600">
                <button
                  onClick={() => copyToClipboard(translationResult.translatedText)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  📋 Copy Translation
                </button>
                <button
                  onClick={() => copyToClipboard(translationResult.originalText)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  📄 Copy Original
                </button>
                <button
                  onClick={() => downloadTranslation(translationResult)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  💾 Download
                </button>
              </div>

              {/* Raw text toggle */}
              <details className="mt-6">
                <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300 transition-colors duration-200">
                  📝 Show Complete Raw Text
                </summary>
                <div className="mt-3 p-4 bg-gray-900 rounded border border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Complete Original:</h4>
                      <p className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded border border-gray-700 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        {translationResult.originalText}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Complete Translation:</h4>
                      <p className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded border border-gray-700 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        {translationResult.translatedText}
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetTranslator}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
              >
                🔄 Translate Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Translator;
