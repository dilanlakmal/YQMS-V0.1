import documentService from "../../services/instruction/document.service.js";
import instructionService from "../../services/instruction/instruction.service.js";
import mongoose from "mongoose";
import "../../Utils/logger.js";

/**
 * Storage Controller Sub-Module
 * Handles blob storage operations directly via DocumentService.
 */
const storageController = {
    getBlobsByContainer: async (req, res) => {
        try {
            const { container } = req.params;
            if (!container) return res.status(400).json({ message: "Container name is required." });

            const blobs = await documentService.getBlobsByContainer(container);
            res.json({ container, blobs });
        } catch (error) {
            global.logger.error(`Failed to get blobs from container ${req.params.container}`, { error: error.message });
            res.status(500).json({ message: "Failed to fetch blobs", error: error.message });
        }
    },

    deleteBlobsByContainer: async (req, res) => {
        try {
            const { container } = req.params;
            if (!container) return res.status(400).json({ message: "Container name is required." });

            const result = await documentService.deleteBlobsByContainer(container);
            res.json({ message: `Processed deletion of ${result.count} blobs in container: ${container}`, summary: result.summary });
        } catch (error) {
            global.logger.error(`Failed to delete blobs from container ${req.params.container}`, { error: error.message });
            res.status(500).json({ message: "Failed to delete blobs", error: error.message });
        }
    }
};

/**
 * Extract Controller Sub-Module
 * Handles image extraction and AI processing via InstructionService.
 */
const extractController = {
    getPageImageBase64: async (req, res) => {
        try {
            const { docId, pageNumber } = req.params;
            if (!mongoose.Types.ObjectId.isValid(docId)) return res.status(400).json({ message: "Invalid docId" });

            const base64 = await instructionService.getPageImageBase64(docId, pageNumber);
            res.json({ docId, pageNumber, base64 });
        } catch (error) {
            global.logger.error("getPageImageBase64 error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to fetch page image" });
        }
    },

    convertPdfToImage: async (req, res) => {
        try {
            const { userId, docId } = req.params;
            const result = await instructionService.convertPdfToImage(userId, docId);
            res.json({
                message: result.alreadyProcessed ? "Already processed" : "Conversion successful",
                images: result.images,
                totalCount: result.totalCount
            });
        } catch (error) {
            global.logger.error("convertPdfToImage error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to convert PDF to image" });
        }
    },

    extractFields: async (req, res) => {
        try {
            const { docId } = req.params;
            const { userId, pageNumber } = req.body;

            const result = await instructionService.extractFields(userId, docId, pageNumber);
            res.json({
                message: result.alreadyExtracted ? "Fields already extracted" : "Fields extracted and saved successfully",
                instructionId: result.instructionId,
                detectedLanguage: result.detectedLanguage,
                data: result.data
            });
        } catch (error) {
            const isConnectionError = error.message?.includes("Ollama service unreachable");
            global.logger.error("extractFields error:", { error: error.message, type: isConnectionError ? "ConnectionError" : "GeneralError" });

            res.status(isConnectionError ? 503 : (error.status || 500)).json({
                message: isConnectionError
                    ? "AI Extraction Service (Ollama) is currently unreachable. Please ensure the service is running."
                    : (error.message || "Failed to extract fields")
            });
        }
    },

    getInstruction: async (req, res) => {
        try {
            const { docId } = req.params;
            const data = await instructionService.getInstructionData(docId);
            res.json(data);
        } catch (error) {
            global.logger.error("getInstruction error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to fetch instruction data" });
        }
    },

    extractTextFromImage: async (req, res) => {
        try {
            const { imageBase64 } = req.body;
            if (!imageBase64) return res.status(400).json({ message: "imageBase64 is required" });

            global.logger.info("Starting direct image-to-text extraction (OCR)...");
            const text = await instructionService.extractTextFromImage(imageBase64);
            res.json({ message: "Text extracted successfully", text });
        } catch (error) {
            global.logger.error("extractTextFromImage error:", error.message);
            res.status(500).json({ message: "Failed to extract text from image", error: error.message });
        }
    }
};

/**
 * Translation Controller Sub-Module
 * Handles HTML generation, translation workflows, and result retrieval via InstructionService.
 */
const translationController = {
    getHTMLFile: async (req, res) => {
        try {
            const { instructionId } = req.params;
            const htmlContent = await instructionService.getHTMLFile(instructionId);
            res.send(htmlContent);
        } catch (error) {
            global.logger.error("getHTMLFile error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to fetch HTML file" });
        }
    },

    translate: async (req, res) => {
        try {
            const { userId, instructionId, targetLanguages } = req.body;
            if (!instructionId || !targetLanguages || !Array.isArray(targetLanguages)) {
                return res.status(400).json({ message: "instructionId and targetLanguages (array) are required" });
            }

            const result = await instructionService.translateInstruction(userId, instructionId, targetLanguages);
            res.json({
                message: "Translation completed and database updated successfully",
                jobId: result.jobId,
                filesProcessed: result.filesProcessed,
                targetLanguages
            });
        } catch (error) {
            global.logger.error("translate error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to translate instruction contents" });
        }
    },

    getSupportedLanguages: async (req, res) => {
        try {
            const languages = await instructionService.getSupportedLanguages();
            res.json(languages);
        } catch (error) {
            global.logger.error("getSupportedLanguages error:", error.message);
            res.status(500).json({ message: "Failed to fetch supported languages" });
        }
    },

    detectLanguage: async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) return res.status(400).json({ message: "Text is required for detection" });

            const code = await instructionService.detectLanguage(text);
            res.json({ code });
        } catch (error) {
            global.logger.error("detectLanguage error:", error.message);
            res.status(500).json({ message: "Failed to detect language" });
        }
    },

    translateStaticContent: async (req, res) => {
        try {
            const { text, toLanguage } = req.body;
            if (!text || !toLanguage) return res.status(400).json({ message: "Text and toLanguage are required" });

            const result = await instructionService.translateStaticContent(text, toLanguage);
            res.json(result);
        } catch (error) {
            global.logger.error("translateStaticContent error:", error.message);
            res.status(500).json({ message: "Failed to translate static content", error: error.message });
        }
    },

    updateInstruction: async (req, res) => {
        try {
            const { docId } = req.params;
            const { data } = req.body;

            await instructionService.updateInstruction(docId, data);
            res.json({ message: "Instruction updated successfully" });
        } catch (error) {
            global.logger.error("updateInstruction error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to update instruction" });
        }
    },

    getInstructionTranslated: async (req, res) => {
        try {
            const { instructionId, languageCode } = req.params;
            if (!mongoose.Types.ObjectId.isValid(instructionId)) return res.status(400).json({ message: "Invalid instructionId" });

            const result = await instructionService.getInstructionTranslated(instructionId, languageCode);
            res.json(result);
        } catch (error) {
            global.logger.error("getInstructionTranslated error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to fetch translated instruction" });
        }
    },

    getInstructionById: async (req, res) => {
        try {
            const { instructionId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(instructionId)) return res.status(400).json({ message: "Invalid instructionId" });

            const result = await instructionService.getInstructionById(instructionId);
            res.json(result);
        } catch (error) {
            global.logger.error("getInstructionById error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to fetch instruction" });
        }
    },

    getFormatOutput: async (req, res) => {
        try {
            const { instructionId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(instructionId)) return res.status(400).json({ message: "Invalid instructionId" });

            const schema = await instructionService.getFormatOutput(instructionId);
            res.json(schema);
        } catch (error) {
            global.logger.error("getFormatOutput error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Failed to fetch format output" });
        }
    }
};

/**
 * Document Controller
 * Main entry point for document-related requests, delegating to DocumentService.
 */
const documentController = {
    upload: async (req, res) => {
        try {
            const { userId } = req.body;
            const file = req.file;
            if (!userId || !file) return res.status(400).json({ message: "userId and file are required" });

            const document = await documentService.uploadDocument(userId, file);
            res.status(201).json({ message: "Document uploaded successfully", document });
        } catch (error) {
            global.logger.error("Upload document error:", error.message);
            res.status(error.status || 500).json({
                message: error.message || "Failed to upload document",
                document: error.document
            });
        }
    },

    getDocsByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid userId" });

            const docs = await documentService.getDocsByUser(userId);
            res.status(200).json({ count: docs.length, documents: docs });
        } catch (error) {
            global.logger.error("Get documents by user error:", error.message);
            res.status(500).json({ message: "Failed to fetch documents", error: error.message });
        }
    },

    deleteAllByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid userId" });

            const deletedCount = await documentService.deleteAllByUser(userId);
            res.json({ message: "All documents and related sources deleted successfully.", count: deletedCount });
        } catch (error) {
            global.logger.error("deleteAllByUser error:", error.message);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    },

    deleteOneByUser: async (req, res) => {
        try {
            const { userId, docId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(docId)) {
                return res.status(400).json({ message: "Invalid userId or docId" });
            }

            await documentService.deleteOneByUser(userId, docId);
            res.status(200).json({ message: "Document and all related assets deleted successfully." });
        } catch (error) {
            global.logger.error("deleteOneByUser error:", error.message);
            res.status(error.status || 500).json({ message: error.message || "Internal server error" });
        }
    },

    setActiveDocument: async (req, res) => {
        try {
            const { userId, docId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(docId)) {
                return res.status(400).json({ message: "Invalid userId or docId" });
            }

            const document = await documentService.setActiveDocument(userId, docId);
            res.status(200).json({ message: "Document set as active", document });
        } catch (error) {
            global.logger.error("Set active document error:", error.message);
            res.status(error.status || 500).json({ message: "Failed to set active document" });
        }
    },

    updateStatus: async (req, res) => {
        try {
            const { docId } = req.params;
            const { status } = req.body;
            if (!mongoose.Types.ObjectId.isValid(docId)) return res.status(400).json({ message: "Invalid docId" });
            if (!status) return res.status(400).json({ message: "Status is required" });

            const document = await documentService.updateStatus(docId, status);
            res.json({ message: "Document status updated", document });
        } catch (error) {
            global.logger.error("Update document status error:", error.message);
            res.status(error.status || 500).json({ message: "Failed to update document status", error: error.message });
        }
    },

    // Sub-controllers for namespacing
    storage: storageController,
    extract: extractController,
    translate: translationController
};

export default documentController;