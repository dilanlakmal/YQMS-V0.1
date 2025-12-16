import { p88LegacyData } from '../../MongoDB/dbConnectionController.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Generate unique key from inspection numbers array
const generateInspectionNumbersKey = (inspectionNumbers) => {
  if (!inspectionNumbers || inspectionNumbers.length === 0) {
    return null; // Return null for empty arrays (sparse index will ignore)
  }
  
  // Filter out empty values, sort for consistency, and join
  const cleanNumbers = inspectionNumbers
    .filter(num => num && num.toString().trim() !== '') // Remove empty/null values
    .map(num => num.toString().trim()) // Convert to string and trim
    .sort(); // Sort for consistency regardless of order
  
  if (cleanNumbers.length === 0) {
    return null;
  }
  
  return cleanNumbers.join('-'); // Use - as delimiter
};

// Generate upload batch ID
const generateUploadBatch = () => {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Function to find the group number column
const findGroupNumberColumn = (headers) => {
  console.log('🔍 Looking for Group # column in headers:', headers);
  
  const possibleGroupColumns = [
    'Group #', 'Group Number', 'GroupNumber', 'Group ID', 'Group',
    'group #', 'group number', 'groupnumber', 'group id', 'group',
    'GROUP #', 'GROUP NUMBER', 'GROUPNUMBER', 'GROUP ID', 'GROUP'
  ];
  
  for (const possibleName of possibleGroupColumns) {
    if (headers.includes(possibleName)) {
      console.log(`✅ Found exact group column match: "${possibleName}"`);
      return possibleName;
    }
  }
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const lowerHeader = header.toLowerCase().trim();
    if (lowerHeader.includes('group') && lowerHeader.includes('#')) {
      console.log(`✅ Found partial group column match: "${header}"`);
      return header;
    }
  }
  
  console.log('❌ No group column found');
  return null;
};

// Function to map CSV headers to schema fields
const mapCsvToSchema = (csvRow, groupColumnName, uploadBatch) => {
  const fixedHeaders = [
    'Group #', 'Group Number', 'GroupNumber', 'Group ID', 'Group',
    'Supplier', 'PO #', 'SKU #', 'Style', 'Color', 'Size', 
    'Brand', 'Buyer', 'Client', 'Material', 'Origin', 
    'Port of Loading', 'Port of Arrival', 'Destination', 
    'Description', 'SKU Name', 'Packing Type', 
    'Master Carton / Packed Qty', 'Inner Pack Qty', 'Retail Price', 
    'Order Date', 'Terms', 'Total PO Items Qty', 'Qty to Inspect', 
    'Qty Inspected', 'ETD', 'ETA', 'Scheduled Inspection Date', 
    'Submitted Inspection Date', 'Decision Date', 'Last Modified Date', 
    'Inspection Result', 'Approval Status', 'Report Type', 'Inspector', 
    'Project', 'Sample Size', 'Sample Inspected', 'Inspector Decision', 
    'Inspection Location', 'Defect Rate', 'Total Number of Defects', 
    'Total Defective Units', 'Total Good Units', 'Qty Critical Defects', 
    'Defect Category', 'Defect Code', 'Defect', 'Qty Major Defects', 
    'Qty Minor Defects', 'All Comments', 'Inspection #',
    'PoLine:Customer PO#', 'PoLine:Main PO#', 'PoLine PO#', 'PoLine\nPO#'
  ];

  const mainFields = {
    'Supplier': 'supplier',
    'PO #': 'poNumbers',
    'SKU #': 'skuNumbers',
    'Style': 'style',
    'Color': 'colors',
    'Size': 'sizes',
    'Brand': 'brand',
    'Buyer': 'buyer',
    'Client': 'client',
    'Material': 'material',
    'Origin': 'origin',
    'Port of Loading': 'portOfLoading',
    'Port of Arrival': 'portOfArrival',
    'Destination': 'destination',
    'Description': 'description',
    'SKU Name': 'skuName',
    'Packing Type': 'packingType',
    'Master Carton / Packed Qty': 'masterCartonPackedQty',
    'Inner Pack Qty': 'innerPackQty',
    'Retail Price': 'retailPrice',
    'Order Date': 'orderDate',
    'Terms': 'terms',
    'Total PO Items Qty': 'totalPoItemsQty',
    'Qty to Inspect': 'qtyToInspect',
    'Qty Inspected': 'qtyInspected',
    'ETD': 'etd',
    'ETA': 'eta',
    'Scheduled Inspection Date': 'scheduledInspectionDate',
    'Submitted Inspection Date': 'submittedInspectionDate',
    'Decision Date': 'decisionDate',
    'Last Modified Date': 'lastModifiedDate',
    'Inspection Result': 'inspectionResult',
    'Approval Status': 'approvalStatus',
    'Report Type': 'reportType',
    'Inspector': 'inspector',
    'Project': 'project',
    'Sample Size': 'sampleSize',
    'Sample Inspected': 'sampleInspected',
    'Inspector Decision': 'inspectorDecision',
    'Inspection Location': 'inspectionLocation',
    'Defect Rate': 'defectRate',
    'Total Number of Defects': 'totalNumberOfDefects',
    'Total Defective Units': 'totalDefectiveUnits',
    'Total Good Units': 'totalGoodUnits',
    'All Comments': 'allComments',
    'Inspection #': 'inspectionNumbers',
    'PoLine:Customer PO#': 'poLineCustomerPO',
    'PoLine:Main PO#': 'poLineMainPO'
  };

  const mappedData = {};
  const defects = [];
  const defectCategories = [];
  const defectCodes = [];
  const defectDescriptions = []; // ✅ This will ONLY contain "Defect" column data
  let qtyCriticalDefects = 0;
  let qtyMajorDefects = 0;
  let qtyMinorDefects = 0;

  // Helper functions
  const parseDate = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const parseDateArray = (dateString) => {
    if (!dateString || dateString.trim() === '') return [];
    const dates = dateString.split(',').map(d => parseDate(d.trim())).filter(d => d !== null);
    return dates;
  };

  const parseNumber = (numberString) => {
    if (!numberString || numberString.trim() === '') return 0;
    const cleaned = numberString.toString().replace(/[,$%]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const parseArray = (arrayString) => {
    if (!arrayString || arrayString.trim() === '') return [];
    return arrayString.split(',').map(item => item.trim()).filter(item => item !== '');
  };

  // Set group number
  if (groupColumnName && csvRow[groupColumnName] !== undefined) {
    const groupValue = csvRow[groupColumnName];
    if (groupValue !== null && groupValue !== undefined) {
      mappedData.groupNumber = groupValue.toString().trim();
    } else {
      mappedData.groupNumber = '';
    }
  } else {
    mappedData.groupNumber = '';
  }

  // Process each CSV column
  Object.keys(csvRow).forEach(csvHeader => {
    const value = csvRow[csvHeader];
   
    if (mainFields[csvHeader]) {
      const schemaField = mainFields[csvHeader];
     
      if (['poNumbers', 'skuNumbers', 'colors', 'sizes', 'inspectionNumbers', 'poLineCustomerPO', 'poLineMainPO'].includes(schemaField)) {
        mappedData[schemaField] = parseArray(value);
      }
      else if (['etd', 'eta'].includes(schemaField)) {
        mappedData[schemaField] = parseDateArray(value);
      }
      else if (schemaField.includes('Date')) {
        mappedData[schemaField] = parseDate(value);
      }
      else if (['masterCartonPackedQty', 'innerPackQty', 'retailPrice', 'totalPoItemsQty',
                'qtyToInspect', 'qtyInspected', 'sampleSize', 'sampleInspected',
                'defectRate', 'totalNumberOfDefects', 'totalDefectiveUnits', 'totalGoodUnits'].includes(schemaField)) {
        mappedData[schemaField] = parseNumber(value);
      }
      else if (schemaField === 'inspectionResult') {
        const validResults = ['Pass', 'Fail', 'Pending', 'Hold'];
        const normalizedValue = value ? value.trim() : '';
        mappedData[schemaField] = validResults.includes(normalizedValue) ? normalizedValue : '';
      }
      else {
        mappedData[schemaField] = value ? value.toString().trim() : '';
      }
    }
    // ✅ FIXED: Handle special defect summary fields for top-level arrays
    else if (csvHeader === 'Defect Category') {
      const category = value ? value.toString().trim() : '';
      if (category) defectCategories.push(category);
    }
    else if (csvHeader === 'Defect Code') {
      const code = value ? value.toString().trim() : '';
      if (code) defectCodes.push(code);
    }
    else if (csvHeader === 'Defect') {
      // ✅ ONLY add to defectDescriptions if it's from the "Defect" column
      const description = value ? value.toString().trim() : '';
      if (description) defectDescriptions.push(description);
    }
    else if (csvHeader === 'Qty Critical Defects') {
      qtyCriticalDefects += parseNumber(value);
    }
    else if (csvHeader === 'Qty Major Defects') {
      qtyMajorDefects += parseNumber(value);
    }
    else if (csvHeader === 'Qty Minor Defects') {
      qtyMinorDefects += parseNumber(value);
    }
    // ✅ FIXED: Handle dynamic defect columns - DON'T add to defectDescriptions
    else if (!fixedHeaders.includes(csvHeader) && csvHeader !== groupColumnName) {
      const count = parseNumber(value);
      if (count > 0) {
        defects.push({
          defectName: csvHeader,
          count: count
        });
        // ❌ REMOVED: defectDescriptions.push(csvHeader); 
        // Dynamic defect names should NOT go into defectDescriptions
      }
    }
  });

  // Initialize arrays if not set
  if (!mappedData.poLineCustomerPO) mappedData.poLineCustomerPO = [];
  if (!mappedData.poLineMainPO) mappedData.poLineMainPO = [];

  // ✅ FIXED: Set top-level defect summary data
  mappedData.defects = defects;
  mappedData.defectCategories = [...new Set(defectCategories)];
  mappedData.defectCodes = [...new Set(defectCodes)];
  mappedData.defectDescriptions = [...new Set(defectDescriptions)]; // Only "Defect" column data
  mappedData.qtyCriticalDefects = qtyCriticalDefects;
  mappedData.qtyMajorDefects = qtyMajorDefects;
  mappedData.qtyMinorDefects = qtyMinorDefects;

  // Add upload batch
  mappedData.uploadBatch = uploadBatch;

  // Generate unique key from inspection numbers
  mappedData.inspectionNumbersKey = generateInspectionNumbersKey(mappedData.inspectionNumbers);

  console.log(`🔑 Generated key for inspection numbers [${(mappedData.inspectionNumbers || []).join(', ')}]: "${mappedData.inspectionNumbersKey}"`);
  console.log(`📋 Defect Categories: [${defectCategories.join(', ')}]`);
  console.log(`🔢 Defect Codes: [${defectCodes.join(', ')}]`);
  console.log(`📝 Defect Descriptions (from "Defect" column only): [${defectDescriptions.join(', ')}]`);
  console.log(`⚡ Dynamic Defects (not in defectDescriptions): [${defects.map(d => d.defectName).join(', ')}]`);

  return mappedData;
};

// Controller function to handle CSV upload
export const uploadP88Data = async (req, res) => {
  try {
    console.log('🚀 Upload controller started');
   
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const csvData = [];
    const stream = Readable.from(req.file.buffer.toString());

    // Parse CSV
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          skipEmptyLines: true,
          trim: true
        }))
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or invalid'
      });
    }

    console.log(`📊 Parsed ${csvData.length} rows from CSV`);

    // Generate upload batch ID
    const uploadBatch = generateUploadBatch();
    console.log(`🏷️ Upload batch ID: ${uploadBatch}`);

    const headers = Object.keys(csvData[0]);
    const groupColumnName = findGroupNumberColumn(headers);
    
    if (!groupColumnName) {
      console.log('⚠️ No group number column found, but continuing with processing...');
    } else {
      console.log(`🎯 Using group column: "${groupColumnName}"`);
    }

    const savedRecords = [];
    const updatedRecords = [];
    const errors = [];
    let emptyGroupRecords = 0;
    let emptyInspectionNumbers = 0;

    // Process each row individually
    for (let i = 0; i < csvData.length; i++) {
      try {
        const row = csvData[i];
        
        const mappedData = mapCsvToSchema(row, groupColumnName, uploadBatch);
        
        // Track empty group numbers
        if (!mappedData.groupNumber || mappedData.groupNumber.trim() === '') {
          emptyGroupRecords++;
          console.log(`📝 Processing row ${i + 1} with EMPTY group number`);
        } else {
          console.log(`💾 Processing row ${i + 1} with group: "${mappedData.groupNumber}"`);
        }

        // Track empty inspection numbers
        if (!mappedData.inspectionNumbersKey) {
          emptyInspectionNumbers++;
          console.log(`⚠️ Row ${i + 1} has NO inspection numbers key`);
        } else {
          console.log(`🔑 Row ${i + 1} inspection key: "${mappedData.inspectionNumbersKey}"`);
        }

        console.log(`   Inspection Numbers: [${(mappedData.inspectionNumbers || []).join(', ')}]`);
        console.log(`   PoLine Customer PO: ${mappedData.poLineCustomerPO.length} items`);
        console.log(`   PoLine Main PO: ${mappedData.poLineMainPO.length} items`);
        console.log(`   Defects: ${mappedData.defects.length} items`);

        try {
          // Try to create new record first
          const p88Record = new p88LegacyData(mappedData);
          const savedRecord = await p88Record.save();
          
          console.log(`✅ Successfully saved NEW record for row ${i + 1}`);
          savedRecords.push(savedRecord);
          
        } catch (saveError) {
          // Handle duplicate key error for inspectionNumbersKey
          if (saveError.code === 11000 && saveError.keyPattern?.inspectionNumbersKey) {
            console.log(`🔄 Duplicate inspection numbers key found for row ${i + 1}, updating existing record`);
            
            try {
              const updatedRecord = await p88LegacyData.findOneAndUpdate(
                { inspectionNumbersKey: mappedData.inspectionNumbersKey },
                { 
                  ...mappedData,
                  lastModifiedDate: new Date(),
                  updatedAt: new Date()
                },
                { 
                  new: true, 
                  runValidators: true 
                }
              );
              
              if (updatedRecord) {
                console.log(`✅ Successfully UPDATED existing record for row ${i + 1}`);
                updatedRecords.push({
                  rowNumber: i + 1,
                  recordId: updatedRecord._id,
                  inspectionNumbersKey: mappedData.inspectionNumbersKey,
                  inspectionNumbers: mappedData.inspectionNumbers
                });
              } else {
                throw new Error('Failed to update existing record');
              }
              
            } catch (updateError) {
              console.error(`❌ Error updating existing record for row ${i + 1}:`, updateError.message);
              errors.push({
                rowNumber: i + 1,
                error: `Update failed: ${updateError.message}`,
                field: 'inspectionNumbersKey'
              });
            }
            
          } else {
            // Other save errors
            throw saveError;
          }
        }

      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
        errors.push({
          rowNumber: i + 1,
          error: error.message,
          field: 'general'
        });
      }
    }

    console.log(`🎉 Processing complete:`);
    console.log(`   📊 New records saved: ${savedRecords.length}`);
    console.log(`   🔄 Records updated: ${updatedRecords.length}`);
    console.log(`   ❌ Errors: ${errors.length}`);
    console.log(`   📝 Empty group records: ${emptyGroupRecords}`);
    console.log(`   🔍 Empty inspection numbers: ${emptyInspectionNumbers}`);

    // Return response
    res.status(200).json({
      success: true,
      message: `Successfully processed ${csvData.length} rows`,
      results: {
        totalRows: csvData.length,
        newRecords: savedRecords.length,
        updatedRecords: updatedRecords.length,
        emptyGroupRecords: emptyGroupRecords,
        emptyInspectionNumbers: emptyInspectionNumbers,
        errors: errors.length,
        errorDetails: errors,
        updateDetails: updatedRecords,
        uploadBatch: uploadBatch,
        groupColumnUsed: groupColumnName || 'Not found'
      }
    });

  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
};

// Export multer middleware
export const uploadMiddleware = upload.single('file');
