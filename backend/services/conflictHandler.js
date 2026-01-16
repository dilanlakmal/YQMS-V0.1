/**
 * Conflict Handler Service
 * Handles duplicate detection and conflict resolution for glossary terms
 */

/**
 * Check for conflicts before inserting a term
 * @param {Object} GlossaryTerm - Mongoose model
 * @param {Object} newTerm - Term to check
 * @returns {Promise<{action: string, ...}>}
 */
export async function checkAndInsertTerm(GlossaryTerm, newTerm) {
    const { source, sourceLang, targetLang, target } = newTerm;

    // Check for existing term with same source + langPair
    const existing = await GlossaryTerm.findOne({
        source: source,
        sourceLang: sourceLang,
        targetLang: targetLang
    });

    if (existing) {
        // Same source exists
        if (existing.target === target) {
            // Exact duplicate - skip
            return {
                action: 'skipped',
                reason: 'duplicate',
                existingId: existing._id
            };
        } else {
            // Conflict: same source, different target
            return {
                action: 'conflict',
                reason: 'different_target',
                existingId: existing._id,
                existingTarget: existing.target,
                newTarget: target,
                suggestion: 'Review both translations and verify the correct one'
            };
        }
    }

    // No conflict - insert
    try {
        const inserted = await GlossaryTerm.create(newTerm);
        return { action: 'inserted', termId: inserted._id };
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error (race condition)
            return { action: 'skipped', reason: 'duplicate_race' };
        }
        throw error;
    }
}

/**
 * Handle conflicts during bulk mining
 * @param {Object} GlossaryTerm - Mongoose model
 * @param {Array} terms - Array of terms to insert
 * @returns {Promise<{inserted: Array, skipped: Array, conflicts: Array}>}
 */
export async function handleMiningConflicts(GlossaryTerm, terms) {
    const results = {
        inserted: [],
        skipped: [],
        conflicts: []
    };

    for (const term of terms) {
        const result = await checkAndInsertTerm(GlossaryTerm, term);

        switch (result.action) {
            case 'inserted':
                results.inserted.push({
                    termId: result.termId,
                    source: term.source,
                    target: term.target
                });
                break;
            case 'skipped':
                results.skipped.push({
                    source: term.source,
                    reason: result.reason,
                    existingId: result.existingId
                });
                break;
            case 'conflict':
                results.conflicts.push({
                    source: term.source,
                    existingTarget: result.existingTarget,
                    newTarget: result.newTarget,
                    existingId: result.existingId,
                    suggestion: result.suggestion
                });
                break;
        }
    }

    return results;
}

/**
 * Check if a term exists (for preview before mining)
 * @param {Object} GlossaryTerm - Mongoose model
 * @param {string} source - Source term
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @returns {Promise<Object|null>}
 */
export async function checkExistingTerm(GlossaryTerm, source, sourceLang, targetLang) {
    return await GlossaryTerm.findOne({
        source,
        sourceLang,
        targetLang
    }).lean();
}

export default {
    checkAndInsertTerm,
    handleMiningConflicts,
    checkExistingTerm
};
