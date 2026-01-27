import mongoose from "mongoose";
const { Schema } = mongoose;

import Language from "./language.model.js";
import AzureTranslatorService from "../../services/translation/azure.translator.service.js";
import { Translation } from "./index.js";

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

contentSchema.virtual("translations", {
  ref: "translation",
  localField: "_id",
  foreignField: "content", // <-- FIXED (see explanation)
});

/* Enable virtuals in output */
contentSchema.set("toJSON", { virtuals: true });
contentSchema.set("toObject", { virtuals: true });

/* -------------------- Statics -------------------- */

contentSchema.statics.createWithText = async function ({ originalText }) {
  const code = await AzureTranslatorService.detectLanguage(originalText);
  const language = await Language.findOne({ code: code ?? "en" });

  return this.create({
    original: originalText,   // <-- FIXED
    language: language._id
  });
};

/* -------------------- Methods -------------------- */

contentSchema.methods.translateText = async function (toLanguage) {
    // 1️⃣ Check if a translation already exists
    const existingTranslation = await Translation.findOne({
        content: this._id,
        code: toLanguage
    });

    if (existingTranslation) {
        return existingTranslation.translated; // return existing text
    }

    // 2️⃣ If not, translate using Azure
    // Make sure language is populated
    let sourceLangCode;
    if (this.language?.code) {
        sourceLangCode = this.language.code;
    } else {
        const lang = await Language.findById(this.language);
        sourceLangCode = lang.code;
    }

    const translatedText = await AzureTranslatorService.translateText(
        this.original,
        "",
        toLanguage
    );

    // 3️⃣ Save translation
    await Translation.updateOne(
        { content: this._id, code: toLanguage },
        { $set: { content: this._id, code: toLanguage, translated: translatedText } },
        { upsert: true }
    );

    // 4️⃣ Mark content as translated if not already
    if (!this.translated) {
        this.translated = true;
        await this.save();
    }

    return translatedText;
};


export default mongoose.model("content", contentSchema);
