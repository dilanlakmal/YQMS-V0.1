import mongoose from "mongoose";

const QCWashingCheckListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    addedBy: {
      emp_id: { type: String, required: true },
      eng_name: { type: String, required: true }
    },
    updatedBy: {
      emp_id: { type: String },
      eng_name: { type: String }
    }
  },
  {
    collection: "qc_washing_checklist",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QCWashingCheckList", QCWashingCheckListSchema);
