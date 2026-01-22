import mongoose from "mongoose";

const SpecItemSchema = new mongoose.Schema(
  {
    id: { type: String }, // Unique ID for UI tracking
    no: { type: Number },
    kValue: { type: String },
    MeasurementPointEngName: { type: String },
    MeasurementPointChiName: { type: String },
    TolMinus: {
      fraction: { type: String },
      decimal: { type: Number }
    },
    TolPlus: {
      fraction: { type: String },
      decimal: { type: Number }
    },
    Specs: [
      {
        index: { type: Number },
        size: { type: String },
        fraction: { type: String },
        decimal: { type: Number },
        _id: false
      }
    ]
  },
  { _id: true }
);

const QASectionsMeasurementSpecsSchema = new mongoose.Schema(
  {
    Order_No: { type: String, required: true, unique: true },

    // Full copy from dt_orders
    AllBeforeWashSpecs: [SpecItemSchema],

    isSaveAllBeforeWashSpecs: {
      type: String,
      default: "No",
      enum: ["Yes", "No"]
    },

    // User selected subset
    selectedBeforeWashSpecs: [SpecItemSchema],

    // Placeholders for future logic
    AllAfterWashSpecs: { type: Array, default: [] },
    selectedAfterWashSpecs: { type: Array, default: [] }
  },
  { timestamps: true }
);

export default (connection) =>
  connection.model(
    "QASectionsMeasurementSpecs",
    QASectionsMeasurementSpecsSchema,
    "qa_sections_measurement_specs"
  );
