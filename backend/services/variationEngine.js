/**
 * Variation Engine Service
 * Expands glossary terms into multiple forms (case variants, plurals)
 * for more comprehensive TSV generation
 */

// In-memory cache with TTL
const VARIATION_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Expand a source term into all variation forms
 * @param {string} source - Source term
 * @param {string} sourceLang - Source language code
 * @returns {string[]} - Array of source variations
 */
export function expandSourceVariants(source, sourceLang) {
    const cacheKey = `${source}|${sourceLang}`;
    const cached = VARIATION_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.variants;
    }

    const variants = new Set();
    variants.add(source); // Original

    // Case variations (Latin-script languages)
    if (['en', 'fr', 'es', 'de', 'pt', 'it'].includes(sourceLang)) {
        variants.add(source.toLowerCase());
        variants.add(source.toUpperCase());
        variants.add(toTitleCase(source));
    }

    // Plural forms (English only)
    if (sourceLang === 'en') {
        const plurals = generatePlurals(source);
        plurals.forEach(p => variants.add(p));
    }

    const result = Array.from(variants);
    VARIATION_CACHE.set(cacheKey, { variants: result, timestamp: Date.now() });

    return result;
}

/**
 * Convert string to Title Case
 * @param {string} str - Input string
 * @returns {string} - Title cased string
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

/**
 * Generate English plural forms
 * @param {string} word - Singular word
 * @returns {string[]} - Array of possible plural forms
 */
function generatePlurals(word) {
    const plurals = [];
    const lower = word.toLowerCase();

    // Skip if already ends with 's' (likely already plural)
    if (lower.endsWith('s')) return plurals;

    // Words ending in consonant + y → ies
    if (/[^aeiou]y$/i.test(word)) {
        plurals.push(word.slice(0, -1) + 'ies');
    }
    // Words ending in s, x, z, ch, sh → es
    else if (/(?:s|x|z|ch|sh)$/i.test(word)) {
        plurals.push(word + 'es');
    }
    // Words ending in f/fe → ves (common cases)
    else if (/(?:f|fe)$/i.test(word)) {
        plurals.push(word.replace(/f$/, 'ves').replace(/fe$/, 'ves'));
        plurals.push(word + 's'); // Also add regular plural
    }
    // Regular → s
    else {
        plurals.push(word + 's');
    }

    return plurals;
}

/**
 * Build TSV content from verified terms with variation expansion
 * @param {Array} terms - Array of {source, target, sourceLang} objects
 * @returns {string} - TSV content ready for Azure Document Translation
 */
export function buildTSV(terms) {
    const lines = new Set(); // Use Set to auto-deduplicate

    for (const term of terms) {
        const sourceVariants = expandSourceVariants(term.source, term.sourceLang);

        for (const variant of sourceVariants) {
            // TSV format: source<TAB>target
            lines.add(`${variant}\t${term.target}`);
        }
    }

    return Array.from(lines).join('\n');
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export function getCacheStats() {
    return {
        size: VARIATION_CACHE.size,
        entries: Array.from(VARIATION_CACHE.keys())
    };
}

/**
 * Clear entire variation cache
 * Call when major updates happen
 */
export function clearCache() {
    VARIATION_CACHE.clear();
}

/**
 * Remove specific term from cache
 * Call when a single term is updated
 * @param {string} source - Source term
 * @param {string} sourceLang - Source language
 */
export function invalidateTerm(source, sourceLang) {
    VARIATION_CACHE.delete(`${source}|${sourceLang}`);
}

export default {
    expandSourceVariants,
    buildTSV,
    getCacheStats,
    clearCache,
    invalidateTerm
};
