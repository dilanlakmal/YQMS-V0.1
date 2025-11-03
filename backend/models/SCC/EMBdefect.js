import mongoose from "mongoose";

const embDefectSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    defectNameEng: { type: String, required: true, unique: true },
    defectNameKhmer: { type: String, required: true },
    defectNameChine: { type: String }
  },
  {
    collection: "embdefects",
    timestamps: true // This will automatically add createdAt and updatedAt
  }
);

export default function createEMBDefectModel(connection) {
  return connection.model("EMBDefect", embDefectSchema);
}
