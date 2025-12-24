import mongoose from "mongoose";

const targetSampleSchema = new mongoose.Schema(
  {
    DT_Code: { type: String },
    Target_Code: { type: String },
    Check_Point: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_targetsample ||
  connection.model("ce_targetsample", targetSampleSchema, "ce_targetsample");

