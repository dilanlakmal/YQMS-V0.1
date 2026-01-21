

import { BlobServiceClient, ContainerSASPermissions, BlobSASPermissions } from "@azure/storage-blob";
import { CONFIG } from "../Config/translation.config.js";
import logger from "../Utils/translation/logger.js";


const blobServiceClient = BlobServiceClient.fromConnectionString(CONFIG.STORAGE.CONNECTION_STRING);

/**
 * Ensures a container exists, creates if not.
 * @param {string} containerName 
 */
const ensureContainerExists = async (containerName) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();
        return containerClient;
    } catch (error) {
        logger.error(`Failed to ensure container ${containerName}`, { error: error.message });
        throw error;
    }
};

/**
 * Uploads text content to a blob.
 * @param {string} containerName 
 * @param {string} blobName 
 * @param {string} content 
 */
const uploadBlob = async (containerName, blobName, content) => {
    try {
        const containerClient = await ensureContainerExists(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(content, Buffer.byteLength(content));
        logger.info(`Uploaded blob: ${blobName}`);
        return blockBlobClient.url;
    } catch (error) {
        logger.error(`Failed to upload blob ${blobName}`, { error: error.message });
        throw error;
    }
};

/**
 * Generates a SAS URL for a specific blob (Read/Write).
 * @param {string} containerName 
 * @param {string} blobName 
 * @param {number} expiryMinutes 
 */
const getBlobSasUrl = async (containerName, blobName, permissions = "r", expiryMinutes = 60) => {
    try {
        
        const containerClient = await ensureContainerExists(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        const sasToken = await blobClient.generateSasUrl({
            permissions: BlobSASPermissions.parse(permissions),
            startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Allow 5 mins clock skew
            expiresOn: new Date(new Date().valueOf() + expiryMinutes * 60 * 1000),
        });

        logger.debug(`Generated Source SAS: ${sasToken}`);
        return sasToken;
    } catch (error) {
        logger.error(`Failed to generate SAS for blob ${blobName}`, { error: error.message });
        throw error;
    }
};

/**
 * Generates a SAS URL for a container (Write access for translator output).
 * @param {string} containerName 
 * @param {string} [folderName=""] Optional folder prefix to limit scope
 */
const getContainerSasUrl = async (containerName, folderName = "") => {
    try {
        const containerClient = await ensureContainerExists(containerName);

        // permissions: write, list, create, delete (standard for output targets)
        const sasUrl = await containerClient.generateSasUrl({
            permissions: ContainerSASPermissions.parse("racwl"),
            startsOn: new Date(Date.now() - 5 * 60 * 1000),
            expiresOn: new Date(Date.now() + 60 * 60 * 1000)
        });

        let finalUrl = sasUrl;
        if (folderName) {
            const [baseUrl, query] = sasUrl.split('?');
            finalUrl = `${baseUrl}/${folderName}?${query}`;
        }

        logger.debug(`Generated Target SAS: ${finalUrl}`);
        return finalUrl;
    } catch (error) {
        logger.error(`Failed to generate SAS for container ${containerName}`, { error: error.message });
        throw error;
    }
};

/**
 * Lists blobs in a container, optionally filtered by prefix/folder.
 * @param {string} containerName 
 * @param {string} prefix 
 */
const listBlobs = async (containerName, prefix = "") => {
    try {
        const containerClient = await ensureContainerExists(containerName);
        const blobs = [];
        for await (const blob of containerClient.listBlobsFlat({ prefix })) {
            blobs.push(blob.name);
        }
        return blobs;
    } catch (error) {
        logger.error(`Failed to list blobs in ${containerName}`, { prefix, error: error.message });
        throw error;
    }
};

/**
 * Downloads blob content as string.
 * @param {string} containerName 
 * @param {string} blobName 
 */
const downloadBlobToString = async (containerName, blobName) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
        return downloaded.toString();
    } catch (error) {
        logger.error(`Failed to download blob ${blobName}`, { error: error.message });
        throw error;
    }
};

// Helper
const streamToString = async (readableStream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
};

export {
    uploadBlob,
    getBlobSasUrl,
    getContainerSasUrl,
    listBlobs,
    downloadBlobToString
};
