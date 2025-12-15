import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)' },
  { code: 'km', name: 'Khmer' },
];

const ALL_LANGUAGES = [
  ...COMMON_LANGUAGES,
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
];

export default function LanguageSelector({
  value,
  onChange,
  label, // Kept for compatibility but might not be used in 'tabs' view
  includeAuto = false,
  variant = 'tabs', // 'tabs' or 'select' (legacy)
  recentLanguages = ['en', 'zh-Hans', 'km'] // Default pinned languages
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedLangs, setPinnedLangs] = useState(recentLanguages);
  const dropdownRef = useRef(null);

  // If includeAuto is true, make sure 'auto' is in the list of options handled internally
  const fullLanguageList = includeAuto
    ? [{ code: 'auto', name: 'Auto Detect' }, ...ALL_LANGUAGES]
    : ALL_LANGUAGES;

  const handleLanguageSelect = (code) => {
    // If selecting a language not in pinned, replace the last one or active one?
    // Google Translate logic: It replaces the currently active tab if it's not pinned,
    // or if the user clicks the dropdown arrow of a specific tab.
    // For simplicity: If the selected language is not in pinned, replace the last pinned language.
    // Unless the value is already in pinned.

    if (!pinnedLangs.includes(code)) {
      // Replace the last one
      const newPinned = [...pinnedLangs];
      newPinned[newPinned.length - 1] = code;
      setPinnedLangs(newPinned);
    }

    onChange(code);
    setIsOpen(false);
  };

  useEffect(() => {
    // Improve closing behavior
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLangName = (code) => {
    const lang = fullLanguageList.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const filteredLanguages = fullLanguageList.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Legacy/Simple Mode
  if (variant === 'select') {
    return (
      <div className="flex items-center gap-2">
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {fullLanguageList.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Tabs Mode (Google Translate Style)
  const tabs = includeAuto ? ['auto', ...pinnedLangs] : pinnedLangs;
  // Dedup in case 'auto' is in pinned (should not be usually)
  const uniqueTabs = [...new Set(tabs)];

  // Ensure we display 3-4 items max
  const displayTabs = uniqueTabs.slice(0, 4);

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-1 items-center">
          {displayTabs.map((code) => (
            <button
              key={code}
              onClick={() => onChange(code)}
              className={`
                  relative px-4 py-3 text-sm font-medium transition-colors
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  ${value === code
                  ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-blue-600 dark:after:bg-blue-400'
                  : 'text-gray-600 dark:text-gray-300'}
                `}
            >
              {getLangName(code)}
            </button>
          ))}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center justify-center p-2 ml-1 rounded-full 
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              ${isOpen ? 'bg-gray-100 dark:bg-gray-800' : ''}
            `}
            aria-label="More languages"
          >
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-[600px] max-w-[90vw] mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors
                    ${value === lang.code
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}
                  `}
              >
                {value === lang.code && <Check className="h-3 w-3 flex-shrink-0" />}
                <span className={value === lang.code ? 'font-medium' : ''}>{lang.name}</span>
              </button>
            ))}
            {filteredLanguages.length === 0 && (
              <div className="col-span-3 py-4 text-center text-gray-500 text-sm">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}