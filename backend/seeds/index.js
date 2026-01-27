import languagesSeed from "./languages.seed.js";
import progressSeed from "./instruction.translation.seed.js";
import { connectDB, disconnectDB } from "../Config/database.js";
import "../Utils/logger.js"

// Make sure logger is initialized globally or imported
// For example: import logger from "../utils/logger.js";
async function runSeeds() {
    try {
        // 1️⃣ Connect to DB
        await connectDB();

        // 2️⃣ Seed languages first
        logger.info("Seeding languages data ...");
        await languagesSeed();

        // 3️⃣ Seed instruction translation progress
        logger.info("Seeding instruction translation progress ...");
        await progressSeed();

        logger.info("✅ All seeds completed successfully!");
    } catch (err) {
        logger.error("❌ Seeding failed:", err);
    } finally {
        // 4️⃣ Disconnect DB
        await disconnectDB();
    }
}

// Execute the seeding
await runSeeds();
