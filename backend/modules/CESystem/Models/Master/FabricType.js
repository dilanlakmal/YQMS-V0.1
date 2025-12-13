import mongoose from "mongoose";

const fabricTypeSchema = new mongoose.Schema(
  {
    Fabric_Type: { type: String },
    Description: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_fabrictype ||
  connection.model("ce_fabrictype", fabricTypeSchema, "ce_fabrictype");

