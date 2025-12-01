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
  deleteBlob,
  readBlobContent,
  updateBlobContent
} from "../../utils/azureBlobHelper.js";
import { BlobSASPermissions } from "@azure/storage-blob";
import {
  validateGlossaryFile,
  generateGlossaryBlobName,
  detectGlossaryFormat,
  expandEntriesWithCaseVariations,
  parseGlossaryFile,
  getDisplayEntries
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
  const ext = blobName.split('.').pop();
  const basename = blobName.replace(`.${ext}`, '');

  // Regex to capture: sourceLang - targetLang(with optional -subtags) - timestamp - uuid
  const regex = /^([a-z]{2,})(?:-((?:[a-z0-9]{2,}(?:-[a-z0-9]+)*)))-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-([0-9a-f]{8})$/i;
  const match = basename.match(regex);

  if (!match) {
    // Fallback to legacy parsing (may not capture subtags correctly)
    const parts = basename.split('-');
    if (parts.length < 4) {
      return null;
    }

    return {
      sourceLang: parts[0],
      targetLang: parts[1],
      timestamp: parts.slice(2, -1).join('-'),
      uuid: parts[parts.length - 1],
      format: ext,
      originalName: blobName
    };
  }

  const [, sourceLang, targetLangRaw, timestamp, uuid] = match;

  return {
    sourceLang: sourceLang.toLowerCase(),
    targetLang: (targetLangRaw || '').toLowerCase(),
    timestamp,
    uuid,
    format: ext,
    originalName: blobName
  };
};

/**
 * Find existing glossary by language pair
 * Returns the most recent glossary if multiple exist
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code
 * @param {string} storageAccountName - Storage account name
 * @param {string} storageAccountKey - Storage account key
 * @returns {Promise<{blobName: string, lastModified: Date} | null>} - Found glossary or null
 */
const findGlossaryByLanguagePair = async (sourceLanguage, targetLanguage, storageAccountName, storageAccountKey) => {
  try {
    // List all blobs in glossary container
    const blobs = await listBlobsInContainer(
      GLOSSARY_CONTAINER,
      storageAccountName,
      storageAccountKey
    );

    // Parse metadata and filter by language pair
    const matchingGlossaries = blobs
      .map(blob => {
        const metadata = parseGlossaryBlobName(blob.name);
        if (!metadata) return null;

        return {
          blobName: blob.name,
          sourceLanguage: metadata.sourceLang,
          targetLanguage: metadata.targetLang,
          lastModified: blob.lastModified
        };
      })
      .filter(glossary => 
        glossary &&
        glossary.sourceLanguage.toLowerCase() === sourceLanguage.toLowerCase() &&
        glossary.targetLanguage.toLowerCase() === targetLanguage.toLowerCase()
      )
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)); // Most recent first

    if (matchingGlossaries.length === 0) {
      return null;
    }

    // Return the most recent one
    return {
      blobName: matchingGlossaries[0].blobName,
      lastModified: matchingGlossaries[0].lastModified
    };
  } catch (error) {
    console.error("Error finding glossary by language pair:", error);
    throw error;
  }
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

    // Expand entries with case variations
    const originalCount = validation.entries.length;
    const expandedEntries = expandEntriesWithCaseVariations(validation.entries);
    const expandedCount = expandedEntries.length;
    
    if (expandedCount > originalCount) {
      console.log(`Expanded ${originalCount} entries to ${expandedCount} entries with case variations`);
    }

    // Convert to TSV if not already TSV
    let finalBuffer = fileBuffer;
    let finalFormat = validation.format;

    if (validation.format !== 'tsv') {
      // Convert expanded entries to TSV format
      const tsvContent = expandedEntries
        .map(e => `${e.source}\t${e.target}`)
        .join('\n');
      finalBuffer = Buffer.from(tsvContent, 'utf-8');
      finalFormat = 'tsv';
      console.log(`Converted ${validation.format} glossary to TSV format`);
    } else {
      // Even if already TSV, use expanded entries
      const tsvContent = expandedEntries
        .map(e => `${e.source}\t${e.target}`)
        .join('\n');
      finalBuffer = Buffer.from(tsvContent, 'utf-8');
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
        entryCount: expandedCount,
        originalEntryCount: originalCount,
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

/**
 * Download glossary file
 * GET /api/glossaries/:blobName/download
 */
export const downloadGlossary = async (req, res) => {
  try {
    const { blobName } = req.params;

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

    // Read glossary content from blob storage
    const glossaryBuffer = await readBlobContent(
      GLOSSARY_CONTAINER,
      blobName,
      storageAccountName,
      storageAccountKey
    );

    // Set headers for file download
    res.setHeader('Content-Type', 'text/tab-separated-values');
    res.setHeader('Content-Disposition', `attachment; filename="${blobName}"`);
    res.setHeader('Content-Length', glossaryBuffer.length);

    // Send file buffer
    res.send(glossaryBuffer);

  } catch (error) {
    console.error("Download glossary error:", error);
    return res.status(500).json({
      error: "Failed to download glossary",
      details: error.message
    });
  }
};

/**
 * Get glossary entries
 * GET /api/glossaries/:blobName/entries
 */
export const getGlossaryEntries = async (req, res) => {
  try {
    const { blobName } = req.params;
    const displayOnly = req.query.displayOnly === 'true';

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

    // Parse blob name to get language pair
    const metadata = parseGlossaryBlobName(blobName);
    if (!metadata) {
      return res.status(400).json({
        error: "Invalid glossary blob name format"
      });
    }

    // Read glossary content from blob storage
    const glossaryBuffer = await readBlobContent(
      GLOSSARY_CONTAINER,
      blobName,
      storageAccountName,
      storageAccountKey
    );

    // Parse entries (always TSV format in storage)
    const allEntries = await parseGlossaryFile(glossaryBuffer, 'tsv');

    // If displayOnly=true, return only representative entries
    if (displayOnly) {
      const { displayEntries, totalEntries, displayCount } = getDisplayEntries(allEntries);
      return res.status(200).json({
        success: true,
        blobName: blobName,
        sourceLanguage: metadata.sourceLang,
        targetLanguage: metadata.targetLang,
        entries: displayEntries,
        totalEntries: totalEntries,
        displayEntries: displayCount
      });
    }

    // Return all entries (default behavior)
    return res.status(200).json({
      success: true,
      blobName: blobName,
      sourceLanguage: metadata.sourceLang,
      targetLanguage: metadata.targetLang,
      entries: allEntries,
      totalEntries: allEntries.length
    });

  } catch (error) {
    console.error("Get glossary entries error:", error);
    return res.status(500).json({
      error: "Failed to get glossary entries",
      details: error.message
    });
  }
};

/**
 * Update glossary entries
 * PUT /api/glossaries/:blobName/entries
 */
export const updateGlossaryEntries = async (req, res) => {
  try {
    const { blobName } = req.params;
    const { entries } = req.body;

    if (!blobName) {
      return res.status(400).json({
        error: "blobName parameter is required"
      });
    }

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({
        error: "Entries array is required"
      });
    }

    // Validate entries structure
    for (const entry of entries) {
      if (!entry.source || !entry.target) {
        return res.status(400).json({
          error: "Each entry must have both 'source' and 'target' fields"
        });
      }
    }

    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      return res.status(500).json({
        error: "Azure Blob Storage account key not configured"
      });
    }

    // Automatically expand entries with case variations and plural forms
    const expandedEntries = expandEntriesWithCaseVariations(entries);
    console.log(`Expanded ${entries.length} entries to ${expandedEntries.length} entries with case variations and plural forms`);

    // Convert expanded entries to TSV format
    const tsvContent = expandedEntries
      .map(e => `${e.source}\t${e.target}`)
      .join('\n');
    const tsvBuffer = Buffer.from(tsvContent, 'utf-8');

    // Update blob in Azure Storage
    await updateBlobContent(
      GLOSSARY_CONTAINER,
      blobName,
      tsvBuffer,
      storageAccountName,
      storageAccountKey
    );

    return res.status(200).json({
      success: true,
      message: "Glossary updated successfully",
      totalEntries: expandedEntries.length,
      originalEntries: entries.length,
      expandedEntries: expandedEntries.length
    });

  } catch (error) {
    console.error("Update glossary entries error:", error);
    return res.status(500).json({
      error: "Failed to update glossary entries",
      details: error.message
    });
  }
};

/**
 * Add entries to existing glossary
 * POST /api/glossaries/add-entries
 */
export const addEntriesToGlossary = async (req, res) => {
  try {
    const { sourceLanguage, targetLanguage, entries, blobName } = req.body;

    // Validate input
    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: "Source language and target language are required"
      });
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: "Entries array is required and must not be empty"
      });
    }

    // Validate entries structure
    for (const entry of entries) {
      if (!entry.source || !entry.target) {
        return res.status(400).json({
          error: "Each entry must have both 'source' and 'target' fields"
        });
      }
    }

    // Get storage configuration
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sophystorage";
    const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!storageAccountKey) {
      return res.status(500).json({
        error: "Azure Blob Storage account key not configured"
      });
    }

    // Find existing glossary
    let existingGlossary = null;
    let targetBlobName = blobName;

    if (blobName) {
      // Use provided blob name
      existingGlossary = { blobName: blobName };
    } else {
      // Find by language pair
      existingGlossary = await findGlossaryByLanguagePair(
        sourceLanguage.toLowerCase(),
        targetLanguage.toLowerCase(),
        storageAccountName,
        storageAccountKey
      );
      if (existingGlossary) {
        targetBlobName = existingGlossary.blobName;
      }
    }

    // Get existing entries if glossary exists
    let existingEntries = [];
    if (existingGlossary) {
      try {
        // Download existing glossary
        const existingBuffer = await readBlobContent(
          GLOSSARY_CONTAINER,
          targetBlobName,
          storageAccountName,
          storageAccountKey
        );

        // Parse existing TSV entries
        existingEntries = await parseGlossaryFile(existingBuffer, 'tsv');
        console.log(`Found existing glossary with ${existingEntries.length} entries`);
      } catch (error) {
        console.error("Error reading existing glossary:", error);
        // If we can't read it, treat as new glossary
        existingGlossary = null;
        existingEntries = [];
      }
    }

    // Expand new entries with case variations (includes plural forms)
    const expandedNewEntries = expandEntriesWithCaseVariations(entries);
    console.log(`Expanded ${entries.length} new entries to ${expandedNewEntries.length} entries with case variations and plural forms`);

    // Merge entries - ignore duplicates, just append all new entries
    const mergedEntries = [...existingEntries, ...expandedNewEntries];
    const addedVariations = expandedNewEntries;

    // Convert merged entries to TSV
    const tsvContent = mergedEntries
      .map(e => `${e.source}\t${e.target}`)
      .join('\n');
    const tsvBuffer = Buffer.from(tsvContent, 'utf-8');

    // Upload updated TSV
    if (existingGlossary) {
      // Update existing glossary
      await updateBlobContent(
        GLOSSARY_CONTAINER,
        targetBlobName,
        tsvBuffer,
        storageAccountName,
        storageAccountKey
      );
      console.log(`Updated glossary ${targetBlobName} with ${mergedEntries.length} total entries`);
    } else {
      // Create new glossary
      targetBlobName = generateGlossaryBlobName(
        sourceLanguage.toLowerCase(),
        targetLanguage.toLowerCase(),
        'tsv'
      );
      await uploadFileToBlob(
        tsvBuffer,
        targetBlobName,
        GLOSSARY_CONTAINER,
        storageAccountName,
        storageAccountKey
      );
      console.log(`Created new glossary ${targetBlobName} with ${mergedEntries.length} entries`);
    }

    // Return response
    return res.status(200).json({
      success: true,
      message: existingGlossary 
        ? `Added ${addedVariations.length} entries to existing glossary`
        : `Created new glossary with ${addedVariations.length} entries`,
      glossary: {
        blobName: targetBlobName,
        sourceLanguage: sourceLanguage.toLowerCase(),
        targetLanguage: targetLanguage.toLowerCase(),
        totalEntries: mergedEntries.length,
        addedEntries: addedVariations.length
      },
      addedVariations: addedVariations.slice(0, 50) // Limit to first 50 for response size
    });

  } catch (error) {
    console.error("Add entries to glossary error:", error);
    return res.status(500).json({
      error: "Failed to add entries to glossary",
      details: error.message
    });
  }
};

