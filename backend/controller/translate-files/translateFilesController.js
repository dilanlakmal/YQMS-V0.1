import multer from "multer";
import axios from "axios";
import { randomUUID } from "crypto";
import path from "path";
import {
    uploadFileToBlob,
    getContainerSASUrl,
    getBlobSASUrl,
    listBlobsInContainer,
    downloadBlobByName,
    deleteBlob,
    extractCleanFileName
} from "../../AISystemUtils/system-translate/azureBlobHelper.js";
import { BlobSASPermissions, ContainerSASPermissions } from "@azure/storage-blob";
import fs from 'fs';
import { promisify } from 'util';
const unlink = promisify(fs.unlink);
import { countDocumentCharacters, calculateTranslationCost } from "../../AISystemUtils/system-translate/documentHelper.js";
import { logTranslationCost } from "../../AISystemUtils/system-translate/translationCostLogger.js";
import { getGlossaryUrl } from "../glossaries/glossaryController.js";

// Create temp directory if it doesn't exist
const tempUploadDir = path.join(process.cwd(), 'temp', 'uploads');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Configure multer for disk storage (optional, for very large files)
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // Ensure directory exists
            if (!fs.existsSync(tempUploadDir)) {
                fs.mkdirSync(tempUploadDir, { recursive: true });
            }
            cb(null, tempUploadDir);
        },
        filename: (req, file, cb) => {
            // Use UUID to avoid conflicts
            const uniqueName = `${randomUUID()}-${Date.now()}-${sanitizeBlobName(file.originalname)}`;
            cb(null, uniqueName);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 }
});

export const uploadMiddleware = upload.fields([
    { name: 'files', maxCount: 10 }
]);

// Helper function to poll translation job status
const pollTranslationStatus = async(endpoint, apiKey, jobId, apiVersion = "2024-05-01") => {
    const maxAttempts = 60; // Maximum polling attempts (5 minutes with 5-second intervals)
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const statusUrl = `${endpoint}/translator/document/batches/${jobId}?api-version=${apiVersion}`;

            const response = await axios.get(statusUrl, {
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey
                }
            });

            const status = response.data.status;
            console.log(`Translation job ${jobId} status: ${status} (attempt ${attempt + 1})`);

            if (status === 'Succeeded') {
                return { success: true, data: response.data };
            } else if (status === 'Failed' || status === 'Cancelled' || status === 'ValidationFailed') {
                // Log detailed error information from Azure
                console.error(`Translation job ${status}. Full response:`, JSON.stringify(response.data, null, 2));
                if (response.data.errors) {
                    console.error('Validation errors:', JSON.stringify(response.data.errors, null, 2));
                }
                if (response.data.summary) {
                    console.error('Job summary:', JSON.stringify(response.data.summary, null, 2));
                }
                return { success: false, error: `Translation job ${status}`, data: response.data };
            } else if (status === 'Running' || status === 'NotStarted') {
                // Continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } else {
                // Unknown status, continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        } catch (error) {
            // Better error logging
            if (error.response) {
                console.error(`Error polling translation status (attempt ${attempt + 1}): ${error.response.status} - ${error.response.statusText}`);
                if (error.response.data) {
                    console.error(`Error details:`, JSON.stringify(error.response.data));
                }
            } else {
                console.error(`Error polling translation status (attempt ${attempt + 1}):`, error.message);
            }

            if (attempt === maxAttempts - 1) {
                return { success: false, error: error.message || 'Polling failed' };
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }

    return { success: false, error: 'Translation job timed out' };
};

const sanitizeBlobName = (filename) => {
    const ext = path.extname(filename || "");
    const base = path.basename(filename || "file", ext);
    const normalized = base.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const safeBase = normalized.replace(/[^a-zA-Z0-9-_]/g, "_") || "file";
    return `${safeBase}${ext}`;
};

const translateFiles = async(req, res) => {
    let sourceLanguage; // Declare at function scope
    let targetLanguage; // Declare at function scope

    try {
        const uploadedFiles = req.files && req.files["files"] ? req.files["files"] : [];
        targetLanguage = req.body.targetLanguage;
        sourceLanguage = req.body.sourceLanguage || null;
        const glossaryBlobName = req.body.glossaryBlobName || null;

        let selectedBlobFiles = [];
        if (req.body.blobFileNames) {
            try {
                selectedBlobFiles = JSON.parse(req.body.blobFileNames);
            } catch (parseError) {
                return res.status(400).json({ error: "Invalid blobFileNames payload" });
            }
        }

        if ((!uploadedFiles || uploadedFiles.length === 0) && selectedBlobFiles.length === 0) {
            return res.status(400).json({ error: "Please upload or select at least one file" });
        }

        if (!targetLanguage) {
            return res.status(400).json({ error: "Target language is required" });
        }

        // Azure Translator REST API credentials
        const apiKey = process.env.AZURE_TRANSLATOR_KEY_FILE;
        const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT_FILE;
        const apiVersion = process.env.AZURE_TRANSLATOR_API_VERSION || "2024-05-01";

        // Azure Blob Storage configuration - using your containers
        const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
        const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const sourceContainerName = process.env.AZURE_STORAGE_SOURCE_CONTAINER || "inputdocuments";
        const targetContainerName = process.env.AZURE_STORAGE_TARGET_CONTAINER || "documentstraslated";

        // Target container SAS (write + list) - Always generate fresh
        const targetContainerSas = await getContainerSASUrl(
            targetContainerName,
            storageAccountName,
            storageAccountKey,
            ContainerSASPermissions.parse("wl"),
            24
        );

        // Split the container SAS URL to extract base URL and SAS token separately
        const [targetBaseUrl, targetSasToken] = targetContainerSas.split("?");
        if (!targetBaseUrl || !targetSasToken) {
            throw new Error("Invalid target container SAS URL");
        }

        if (!apiKey || !endpoint) {
            return res.status(500).json({
                error: "Azure Translator credentials not configured"
            });
        }

        if (!storageAccountKey) {
            return res.status(500).json({
                error: "Azure Blob Storage account key not configured. Please set AZURE_STORAGE_ACCOUNT_KEY"
            });
        }

        const filesToTranslate = [];

        // Handle newly uploaded files
        for (const file of uploadedFiles) {
            const safeOriginalName = sanitizeBlobName(file.originalname);
            const blobName = `${randomUUID()}-${safeOriginalName}`;
            console.log(`Uploading new file to source container: ${file.originalname}`);

            // Debug: Log file object structure
            console.log(`File object keys:`, Object.keys(file));
            console.log(`File path:`, file.path);
            console.log(`File buffer exists:`, !!file.buffer);

            try {
                let fileBuffer;

                // Check if file has path (disk storage) or buffer (memory storage)
                if (file.path) {
                    // Disk storage - read from file system
                    if (!fs.existsSync(file.path)) {
                        throw new Error(`File not found: ${file.path}`);
                    }
                    fileBuffer = fs.readFileSync(file.path);
                } else if (file.buffer) {
                    // Memory storage fallback - use buffer directly
                    fileBuffer = file.buffer;
                } else {
                    throw new Error(`File object missing both path and buffer. Available keys: ${Object.keys(file).join(', ')}`);
                }

                await uploadFileToBlob(
                    fileBuffer,
                    blobName,
                    sourceContainerName,
                    storageAccountName,
                    storageAccountKey
                );

                // Clear buffer from memory if it was read from disk
                if (file.path && fileBuffer) {
                    fileBuffer.fill(0);
                }

                // Delete temp file after successful upload (only if using disk storage)
                if (file.path) {
                    try {
                        await unlink(file.path);
                    } catch (unlinkError) {
                        console.warn(`Failed to delete temp file ${file.path}:`, unlinkError.message);
                        // Continue even if deletion fails
                    }
                } else if (file.buffer) {
                    // Clear memory buffer
                    file.buffer = null;
                    delete file.buffer;
                }

                filesToTranslate.push({
                    displayName: file.originalname,
                    blobName
                });
            } catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);

                // Try to clean up temp file even on error (only if using disk storage)
                if (file?.path && fs.existsSync(file.path)) {
                    try {
                        await unlink(file.path);
                    } catch (cleanupError) {
                        console.warn(`Failed to cleanup temp file:`, cleanupError.message);
                    }
                }
                throw error; // Re-throw to stop processing
            }
        }

        // Handle files selected from existing blobs
        for (const blob of selectedBlobFiles) {
            if (!blob?.originalName) continue;
            if (blob.container && blob.container !== sourceContainerName) {
                console.warn(`Skipping blob ${blob.originalName} from container ${blob.container}`);
                continue;
            }

            filesToTranslate.push({
                displayName: extractCleanFileName(blob.originalName),
                blobName: blob.originalName
            });
        }

        if (filesToTranslate.length === 0) {
            return res.status(400).json({ error: "No valid files found to translate" });
        }

        // Build translation inputs
        const inputs = [];
        const processedFiles = [];

        for (const info of filesToTranslate) {
            const sourceBlobSas = getBlobSASUrl(
                sourceContainerName,
                info.blobName,
                storageAccountName,
                storageAccountKey,
                BlobSASPermissions.parse("r"),
                24
            );

            const sanitizedDisplay = sanitizeBlobName(info.displayName);
            const ext = path.extname(sanitizedDisplay) || "";
            const baseName = path.basename(sanitizedDisplay, ext) || "document";
            const translatedBlobName = `${baseName}_${targetLanguage}_${randomUUID().slice(0, 8)}${ext}`;

            // Construct target URL correctly: baseUrl/blobName?sasToken
            const targetUrl = `${targetBaseUrl}/${translatedBlobName}?${targetSasToken}`;

            // Build source object - omit language field for auto-detection
            const sourceObject = {
                sourceUrl: sourceBlobSas,
                storageSource: "AzureBlob"
            };

            // Only add language if explicitly provided (not auto-detect)
            if (sourceLanguage) {
                sourceObject.language = sourceLanguage;
            }

            // Build target object
            const targetObject = {
                targetUrl,
                storageSource: "AzureBlob",
                language: targetLanguage
            };

            // Add glossary if provided
            if (glossaryBlobName) {
                try {
                    const glossaryInfo = await getGlossaryUrl(glossaryBlobName, 24);
                    // Azure only supports TSV format, so always use "tsv"
                    targetObject.glossaries = [{
                        glossaryUrl: glossaryInfo.glossaryUrl,
                        format: "tsv" // Always use "tsv" regardless of original file format
                    }];
                    console.log(`Using glossary: ${glossaryBlobName} (converted to TSV)`);
                } catch (glossaryError) {
                    console.warn(`Failed to get glossary URL for ${glossaryBlobName}:`, glossaryError.message);
                    // Continue without glossary if it fails
                }
            }

            inputs.push({
                storageType: "File",
                source: sourceObject,
                targets: [targetObject]
            });

            processedFiles.push({
                original: info.displayName,
                sourceBlob: info.blobName,
                translatedBlob: translatedBlobName,
                container: targetContainerName
            });
        }

        // Step 3: Submit translation job using REST API
        const batchUrl = `${endpoint}/translator/document/batches?api-version=${apiVersion}`;
        const requestBody = { inputs };

        console.log("Submitting translation job to Azure Document Translation REST API...");

        const submitResponse = await axios.post(batchUrl, requestBody, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        // Clear request body from memory after submission
        requestBody.inputs = null;

        // Extract job ID from response header
        const operationLocation = submitResponse.headers['operation-location'];
        if (!operationLocation) {
            throw new Error("No operation-location header in response");
        }

        console.log("Operation-Location header:", operationLocation);

        // Extract job ID from URL
        let jobId;
        const batchesMatch = operationLocation.match(/\/batches\/([^/?]+)/);
        if (batchesMatch && batchesMatch[1]) {
            jobId = batchesMatch[1];
        } else {
            const documentMatch = operationLocation.match(/\/document\/batches\/([^/?]+)/);
            if (documentMatch && documentMatch[1]) {
                jobId = documentMatch[1];
            } else {
                throw new Error(`Could not extract job ID from operation-location: ${operationLocation}`);
            }
        }

        console.log(`Translation job submitted. Job ID: ${jobId}`);

        // Step 4: Poll for translation status
        console.log("Polling for translation status...");
        const statusResult = await pollTranslationStatus(endpoint, apiKey, jobId, apiVersion);

        if (!statusResult.success) {
            throw new Error(statusResult.error || "Translation job failed");
        }

        // Extract cost information from Azure response
        const azureResponse = statusResult.data;

        // Log full Azure response for verification
        console.log('=== Azure Translation Response ===');
        console.log('Full Azure response:', JSON.stringify(azureResponse, null, 2));
        console.log('Summary object:', JSON.stringify(azureResponse.summary, null, 2));

        const summary = azureResponse.summary || {};
        const totalCharacterCharged = summary.totalCharacterCharged || 0;

        // Verify the field exists
        if (!summary.totalCharacterCharged) {
            console.warn('⚠️ WARNING: totalCharacterCharged not found in Azure response summary!');
            console.warn('Available summary fields:', Object.keys(summary));
        }

        const cost = (totalCharacterCharged / 1_000_000) * 15; // Document Translation: $15 per million

        console.log(`Translation completed successfully for ${processedFiles.length} file(s).`);
        console.log(`Total characters charged (from Azure): ${totalCharacterCharged.toLocaleString()}`);
        console.log(`Estimated cost: $${cost.toFixed(4)} USD`);
        console.log('===================================');

        // Log cost information to CSV for each file
        const costLogResults = [];
        for (const fileInfo of processedFiles) {
            // Distribute characters proportionally (or use actual if available per file)
            // For now, we'll log the total for the job, but you can enhance this to track per-file
            const fileCharacters = totalCharacterCharged / processedFiles.length; // Simple division
            const fileCost = cost / processedFiles.length;

            const logResult = await logTranslationCost({
                jobId,
                fileName: fileInfo.original,
                sourceLanguage: sourceLanguage || 'auto-detected',
                targetLanguage,
                charactersCharged: Math.round(fileCharacters),
                cost: fileCost,
                status: 'Succeeded',
                notes: `Translated blob: ${fileInfo.translatedBlob}`
            });

            costLogResults.push({
                fileName: fileInfo.original,
                charactersCharged: Math.round(fileCharacters),
                cost: fileCost,
                logged: logResult.success
            });
        }

        // If there's only one file or we want to log the total, also log a summary
        if (processedFiles.length > 0) {
            await logTranslationCost({
                jobId,
                fileName: `${processedFiles.length} file(s) - Total`,
                sourceLanguage: sourceLanguage || 'auto-detected',
                targetLanguage,
                charactersCharged: totalCharacterCharged,
                cost: cost,
                status: 'Succeeded',
                notes: `Job summary: ${processedFiles.length} files translated`
            });
        }

        return res.status(200).json({
            success: true,
            message: `${processedFiles.length} file(s) translated successfully.`,
            jobId,
            files: processedFiles,
            cost: {
                totalCharactersCharged: totalCharacterCharged,
                estimatedCost: cost.toFixed(4),
                currency: 'USD',
                costPerMillion: 15,
                costLogPath: path.join(process.cwd(), 'logs', 'translation-costs', 'translation-costs.csv')
            },
            costLogs: costLogResults
        });

    } catch (error) {
        console.error("File translation error:", error);

        // Try to log failed translation attempt
        try {
            await logTranslationCost({
                jobId: 'unknown',
                fileName: 'Translation Failed',
                sourceLanguage: sourceLanguage || 'unknown',
                targetLanguage: targetLanguage || 'unknown',
                charactersCharged: 0,
                cost: 0,
                status: 'Failed',
                notes: `Error: ${error.message}`
            });
        } catch (logError) {
            console.error('Failed to log error to CSV:', logError);
        }

        return res.status(500).json({
            error: "File translation failed",
            details: error.message
        });
    }
};

// New endpoint: List files in containers
export const listFiles = async(req, res) => {
    try {
        const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
        const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const sourceContainerName = process.env.AZURE_STORAGE_SOURCE_CONTAINER || "inputdocuments";
        const targetContainerName = process.env.AZURE_STORAGE_TARGET_CONTAINER || "documentstraslated";
        const container = req.query.container || 'all'; // 'source', 'target', or 'all'

        if (!storageAccountKey) {
            return res.status(500).json({
                error: "Azure Blob Storage account key not configured"
            });
        }

        const result = {};

        if (container === 'all' || container === 'source') {
            try {
                const sourceFiles = await listBlobsInContainer(
                    sourceContainerName,
                    storageAccountName,
                    storageAccountKey
                );
                // Add clean file name and original name
                result.source = {
                    container: sourceContainerName,
                    files: sourceFiles.map(file => ({
                        ...file,
                        cleanName: extractCleanFileName(file.name),
                        originalName: file.name
                    }))
                };
            } catch (err) {
                result.source = {
                    container: sourceContainerName,
                    error: err.message,
                    files: []
                };
            }
        }

        if (container === 'all' || container === 'target') {
            try {
                const targetFiles = await listBlobsInContainer(
                    targetContainerName,
                    storageAccountName,
                    storageAccountKey
                );
                // Add clean file name and original name
                result.target = {
                    container: targetContainerName,
                    files: targetFiles.map(file => ({
                        ...file,
                        cleanName: extractCleanFileName(file.name),
                        originalName: file.name
                    }))
                };
            } catch (err) {
                result.target = {
                    container: targetContainerName,
                    error: err.message,
                    files: []
                };
            }
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("List files error:", error);
        return res.status(500).json({
            error: "Failed to list files",
            details: error.message
        });
    }
};

// New endpoint: Download file from blob storage
export const downloadFile = async(req, res) => {
    try {
        const { container, fileName } = req.query;

        if (!container || !fileName) {
            return res.status(400).json({
                error: "Container and fileName are required"
            });
        }

        const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
        const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

        if (!storageAccountKey) {
            return res.status(500).json({
                error: "Azure Blob Storage account key not configured"
            });
        }

        // Download the file
        const fileBuffer = await downloadBlobByName(
            container,
            fileName,
            storageAccountName,
            storageAccountKey
        );

        // Determine content type
        const ext = fileName.split('.').pop().toLowerCase();
        const contentTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'html': 'text/html',
            'xml': 'application/xml'
        };

        res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        return res.send(fileBuffer);
    } catch (error) {
        console.error("Download file error:", error);
        return res.status(500).json({
            error: "Failed to download file",
            details: error.message
        });
    }
};

// New endpoint: Delete file from blob storage
export const deleteFile = async(req, res) => {
    try {
        const { container, fileName } = req.query;

        if (!container || !fileName) {
            return res.status(400).json({
                error: "Container and fileName are required"
            });
        }

        const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
        const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

        if (!storageAccountKey) {
            return res.status(500).json({
                error: "Azure Blob Storage account key not configured"
            });
        }

        await deleteBlob(container, fileName, storageAccountName, storageAccountKey);

        return res.status(200).json({
            success: true,
            message: `File ${fileName} deleted successfully`
        });
    } catch (error) {
        console.error("Delete file error:", error);
        return res.status(500).json({
            error: "Failed to delete file",
            details: error.message
        });
    }
};

export const getCharacterCount = async(req, res) => {
    try {
        const uploadedFiles = req.files && req.files["files"] ? req.files["files"] : [];

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ error: "No files provided" });
        }

        const results = [];
        let totalCharacters = 0;

        for (const file of uploadedFiles) {
            let fileBuffer;

            // Get file buffer
            if (file.path) {
                fileBuffer = fs.readFileSync(file.path);
            } else if (file.buffer) {
                fileBuffer = file.buffer;
            } else {
                results.push({
                    fileName: file.originalname,
                    error: "Could not read file"
                });
                continue;
            }

            const countResult = await countDocumentCharacters(fileBuffer, file.originalname);
            const costEstimate = calculateTranslationCost(countResult.characterCount, true);

            totalCharacters += countResult.characterCount;

            results.push({
                fileName: file.originalname,
                characterCount: countResult.characterCount,
                estimated: countResult.estimated,
                message: countResult.message,
                costEstimate: costEstimate.cost,
                fileSize: file.size
            });
        }

        const totalCost = calculateTranslationCost(totalCharacters, true);

        return res.status(200).json({
            success: true,
            files: results,
            total: {
                characterCount: totalCharacters,
                estimatedCost: totalCost.cost,
                currency: 'USD'
            }
        });
    } catch (error) {
        console.error("Character count error:", error);
        return res.status(500).json({
            error: "Failed to count characters",
            details: error.message
        });
    }
};

export default translateFiles;