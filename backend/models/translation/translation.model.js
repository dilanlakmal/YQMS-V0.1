import mongoose, { Schema } from "mongoose";

/**
 * Schema definition for the Translation model.
 * Represents a translated version of a specific content block.
 */
const translationSchema = new Schema({
    code: {
        type: String,
        required: true
    },
    translated: {
        type: String,
        required: true
    },
    content: {
        type: Schema.Types.ObjectId,
        ref: "content",
        required: true
    }
}, {
    timestamps: true
});

// Composite index to ensure one translation per language per content
translationSchema.index({ content: 1, code: 1 }, { unique: true });

const Translation = mongoose.model("translation", translationSchema);

export default Translation;
