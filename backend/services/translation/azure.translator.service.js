import axios from "axios";
import {
    CONFIG,
    HEADERS,
    CONSTANTS,
    constructSource,
    constructTarget,
    constructBatchRequest,
    constructGlossary
} from "../../Config/translation.config.js";
import {
    uploadBlob,
    getBlobSasUrl,
    getContainerSasUrl,
    listBlobs,
    downloadBlobToString,
    deleteBlob
} from "../../storage/azure.blob.storage.js";
import { Glossary } from "../../models/translation/index.js";
/**
 * Service to handle Azure Document and Text Translation interactions.
 */
const AzureTranslatorService = {

    /**
     * Submits a batch translation job to Azure.
     * @param {string} customerId - Used for folder organization.
     * @param {Array<{pageName: string, content: string}>} files - Array of files to translate.
     * @param {string[]} targetLanguages - List of target language codes (e.g., ['fr', 'de']).
     * @returns {Promise<string>} - The Job ID.
     */
    submitTranslationJob: async (customerId, files, targetLanguages, suorceLanguage) => {
        logger.info("Starting translation job submission", { customerId, fileCount: files.length, targetLanguages });

        try {
            const inputs = [];
            const sourceContainer = CONFIG.STORAGE.SOURCE_CONTAINER;
            const targetContainer = CONFIG.STORAGE.TARGET_CONTAINER;
            const glossaryContainer = CONFIG.STORAGE.GLOSSARY_CONTAINER;

            // 1. Prepare files and uploads
            for (const file of files) {
                const blobName = `${customerId}/${file.pageName}.html`;

                // Upload source HTML
                await uploadBlob(sourceContainer, blobName, file.content);

                // Generate SAS for source (Read access for specific blob)
                const sourceUrl = await getBlobSasUrl(sourceContainer, blobName);
                const source = constructSource(sourceUrl, suorceLanguage);

                // Generate SAS for target (Write access for container + specific output blob)
                const targets = await Promise.all(targetLanguages.map(async (lang) => {
                    const targetBlobName = `${customerId}/${file.pageName}-${lang}.html`;
                    logger.info(`[Step 1] Target blob name generated: ${targetBlobName}`);

                    await deleteBlob(targetContainer, targetBlobName);

                    const targetUrl = await getContainerSasUrl(targetContainer, targetBlobName);
                    logger.info(`[Step 2] Target SAS URL generated for lang: ${lang}`);

                    const blobGlossaryName = `${customerId}/${suorceLanguage}-${lang}.tsv`;
                    logger.info(`[Step 3] Glossary blob name generated: ${blobGlossaryName}`);

                    const glossaryItems = await Glossary.getGlossaryItems(suorceLanguage, lang);
                    logger.info(`[Step 5] Retrieved ${glossaryItems.length} glossary items`);

                    let glossary = null;
                    if (glossaryItems.length > 0) {
                        const glossaryContent = glossaryItems.map(g => {
                            // Debug check: IS this source string present in the file content?
                            if (!file.content.includes(g.source)) {
                                logger.warn(`[Glossary Warning] Source term "${g.source}" NOT found in HTML content for file ${file.pageName}`);
                            }
                            return `${g.source}\t${g.target}`;
                        }).join("\n");

                        logger.info(`[Step 6] Glossary content prepared (First 50 chars): ${glossaryContent.substring(0, 50).replace(/\n/g, "\\n")}`);

                        await uploadBlob(glossaryContainer, blobGlossaryName, glossaryContent);
                        logger.info(`[Step 7] Glossary uploaded successfully`);

                        const glossaryUrl = await getBlobSasUrl(glossaryContainer, blobGlossaryName);
                        logger.info(`[Step 8] Glossary SAS URL generated`);

                        glossary = constructGlossary(glossaryUrl);
                        logger.info(`[Step 9] Glossary object constructed`);
                    } else {
                        logger.info(`[Step 6] No glossary items found for ${lang}, skipping glossary attachment.`);
                    }

                    const targetConfig = constructTarget(targetUrl, lang, glossary ? [glossary] : []);
                    return targetConfig;
                }));

                inputs.push({ source, targets, storageType: "File" });
            }

            // 2. Submit to Azure
            const batchRequest = constructBatchRequest(inputs);

            const response = await axios.post(
                `${CONFIG.ENDPOINT}/translator/document/batches?api-version=${CONSTANTS.API_VERSION}`,
                batchRequest,
                { headers: HEADERS }
            );

            // 3. Extract Job ID (Operation-Location: .../batches/JOB_ID)
            const operationLocation = response.headers["operation-location"];
            const operationUrlParts = operationLocation.split("?")[0];
            const jobId = operationUrlParts.split("/").pop();

            logger.info("Translation job submitted successfully", { jobId });
            return jobId;

        } catch (error) {
            logger.error("Failed to submit translation job", { error: error.message, data: error.response?.data });
            throw error;
        }
    },

    /**
     * Polls the status of a translation job until it completes or times out.
     * @param {string} jobId - The Job ID to poll.
     * @returns {Promise<Object>} Final job status.
     * @throws {Error} If polling times out or job fails.
     */
    pollTranslationStatus: async (jobId) => {
        const startTime = Date.now();
        const pollUrl = `${CONFIG.ENDPOINT}/translator/document/batches/${jobId}?api-version=${CONSTANTS.API_VERSION}`;

        logger.info("Polling job status...", { jobId });

        while (Date.now() - startTime < CONSTANTS.TIMEOUT) {
            try {
                const response = await axios.get(pollUrl, { headers: HEADERS });
                const { status, error } = response.data;

                // Terminal states
                if (!["Running", "NotStarted"].includes(status)) {
                    if (status === "Succeeded" || error?.innerError?.code === "TargetFileAlreadyExists") {
                        logger.info("Translation job finished successfully", { jobId });
                        return response.data;
                    } else {
                        logger.error("Translation job ended with non-success status", { status, fullResponse: response.data });
                        throw response.data.error || response.data.errors || response.data;
                    }
                }

                logger.debug(`Job status: ${status}. Waiting...`, { jobId });
                await new Promise(resolve => setTimeout(resolve, CONSTANTS.POLL_INTERVAL));

            } catch (error) {
                throw error; // Propagate error immediately
            }
        }

        throw new Error(`Polling timed out for job ${jobId}`);
    },

    /**
     * Retrieves the translated content from blob storage.
     * @param {string} customerId - The customer ID used as folder name.
     * @param {Array<{pageName: string}>} originalFiles - List of original files.
     * @param {string[]} languages - List of languages to retrieve.
     * @returns {Promise<Array<{name: string, content: string, toLang: string}>>} Translated contents.
     */
    getTranslatedContent: async (customerId, originalFiles, languages) => {
        logger.info("Retrieving translated content", { customerId });
        const results = [];
        const targetContainer = CONFIG.STORAGE.TARGET_CONTAINER;

        const allBlobs = await listBlobs(targetContainer, customerId);

        for (const file of originalFiles) {
            for (const lang of languages) {
                // Heuristic matching: looking for filename that contains pageName, lang code, and ends in .html
                const match = allBlobs.find(b => {
                    const blobName = b.name || "";
                    return blobName.includes(file.pageName) &&
                        blobName.toLowerCase().includes(lang.toLowerCase()) &&
                        blobName.endsWith(".html");
                });

                if (match) {
                    const content = await downloadBlobToString(targetContainer, match.name);
                    results.push({
                        name: match.name,
                        content: content,
                        toLang: lang
                    });
                } else {
                    logger.warn("Translated file not found", { pageName: file.pageName, lang });
                }
            }
        }

        return results;
    },

    /**
     * Fetches supported languages from Azure Translator API.
     * @returns {Promise<Array<{code: string, name: string}>>} List of supported languages.
     */
    getSupportedLanguages: async () => {
        try {
            const url = "https://api.cognitive.microsofttranslator.com/languages?api-version=3.0";
            const response = await axios.get(url);
            const languagesData = response.data.translation;

            return Object.keys(languagesData).map(code => ({
                code: code,
                name: languagesData[code].name
            }));
        } catch (error) {
            logger.error("Failed to fetch supported languages", { error: error.message });
            return [];
        }
    },

    /**
     * Detects the language of the provided text.
     * @param {string} text - The text to analyze.
     * @returns {Promise<string|null>} The detected language code or null.
     */
    detectLanguage: async (text) => {
        try {
            const response = await axios.post(
                "https://api.cognitive.microsofttranslator.com/detect?api-version=3.0",
                [{ text }],
                { headers: HEADERS }
            );
            return response.data[0]?.language || null;
        } catch (err) {
            logger.error("Azure language detection error:", err.response?.data || err.message);
            return null;
        }
    },

    /**
     * Translates a single text string.
     * @param {string} text - Text to translate.
     * @param {string} [fromLang] - Source language code.
     * @param {string} toLang - Target language code.
     * @returns {Promise<string>} The translated text.
     * @throws {Error} If inputs are missing or translation fails.
     */
    translateText: async (text, fromLang, toLang) => {
        if (!text || !toLang) {
            throw new Error("Text and target language are required");
        }

        const params = { to: toLang };
        if (fromLang) {
            params.from = fromLang;
        }

        try {
            const response = await axios.post(
                "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0",
                [{ text }],
                { headers: HEADERS, params }
            );

            return response.data[0]?.translations[0]?.text || "";
        } catch (err) {
            logger.error("Azure translation error", {
                fromLang,
                toLang,
                error: err.response?.data || err.message
            });

            throw new Error(err.response?.data?.error?.message || "Translation failed");
        }
    }
};

export default AzureTranslatorService;
