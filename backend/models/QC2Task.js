import mongoose from "mongoose";

const qc2TaskSchema = new mongoose.Schema(
  {
    record_no: { type: Number, required: true, unique: true },
    department: { type: String, required: true },
    productType: { type: String, required: true },
    processName: { type: String, required: true },
    productTypeKhmer: { type: String, default: "" },
    processNameKhmer: { type: String, default: "" },
    productTypeChinese: { type: String, default: "" },
    processNameChinese: { type: String, default: "" },
    taskNo: { type: Number, required: true }
  },
  {
    collection: "qc2_tasks",
    timestamps: true
  }
);

export default (connection) => connection.model("QC2Task", qc2TaskSchema);
