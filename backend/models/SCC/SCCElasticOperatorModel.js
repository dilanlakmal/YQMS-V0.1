import mongoose from "mongoose";

const sccElasticOperatorSchema = new mongoose.Schema(
  {
    machineNo: { type: String, required: true }, // e.g., "1", "2", "5"
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
    collection: "scc_elastic_operators",
    timestamps: true
  }
);

// Ensure that machineNo is unique for Elastic operators
sccElasticOperatorSchema.index({ machineNo: 1 }, { unique: true });

export default function createSCCElasticOperatorModel(connection) {
  return connection.model("SCCElasticOperator", sccElasticOperatorSchema);
}
