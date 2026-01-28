import mongoose, { Schema } from "mongoose";
import Language from "./language.model.js";
import AzureTranslatorService from "../../services/translation/azure.translator.service.js";
import { Translation } from "./index.js";

/**
 * Schema definition for the Content model.
 * Represents original text content and its language metadata.
 */
const contentSchema = new Schema({
    original: {
        type: String,
        required: true
    },
    language: {
        type: Schema.Types.ObjectId,
        ref: "language",
        required: true
    },
    translated: {
        type: Boolean,
        default: false
    }
});

/* -------------------- Virtuals -------------------- */

// Virtual field to populate translations associated with this content
contentSchema.virtual("translations", {
    ref: "translation",
    localField: "_id",
    foreignField: "content",
});

/* Enable virtuals in output */
contentSchema.set("toJSON", { virtuals: true });
contentSchema.set("toObject", { virtuals: true });

/* -------------------- Statics -------------------- */

/**
 * Creates a new content document by auto-detecting the language of the provided text.
 * @param {Object} params - Parameters object.
 * @param {string} params.originalText - The text to be stored and analyzed.
 * @returns {Promise<mongoose.Document>} The created Content document.
 */
contentSchema.statics.createWithText = async function ({ originalText }) {
    const code = await AzureTranslatorService.detectLanguage(originalText);
    const language = await Language.findOne({ code: code ?? "en" });

    return this.create({
        original: originalText,
        language: language._id
    });
};

/* -------------------- Methods -------------------- */

/**
 * Translates the content to a target language.
 * Checks for existing translations before calling the external service.
 * 
 * @param {string} toLanguage - The target language code (e.g., "fr").
 * @returns {Promise<string>} The translated text.
 * @throws {Error} If languages are not found or translation fails.
 */
contentSchema.methods.translateText = async function (toLanguage) {
    if (!toLanguage) {
        throw new Error("Target language code is required");
    }

    // 1️⃣ Check if translation already exists locally
    const existingTranslation = await Translation.findOne({
        content: this._id,
        code: toLanguage
    }).lean();

    if (existingTranslation?.translated) {
        return existingTranslation.translated;
    }

    // 2️⃣ Resolve source language code safely
    let sourceLangCode = null;

    if (this.language?.code) {
        sourceLangCode = this.language.code;
    } else if (this.language) {
        const lang = await Language.findById(this.language).lean();
        if (!lang) {
            throw new Error("Source language not found");
        }
        sourceLangCode = lang.code;
    }

    // 3️⃣ Validate target language support
    const targetLang = await Language.findOne({ code: toLanguage }).lean();
    if (!targetLang) {
        throw new Error(`Target language '${toLanguage}' is not supported`);
    }

    // 4️⃣ Call External Translator Service (Azure)
    let translatedText;
    try {
        translatedText = await AzureTranslatorService.translateText(
            this.original,
            sourceLangCode || "", // Defaults to auto-detect if source is unknown
            toLanguage
        );
    } catch (err) {
        throw new Error(`Translation failed: ${err.message}`);
    }

    // 5️⃣ Save the translation to the database
    // Using updateOne with upsert ensures we don't create duplicates
    await Translation.updateOne(
        { content: this._id, code: toLanguage },
        {
            $set: {
                content: this._id,
                code: toLanguage,
                translated: translatedText
            }
        },
        { upsert: true }
    );

    // 6️⃣ Mark the original content as having been translated (at least once)
    if (!this.translated) {
        this.translated = true;
        await this.save();
    }

    return translatedText;
};

const Content = mongoose.model("content", contentSchema);

export default Content;
