import mongoose, { Schema } from "mongoose";

/**
 * Schema definition for the Document model.
 * Represents an uploaded document (instruction, glossary, etc.) and its processing status.
 */
const documentSchema = new Schema({
    type: {
        type: String,
        enum: ["instruction", "glossary", "requirement"],
        required: true
    },
    // Using snake_case for DB consistency
    file_name: {
        type: String,
    },
    source: {
        type: String,
    },
    status: {
        type: String,
        enum: [
            "uploaded",
            "pageExtracted",
            "imageExtracted",
            "contentExtracted",
            "fieldExtracted",
            "translated"
        ],
        required: true,
        default: "uploaded"
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User" // Standardized to PascalCase "User" assuming standard Mongoose naming
    },
    active: {
        type: Boolean,
        default: true
    },
    hash: {
        type: String,
        index: true,
    }
}, {
    timestamps: true
});

const Document = mongoose.model("document", documentSchema);

export default Document;