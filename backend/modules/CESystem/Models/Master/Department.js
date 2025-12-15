import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    Dept_Code: { type: String },
    Piece_Rate_Type: { type: String },
    Dept: { type: String },
    Section: { type: String },
    Wk_Line: { type: String },
    Borrow_Dept: { type: String },
    Dept_Type: { type: String },
    OutPut_Tg: { type: String },
    CPM_Price: { type: Number },
    SubLine: { type: String },
    Worker: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_department ||
  connection.model("ce_department", departmentSchema, "ce_department");

