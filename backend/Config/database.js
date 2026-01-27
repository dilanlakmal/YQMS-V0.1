import mongoose from "mongoose";
import "../Utils/logger.js";

let MONGODB_URI = process.env.MongoDB_URI_ym_prod;

if (process.env.NODE_ENV === "development"){
    MONGODB_URI = process.env.MongoDB_URI_ym_eco_board;
}

export async function connectDB() {
    try {
        mongoose.set("bufferCommands", false);

        await mongoose.connect(MONGODB_URI, {
            autoIndex: true,
        });

        logger.log("✅ MongoDB connected");
    } catch (err) {
        logger.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
}


export async function disconnectDB() {
    await mongoose.disconnect();
}