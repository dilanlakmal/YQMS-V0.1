import mongoose from 'mongoose';

const packingSchema = new mongoose.Schema(
  {
    packing_record_id: Number,
    task_no_packing: { type: Number, default: 53 },
    packing_bundle_id: { type: String, required: true, unique: true },
    packing_update_time: String,
    bundle_id: String,
    department: String,
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
    passQtyPack: Number,
    sub_con: String,
    sub_con_factory: String,
    emp_id: String,
    updated_date_seperator: String,
    updated_time_seperator: String,
  },
  { collection: "packing" }
);

export default (connection) => connection.model("Packing", packingSchema);
