import mongoose from "mongoose";

const setGradeSchema = new mongoose.Schema(
  {
    Grade: { type: String },
    Percentage: { type: Number },
    Description: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_setgrade ||
  connection.model("ce_setgrade", setGradeSchema, "ce_setgrade");

