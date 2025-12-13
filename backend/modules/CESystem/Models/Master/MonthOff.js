import mongoose from "mongoose";

const monthOffSchema = new mongoose.Schema(
  {
    Create_Date: { type: Date },
    PreparedBy: { type: String },
    Worker_Piece_Rate: { type: Date },
    WeeKly_Piece_Rate: { type: Date },
    Weekly_Over_Target: { type: Date },
    Quality_Bonus: { type: Date },
    Remarks: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_monthoff ||
  connection.model("ce_monthoff", monthOffSchema, "ce_monthoff");

