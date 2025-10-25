import mongoose from "mongoose";

const sizeDataSchema = new mongoose.Schema(
  {
    SizeName: { type: String, required: true },
    SizeOrderQty: { type: Number, required: true }
  },
  { _id: false }
);

const cartonDataSchema = new mongoose.Schema(
  {
    CartonNo: { type: Number, required: true },
    CartonNoEnd: { type: Number, required: true },
    CartonCount: { type: Number, default: 0 },
    CartonQty: { type: Number, default: 0 },
    NetWeight: { type: Number, default: 0 },
    GrossWeight: { type: Number, default: 0 },
    Color: { type: String, default: "" },
    ColorCode: { type: String, default: "" },
    ChineseColor: { type: String, default: "" },
    Dimensions: {
      L: { type: Number, default: 0 },
      W: { type: Number, default: 0 },
      H: { type: Number, default: 0 }
    },
    CustNo: { type: Number, default: 0 },
    SizeData: [sizeDataSchema]
  },
  { _id: false }
);

const sizeQtySchema = new mongoose.Schema(
  {
    sizeName: { type: String, required: true },
    OrderQty: { type: Number, default: 0 },
    ActualQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const distributionDataSchema = new mongoose.Schema(
  {
    color: { type: String, required: true },
    sizeQty: [sizeQtySchema]
  },
  { _id: false }
);

const planPackingListSchema = new mongoose.Schema(
  {
    moNo: { type: String, required: true },
    custStyle: { type: String, required: true },
    buyer: { type: String, required: true },
    poNo: { type: String, required: true },
    date: { type: String, required: true },
    country: { type: String, default: "" },
    orderQty: { type: Number, default: 0 },
    shipmentMethod: { type: String, default: "" },
    destination: { type: String, default: "" },
    cartonList: { type: String, default: "" },
    cartonData: [cartonDataSchema],
    SizeArray: [String],
    DistributionData: [distributionDataSchema]
  },
  {
    timestamps: true,
    collection: "plan_packing_lists"
  }
);

planPackingListSchema.index({ moNo: 1, poNo: 1 }, { unique: true });

export default (connection) =>
  connection.model("PlanPackingList", planPackingListSchema);
