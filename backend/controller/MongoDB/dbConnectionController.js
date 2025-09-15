import mongoose from "mongoose";

//Schemas
import creatQCRealWashQty from '../../models/QCRealWashingQty.js';

//MongoDB Connections
export const ymProdConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);
export const ymEcoConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_eco_board?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

//Connection status
ymProdConnection.on("connected", () =>
  console.log("✅ Connected to ym_prod database in 192.167.1.10:29000...")
);
ymProdConnection.on("error", (err) => console.error("❌ unexpected error:", err));

ymEcoConnection.on("connected", () =>
  console.log("✅ Connected to ym_eco_board database in 192.167.1.10:29000...")
);
ymEcoConnection.on("error", (err) => console.error("❌ unexpected error:", err));

//Collections
export const QCRealWashQty = creatQCRealWashQty(ymProdConnection);

//Disconnect DB connection
export async function disconnectMongoDB() {
    try {
        await mongoose.disconnect();
        console.log('MongoDB connections closed.');
    } catch (error) {
        console.error('Error disconnecting MongoDB:', error);
        throw error; // Re-throw to allow calling function to handle
    }
}

