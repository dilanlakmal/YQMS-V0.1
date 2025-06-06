// import mongoose from "mongoose";

// const measurementValueSchema = new mongoose.Schema(
//   {
//     partNo: { type: Number, required: true },
//     value: { type: String, required: true }
//   },
//   { _id: false }
// );

// const measurementDataSchema = new mongoose.Schema(
//   {
//     partType: { type: String, enum: ["T", "M", "B"], required: true },
//     measurements: [measurementValueSchema]
//   },
//   { _id: false }
// );

// const rejectedMeasurementSchema = new mongoose.Schema(
//   {
//     partNo: { type: String, required: true }, // e.g., T1, M3
//     value: { type: String, required: true }
//   },
//   { _id: false }
// );

// const defectDetailSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     name_kh: { type: String, required: true },
//     count: { type: Number, required: true, min: 1 }
//   },
//   { _id: false }
// );

// const pairingDataSchema = new mongoose.Schema(
//   {
//     inspection_rep_name: { type: String, required: true },
//     operator_emp_id: { type: String, required: true },
//     operator_eng_name: { type: String, required: true },
//     operator_kh_name: { type: String, required: true },
//     operator_job_title: { type: String, required: true },
//     operator_dept_name: { type: String, required: true },
//     operator_sect_name: { type: String, required: true },
//     accessoryComplete: { type: String, enum: ["Yes", "No"], required: true },
//     accessoryRemark: { type: String, default: "" },
//     measurementData: [measurementDataSchema],
//     measurementSummary: {
//       totalRejects: { type: Number, required: true, default: 0 },
//       positiveRejects: [rejectedMeasurementSchema],
//       negativeRejects: [rejectedMeasurementSchema]
//     },
//     defectSummary: {
//       totalDefectQty: { type: Number, required: true, default: 0 },
//       defects: [defectDetailSchema]
//     },
//     totalSummary: {
//       totalParts: { type: Number, required: true },
//       t_qty: { type: Number, required: true },
//       m_qty: { type: Number, required: true },
//       b_qty: { type: Number, required: true },
//       totalRejects: { type: Number, required: true },
//       totalPass: { type: Number, required: true },
//       passRate: { type: String, required: true }
//     }
//   },
//   { _id: false }
// );

// const qcRovingPairingSchema = new mongoose.Schema(
//   {
//     pairing_id: { type: Number, required: true, unique: true },
//     report_name: {
//       type: String,
//       required: true,
//       default: "QC Inline Roving Pairing"
//     },
//     inspection_date: { type: String, required: true },
//     moNo: { type: String, required: true },
//     lineNo: { type: String, required: true },
//     emp_id: { type: String, required: true },
//     eng_name: { type: String, required: true },
//     operationNo: { type: Number, required: true, default: 7 },
//     operationName: { type: String, required: true, default: "Pairing" },
//     operationName_kh: { type: String, required: true },
//     pairingData: [pairingDataSchema]
//   },
//   {
//     collection: "qc_roving_pairing",
//     timestamps: true
//   }
// );

// export default (connection) =>
//   connection.model("QCRovingPairing", qcRovingPairingSchema);

import mongoose from "mongoose";

const measurementValueSchema = new mongoose.Schema(
  {
    partNo: { type: Number, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const measurementDataSchema = new mongoose.Schema(
  {
    partType: { type: String, enum: ["T", "M", "B"], required: true },
    measurements: [measurementValueSchema]
  },
  { _id: false }
);

// Schema for a single defect entry
const singleDefectEntrySchema = new mongoose.Schema(
  {
    defectNameEng: { type: String, required: true },
    defectNameKhmer: { type: String, required: true },
    count: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

// Schema for all defects on a specific part (e.g., T-1, M-3)
const partDefectsSchema = new mongoose.Schema(
  {
    partNo: { type: Number, required: true },
    defects: [singleDefectEntrySchema]
  },
  { _id: false }
);

// Schema to hold defects grouped by part type (T, M, B)
const defectDetailSchema = new mongoose.Schema(
  {
    partType: { type: String, enum: ["T", "M", "B"], required: true },
    defectsForPart: [partDefectsSchema]
  },
  { _id: false }
);

const pairingDataSchema = new mongoose.Schema(
  {
    inspection_rep_name: { type: String, required: true },
    operator_emp_id: { type: String, required: true },
    operator_eng_name: { type: String, required: true },
    operator_kh_name: { type: String, required: true },
    operator_job_title: { type: String, required: true },
    operator_dept_name: { type: String, required: true },
    operator_sect_name: { type: String, required: true },
    accessoryComplete: { type: String, enum: ["Yes", "No"], required: true },
    accessoryRemark: { type: String, default: "" },

    measurementData: [measurementDataSchema],

    defectSummary: {
      totalRejectedParts: { type: Number, required: true, default: 0 },
      totalDefectQty: { type: Number, required: true, default: 0 },
      defectDetails: [defectDetailSchema] // This holds the detailed table data
    },

    totalSummary: {
      totalParts: { type: Number, required: true },
      t_qty: { type: Number, required: true },
      m_qty: { type: Number, required: true },
      b_qty: { type: Number, required: true },
      totalRejects: { type: Number, required: true },
      totalPass: { type: Number, required: true },
      passRate: { type: String, required: true }
    }
  },
  { _id: false }
);

const qcRovingPairingSchema = new mongoose.Schema(
  {
    pairing_id: { type: Number, required: true, unique: true },
    report_name: {
      type: String,
      required: true,
      default: "QC Inline Roving Pairing"
    },
    inspection_date: { type: String, required: true },
    moNo: { type: String, required: true },
    lineNo: { type: String, required: true },
    emp_id: { type: String, required: true },
    eng_name: { type: String, required: true },
    operationNo: { type: Number, required: true, default: 7 },
    operationName: { type: String, required: true, default: "Pairing" },
    operationName_kh: { type: String, required: true },
    pairingData: [pairingDataSchema]
  },
  {
    collection: "qc_roving_pairing",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QCRovingPairing", qcRovingPairingSchema);
