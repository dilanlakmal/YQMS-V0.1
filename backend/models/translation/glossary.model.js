import mongoose, { Schema } from "mongoose";
import Content from "./content.model.js";
import Language from "./language.model.js";

/**
 * Schema definition for the Glossary model.
 * Stores reusable, high-quality translation mappings between a source Content and a target Language.
 */
const glossarySchema = new Schema({
    source: {
        type: Schema.Types.ObjectId,
        ref: "content",
        required: true,
        index: true
    },
    target: {
        type: Schema.Types.ObjectId,
        ref: "content",
        required: true,
        index: true
    },


}, { timestamps: true });

// Ensure unique combination of content and target language for a glossary entry
glossarySchema.index({ source: 1, target: 1 }, { unique: true });

/* -------------------- Statics -------------------- */

/**
 * Retrieves glossary items for a specific language pair.
 * Returns an array of objects with source and target content strings.
 * 
 * @param {string} sourceCode - The source language code (e.g., "en").
 * @param {string} targetCode - The target language code (e.g., "km").
 * @returns {Promise<Array<{source: string, target: string}>>}
 */
glossarySchema.statics.getGlossaryItems = async function (sourceCode, targetCode) {
    if (!sourceCode || !targetCode) {
        throw new Error("Source and target language codes are required.");
    }

    return this.aggregate([
        // Join with Content to get Source details
        {
            $lookup: {
                from: "contents",
                localField: "source",
                foreignField: "_id",
                as: "sourceContent"
            }
        },
        { $unwind: "$sourceContent" },
        // Join with Language to filter Source by code
        {
            $lookup: {
                from: "languages",
                localField: "sourceContent.language",
                foreignField: "_id",
                as: "sourceLang"
            }
        },
        { $unwind: "$sourceLang" },
        { $match: { "sourceLang.code": sourceCode } },

        // Join with Content to get Target details
        {
            $lookup: {
                from: "contents",
                localField: "target",
                foreignField: "_id",
                as: "targetContent"
            }
        },
        { $unwind: "$targetContent" },
        // Join with Language to filter Target by code
        {
            $lookup: {
                from: "languages",
                localField: "targetContent.language",
                foreignField: "_id",
                as: "targetLang"
            }
        },
        { $unwind: "$targetLang" },
        { $match: { "targetLang.code": targetCode } },

        // Format the output
        {
            $project: {
                _id: 0,
                source: "$sourceContent.original",
                target: "$targetContent.original"
            }
        }
    ]);
};

/**
 * Creates a new glossary entry from source and target text.
 * Automatically detects languages for content creation.
 * 
 * @param {string} sourceText - The source content text.
 * @param {string} sourceCode - The source language code.
 * @param {string} targetText - The target content text.
 * @param {string} targetCode - The target language code.
 * @returns {Promise<Document>} The created Glossary document.
 */
glossarySchema.statics.createGlossary = async function (sourceText, sourceCode = null, targetText, targetCode = null) {
    if (!sourceText || !targetText) {
        throw new Error("Source and target text are required.");
    }
    let sourceQuery = { original: sourceText };
    if (sourceCode) {
        const sourceLang = await Language.findOne({ code: sourceCode });
        if (sourceLang) sourceQuery.language = sourceLang._id;
    }

    let targetQuery = { original: targetText };
    if (targetCode) {
        const targetLang = await Language.findOne({ code: targetCode });
        if (targetLang) targetQuery.language = targetLang._id;
    }

    const existingSource = await Content.findOne(sourceQuery);
    const existingTarget = await Content.findOne(targetQuery);
    if (existingSource && existingTarget) {
        logger.info("Source and target content already exist");
        const existingGlossary = await this.findOne({ source: existingSource._id, target: existingTarget._id });
        if (existingGlossary) {
            return existingGlossary;
        } else {
            logger.info("Creating new glossary entry");
            return this.create({
                source: existingSource._id,
                target: existingTarget._id
            });
        }
    }
    // Create Content documents using the existing helper that handles language detection
    const sourceContent = await Content.createWithText({ originalText: sourceText, code: sourceCode });
    const targetContent = await Content.createWithText({ originalText: targetText, code: targetCode });
    logger.info("Creating new glossary entry");

    return this.create({
        source: sourceContent._id,
        target: targetContent._id
    });
};

const Glossary = mongoose.model("glossary", glossarySchema);

export default Glossary;
