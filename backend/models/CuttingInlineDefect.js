// backend/models/CuttingInlineDefect.js
import mongoose from "mongoose";

const CuttingInlineDefectSchema = new mongoose.Schema({
  defectName: { type: String, required: true },
  defectNameEng: { type: String, required: true },
  defectNameKhmer: { type: String, required: true },
  defectNameChinese: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default (connection) =>
  connection.model("CuttingInlineDefect", CuttingInlineDefectSchema);
