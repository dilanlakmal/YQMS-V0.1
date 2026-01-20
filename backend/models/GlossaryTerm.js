
import mongoose from "mongoose";

const glossaryTermSchema = new mongoose.Schema({
    source: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    target: {
        type: String,
        required: true,
        trim: true
    },
    sourceLang: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    targetLang: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    domain: {
        type: String,
        default: "Garment Industry",
        trim: true,
        index: true
    },
    project: {
        type: String,
        trim: true,
        index: true
    },
    // Updated: Structured createdBy object
    createdBy: {
        agent: {
            type: String,
            enum: ["agent-parallel-extraction", "agent-single-extraction", "None"],
            default: "None"
        },
        reviewerName: {
            type: String,
            default: null
        }
    },
    // Updated: Simplified enum (removed "pending", "rejected")
    verificationStatus: {
        type: String,
        enum: ["verified", "unverified"],
        default: "unverified",
        index: true
    },
    // Moved to root level from metadata
    confidenceScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    originalConfidenceScore: {
        type: Number,
        min: 0,
        max: 1,
        default: null
    },
    metadata: {
        sourceFile: String,
        context: String
    },
    miningBatchId: {
        type: String,
        index: true
    }
}, {
    timestamps: true // Provides createdAt and updatedAt
});

// ========== INDEXES ==========

// Primary unique constraint: prevent duplicate source terms per language pair
glossaryTermSchema.index(
    { source: 1, sourceLang: 1, targetLang: 1 },
    { unique: true, name: 'unique_source_langpair' }
);

// Query optimization: fetch verified terms for TSV generation
glossaryTermSchema.index({ sourceLang: 1, targetLang: 1, verificationStatus: 1 });

// Query optimization: fetch by domain + language pair + status
glossaryTermSchema.index({ sourceLang: 1, targetLang: 1, domain: 1, verificationStatus: 1 });

// Query optimization: fetch unverified terms for review (sorted by date)
glossaryTermSchema.index({ verificationStatus: 1, createdAt: -1 });

// Query optimization: filter by agent type
glossaryTermSchema.index({ 'createdBy.agent': 1 });

// Query optimization: filter by confidence
glossaryTermSchema.index({ confidenceScore: 1 });

// Text search index for source/target searching
glossaryTermSchema.index({ source: 'text', target: 'text' });

// Factory function pattern - accepts a connection
const createGlossaryTermModel = (connection) => {
    return connection.model("GlossaryTerm", glossaryTermSchema);
};

export default createGlossaryTermModel;
