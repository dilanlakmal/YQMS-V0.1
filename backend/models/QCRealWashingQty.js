import mongoose from "mongoose";

const qcRealWashingQtySchema = new mongoose.Schema({
  inspectionDate: {
    type: Date,
    required: true,
    index: true
  },
  QC_Id: {
    type: String,
    required: true,
    index: true
  },
  Style_No: {
    type: String,
    required: true,
    index: true
  },
  color: {
    type: String,
    required: true,
    index: true
  },
  washQty: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'qc_real_washing_qty'
});

// Compound index for efficient querying
qcRealWashingQtySchema.index({ 
  inspectionDate: 1, 
  QC_Id: 1, 
  Style_No: 1, 
  color: 1 
}, { unique: true });

// Pre-save middleware to update the updatedAt field
qcRealWashingQtySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default (connection) =>
  connection.model("qc_real_washing_qty", qcRealWashingQtySchema, "qc_real_washing_qty");
