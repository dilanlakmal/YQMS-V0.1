import mongoose from "mongoose";
import titleSchema from "./title.schema.js";
import customerSchema from "./customer.schema.js";
import factorySchema from "./factory.schema.js";

export const productionSchema = new mongoose.Schema({
    documentId: {type:String, unique: true},
    title: titleSchema,
    customer: customerSchema,
    factory: factorySchema
})


export default function createProductionModel(connection) {
  return connection.model("pt_production", productionSchema);
}

