import mongoose from "mongoose";

const qc2DefectSchema = new mongoose.Schema(
  {
    code: { type: Number, required: true, unique: true },
    defectLetter: { type: String, required: true, uppercase: true },
    shortEng: { type: String, required: true },
    english: { type: String, required: true },
    khmer: { type: String, required: true },
    chinese: { type: String, default: "" },
    image: { type: String, default: "" },
    repair: { type: String, required: true },
    categoryEnglish: { type: String, required: true },
    categoryKhmer: { type: String, required: true },
    categoryChinese: { type: String, required: true },
    type: { type: Number, required: true },
    isCommon: { type: String, default: "no" }
  },
  {
    collection: "qc2_defects", // Explicitly set collection name
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Optional: Add a unique index on the English name to prevent duplicates
qc2DefectSchema.index({ english: 1 }, { unique: true });

export default function createQC2DefectsModel(connection) {
  // This pattern allows you to pass a specific database connection
  return connection.model("QC2Defects", qc2DefectSchema);
}
