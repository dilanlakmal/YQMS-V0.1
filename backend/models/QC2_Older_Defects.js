import mongoose from "mongoose";

const qc2OldDefectsSchema = new mongoose.Schema(
  {
    defectCode: { type: Number, required: true },
    defectName: { type: String, required: true },
    English: { type: String, required: true },
    Khmer: { type: String, required: true },
    Chinese: { type: String, required: true },
  },
  { collection: "qc2_old_defects",
  timestamps: true
  }
);

export default (connection) =>
  connection.model("qc2_old_defects", qc2OldDefectsSchema);
