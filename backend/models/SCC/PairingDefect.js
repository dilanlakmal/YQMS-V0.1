import mongoose from "mongoose";

const pairingDefectSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    defectNameEng: { type: String, required: true },
    defectNameKhmer: { type: String, required: true },
    defectNameChinese: { type: String, required: true }
  },
  {
    collection: "pairing_defects", // Explicitly set the collection name
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default function createPairingDefectModel(connection) {
  return connection.model("PairingDefect", pairingDefectSchema);
}
