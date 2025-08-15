import mongoose from "mongoose";

const qcWashingQtyOldSchema = new mongoose.Schema({
  Inspection_date: {
    type: Date,
    required: true
  },
  QC_ID: {
    type: String,
    required: true
  },
  Style_No: {
    type: String,
    required: true
  },
  Color: {
    type: String,
    required: true
  },
  Wash_Qty: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true 
});

qcWashingQtyOldSchema.index({ 
  Inspection_date: 1, 
  QC_ID: 1, 
  Style_No: 1, 
  Color: 1 
}, { unique: true });
export default (connection) =>
  connection.model("qc_washing_qty_old", qcWashingQtyOldSchema, "qc_washing_qty_old");

