import mongoose from "mongoose";

const sccFUOperatorSchema = new mongoose.Schema(
  {
    machineNo: { type: String, required: true }, // e.g., "001", "002", "003"
    emp_id: { type: String, required: true },
    emp_face_photo: { type: String, default: null },
    emp_eng_name: { type: String, default: null },
    emp_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    collection: "scc_fu_operators",
    timestamps: true
  }
);

// Ensure that machineNo is unique for FU operators
sccFUOperatorSchema.index({ machineNo: 1 }, { unique: true });

export default function createSCCFUOperatorModel(connection) {
  return connection.model("SCCFUOperator", sccFUOperatorSchema);
}
