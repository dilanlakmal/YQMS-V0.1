import mongoose from "mongoose";

const CuttingMeasurementPointSchema = new mongoose.Schema({
  no: { type: Number, required: true },
  moNo: { type: String, required: true },
  panel: { type: String, required: true },
  panelKhmer: { type: String, required: true }, // New field for Khmer translation of panel
  panelChinese: { type: String }, // New field for Chinese translation of panel
  pointName: { type: String, required: true },
  pointNameEng: { type: String, required: true },
  pointNameKhmer: { type: String, required: true },
  pointNameChinese: { type: String }, // New field for Chinese translation of pointName
  panelName: { type: String, required: true },
  panelSide: { type: String, required: true },
  panelDirection: { type: String, required: true },
  measurementSide: { type: String, required: true },
  panelIndex: { type: Number, required: true },
  panelIndexName: { type: String, required: true },
  panelIndexNameKhmer: { type: String, required: true },
  panelIndexNameChinese: { type: String }, // New field for Chinese translation of panelIndexName
  created_at: { type: Date, default: Date.now }, // New field for creation timestamp
  updated_at: { type: Date, default: Date.now } // New field for update timestamp
});

export default (connection) =>
  connection.model("CuttingMeasurementPoint", CuttingMeasurementPointSchema);
