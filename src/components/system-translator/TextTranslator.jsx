import React, { useState } from "react";
import LanguageSelector from "./LanguageSelector";
import { API_BASE_URL } from "../../../config";

export default function TextTranslator() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
          setSourceLanguage(data.data[0].detectedLanguage.language);
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
      setError("Error connecting to translation service");
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      {/* Info note about glossaries */}
      <div className="translator-rounded translator-border p-3 text-sm" style={{ backgroundColor: "oklch(0.9 0.05 250 / 0.15)" }}>
        <p className="translator-text-foreground">
          <strong>Note:</strong> Glossaries are only available for file translation. Switch to "File Translation" mode to use glossaries for improved accuracy.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Text */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold translator-text-foreground">Source Text</label>
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              label="From:"
              includeAuto
            />
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate or paste here..."
            className="min-h-80 w-full translator-rounded translator-border translator-input p-4 placeholder:translator-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs translator-muted-foreground">{sourceText.length} characters</span>
            {sourceText && (
              <button
                onClick={handleClear}
                className="translator-rounded px-3 py-1 text-xs font-medium translator-destructive hover:translator-destructive-bg-light"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Translated Text */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold translator-text-foreground">Translated Text</label>
            <LanguageSelector value={targetLanguage} onChange={setTargetLanguage} label="To:" />
          </div>
          <textarea
            value={translatedText}
            readOnly
            placeholder="Translation will appear here..."
            className="min-h-80 w-full translator-rounded translator-border translator-input p-4 placeholder:translator-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs translator-muted-foreground">{translatedText.length} characters</span>
            {translatedText && (
              <button
                onClick={handleCopy}
                className="translator-rounded px-3 py-1 text-xs font-medium translator-primary"
              >
                Copy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
          {error}
        </div>
      )}

      {/* Translate Button */}
      <button
        onClick={handleTranslate}
        disabled={!sourceText.trim() || isLoading}
        className="w-full translator-rounded translator-primary px-6 py-3 font-semibold transition-all opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Translating..." : "Translate"}
      </button>
    </div>
  );
}