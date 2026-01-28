import languagesSeed from "./languages.seed.js";
import progressSeed from "./instruction.translation.seed.js";
import { connectDB, disconnectDB } from "../Config/database.js";

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
        process.exit(1);
    } finally {
        // 4️⃣ Disconnect DB
        await disconnectDB();
        process.exit(0);
    }
}

// Execute the seeding
await runSeeds();
