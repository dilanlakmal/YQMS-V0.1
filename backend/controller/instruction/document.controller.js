import { Document } from "../../models/instruction/index.js";
import { ensureContainerExists, uploadBlob, deleteBlob, listBlobs, downloadBlob, deleteBlobsByPrefix } from "../../storage/azure.blob.storage.js";
import { CONFIG } from "../../Config/translation.config.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import pdf from "pdf-poppler";
import crypto from "crypto";
import mongoose from "mongoose";
import "../../Utils/logger.js";
import { Instruction } from "../../models/instruction/index.js";
import { LLMImageExtractor } from "../ai/extractor/ollama.extract.controller.js";
import AzureTranslatorService from "../../services/translation/azure.translator.service.js";
import { Translation, Content, Language, Glossary } from "../../models/translation/index.js";
import { load } from "cheerio";

/**
 * Storage Controller Sub-Module
 * Handles blob storage operations directly.
 */
const storageController = {
    /**
     * Lists all blobs in a specified container.
     */
    getBlobsByContainer: async (req, res) => {
        try {
            const containerName = req.params.container;

            if (!containerName) {
                return res.status(400).json({ message: "Container name is required." });
            }

            const blobs = await listBlobs(containerName);

            // Map to a clean response including metadata
            const result = blobs.map(b => ({
                name: b.name,
                url: b.url,
                metadata: b.metadata || {},
                properties: b.properties || {}
            }));

            res.json({ container: containerName, blobs: result });
        } catch (error) {
            logger.error(`Failed to get blobs from container ${req.params.container}`, { error: error.message });
            res.status(500).json({ message: "Failed to fetch blobs", error: error.message });
        }
    },

    /**
     * Deletes all blobs in a specified container.
     */
    deleteBlobsByContainer: async (req, res) => {
        try {
            const containerName = req.params.container;

            if (!containerName) {
                return res.status(400).json({ message: "Container name is required." });
            }

            const blobs = await listBlobs(containerName);

            if (!blobs.length) {
                return res.status(404).json({ message: `No blobs found in container: ${containerName}` });
            }

            // Delete all blobs in parallel safely
            const deleteResults = await Promise.allSettled(
                blobs.map(b => deleteBlob(containerName, b.name))
            );

            // Summarize results
            const summary = deleteResults.map((r, i) => ({
                blob: blobs[i].name,
                status: r.status,
                reason: r.reason?.message || null
            }));

            logger.info(`Deleted blobs from container ${containerName}`, { summary });

            res.json({
                message: `Processed deletion of ${blobs.length} blobs in container: ${containerName}`,
                summary
            });
        } catch (error) {
            logger.error(`Failed to delete blobs from container ${req.params.container}`, { error: error.message });
            res.status(500).json({ message: "Failed to delete blobs", error: error.message });
        }
    }
};

const extractController = {

    convertPdfToImage: async (req, res) => {
        let tempDir = null;
        try {
            const { userId, docId } = req.params;
            const doc = await Document.findOne({ _id: docId, user_id: userId, type: "instruction" });
            if (!doc) {
                return res.status(404).json({ message: "Document not found" });
            }
            // 2. Extract Container and Blob Name safely
            const urlObj = new URL(doc.source || "");
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);

            // In Azure Blob Storage:
            // Production: https://account.blob.core.windows.net/container/blob.pdf -> pathParts: ['container', 'blob.pdf']
            // Emulator: http://127.0.0.1:10000/devstoreaccount1/container/blob.pdf -> pathParts: ['devstoreaccount1', 'container', 'blob.pdf']

            let containerName, blobName;
            if (urlObj.hostname === "127.0.0.1" || urlObj.hostname === "localhost") {
                containerName = pathParts[1];
                blobName = pathParts.slice(2).join('/');
            } else {
                containerName = pathParts[0];
                blobName = pathParts.slice(1).join('/');
            }

            if (!containerName || !blobName) {
                logger.error(`Invalid source URL: ${doc.source}`);
                return res.status(400).json({ message: "Invalid document source URL" });
            }

            logger.info(`Source Extraction: Container=${containerName}, Blob=${blobName}`);

            // 2.1 Check if already extracted
            const baseBlobName = path.parse(blobName).name;
            if ((doc.status === "imageExtracted" || doc.status === "fieldExtracted") && doc.imageExtracted?.length > 0) {
                logger.info(`Document ${docId} already has imageExtracted status. Verifying storage...`);

                // Verify if folder exists by listing blobs with the prefix
                const existingBlobs = await listBlobs(containerName, `${baseBlobName}/`);
                if (existingBlobs.length > 0) {
                    logger.info(`Found ${existingBlobs.length} existing images in storage. Skipping conversion.`);
                    return res.json({
                        message: "Already processed",
                        images: doc.imageExtracted,
                        totalCount: existingBlobs.length
                    });
                }
                logger.warn(`DB marked as extracted but no images found in storage for prefix: ${baseBlobName}/. Re-processing...`);
            }

            // 3. Download PDF
            logger.info(`Downloading PDF from Azure storage (DocID: ${docId})...`);
            const pdfBuffer = await downloadBlob(containerName, blobName);

            if (!pdfBuffer || pdfBuffer.length === 0) {
                throw new Error("Downloaded PDF buffer is empty");
            }
            logger.info(`Downloaded PDF: ${pdfBuffer.length} bytes.`);

            // Create temp directory
            tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf_conv_"));
            const tempPdfPath = path.join(tempDir, "input.pdf");
            await fs.writeFile(tempPdfPath, pdfBuffer);

            // 5. Convert to Image
            logger.info("Converting to image...");

            const opts = {
                format: "jpeg",
                out_dir: tempDir,
                out_prefix: "page",
                page: null // Convert all pages
            };

            await pdf.convert(tempPdfPath, opts);

            // List generated files
            const files = await fs.readdir(tempDir);
            const imageFiles = files.filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg"));

            const uploadedUrls = [];

            logger.info(`Uploading ${imageFiles.length} images...`);

            for (const file of imageFiles) {
                const filePath = path.join(tempDir, file);
                const fileBuffer = await fs.readFile(filePath);

                // Extract page number from filename (page-1.jpg -> 1)
                const pageNumMatch = file.match(/-(\d+)\.jpg$/);
                const pageNum = pageNumMatch ? pageNumMatch[1] : "1";

                // New blob name: sourceBlobName/pageNumber.jpg
                const newBlobName = `${baseBlobName}/${pageNum}.jpg`;

                logger.info(`Uploading image to: ${newBlobName}`);
                const url = await uploadBlob(containerName, newBlobName, fileBuffer, {
                    originalDocId: docId.toString(),
                    page: pageNum,
                    sourceBlob: blobName
                });
                uploadedUrls.push(url);
            }

            // Update Document
            await Document.findByIdAndUpdate(docId, {
                $set: {
                    imageExtracted: uploadedUrls,
                    status: "imageExtracted"
                }
            });

            // Cleanup: Delete original PDF blob after conversion
            // try {
            //     await deleteBlob(containerName, blobName);
            //     logger.info(`Source PDF blob ${blobName} deleted after conversion.`);
            // } catch (cleanupError) {
            //     logger.warn(`Failed to delete source PDF blob: ${cleanupError.message}`);
            // }

            logger.info(`PDF conversion complete. ${uploadedUrls.length} images processed.`);
            res.json({ message: "Conversion successful", images: uploadedUrls });

        } catch (error) {
            logger.error("convertPdfToImage error:", error.message);
            res.status(500).json({ message: "Failed to convert PDF to image", error: error.message });
        } finally {
            // Cleanup temp dir
            if (tempDir) {
                try {
                    await fs.rm(tempDir, { recursive: true, force: true });
                } catch (e) {
                    logger.warn("Failed to cleanup temp dir", e);
                }
            }
        }
    },
    extractFields: async (req, res) => {
        try {
            const { docId } = req.params;
            const userId = req.body.userId;
            const pageNumber = req.body.pageNumber;


            const doc = await Document.findOne({ _id: docId, user_id: userId });
            if (!doc) {
                logger.warn(`Document not found for extraction: ID=${docId}, User=${userId}`);
                return res.status(404).json({ message: "Document not found" });
            }

            const instruction = await Instruction.findOne({ document_id: docId });
            if (!instruction) {
                logger.warn(`Instruction not found for document: ID=${docId}`);
                return res.status(404).json({ message: "Associated instruction record not found" });
            }

            // If already extracted, skip and return instruction info
            if (doc.status === "fieldExtracted") {
                logger.info(`Fields already extracted for document: ${docId}. Returning existing record.`);
                return res.json({
                    message: "Fields already extracted",
                    instructionId: instruction._id,
                    detectedLanguage: await instruction.getDetectedLanguage(),
                    data: await Instruction.getInstruction(docId)
                });
            }

            if (doc.status !== "imageExtracted") {
                logger.warn(`Document ${docId} is in status '${doc.status}', expected 'imageExtracted'`);
                return res.status(400).json({ message: "Document is not ready for extraction (must be in 'imageExtracted' status)" });
            }

            // 1. Get Image and convert to Base64
            const imageUrl = doc.imageExtracted[pageNumber - 1];
            if (!imageUrl) {
                return res.status(400).json({ message: `Image for page ${pageNumber} not found` });
            }

            logger.info(`Extracting fields from page ${pageNumber}...`);
            // Safe URL extraction
            const urlObj = new URL(imageUrl || "");
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);

            let containerName, blobName;
            if (urlObj.hostname === "127.0.0.1" || urlObj.hostname === "localhost") {
                containerName = pathParts[1];
                blobName = pathParts.slice(2).join('/');
            } else {
                containerName = pathParts[0];
                blobName = pathParts.slice(1).join('/');
            }

            if (!containerName || !blobName) {
                throw new Error(`Invalid image URL for extraction: ${imageUrl}`);
            }

            const imageBuffer = await downloadBlob(containerName, blobName);
            const imageBase64 = imageBuffer.toString('base64');

            // 2. Get dynamic schema for VLM
            const schema = await instruction.getDynamicSchema();

            // 3. Extract using VLM
            logger.time(`Extraction-Page-${pageNumber}`);
            const result = await LLMImageExtractor(imageBase64, schema);
            logger.timeEnd(`Extraction-Page-${pageNumber}`);

            if (!result) {
                throw new Error("No data returned from AI extractor");
            }

            // 4. Update the instruction model and its annotations
            logger.info("Updating instruction fields from AI result...");
            const updatedInstruction = await instruction.updateInstruction(result);

            // 5. Update Document Status
            await Document.findByIdAndUpdate(docId, { $set: { status: "fieldExtracted" } });

            logger.info(`Fields extracted successfully for document: ${docId}`);
            res.json({
                message: "Fields extracted and saved successfully",
                instructionId: updatedInstruction._id,
                detectedLanguage: await updatedInstruction.getDetectedLanguage(),
                data: await Instruction.getInstruction(docId)
            });

        } catch (error) {
            const isConnectionError = error.message?.includes("Ollama service unreachable");
            logger.error("extractFields error:", {
                error: error.message,
                stack: error.stack,
                type: isConnectionError ? "ConnectionError" : "GeneralError"
            });

            res.status(isConnectionError ? 503 : 500).json({
                message: isConnectionError
                    ? "AI Extraction Service (Ollama) is currently unreachable. Please ensure the service is running."
                    : "Failed to extract fields",
                error: error.message
            });
        }
    },

    getInstruction: async (req, res) => {
        try {
            const { docId } = req.params;

            logger.info(`Fetching instruction data for document: ${docId}`);

            // 1. Find the instruction for this document using the static method (fully populated)
            const instruction = await Instruction.getInstruction(docId);

            if (!instruction) {
                logger.warn(`Instruction not found for document: ${docId}`);
                return res.status(404).json({ message: "Instruction data not found for this document" });
            }

            // 2. Get detected language
            const detectedLanguage = await instruction.getDetectedLanguage();

            logger.info(`Instruction retrieved successfully: ID=${instruction._id}, DetectedLang=${detectedLanguage}`);

            // 3. Return the populated instruction data
            res.json({
                ...instruction.toObject(),
                detectedLanguage
            });

        } catch (error) {
            logger.error("getInstruction error:", {
                docId,
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ message: "Failed to fetch instruction data", error: error.message });
        }
    },

};

const translationController = {
    generateHtmlFromEntries: (contents) => {
        const contentHtml = contents
            .map(({ _id, original }) => `
            <section class="content-block">
                <p id="${_id}">${original}</p>
            </section>`)
            .join('\n');

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Exported Content</title>
        </head>
        <body>
        ${contentHtml}
        </body>
        </html>
        `;
    },
    getHTMLFile: async (req, res) => {
        try {
            const { instructionId } = req.params;

            // 1. Get Instruction and all associated contents
            const instruction = await Instruction.findById(instructionId);
            if (!instruction) {
                return res.status(404).json({ message: "Instruction not found" });
            }

            const contents = await instruction.getAllContents();
            if (!contents || contents.length === 0) {
                return res.status(400).json({ message: "No content found in this instruction to translate" });
            }

            const htmlContent = translationController.generateHtmlFromEntries(contents);
            res.send(htmlContent);
        } catch (error) {
            logger.error("getHTMLFile error:", { error: error.message, stack: error.stack });
            res.status(500).json({ message: "Failed to fetch HTML file", error: error.message });
        }
    },
    translate: async (req, res) => {
        try {
            const { userId, instructionId, targetLanguages } = req.body;

            if (!instructionId || !targetLanguages || !Array.isArray(targetLanguages)) {
                return res.status(400).json({ message: "instructionId and targetLanguages (array) are required" });
            }

            // 1. Get Instruction and all associated contents
            const instruction = await Instruction.findById(instructionId);
            if (!instruction) {
                return res.status(404).json({ message: "Instruction not found" });
            }

            const contents = await instruction.getAllContents();
            if (!contents || contents.length === 0) {
                return res.status(400).json({ message: "No content found in this instruction to translate" });
            }

            logger.info(`Starting translation workflow for Instruction: ${instructionId} (User: ${userId})`);

            // 2. Generate HTML for Azure Document Translation
            const htmlContent = translationController.generateHtmlFromEntries(contents);
            const files = [{
                pageName: `instruction_${instructionId}`,
                content: htmlContent
            }];

            // 3. Submit Batch Translation Job to Azure
            logger.info("Submitting translation job to Azure...");
            const sourceLnague = await instruction.getDetectedLanguage();
            const jobId = await AzureTranslatorService.submitTranslationJob(userId, files, targetLanguages, sourceLnague);

            // 4. Poll for Completion
            logger.info(`Job submitted. ID: ${jobId}. Polling for status...`);
            await AzureTranslatorService.pollTranslationStatus(jobId);

            // 5. Retrieve Translated Content
            logger.info("Retrieving translated HTML files from storage...");
            const results = await AzureTranslatorService.getTranslatedContent(userId, files, targetLanguages);

            // 6. Parse HTML Results and Update Database
            logger.info(`Processing ${results.length} translation result(s)...`);

            for (const result of results) {
                const $ = load(result.content);
                const toLang = result.toLang;

                for (const contentDoc of contents) {
                    let translatedText = $(`p[id="${contentDoc._id}"]`).text().trim();

                    if (translatedText) {
                        logger.info(`Saving translation for content ${contentDoc._id}, lang: ${toLang}`);
                        await Translation.updateOne(
                            { content: contentDoc._id, code: toLang },
                            {
                                $set: {
                                    content: contentDoc._id,
                                    code: toLang,
                                    translated: translatedText
                                }
                            },
                            { upsert: true }
                        );

                        // Mark content as translated if not already
                        if (!contentDoc.translated) {
                            logger.info(`Marking content ${contentDoc._id} as translated.`);
                            await Content.updateOne(
                                { _id: contentDoc._id },
                                { $set: { translated: true } }
                            );
                        }
                    }
                }
                logger.info(`Finished processing translations for result with target lang: ${toLang}`);
            }

            logger.info(`Translation workflow completed for Instruction: ${instructionId}`);

            res.json({
                message: "Translation completed and database updated successfully",
                jobId: jobId,
                filesProcessed: results.length,
                targetLanguages
            });

        } catch (error) {
            logger.error("translate error:", { error: error.message, stack: error.stack });
            res.status(500).json({ message: "Failed to translate instruction contents", error: error.message });
        }
    },
    getSupportedLanguages: async (req, res) => {
        try {
            const languages = await AzureTranslatorService.getSupportedLanguages();
            res.json(languages);
        } catch (error) {
            logger.error("getSupportedLanguages error:", error);
            res.status(500).json({ message: "Failed to fetch supported languages" });
        }
    },
    detectLanguage: async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) return res.status(400).json({ message: "Text is required for detection" });

            const code = await AzureTranslatorService.detectLanguage(text);
            res.json({ code });
        } catch (error) {
            logger.error("detectLanguage error:", error);
            res.status(500).json({ message: "Failed to detect language" });
        }
    },
    translateStaticContent: async (req, res) => {
        try {
            const { text, toLanguage } = req.body;
            if (!text || !toLanguage) {
                return res.status(400).json({ message: "Text and toLanguage are required" });
            }

            // 1. Find if Content exists by original text
            let contentDoc = await Content.findOne({ original: text }).populate("language");

            if (!contentDoc) {
                // 2. If not exist, create it (will auto-detect language)
                contentDoc = await Content.createWithText({ originalText: text });
                // Populate language to get the code
                await contentDoc.populate("language");
            }

            const sourceCode = contentDoc.language?.code || "en";

            // 3. Check if default/source language is same as toLanguage
            if (sourceCode === toLanguage) {
                return res.json({
                    original: text,
                    translated: text,
                    language: toLanguage,
                    source: sourceCode
                });
            }

            // 4. Translate it (this method has internal caching for translations)
            const translatedText = await contentDoc.translateText(toLanguage);

            res.json({
                original: text,
                translated: translatedText,
                language: toLanguage,
                source: sourceCode
            });

        } catch (error) {
            logger.error("translateStaticContent error:", error);
            res.status(500).json({ message: "Failed to translate static content", error: error.message });
        }
    },
    updateInstruction: async (req, res) => {
        try {
            const { docId } = req.params;
            const { userId, sections } = req.body;

            const instruction = await Instruction.findOne({ document_id: docId });
            if (!instruction) {
                return res.status(404).json({ message: "Instruction not found" });
            }

            if (!sections || !Array.isArray(sections)) {
                return res.status(400).json({ message: "Sections array is required" });
            }

            // Implementation for dynamic updates
            // 1. Loop through sections and fields to update content
            for (const section of sections) {
                const existingSection = instruction.sections.find(s => s.id === section.id);
                if (!existingSection) {
                    // Logic to handle newly added sections could go here
                    continue;
                }

                for (const field of section.fields) {
                    const existingField = existingSection.fields.find(f => f.key === field.key);
                    if (!existingField) continue;

                    // Update Original Text for Value (and Label if needed)
                    if (field.value && typeof field.value === 'object') {
                        const annot = await Annotation.findById(existingField.value);
                        if (annot) await annot.updateOriginalText(field.value.english);
                    }
                    if (field.label && typeof field.label === 'object') {
                        const annot = await Annotation.findById(existingField.label);
                        if (annot) await annot.updateOriginalText(field.label.english);
                    }
                }
            }

            // Note: This is an incremental update. Full section list synchronization (add/delete)
            // would require more complex diffing logic.

            logger.info(`Instruction annotations updated for document: ${docId}`);
            res.json({ message: "Instruction updated successfully" });

        } catch (error) {
            logger.error("updateInstruction error:", error);
            res.status(500).json({ message: "Failed to update instruction", error: error.message });
        }
    },
    getInstructionTranslated: async (req, res) => {
        try {
            const { instructionId, languageCode } = req.params;

            if (!mongoose.Types.ObjectId.isValid(instructionId)) {
                return res.status(400).json({ message: "Invalid instructionId" });
            }

            const instruction = await Instruction.findById(instructionId);

            if (!instruction) {
                return res.status(404).json({ message: "Instruction not found" });
            }

            // Get data translated to the specific language
            const result = await instruction.getTranslatedInstruction(languageCode);

            // Return flattened structure matching the new schema
            res.json({
                ...result, // This contains the full instruction structure with translated values
                language: languageCode
            });

        } catch (error) {
            logger.error("getInstructionTranslated error:", error);
            res.status(500).json({ message: "Failed to fetch translated instruction", error: error.message });
        }
    },
    getInstructionById: async (req, res) => {
        try {
            const { instructionId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(instructionId)) {
                return res.status(400).json({ message: "Invalid instructionId" });
            }

            const instruction = await Instruction.findById(instructionId);

            if (!instruction) {
                return res.status(404).json({ message: "Instruction not found" });
            }

            // Get full hydrated structure (original + all translations)
            const result = await instruction.getFormattedData();

            res.json({
                instructionId: instruction._id,
                documentId: instruction.document_id,
                detectedLanguage: instruction.detected_language,
                ...result
            });

        } catch (error) {
            logger.error("getInstructionById error:", error);
            res.status(500).json({ message: "Failed to fetch instruction", error: error.message });
        }
    }
};

/**
 * Document Controller
 * Handles document uploads and management.
 */
const documentController = {

    /**
     * Uploads a document file, hashes it, checks for duplicates, and stores it in Azure Blob Storage.
     * @param {Object} req 
     * @param {Object} res 
     */
    upload: async (req, res) => {
        try {
            const user_id = req.body.userId;
            const file = req.file;

            if (!user_id) {
                logger.warn("Upload failed: user_id is missing");
                return res.status(400).json({ message: "user_id is required" });
            }

            if (!file) {
                logger.warn("Upload failed: file is missing");
                return res.status(400).json({ message: "File is required" });
            }

            logger.info(`Starting document upload for user: ${user_id}`);
            logger.info(`File details: Name=${file.originalname}, Size=${file.size}, MimeType=${file.mimetype}`);

            const docType = "instruction";
            const status = "uploaded";

            // Read file (non-blocking)
            const fileBuffer = await fs.readFile(file.path);
            const ext = path.extname(file.originalname).toLowerCase();
            const hash = crypto
                .createHash("sha256")
                .update(fileBuffer)
                .digest("hex");

            const existingDoc = await Document.findOne({
                user_id,
                hash
            });

            if (existingDoc) {
                logger.info(`File duplicate detected for user ${user_id}. Hash: ${hash}`);
                return res.status(409).json({
                    message: "This file was already uploaded",
                    document: existingDoc
                });
            }

            // Create document first (we need _id)
            const doc = await Document.create({
                type: docType,
                status,
                user_id
            });

            await ensureContainerExists(user_id);

            const blobName = `${doc._id}${ext}`;

            // Upload to blob storage
            const blob = await uploadBlob(user_id, blobName, fileBuffer, { userId: user_id });

            // Update source AFTER upload
            const updatedDoc = await Document.findByIdAndUpdate(doc._id, {
                $set: {
                    source: blob,
                    active: true,
                    hash: hash,
                    file_name: file.originalname
                }
            }, { new: true }); // Return updated document

            logger.info(`Initializing instruction structure for document: ${doc._id}`);
            await Instruction.initialize(doc._id, file.originalname);

            logger.info(`Document uploaded successfully: ID=${doc._id}, Source=${blob}`);

            return res.status(201).json({
                message: "Document uploaded successfully",
                document: updatedDoc
            });

        } catch (error) {
            logger.error("Upload document error:", { error: error.message, stack: error.stack });
            return res.status(500).json({
                message: "Failed to upload document",
                error: error.message
            });
        }
    },

    /**
     * Gets all documents for a user.
     * @param {Object} req 
     * @param {Object} res 
     */
    getDocsByUser: async (req, res) => {
        try {
            const { userId } = req.params;

            logger.info(`Fetching documents for user: ${userId}`);

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                logger.warn(`Invalid userId provided: ${userId}`);
                return res.status(400).json({
                    message: "Invalid userId"
                });
            }

            const docs = await Document
                .find({ user_id: userId })
                .sort({ createdAt: -1 })
                .lean();

            logger.info(`Successfully fetched ${docs.length} documents for user: ${userId}`);

            return res.status(200).json({
                count: docs.length,
                documents: docs
            });

        } catch (error) {
            logger.error("Get documents by user error:", { error: error.message });

            return res.status(500).json({
                message: "Failed to fetch documents",
                error: error.message
            });
        }
    },

    /**
     * Deletes all documents and their associated blobs for a user.
     * @param {Object} req 
     * @param {Object} res 
     */
    deleteAllByUser: async (req, res) => {
        const { userId } = req.params;

        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid userId" });
            }

            // 1. Find all documents for this user
            const userDocs = await Document.find({ user_id: userId }).select("_id");
            const docIds = userDocs.map(d => d._id);

            if (docIds.length > 0) {
                // 2. Find all instructions for these documents
                const instructions = await Instruction.find({ document_id: { $in: docIds } });

                // 3. Delete DB Data (Recursive)
                for (const inst of instructions) {
                    try {
                        const instructionId = inst._id;
                        await inst.deleteRelated();

                        // Also clean up translation containers for each instruction
                        await deleteBlobsByPrefix(CONFIG.STORAGE.SOURCE_CONTAINER, `${userId}/instruction_${instructionId}`);
                        await deleteBlobsByPrefix(CONFIG.STORAGE.TARGET_CONTAINER, `${userId}/instruction_${instructionId}`);
                    } catch (instError) {
                        logger.error(`Recursive delete failed for instruction ${inst._id}:`, instError);
                    }
                }

                // 4. Cleanup remaining database records
                const { Progress } = await import("../../models/instruction/index.js");
                await Progress.deleteMany({ document_id: { $in: docIds } });
                await Document.deleteMany({ user_id: userId });

                // 5. Cleanup primary storage container (user's PDF and images)
                try {
                    const blobs = await listBlobs(userId);
                    if (blobs && blobs.length > 0) {
                        await Promise.allSettled(blobs.map(b => deleteBlob(userId, b.name)));
                    }
                } catch (blobError) {
                    logger.error("Bulk primary blob deletion error:", { error: blobError.message });
                }

                logger.info(`Bulk cleanup complete for user ${userId}. ${docIds.length} documents removed.`);
            }

            res.json({ message: "All documents and related sources deleted successfully." });

        } catch (error) {
            logger.error("deleteAllByUser error:", { error: error.message });
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    },

    /**
     * Deletes a specific document and its associated blob.
     * @param {Object} req 
     * @param {Object} res 
     */
    deleteOneByUser: async (req, res) => {
        const { userId, docId } = req.params;

        try {
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(docId)) {
                return res.status(400).json({ message: "Invalid userId or docId" });
            }

            // 1. Fetch document to get metadata
            const doc = await Document.findOne({ _id: docId, user_id: userId });

            if (!doc) {
                logger.warn(`Document deletion failed: Not found. ID=${docId}, User=${userId}`);
                return res.status(404).json({ message: "Document not found." });
            }

            // 2. Find Associated Instruction
            const instruction = await Instruction.findOne({ document_id: docId });
            const instructionId = instruction?._id;

            // 3. First, delete DB data (Instruction, Annotations, Contents, Translations)
            if (instruction) {
                await instruction.deleteRelated();
                logger.info(`Recursively deleted instruction and AI database data for document ${docId}`);
            }

            // 4. Delete Progress and Document from MongoDB
            const { Progress } = await import("../../models/instruction/index.js");
            await Progress.deleteOne({ document_id: docId });
            await Document.deleteOne({ _id: docId, user_id: userId });

            // 5. Cleanup Azure Storage
            // 5a. Primary container: delete PDF and images (prefix is docId)
            const basePrefix = docId.toString();
            try {
                await deleteBlobsByPrefix(userId, basePrefix);
            } catch (blobError) {
                logger.error(`Primary storage cleanup failed for doc ${docId}, continuing:`, { error: blobError.message });
            }

            // 5b. Translation process containers (source and output)
            if (instructionId) {
                const translationPrefix = `${userId}/instruction_${instructionId}`;
                try {
                    await deleteBlobsByPrefix(CONFIG.STORAGE.SOURCE_CONTAINER, translationPrefix);
                    await deleteBlobsByPrefix(CONFIG.STORAGE.TARGET_CONTAINER, translationPrefix);
                    logger.info(`Cleaned up translation source and target blobs for instruction ${instructionId}`);
                } catch (transBlobError) {
                    logger.error(`Translation storage cleanup failed for instruction ${instructionId}:`, { error: transBlobError.message });
                }
            }

            logger.info(`Document ${docId} and all associations deleted for user ${userId}`);
            return res.status(200).json({ message: "Document and all related assets deleted successfully." });

        } catch (error) {
            logger.error("deleteOneByUser error:", { error: error.message, userId, docId });
            return res.status(500).json({
                message: "Internal server error",
                error: error.message
            });
        }
    },

    /**
     * Sets a specific document as active for the user and deactivates others.
     * @param {Object} req 
     * @param {Object} res 
     */
    setActiveDocument: async (req, res) => {
        try {
            const { userId, docId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(docId)) {
                return res.status(400).json({ message: "Invalid userId or docId" });
            }

            // 1️⃣ Deactivate all other documents for this user
            await Document.updateMany(
                { user_id: userId, _id: { $ne: docId } },
                { $set: { active: false } }
            );

            // 2️⃣ Activate the selected one
            const updatedDoc = await Document.findOneAndUpdate(
                { _id: docId, user_id: userId },
                { $set: { active: true } },
                { new: true }
            );

            if (!updatedDoc) {
                return res.status(404).json({ message: "Document not found" });
            }

            logger.info(`Document ${docId} set as active for user ${userId}`);
            res.status(200).json({ message: "Document set as active", document: updatedDoc });

        } catch (error) {
            logger.error("Set active document error:", { error: error.message });
            res.status(500).json({ message: "Failed to set active document" });
        }
    },

    storage: storageController,
    extract: extractController,
    translate: translationController

};

export default documentController;