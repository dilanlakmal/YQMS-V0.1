import mongoose from "mongoose";

const qcWashingDefectSchema = new mongoose.Schema(
  {
    code: { type: Number, required: true, unique: true },
    english: { type: String, required: true },
    khmer: { type: String, required: true },
    chinese: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  {
    collection: "qc_washing_defects",
    timestamps: true
  }
);

qcWashingDefectSchema.index({ english: 1 }, { unique: true });

export default function createQCWashingDefectsModel(connection) {
  return connection.model("QCWashingDefects", qcWashingDefectSchema);
}
