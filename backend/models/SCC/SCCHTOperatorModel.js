import mongoose from "mongoose";

const sccHTOperatorSchema = new mongoose.Schema(
  {
    machineNo: { type: String, required: true }, // e.g., "1", "2", "12"
    emp_id: { type: String, required: true },
    emp_face_photo: { type: String, default: null },
    emp_eng_name: { type: String, default: null },
    emp_reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Referencing the User model (which might be on a different connection)
      required: true
    }
    // Unique compound index to ensure one operator per machine
  },
  {
    collection: "scc_ht_operators",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Ensure that machineNo is unique for HT operators
sccHTOperatorSchema.index({ machineNo: 1 }, { unique: true });

export default function createSCCHTOperatorModel(connection) {
  return connection.model("SCCHTOperator", sccHTOperatorSchema);
}
