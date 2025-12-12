import mongoose from "mongoose";

const mainReasonSchema = new mongoose.Schema(
  {
    Reason: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_mainreason ||
  connection.model("ce_mainreason", mainReasonSchema, "ce_mainreason");

