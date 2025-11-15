import { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerSASPermissions
} from "@azure/storage-blob";

/**
 * Upload file to Azure Blob Storage and return blob URL
 */
export const uploadFileToBlob = async (fileBuffer, fileName, containerName, storageAccountName, storageAccountKey) => {
  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Create container if it doesn't exist
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'application/octet-stream' }
  });

  return blockBlobClient.url;
};

/**
 * Generate SAS token for container with specified permissions
 */
export const generateContainerSAS = async (containerName, storageAccountName, storageAccountKey, permissions, expiresInHours = 24) => {
  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Ensure container exists
  await containerClient.createIfNotExists();

  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + expiresInHours);

  // Use ContainerClient.generateSasUrl() method
  const sasUrl = await containerClient.generateSasUrl({
    permissions: permissions,
    expiresOn: expiresOn
  });

  // Extract just the SAS token (everything after the ?)
  const sasToken = sasUrl.split('?')[1];
  return sasToken;
};

/**
 * Generate SAS token for a specific blob
 */
export const generateBlobSAS = (containerName, blobName, storageAccountName, storageAccountKey, permissions, expiresInHours = 24) => {
  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + expiresInHours);

  const sasQueryParams = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: permissions,
      expiresOn
    },
    sharedKeyCredential
  );

  return sasQueryParams.toString();
};

/**
 * Get full SAS URL for container
 */
export const getContainerSASUrl = async (containerName, storageAccountName, storageAccountKey, permissions, expiresInHours = 24) => {
  const baseUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}`;
  const sasToken = await generateContainerSAS(containerName, storageAccountName, storageAccountKey, permissions, expiresInHours);
  return `${baseUrl}?${sasToken}`;
};

/**
 * Get full SAS URL for blob
 */
export const getBlobSASUrl = (containerName, blobName, storageAccountName, storageAccountKey, permissions, expiresInHours = 24) => {
  const baseUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blobName}`;
  const sasToken = generateBlobSAS(containerName, blobName, storageAccountName, storageAccountKey, permissions, expiresInHours);
  return `${baseUrl}?${sasToken}`;
};

/**
 * Download file from blob storage using SAS URL
 */
export const downloadBlobFile = async (blobSasUrl) => {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get(blobSasUrl, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Error downloading blob file:`, error);
    throw new Error(`Failed to download file from blob storage: ${error.message}`);
  }
};

/**
 * List all blobs in a container
 */
export const listBlobsInContainer = async (containerName, storageAccountName, storageAccountKey) => {
  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobs = [];
    
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        contentType: blob.properties.contentType || 'application/octet-stream',
        url: blob.name // We'll construct full URL with SAS when needed
      });
    }

    return blobs;
  } catch (error) {
    console.error(`Error listing blobs in container ${containerName}:`, error);
    throw error;
  }
};

/**
 * Download file from blob storage using blob name (generates SAS on the fly)
 */
export const downloadBlobByName = async (containerName, blobName, storageAccountName, storageAccountKey) => {
  try {
    // Generate read-only SAS for this specific blob
    const blobSasUrl = getBlobSASUrl(
      containerName,
      blobName,
      storageAccountName,
      storageAccountKey,
      BlobSASPermissions.parse("r"), // Just read permission
      1 // 1 hour expiry
    );

    const axios = (await import('axios')).default;
    const response = await axios.get(blobSasUrl, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Error downloading blob ${blobName}:`, error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Delete a blob from container
 */
export const deleteBlob = async (containerName, blobName, storageAccountName, storageAccountKey) => {
  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();

    return true;
  } catch (error) {
    console.error(`Error deleting blob ${blobName}:`, error);
    throw error;
  }
};

/**
 * Extract clean file name from UUID-prefixed blob name
 * Example: "uuid-filename.docx" -> "filename.docx"
 */
export const extractCleanFileName = (blobName) => {
  // Pattern: UUID-filename or UUID_filename
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[-_](.+)$/i;
  const match = blobName.match(uuidPattern);
  return match ? match[1] : blobName;
};
