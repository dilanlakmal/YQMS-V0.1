import mongoose from "mongoose";

const DefectDetailsSchema = new mongoose.Schema(
  {
    Defect_code: Number,
    Defect_name: String,
    Qty: Number
  },
  { _id: false }
);

const DefectDataSchema = new mongoose.Schema(
  {
    Line_no: String,
    MONo: String,
    Color: String,
    Size: String,
    Defect_qty: Number,
    DefectDetails: [DefectDetailsSchema]
  },
  { _id: false }
);

const OutputDataSchema = new mongoose.Schema(
  {
    Line_no: String,
    MONo: String,
    Color: String,
    Size: String,
    Qty: Number
  },
  { _id: false }
);

const OutputDataSummarySchema = new mongoose.Schema(
  {
    Line: String,
    MONo: String,
    Qty: Number
  },
  { _id: false }
);

const DefectDataSummarySchema = new mongoose.Schema(
  {
    Line_no: String,
    MONo: String,
    Defect_Qty: Number,
    Defect_Details: [DefectDetailsSchema]
  },
  { _id: false }
);

const QCWorkersSchema = new mongoose.Schema(
  {
    Inspection_date: { type: Date, required: true },
    QC_ID: String,
    report_type: { type: String, required: true },
    Seq_No: [Number], // [38], [39], or [38,39]
    TotalOutput: Number,
    TotalDefect: Number,
    Output_data: [OutputDataSchema],
    Output_data_summary: [OutputDataSummarySchema],
    Defect_data: [DefectDataSchema],
    Defect_data_summary: [DefectDataSummarySchema]
  },
  { timestamps: true }
);

export default (connection) =>
  connection.model("qc_workers", QCWorkersSchema, "qc_workers");
