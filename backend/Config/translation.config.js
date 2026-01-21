
import dotenv from "dotenv";
dotenv.config();

const CONSTANTS = {
    API_VERSION: "2024-05-01",
    TIMEOUT: 2 * 60 * 1000, // 2 minutes
    POLL_INTERVAL: 5000, // 5 seconds
    RETRIES: 3,
};

const CONFIG = {
    ENDPOINT: process.env.DOCUMENT_TRANSLATION_ENDPOINT,
    KEY: process.env.AZURE_TRANSLATOR_KEY,
    REGION: process.env.AZURE_TRANSLATOR_REGION || "eastus",
    STORAGE: {
        CONNECTION_STRING: process.env.AZURE_BLOB_CONNECTION_STRING,
        SOURCE_CONTAINER: process.env.AZURE_SOURCE_CONTAINER || "instruction-source",
        TARGET_CONTAINER: process.env.AZURE_TARGET_CONTAINER || "instruction-target",
    }
};

const HEADERS = {
    'Ocp-Apim-Subscription-Key': CONFIG.KEY,
    'Ocp-Apim-Subscription-Region': CONFIG.REGION,
    'Content-Type': 'application/json'
};

/* -------------------------------------------------------------------------- */
/*                            Payload Constructors                            */
/* -------------------------------------------------------------------------- */

const constructSource = (sourceUrl, language) => {
    const base = {
        sourceUrl,
        storageSource: "AzureBlob"
    };
    if (language) base.language = language;
    return base;
};

const constructTarget = (targetUrl, language, glossaries = []) => {
    const base = {
        targetUrl,
        language,
        storageSource: "AzureBlob"
    };
    if (glossaries && glossaries.length > 0) {
        base.glossaries = glossaries;
    }
    return base;
};

const constructBatchRequest = (inputs) => ({ inputs });

export { CONSTANTS, CONFIG, HEADERS, constructSource, constructTarget, constructBatchRequest };
