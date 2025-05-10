import mongoose from "mongoose";

const CuttingAdditionalPointSchema = new mongoose.Schema({
  moNo: { type: String, required: true },
  orderQty: { type: Number, required: true },
  orderDetails: [
    {
      color: { type: String, required: true },
      orderQtyColor: { type: Number, required: true },
      sizes: [
        {
          sizeName: { type: String, required: true },
          orderQtySize: { type: Number, required: true }
        }
      ]
    }
  ],
  additionalPoints: [
    {
      garmentType: { type: String, required: true },
      garmentTypeKhmer: { type: String, required: true },
      panelIndex: { type: Number, required: true },
      panelName: { type: String, default: "" },
      panelNameKhmer: { type: String, default: "" },
      measurementPoint: { type: String, required: true },
      measurementPointKhmer: { type: String, required: true }
    }
  ]
});

export default (connection) =>
  connection.model("CuttingAdditionalPoint", CuttingAdditionalPointSchema);
