import mongoose from "mongoose";

// Sub-schema for buyer-specific defect statuses
const statusByBuyerSchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true },
    defectStatus: [{ type: String }],
    isCommon: { type: String, required: true }
  },
  { _id: false }
);

// Sub-schema for defect decisions
const decisionSchema = new mongoose.Schema(
  {
    decisionEng: { type: String, required: true },
    decisionKhmer: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Critical", "Major", "Minor"]
    }
  },
  { _id: false }
);

// 🆕 NEW: Sub-schema for defect locations
const defectLocationSchema = new mongoose.Schema(
  {
    locationNo: { type: Number, required: true },
    garmentType: { type: String, required: true },
    locationName: { type: String, required: true }
  },
  { _id: false }
);

// Main schema for the defect list
const qaSectionsDefectListSchema = new mongoose.Schema(
  {
    code: { type: Number, required: true, unique: true },
    english: { type: String, required: true },
    khmer: { type: String, default: "" },
    chinese: { type: String, default: "" },
    defectLetter: { type: String, required: true },
    CategoryCode: { type: String, required: true }, // 🆕 NEW
    CategoryEngName: { type: String, required: true }, // 🆕 NEW
    isCommon: {
      type: String,
      required: true,
      enum: ["yes", "no"]
    },
    statusByBuyer: [statusByBuyerSchema],
    decisions: [decisionSchema],
    defectLocations: [defectLocationSchema] // 🆕 NEW
  },
  {
    collection: "qa_sections_defect_list",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsDefectList", qaSectionsDefectListSchema);
