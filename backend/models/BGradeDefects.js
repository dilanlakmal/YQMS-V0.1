import mongoose from "mongoose";

const BGradeDefectSchema = new mongoose.Schema({
  defectName: { type: String, required: true },
  defectCount: { type: Number, required: true },
  garmentNumber: { type: String, required: true },
  repairGroup: { type: String },
  status: { type: String, default: "B-Grade" },
  repair_date: { type: String },
  repair_time: { type: String },
  confirmation: { type: String, default: "B-Grade" },
});

const BGradeTrackingSchema = new mongoose.Schema(
  {
    defect_print_id: { type: String, required: true },
    package_no: { type: String },
    moNo: { type: String },
    custStyle: { type: String },
    color: { type: String },
    size: { type: String },
    lineNo: { type: String },
    department: { type: String },
    buyer: { type: String },
    factory: { type: String },
    sub_con: { type: String },
    sub_con_factory: { type: String },
    bGradeArray: [BGradeDefectSchema]
  },
  { timestamps: true }
);

export default (connection) => connection.model("BGradeTracking", BGradeTrackingSchema, "b-grade-tracking");

