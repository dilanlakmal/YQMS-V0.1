import React, { useState, useEffect, useCallback } from "react";
import LanguageSelector from "./LanguageSelector";
import { API_BASE_URL } from "../../../config";
import { ArrowRightLeft, Copy, X, Loader2 } from "lucide-react";

export default function TextTranslator() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce logic for auto-translation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim()) {
        handleTranslate();
      } else {
        setTranslatedText("");
      }
    }, 800); // 800ms delay to prevent too many requests while typing

    return () => clearTimeout(timer);
  }, [sourceText, sourceLanguage, targetLanguage]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          to: targetLanguage,
          ...(sourceLanguage !== "auto" ? { from: sourceLanguage } : {})
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const translated =
          data.data?.[0]?.translations?.[0]?.text ?? "";
        setTranslatedText(translated);

        if (
          sourceLanguage === "auto" &&
          data.data?.[0]?.detectedLanguage?.language
        ) {
          // Optional: We can update the UI to show detected language
          // But strict "Source Language" state might be better kept as "auto" 
          // to avoid jumping tabs.
          // However, Google Translate detects and shows "English - Detected".
        }
      } else {
        const details =
          data.error ||
          data.message ||
          data.details?.[0]?.error?.message ||
          "Translation failed. Please try again.";
        setError(details);
      }
    } catch (err) {
      console.error("Translation error:", err);
      // Don't show aggressive error alerts for streaming/auto-translate unless critical
      // setError("Error connecting to translation service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage === 'auto') {
      // Can't swap if auto. Google Translate usually sets source to detected lang.
      // For now, we'll just ignore or set source to 'en' default if auto.
      // Better: Set source to current target, set target to 'en' (default) or previously detected.
      setSourceLanguage(targetLanguage);
      setTargetLanguage('en');
    } else {
      setSourceLanguage(targetLanguage);
      setTargetLanguage(sourceLanguage);
    }

    // Swap text as well? Google Translate swaps text if translation exists.
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText); // This might be inaccurate until re-translated, but gives immediate feedback
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
  };

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setError("");
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Glossaries Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
        <div className="bg-blue-100 p-1 rounded-full">
          <span className="sr-only">Info</span>
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p>
          <strong>Note:</strong> Glossaries are only available for file translation. Use "File Translation" mode for glossary support.
        </p>
      </div>

      {/* Main Translator Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px] flex flex-col">

        {/* Language Header Bar */}
        <div className="flex flex-col md:flex-row border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          {/* Source Language Tabs */}
          <div className="flex-1 min-w-0">
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              includeAuto={true}
              recentLanguages={['auto', 'en', 'zh-Hans', 'km']}
              variant="tabs"
            />
          </div>

          {/* Swap Button (Desktop) */}
          <div className="hidden md:flex items-center justify-center px-2">
            <button
              onClick={handleSwapLanguages}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500"
              title="Swap languages"
            >
              <ArrowRightLeft size={20} />
            </button>
          </div>

          {/* Target Language Tabs */}
          <div className="flex-1 min-w-0">
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              includeAuto={false}
              recentLanguages={['en', 'zh-Hans', 'km']}
              variant="tabs"
            />
          </div>
        </div>

        {/* Translation Area */}
        <div className="flex-1 flex flex-col md:flex-row relative">
          {/* Swap Button (Mobile) */}
          <div className="md:hidden absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow border p-1">
            <button
              onClick={handleSwapLanguages}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* Source Panel */}
          <div className="flex-1 relative flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 group">
            <div className="flex-1 relative">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate or paste here..."
                className="w-full h-full p-6 text-xl md:text-2xl bg-transparent border-none resize-none focus:ring-0 font-sans text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                spellCheck="false"
              />
              {sourceText && (
                <button
                  onClick={handleClear}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Clear text"
                >
                  <X size={24} />
                </button>
              )}
            </div>
            <div className="px-4 py-3 pb-6 flex justify-between items-center text-xs text-gray-400">
              <span>{sourceText.length} chars</span>
              {/* Placeholder for mic/speaker icons if needed in future */}
            </div>
          </div>

          {/* Target Panel */}
          <div className="flex-1 relative flex flex-col bg-gray-50 dark:bg-gray-900/30">
            <div className="flex-1 relative">
              {isLoading && (
                <div className="absolute top-4 right-4">
                  <Loader2 className="animate-spin text-blue-500" size={20} />
                </div>
              )}
              <textarea
                value={translatedText}
                readOnly
                placeholder="Translation"
                className="w-full h-full p-6 text-xl md:text-2xl bg-transparent border-none resize-none focus:ring-0 font-sans text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="px-4 py-3 pb-6 flex justify-end items-center gap-2">
              {translatedText && (
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors relative"
                  title="Copy translation"
                >
                  <Copy size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}