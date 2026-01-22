
import axios from "axios";
import {
    CONFIG,
    HEADERS,
    CONSTANTS,
    constructSource,
    constructTarget,
    constructBatchRequest
} from "../../Config/translation.config.js";
import {
    uploadBlob,
    getBlobSasUrl,
    getContainerSasUrl,
    listBlobs,
    downloadBlobToString
} from "../../storage/azure.blob.storage.js";
import logger from "../../Utils/translation/logger.js";
import { LANGUAGE_MAP } from "../../Utils/translation/language.validator.js";
/**
 * Service to handle Azure Document Translation interactions.
 */
const AzureTranslatorService = {

    /**
     * Submits a batch translation job to Azure.
     * @param {string} customerId - Used for folder organization
     * @param {Array<{pageName: string, content: string}>} files - Array of files to translate
     * @param {string[]} targetLanguages - List of target language codes (e.g., ['fr', 'de'])
     * @returns {Promise<string>} - The Job ID
     */
    submitTranslationJob: async (customerId, files, targetLanguages) => {
        logger.info("Starting translation job submission", { customerId, fileCount: files.length, targetLanguages });

        try {
            const inputs = [];
            const sourceContainer = CONFIG.STORAGE.SOURCE_CONTAINER;
            const targetContainer = CONFIG.STORAGE.TARGET_CONTAINER;

            // 1. Prepare files and uploads
            for (const file of files) {
                const blobName = `${customerId}/${file.pageName}.html`;

                // Upload source HTML
                await uploadBlob(sourceContainer, blobName, file.content);

                // Generate SAS for source (Read access for specific blob)
                const sourceUrl = await getBlobSasUrl(sourceContainer, blobName);
                const source = constructSource(sourceUrl, ""); // Assuming source is 'en', can be parameterized

                // Generate SAS for target (Write access for container + specific output blob)
                const targets = await Promise.all(targetLanguages.map(async (lang) => {
                    // We define the specific output path: customerId/pageName-lang.html
                    const targetBlobName = `${customerId}/${file.pageName}-${lang}.html`;
                    // Use Blob SAS with Write/Delete permissions for the specific target file
                    const targetUrl = await getContainerSasUrl(targetContainer, targetBlobName);
                    return constructTarget(targetUrl, lang);
                }));

                inputs.push({ source, targets, storageType: "File" });
            }

            // 2. Submit to Azure
            const batchRequest = constructBatchRequest(inputs);

            logger.info("Sending Batch Request to Azure", {
                url: `${CONFIG.ENDPOINT}/translator/document/batches?api-version=${CONSTANTS.API_VERSION}`,
                ...batchRequest
            });

            const response = await axios.post(
                `${CONFIG.ENDPOINT}/translator/document/batches?api-version=${CONSTANTS.API_VERSION}`,
                batchRequest,
                { headers: HEADERS }
            );

            // 3. Extract Job ID
            // Operation-Location: .../batches/JOB_ID
            const operationLocation = response.headers["operation-location"];
            // Strip query params (like ?api-version) if present
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
     * @param {string} jobId 
     * @returns {Promise<Object>} Final job status
     */
    pollTranslationStatus: async (jobId) => {
        const startTime = Date.now();
        const pollUrl = `${CONFIG.ENDPOINT}/translator/document/batches/${jobId}?api-version=${CONSTANTS.API_VERSION}`;

        logger.info("Polling job status...", { jobId });

        while (Date.now() - startTime < CONSTANTS.TIMEOUT) {
            try {
                const response = await axios.get(pollUrl, { headers: HEADERS });
                const { status, error } = response.data;

                // If status is not active (Running/NotStarted), it's terminal.
                if (!["Running", "NotStarted"].includes(status)) {
                    if (status === "Succeeded" ||
                        error?.innerError?.code === "TargetFileAlreadyExists") {
                        logger.info("Translation job finished successfully", { jobId });
                        return response.data;
                    }
                    else {
                        // Log the full response to debug "undefined" error
                        logger.error("Translation job ended with non-success status", { status, fullResponse: response.data });
                        const errorDetails = response.data.error || response.data.errors || response.data;
                        throw errorDetails;
                    }
                }

                logger.debug(`Job status: ${status}. Waiting...`, { jobId });
                await new Promise(resolve => setTimeout(resolve, CONSTANTS.POLL_INTERVAL));

            } catch (error) {
                // If it's a known terminal status error, rethrow immediately
                throw error;
            }
        }

        throw new Error(`Polling timed out for job ${jobId}`);
    },

    /**
     * Retrieves the translated content from blob storage.
     * @param {string} customerId 
     * @param {Array<{pageName: string}>} originalFiles 
     * @param {string[]} languages 
     */
    getTranslatedContent: async (customerId, originalFiles, languages) => {
        logger.info("Retrieving translated content", { customerId });
        const results = [];
        const targetContainer = CONFIG.STORAGE.TARGET_CONTAINER;

        const allBlobs = await listBlobs(targetContainer, customerId);

        for (const file of originalFiles) {
            for (const lang of languages) {
                // Heuristic matching for the output file
                const match = allBlobs.find(b =>
                    b.includes(file.pageName) &&
                    b.toLowerCase().includes(lang.toLowerCase()) &&
                    b.endsWith(".html")
                );

                if (match) {
                    const content = await downloadBlobToString(targetContainer, match);
                    results.push({
                        name: match,
                        content: content,
                        toLang: Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === lang)
                    });
                } else {
                    logger.warn("Translated file not found", { pageName: file.pageName, lang });
                }
            }
        }

        return results;
    },

    formHtmlFile: (pageName, content) => ({ pageName, content }),

    /**
     * Gets supported languages for translation.
     * Currently returns hardcoded list as requested.
     */
    getSupportedLanguages: async () => {
        // In a real scenario, this could call Azure's languages API
        // https://api.cognitive.microsofttranslator.com/languages?api-version=3.0
        return [
            { code: "zh-Hans", name: "Chinese (Simplified)", value: "chinese" },
            { code: "en", name: "English", value: "english" },
            { code: "km", name: "Khmer", value: "khmer" }
        ];
    }
};

export default AzureTranslatorService;
