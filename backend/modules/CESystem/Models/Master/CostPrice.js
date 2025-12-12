import mongoose from "mongoose";

const costPriceSchema = new mongoose.Schema(
  {
    Cost_Price: { type: Number },
    Set_Percent: { type: Number },
    Washing_Price: { type: Number },
    Description: { type: String },
    Remark: { type: String }
  },
  {
    timestamps: true
  }
);

export default (connection) => connection.models.ce_costprice ||
  connection.model("ce_costprice", costPriceSchema, "ce_costprice");

