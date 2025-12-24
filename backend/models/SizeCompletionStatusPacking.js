import mongoose from "mongoose";

const SizeCompletionStatusPackingSchema = new mongoose.Schema(
  {
    qcID: { type: String, required: true },
    moNo: { type: String, required: true },
    color: { type: [String], required: true },
    size: { type: String, required: true },
    status: {
      type: String,
      enum: ["Completed"],
      required: true,
      default: "Completed"
    }
  },
  { timestamps: true }
);

SizeCompletionStatusPackingSchema.index(
  { qcID: 1, moNo: 1, color: 1, size: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model(
    "SizeCompletionStatusPacking",
    SizeCompletionStatusPackingSchema
  );
