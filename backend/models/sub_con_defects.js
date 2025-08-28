import mongoose from "mongoose";

const subConDefectsSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    DisplayCode: { type: Number, required: true },
    DefectCode: { type: Number, required: true, unique: true },
    DefectNameEng: { type: String, required: true },
    DefectNameKhmer: { type: String, required: true },
    DefectNameChi: { type: String, required: true }
  },
  {
    collection: "sub_con_defects",
    timestamps: true // This will automatically add createdAt and updatedAt fields
  }
);

export default (connection) =>
  connection.model("SubConDefect", subConDefectsSchema);
