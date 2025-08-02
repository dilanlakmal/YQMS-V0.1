import mongoose from "mongoose";

const SizeCompletionStatusSchema = new mongoose.Schema(
  {
    qcID: { type: String, required: true },
    moNo: { type: String, required: true },
    // Storing colors sorted ensures consistency for the unique index
    color: { type: [String], required: true },
    size: { type: String, required: true },
    status: {
      type: String,
      enum: ["Completed"], // This model only exists to mark things as completed
      required: true,
      default: "Completed"
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

// This is the CRUCIAL part. It creates a unique index ensuring
// a QC can only have one "Completed" status record for a given MO/Color/Size.
SizeCompletionStatusSchema.index(
  { qcID: 1, moNo: 1, color: 1, size: 1 },
  { unique: true }
);

// Export it so you can create the model
export default (connection) =>
  connection.model("SizeCompletionStatus", SizeCompletionStatusSchema);
