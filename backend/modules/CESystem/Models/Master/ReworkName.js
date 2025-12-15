import mongoose from "mongoose";

const reworkNameSchema = new mongoose.Schema(
  {
    Rework_Code: { type: String },
    Rework_Dept: { type: String },
    Rework_Name: { type: String },
    Description: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_reworkname ||
  connection.model("ce_reworkname", reworkNameSchema, "ce_reworkname");

