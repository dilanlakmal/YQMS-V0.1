/**
 * Glossary Helper Utilities
 * Functions for validating, parsing, and processing glossary files
 */

import { randomUUID } from "crypto";

/**
 * Detect glossary file format from file name extension
 * @param {string} fileName - File name with extension
 * @returns {string} - Format: 'tsv', 'csv', or 'xlsx'
 */
export const detectGlossaryFormat = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'tsv') return 'tsv';
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  
  throw new Error(`Unsupported file format: ${ext}. Supported formats: TSV, CSV, XLSX`);
};

/**
 * Parse TSV file content
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Array<{source: string, target: string}>} - Parsed entries
 */
const parseTSV = (fileBuffer) => {
  const content = fileBuffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const entries = [];

  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      entries.push({
        source: parts[0],
        target: parts[1]
      });
    }
  }

  return entries;
};

/**
 * Parse CSV file content
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Array<{source: string, target: string}>} - Parsed entries
 */
const parseCSV = (fileBuffer) => {
  const content = fileBuffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header row if it looks like a header (first row with common header words)
    if (i === 0 && (line.toLowerCase().includes('source') || line.toLowerCase().includes('target'))) {
      continue;
    }
    
    // Simple CSV parsing (handles quoted values)
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    if (parts.length >= 2 && parts[0] && parts[1]) {
      entries.push({
        source: parts[0].replace(/^"|"$/g, ''),
        target: parts[1].replace(/^"|"$/g, '')
      });
    }
  }

  return entries;
};

/**
 * Parse XLSX file content (requires xlsx package)
 * @param {Buffer} fileBuffer - File buffer
 * @returns {Array<{source: string, target: string}>} - Parsed entries
 */
const parseXLSX = async (fileBuffer) => {
  try {
    // Dynamic import to avoid requiring xlsx if not needed
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: ['source', 'target'], defval: '' });

    const entries = [];
    for (const row of data) {
      if (row.source && row.target) {
        entries.push({
          source: String(row.source).trim(),
          target: String(row.target).trim()
        });
      }
    }

    return entries;
  } catch (error) {
    throw new Error(`Failed to parse XLSX file: ${error.message}. Make sure 'xlsx' package is installed.`);
  }
};

/**
 * Parse glossary file based on format
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} format - File format: 'tsv', 'csv', or 'xlsx'
 * @returns {Promise<Array<{source: string, target: string}>>} - Parsed entries
 */
export const parseGlossaryFile = async (fileBuffer, format) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('File buffer is empty');
  }

  switch (format.toLowerCase()) {
    case 'tsv':
      return parseTSV(fileBuffer);
    case 'csv':
      return parseCSV(fileBuffer);
    case 'xlsx':
      return await parseXLSX(fileBuffer);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/**
 * Validate glossary structure
 * @param {Array<{source: string, target: string}>} entries - Parsed glossary entries
 * @returns {{valid: boolean, errors: string[], warnings: string[]}} - Validation result
 */
export const validateGlossaryStructure = (entries) => {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(entries)) {
    errors.push('Glossary entries must be an array');
    return { valid: false, errors, warnings };
  }

  if (entries.length === 0) {
    errors.push('Glossary file is empty or contains no valid entries');
    return { valid: false, errors, warnings };
  }

  if (entries.length < 2) {
    warnings.push('Glossary contains very few entries (less than 2)');
  }

  // Check for empty entries
  const emptyEntries = entries.filter(e => !e.source || !e.target);
  if (emptyEntries.length > 0) {
    errors.push(`Found ${emptyEntries.length} empty entries (missing source or target)`);
  }

  // Check for duplicate source terms
  const sourceTerms = entries.map(e => e.source?.toLowerCase().trim()).filter(Boolean);
  const duplicates = sourceTerms.filter((term, index) => sourceTerms.indexOf(term) !== index);
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    warnings.push(`Found ${uniqueDuplicates.length} duplicate source terms (last occurrence will be used)`);
  }

  // Check for very long terms (potential parsing errors)
  const longTerms = entries.filter(e => 
    (e.source && e.source.length > 500) || (e.target && e.target.length > 500)
  );
  if (longTerms.length > 0) {
    warnings.push(`Found ${longTerms.length} entries with very long terms (>500 chars), please verify`);
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
};

/**
 * Validate glossary file format and structure
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name with extension
 * @returns {Promise<{valid: boolean, format: string, entries: Array, errors: string[], warnings: string[]}>} - Validation result
 */
export const validateGlossaryFile = async (fileBuffer, fileName) => {
  const errors = [];
  const warnings = [];

  // Check file size
  if (!fileBuffer || fileBuffer.length === 0) {
    return {
      valid: false,
      format: null,
      entries: [],
      errors: ['File is empty'],
      warnings: []
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) {
    errors.push(`File size (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
  }

  // Detect format
  let format;
  try {
    format = detectGlossaryFormat(fileName);
  } catch (error) {
    errors.push(error.message);
    return {
      valid: false,
      format: null,
      entries: [],
      errors,
      warnings
    };
  }

  // Parse file
  let entries = [];
  try {
    entries = await parseGlossaryFile(fileBuffer, format);
  } catch (error) {
    errors.push(`Failed to parse file: ${error.message}`);
    return {
      valid: false,
      format,
      entries: [],
      errors,
      warnings
    };
  }

  // Validate structure
  const structureValidation = validateGlossaryStructure(entries);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);

  return {
    valid: errors.length === 0,
    format,
    entries,
    errors,
    warnings
  };
};

/**
 * Generate standardized blob name for glossary
 * @param {string} sourceLang - Source language code (e.g., 'en')
 * @param {string} targetLang - Target language code (e.g., 'fr')
 * @param {string} format - File format (e.g., 'tsv')
 * @returns {string} - Blob name: {sourceLang}-{targetLang}-{timestamp}-{uuid}.{ext}
 */
export const generateGlossaryBlobName = (sourceLang, targetLang, format) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
  const uuid = randomUUID().slice(0, 8);
  // Always use .tsv extension since Azure only supports TSV
  return `${sourceLang}-${targetLang}-${timestamp}-${uuid}.tsv`;
};

