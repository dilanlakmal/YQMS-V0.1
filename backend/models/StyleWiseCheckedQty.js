import mongoose from "mongoose";

const styleWiseCheckedQtySchema = new mongoose.Schema(
  {
    style: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    checkedQty: { type: Number, required: true, default: 0 },
    emp_id: { type: String, required: true },
    eng_name: { type: String, required: true },
    kh_name: { type: String, default: "" },
    job_title: { type: String, default: "" },
    dept_name: { type: String, required: true },
    sect_name: { type: String, default: "" },
    updated_date: { type: String, required: true },
    update_time: { type: String, required: true }
  },
  {
    collection: "style_wise_checked_qty",
    timestamps: true
  }
);

styleWiseCheckedQtySchema.index({ style: 1, color: 1, size: 1 });

export default function createStyleWiseCheckedQtyModel(connection) {
  return connection.model("StyleWiseCheckedQty", styleWiseCheckedQtySchema);
}