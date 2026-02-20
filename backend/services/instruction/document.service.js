import { Document, Instruction } from "../../models/instruction/index.js";
import {
    ensureContainerExists,
    uploadBlob,
    deleteBlob,
    listBlobs,
    deleteBlobsByPrefix
} from "../../storage/azure.blob.storage.js";
import { CONFIG } from "../../Config/translation.config.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import "../../Utils/logger.js";

/**
 * Document Service
 * Handles business logic for document management, uploads, and storage interactions.
 */
class DocumentService {
    /**
     * Lists all blobs in a specified container.
     */
    async getBlobsByContainer(containerName) {
        const blobs = await listBlobs(containerName);
        return blobs.map(b => ({
            name: b.name,
            url: b.url,
            metadata: b.metadata || {},
            properties: b.properties || {}
        }));
    }

    /**
     * Deletes all blobs in a specified container.
     */
    async deleteBlobsByContainer(containerName) {
        const blobs = await listBlobs(containerName);
        if (!blobs.length) return { count: 0, summary: [] };

        const deleteResults = await Promise.allSettled(
            blobs.map(b => deleteBlob(containerName, b.name))
        );

        const summary = deleteResults.map((r, i) => ({
            blob: blobs[i].name,
            status: r.status,
            reason: r.reason?.message || null
        }));

        return { count: blobs.length, summary };
    }

    /**
     * Processes document upload: hashing, duplicate check, storage upload, and initialization.
     */
    async uploadDocument(userId, file) {
        const docType = "instruction";
        const status = "uploaded";

        const fileBuffer = await fs.readFile(file.path);
        const ext = path.extname(file.originalname).toLowerCase();
        const hash = crypto
            .createHash("sha256")
            .update(fileBuffer)
            .digest("hex");

        const existingDoc = await Document.findOne({ user_id: userId, hash });
        if (existingDoc) {
            throw { status: 409, message: "This file was already uploaded", document: existingDoc };
        }

        const doc = await Document.create({ type: docType, status, user_id: userId });
        await ensureContainerExists(userId);

        const blobName = `${doc._id}${ext}`;
        const blobUrl = await uploadBlob(userId, blobName, fileBuffer, { userId });

        const updatedDoc = await Document.findByIdAndUpdate(doc._id, {
            $set: {
                source: blobUrl,
                active: true,
                hash: hash,
                file_name: file.originalname
            }
        }, { new: true });

        await Instruction.initialize(doc._id, file.originalname);
        return updatedDoc;
    }

    /**
     * Gets all documents for a specific user.
     */
    async getDocsByUser(userId) {
        return await Document
            .find({ user_id: userId })
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * Deletes all documents and related assets for a user.
     */
    async deleteAllByUser(userId) {
        const userDocs = await Document.find({ user_id: userId }).select("_id");
        const docIds = userDocs.map(d => d._id);

        if (docIds.length === 0) return 0;

        const instructions = await Instruction.find({ document_id: { $in: docIds } });
        for (const inst of instructions) {
            try {
                await inst.deleteRelated();
                await deleteBlobsByPrefix(CONFIG.STORAGE.SOURCE_CONTAINER, `${userId}/instruction_${inst._id}`);
                await deleteBlobsByPrefix(CONFIG.STORAGE.TARGET_CONTAINER, `${userId}/instruction_${inst._id}`);
            } catch (err) {
                global.logger.error(`Failed to delete instruction data for ${inst._id}:`, err);
            }
        }

        const { Progress } = await import("../../models/instruction/index.js");
        await Progress.deleteMany({ document_id: { $in: docIds } });
        await Document.deleteMany({ user_id: userId });

        try {
            const blobs = await listBlobs(userId);
            if (blobs && blobs.length > 0) {
                await Promise.allSettled(blobs.map(b => deleteBlob(userId, b.name)));
            }
        } catch (blobError) {
            global.logger.error("Bulk primary blob deletion error:", blobError);
        }

        return docIds.length;
    }

    /**
     * Deletes a specific document and all its related assets.
     */
    async deleteOneByUser(userId, docId) {
        const doc = await Document.findOne({ _id: docId, user_id: userId });
        if (!doc) throw { status: 404, message: "Document not found." };

        const instruction = await Instruction.findOne({ document_id: docId });
        const instructionId = instruction?._id;

        if (instruction) {
            await instruction.deleteRelated();
        }

        const { Progress } = await import("../../models/instruction/index.js");
        await Progress.deleteOne({ document_id: docId });
        await Document.deleteOne({ _id: docId, user_id: userId });

        try {
            await deleteBlobsByPrefix(userId, docId.toString());
        } catch (err) {
            global.logger.error(`Primary storage cleanup failed for doc ${docId}:`, err);
        }

        if (instructionId) {
            const prefix = `${userId}/instruction_${instructionId}`;
            try {
                await deleteBlobsByPrefix(CONFIG.STORAGE.SOURCE_CONTAINER, prefix);
                await deleteBlobsByPrefix(CONFIG.STORAGE.TARGET_CONTAINER, prefix);
            } catch (err) {
                global.logger.error(`Translation storage cleanup failed for ${instructionId}:`, err);
            }
        }
        return true;
    }

    /**
     * Sets a document as active and deactivates others for the user.
     */
    async setActiveDocument(userId, docId) {
        await Document.updateMany(
            { user_id: userId, _id: { $ne: docId } },
            { $set: { active: false } }
        );

        const updatedDoc = await Document.findOneAndUpdate(
            { _id: docId, user_id: userId },
            { $set: { active: true } },
            { new: true }
        );

        if (!updatedDoc) throw { status: 404, message: "Document not found" };
        return updatedDoc;
    }

    /**
     * Updates the status of a document.
     */
    async updateStatus(docId, status) {
        const updatedDoc = await Document.findByIdAndUpdate(
            docId,
            { $set: { status: status } },
            { new: true }
        );

        if (!updatedDoc) throw { status: 404, message: "Document not found" };
        return updatedDoc;
    }
}

export default new DocumentService();
