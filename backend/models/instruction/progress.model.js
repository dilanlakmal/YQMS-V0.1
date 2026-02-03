import mongoose, { Schema } from "mongoose";
import Content from "../translation/content.model.js";

/**
 * Schema definition for the Progress model.
 * Represents the progress of an instruction step, linking to translated content.
 */
const progressSchema = new Schema({
  title: {
    type: Schema.Types.ObjectId,
    ref: "content",
    required: true,
  },
  description: {
    type: Schema.Types.ObjectId,
    ref: "content",
    required: true,
  },
  instruct_title: {
    type: Schema.Types.ObjectId,
    ref: "content",
    required: true
  },
  instruct_description: {
    type: Schema.Types.ObjectId,
    ref: "content",
    required: true,
  },
  icon: {
    type: String,
  },
  order: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  source_language: {
    type: String, // e.g. "en"
    default: "en"
  },
  target_languages: [{
    type: String // e.g. ["zh", "fr"]
  }],
  team: {
    type: String
  }
});

/**
 * Creates a new Progress document along with its associated Content documents.
 * 
 * @param {Object} params - The parameters for creating the progress.
 * @param {string} params.title - The title text.
 * @param {string} params.description - The description text.
 * @param {string} params.instruct_title - The instruction title text.
 * @param {string} params.instruct_description - The instruction description text.
 * @param {string} [params.icon] - The icon identifier.
 * @param {string} [params.status] - The status of the progress (active/inactive).
 * @param {number} [params.order] - The order sequence number.
 * @param {string|mongoose.Types.ObjectId} params.user_id - The user ID associated with this progress.
 * @returns {Promise<mongoose.Document>} The created Progress document.
 */
progressSchema.statics.createWithText = async function ({
  title,
  description,
  instruct_title,
  instruct_description,
  icon,
  status,
  order,
  user_id
}) {
  // Create content documents for each text field
  const titleContent = await Content.createWithText({
    originalText: title,
  });

  const descriptionContent = await Content.createWithText({
    originalText: description,
  });

  const instructionTitleContent = await Content.createWithText({
    originalText: instruct_title
  });

  const instructionDescriptionContent = await Content.createWithText({
    originalText: instruct_description
  });

  // Create the progress document linking the content documents
  return this.create({
    title: titleContent._id,
    description: descriptionContent._id,
    instruct_title: instructionTitleContent._id,
    instruct_description: instructionDescriptionContent._id,
    icon,
    status,
    order,
    user_id
  });
};

/**
 * Retrieves progress documents for a specific user, populating content fields.
 * 
 * @param {string|mongoose.Types.ObjectId} userId - The ID of the user.
 * @returns {Promise<Array<Object>>} A list of formatted progress objects.
 */
progressSchema.statics.getByUserId = async function (userId) {
  const populateOn = (field) => ({
    path: field,
    populate: [
      { path: "language", model: "language" },
      { path: "translations", model: "content" }
    ]
  });

  const response = await this.find({ user_id: userId })
    .populate(populateOn("title"))
    .populate(populateOn("description"))
    .populate(populateOn("instruct_title"))
    .populate(populateOn("instruct_description"))
    .exec();

  return response.map(res => ({
    id: res._id,
    title: res.title?.original ?? null,
    description: res.description?.original ?? null,
    instruct_title: res.instruct_title?.original ?? null,
    instruct_description: res.instruct_description?.original ?? null,
    order: res.order,
    icon: res.icon,
    status: res.status,
    language:
      res.title?.language?.code === res.description?.language?.code
        ? res.title?.language?.code
        : "en",
    source_language: res.source_language || "en",
    target_languages: res.target_languages || [],
    team: res.team || null
  }));
};

/**
 * Retrieves progress documents for a user with content translated to a target language.
 * 
 * @param {string|mongoose.Types.ObjectId} userId - The ID of the user.
 * @param {string} toLanguage - The target language code (e.g., "fr", "es").
 * @returns {Promise<Array<Object>>} A list of progress objects with translated content.
 */
progressSchema.statics.translateAllContent = async function (userId, toLanguage) {
  // 1️⃣ Helper to build populate options
  const populateOn = (field, toTranslate = false) => {
    const base = {
      path: field,
      populate: { path: "language", model: "language" }
    };

    if (toTranslate) {
      // Include translations when fetching translated content
      base.populate = [
        { path: "language", model: "language" },
        { path: "translations", model: "translation" }
      ];
    }

    return base;
  };

  // 2️⃣ Fetch progresses (without translations)
  const progresses = await this.find({ user_id: userId })
    .populate(populateOn("title"))
    .populate(populateOn("description"))
    .populate(populateOn("instruct_title"))
    .populate(populateOn("instruct_description"));

  // 3️⃣ Translate all content in parallel
  await Promise.all(
    progresses.flatMap(p => [
      p.title?.translateText(toLanguage),
      p.description?.translateText(toLanguage),
      p.instruct_title?.translateText(toLanguage),
      p.instruct_description?.translateText(toLanguage)
    ].filter(Boolean))
  );

  // 4️⃣ Re-fetch progresses WITH translations
  const populatedProgresses = await this.find({ user_id: userId })
    .populate(populateOn("title", true))
    .populate(populateOn("description", true))
    .populate(populateOn("instruct_title", true))
    .populate(populateOn("instruct_description", true));

  // 5️⃣ Map for API response
  return populatedProgresses.map(p => ({
    id: p._id,
    title: p.title?.translations?.find(tran => tran.code === toLanguage)?.translated ?? null,
    description: p.description?.translations?.find(tran => tran.code === toLanguage)?.translated ?? null,
    instruct_title: p.instruct_title?.translations?.find(tran => tran.code === toLanguage)?.translated ?? null,
    instruct_description: p.instruct_description?.translations?.find(tran => tran.code === toLanguage)?.translated ?? null,
    order: p.order,
    icon: p.icon,
    status: p.status,
    language: toLanguage, // Legacy fallback
    source_language: p.source_language || "en",
    target_languages: p.target_languages || [],
    team: p.team || null
  }));
};

const Progress = mongoose.model("progress", progressSchema);
export default Progress;
