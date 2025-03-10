import mongoose from "mongoose";

const qc2DefectPrintSchema = new mongoose.Schema(
  {
    factory: {
      type: String,
      required: true,
    },
    package_no: {
      type: Number,
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
    emp_id_inspection: {
      type: String,
      required: true,
    },
    eng_name_inspection: {
      type: String,
      required: true,
    },
    kh_name_inspection: {
      type: String,
      required: true,
    },
    job_title_inspection: {
      type: String,
      required: true,
    },
    dept_name_inspection: {
      type: String,
      required: true,
    },
    sect_name_inspection: {
      type: String,
      required: true,
    },
    bundle_id: { type: String, required: true }, // Add this line
    bundle_random_id: { type: String, required: true }, // Add this line
  },
  {
    timestamps: true,
  }
);

export default (connection) =>
  connection.model("QC2DefectPrint", qc2DefectPrintSchema, "qc2_defectprint");
