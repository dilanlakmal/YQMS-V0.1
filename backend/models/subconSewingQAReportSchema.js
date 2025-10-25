import mongoose from "mongoose";

// Sub-schema for identifying the QC inspector
const qcReportItemSchema = new mongoose.Schema(
  {
    qcID: { type: String, required: true },
    qcName: { type: String, required: true }
  },
  { _id: false }
);

// Sub-schema for individual defects
const qaDefectItemSchema = new mongoose.Schema(
  {
    pcsNo: { type: Number, required: true },
    defectCode: { type: Number, required: true },
    defectName: { type: String, required: true },
    khmerName: { type: String, required: true },
    chineseName: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    images: [{ type: String }],
    decision: { type: String, required: true },
    standardStatus: { type: String, required: true }
  },
  { _id: false }
);

// Sub-schema for sections with a status and images
const statusImageSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    images: {
      type: [String],
      validate: [(val) => val.length <= 5, "Cannot upload more than 5 images."]
    }
  },
  { _id: false }
);

// Sub-schema for the data collected by each individual QC inspector
const qcDataItemSchema = new mongoose.Schema(
  {
    qcID: { type: String, required: true },
    qcName: { type: String, required: true },
    checkedQty: { type: Number, required: true, default: 20 },
    rejectPcs: { type: Number, required: true, default: 0 },
    totalDefectQty: { type: Number, required: true, default: 0 },
    defectList: [qaDefectItemSchema],
    spi: statusImageSchema,
    measurement: statusImageSchema,
    labelling: statusImageSchema
  },
  { _id: false }
);

// --- MAIN SCHEMA ---
const subconSewingQAReportSchema = new mongoose.Schema(
  {
    reportID: { type: String, required: true, unique: true },
    inspectionDate: { type: Date, required: true },
    reportType: {
      type: String,
      enum: ["QC1", "QC2"],
      required: true
    },
    factory: { type: String, required: true },
    factory_second_name: { type: String, default: "" },
    lineNo: { type: String, required: true },
    moNo: { type: String, required: true },
    color: { type: String, required: true },
    qcList: { type: [qcReportItemSchema], required: true },
    buyer: { type: String, required: true },
    preparedBy: {
      empId: { type: String, required: true },
      engName: { type: String, required: true }
    },

    // --- NEW DATA STRUCTURE ---
    qcData: [qcDataItemSchema],

    // --- NEW TOP-LEVEL TOTALS ---
    totalCheckedQty: { type: Number, required: true, default: 0 },
    totalRejectPcs: { type: Number, required: true, default: 0 },
    totalOverallDefectQty: { type: Number, required: true, default: 0 },

    additionalComments: {
      type: String,
      maxLength: [500, "Comments cannot exceed 500 characters."],
      default: ""
    }
  },
  {
    collection: "subcon_sewing_qa_reports",
    timestamps: true
  }
);

// Compound index to ensure one report per day for the same set of parameters
subconSewingQAReportSchema.index(
  {
    inspectionDate: 1,
    reportType: 1,
    factory: 1,
    lineNo: 1,
    moNo: 1,
    color: 1
  },
  { unique: true, message: "A report with these details already exists." }
);

export default (connection) =>
  connection.model("SubconSewingQAReport", subconSewingQAReportSchema);
