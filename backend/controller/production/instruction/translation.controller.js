

import AzureTranslatorService from "../../../services/translation/azure.translator.service.js";
import { getPdf } from "./extraction/page.extraction.controller.js";
import { getProductionByDocId, update } from "../production.controller.js";
import { flattenLocalizedStrings, generateHtmlFromEntries, reconstructObjectFromHtml, deepMergeObjects } from "../../../Utils/translation/file.convertor.js";
import logger from "../../../Utils/translation/logger.js";
import { validateAndMapLanguages } from "../../../Utils/translation/language.validator.js";



const azureTranslateController = async (req, res) => {
    const { docId, toLanguages } = req.body;
    const requestId = `req-${Date.now()}`; // Simple request ID for tracing

    logger.info("Received translation request", { requestId, docId, toLanguages });

    if (!docId || !Array.isArray(toLanguages) || toLanguages.length === 0) {
        return res.status(400).json({ message: "docId and toLanguages (array) are required" });
    }

    let targetLanguageCodes;
    try {
        targetLanguageCodes = validateAndMapLanguages(toLanguages);
    } catch (e) {
        return res.status(400).json({ message: e.message });
    }

    try {
        // 1. Fetch Data
        const [doc, instruction] = await Promise.all([
            getPdf(docId),
            getProductionByDocId(docId)
        ]);

        if (!doc || !instruction) {
            throw new Error("Document or Instruction not found");
        }

        const customerId = doc.customer || "default-customer";

        // 2. Flatten Content
        logger.info("Flattening content...", { requestId });
        // We extract content based on the SOURCE language (e.g., "english"). 
        // We assume "english" is the source for now. 
        // If we want to support multiple source languages, we need to know which one to pick.
        let instructionObject = { ...instruction };
        if (Object.getPrototypeOf(instruction) !== Object.prototype) {
            instructionObject = instruction.toObject();
        }
        const flattenedEntries = flattenLocalizedStrings(instructionObject, toLanguages);

        if (flattenedEntries.length === 0) {
            logger.warn("No content found to translate (checking for 'english' keys)", { requestId });
            return res.status(400).json({ message: "No translatable content found for source 'english'." });
        }

        const htmlContent = generateHtmlFromEntries(flattenedEntries);

        const htmlFiles = [
            AzureTranslatorService.formHtmlFile("content", htmlContent)
        ];

        // 3. Submit Translation Job
        logger.info("Submitting job to Azure...", { requestId });
        const jobId = await AzureTranslatorService.submitTranslationJob(customerId, htmlFiles, targetLanguageCodes);

        // 4. Poll for Completion
        logger.info("Waiting for translation...", { requestId, jobId });
        await AzureTranslatorService.pollTranslationStatus(jobId);

        // 5. Download Results
        logger.info("Downloading translated files...", { requestId });
        const translatedContents = await AzureTranslatorService.getTranslatedContent(customerId, htmlFiles, targetLanguageCodes);
        if (translatedContents.length === 0) {
            throw new Error("No translated content retrieved from storage.");
        }

        // 6. Reconstruct[1] {"timestamp":"2026-01-20T06:20:07.484Z","level":"ERROR","message":"Translation workflow failed","requestId":"req-1768890005253","error":"Request failed with status code 400","stack":"AxiosError: Request failed with status code 400\n    at settle (file:///D:/YM/YQMS/YQMS-V0.1/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (file:///D:/YM/YQMS/YQMS-V0.1/node_modules/axios/lib/adapters/http.js:793:11)\n    at IncomingMessage.emit (node:events:536:35)\n    at endReadableNT (node:internal/streams/readable:1698:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)\n    at Axios.request (file:///D:/YM/YQMS/YQMS-V0.1/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async Object.submitTranslationJob (file:///D:/YM/YQMS/YQMS-V0.1/backend/services/translation/azure.translator.service.js:62:30)\n    at async azureTranslateController (file:///D:/YM/YQMS/YQMS-V0.1/backend/controller/production/instruction/translation.controller.js:44:23)"}
        logger.info("Reconstructing JSON...", { requestId });
        const reconstructedTranslation = reconstructObjectFromHtml(
            translatedContents,
            toLanguages,
            flattenedEntries
        );

        // 7. Update Database
        logger.info("Updating database...", { requestId });
        // Use toObject() to ensure we are merging into a plain JS object, avoiding Mongoose internal casting issues
        const baseInstruction = typeof instruction.toObject === 'function' ? instruction.toObject() : instruction;
        const translatedDocument = deepMergeObjects(baseInstruction, reconstructedTranslation);
        const updated = await update(docId, translatedDocument);

        logger.info("Translation workflow completed successfully.", { requestId });
        return res.json(updated);

    } catch (error) {
        logger.error("Translation workflow failed", { requestId, error: error.message, stack: error.stack });

        return res.status(500).json({
            message: "Translation process failed",
            error: error.message,
            requestId
        });
    }
};

const getLanguages = async (req, res) => {
    try {
        const languages = await AzureTranslatorService.getSupportedLanguages();
        return res.json(languages);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch languages", error: error.message });
    }
};

export { getLanguages };
export default azureTranslateController;
