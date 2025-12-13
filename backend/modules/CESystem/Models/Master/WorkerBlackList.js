import mongoose from "mongoose";

const workerBlackListSchema = new mongoose.Schema(
  {
    workerId: { type: String },
    workerName: { type: String },
    reason: { type: String },
    blacklistDate: { type: Date },
    status: { type: String, default: "Active" }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_workerblacklist ||
  connection.model("ce_workerblacklist", workerBlackListSchema, "ce_workerblacklist");

