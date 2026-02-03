import { Glossary, Content, Language } from "../../models/translation/index.js";
import mongoose from "mongoose";
import  "../../Utils/logger.js";

const glossaryController = {
    /**
     * Adds a new glossary entry.
     * Required: sourceText, targetText
     * Optional: sourceLangCode, targetLangCode (for explicit language definition)
     */
    addEntry: async (req, res) => {
        try {
            const { sourceText, targetText, sourceLangCode, targetLangCode } = req.body;
            logger.info("Add glossary entry request:", req.body);

            if (!sourceText || !targetText) {
                return res.status(400).json({ message: "Source and target text are required." });
            }

            // Use static method which handles Content creation and language detection
            await Glossary.createGlossary(
                sourceText,
                sourceLangCode || null,
                targetText,
                targetLangCode || null
            );

            res.status(201).json({
                message: "Glossary entry created successfully",
                entry: await Glossary.getGlossaryItems(sourceLangCode, targetLangCode)
            });

        } catch (error) {
            logger.error("Add glossary entry error:", error);
            res.status(500).json({ message: "Failed to add glossary entry", error: error.message });
        }
    },

    /**
     * Lists glossary entries.
     * Supports filtering by sourceLang and targetLang codes.
     */
    getEntries: async (req, res) => {
        try {
            const { sourceLang, targetLang, search } = req.query;

            const pipeline = [
                // Join Source Content
                {
                    $lookup: {
                        from: "contents",
                        localField: "source",
                        foreignField: "_id",
                        as: "sourceContent"
                    }
                },
                { $unwind: "$sourceContent" },
                // Join Source Language
                {
                    $lookup: {
                        from: "languages",
                        localField: "sourceContent.language",
                        foreignField: "_id",
                        as: "sourceLangDetails"
                    }
                },
                { $unwind: "$sourceLangDetails" },

                // Join Target Content
                {
                    $lookup: {
                        from: "contents",
                        localField: "target",
                        foreignField: "_id",
                        as: "targetContent"
                    }
                },
                { $unwind: "$targetContent" },
                // Join Target Language
                {
                    $lookup: {
                        from: "languages",
                        localField: "targetContent.language",
                        foreignField: "_id",
                        as: "targetLangDetails"
                    }
                },
                { $unwind: "$targetLangDetails" }
            ];

            // Build Match Stage
            const matchStage = {};

            if (sourceLang) {
                matchStage["sourceLangDetails.code"] = sourceLang;
            }

            if (targetLang) {
                matchStage["targetLangDetails.code"] = targetLang;
            }

            if (search) {
                const regex = new RegExp(search, "i");
                matchStage.$or = [
                    { "sourceContent.original": regex },
                    { "targetContent.original": regex }
                ];
            }

            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }

            // Projection
            pipeline.push({
                $project: {
                    _id: 1,
                    sourceText: "$sourceContent.original",
                    sourceLang: "$sourceLangDetails.code",
                    targetText: "$targetContent.original",
                    targetLang: "$targetLangDetails.code",
                    createdAt: 1
                }
            });

            // Sort by creation date desc
            pipeline.push({ $sort: { createdAt: -1 } });

            const entries = await Glossary.aggregate(pipeline);

            res.json({ count: entries.length, entries });

        } catch (error) {
            logger.error("Get glossary entries error:", error);
            res.status(500).json({ message: "Failed to fetch glossary entries" });
        }
    },

    /**
     * Deletes a glossary entry by ID.
     */
    deleteEntry: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Glossary.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ message: "Entry not found" });
            }

            res.json({ message: "Glossary entry deleted successfully" });
        } catch (error) {
            logger.error("Delete glossary error:", error);
            res.status(500).json({ message: "Failed to delete glossary entry" });
        }
    },

    /**
     * Bulk export translations from an instruction to the glossary.
     * Creates new glossary entries for all existing translations.
     */
    exportFromInstruction: async (req, res) => {
        try {
            const { instructionId, targetLanguageCode } = req.body;

            if (!instructionId || !targetLanguageCode) {
                return res.status(400).json({ message: "Instruction ID and Target Language Code are required." });
            }

            // Dynamic imports to avoid circular dependency issues if any
            const { Instruction } = await import("../../models/instruction/index.js");
            const { Translation } = await import("../../models/translation/index.js");

            const instruction = await Instruction.findById(instructionId);
            if (!instruction) return res.status(404).json({ message: "Instruction not found" });

            const contents = await instruction.getAllContents();
            let count = 0;

            for (const content of contents) {
                // Find translation for this content in target language
                const translation = await Translation.findOne({
                    content: content._id,
                    code: targetLanguageCode
                });

                if (translation && translation.translated) {
                    try {
                        // Use createGlossary to safely create/find content and link them
                        // content.original is source text
                        // translation.translated is target text

                        // Pass specific language codes to avoid re-detection if possible
                        // content.language is the ID, we need the code ideally, or validation.
                        // But creation handles auto-detect if code is null.
                        // We can assume target code = targetLanguageCode.

                        let sourceCode = null;
                        if (content.language && content.language.code) {
                            sourceCode = content.language.code;
                        }

                        // Check if entry already exists to avoid throwing duplicate error manually
                        // (Though createGlossary/model has unique index, it's safer to try/catch loop)
                        await Glossary.createGlossary(
                            content.original,
                            sourceCode,
                            translation.translated,
                            targetLanguageCode
                        );

                        count++;
                    } catch (err) {
                        // Ignore duplicate key errors (code 11000)
                        if (err.code !== 11000 && !err.message.includes("duplicate")) {
                            logger.warn(`Failed to export glossary item for content ${content._id}: ${err.message}`);
                        }
                    }
                }
            }

            res.json({
                message: `Successfully exported ${count} entries to glossary.`,
                count
            });

        } catch (error) {
            logger.error("Export to glossary error:", error);
            res.status(500).json({ message: "Export failed", error: error.message });
        }
    }
};

export default glossaryController;
