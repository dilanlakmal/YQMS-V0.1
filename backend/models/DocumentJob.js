/**
 * DocumentJob.js
 * MongoDB model for document extraction jobs
 * Tracks status: uploaded → extracting → extracted → failed
 */

import mongoose from "mongoose";

const documentJobSchema = new mongoose.Schema({
    // Unique job identifier
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Original file info
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ["pdf", "docx", "doc", "png", "jpg", "jpeg", "tiff", "bmp", "txt"],
        required: true
    },
    fileSizeBytes: {
        type: Number,
        required: true
    },

    // Processing status
    status: {
        type: String,
        enum: ["uploaded", "extracting", "extracted", "chunking", "mining", "completed", "failed"],
        default: "uploaded",
        index: true
    },

    // Azure DI operation details
    azureOperationId: {
        type: String,
        default: null
    },
    extractionMethod: {
        type: String,
        enum: ["azure-di", "pdf-parse", "mammoth", "plaintext"],
        default: null
    },

    // Results summary
    pageCount: {
        type: Number,
        default: 0
    },
    totalCharacters: {
        type: Number,
        default: 0
    },
    totalTokenEstimate: {
        type: Number,
        default: 0
    },

    // Mining context
    sourceLang: String,
    targetLang: String,
    domain: String,
    project: String,

    // Error tracking
    errorMessage: {
        type: String,
        default: null
    },

    // Timestamps
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    extractionStartedAt: Date,
    extractionCompletedAt: Date,
    miningStartedAt: Date,
    miningCompletedAt: Date,

    // Auto-cleanup (24 hours TTL)
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
}, {
    timestamps: true
});

// Query indexes
documentJobSchema.index({ status: 1, createdAt: -1 });
documentJobSchema.index({ uploadedAt: -1 });

const createDocumentJobModel = (connection) => {
    return connection.model("DocumentJob", documentJobSchema);
};

export default createDocumentJobModel;
