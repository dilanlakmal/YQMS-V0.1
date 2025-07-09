// --- FIX #1: NEW SCHEMA FOR STANDARD DEFECTS ---
import mongoose from "mongoose";

const decisionSchema = new mongoose.Schema(
  {
    decisionEng: { type: String, required: true },
    decisionKhmer: { type: String, default: "N/A" },
    status: {
      type: String,
      enum: ["Minor", "Major", "Critical"],
      required: true
    }
  },
  { _id: false }
);

const qaStandardDefectsSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: true,
      unique: true
    },
    english: {
      type: String,
      required: true
    },
    khmer: {
      type: String,
      required: true
    },
    chinese: {
      type: String,
      default: ""
    },
    decisions: {
      type: [decisionSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one decision is required."]
    }
  },
  {
    collection: "qa_standard_defects",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QAStandardDefectsModel", qaStandardDefectsSchema);
