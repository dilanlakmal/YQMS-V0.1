/**
 * Glossary Controller
 * Handles CRUD operations for translation glossaries
 */

import { randomUUID } from "crypto";
import {
  uploadFileToBlob,
  getBlobSASUrl,
  listBlobsInContainer,
  downloadBlobByName,
  deleteBlob
} from "../../utils/azureBlobHelper.js";
import { BlobSASPermissions } from "@azure/storage-blob";
import {
  validateGlossaryFile,
  generateGlossaryBlobName,
  detectGlossaryFormat
} from "../../utils/glossaries/glossaryHelper.js";
import fs from 'fs';
import { promisify } from 'util';
const unlink = promisify(fs.unlink);

// Glossary container name
const GLOSSARY_CONTAINER = process.env.AZURE_STORAGE_GLOSSARY_CONTAINER || "glossaries";

/**
 * Extract metadata from glossary blob name
 * Format: {sourceLang}-{targetLang}-{timestamp}-{uuid}.{ext}
 */
const parseGlossaryBlobName = (blobName) => {
  const parts = blobName.split('-');
  if (parts.length < 4) {
    return null;
  }
  
  const ext = blobName.split('.').pop();
  const sourceLang = parts[0];
  const targetLang = parts[1];
  const timestamp = parts.slice(2, -1).join('-');
  const uuid = parts[parts.length - 1].replace(`.${ext}`, '');
  
  return {
    sourceLang,
    targetLang,
    timestamp,
    uuid,
    format: ext,
    originalName: blobName
  };
};

/**
 * Upload glossary file
 * POST /api/glossaries/upload
 */
export const uploadGlossary = async (req, res) => {
  try {
    const file = req.file;
    const { sourceLanguage, targetLanguage } = req.body;

    if (!file) {
      return res.status(400).json({ error: "Glossary file is required" });
    }

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({ 
        error: "Source language and target language are required" 
      });
    }

    // Get storage configuration
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      return res.status(500).json({ 
        error: "Azure Blob Storage account key not configured" 
      });
    }

    // Read file buffer
    let fileBuffer;
    if (file.path) {
      fileBuffer = fs.readFileSync(file.path);
    } else if (file.buffer) {
      fileBuffer = file.buffer;
    } else {
      return res.status(400).json({ error: "Could not read file" });
    }

    // Validate glossary file
    const validation = await validateGlossaryFile(fileBuffer, file.originalname);
    
    if (!validation.valid) {
      // Clean up temp file
      if (file.path && fs.existsSync(file.path)) {
        await unlink(file.path).catch(() => {});
      }
      return res.status(400).json({
        error: "Glossary validation failed",
        details: validation.errors,
        warnings: validation.warnings
      });
    }

    // Convert to TSV if not already TSV
    let finalBuffer = fileBuffer;
    let finalFormat = validation.format;

    if (validation.format !== 'tsv') {
      // Convert entries to TSV format
      const tsvContent = validation.entries
        .map(e => `${e.source}\t${e.target}`)
        .join('\n');
      finalBuffer = Buffer.from(tsvContent, 'utf-8');
      finalFormat = 'tsv';
      console.log(`Converted ${validation.format} glossary to TSV format`);
    }

    // Generate blob name with .tsv extension
    const blobName = generateGlossaryBlobName(
      sourceLanguage.toLowerCase(),
      targetLanguage.toLowerCase(),
      'tsv' // Always use tsv
    );

    // Upload to blob storage
    await uploadFileToBlob(
      finalBuffer,
      blobName,
      GLOSSARY_CONTAINER,
      storageAccountName,
      storageAccountKey
    );

    // Clean up temp file
    if (file.path && fs.existsSync(file.path)) {
      await unlink(file.path).catch(() => {});
    }

    // Return glossary metadata
    return res.status(200).json({
      success: true,
      message: "Glossary uploaded successfully",
      glossary: {
        blobName,
        sourceLanguage: sourceLanguage.toLowerCase(),
        targetLanguage: targetLanguage.toLowerCase(),
        format: finalFormat,
        entryCount: validation.entries.length,
        fileName: file.originalname,
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error("Glossary upload error:", error);
    
    // Clean up temp file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      await unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      error: "Failed to upload glossary",
      details: error.message
    });
  }
};

/**
 * List all glossaries
 * GET /api/glossaries/list
 */
export const listGlossaries = async (req, res) => {
  try {
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      return res.status(500).json({ 
        error: "Azure Blob Storage account key not configured" 
      });
    }

    // List all blobs in glossary container
    const blobs = await listBlobsInContainer(
      GLOSSARY_CONTAINER,
      storageAccountName,
      storageAccountKey
    );

    // Parse metadata from blob names
    const glossaries = blobs
      .map(blob => {
        const metadata = parseGlossaryBlobName(blob.name);
        if (!metadata) return null;

        return {
          blobName: blob.name,
          sourceLanguage: metadata.sourceLang,
          targetLanguage: metadata.targetLang,
          format: metadata.format,
          fileName: blob.name,
          size: blob.size,
          lastModified: blob.lastModified,
          languagePair: `${metadata.sourceLang}-${metadata.targetLang}`
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return res.status(200).json({
      success: true,
      glossaries,
      count: glossaries.length
    });

  } catch (error) {
    console.error("List glossaries error:", error);
    return res.status(500).json({
      error: "Failed to list glossaries",
      details: error.message
    });
  }
};

/**
 * Get glossaries for specific language pair
 * GET /api/glossaries/:sourceLang/:targetLang
 */
export const getGlossariesByLanguagePair = async (req, res) => {
  try {
    const { sourceLang, targetLang } = req.params;

    if (!sourceLang || !targetLang) {
      return res.status(400).json({ 
        error: "Source and target language parameters are required" 
      });
    }

    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      return res.status(500).json({ 
        error: "Azure Blob Storage account key not configured" 
      });
    }

    // List all blobs in glossary container
    const blobs = await listBlobsInContainer(
      GLOSSARY_CONTAINER,
      storageAccountName,
      storageAccountKey
    );

    // Parse metadata and filter by language pair
    const glossaries = blobs
      .map(blob => {
        const metadata = parseGlossaryBlobName(blob.name);
        if (!metadata) return null;

        return {
          blobName: blob.name,
          sourceLanguage: metadata.sourceLang,
          targetLanguage: metadata.targetLang,
          format: metadata.format,
          fileName: blob.name,
          size: blob.size,
          lastModified: blob.lastModified,
          languagePair: `${metadata.sourceLang}-${metadata.targetLang}`
        };
      })
      .filter(glossary => 
        glossary &&
        glossary.sourceLanguage.toLowerCase() === sourceLang.toLowerCase() &&
        glossary.targetLanguage.toLowerCase() === targetLang.toLowerCase()
      )
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return res.status(200).json({
      success: true,
      glossaries,
      count: glossaries.length,
      languagePair: `${sourceLang}-${targetLang}`
    });

  } catch (error) {
    console.error("Get glossaries by language pair error:", error);
    return res.status(500).json({
      error: "Failed to get glossaries",
      details: error.message
    });
  }
};

/**
 * Delete glossary
 * DELETE /api/glossaries/delete
 */
export const deleteGlossary = async (req, res) => {
  try {
    const { blobName } = req.query;

    if (!blobName) {
      return res.status(400).json({ 
        error: "blobName parameter is required" 
      });
    }

    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      return res.status(500).json({ 
        error: "Azure Blob Storage account key not configured" 
      });
    }

    // Delete blob
    await deleteBlob(
      GLOSSARY_CONTAINER,
      blobName,
      storageAccountName,
      storageAccountKey
    );

    return res.status(200).json({
      success: true,
      message: `Glossary ${blobName} deleted successfully`
    });

  } catch (error) {
    console.error("Delete glossary error:", error);
    return res.status(500).json({
      error: "Failed to delete glossary",
      details: error.message
    });
  }
};

/**
 * Get glossary SAS URL for translation use
 * GET /api/glossaries/:blobName/url
 */
export const getGlossaryUrl = async (blobName, expiresInHours = 24) => {
  try {
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      throw new Error("Azure Blob Storage account key not configured");
    }

    // Generate read-only SAS URL
    const glossarySasUrl = getBlobSASUrl(
      GLOSSARY_CONTAINER,
      blobName,
      storageAccountName,
      storageAccountKey,
      BlobSASPermissions.parse("r"), // Read-only
      expiresInHours
    );

    // Detect format from blob name
    const format = detectGlossaryFormat(blobName);

    return {
      glossaryUrl: glossarySasUrl,
      format: format
    };

  } catch (error) {
    console.error("Get glossary URL error:", error);
    throw error;
  }
};

/**
 * Get glossary URL endpoint
 * GET /api/glossaries/:blobName/url
 */
export const getGlossaryUrlEndpoint = async (req, res) => {
  try {
    const { blobName } = req.params;
    const expiresInHours = parseInt(req.query.expiresInHours) || 24;

    if (!blobName) {
      return res.status(400).json({ 
        error: "blobName parameter is required" 
      });
    }

    const result = await getGlossaryUrl(blobName, expiresInHours);

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("Get glossary URL endpoint error:", error);
    return res.status(500).json({
      error: "Failed to get glossary URL",
      details: error.message
    });
  }
};

