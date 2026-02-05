/**
 * DocumentPage.js
 * MongoDB model for extracted document pages
 * Stores per-page text content with metrics
 */

import mongoose from "mongoose";

const documentPageSchema = new mongoose.Schema({
    // Link to parent job
    jobId: {
        type: String,
        required: true,
        index: true
    },

    // Page identification
    pageNumber: {
        type: Number,
        required: true,
        min: 1
    },

    // Extracted content
    rawText: {
        type: String
    },
    cleanText: {
        type: String
    },

    // Metrics
    charCount: {
        type: Number,
        default: 0
    },
    tokenEstimate: {
        type: Number,
        default: 0
    },
    wordCount: {
        type: Number,
        default: 0
    },
    lineCount: {
        type: Number,
        default: 0
    },

    // Layout info (from Azure DI)
    hasTable: {
        type: Boolean,
        default: false
    },
    tableCount: {
        type: Number,
        default: 0
    },
    paragraphCount: {
        type: Number,
        default: 0
    },

    // Visual Layout Data (for Azure DI Studio style preview)
    width: Number,
    height: Number,
    unit: String,
    lines: [{
        content: String,
        polygon: [Number] // [x1, y1, x2, y2, x3, y3, x4, y4]
    }],

    // Selection tracking for mining
    isSelected: {
        type: Boolean,
        default: true
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

// Compound index for efficient page retrieval
documentPageSchema.index({ jobId: 1, pageNumber: 1 }, { unique: true });

const createDocumentPageModel = (connection) => {
    return connection.model("DocumentPage", documentPageSchema);
};

export default createDocumentPageModel;
