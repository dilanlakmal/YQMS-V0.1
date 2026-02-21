import mongoose from "mongoose";

const SpecItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    no: { type: Number },
    kValue: { type: String },
    MeasurementPointEngName: { type: String },
    MeasurementPointChiName: { type: String },
    TolMinus: {
      fraction: { type: String },
      decimal: { type: Number },
    },
    TolPlus: {
      fraction: { type: String },
      decimal: { type: Number },
    },
    Shrinkage: {
      fraction: { type: String, default: "0" },
      decimal: { type: Number, default: 0 },
    },
    Specs: [
      {
        index: { type: Number },
        size: { type: String },
        fraction: { type: String },
        decimal: { type: Number },
        _id: false,
      },
    ],
  },
  { _id: true },
);

const QASectionsMeasurementSpecsSchema = new mongoose.Schema(
  {
    Order_No: { type: String, required: true, unique: true },

    // Before Wash
    AllBeforeWashSpecs: [SpecItemSchema],
    isSaveAllBeforeWashSpecs: {
      type: String,
      default: "No",
      enum: ["Yes", "No"],
    },
    selectedBeforeWashSpecs: [SpecItemSchema],

    // ✅ FIXED: Use SpecItemSchema instead of generic Array
    AllAfterWashSpecs: [SpecItemSchema],
    selectedAfterWashSpecs: [SpecItemSchema],
  },
  { timestamps: true },
);

export default (connection) =>
  connection.model(
    "QASectionsMeasurementSpecs",
    QASectionsMeasurementSpecsSchema,
    "qa_sections_measurement_specs",
  );
