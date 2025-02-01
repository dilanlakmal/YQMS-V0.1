import mongoose from 'mongoose';

const ironingSchema = new mongoose.Schema(
  {
    ironing_record_id: Number,
    task_no: { type: Number, default: 53 },
    ironing_bundle_id: { type: String, required: true, unique: true },
    ironing_updated_date: String,
    ironing_update_time: String,
    bundle_id: String,
    selectedMono: String,
    custStyle: String,
    buyer: String,
    country: String,
    factory: String,
    lineNo: String,
    color: String,
    size: String,
    count: String,
    totalBundleQty: Number,
  },
);

export default (connection) => connection.model("Ironing", ironingSchema);