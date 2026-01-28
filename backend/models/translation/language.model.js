import mongoose, { Schema } from "mongoose";

/**
 * Schema definition for the Language model.
 * Stores supported languages (e.g., 'en', 'fr') and their display names.
 */
const languageSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
});

const Language = mongoose.model("language", languageSchema);

export default Language;