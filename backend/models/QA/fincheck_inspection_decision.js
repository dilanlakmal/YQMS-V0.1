import mongoose from "mongoose";

const FincheckInspectionDecisionSchema = new mongoose.Schema(
  {
    reportId: {
      type: Number,
      required: true,
      index: true
    },
    // Reference back to the original report
    reportRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FincheckInspectionReports"
    },

    // Approval Leader Details
    approvalEmpId: { type: String, required: true },
    approvalEmpName: { type: String, required: true },

    // Decision Details
    decisionStatus: {
      type: String,
      enum: ["Approved", "Rework", "Rejected"],
      required: true
    },

    // Comments
    systemGeneratedComment: { type: String, default: "" },
    additionalComment: { type: String, default: "" },

    // Audio Record
    hasAudio: { type: Boolean, default: false },
    audioUrl: { type: String, default: "" }, // Relative path: /storage/...

    approvalDate: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: "fincheck_inspection_decision"
  }
);

export default (connection) =>
  connection.model(
    "FincheckInspectionDecision",
    FincheckInspectionDecisionSchema
  );
