import { Document, Instruction } from "../../models/instruction/index.js";
import { downloadBlob, uploadBlob, listBlobs } from "../../storage/azure.blob.storage.js";
import { LLMImageExtractor, LLMOCR } from "../../controller/ai/extractor/ollama.extract.controller.js";
import AzureTranslatorService from "../../services/translation/azure.translator.service.js";
import { Translation, Content, Language } from "../../models/translation/index.js";
import { load } from "cheerio";
import pdf from "pdf-poppler";
import fs from "fs/promises";
import path from "path";
import os from "os";
import mongoose from "mongoose";
import "../../Utils/logger.js";
import { CONFIG } from "../../Config/translation.config.js";

/**
 * Instruction Service
 * Handles business logic for instructions, AI extraction, and translation.
 */
class InstructionService {
    /**
     * Gets a page image as base64 from storage.
     */
    async getPageImageBase64(docId, pageNumber) {
        const doc = await Document.findById(docId);
        if (!doc) throw { status: 404, message: "Document not found" };

        const pageIdx = parseInt(pageNumber) - 1;
        const imageUrl = doc.imageExtracted?.[pageIdx];
        if (!imageUrl) throw { status: 404, message: `Image for page ${pageNumber} not found` };

        const { containerName, blobName } = this._parseBlobUrl(imageUrl);
        const imageBuffer = await downloadBlob(containerName, blobName);
        return imageBuffer.toString('base64');
    }

    /**
     * Converts a PDF document to a series of images and stores them.
     */
    async convertPdfToImage(userId, docId) {
        const doc = await Document.findOne({ _id: docId, user_id: userId, type: "instruction" });
        if (!doc) throw { status: 404, message: "Document not found" };

        const { containerName, blobName } = this._parseBlobUrl(doc.source);
        const baseBlobName = path.parse(blobName).name;

        // Check if already extracted
        if ((doc.status === "imageExtracted" || doc.status === "fieldExtracted") && doc.imageExtracted?.length > 0) {
            const existingBlobs = await listBlobs(containerName, `${baseBlobName}/`);
            if (existingBlobs.length > 0) {
                return { images: doc.imageExtracted, totalCount: existingBlobs.length, alreadyProcessed: true };
            }
        }

        const pdfBuffer = await downloadBlob(containerName, blobName);
        if (!pdfBuffer || pdfBuffer.length === 0) throw new Error("Downloaded PDF buffer is empty");

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf_conv_"));
        try {
            const tempPdfPath = path.join(tempDir, "input.pdf");
            await fs.writeFile(tempPdfPath, pdfBuffer);

            const opts = {
                format: "jpeg",
                out_dir: tempDir,
                out_prefix: "page",
                page: null
            };

            await pdf.convert(tempPdfPath, opts);

            const files = await fs.readdir(tempDir);
            const imageFiles = files.filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg"));
            const uploadedUrls = [];

            for (const file of imageFiles) {
                const filePath = path.join(tempDir, file);
                const fileBuffer = await fs.readFile(filePath);
                const pageNumMatch = file.match(/-(\d+)\.jpg$/);
                const pageNum = pageNumMatch ? pageNumMatch[1] : "1";
                const newBlobName = `${baseBlobName}/${pageNum}.jpg`;

                const url = await uploadBlob(containerName, newBlobName, fileBuffer, {
                    originalDocId: docId.toString(),
                    page: pageNum,
                    sourceBlob: blobName
                });
                uploadedUrls.push(url);
            }

            await Document.findByIdAndUpdate(docId, {
                $set: { imageExtracted: uploadedUrls, status: "imageExtracted" }
            });

            return { images: uploadedUrls, totalCount: uploadedUrls.length };
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
        }
    }

    /**
     * Extracts fields from a document page using AI.
     */
    async extractFields(userId, docId, pageNumber) {
        const doc = await Document.findOne({ _id: docId, user_id: userId });
        if (!doc) throw { status: 404, message: "Document not found" };

        const instruction = await Instruction.findOne({ document_id: docId });
        if (!instruction) throw { status: 404, message: "Associated instruction record not found" };

        if (doc.status === "fieldExtracted") {
            return {
                alreadyExtracted: true,
                instructionId: instruction._id,
                detectedLanguage: await instruction.getDetectedLanguage(),
                data: await Instruction.getInstruction(docId)
            };
        }

        if (doc.status !== "imageExtracted") {
            throw { status: 400, message: "Document is not ready for extraction (must be in 'imageExtracted' status)" };
        }

        const imageUrl = doc.imageExtracted[pageNumber - 1];
        if (!imageUrl) throw { status: 400, message: `Image for page ${pageNumber} not found` };

        const { containerName, blobName } = this._parseBlobUrl(imageUrl);
        const imageBuffer = await downloadBlob(containerName, blobName);
        const imageBase64 = imageBuffer.toString('base64');

        const schema = await instruction.getDynamicSchema();
        const result = await LLMImageExtractor(imageBase64, schema);
        if (!result) throw new Error("No data returned from AI extractor");

        const updatedInstruction = await instruction.updateInstruction(result);
        await Document.findByIdAndUpdate(docId, { $set: { status: "fieldExtracted" } });

        return {
            instructionId: updatedInstruction._id,
            detectedLanguage: await updatedInstruction.getDetectedLanguage(),
            data: await Instruction.getInstruction(docId)
        };
    }

    /**
     * Gets instruction data for a document.
     */
    async getInstructionData(docId) {
        const instruction = await Instruction.getInstruction(docId);
        if (!instruction) throw { status: 404, message: "Instruction data not found for this document" };

        const detectedLanguage = await instruction.getDetectedLanguage();
        return {
            ...instruction.toObject(),
            detectedLanguage
        };
    }

    /**
     * Extracts raw text from an image directly using VLM.
     */
    async extractTextFromImage(imageBase64) {
        return await LLMOCR(imageBase64);
    }

    /**
     * Generates HTML from instruction content entries.
     */
    generateHtmlFromEntries(contents) {
        const contentHtml = contents
            .map(({ _id, original }) => `
            <section class=\"content-block\">
                <p id=\"${_id}\">${original}</p>
            </section>`)
            .join('\n');

        return `
        <!DOCTYPE html>
        <html lang=\"en\">
        <head>
        <meta charset=\"UTF-8\">
        <title>Exported Content</title>
        </head>
        <body>
        ${contentHtml}
        </body>
        </html>
        `;
    }

    /**
     * Gets HTML file representation of an instruction's content.
     */
    async getHTMLFile(instructionId) {
        const instruction = await Instruction.findById(instructionId);
        if (!instruction) throw { status: 404, message: "Instruction not found" };

        const contents = await instruction.getAllContents();
        if (!contents || contents.length === 0) throw { status: 400, message: "No content found in this instruction" };

        return this.generateHtmlFromEntries(contents);
    }

    /**
     * Translates instruction content to target languages.
     */
    async translateInstruction(userId, instructionId, targetLanguages) {
        const instruction = await Instruction.findById(instructionId);
        if (!instruction) throw { status: 404, message: "Instruction not found" };

        const contents = await instruction.getAllContents();
        if (!contents || contents.length === 0) throw { status: 400, message: "No content found in this instruction" };

        const htmlContent = this.generateHtmlFromEntries(contents);
        const files = [{
            pageName: `instruction_${instructionId}`,
            content: htmlContent
        }];

        const sourceLanguage = await instruction.getDetectedLanguage();
        const jobId = await AzureTranslatorService.submitTranslationJob(userId, files, targetLanguages, sourceLanguage);
        await AzureTranslatorService.pollTranslationStatus(jobId);
        const results = await AzureTranslatorService.getTranslatedContent(userId, files, targetLanguages);

        for (const result of results) {
            const $ = load(result.content);
            const toLang = result.toLang;

            for (const contentDoc of contents) {
                let translatedText = $(`p[id=\"${contentDoc._id}\"]`).text().trim();
                if (translatedText) {
                    await Translation.updateOne(
                        { content: contentDoc._id, code: toLang },
                        { $set: { content: contentDoc._id, code: toLang, translated: translatedText } },
                        { upsert: true }
                    );

                    if (!contentDoc.translated) {
                        await Content.updateOne({ _id: contentDoc._id }, { $set: { translated: true } });
                    }
                }
            }
        }

        return { jobId, filesProcessed: results.length };
    }

    /**
     * Gets supported languages from translation service.
     */
    async getSupportedLanguages() {
        return await AzureTranslatorService.getSupportedLanguages();
    }

    /**
     * Detects language of a given text.
     */
    async detectLanguage(text) {
        return await AzureTranslatorService.detectLanguage(text);
    }

    /**
     * Translates static content text.
     */
    async translateStaticContent(text, toLanguage) {
        let contentDoc = await Content.findOne({ original: text }).populate("language");
        if (!contentDoc) {
            contentDoc = await Content.createWithText({ originalText: text });
            await contentDoc.populate("language");
        }

        const sourceCode = contentDoc.language?.code || "en";
        if (sourceCode === toLanguage) {
            return { original: text, translated: text, language: toLanguage, source: sourceCode };
        }

        const translatedText = await contentDoc.translateText(toLanguage);
        return { original: text, translated: translatedText, language: toLanguage, source: sourceCode };
    }

    /**
     * Updates instruction annotations.
     */
    async updateInstruction(docId, data) {
        const instruction = await Instruction.findOne({ document_id: docId });
        if (!instruction) throw { status: 404, message: "Instruction not found" };

        return await instruction.updateInstruction(data);
    }

    /**
     * Gets translated instruction data for a specific language.
     */
    async getInstructionTranslated(instructionId, languageCode) {
        const instruction = await Instruction.findById(instructionId);
        if (!instruction) throw { status: 404, message: "Instruction not found" };

        const result = await instruction.getTranslatedInstruction(languageCode);
        return { ...result, language: languageCode };
    }

    /**
     * Gets full hydrated instruction data (original + all translations).
     */
    async getInstructionById(instructionId) {
        const instruction = await Instruction.findById(instructionId);
        if (!instruction) throw { status: 404, message: "Instruction not found" };

        const result = await instruction.getFormattedData?.() || instruction.toObject();
        return {
            instructionId: instruction._id,
            documentId: instruction.document_id,
            detectedLanguage: instruction.detected_language,
            ...result
        };
    }

    /**
     * Gets the dynamic JSON schema for an instruction.
     */
    async getFormatOutput(instructionId) {
        const instruction = await Instruction.findById(instructionId);
        if (!instruction) throw { status: 404, message: "Instruction not found" };

        return await instruction.getDynamicSchema();
    }

    /**
     * Private helper to parse Azure Blob URL.
     */
    _parseBlobUrl(url) {
        const urlObj = new URL(url || "");
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);

        let containerName, blobName;
        if (urlObj.hostname === "127.0.0.1" || urlObj.hostname === "localhost") {
            containerName = pathParts[1];
            blobName = pathParts.slice(2).join('/');
        } else {
            containerName = pathParts[0];
            blobName = pathParts.slice(1).join('/');
        }

        if (!containerName || !blobName) throw new Error("Invalid storage path");
        return { containerName, blobName };
    }
}

export default new InstructionService();
