import mongoose from "mongoose";

const DefectSubSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    defectNameEng: { type: String, required: true },
    defectNameKhmer: { type: String },
    defectNameChi: { type: String }
  },
  { timestamps: true }
);

const SupplierIssuesDefectSchema = new mongoose.Schema(
  {
    factoryType: {
      type: String,
      required: true,
      enum: ["Embellishment", "Washing"],
      unique: true
    },
    factoryList: {
      type: [String],
      required: true
    },
    defectList: [DefectSubSchema]
  },
  {
    collection: "supplier_issues_defects",
    timestamps: true
  }
);

// This exports a function that takes a mongoose connection and returns the model
export default (connection) =>
  connection.model("SupplierIssuesDefect", SupplierIssuesDefectSchema);