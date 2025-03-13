// Schema for qc2_reworks with separate header fields
import mongoose from "mongoose";

const qc2ReworksSchema = new mongoose.Schema(
  {
    package_no: { type: Number, required: true }, // extracted from bundleData.package_no
    //bundleNo: { type: String, required: true },
    moNo: { type: String, required: true },
    custStyle: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    lineNo: { type: String, required: true },
    department: { type: String, required: true },
    reworkGarments: [
      {
        defectName: { type: String, required: true },
        count: { type: Number, required: true },
        time: { type: String, required: true }, // "HH:MM:SS"
      },
    ],
    emp_id_inspection: { type: String, required: true },
    eng_name_inspection: { type: String, required: true },
    kh_name_inspection: { type: String, required: true },
    job_title_inspection: { type: String, required: true },
    dept_name_inspection: { type: String, required: true },
    sect_name_inspection: { type: String, required: true },
    bundle_id: { type: String, required: true }, // Add this line
    bundle_random_id: { type: String, required: true }, // Add this line
  },
  { collection: "qc2_reworks" }
);

export default (connection) =>
  connection.model("qc2_reworks", qc2ReworksSchema);
