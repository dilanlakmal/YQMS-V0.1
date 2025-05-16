import mongoose from "mongoose";

const CuttingIssueSchema = new mongoose.Schema({
  no: { type: String, required: true },
  defectEng: { type: String, required: true },
  defectKhmer: { type: String, required: true },
  defectChinese: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default (connection) =>
  connection.model("CuttingIssue", CuttingIssueSchema);
