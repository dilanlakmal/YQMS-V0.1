import { Language } from "../models/translation/index.js";
import AzureTranslatorService from "../services/translation/azure.translator.service.js";

async function languagesSeed() {
    logger.info("🌐 Starting language seeding...");

    const languages = await AzureTranslatorService.getSupportedLanguages();
    logger.info(`📦 Languages fetched: ${languages.length}`);

    let insertedCount = 0;

    for (const lang of languages) {
        const result = await Language.updateOne(
        { code: lang.code },                        // match by code
        { $setOnInsert: { name: lang.name, code: lang.code } }, // insert if missing
        { upsert: true }
        );

        // MongoDB returns 'upsertedCount' in result in modern Mongoose
        if (result.upsertedCount) insertedCount++;
    }

    logger.info(`✅ Languages seeded successfully`);
    logger.info(`📈 Total languages: ${languages.length}, Inserted new: ${insertedCount}`);
}

export default languagesSeed;
