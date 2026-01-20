import mongoose from "mongoose";

const miningHistorySchema = new mongoose.Schema({
    batchId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    sourceResource: {
        type: String, // Filename or "Manual Entry"
        required: true
    },
    miningType: {
        type: String,
        enum: ["single", "parallel", "manual"],
        required: true
    },
    sourceLang: {
        type: String,
        required: true,
        lowercase: true
    },
    targetLang: {
        type: String,
        required: true,
        lowercase: true
    },
    domain: {
        type: String,
        default: "Garment Industry"
    },
    termCount: {
        type: Number,
        default: 0
    },
    stats: {
        verifiedCount: { type: Number, default: 0 }
    },
    createdBy: {
        reviewerName: { type: String, default: null }
    },
    sourceUrl: String,
    targetUrl: String
}, {
    timestamps: true
});

// Index for listing history in reverse chronological order
miningHistorySchema.index({ createdAt: -1 });

const createMiningHistoryModel = (connection) => {
    return connection.model("MiningHistory", miningHistorySchema);
};

export default createMiningHistoryModel;
