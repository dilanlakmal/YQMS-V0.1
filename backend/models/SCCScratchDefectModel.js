import mongoose from "mongoose";

const sccScratchDefectSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    defectNameEng: { type: String, required: true },
    defectNameKhmer: { type: String, required: true },
    defectNameChinese: { type: String, default: "" } // Optional, defaults to empty string
  },
  {
    collection: "scc_scratch_defects", // Explicitly set collection name
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Optional: Add a unique compound index if names should also be unique
// sccScratchDefectSchema.index({ defectNameEng: 1 }, { unique: true });

export default function createSCCScratchDefectModel(connection) {
  return connection.model("SCCScratchDefect", sccScratchDefectSchema);
}
