// import mongoose from "mongoose";

// const standardSpecificationSchema = new mongoose.Schema(
//   {
//     type: { type: String, enum: ["first", "afterHat"], required: true },
//     method: { type: String, required: true, default: "Heat Transfer" },
//     timeSec: { type: Number, default: null },
//     tempC: { type: Number, default: null },
//     tempOffsetMinus: { type: Number, default: 0 },
//     tempOffsetPlus: { type: Number, default: 0 },
//     pressure: { type: Number, default: null },
//     status: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
//     remarks: { type: String, default: "NA" } // New remarks field for each spec
//   },
//   { _id: false }
// );

// const htFirstOutputSchema = new mongoose.Schema(
//   {
//     inspectionDate: { type: String, required: true }, // Format: MM/DD/YYYY
//     moNo: { type: String, required: true },
//     buyer: { type: String, required: false },
//     buyerStyle: { type: String, required: false },
//     color: { type: String, required: true },
//     standardSpecification: [standardSpecificationSchema],
//     referenceSampleImage: { type: String, default: null },
//     afterWashImage: { type: String, default: null },
//     remarks: { type: String, maxLength: 250, default: "NA" }, // Main remarks
//     emp_id: { type: String, required: true },
//     emp_kh_name: { type: String, default: "N/A" },
//     emp_eng_name: { type: String, default: "N/A" },
//     emp_dept_name: { type: String, default: "N/A" },
//     emp_sect_name: { type: String, default: "N/A" },
//     emp_job_title: { type: String, default: "N/A" },
//     inspectionTime: { type: String, required: true } // Format: HH:MM:SS
//   },
//   {
//     timestamps: true,
//     collection: "ht_first_outputs" // Ensure collection name is explicit
//   }
// );

// htFirstOutputSchema.index(
//   { moNo: 1, color: 1, inspectionDate: 1 },
//   { unique: true }
// );

// export default (connection) =>
//   connection.model("HTFirstOutput", htFirstOutputSchema);

import mongoose from "mongoose";

const standardSpecificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["first", "2nd heat"], required: true }, // Updated enum
    method: { type: String, required: true, default: "Heat Transfer" },
    timeSec: { type: Number, default: null },
    tempC: { type: Number, default: null },
    tempOffsetMinus: { type: Number, default: 0 },
    tempOffsetPlus: { type: Number, default: 0 },
    pressure: { type: Number, default: null },
    status: { type: String, enum: ["Pass", "Reject"], default: "Pass" },
    remarks: { type: String, default: "NA" }
  },
  { _id: false }
);

const htFirstOutputSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, required: true },
    machineNo: { type: String, required: true },
    moNo: { type: String, required: true },
    buyer: { type: String, required: false },
    buyerStyle: { type: String, required: false },
    color: { type: String, required: true },
    standardSpecification: [standardSpecificationSchema], // Array of 1 or 2 specs
    referenceSampleImage: { type: String, default: null },
    afterWashImage: { type: String, default: null },
    remarks: { type: String, maxLength: 250, default: "NA" },
    emp_id: { type: String, required: true },
    emp_kh_name: { type: String, default: "N/A" },
    emp_eng_name: { type: String, default: "N/A" },
    emp_dept_name: { type: String, default: "N/A" },
    emp_sect_name: { type: String, default: "N/A" },
    emp_job_title: { type: String, default: "N/A" },
    inspectionTime: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: "ht_first_outputs"
  }
);

htFirstOutputSchema.index(
  { moNo: 1, color: 1, inspectionDate: 1, machineNo: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model("HTFirstOutput", htFirstOutputSchema);
