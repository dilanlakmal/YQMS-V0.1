import mongoose from "mongoose";

const markerRatioSchema = new mongoose.Schema({
  no: { type: Number, required: true },
  size: { type: String, required: true },
  ratio: { type: Number, required: true },
  qty: { type: Number, required: true }
});

const cuttingInlineOrderSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  actualLayer: { type: Number, required: true },
  buyer: { type: String, required: true },
  buyerStyle: { type: String, required: true },
  chnColor: { type: String, required: true },
  color: { type: String, required: true },
  colorCode: { type: String, required: true },
  fabricType: { type: String, required: true },
  grossKgs: { type: Number, required: true },
  lotNos: { type: String, required: true },
  mackerLength: { type: Number, required: true },
  mackerNo: { type: String, required: true },
  mackerWidth: { type: Number, required: true },
  markerRatio: [markerRatioSchema],
  material: { type: String, required: true },
  netKgs: { type: Number, required: true },
  planLayer: { type: Number, required: true },
  rollQty: { type: Number, required: true },
  spreadTable: { type: String, required: true },
  spreadYds: { type: Number, required: true },
  standardRelaxTime: { type: Number, default: null },
  styleNo: { type: String, required: true },
  tableNo: { type: String, required: true },
  totalOrderQty: { type: Number, required: true },
  totalOrderQtyStyle: { type: Number, required: true },
  totalPcs: { type: Number, required: true },
  txnDate: { type: Date, required: true },
  txnNo: { type: String, required: true },
  unit: { type: String, required: true }
}, {
  timestamps: true
});

// Create and export the model
export default function createCuttingInlineOrderModel(connection) {
  return connection.model('CuttingInlineOrder', cuttingInlineOrderSchema, 'cutting_inline_orders');
}