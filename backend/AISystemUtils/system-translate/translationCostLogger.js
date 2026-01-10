import fs from 'fs';
import path from 'path';

const costLogDir = path.join(process.cwd(), 'logs', 'translation-costs');
const csvFilePath = path.join(costLogDir, 'translation-costs.csv');

// Ensure directory exists
if (!fs.existsSync(costLogDir)) {
  fs.mkdirSync(costLogDir, { recursive: true });
}

// Initialize CSV file with headers if it doesn't exist
const initializeCSV = () => {
  if (!fs.existsSync(csvFilePath)) {
    const headers = [
      'Date',
      'Time',
      'Job ID',
      'File Name',
      'Source Language',
      'Target Language',
      'Characters Charged',
      'Cost (USD)',
      'Status',
      'Notes'
    ].join(',');
    fs.writeFileSync(csvFilePath, headers + '\n', 'utf-8');
  }
};

/**
 * Save translation cost information to CSV file
 */
export const logTranslationCost = async (translationData) => {
  try {
    initializeCSV();
    
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    
    const {
      jobId,
      fileName,
      sourceLanguage = 'auto',
      targetLanguage,
      charactersCharged = 0,
      cost = 0,
      status = 'Succeeded',
      notes = ''
    } = translationData;

    // Calculate cost if not provided (Document Translation: $15 per million characters)
    const calculatedCost = cost || (charactersCharged / 1_000_000) * 15;
    
    const row = [
      date,
      time,
      jobId || '',
      fileName || '',
      sourceLanguage,
      targetLanguage || '',
      charactersCharged.toString(),
      calculatedCost.toFixed(4),
      status,
      notes.replace(/,/g, ';') // Replace commas in notes to avoid CSV issues
    ].join(',');

    // Append to CSV file
    fs.appendFileSync(csvFilePath, row + '\n', 'utf-8');
    
    console.log(`Translation cost logged: ${fileName} - ${charactersCharged} chars - $${calculatedCost.toFixed(4)}`);
    
    return {
      success: true,
      filePath: csvFilePath,
      cost: calculatedCost,
      charactersCharged
    };
  } catch (error) {
    console.error('Error logging translation cost:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all translation costs from CSV
 */
export const getTranslationCosts = () => {
  try {
    if (!fs.existsSync(csvFilePath)) {
      return [];
    }
    
    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length <= 1) {
      return []; // Only headers
    }
    
    const headers = lines[0].split(',');
    const records = lines.slice(1).map(line => {
      const values = line.split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim() || '';
      });
      return record;
    });
    
    return records;
  } catch (error) {
    console.error('Error reading translation costs:', error);
    return [];
  }
};
