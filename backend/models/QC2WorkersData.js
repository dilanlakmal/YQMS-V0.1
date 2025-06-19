import mongoose from "mongoose";

const dailyDataSchema = new mongoose.Schema({
  no: { type: Number, required: true },
  moNo: { type: String, required: true },
  taskNo: { type: Number, required: true, enum: [54, 84] }, // 54 for Order, 84 for Defect
  qty: { type: Number, required: true },
  random_id: { type: String, required: true }, // bundle_random_id or defect_print_id
  timestamp: { type: Date, default: Date.now }
});

const qc2WorkersDataSchema = new mongoose.Schema(
  {
    qc_id: { type: String, required: true },
    inspection_date: { type: String, required: true }, // Format: "MM/DD/YYYY"
    totalCheckedQty: { type: Number, default: 0 },
    totalQtyTask54: { type: Number, default: 0 }, // Total from Order cards
    totalQtyTask84: { type: Number, default: 0 }, // Total from Defect cards
    dailyData: [dailyDataSchema]
  },
  {
    collection: "qc2_workers_data",
    timestamps: true
  }
);

// Create a compound unique index to ensure one document per worker per day
qc2WorkersDataSchema.index({ qc_id: 1, inspection_date: 1 }, { unique: true });

export default function createQC2WorkersDataModel(connection) {
  return connection.model("QC2WorkersData", qc2WorkersDataSchema);
}
