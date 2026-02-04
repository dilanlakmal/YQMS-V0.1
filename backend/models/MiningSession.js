import mongoose from "mongoose";
import { ymProdConnection } from "../controller/MongoDB/dbConnectionController.js";


const candidateTermSchema = new mongoose.Schema({
    source: { type: String, required: true },
    target: { type: String, required: true },
    frequency: { type: Number, default: 1 },
    sources: [{ type: String }], // e.g. ["Page 1", "Page 2"]
    avgConfidence: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    context: { type: String }, // Usage sample
    alternatives: [{ type: String }]
}, { _id: false }); // subdocument, no need for separate ID unless useful

const miningSessionSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['uploading', 'ingesting', 'mining', 'completed', 'failed'],
        default: 'uploading'
    },
    originalFilename: String,

    // Metadata
    sourceLang: String,
    targetLang: String,
    domain: String,

    // Progress Tracking
    totalPages: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    processedChunks: { type: Number, default: 0 },

    // Core terms found in Primer phase (for context)
    coreTerms: [String],

    // The Map-Reduce results
    candidateTerms: [candidateTermSchema],

    errorMessage: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
miningSessionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export const MiningSession = ymProdConnection.model("MiningSession", miningSessionSchema);
