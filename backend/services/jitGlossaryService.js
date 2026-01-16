/**
 * JIT (Just-in-Time) Glossary Service
 * Generates dynamic TSV glossaries for Azure Document Translation
 * Uses hash-based caching to avoid regenerating unchanged glossaries
 */

import crypto from 'crypto';
import { expandSourceVariants, buildTSV } from './variationEngine.js';

// In-memory hash → blobName mapping for caching
const hashToBlobCache = new Map();
const GLOSSARY_CACHE_CONTAINER = 'glossary-cache';
const CACHE_EXPIRY_HOURS = 24;

/**
 * Generate Just-in-Time glossary TSV for translation
 * Uses caching to avoid regenerating unchanged glossaries
 * 
 * @param {Object} GlossaryTerm - Mongoose model for glossary terms
 * @param {Object} blobHelpers - Object containing blob helper functions
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} domain - Domain filter (default: 'General')
 * @returns {Promise<{sasUrl: string, termCount: number, cached: boolean} | null>}
 */
export async function generateJITGlossary(
    GlossaryTerm,
    blobHelpers,
    sourceLang,
    targetLang,
    domain = 'General'
) {
    const { uploadFileToBlob, getBlobSASUrl, checkBlobExists } = blobHelpers;

    // 1. Compute current glossary hash
    const hash = await computeGlossaryHash(GlossaryTerm, sourceLang, targetLang, domain);

    if (!hash) {
        console.log(`[JIT] No verified terms for ${sourceLang}-${targetLang}-${domain}`);
        return null;
    }

    const blobName = `${sourceLang}-${targetLang}-${domain}-${hash}.tsv`;

    // 2. Check cache hit
    if (hashToBlobCache.has(hash)) {
        const cachedBlob = hashToBlobCache.get(hash);
        try {
            const exists = await checkBlobExists(GLOSSARY_CACHE_CONTAINER, cachedBlob.blobName);

            if (exists) {
                console.log(`[JIT] Cache HIT: Using existing glossary ${cachedBlob.blobName}`);
                const sasUrl = await getBlobSASUrl(GLOSSARY_CACHE_CONTAINER, cachedBlob.blobName, CACHE_EXPIRY_HOURS);
                return { sasUrl, termCount: cachedBlob.termCount, cached: true };
            }
        } catch (e) {
            console.warn(`[JIT] Cache check failed:`, e.message);
        }
    }

    // 3. Cache miss - regenerate
    console.log(`[JIT] Cache MISS: Generating new glossary ${blobName}`);

    // 4. Fetch verified terms only
    const terms = await GlossaryTerm.find({
        sourceLang,
        targetLang,
        domain: { $in: [domain, 'General'] },
        verificationStatus: 'verified'
    }).lean();

    if (terms.length === 0) {
        console.log(`[JIT] No verified terms found`);
        return null;
    }

    // 5. Build TSV with variation expansion
    const tsvContent = buildTSV(terms);
    const termCount = terms.length;
    const lineCount = tsvContent.split('\n').length;

    console.log(`[JIT] Generated TSV: ${termCount} terms → ${lineCount} lines (with variations)`);

    // 6. Upload to blob
    const buffer = Buffer.from(tsvContent, 'utf-8');
    await uploadFileToBlob(GLOSSARY_CACHE_CONTAINER, blobName, buffer, 'text/tab-separated-values');

    // 7. Get SAS URL
    const sasUrl = await getBlobSASUrl(GLOSSARY_CACHE_CONTAINER, blobName, CACHE_EXPIRY_HOURS);

    // 8. Update cache
    hashToBlobCache.set(hash, { blobName, termCount, createdAt: Date.now() });

    return { sasUrl, termCount, lineCount, cached: false };
}

/**
 * Compute a hash that uniquely identifies the current glossary state
 * Based on language pair, domain, term count, and max updatedAt
 */
async function computeGlossaryHash(GlossaryTerm, sourceLang, targetLang, domain) {
    const stats = await GlossaryTerm.aggregate([
        {
            $match: {
                sourceLang,
                targetLang,
                domain: { $in: [domain, 'General'] },
                verificationStatus: 'verified'
            }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                maxUpdated: { $max: '$updatedAt' }
            }
        }
    ]);

    if (!stats.length || stats[0].count === 0) {
        return null;
    }

    const { count, maxUpdated } = stats[0];
    const hashInput = `${sourceLang}-${targetLang}-${domain}-${count}-${maxUpdated.getTime()}`;
    return crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 12);
}

/**
 * Invalidate cache when terms are modified
 * Call after term verification/edit
 */
export function invalidateGlossaryCache(sourceLang, targetLang) {
    let cleared = 0;
    for (const [hash, entry] of hashToBlobCache.entries()) {
        if (entry.blobName.startsWith(`${sourceLang}-${targetLang}`)) {
            hashToBlobCache.delete(hash);
            cleared++;
        }
    }
    if (cleared > 0) {
        console.log(`[JIT] Invalidated ${cleared} cache entries for ${sourceLang}-${targetLang}`);
    }
}

/**
 * Cleanup old cache entries
 * Call periodically to prevent memory bloat
 */
export async function cleanupOldCacheEntries(blobHelpers) {
    const MAX_CACHE_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, entry] of hashToBlobCache.entries()) {
        if (now - entry.createdAt > MAX_CACHE_AGE_MS) {
            try {
                if (blobHelpers?.deleteBlobByName) {
                    await blobHelpers.deleteBlobByName(GLOSSARY_CACHE_CONTAINER, entry.blobName);
                }
            } catch (e) {
                // Blob may already be deleted
            }
            hashToBlobCache.delete(hash);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`[JIT] Cleaned up ${cleaned} expired cache entries`);
    }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        size: hashToBlobCache.size,
        container: GLOSSARY_CACHE_CONTAINER,
        expiryHours: CACHE_EXPIRY_HOURS
    };
}

export default {
    generateJITGlossary,
    invalidateGlossaryCache,
    cleanupOldCacheEntries,
    getCacheStats
};
