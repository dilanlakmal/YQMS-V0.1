import mongoose from 'mongoose';

const washingSchema = new mongoose.Schema(
  {
    washing_record_id: Number,
    task_no_washing: { type: Number, default: 55 }, // Default to 55 for order cards
    package_no: Number,
    washing_bundle_id: { type: String, required: true, unique: true },
    washing_updated_date: String,
    washing_update_time: String,
    bundle_id: String,
    bundle_random_id: String,
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
    emp_id_washing: String,
    eng_name_washing: String,
    kh_name_washing: String,
    job_title_washing: String,
    dept_name_washing: String,
    sect_name_washing: String,
  },
  { collection: "washing" }
);

export default (connection) => connection.model("Washing", washingSchema);
