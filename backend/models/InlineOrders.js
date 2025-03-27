// models/InlineOrders.js
import mongoose from "mongoose";

const OrderDataSchema = new mongoose.Schema({
  Tg_No: { type: String },
  Tg_Code: { type: String },
  Ma_Code: { type: String },
  ch_name: { type: String },
  kh_name: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const InlineOrdersSchema = new mongoose.Schema({
  St_No: { type: String, unique: true },
  By_Style: { type: String },
  Dept_Type: { type: String },
  orderData: [OrderDataSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure unique combination of St_No, By_Style, and Dept_Type
InlineOrdersSchema.index(
  { St_No: 1, By_Style: 1, Dept_Type: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model("InlineOrder", InlineOrdersSchema);
