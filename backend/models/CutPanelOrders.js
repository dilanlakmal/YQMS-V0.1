import mongoose from "mongoose";

const MarkerRatioSchema = new mongoose.Schema({
  no: { type: Number },
  size: { type: String },
  cuttingRatio: { type: Number },
  orderQty: { type: Number }
});

const CutPanelOrdersSchema = new mongoose.Schema({
  StyleNo: { type: String, required: true },
  TxnDate: { type: Date },
  TxnNo: { type: String },
  Buyer: { type: String },
  Color: { type: String },
  SpreadTable: { type: String },
  TableNo: { type: String, required: true },
  BuyerStyle: { type: String },
  ChColor: { type: String },
  ColorCode: { type: String },
  FabricType: { type: String },
  Material: { type: String },
  RollQty: { type: Number },
  SpreadYds: { type: Number },
  Unit: { type: String },
  GrossKgs: { type: Number },
  NetKgs: { type: Number },
  MackerNo: { type: String },
  MackerLength: { type: Number },
  SendFactory: { type: String },
  SendTxnDate: { type: Date },
  SendTxnNo: { type: String },
  SendTotalQty: { type: Number },
  PlanLayer: { type: Number },
  ActualLayer: { type: Number },
  TotalPcs: { type: Number },
  LotNos: [{ type: String }],
  TotalOrderQty: { type: Number },
  TotalTTLRoll: { type: Number },
  TotalTTLQty: { type: Number },
  TotalBiddingQty: { type: Number },
  TotalBiddingRollQty: { type: Number },
  MarkerRatio: [MarkerRatioSchema]
});

export default (connection) =>
  connection.model("CutPanelOrders", CutPanelOrdersSchema);
