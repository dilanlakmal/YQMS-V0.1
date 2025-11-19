// models/BuyerSpecTemplateM2.js
import mongoose from "mongoose";

// Sub-schema for individual spec details within a size
const SpecDetailSchema = new mongoose.Schema(
  {
    orderNo: { type: Number, required: true },
    specName: { type: String, required: true },
    chineseRemark: { type: String },
    seqNo: { type: Number, required: true },
    tolMinus: { type: Number, required: true },
    tolPlus: { type: Number, required: true },
    specValueFraction: { type: String, required: true },
    specValueDecimal: { type: Number, required: true }
  },
  { _id: false }
);

// Sub-schema for the data associated with a single size
const SizeDataSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    specDetails: [SpecDetailSchema]
  },
  { _id: false }
);

// Main schema for the buyer spec template M2
const BuyerSpecTemplateM2Schema = new mongoose.Schema(
  {
    moNo: { type: String, required: true, unique: true },
    buyer: { type: String, required: true },
    specData: [SizeDataSchema]
  },
  { timestamps: true }
);

// Create and export the model factory
export default (connection) =>
  connection.model("BuyerSpecTemplateM2", BuyerSpecTemplateM2Schema);
