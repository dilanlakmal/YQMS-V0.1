import mongoose from 'mongoose';

const packingSchema = new mongoose.Schema(
  {
    packing_record_id: Number,
    task_no_packing: { type: Number, default: 62 },
    package_no: Number, // Added package_no
    packing_bundle_id: { type: String, required: true, unique: true },
    packing_updated_date: String,
    packing_update_time: String,
    bundle_id: String,
    bundle_random_id: String, // Added to store bundle_random_id from qc2_inspection_pass_bundle
    department: String,
    selectedMono: String,
    custStyle: String,
    buyer: String,
    country: String,
    factory: String,
    lineNo: String,
    color: String,
    size: String,
    count: Number, // Use totalPass or totalRejectGarmentCount as checkedQty
    totalBundleQty: Number,
    passQtyPack: Number,
    sub_con: String,
    sub_con_factory: String,
    emp_id_packing: String, // Added for user tracking
    eng_name_packing: String, // Added for user tracking
    kh_name_packing: String, // Added for user tracking
    job_title_packing: String, // Added for user tracking
    dept_name_packing: String, // Added for user tracking
    sect_name_packing: String, // Added for user tracking
  },
  { collection: "packing" }
);

export default (connection) => connection.model("Packing", packingSchema);
