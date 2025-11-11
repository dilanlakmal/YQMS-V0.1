import mongoose from "mongoose";

const cuttingInlineOrdersSchema = new mongoose.Schema(
  {
    barcode: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    styleNo: String,
    txnDate: Date,
    txnNo: String,
    buyer: String,
    buyerStyle: String,
    color: String,
    chnColor: String,
    colorCode: String,
    fabricType: String,
    material: String,
    spreadTable: String,
    tableNo: String,
    rollQty: Number,
    spreadYds: Number,
    unit: String,
    grossKgs: Number,
    netKgs: Number,
    planLayer: Number,
    actualLayer: Number,
    totalPcs: Number,
    mackerNo: String,
    mackerLength: Number,
    mackerWidth: Number,
    standardRelaxTime: Number,
    lotNos: String,
    totalOrderQty: Number,
    totalOrderQtyStyle: Number,

    // Single markerRatio array containing all size data
    markerRatio: [
      {
        _id: false,
        no: Number,
        size: String,
        ratio: Number,
        qty: Number
      }
    ],

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: "cutting_inline_orders"
  }
);

// Index for efficient querying

export default (connection) =>
  connection.model("CuttingInlineOrders", cuttingInlineOrdersSchema);
