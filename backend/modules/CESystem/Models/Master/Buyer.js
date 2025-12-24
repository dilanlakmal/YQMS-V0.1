import mongoose from "mongoose";

const buyerSchema = new mongoose.Schema(
  {
    Buyer_Name: { type: String, required: true },
    PalletCTN: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_buyer ||
  connection.model("ce_buyer", buyerSchema, "ce_buyer");

