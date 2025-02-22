import mongoose from 'mongoose';

const washingSchema = new mongoose.Schema(
  {
    washing_record_id: Number,
    task_no_washing: { type: Number, default: 53 },
    washing_bundle_id: { type: String, required: true, unique: true },
    washing_updated_date: String,
    washing_update_time: String,
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
    passQtyWash: Number,
    sub_con: String,
    sub_con_factory: String,
    emp_id: String,
    updated_date_seperator: String,
    updated_time_seperator: String,
  },
  { collection: "washing" }
);

export default (connection) => connection.model("Washing", washingSchema);
