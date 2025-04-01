import mongoose from "mongoose";

const CuttingOrdersSchema = new mongoose.Schema({
  StyleNo: { type: String, required: true },
  Buyer: { type: String, required: true },
  BuyerStyle: { type: String, required: true },
  EngColor: { type: String, required: true },
  ChColor: { type: String, required: true },
  ColorCode: { type: String, required: true },
  lotNo: [
    {
      No: { type: Number },
      LotName: { type: String }
    }
  ],
  cuttingData: [
    {
      tableNo: { type: String },
      markerNo: { type: String },
      planLayerQty: { type: Number }, // New field for PlanLayer
      totalPlanPcs: { type: Number }, // New field for PlanPcs
      actualLayers: { type: Number }, // New field for ActualLayer
      markerData: [
        {
          No: { type: Number },
          size: { type: String },
          orderQty: { type: Number },
          markerRatio: { type: Number }
        }
      ]
    }
  ],
  totalOrderQty: { type: Number, default: 0 }
});

export default (connection) =>
  connection.model("CuttingOrders", CuttingOrdersSchema);
