import mongoose from "mongoose";

const managerWorkerSchema = new mongoose.Schema(
  {
    Employee_ID: { type: String },
    Eng_Name: { type: String },
    Kh_Name: { type: String },
    Gender: { type: String },
    Position: { type: String },
    Status: { type: String },
    Control_Line: { type: String },
    Price: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_managerworker ||
  connection.model("ce_managerworker", managerWorkerSchema, "ce_managerworker");

