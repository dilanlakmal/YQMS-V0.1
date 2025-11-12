import mongoose from "mongoose";

// 🆕 Sub-schema for Product Location
const productLocationSchema = new mongoose.Schema({
  No: { type: Number, required: true },
  Name: { type: String, required: true }
});

// Schema for QA Sections Product Type
const qaSectionsProductType = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    EnglishProductName: { type: String, required: true },
    KhmerProductName: { type: String, required: true },
    ChineseProductName: { type: String, required: true },
    ProductLocation: {
      type: [productLocationSchema],
      default: []
    }
  },
  {
    collection: "qa_sections_product_type",
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("QASectionsProductType", qaSectionsProductType);
