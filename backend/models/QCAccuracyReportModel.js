import mongoose from "mongoose";

const DefectDetailSchema = new mongoose.Schema(
  {
    pcsNo: { type: Number, required: true },
    defectCode: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    defectNameKh: { type: String },
    defectNameCh: { type: String },
    qty: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ["Critical", "Major", "Minor"],
      required: true
    },
    // --- FIX #1: Add imageUrl to each defect ---
    imageUrl: { type: String, default: "" }
  },
  { _id: false }
);

// --- FIX #1: Define schema for additional images ---
const ExtraImageSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true },
    imageUrls: [{ type: String }]
  },
  { _id: false }
);

const qcAccuracyReportSchema = new mongoose.Schema(
  {
    reportDate: { type: Date, required: true },
    qcInspector: {
      empId: { type: String, required: true },
      engName: { type: String, required: true }
    },
    scannedQc: {
      empId: { type: String, required: true },
      engName: { type: String, required: true }
    },
    reportType: {
      type: String,
      enum: ["First Output", "Inline Sewing", "Inline Finishing"],
      required: true
    },
    moNo: { type: String, required: true },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    lineNo: { type: String, required: true }, // Saved as string, can be 'NA'
    tableNo: { type: String, required: true }, // Saved as string, can be 'NA'
    totalCheckedQty: { type: Number, required: true },
    aql: {
      codeLetter: { type: String },
      sampleSize: { type: Number },
      ac: { type: Number },
      re: { type: Number }
    },
    defects: [DefectDetailSchema],
    totalDefectPoints: { type: Number, required: true },
    qcAccuracy: { type: Number, required: true },
    grade: { type: String, enum: ["A", "B", "C", "D"], required: true },
    result: { type: String, enum: ["Pass", "Fail"], required: true },
    // --- FIX #1: Add new optional fields ---
    remarks: { type: String, maxLength: 250, default: "" },
    extraImages: [ExtraImageSchema]
  },
  {
    collection: "qc_accuracy_reports",
    timestamps: true
  }
);

// --- FIX: ADD PRE-SAVE HOOK TO ADJUST TIMESTAMPS ---
qcAccuracyReportSchema.pre("save", function (next) {
  const sevenHours = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

  // 'this' refers to the document being saved
  const now = new Date();

  // Adjust the reportDate sent from the client
  // We check if it's modified to avoid re-adjusting on every update
  if (this.isModified("reportDate") || this.isNew) {
    this.reportDate = new Date(this.reportDate.getTime() + sevenHours);
  }

  // Adjust the 'updatedAt' timestamp
  // Mongoose automatically sets this, but we override it with the adjusted time
  this.updatedAt = new Date(now.getTime() + sevenHours);

  // Adjust the 'createdAt' timestamp only when the document is new
  if (this.isNew) {
    this.createdAt = new Date(now.getTime() + sevenHours);
  }

  next(); // Continue with the save operation
});
// --- END OF FIX ---

export default (connection) =>
  connection.model("QCAccuracyReportModel", qcAccuracyReportSchema);
