
import { BlobServiceClient, ContainerSASPermissions, BlobSASPermissions } from "@azure/storage-blob";
import { CONFIG } from "../Config/translation.config.js";

const blobServiceClient = BlobServiceClient.fromConnectionString(CONFIG.STORAGE.CONNECTION_STRING);

/**
 * Ensures a container exists, creates it if it does not.
 * @param {string} containerName - The name of the container.
 * @returns {Promise<ContainerClient>} The container client instance.
 * @throws {Error} If checking or creating the container fails.
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
 * Uploads content to a blob.
 * @param {string} containerName - The name of the container.
 * @param {string} blobName - The name of the blob.
 * @param {string|Buffer} content - The content to upload.
 * @param {Object} [metadata={}] - Optional metadata to store with the blob.
 * @returns {Promise<string>} The URL of the uploaded blob.
 * @throws {Error} If upload fails.
 */
const uploadBlob = async (containerName, blobName, content, metadata = {}) => {
    try {
        const containerClient = await ensureContainerExists(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload with metadata
        await blockBlobClient.upload(content, Buffer.byteLength(content), {
            metadata: metadata // key-value object
        });

        logger.info(`Uploaded blob: ${blobName} with metadata: ${JSON.stringify(metadata)}`);
        return blockBlobClient.url;
    } catch (error) {
        logger.error(`Failed to upload blob ${blobName}`, { error: error.message });
        throw error;
    }
};

/**
 * Deletes a specific blob from a container.
 * @param {string} containerName - The name of the container.
 * @param {string} blobName - The name of the blob to delete.
 * @returns {Promise<boolean>} True if deleted successfully, false if not found.
 * @throws {Error} If delete operation fails.
 */
const deleteBlob = async (containerName, blobName) => {
    try {
        const containerClient = await ensureContainerExists(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const response = await blockBlobClient.deleteIfExists();

        if (response.succeeded) {
            logger.info(`Deleted blob: ${blobName}`);
            return true;
        } else {
            logger.warn(`Blob not found: ${blobName}`);
            return false;
        }
    } catch (error) {
        logger.error(`Failed to delete blob ${blobName}`, { error: error.message });
        throw error;
    }
};

/**
 * Generates a SAS URL for a specific blob (Read/Write).
 * @param {string} containerName - The name of the container.
 * @param {string} blobName - The name of the blob.
 * @param {string} [permissions="r"] - SAS permissions (default: read).
 * @param {number} [expiryMinutes=60] - Expiration time in minutes.
 * @returns {Promise<string>} The SAS URL.
 * @throws {Error} If generating SAS fails.
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
 * Generates a SAS URL for a container (Write access for output targets).
 * @param {string} containerName - The container name.
 * @param {string} [folderName=""] - Optional folder prefix.
 * @returns {Promise<string>} The SAS URL.
 * @throws {Error} If generating SAS fails.
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
 * @param {string} containerName - The container name.
 * @param {string} [prefix=""] - Optional prefix for filtering.
 * @returns {Promise<Array<Object>>} List of blob objects with name, url, metadata, properties.
 * @throws {Error} If listing blobs fails.
 */
const listBlobs = async (containerName, prefix = "") => {
    try {
        const containerClient = await ensureContainerExists(containerName);
        const blobs = [];

        for await (const blob of containerClient.listBlobsFlat({ prefix })) {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            blobs.push({
                name: blob.name,
                url: blockBlobClient.url,
                metadata: blob.metadata || {},
                properties: blob.properties || {}
            });
        }

        return blobs;
    } catch (error) {
        logger.error(`Failed to list blobs in container ${containerName}`, { prefix, error: error.message });
        throw error;
    }
};

/**
 * Downloads blob content as a string.
 * @param {string} containerName - The container name.
 * @param {string} blobName - The blob name.
 * @returns {Promise<string>} The file content as a string.
 * @throws {Error} If download fails.
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

/**
 * Helper: Converts a readable stream to a string.
 * @param {ReadableStream} readableStream - The stream to read.
 * @returns {Promise<Buffer>} The buffered content.
 */
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
    downloadBlobToString,
    ensureContainerExists,
    deleteBlob
};
