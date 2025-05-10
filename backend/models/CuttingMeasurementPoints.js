import mongoose from "mongoose";

const CuttingMeasurementPointSchema = new mongoose.Schema({
  no: { type: Number, required: true },
  moNo: { type: String, required: true },
  panel: { type: String, required: true },
  pointName: { type: String, required: true },
  pointNameEng: { type: String, required: true },
  pointNameKhmer: { type: String, required: true },
  panelName: { type: String, required: true },
  panelSide: { type: String, required: true },
  panelDirection: { type: String, required: true },
  measurementSide: { type: String, required: true },
  panelIndex: { type: Number, required: true },
  panelIndexName: { type: String, required: true },
  panelIndexNameKhmer: { type: String, required: true }
});

export default (connection) =>
  connection.model("CuttingMeasurementPoint", CuttingMeasurementPointSchema);
