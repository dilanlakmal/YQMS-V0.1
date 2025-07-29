import mongoose from "mongoose";

// Sub-schema for a single measurement entry within a garment
const MeasurementEntrySchema = new mongoose.Schema(
  {
    orderNo: { type: Number, required: true },
    decimalValue: { type: Number },
    fractionValue: { type: String }
  },
  { _id: false }
);

// Sub-schema for one measured garment
const GarmentMeasurementSchema = new mongoose.Schema(
  {
    garmentNo: { type: Number, required: true },
    measurements: [MeasurementEntrySchema]
  },
  { _id: false }
);

// Sub-schema for the buyer spec data for a particular size
const BuyerSpecDataSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    measurementPoint: { type: String, required: true },
    tolNeg_fraction: { type: String, required: true },
    tolPos_fraction: { type: String, required: true },
    spec_fraction: { type: String, required: true },
    tolNeg_decimal: { type: Number, required: true },
    tolPos_decimal: { type: Number, required: true },
    spec_decimal: { type: Number, required: true }
  },
  { _id: false }
);

// Sub-schema for all details related to a single measured size
const SizeMeasurementDetailsSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    sizeSummary: {
      garmentDetailsCheckedQty: { type: Number, default: 0 },
      garmentDetailsOKGarment: { type: Number, default: 0 },
      garmentDetailsRejected: { type: Number, default: 0 },
      measurementDetailsPoints: { type: Number, default: 0 },
      measurementDetailsPass: { type: Number, default: 0 },
      measurementDetailsTotalIssues: { type: Number, default: 0 },
      measurementDetailsTolPositive: { type: Number, default: 0 },
      measurementDetailsTolNegative: { type: Number, default: 0 }
    },
    buyerSpecData: [BuyerSpecDataSchema],
    sizeMeasurementData: [GarmentMeasurementSchema]
  },
  { _id: false }
);

// Main Report Schema
const ANFMeasurementReportSchema = new mongoose.Schema(
  {
    inspectionDate: { type: Date, required: true },
    qcID: { type: String, required: true },
    moNo: { type: String, required: true },
    buyer: { type: String, required: true },
    color: { type: [String], required: true },
    orderDetails: {
      custStyle: { type: String },
      mode: { type: String },
      country: { type: String },
      origin: { type: String },
      orderQty_style: { type: Number },
      orderQty_bySize: mongoose.Schema.Types.Mixed
    },
    measurementDetails: [SizeMeasurementDetailsSchema],
    overallMeasurementSummary: {
      garmentDetailsCheckedQty: { type: Number, default: 0 },
      garmentDetailsOKGarment: { type: Number, default: 0 },
      garmentDetailsRejected: { type: Number, default: 0 },
      measurementDetailsPoints: { type: Number, default: 0 },
      measurementDetailsPass: { type: Number, default: 0 },
      measurementDetailsTotalIssues: { type: Number, default: 0 },
      measurementDetailsTolPositive: { type: Number, default: 0 },
      measurementDetailsTolNegative: { type: Number, default: 0 }
    }
  },
  {
    // Enable timestamps (createdAt, updatedAt)
    timestamps: true
  }
);

// Create a compound index to ensure uniqueness for a given inspection session
ANFMeasurementReportSchema.index(
  { inspectionDate: 1, qcID: 1, moNo: 1, color: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model("ANFMeasurementReport", ANFMeasurementReportSchema);
