import mongoose from "mongoose";

// Ironing Schema
const ironingSchema = new mongoose.Schema(
  {
    ironing_record_id: Number,
    task_no_ironing: { type: Number, default: 53 },
    ironing_bundle_id: { type: String, required: true, unique: true },
    ironing_updated_date: String,
    ironing_update_time: String,
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
    passQtyIron: Number,
    sub_con: String,
    sub_con_factory: String,
    emp_id_ironing: String,
    eng_name_ironing: String,
    kh_name_ironing: String,
    job_title_ironing: String,
    dept_name_ironing: String,
    sect_name_ironing: String,
  },
  { collection: "ironing" }
);

export default (connection) => connection.model("Ironing", ironingSchema);
