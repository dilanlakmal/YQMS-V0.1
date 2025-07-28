import mongoose from "mongoose";

const qcWashingCheckpointSchema = new mongoose.Schema(
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
    collection: "qc_washing_checkpoints",
    timestamps: true
  }
);

// qcWashingCheckpointSchema.index({ name: 1 }, { unique: true });

export default function createQCWashingCheckpointsModel(connection) {
  return connection.model("QCWashingCheckpoints", qcWashingCheckpointSchema);
}
