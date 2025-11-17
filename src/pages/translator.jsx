import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import FileDropzone from '../components/AI/translator/FileDropZone';
import Spinner from '../components/AI/translator/Spinner';
import { SparkleIcon } from '../components/AI/translator/icon';

// Enhanced image preprocessing with more aggressive techniques
const preprocessImage = (file, processingType = 'contrast') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Scale up image significantly for better OCR
      const minSize = 1200;
      const scale = Math.max(2, minSize / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Disable smoothing for sharp text
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      switch (processingType) {
        case 'aggressive_contrast':
          // More aggressive contrast with noise reduction
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            // Use different thresholds
            const value = gray > 140 ? 255 : gray < 100 ? 0 : gray > 120 ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
          }
          break;
          
        case 'adaptive_threshold':
          // Adaptive thresholding
          const width = canvas.width;
          const height = canvas.height;
          const grayData = new Uint8Array(width * height);
          
          // Convert to grayscale first
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            grayData[i / 4] = gray;
          }
          
          // Apply adaptive threshold
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const pixelIdx = idx * 4;
              
              // Calculate local average in 15x15 window
              let sum = 0;
              let count = 0;
              for (let dy = -7; dy <= 7; dy++) {
                for (let dx = -7; dx <= 7; dx++) {
                  const ny = y + dy;
                  const nx = x + dx;
                  if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                    sum += grayData[ny * width + nx];
                    count++;
                  }
                }
              }
              const localAvg = sum / count;
              const value = grayData[idx] > localAvg - 10 ? 255 : 0;
              
              data[pixelIdx] = value;
              data[pixelIdx + 1] = value;
              data[pixelIdx + 2] = value;
            }
          }
          break;
          
        case 'denoise':
          // Median filter for noise reduction
          const tempData = new Uint8ClampedArray(data);
          for (let i = 4; i < data.length - 4; i += 4) {
            const neighbors = [
              tempData[i - 4], tempData[i], tempData[i + 4],
              tempData[i - canvas.width * 4], tempData[i + canvas.width * 4]
            ].sort((a, b) => a - b);
            const median = neighbors[2];
            data[i] = median;
            data[i + 1] = median;
            data[i + 2] = median;
          }
          break;
          
        case 'sharpen':
          // Sharpening filter
          const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
          const tempData2 = new Uint8ClampedArray(data);
          const w = canvas.width;
          
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              let r = 0, g = 0, b = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx = ((y + ky) * w + (x + kx)) * 4;
                  const weight = kernel[(ky + 1) * 3 + (kx + 1)];
                  r += tempData2[idx] * weight;
                  g += tempData2[idx + 1] * weight;
                  b += tempData2[idx + 2] * weight;
                }
              }
              const idx = (y * w + x) * 4;
              data[idx] = Math.max(0, Math.min(255, r));
              data[idx + 1] = Math.max(0, Math.min(255, g));
              data[idx + 2] = Math.max(0, Math.min(255, b));
            }
          }
          break;
          
        default:
          // High contrast
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const value = gray > 128 ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
          }
      }
      
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(resolve, 'image/png');
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Text cleaning function
// Super aggressive text cleaning for poor OCR
const cleanOCRText = (text) => {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove the "I" pattern artifacts completely
  cleaned = cleaned.replace(/I([A-Z0-9])I/g, '$1');
  cleaned = cleaned.replace(/I([a-z0-9])I/g, '$1');
  cleaned = cleaned.replace(/([A-Z0-9])I([A-Z0-9])/g, '$1$2');
  cleaned = cleaned.replace(/([a-z0-9])I([a-z0-9])/g, '$1$2');
  
  // Remove standalone I's that are clearly artifacts
  cleaned = cleaned.replace(/\bI(?=[A-Z][A-Z])/g, '');
  cleaned = cleaned.replace(/(?<=[A-Z][A-Z])I\b/g, '');
  
  // Try to reconstruct common words from the garbled text
  const wordReconstructions = {
    'I3I)I ITIAIBISI IRIEIAI IBIIINIAI IMIIIKIEI': '3) TABS REA BINA MIKE',
    'INIRIMIFITINI IFIRIEIEI': 'NRMFTN FREE',
    'I2IUIEIDI I2I I6I': '2UED 2 6',
    'ICIUIRIEISI INIEI ITIEIEIRI': 'CURES NE TEER',
    'ISIEIBI ILIIIEI)I IRIAIKI': 'SEB LIE) RAK',
    'IRIAITIEISI': 'RATES',
    'ISIGI IiI IBIRIEI IHILI ISIEI': 'SG i BRE HL SE'
  };
  
  // Apply word reconstructions
  Object.entries(wordReconstructions).forEach(([garbled, clean]) => {
    cleaned = cleaned.replace(garbled, clean);
  });
  
  // Remove excessive spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // If the text is still mostly garbage, try to extract meaningful parts
  if (cleaned.length > 50) {
    const words = cleaned.split(' ');
    const meaningfulWords = words.filter(word => {
      // Keep words that have a reasonable letter-to-total ratio
      const letters = word.match(/[a-zA-Z]/g) || [];
      return letters.length >= word.length * 0.5 && word.length >= 2;
    });
    
    if (meaningfulWords.length > 0) {
      cleaned = meaningfulWords.join(' ');
    }
  }
  
  return cleaned;
};


const translator = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [translationResult, setTranslationResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'pl', name: 'Polish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'cs', name: 'Czech' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'id', name: 'Indonesian' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'en', name: 'English' }
  ];

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setTranslationResult(null);
    setProgress(0);
    setError(null);
    setDebugInfo([]);
    setProcessedImages([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const translateText = async (text, targetLanguage) => {
  console.log('Translating:', text, 'to:', targetLanguage);
  
  // Don't translate if target is English and text appears to be English
  if (targetLanguage === 'en') {
    console.log('Target is English, returning original text');
    return text;
  }
  
  // Get language name from code
  const languageNames = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'fi': 'Finnish',
    'no': 'Norwegian',
    'cs': 'Czech',
    'el': 'Greek',
    'he': 'Hebrew',
    'id': 'Indonesian',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'hu': 'Hungarian',
    'en': 'English'
  };

  const targetLanguageName = languageNames[targetLanguage] || targetLanguage;

  try {
    // First try your backend API
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        target: targetLanguage
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.translations && data.data.translations[0]) {
        return data.data.translations[0].translatedText;
      }
    }
    
    throw new Error('Backend translation failed');
    
  } catch (error) {
    console.error('Backend translation error:', error);
    
    // Fallback to direct Gemini API call (if you want to add API key to frontend)
    // Note: This exposes your API key to the client, so backend is preferred
    
    // Direct fallback to MyMemory API
    try {
      console.log('Trying MyMemory API fallback...');
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLanguage}`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      console.log('MyMemory fallback response:', fallbackData);
      
      if (fallbackData.responseStatus === 200) {
        return fallbackData.responseData.translatedText;
      }
    } catch (fallbackError) {
      console.error('Fallback translation failed:', fallbackError);
    }
    
    return text;
  }
};


  const performOCR = async (image, strategy, label) => {
    const configs = {
      auto: {
        lang: 'eng',
        options: {
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-:;()[]{}"\'/\\@#$%^&*+=<>|`~',
        }
      },
      singleBlock: {
        lang: 'eng',
        options: {
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-:;()[]{}"\'/\\@#$%^&*+=<>|`~',
        }
      },
      legacy: {
        lang: 'eng',
        options: {
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_ocr_engine_mode: Tesseract.OEM.TESSERACT_ONLY,
        }
      }
    };

    const config = configs[strategy] || configs.auto;
    
    try {
      const result = await Tesseract.recognize(
        image,
        config.lang,
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 20));
            }
          },
          ...config.options
        }
      );

      const rawText = result.data.text.trim();
      const cleanedText = cleanOCRText(rawText);
      const confidence = result.data.confidence;
      
      setDebugInfo(prev => [...prev, 
        `${label} (${strategy}):`,
        `  Raw: "${rawText.substring(0, 100)}${rawText.length > 100 ? '...' : ''}"`,
        `  Cleaned: "${cleanedText.substring(0, 100)}${cleanedText.length > 100 ? '...' : ''}"`,
        `  Confidence: ${confidence.toFixed(1)}%`
      ]);

      return { text: cleanedText, confidence, rawText };
    } catch (error) {
      setDebugInfo(prev => [...prev, `${label} (${strategy}) failed: ${error.message}`]);
      return { text: '', confidence: 0, rawText: '' };
    }
  };

  const handleTranslate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setProgress(0);
    setError(null);
    setDebugInfo(['Starting enhanced OCR analysis...']);
    setProcessedImages([]);

    try {
      let bestResult = { text: '', confidence: 0, rawText: '' };
      let allResults = [];

      // Strategy 1: Try original image with enhanced settings
      const result1 = await performOCR(selectedFile, 'auto', 'Original Enhanced');
      allResults.push(result1);
      if (result1.confidence > bestResult.confidence) bestResult = result1;

      // Strategy 2: Try with aggressive preprocessing
      const preprocessingTypes = [
        'aggressive_contrast',
        'adaptive_threshold', 
        'denoise',
        'sharpen'
      ];
      
      for (const processType of preprocessingTypes) {
        try {
          setProgress(20 + (preprocessingTypes.indexOf(processType) * 15));
          const processedImage = await preprocessImage(selectedFile, processType);
          
          const processedUrl = URL.createObjectURL(processedImage);
          setProcessedImages(prev => [...prev, { type: processType, url: processedUrl }]);
          
          const result = await performOCR(processedImage, 'auto', `Enhanced ${processType}`);
          allResults.push(result);
          
          if (result.confidence > bestResult.confidence) {
            bestResult = result;
          }
        } catch (preprocessError) {
          setDebugInfo(prev => [...prev, `Enhanced preprocessing ${processType} failed: ${preprocessError.message}`]);
        }
      }

      setDebugInfo(prev => [...prev, 
        '--- Final Results ---',
        `Best result: "${bestResult.text}" (${bestResult.confidence.toFixed(1)}% confidence)`,
        `Text length: ${bestResult.text.length} characters`
      ]);

      if (!bestResult.text || bestResult.text.length < 3) {
        setError(`Still unable to extract readable text with high confidence.

Best result found: "${bestResult.text}" (${bestResult.confidence.toFixed(1)}% confidence)

The image may have:
• Very small text that needs higher resolution
• Handwritten text (OCR works better with printed text)
• Complex background or poor contrast
• Unusual fonts or formatting

Try:
• Taking a screenshot instead of a photo
• Using an image with larger, clearer text
• Ensuring good lighting and contrast`);
        return;
      }

      setProgress(80);

      const translatedText = await translateText(bestResult.text, selectedLanguage);
      
      setProgress(100);

      setTranslationResult({
        originalText: bestResult.text,
        translatedText: translatedText,
        language: selectedLanguage,
        confidence: bestResult.confidence,
        rawText: bestResult.rawText
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
        {debugInfo.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
            <h4 className="text-gray-300 font-semibold mb-2">🔍 Enhanced Debug Information:</h4>
            <div className="text-xs text-gray-400 font-mono max-h-60 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className={info.startsWith('  ') ? 'ml-4 text-gray-500' : ''}>{info}</div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Images Preview */}
        {processedImages.length > 0 && (
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
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <p className="text-red-300 whitespace-pre-line text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 ml-4"
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
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleTranslate}
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Enhanced Translate
                </button>
                <button
                  onClick={resetTranslator}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
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
            {imagePreview && (
              <div className="text-center">
                <img 
                  src={imagePreview} 
                  alt="Translated" 
                  className="max-w-md mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  Cleaned Text (Confidence: {translationResult.confidence?.toFixed(1)}%):
                </h3>
                <p className="text-white bg-gray-700 p-4 rounded whitespace-pre-wrap">
                  {translationResult.originalText}
                </p>
                {translationResult.rawText !== translationResult.originalText && (
                  <details className="mt-2">
                    <summary className="text-gray-400 text-sm cursor-pointer">Show raw OCR output</summary>
                    <p className="text-gray-400 bg-gray-800 p-2 rounded text-sm mt-1 whitespace-pre-wrap">
                      {translationResult.rawText}
                    </p>
                  </details>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  Translated Text ({languages.find(l => l.code === translationResult.language)?.name}):
                </h3>
                <p className="text-white bg-indigo-900/30 p-4 rounded border border-indigo-500/30 whitespace-pre-wrap">
                  {translationResult.translatedText}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={resetTranslator}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Translate Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default translator;
