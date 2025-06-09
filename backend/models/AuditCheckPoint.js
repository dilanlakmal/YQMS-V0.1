import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    mainTopicEng: { type: String, required: true, trim: true },
    mainTopicKhmer: { type: String, required: true, trim: true },
    mainTopicChinese: { type: String, required: true, trim: true },
    no: { type: String, required: true, trim: true }, // Point number like "1.05"
    pointTitleEng: { type: String, required: true, trim: true },
    pointTitleKhmer: { type: String, required: true, trim: true },
    pointTitleChinese: { type: String, required: true, trim: true },
    pointDescriptionEng: { type: String, required: true, trim: true },
    pointDescriptionKhmer: { type: String, required: true, trim: true },
    pointDescriptionChinese: { type: String, required: true, trim: true },
    levelValue: { type: Number, required: true, min: 1, max: 4 },
    mustHave: { type: Boolean, required: true, default: false }
    // Unique identifier for each requirement if needed for direct updates/deletes
    // requirementId: { type: mongoose.Schema.Types.ObjectId, auto: true }
  },
  { _id: true }
); // Ensure each requirement has its own _id

const auditCheckPointSchema = new mongoose.Schema(
  {
    mainTitle: { type: String, required: true, unique: true, trim: true }, // e.g., "QMS", "Fabric"
    mainTitleNo: { type: Number, required: true, unique: true },
    sectionTitleEng: { type: String, required: true, trim: true },
    sectionTitleKhmer: { type: String, required: true, trim: true },
    sectionTitleChinese: { type: String, required: true, trim: true },
    requirements: [requirementSchema]
    // active: { type: Boolean, default: true } // Optional: to mark a whole section as active/inactive
  },
  {
    collection: "audit_check_points", // Explicitly set collection name
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Ensure uniqueness for mainTitle and mainTitleNo together if needed,
// though unique:true on each should suffice for individual uniqueness.
// auditCheckPointSchema.index({ mainTitle: 1, mainTitleNo: 1 }, { unique: true });

export default function createAuditCheckPointModel(connection) {
  return connection.model("AuditCheckPoint", auditCheckPointSchema);
}
