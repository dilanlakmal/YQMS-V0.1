import React, { useState } from "react";
import LanguageSelector from "../LanguageSelector";
import { API_BASE_URL } from "../../../../config";

/**
 * Generate plural form of a word (simple rules)
 */
const pluralizeWord = (word) => {
  if (!word || word.length === 0) return word;
  
  const lower = word.toLowerCase();
  const lastChar = lower[lower.length - 1];
  const lastTwoChars = lower.slice(-2);
  
  if (lastChar === 's' || lastChar === 'x' || lastChar === 'z' || 
      lastTwoChars === 'ch' || lastTwoChars === 'sh') {
    return word + 'es';
  }
  
  if (lastChar === 'y' && lower.length > 1) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const secondLastChar = lower[lower.length - 2];
    if (!vowels.includes(secondLastChar)) {
      return word.slice(0, -1) + 'ies';
    }
  }
  
  return word + 's';
};

/**
 * Generate plural form for a phrase
 */
const pluralizePhrase = (phrase) => {
  if (!phrase || !phrase.includes(' ')) {
    return pluralizeWord(phrase);
  }
  
  const words = phrase.split(' ');
  const firstWord = words[0];
  const rest = words.slice(1).join(' ');
  const pluralFirstWord = pluralizeWord(firstWord);
  
  return rest ? `${pluralFirstWord} ${rest}` : pluralFirstWord;
};

/**
 * Generate case variations and plural forms for preview
 * Single words: 3 case + 3 plural = 6 variations
 * Multi-word: 4 case + 4 plural = 8 variations
 */
const generateCaseVariations = (source) => {
  if (!source || !source.trim()) return [];
  
  const trimmed = source.trim();
  const isMultiWord = trimmed.includes(' ');
  const caseVariations = [];

  if (isMultiWord) {
    // Multi-word phrase: 4 case variations
    const lower = trimmed.toLowerCase();
    const firstWordCap = trimmed.split(' ').map((word, idx) => 
      idx === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
    ).join(' ');
    const titleCase = trimmed.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    const upper = trimmed.toUpperCase();

    const variations = [lower, firstWordCap, titleCase, upper];
    caseVariations.push(...variations);
    
    // Add plural forms
    variations.forEach(v => {
      const plural = pluralizePhrase(v);
      if (!caseVariations.includes(plural)) {
        caseVariations.push(plural);
      }
    });
  } else {
    // Single word: 3 case variations
    const lower = trimmed.toLowerCase();
    const upper = trimmed.toUpperCase();
    const titleCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

    const variations = [lower, upper, titleCase];
    caseVariations.push(...variations);
    
    // Add plural forms
    variations.forEach(v => {
      const plural = pluralizeWord(v);
      if (!caseVariations.includes(plural)) {
        caseVariations.push(plural);
      }
    });
  }

  return [...new Set(caseVariations)];
};

export default function GlossaryAddEntry({ onAddSuccess }) {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("km");
  const [entries, setEntries] = useState([{ source: "", target: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleAddEntry = () => {
    setEntries([...entries, { source: "", target: "" }]);
  };

  const handleRemoveEntry = (index) => {
    if (entries.length > 1) {
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
    }
  };

  const getValidEntries = () => {
    return entries.filter(e => e.source.trim() && e.target.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validEntries = getValidEntries();
    if (validEntries.length === 0) {
      setError("Please enter at least one source term and target translation");
      return;
    }

    if (!sourceLanguage || !targetLanguage) {
      setError("Please select source and target languages");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/glossaries/add-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLanguage,
          targetLanguage,
          entries: validEntries.map(e => ({
            source: e.source.trim(),
            target: e.target.trim(),
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(
          `Successfully added ${data.glossary.addedEntries} entry/entries! ` +
          `Total entries in glossary: ${data.glossary.totalEntries}.`
        );
        // Clear form
        setEntries([{ source: "", target: "" }]);
        if (onAddSuccess) {
          onAddSuccess();
        }
      } else {
        setError(data.error || data.details || "Failed to add entries");
      }
    } catch (err) {
      console.error("Add entry error:", err);
      setError("Failed to add entries. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setEntries([{ source: "", target: "" }]);
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold translator-text-foreground">
              Source Language
            </label>
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              includeAuto={false}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold translator-text-foreground">
              Target Language
            </label>
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              includeAuto={false}
            />
          </div>
        </div>

        {/* Entry rows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold translator-text-foreground">
              Entries
            </label>
            <button
              type="button"
              onClick={handleAddEntry}
              disabled={isSubmitting}
              className="text-xs translator-primary-text hover:opacity-80 font-medium"
            >
              + Add Entry
            </button>
          </div>

          {entries.map((entry, index) => {
            const caseVariations = entry.source ? generateCaseVariations(entry.source) : [];
            return (
              <div
                key={index}
                className="translator-rounded translator-border translator-card p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium translator-text-foreground">
                        Source Term {index + 1}
                      </label>
                      <input
                        type="text"
                        value={entry.source}
                        onChange={(e) => handleEntryChange(index, "source", e.target.value)}
                        placeholder="e.g., hit the hay or Apple"
                        className="w-full translator-rounded translator-border translator-card px-3 py-2 text-sm translator-text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium translator-text-foreground">
                        Target Translation {index + 1}
                      </label>
                      <input
                        type="text"
                        value={entry.target}
                        onChange={(e) => handleEntryChange(index, "target", e.target.value)}
                        placeholder="Enter the translation"
                        className="w-full translator-rounded translator-border translator-card px-3 py-2 text-sm translator-text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Preview of case variations for this entry */}
                    {entry.source && caseVariations.length > 0 && (
                      <div className="translator-rounded translator-border bg-muted/20 p-3 space-y-1">
                        <p className="text-xs font-semibold translator-text-foreground">
                          Preview: Will add {caseVariations.length} variation(s) (case + plural):
                        </p>
                        <div className="space-y-0.5 max-h-32 overflow-y-auto">
                          {caseVariations.map((variation, idx) => (
                            <div
                              key={idx}
                              className="text-xs translator-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded"
                            >
                              <span className="font-semibold">{variation}</span>
                              {entry.target && (
                                <span className="ml-2">→ {entry.target}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(index)}
                      disabled={isSubmitting}
                      className="text-xs translator-destructive hover:opacity-80 font-medium px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
            <p className="font-medium">Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div
            className="translator-rounded translator-border p-3 text-sm"
            style={{ backgroundColor: "oklch(0.9 0.05 150 / 0.15)" }}
          >
            <p className="font-medium">{success}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={getValidEntries().length === 0 || isSubmitting}
            className="flex-1 translator-rounded translator-primary px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {isSubmitting ? "Adding..." : `Add ${getValidEntries().length} Entry/Entries`}
          </button>
          {entries.some(e => e.source || e.target) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting}
              className="translator-rounded translator-border translator-card px-4 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translator-primary-text"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


