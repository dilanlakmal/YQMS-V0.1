import mongoose from "mongoose";

// Schema for qc2_orderdata collection
const qc2OrderDataSchema = new mongoose.Schema(
  {
    bundle_random_id: { type: String, required: true, unique: true },
    bundle_id: { type: String, required: true },
    package_no: Number,
    task_no_order: { type: Number, default: 52 },
    date: { type: String, required: true },
    department: { type: String, required: true },
    selectedMono: { type: String, required: true },
    custStyle: { type: String, required: true },
    buyer: { type: String, required: true },
    country: { type: String, required: true },
    orderQty: { type: Number, required: true },
    factory: { type: String, required: true },
    lineNo: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    colorCode: { type: String, required: true },
    chnColor: { type: String, required: true },
    colorKey: { type: Number, required: true },
    sizeOrderQty: { type: Number, required: true },
    planCutQty: { type: Number, required: true },
    count: { type: Number, required: true },
    bundleQty: { type: Number, required: true },
    totalBundleQty: { type: Number, required: true },
    sub_con: { type: String, default: "No" }, // New field
    sub_con_factory: { type: String, default: "N/A" }, // New field
    updated_date_seperator: { type: String, required: true },
    updated_time_seperator: { type: String, required: true },
    emp_id: { type: String, required: true },
    eng_name: { type: String, required: true },
    kh_name: { type: String },
    job_title: { type: String },
    dept_name: { type: String, required: true },
    sect_name: { type: String },
    emp_id_ironing: { type: String },
    eng_name_ironing: { type: String },
    kh_name_ironing: { type: String },
    job_title_ironing: { type: String },
    dept_name_ironing: { type: String },
    sect_name_ironing: { type: String },
    passQtyIron: { type: Number },
    ironing_updated_date: { type: String },
    ironing_update_time: { type: String },
  },
  { collection: "qc2_orderdata" }
);

export default (connection) =>
  connection.model("qc2_orderdata", qc2OrderDataSchema);
