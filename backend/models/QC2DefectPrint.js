import mongoose from "mongoose";

const qc2DefectPrintSchema = new mongoose.Schema(
  {
    factory: {
      type: String,
      required: true,
    },
    package_no: {
      type: String,
      required: true,
    },
    moNo: {
      type: String,
      required: true,
    },
    custStyle: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    repair: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
    count_print: {
      type: Number,
      required: true,
    },
    defects: [
      {
        defectName: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
      },
    ],
    print_date: {
      type: Date,
      default: Date.now,
    },
    print_time: {
      type: String,
      required: true,
    },
    defect_id: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default (connection) =>
  connection.model("QC2DefectPrint", qc2DefectPrintSchema, "qc2_defectprint");
