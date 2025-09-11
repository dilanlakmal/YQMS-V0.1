import mongoose from "mongoose";

// Sub-schema for individual defects within the report
const qaDefectItemSchema = new mongoose.Schema(
  {
    defectCode: { type: Number, required: true },
    defectName: { type: String, required: true }, // English name
    khmerName: { type: String, required: true },
    chineseName: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    images: [{ type: String }] // Array of image URLs
  },
  { _id: false }
);

const subconSewingQAReportSchema = new mongoose.Schema(
  {
    reportID: { type: String, required: true, unique: true },
    inspectionDate: { type: Date, required: true },
    factory: { type: String, required: true },
    factory_second_name: { type: String, default: "" },
    lineNo: { type: String, required: true },
    moNo: { type: String, required: true },
    color: { type: String, required: true },
    buyer: { type: String, required: true },
    preparedBy: {
      empId: { type: String, required: true },
      engName: { type: String, required: true }
    },
    sampleSize: { type: Number, required: true },
    totalDefectQty: { type: Number, required: true },
    defectList: [qaDefectItemSchema], // Array of defects
    comments: {
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

export default (connection) =>
  connection.model("SubconSewingQAReport", subconSewingQAReportSchema);
