import mongoose from "mongoose";

const defectListItemSchema = new mongoose.Schema(
  {
    defectCode: { type: Number, required: true },
    displayCode: { type: Number, required: true },
    defectName: { type: String, required: true }, // English name only
    qty: { type: Number, required: true, min: 1 }
  },
  { _id: false }
); // _id: false prevents MongoDB from creating an _id for subdocuments

const subconSewingQc1ReportSchema = new mongoose.Schema(
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
    checkedQty: { type: Number, required: true },
    totalDefectQty: { type: Number, required: true },
    defectList: [defectListItemSchema] // Array of defects
  },
  {
    collection: "subcon_sewing_qc1_reports",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("SubconSewingQc1Report", subconSewingQc1ReportSchema);
