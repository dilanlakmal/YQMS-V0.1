/**
 * DocumentChunk.js
 * MongoDB model for token-safe text chunks
 * Tracks processing status for sequential LLM mining
 */

import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema({
    // Link to parent job
    jobId: {
        type: String,
        required: true,
        index: true
    },

    // Chunk identification
    chunkIndex: {
        type: Number,
        required: true,
        min: 0
    },

    // Content
    text: {
        type: String,
        required: true
    },

    // Metrics
    charCount: {
        type: Number,
        required: true
    },
    tokenEstimate: {
        type: Number,
        required: true
    },

    // Source tracking
    pageRange: [{
        type: Number
    }],
    startPage: {
        type: Number,
        required: true
    },
    endPage: {
        type: Number,
        required: true
    },

    // Processing status
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        index: true
    },

    // Mining results (populated after processing)
    termsExtracted: {
        type: Number,
        default: 0
    },
    processingTimeMs: {
        type: Number,
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    },

    // Timestamps
    processedAt: {
        type: Date,
        default: null
    },

    // Auto-cleanup (same TTL as parent job)
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
}, {
    timestamps: true
});

// Compound index for efficient chunk retrieval
documentChunkSchema.index({ jobId: 1, chunkIndex: 1 }, { unique: true });

// Index for finding unprocessed chunks
documentChunkSchema.index({ jobId: 1, status: 1 });

const createDocumentChunkModel = (connection) => {
    return connection.model("DocumentChunk", documentChunkSchema);
};

export default createDocumentChunkModel;
