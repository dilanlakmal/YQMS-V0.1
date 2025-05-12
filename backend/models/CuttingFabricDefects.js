// backend/models/CuttingFabricDefects.js
import mongoose from "mongoose";

const CuttingFabricDefectSchema = new mongoose.Schema({
  defectCode: { type: String, required: true },
  defectName: { type: String, required: true },
  defectNameEng: { type: String, required: true },
  defectNameKhmer: { type: String, required: true },
  defectNameChinese: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default (connection) =>
  connection.model("CuttingFabricDefect", CuttingFabricDefectSchema);
