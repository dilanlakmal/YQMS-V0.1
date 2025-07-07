import mongoose from "mongoose";

const DefectDetailSchema = new mongoose.Schema(
  {
    pcsNo: { type: Number, required: true },
    defectCode: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    defectNameKh: { type: String },
    defectNameCh: { type: String },
    qty: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ["Critical", "Major", "Minor"], required: true }
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
    grade: { type: String, enum: ["A", "B", "C", "D"], required: true }
  },
  {
    collection: "qc_accuracy_reports",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QCAccuracyReportModel", qcAccuracyReportSchema);
