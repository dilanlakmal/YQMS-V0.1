import mongoose from "mongoose";

const subconSewingFactorySchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    factory: { type: String, required: true, unique: true },
    factory_second_name: { type: String, default: "" },
    lineList: { type: [String], required: true }
  },
  {
    collection: "subcon_sewing_factory",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("SubconSewingFactory", subconSewingFactorySchema);
