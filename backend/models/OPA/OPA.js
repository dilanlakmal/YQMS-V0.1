import mongoose from "mongoose";

const opaSchema = new mongoose.Schema(
  {
    opa_record_id: Number,
    task_no_opa: { type: Number, default: 60 }, // Default to 60 for order cards
    package_no: Number,
    opa_bundle_id: { type: String, required: true, unique: true },
    opa_updated_date: String,
    opa_update_time: String,
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
    count: Number,
    totalBundleQty: Number,
    passQtyOPA: Number,
    sub_con: String,
    sub_con_factory: String,
    emp_id_opa: String,
    eng_name_opa: String,
    kh_name_opa: String,
    job_title_opa: String,
    dept_name_opa: String,
    sect_name_opa: String,
  },
  { collection: "opa" }
);

export default (connection) => connection.model("OPA", opaSchema);
