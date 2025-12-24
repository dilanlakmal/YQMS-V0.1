import mongoose from "mongoose";

const printingDefectSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    defectNameEng: { type: String, required: true, unique: true },
    defectNameKhmer: { type: String, required: true },
    defectNameChine: { type: String }
  },
  {
    collection: "printing_defects",
    timestamps: true
  }
);

export default function createPrintingDefectModel(connection) {
  return connection.model("PrintingDefect", printingDefectSchema);
}
