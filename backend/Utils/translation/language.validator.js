
const LANGUAGE_MAP = {
    // Common
    "english": "en",
    "chinese": "zh-Hans", // Defaulting to Simplified
    "chinese_simplified": "zh-Hans",
    "chinese_traditional": "zh-Hant",
    "khmer": "km",
    "spanis": "es",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "italian": "it",
    "japanese": "ja",
    "korean": "ko",
    "portuguese": "pt",
    "russian": "ru",
    "vietnamese": "vi",
    "thai": "th",
    // Add more as needed
};

/**
 * Validates and converts language names to Azure ISO codes.
 * Returns array of valid codes. Throws error if any language is invalid.
 * @param {string[]} languages 
 */
const validateAndMapLanguages = (languages) => {
    const validCodes = [];
    const invalidLanguages = [];

    languages.forEach(lang => {
        const normalized = lang.toLowerCase().trim();
        // Check if it's already a code (length 2-3 usually) or in map
        if (LANGUAGE_MAP[normalized]) {
            validCodes.push(LANGUAGE_MAP[normalized]);
        } else if (normalized.length === 2) {
            // Assume it's a code if 2 chars (risky but practical fallback)
            validCodes.push(normalized);
        } else {
            invalidLanguages.push(lang);
        }
    });

    if (invalidLanguages.length > 0) {
        throw new Error(`Unsupported languages: ${invalidLanguages.join(", ")}`);
    }

    // Dedup
    return [...new Set(validCodes)];
};

export { validateAndMapLanguages, LANGUAGE_MAP };
