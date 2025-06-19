import mongoose from "mongoose";

const subconFactorySchema = new mongoose.Schema(
  {
    no: {
      type: Number,
      required: true,
      unique: true
    },
    factory: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  {
    collection: "subcon_factories", // Explicitly set the collection name
    timestamps: true // Let Mongoose automatically handle createdAt and updatedAt
  }
);

// This function creates and returns the model, which can be used in your main server file
export default function createSubconFactoryModel(connection) {
  return connection.model("SubconFactory", subconFactorySchema);
}
