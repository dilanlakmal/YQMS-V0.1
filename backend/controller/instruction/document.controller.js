import { Document } from "../../models/instruction/index.js";
import { ensureContainerExists, uploadBlob, deleteBlob, listBlobs, downloadBlob } from "../../storage/azure.blob.storage.js";
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
import { Translation, Content, Language } from "../../models/translation/index.js";
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
            const urlObj = new URL(doc.source);
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);

            // pathParts[0] is container (likely user_id), pathParts[1] is blob name
            const containerName = pathParts[0];
            const blobName = pathParts.slice(1).join('/'); // In case blob name has slashes

            logger.info(`Container: ${containerName}`);
            logger.info(`Blob Name: ${blobName}`);

            // 3. Download PDF
            logger.info("Downloading PDF from Azure...");
            const pdfBuffer = await downloadBlob(containerName, blobName);
            logger.info(`Downloaded ${pdfBuffer.length} bytes.`);

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

            // Sort to ensure order if needed, but we rely on file names 
            // pdf-poppler names them page-1.jpg, page-2.jpg etc.

            const uploadedUrls = [];
            // "folder as blob name" -> Remove extension from blob name to get folder name
            const baseBlobName = path.parse(blobName).name;

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
            doc.imageExtracted = uploadedUrls;
            doc.status = "imageExtracted";
            await doc.save();

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
            logger.error("convertPdfToImage error:", { error: error.message });
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


            const doc = await Document.findOne({ _id: docId, status: "imageExtracted", user_id: userId });
            if (!doc) {
                logger.warn(`Document not found for extraction: ID=${docId}, User=${userId}`);
                return res.status(404).json({ message: "Document not found or not in 'imageExtracted' status" });
            }

            const instruction = await Instruction.findOne({ document_id: docId });
            if (!instruction) {
                logger.warn(`Instruction not found for document: ID=${docId}`);
                return res.status(404).json({ message: "Associated instruction record not found" });
            }

            // 1. Get Image and convert to Base64
            const imageUrl = doc.imageExtracted[pageNumber - 1];
            if (!imageUrl) {
                return res.status(400).json({ message: `Image for page ${pageNumber} not found` });
            }

            logger.info(`Extracting fields from page ${pageNumber}...`);
            const urlObj = new URL(imageUrl);
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
            const containerName = pathParts[0];
            const blobName = pathParts.slice(1).join('/');

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
            const updatedInstruction = await instruction.updateFromExtractedData(result);

            // 5. Update Document Status
            doc.status = "fieldExtracted";
            await doc.save();

            logger.info(`Fields extracted successfully for document: ${docId}`);
            res.json({
                message: "Fields extracted and saved successfully",
                data: result,
                instructionId: updatedInstruction._id,
            });

        } catch (error) {
            logger.error("extractFields error:", { error: error.message, stack: error.stack });
            res.status(500).json({ message: "Failed to extract fields", error: error.message });
        }
    },

    getInstruction: async (req, res) => {
        try {
            const { docId } = req.params;

            // 1. Find the instruction for this document
            const instruction = await Instruction.findOne({ document_id: docId });

            if (!instruction) {
                return res.status(404).json({ message: "Instruction data not found for this document" });
            }

            // 2. Populate all annotations and their content
            // We need a deep populate to get content and translations
            await instruction.populate([
                {
                    path: "header.title header.model_id details.style_no.label details.style_no.value details.factory_code.label details.factory_code.value details.po_no.label details.po_no.value details.quantity.label details.quantity.value requirements.order_type.label requirements.order_type.value requirements.label_instruction.value visuals.sample_image visuals.approval_stamp product_info.style product_info.color product_info.usage product_info.special_note product_info.sizes notes",
                    populate: {
                        path: "content",
                        populate: {
                            path: "translations"
                        }
                    }
                }
            ]);

            // Helper to format an annotation into the { english, chinese, khmer } format the UI expects
            const formatAnnot = (annot) => {
                if (!annot || !annot.content) return { english: "", chinese: "", khmer: "" };

                const content = annot.content;
                const result = {
                    english: content.original || "",
                    chinese: "",
                    khmer: ""
                };

                // Fill in translations
                if (content.translations && Array.isArray(content.translations)) {
                    content.translations.forEach(t => {
                        if (t.code === "zh-Hans" || t.code === "zh") result.chinese = t.translated;
                        if (t.code === "km") result.khmer = t.translated;
                    });
                }

                // If original language was not English, we should probably set that correctly.
                // But the UI seems to expect fixed keys.
                return result;
            };

            // 3. Map to the "Legacy" structure expected by GprtTranslationTemplate
            // This ensures we can use the new model with the existing UI without a massive rewrite.
            const legacyData = {
                documentId: docId,
                instructionId: instruction._id,
                title: { text: formatAnnot(instruction.header.title) },
                customer: {
                    customer_info: { name: "GPRT0007C" }, // HARDCODED for now as requested by user's team check
                    style: {
                        code: {
                            label: formatAnnot(instruction.details.style_no.label),
                            value: formatAnnot(instruction.details.style_no.value)
                        },
                        sample: {
                            description: "Sample Image",
                            img: { data: null } // We might need to handle actual image data here if we have it
                        }
                    },
                    purchase: {
                        order: {
                            orderNumber: {
                                label: formatAnnot(instruction.details.po_no.label),
                                value: formatAnnot(instruction.details.po_no.value)
                            },
                            orderType: {
                                label: formatAnnot(instruction.requirements.order_type.label),
                                value: formatAnnot(instruction.requirements.order_type.value)
                            }
                        },
                        quantity: {
                            label: formatAnnot(instruction.details.quantity.label),
                            value: formatAnnot(instruction.details.quantity.value),
                            unit: ""
                        },
                        specs: [] // Placeholder for specs table
                    },
                    packing: {
                        main: {
                            label: formatAnnot(instruction.requirements.label_instruction.value),
                            value: ""
                        }
                    },
                    manufacturingNote: instruction.notes.map(n => formatAnnot(n))
                },
                factory: {
                    factoryID: {
                        label: formatAnnot(instruction.details.factory_code.label),
                        value: formatAnnot(instruction.details.factory_code.value)
                    },
                    factoryStamp: {
                        description: "Stamp",
                        img: { data: null }
                    }
                }
            };

            res.json(legacyData);

        } catch (error) {
            logger.error("getInstruction error:", { error: error.message, stack: error.stack });
            res.status(500).json({ message: "Failed to fetch instruction data", error: error.message });
        }
    },


}

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
            const jobId = await AzureTranslatorService.submitTranslationJob(userId, files, targetLanguages);

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
                    const translatedText = $(`p[id="${contentDoc._id}"]`).text().trim();

                    if (translatedText) {
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
                    }
                }
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
            const { userId, data } = req.body;

            const instruction = await Instruction.findOne({ document_id: docId });
            if (!instruction) {
                return res.status(404).json({ message: "Instruction not found" });
            }

            // Simple implementation: for now, we only update the fields that are passed
            // In a real scenario, we might want to update nested contents/annotations
            // For GprtTemplate, it mostly updates top-level fields like title, customer, factory
            if (data.title) instruction.title = { ...instruction.title.toObject(), ...data.title };
            if (data.customer) instruction.customer = { ...instruction.customer.toObject(), ...data.customer };
            if (data.factory) instruction.factory = { ...instruction.factory.toObject(), ...data.factory };

            await instruction.save();

            logger.info(`Instruction updated for document: ${docId}`);
            res.json({ message: "Instruction updated successfully", data: instruction });

        } catch (error) {
            logger.error("updateInstruction error:", error);
            res.status(500).json({ message: "Failed to update instruction" });
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
            doc.source = blob;
            doc.active = true;
            doc.hash = hash;
            doc.file_name = file.originalname;
            await doc.save();

            logger.info(`Document uploaded successfully: ID=${doc._id}, Source=${blob}`);

            return res.status(201).json({
                message: "Document uploaded successfully",
                document: doc
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

            // 1. Delete all blobs in user's container (PDFs and image folders)
            try {
                const blobs = await listBlobs(userId);
                if (blobs && blobs.length > 0) {
                    await Promise.allSettled(blobs.map(b => deleteBlob(userId, b.name)));
                    logger.info(`Bulk deleted ${blobs.length} blobs for user ${userId}`);
                }
            } catch (blobError) {
                logger.error("Bulk blob deletion error:", { error: blobError.message });
            }

            // 2. Find all documents for this user
            const userDocs = await Document.find({ user_id: userId }).select("_id");
            const docIds = userDocs.map(d => d._id);

            if (docIds.length > 0) {
                // 3. Find all instructions for these documents
                const instructions = await Instruction.find({ document_id: { $in: docIds } });

                // 4. Recursively delete AI data for each instruction
                for (const inst of instructions) {
                    try {
                        await inst.deleteRelated();
                    } catch (instError) {
                        logger.error(`Recursive delete failed for instruction ${inst._id}:`, instError);
                    }
                }

                // 5. Cleanup remaining documents and progress
                const { Progress } = await import("../../models/instruction/index.js");
                await Progress.deleteMany({ document_id: { $in: docIds } });
                await Document.deleteMany({ user_id: userId });

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

            // 2. Delete all blobs related to this document (PDF and images)
            // PDF is docId.pdf, images are in folder docId/
            const basePrefix = docId.toString();
            try {
                const relatedBlobs = await listBlobs(userId, basePrefix);
                if (relatedBlobs && relatedBlobs.length > 0) {
                    await Promise.allSettled(relatedBlobs.map(b => deleteBlob(userId, b.name)));
                    logger.info(`Deleted ${relatedBlobs.length} related blobs for document ${docId}`);
                }
            } catch (blobError) {
                logger.error(`Blob cleanup failed for doc ${docId}, continuing:`, { error: blobError.message });
            }

            // 3. Delete Instruction and all its recursive dependencies (Annotations, Content, Translations)
            const instruction = await Instruction.findOne({ document_id: docId });
            if (instruction) {
                await instruction.deleteRelated();
                logger.info(`Recursively deleted instruction and AI data for document ${docId}`);
            }

            // 4. Delete Progress and Document from MongoDB
            const { Progress } = await import("../../models/instruction/index.js");
            await Progress.deleteOne({ document_id: docId });
            await Document.deleteOne({ _id: docId, user_id: userId });

            logger.info(`Document ${docId} and associations deleted for user ${userId}`);
            return res.status(200).json({ message: "Document deleted successfully." });

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