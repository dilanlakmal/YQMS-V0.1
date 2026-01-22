import mongoose from "mongoose";

const machineSchema = new mongoose.Schema(
  {
    Machine_Code: { type: String },
    Eng_Name: { type: String },
    Ch_Name: { type: String },
    Kh_Name: { type: String },
    Machine_Type: { type: String },
    Brand_Code: { type: String },
    Model_Code: { type: String },
    Description: { type: String },
    Remarks: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_machine ||
  connection.model("ce_machine", machineSchema, "ce_machine");

