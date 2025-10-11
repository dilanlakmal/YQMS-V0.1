import mongoose from "mongoose";

const qcReportItemSchema = new mongoose.Schema(
  {
    qcID: { type: String, required: true },
    qcName: { type: String, required: true }
  },
  { _id: false }
);

// Sub-schema for individual defects within the report
const qaDefectItemSchema = new mongoose.Schema(
  {
    pcsNo: { type: Number, required: true }, // Which garment piece this defect is on
    defectCode: { type: Number, required: true },
    defectName: { type: String, required: true }, // English name
    khmerName: { type: String, required: true },
    chineseName: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    images: [{ type: String }], // Array of image URLs
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
    //qcId: { type: String, required: true },
    buyer: { type: String, required: true },
    preparedBy: {
      empId: { type: String, required: true },
      engName: { type: String, required: true }
    },
    checkedQty: { type: Number, required: true }, // Renamed from sampleSize
    rejectPcs: { type: Number, required: true, default: 0 },
    totalDefectQty: { type: Number, required: true, default: 0 },
    defectList: [qaDefectItemSchema], // Array of defects
    spi: statusImageSchema,
    measurement: statusImageSchema,
    labelling: statusImageSchema,
    additionalComments: {
      type: String,
      maxLength: [500, "Comments cannot exceed 500 characters."],
      default: ""
    }
  },
  {
    collection: "subcon_sewing_qa_reports",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Create a compound index to ensure uniqueness for the key fields
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
