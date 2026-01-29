import { Language } from "../models/translation/index.js";
import AzureTranslatorService from "../services/translation/azure.translator.service.js";
import "../Utils/logger.js";

async function languagesSeed() {
    logger.info("🌐 Starting language seeding...");

    const languages = await AzureTranslatorService.getSupportedLanguages();
    logger.info(`📦 Languages fetched: ${languages.length}`);

    let insertedCount = 0;

    for (const lang of languages) {
        const result = await Language.updateOne(
            { code: lang.code },
            { $setOnInsert: { name: lang.name, code: lang.code } },
            { upsert: true }
        );

        if (result.upsertedCount) insertedCount++;
    }

    logger.info(`✅ Languages seeded successfully`);
    logger.info(`📈 Total languages: ${languages.length}, Inserted new: ${insertedCount}`);
}

export default languagesSeed;
