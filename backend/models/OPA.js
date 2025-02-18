import mongoose from 'mongoose';

const opaSchema = new mongoose.Schema(
  {
    opa_record_id: Number,
    task_no_opa: { type: Number, default: 53 },
    opa_bundle_id: { type: String, required: true, unique: true },
    opa_updated_date: String,
    opa_update_time: String,
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
    passQtyOPA: Number,
    sub_con: String,
    sub_con_factory: String,
    emp_id: String,
    updated_date_seperator: String,
    updated_time_seperator: String,
  },
  { collection: "opa" }
);

export default (connection) => connection.model("OPA", opaSchema);
