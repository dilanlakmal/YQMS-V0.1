import mongoose from "mongoose";

const standardSpecificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["first", "afterHat"], required: true },
    method: { type: String, required: true, default: "Fusing" },
    timeSec: { type: Number, default: null },
    tempC: { type: Number, default: null },
    tempOffsetMinus: { type: Number, default: 0 },
    tempOffsetPlus: { type: Number, default: 0 },
    pressure: { type: String, default: null },
    status: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    remarks: { type: String, default: "NA" } // New remarks field for each spec
  },
  { _id: false }
);

const fuFirstOutputSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true }, // Format: MM/DD/YYYY
    moNo: { type: String, required: true },
    buyer: { type: String, required: false },
    buyerStyle: { type: String, required: false },
    color: { type: String, required: true },
    standardSpecification: [standardSpecificationSchema],
    referenceSampleImage: { type: String, default: null },
    afterWashImage: { type: String, default: null },
    remarks: { type: String, maxLength: 250, default: "NA" }, // Main remarks
    emp_id: { type: String, required: true },
    emp_kh_name: { type: String, default: "N/A" },
    emp_eng_name: { type: String, default: "N/A" },
    emp_dept_name: { type: String, default: "N/A" },
    emp_sect_name: { type: String, default: "N/A" },
    emp_job_title: { type: String, default: "N/A" },
    inspectionTime: { type: String, required: true } // Format: HH:MM:SS
  },
  {
    timestamps: true,
    collection: "fu_first_outputs" // Ensure collection name is explicit
  }
);

fuFirstOutputSchema.index(
  { moNo: 1, color: 1, inspectionDate: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model("FUFirstOutput", fuFirstOutputSchema);
