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

/**
 * Generate plural form of a word
 * Simple pluralization rules:
 * - Add "s" for most words
 * - Add "es" for words ending in s, x, z, ch, sh
 * - Change "y" to "ies" for words ending in consonant+y
 * @param {string} word - Word to pluralize
 * @returns {string} - Plural form
 */
const pluralizeWord = (word) => {
  if (!word || word.length === 0) return word;
  
  const lower = word.toLowerCase();
  const lastChar = lower[lower.length - 1];
  const lastTwoChars = lower.slice(-2);
  
  // Words ending in s, x, z, ch, sh -> add "es"
  if (lastChar === 's' || lastChar === 'x' || lastChar === 'z' || 
      lastTwoChars === 'ch' || lastTwoChars === 'sh') {
    return word + 'es';
  }
  
  // Words ending in consonant + y -> change y to ies
  if (lastChar === 'y' && lower.length > 1) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const secondLastChar = lower[lower.length - 2];
    if (!vowels.includes(secondLastChar)) {
      return word.slice(0, -1) + 'ies';
    }
  }
  
  // Default: add "s"
  return word + 's';
};

/**
 * Generate plural form for a phrase (only pluralize first word for multi-word phrases)
 * @param {string} phrase - Phrase to pluralize
 * @returns {string} - Plural form
 */
const pluralizePhrase = (phrase) => {
  if (!phrase || !phrase.includes(' ')) {
    return pluralizeWord(phrase);
  }
  
  const words = phrase.split(' ');
  const firstWord = words[0];
  const rest = words.slice(1).join(' ');
  
  // Pluralize first word only
  const pluralFirstWord = pluralizeWord(firstWord);
  
  return rest ? `${pluralFirstWord} ${rest}` : pluralFirstWord;
};

/**
 * Expand entries with case variations and plural forms
 * Single words: 3 case variations + 3 plural variations = 6 total
 * Multi-word phrases: 4 case variations (idioms typically don't pluralize, but we'll add plural for first word)
 * @param {Array<{source: string, target: string}>} entries - Original entries
 * @returns {Array<{source: string, target: string}>} - Expanded entries with case variations and plural forms
 */
export const expandEntriesWithCaseVariations = (entries) => {
  const expanded = [];
  const seen = new Set(); // Track exact duplicates (case-sensitive)

  for (const entry of entries) {
    const { source, target } = entry;
    
    if (!source || !target) {
      continue; // Skip invalid entries
    }

    const isMultiWord = source.includes(' ');

    if (isMultiWord) {
      // Multi-word phrase: Generate 4 case variations
      const lower = source.toLowerCase();
      const firstWordCap = source.split(' ').map((word, idx) => 
        idx === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
      ).join(' ');
      const titleCase = source.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      const upper = source.toUpperCase();

      // Add case variations
      const caseVariations = [lower, firstWordCap, titleCase, upper];
      for (const variation of caseVariations) {
        const key = `${variation}\t${target}`;
        if (!seen.has(key)) {
          seen.add(key);
          expanded.push({ source: variation, target });
        }
      }

      // Add plural forms for each case variation
      for (const variation of caseVariations) {
        const plural = pluralizePhrase(variation);
        const pluralKey = `${plural}\t${target}`;
        if (!seen.has(pluralKey)) {
          seen.add(pluralKey);
          expanded.push({ source: plural, target });
        }
      }
    } else {
      // Single word: Generate 3 case variations
      const lower = source.toLowerCase();
      const upper = source.toUpperCase();
      const titleCase = source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();

      // Add case variations
      const caseVariations = [lower, upper, titleCase];
      for (const variation of caseVariations) {
        const key = `${variation}\t${target}`;
        if (!seen.has(key)) {
          seen.add(key);
          expanded.push({ source: variation, target });
        }
      }

      // Add plural forms for each case variation
      for (const variation of caseVariations) {
        const plural = pluralizeWord(variation);
        const pluralKey = `${plural}\t${target}`;
        if (!seen.has(pluralKey)) {
          seen.add(pluralKey);
          expanded.push({ source: plural, target });
        }
      }
    }
  }

  return expanded;
};

/**
 * Check if a string is in Title Case (first letter of each word capitalized)
 * @param {string} str - String to check
 * @returns {boolean} - True if Title Case
 */
const isTitleCase = (str) => {
  if (!str || str.length === 0) return false;
  const words = str.split(' ');
  return words.every(word => {
    if (word.length === 0) return true;
    return word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase();
  });
};

/**
 * Get base form of a word by removing common plural suffixes.
 * Runs iteratively so words like "tmseses" reduce to "tms".
 * @param {string} word - Word to get base form of
 * @returns {string} - Base form (or original if no change)
 */
const getBaseForm = (word) => {
  if (!word || word.length === 0) return word;

  let current = word;
  let iterations = 0;

  const removePluralOnce = (value) => {
    const lower = value.toLowerCase();

    // Words ending in 'ies' (cities -> city)
    if (lower.endsWith('ies') && lower.length > 3) {
      const withoutIes = value.slice(0, -3);
      const lastChar = withoutIes[withoutIes.length - 1]?.toLowerCase();
      if (lastChar && !['a', 'e', 'i', 'o', 'u'].includes(lastChar)) {
        return withoutIes + 'y';
      }
    }

    // Words ending in 'es'
    if (lower.endsWith('es') && lower.length > 2) {
      const withoutEs = value.slice(0, -2);
      const lastChar = withoutEs[withoutEs.length - 1]?.toLowerCase();
      if (lastChar && ['s', 'x', 'z'].includes(lastChar)) {
        return withoutEs;
      }
      if (lower.endsWith('ches') || lower.endsWith('shes')) {
        return withoutEs;
      }
    }

    // Words ending in 's'
    if (lower.endsWith('s') && lower.length > 1 && !lower.endsWith('ss')) {
      return value.slice(0, -1);
    }

    return value;
  };

  while (iterations < 5) {
    const next = removePluralOnce(current);
    if (next === current) {
      break;
    }
    current = next;
    iterations += 1;
  }

  return current;
};

/**
 * Normalize source to base form for grouping.
 * - Converts to lowercase
 * - Removes plural suffixes on the first word in multi-word phrases
 */
const normalizeToBase = (source) => {
  if (!source) return '';

  const trimmed = source.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  if (words.length === 0) return '';

  const firstWordBase = getBaseForm(words[0]);
  const normalizedWords = [
    firstWordBase.toLowerCase(),
    ...words.slice(1).map((word) => word.toLowerCase())
  ];

  return normalizedWords.join(' ');
};

/**
 * Group entries by base concept (same base form and same target)
 * Groups case variations and plural forms together
 * Returns groups with representative entries
 * @param {Array<{source: string, target: string}>} entries - All entries
 * @returns {Array<{representative: {source, target}, allVariations: Array<{source, target}>, variationCount: number}>} - Grouped entries
 */
export const groupEntriesByBaseConcept = (entries) => {
  const groups = new Map();
  
  entries.forEach(entry => {
    if (!entry.source || !entry.target) return;
    
    // Key: normalized base form + target (groups case and plural variations)
    const normalizedBase = normalizeToBase(entry.source);
    const key = `${normalizedBase}\t${entry.target}`;
    
    if (!groups.has(key)) {
      groups.set(key, {
        normalizedSource: normalizedBase,
        target: entry.target,
        allVariations: [entry]
      });
    } else {
      const group = groups.get(key);
      group.allVariations.push(entry);
    }
  });

  // For display, use the normalized source (lowercase singular) as the representative string.
  return Array.from(groups.values()).map(group => {
    const representative = {
      source: group.normalizedSource,
      target: group.target
    };

    return {
      representative,
      allVariations: group.allVariations,
      variationCount: group.allVariations.length
    };
  });
};

/**
 * Get display entries (representatives only) from all entries
 * @param {Array<{source: string, target: string}>} entries - All entries with variations
 * @returns {{displayEntries: Array<{source, target}>, totalEntries: number, displayCount: number}} - Display entries and counts
 */
export const getDisplayEntries = (entries) => {
  const groups = groupEntriesByBaseConcept(entries);
  const displayEntries = groups.map(group => group.representative);
  
  return {
    displayEntries,
    totalEntries: entries.length,
    displayCount: displayEntries.length
  };
};

