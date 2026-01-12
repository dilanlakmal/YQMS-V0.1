import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { exec } from 'child_process';
import { p88LegacyData } from '../../MongoDB/dbConnectionController.js'; 

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

// UPDATED: Better temp directory management
const baseTempDir = process.platform === 'win32' 
    ? path.join(process.env.TEMP || 'C:/temp', 'puppeteer-downloads')
    : '/tmp/puppeteer-downloads';

// Ensure base temp directory exists
if (!fs.existsSync(baseTempDir)) {
    fs.mkdirSync(baseTempDir, { recursive: true });
}

const CONFIG = {
    LOGIN_URL: "https://yw.pivot88.com/login",
    BASE_REPORT_URL: "https://yw.pivot88.com/inspectionreport/show/",
    DEFAULT_DOWNLOAD_DIR: path.resolve("P:/P88Test"),
    TIMEOUT: 15000,
    DELAY_BETWEEN_DOWNLOADS: 3000,
    HEADLESS: 'new', // Always run headless - no GUI windows
};

// Helper functions (keep existing ones)
const getFileSize = async (filePath) => {
    try {
        const stats = await stat(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getAvailableSpace = async (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        let availableBytes = 0;

        if (process.platform === 'win32') {
            try {
                const drive = path.parse(path.resolve(dirPath)).root;
                const output = execSync(`dir /-c "${drive}"`, { encoding: 'utf8' });
                const lines = output.split('\n');
                const lastLine = lines[lines.length - 2] || lines[lines.length - 1];
                const match = lastLine.match(/(\d+)\s+bytes\s+free/i);
                if (match) {
                    availableBytes = parseInt(match[1]);
                }
            } catch (error) {
                console.warn('Could not get disk space on Windows:', error.message);
                availableBytes = 1024 * 1024 * 1024 * 5;
            }
        } else {
            try {
                const output = execSync(`df -k "${dirPath}"`, { encoding: 'utf8' });
                const lines = output.split('\n');
                const dataLine = lines[1];
                const columns = dataLine.split(/\s+/);
                availableBytes = parseInt(columns[3]) * 1024;
            } catch (error) {
                console.warn('Could not get disk space on Unix:', error.message);
                availableBytes = 1024 * 1024 * 1024 * 5;
            }
        }

        return availableBytes;
    } catch (error) {
        console.warn('Error getting available space:', error.message);
        return 1024 * 1024 * 1024 * 5;
    }
};

export const initializeDownloadStatus = async (req, res) => {
  try {
    
    // Count records without downloadStatus
    const recordsWithoutStatus = await p88LegacyData.countDocuments({
      downloadStatus: { $exists: false }
    });
    
    if (recordsWithoutStatus === 0) {
      return res.json({
        success: true,
        message: 'All records already have download status initialized',
        recordsUpdated: 0
      });
    }
    
    // Update records without downloadStatus
    const result = await p88LegacyData.updateMany(
      { downloadStatus: { $exists: false } },
      { 
        $set: { 
          downloadStatus: 'Pending',
          downloadedAt: null
        } 
      }
    );
    
    // Get status distribution
    const statusDistribution = await p88LegacyData.aggregate([
      {
        $group: {
          _id: '$downloadStatus',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      message: `Successfully initialized download status for ${result.modifiedCount} records`,
      recordsUpdated: result.modifiedCount,
      statusDistribution: statusDistribution
    });
    
  } catch (error) {
    console.error('Error initializing download status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get download status statistics
export const getDownloadStatusStats = async (req, res) => {
  try {
    const stats = await p88LegacyData.aggregate([
      {
        $group: {
          _id: '$downloadStatus',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const totalRecords = await p88LegacyData.countDocuments();
    
    // Format the response
    const formattedStats = {
      total: totalRecords,
      pending: 0,
      inProgress: 0,
      downloaded: 0,
      failed: 0
    };
    
    stats.forEach(stat => {
      switch(stat._id) {
        case 'Pending':
          formattedStats.pending = stat.count;
          break;
        case 'In Progress':
          formattedStats.inProgress = stat.count;
          break;
        case 'Downloaded':
          formattedStats.downloaded = stat.count;
          break;
        case 'Failed':
          formattedStats.failed = stat.count;
          break;
        default:
          // Handle null or undefined status
          formattedStats.pending += stat.count;
      }
    });
    
    res.json({
      success: true,
      stats: formattedStats,
      rawStats: stats
    });
    
  } catch (error) {
    console.error('Error getting download status stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Language change function for Puppeteer
const changeLanguage = async (page, language = 'english') => {
    try {
        
        // Wait for page to load completely
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to find the specific language dropdown button
        try {
            await page.waitForSelector('#dropdownLanguage', { timeout: 5000 });
          
            
            // Click the language dropdown
            await page.click('#dropdownLanguage');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Look for the requested language option in the dropdown
            const languageOptions = await page.$$('a');
            for (const option of languageOptions) {
                try {
                    const text = await page.evaluate(el => el.textContent?.trim(), option);
                    const href = await page.evaluate(el => el.href, option);
                    
                    let isTargetLanguage = false;
                    
                    if (language === 'chinese') {
                        isTargetLanguage = text && (text.includes('中文') || text.includes('Chinese') || text.includes('CN') || href?.includes('zh'));
                    } else if (language === 'english') {
                        isTargetLanguage = text && (text.includes('English') || text.includes('EN') || href?.includes('en'));
                    }
                    
                    if (isTargetLanguage) {
                        await option.click();
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        return true;
                    }
                } catch (e) {
                    // Skip this element
                }
            }
        } catch (e) {
            console.log('dropdownLanguage button not found, trying alternative methods');
        }
        
        return false;
    } catch (error) {
        console.warn('Could not change language automatically:', error.message);
        return false;
    }
};

// Update download status in database
const updateDownloadStatus = async (recordId, status, downloadedAt = null) => {
    try {
        const updateData = { 
            downloadStatus: status,
            lastModifiedDate: new Date()
        };
        
        if (downloadedAt) {
            updateData.downloadedAt = downloadedAt;
        }

        await p88LegacyData.findByIdAndUpdate(recordId, updateData);
    } catch (error) {
        console.error(`Error updating download status for record ${recordId}:`, error);
    }
};

// Get inspection records from your MongoDB collection (updated to include download status)
const getInspectionRecords = async (startRange, endRange, downloadAll, includeDownloaded = false, startDate = null, endDate = null, factoryName = null) => {
    try {
        let query = {};
        
        // Add date range filter
        if (startDate && endDate) {
            query.submittedInspectionDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        // Add factory filter
        if (factoryName && factoryName.trim() !== '') {
            query.supplier = factoryName;
        }
        
        // Filter out already downloaded records unless specifically requested
        if (!includeDownloaded) {
            query.downloadStatus = { $ne: 'Downloaded' };
        }

        let records;
        if (downloadAll) {
            // Get all records matching criteria
            records = await p88LegacyData.find(query)
                .select('_id groupNumber inspectionNumbers inspectionNumbersKey project supplier poNumbers reportType downloadStatus submittedInspectionDate')
                .sort({ submittedInspectionDate: 1 })
                .lean();
        } else {
            // Get records in specified range
            const skip = Math.max(0, startRange - 1);
            const limit = Math.max(1, endRange - startRange + 1);
            
            records = await p88LegacyData.find(query)
                .select('_id groupNumber inspectionNumbers inspectionNumbersKey project supplier poNumbers reportType downloadStatus submittedInspectionDate')
                .sort({ submittedInspectionDate: 1 })
                .skip(skip)
                .limit(limit)
                .lean();
        }
        
        return records;
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to fetch inspection records from database');
    }
};

// Get total count of records for UI display (updated to exclude downloaded)
const getTotalRecordCount = async (includeDownloaded = false) => {
    try {
        let query = {};
        if (!includeDownloaded) {
            query.downloadStatus = { $ne: 'Downloaded' };
        }
        
        const count = await p88LegacyData.countDocuments(query);
        return count;
    } catch (error) {
        console.error('Error getting record count:', error);
        return 0;
    }
};

// Extract first inspection number from record
const getFirstInspectionNumber = (record) => {
    if (record.inspectionNumbers && record.inspectionNumbers.length > 0) {
        return record.inspectionNumbers[0];
    } else if (record.inspectionNumbersKey) {
        return record.inspectionNumbersKey.split('-')[0];
    }
    return null;
};

// Get first PO number from record
const getFirstPoNumber = (record) => {
    if (record.poNumbers && record.poNumbers.length > 0) {
        return record.poNumbers[0];
    }
    return 'NO-PO';
};

// Generate custom filename: reportType-firstPoNumber-GroupNumber
const generateCustomFileName = (record) => {
    const reportType = (record.reportType || 'Report').replace(/\s+/g, '-');
    const firstPoNumber = getFirstPoNumber(record);
    const groupNumber = record.groupNumber || 'NO-GROUP';
    
    return `${reportType}-${firstPoNumber}-${groupNumber}`;
};

// Rename downloaded files with custom naming
const renameDownloadedFiles = async (targetDownloadDir, newFiles, customFileName) => {
    const renamedFiles = [];
    
    for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const oldPath = path.join(targetDownloadDir, file.name);
        const fileExtension = path.extname(file.name);
        const newFileName = `${customFileName}${newFiles.length > 1 ? `_${i + 1}` : ''}${fileExtension}`;
        const newPath = path.join(targetDownloadDir, newFileName);
        
        try {
            // Check if file with new name already exists
            if (fs.existsSync(newPath)) {
                const timestamp = Date.now();
                const finalFileName = `${customFileName}${newFiles.length > 1 ? `_${i + 1}` : ''}_${timestamp}${fileExtension}`;
                const finalPath = path.join(targetDownloadDir, finalFileName);
                fs.renameSync(oldPath, finalPath);
                renamedFiles.push({
                    ...file,
                    name: finalFileName,
                    originalName: file.name
                });
            } else {
                fs.renameSync(oldPath, newPath);
                renamedFiles.push({
                    ...file,
                    name: newFileName,
                    originalName: file.name
                });
            }
        } catch (error) {
            console.error(`Error renaming file ${file.name}:`, error);
            // Keep original file if rename fails
            renamedFiles.push(file);
        }
    }
    
    return renamedFiles;
};

// NEW: Single file download with temp folder and direct serve
export const downloadSingleReportDirect = async (req, res) => {
    let browser = null;
    let jobDir = null;

    try {
        const { inspectionNumber, language = 'english' } = req.body;

        if (!inspectionNumber) {
            return res.status(400).json({
                success: false,
                error: 'Inspection number is required'
            });
        }

        // 1️⃣ Create unique temp folder for this job
        const jobId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        jobDir = path.join(baseTempDir, jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        // 2️⃣ Launch browser and setup download behavior
        browser = await puppeteer.launch({
            headless: CONFIG.HEADLESS,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 👉 Tell Puppeteer to download into TEMP folder
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: jobDir
        });

        // Login process
        await page.goto(CONFIG.LOGIN_URL);
        await page.waitForSelector('#username');
        await page.type('#username', process.env.P88_USERNAME);
        await page.type('#password', process.env.P88_PASSWORD);
        await page.click('#js-login-submit');
        await page.waitForNavigation();

        // Navigate to report
        const reportUrl = `${CONFIG.BASE_REPORT_URL}${inspectionNumber}`;
        await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Change language if requested
        if (language === 'chinese') {
            await changeLanguage(page, language);
        }

        // Wait for print button and click
        await page.waitForSelector('#page-wrapper a', { timeout: 15000 });
        await page.click('#page-wrapper a');
        
        // Wait and check for file creation
        let downloadedFile = null;
        let attempts = 0;
        const maxAttempts = 20; // 20 seconds max wait

        while (attempts < maxAttempts && !downloadedFile) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
                const files = fs.readdirSync(jobDir);
                const pdfFiles = files.filter(file => file.endsWith('.pdf') && !file.endsWith('.crdownload'));
                
                if (pdfFiles.length > 0) {
                    downloadedFile = pdfFiles[0];
                }
            } catch (error) {
                console.log('📂 Checking for downloaded files...');
            }
            
            attempts++;
        }

        // Close browser
        if (browser) {
            await browser.close();
            browser = null;
        }

        if (!downloadedFile) {
            throw new Error('Download timeout - no file was downloaded within 20 seconds');
        }

        // 4️⃣ Send file to the user (browser decides location)
        const filePath = path.join(jobDir, downloadedFile);
        const customFileName = `Report-${inspectionNumber}-${Date.now()}.pdf`;

        // Set proper headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${customFileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Send file and cleanup
        res.download(filePath, customFileName, (err) => {
            // 🔥 Always cleanup temp directory
            if (jobDir && fs.existsSync(jobDir)) {
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error('Error cleaning up temp directory:', cleanupError);
                }
            }

            if (err) {
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to send downloaded file'
                    });
                }
            } else {
                console.log('✅ File sent successfully to user');
            }
        });

    } catch (error) {
        console.error('Direct download failed:', error);

        // Cleanup on error
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }

        if (jobDir && fs.existsSync(jobDir)) {
            try {
                fs.rmSync(jobDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('Error cleaning up temp directory:', cleanupError);
            }
        }

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};


// Single report download function (updated with status tracking and custom naming)
const downloadSingleReport = async (page, inspectionNumber, targetDownloadDir, record, includeDownloaded = false, language = 'english') => {
    try {
        const reportUrl = `${CONFIG.BASE_REPORT_URL}${inspectionNumber}`;
        
        
        // Check if already downloaded - ONLY skip if includeDownloaded is false
        if (!includeDownloaded && record.downloadStatus === 'Downloaded') {
            return {
                inspectionNumber,
                groupNumber: record.groupNumber,
                project: record.project,
                fileCount: 0,
                totalSize: 0,
                files: [],
                success: true,
                skipped: true,
                reason: 'Already downloaded'
            };
        }

        // Update status to 'In Progress'
        await updateDownloadStatus(record._id, 'In Progress');

        // Get initial file list
        const getFileList = async () => {
            if (!fs.existsSync(targetDownloadDir)) return [];
            const files = await readdir(targetDownloadDir);
            const fileStats = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(targetDownloadDir, file);
                    const stats = await stat(filePath);
                    return {
                        name: file,
                        mtime: stats.mtime.getTime()
                    };
                })
            );
            return fileStats;
        };

        const initialFiles = await getFileList();

        // Navigate to report
        await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Change language if requested - do this BEFORE looking for print button
        if (language !== 'english' || language === 'english') {
            const languageChanged = await changeLanguage(page, language);
            if (languageChanged) {
                // Wait a bit more for page to fully reload in new language
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.warn(`Language change to ${language} failed for inspection ${inspectionNumber}, continuing with default`);
            }
        }
        
        // Wait for the print button to be available
        try {
            await page.waitForSelector('#page-wrapper a', { timeout: 15000 });
        } catch (error) {
            await updateDownloadStatus(record._id, 'Failed');
            throw new Error(`Print button not found for inspection ${inspectionNumber}. Page may not have loaded correctly.`);
        }

        // Click print button
        await page.click('#page-wrapper a');

        // Wait for download to complete
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Get new files
        const finalFiles = await getFileList();
        const newFiles = finalFiles.filter(finalFile => 
            !initialFiles.some(initialFile => 
                initialFile.name === finalFile.name && 
                initialFile.mtime === finalFile.mtime
            )
        );

        if (newFiles.length === 0) {
            await updateDownloadStatus(record._id, 'Failed');
            throw new Error(`No files were downloaded for inspection ${inspectionNumber}`);
        }

        // Generate custom filename and rename files
        const customFileName = generateCustomFileName(record);
        
        // If re-downloading, add timestamp to avoid filename conflicts
        const finalCustomFileName = includeDownloaded && record.downloadStatus === 'Downloaded' 
            ? `${customFileName}_${Date.now()}` 
            : customFileName;
            
        const renamedFiles = await renameDownloadedFiles(targetDownloadDir, newFiles, finalCustomFileName);

        let totalSize = 0;
        const fileDetails = [];

        for (const fileInfo of renamedFiles) {
            const filePath = path.join(targetDownloadDir, fileInfo.name);
            const size = await getFileSize(filePath);
            totalSize += size;
            fileDetails.push({
                name: fileInfo.name,
                originalName: fileInfo.originalName || fileInfo.name,
                size: formatBytes(size),
                sizeBytes: size,
                inspectionNumber: inspectionNumber,
                groupNumber: record.groupNumber,
                project: record.project,
                customFileName: finalCustomFileName
            });
        }

        // Update status to 'Downloaded'
        await updateDownloadStatus(record._id, 'Downloaded', new Date());

        return {
            inspectionNumber,
            groupNumber: record.groupNumber,
            project: record.project,
            fileCount: renamedFiles.length,
            totalSize,
            files: fileDetails,
            success: true,
            customFileName: finalCustomFileName,
            redownloaded: includeDownloaded && record.downloadStatus === 'Downloaded'
        };

    } catch (error) {
        console.error(`Error downloading report ${inspectionNumber}:`, error);
        
        // Update status to 'Failed'
        await updateDownloadStatus(record._id, 'Failed');
        
        return {
            inspectionNumber,
            groupNumber: record.groupNumber,
            project: record.project,
            fileCount: 0,
            totalSize: 0,
            files: [],
            success: false,
            error: error.message
        };
    }
};

// Enhanced helper function for downloading single report with temp folder
const downloadSingleReportWithTemp = async (page, inspectionNumber, tempDir, finalDir, record, includeDownloaded = false, language = 'english') => {
    try {
        const reportUrl = `${CONFIG.BASE_REPORT_URL}${inspectionNumber}`;

        // Check if already downloaded
        if (!includeDownloaded && record.downloadStatus === 'Downloaded') {
            return {
                inspectionNumber,
                groupNumber: record.groupNumber,
                project: record.project,
                fileCount: 0,
                totalSize: 0,
                files: [],
                success: true,
                skipped: true,
                reason: 'Already downloaded'
            };
        }

        // Update status to 'In Progress'
        await updateDownloadStatus(record._id, 'In Progress');

        // Navigate to report
        await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Change language if requested
        if (language === 'chinese') {
            const languageChanged = await changeLanguage(page, language);
            if (languageChanged) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.warn(`⚠️ Language change failed, continuing with default`);
            }
        }

        try {
            await page.waitForSelector('#page-wrapper a', { timeout: 15000 });
        } catch (error) {
            console.error(`❌ Print button not found: ${error.message}`);
            await updateDownloadStatus(record._id, 'Failed');
            throw new Error(`Print button not found for inspection ${inspectionNumber}. Page may not have loaded correctly.`);
        }

        // Get initial temp files
        const initialTempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];

        // Click the print button
        await page.click('#page-wrapper a');

        // Wait a moment for the download to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3️⃣ Enhanced download waiting with better monitoring
        let newTempFiles = [];
        let attempts = 0;
        const maxAttempts = 30; // Increased to 30 seconds
        let lastFileCount = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            try {
                if (fs.existsSync(tempDir)) {
                    const currentTempFiles = fs.readdirSync(tempDir);
                    
                    // Log all files for debugging
                    if (currentTempFiles.length > lastFileCount) {
                        lastFileCount = currentTempFiles.length;
                    }

                    // Filter for new PDF files (excluding partial downloads)
                    newTempFiles = currentTempFiles.filter(file => {
                        const isNew = !initialTempFiles.includes(file);
                        const isPdf = file.toLowerCase().endsWith('.pdf');
                        const isNotPartial = !file.endsWith('.crdownload') && !file.endsWith('.tmp');
                        const hasSize = fs.statSync(path.join(tempDir, file)).size > 0;
                        
                        return isNew && isPdf && isNotPartial && hasSize;
                    });

                    if (newTempFiles.length > 0) {
                        break;
                    }

                    // Check for partial downloads
                    const partialFiles = currentTempFiles.filter(file => 
                        file.endsWith('.crdownload') || file.endsWith('.tmp')
                    );
                    if (partialFiles.length > 0) {
                        console.log(`⏳ Partial downloads in progress:`, partialFiles);
                    }
                } else {
                    console.log(`📂 Temp directory doesn't exist yet: ${tempDir}`);
                }
            } catch (error) {
                console.log(`⚠️ Error checking temp directory: ${error.message}`);
            }
        }
        const customFileName = generateCustomFileName(record);
        const finalCustomFileName = includeDownloaded && record.downloadStatus === 'Downloaded' 
            ? `${customFileName}_${Date.now()}` 
            : customFileName;

        // Ensure final directory exists
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }

        const movedFiles = [];
        let totalSize = 0;

        for (let i = 0; i < newTempFiles.length; i++) {
            const tempFile = newTempFiles[i];
            const tempFilePath = path.join(tempDir, tempFile);

            const fileExtension = path.extname(tempFile);
            const newFileName = `${finalCustomFileName}${newTempFiles.length > 1 ? `_${i + 1}` : ''}${fileExtension}`;
            const finalFilePath = path.join(finalDir, newFileName);

            // Handle file name conflicts
            let actualFinalPath = finalFilePath;
            if (fs.existsSync(finalFilePath)) {
                const timestamp = Date.now();
                const conflictFileName = `${finalCustomFileName}${newTempFiles.length > 1 ? `_${i + 1}` : ''}_${timestamp}${fileExtension}`;
                actualFinalPath = path.join(finalDir, conflictFileName);
            }

            // Move file from temp to final location
            try {
                fs.copyFileSync(tempFilePath, actualFinalPath);
                
                const size = await getFileSize(actualFinalPath);
                totalSize += size;

                movedFiles.push({
                    name: path.basename(actualFinalPath),
                    originalName: tempFile,
                    size: formatBytes(size),
                    sizeBytes: size,
                    inspectionNumber: inspectionNumber,
                    groupNumber: record.groupNumber,
                    project: record.project,
                    customFileName: finalCustomFileName
                });
            } catch (moveError) {
                console.error(`❌ Error moving file ${tempFile}:`, moveError);
                throw moveError;
            }
        }

        // Update status to 'Downloaded'
        await updateDownloadStatus(record._id, 'Downloaded', new Date());

        return {
            inspectionNumber,
            groupNumber: record.groupNumber,
            project: record.project,
            fileCount: movedFiles.length,
            totalSize,
            files: movedFiles,
            success: true,
            customFileName: finalCustomFileName,
            redownloaded: includeDownloaded && record.downloadStatus === 'Downloaded'
        };

    } catch (error) {
        console.error(`❌ Error downloading report ${inspectionNumber}:`, error);
        await updateDownloadStatus(record._id, 'Failed');

        return {
            inspectionNumber,
            groupNumber: record.groupNumber,
            project: record.project,
            fileCount: 0,
            totalSize: 0,
            files: [],
            success: false,
            error: error.message
        };
    }
};

// Enhanced login function with better session management
// Enhanced login function with detailed debugging
const performLogin = async (page) => {
    try {
        
        // Navigate to login page
        await page.goto(CONFIG.LOGIN_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Take screenshot of login page
        try {
            await page.screenshot({ path: '/tmp/login_page.png', fullPage: true });
        } catch (screenshotError) {
            console.log('⚠️ Could not save login page screenshot');
        }
        
        // Wait for login form
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.waitForSelector('#password', { timeout: 10000 });
        await page.waitForSelector('#js-login-submit', { timeout: 10000 });
        
        
        // Get credentials
        const username = process.env.P88_USERNAME;
        const password = process.env.P88_PASSWORD;
        
        // Clear and type username
        await page.click('#username', { clickCount: 3 });
        await page.type('#username', username, { delay: 100 });
    
        
        // Clear and type password
        await page.click('#password', { clickCount: 3 });
        await page.type('#password', password, { delay: 100 });
        
        // Click login and wait for navigation
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
            page.click('#js-login-submit')
        ]);
        
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check result
        const currentUrl = page.url();
        const pageTitle = await page.title();
        
        // Check for error messages on the page
        try {
            const errorMessages = await page.$$eval('.alert, .error, .danger, [class*="error"], [class*="alert"]', 
                elements => elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
            );
            if (errorMessages.length > 0) {
                console.log('⚠️ Error messages found on page:', errorMessages);
            }
        } catch (e) {
            console.log('ℹ️ No error messages found on page');
        }
        
        // Check if we're still on login page (login failed)
        if (currentUrl.includes('/login') || pageTitle.includes('Login')) {
            throw new Error(`Login failed - still on login page. URL: ${currentUrl}, Title: ${pageTitle}`);
        }
        
        // Wait a bit more for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return true;
        
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        throw error;
    }
};

// Function to validate session before downloading
const validateSession = async (page) => {
    try {
        // Try to access a protected page to check if session is valid
        const testUrl = 'https://yw.pivot88.com/dashboard'; // or any protected page
        await page.goto(testUrl, { waitUntil: 'networkidle0', timeout: 15000 });
        
        const currentUrl = page.url();
        const pageTitle = await page.title();

        // If redirected to login, session is invalid
        if (currentUrl.includes('/login') || pageTitle.includes('Login')) {
            await performLogin(page);
            return false; // Session was invalid
        }
        
        return true; // Session is valid
        
    } catch (error) {
        console.log('⚠️ Session validation failed, re-logging in...');
        await performLogin(page);
        return false;
    }
};

// FIXED downloadSingleReportWithTemp function
const downloadSingleReportWithTempFixed = async (page, inspectionNumber, tempDir, finalDir, record, includeDownloaded = false, language = 'english') => {
    try {
        const reportUrl = `${CONFIG.BASE_REPORT_URL}${inspectionNumber}`;

        // Check if already downloaded
        if (!includeDownloaded && record.downloadStatus === 'Downloaded') {
            return {
                inspectionNumber,
                groupNumber: record.groupNumber,
                project: record.project,
                fileCount: 0,
                totalSize: 0,
                files: [],
                success: true,
                skipped: true,
                reason: 'Already downloaded'
            };
        }

        // Update status to 'In Progress'
        await updateDownloadStatus(record._id, 'In Progress');

        // Validate session before proceeding
        await validateSession(page);

        // Navigate to report
        await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Check if page loaded correctly and we're not redirected to login
        const pageTitle = await page.title();
        const currentUrl = page.url();

        // If we're redirected to login, the session expired
        if (currentUrl.includes('/login') || pageTitle.includes('Login')) {
            await performLogin(page);
            
            // Try navigating to the report again
            await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            
            const newTitle = await page.title();
            const newUrl = page.url();
        
            if (newUrl.includes('/login') || newTitle.includes('Login')) {
                throw new Error(`Unable to access report ${inspectionNumber} - authentication failed`);
            }
        }

        // Change language if requested
        if (language === 'chinese') {
            const languageChanged = await changeLanguage(page, language);
            if (languageChanged) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.warn(`⚠️ Language change failed, continuing with default`);
            }
        }

        // Wait for print button and click
        try {
            await page.waitForSelector('#page-wrapper a', { timeout: 15000 });
        } catch (error) {
            console.error(`❌ Print button not found: ${error.message}`);
            
            // Take a screenshot for debugging
            try {
                const screenshotPath = path.join(tempDir, `no_print_button_${inspectionNumber}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
            } catch (screenshotError) {
                console.log(`⚠️ Could not save debug screenshot: ${screenshotError.message}`);
            }
            
            await updateDownloadStatus(record._id, 'Failed');
            throw new Error(`Print button not found for inspection ${inspectionNumber}. Page may not have loaded correctly.`);
        }

        // Get initial temp files
        const initialTempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];

        // Click the print button
        await page.click('#page-wrapper a');

        // Wait longer for the download to start
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased wait time

        // Enhanced download waiting with better monitoring
        let newTempFiles = [];
        let attempts = 0;
        const maxAttempts = 45; // Increased to 45 seconds
        let lastFileCount = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            try {
                if (fs.existsSync(tempDir)) {
                    const currentTempFiles = fs.readdirSync(tempDir);
                    
                    if (attempts % 5 === 0) { // Log every 5 seconds
                        console.log(`📂 Attempt ${attempts}: Found ${currentTempFiles.length} total files in temp dir`);
                    }
                    
                    if (currentTempFiles.length > lastFileCount) {
                        console.log(`📄 Files in temp dir:`, currentTempFiles);
                        lastFileCount = currentTempFiles.length;
                    }

                    // Filter for new PDF files (excluding partial downloads)
                    newTempFiles = currentTempFiles.filter(file => {
                        const isNew = !initialTempFiles.includes(file);
                        const isPdf = file.toLowerCase().endsWith('.pdf');
                        const isNotPartial = !file.endsWith('.crdownload') && !file.endsWith('.tmp');
                        
                        if (isNew && isPdf && isNotPartial) {
                            try {
                                const hasSize = fs.statSync(path.join(tempDir, file)).size > 1000; // At least 1KB
                                return hasSize;
                            } catch (statError) {
                                return false;
                            }
                        }
                        return false;
                    });

                    if (newTempFiles.length > 0) {
                        // Wait a bit more to ensure download is complete
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        break;
                    }

                    // Check for partial downloads
                    const partialFiles = currentTempFiles.filter(file => 
                        file.endsWith('.crdownload') || file.endsWith('.tmp')
                    );
                    if (partialFiles.length > 0 && attempts % 10 === 0) {
                        console.log(`⏳ Partial downloads in progress:`, partialFiles);
                    }
                } else {
                    console.log(`📂 Temp directory doesn't exist yet: ${tempDir}`);
                }
            } catch (error) {
                console.log(`⚠️ Error checking temp directory: ${error.message}`);
            }
        }

        const customFileName = generateCustomFileName(record);
        const finalCustomFileName = includeDownloaded && record.downloadStatus === 'Downloaded' 
            ? `${customFileName}_${Date.now()}` 
            : customFileName;

        // Ensure final directory exists
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }

        const movedFiles = [];
        let totalSize = 0;

        for (let i = 0; i < newTempFiles.length; i++) {
            const tempFile = newTempFiles[i];
            const tempFilePath = path.join(tempDir, tempFile);

            const fileExtension = path.extname(tempFile);
            const newFileName = `${finalCustomFileName}${newTempFiles.length > 1 ? `_${i + 1}` : ''}${fileExtension}`;
            const finalFilePath = path.join(finalDir, newFileName);

            // Handle file name conflicts
            let actualFinalPath = finalFilePath;
            if (fs.existsSync(finalFilePath)) {
                const timestamp = Date.now();
                const conflictFileName = `${finalCustomFileName}${newTempFiles.length > 1 ? `_${i + 1}` : ''}_${timestamp}${fileExtension}`;
                actualFinalPath = path.join(finalDir, conflictFileName);
            }

            // Move file from temp to final location
            try {
                fs.copyFileSync(tempFilePath, actualFinalPath);
                
                const size = await getFileSize(actualFinalPath);
                totalSize += size;

                movedFiles.push({
                    name: path.basename(actualFinalPath),
                    originalName: tempFile,
                    size: formatBytes(size),
                    sizeBytes: size,
                    inspectionNumber: inspectionNumber,
                    groupNumber: record.groupNumber,
                    project: record.project,
                    customFileName: finalCustomFileName
                });
            } catch (moveError) {
                console.error(`❌ Error moving file ${tempFile}:`, moveError);
                throw moveError;
            }
        }

        // Update status to 'Downloaded'
        await updateDownloadStatus(record._id, 'Downloaded', new Date());

        return {
            inspectionNumber,
            groupNumber: record.groupNumber,
            project: record.project,
            fileCount: movedFiles.length,
            totalSize,
            files: movedFiles,
            success: true,
            customFileName: finalCustomFileName,
            redownloaded: includeDownloaded && record.downloadStatus === 'Downloaded'
        };

    } catch (error) {
        console.error(`❌ Error downloading report ${inspectionNumber}:`, error);
        await updateDownloadStatus(record._id, 'Failed');

        return {
            inspectionNumber,
            groupNumber: record.groupNumber,
            project: record.project,
            fileCount: 0,
            totalSize: 0,
            files: [],
            success: false,
            error: error.message
        };
    }
};


// Main bulk download function (UPDATED with proper login)
export const downloadBulkReports = async (req, res) => {
    let browser = null;
    let jobDir = null;

    try {
        const { 
            downloadPath, 
            startRange, 
            endRange, 
            downloadAll, 
            includeDownloaded = false,
            startDate,
            endDate,
            factoryName,
            language = 'english'
        } = req.body;

        // 1️⃣ Create unique temp folder for this bulk job
        const jobId = Date.now().toString() + '_bulk_' + Math.random().toString(36).substr(2, 9);
        jobDir = path.join(baseTempDir, jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        const targetDownloadDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

        // Get inspection records
        const records = await getInspectionRecords(
            startRange, 
            endRange, 
            downloadAll, 
            includeDownloaded,
            startDate,
            endDate,
            factoryName
        );

        if (records.length === 0) {
            // Cleanup empty job directory
            if (jobDir && fs.existsSync(jobDir)) {
                fs.rmSync(jobDir, { recursive: true, force: true });
            }

            return res.json({
                success: true,
                message: 'No records found matching the specified criteria',
                downloadInfo: {
                    totalRecords: 0,
                    successfulDownloads: 0,
                    failedDownloads: 0,
                    skippedDownloads: 0,
                    totalFiles: 0,
                    totalSize: '0 Bytes',
                    details: []
                }
            });
        }

        // 2️⃣ Enhanced browser launch with better session handling
        browser = await puppeteer.launch({
            headless: CONFIG.HEADLESS,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--disable-blink-features=AutomationControlled', // Hide automation
                '--disable-extensions',
                '--disable-plugins',
            ],
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation'], // Hide automation flags
        });

        const page = await browser.newPage();

        // Enhanced user agent and headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Remove webdriver property
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        // Set viewport
        await page.setViewport({ width: 1366, height: 768 });

        // 👉 Enhanced download behavior setup
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: jobDir
        });

        // Set additional headers to maintain session
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        });

        // Login process with enhanced session management
        await performLogin(page);

        // Download reports
        const downloadResults = [];
        let successfulDownloads = 0;
        let failedDownloads = 0;
        let skippedDownloads = 0;
        let redownloadedCount = 0;
        let totalFiles = 0;
        let totalSizeBytes = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const inspectionNumber = getFirstInspectionNumber(record);

            if (!inspectionNumber) {
                failedDownloads++;
                downloadResults.push({
                    inspectionNumber: 'N/A',
                    groupNumber: record.groupNumber,
                    project: record.project,
                    success: false,
                    error: 'No inspection number found'
                });
                continue;
            }

            try {
                // Use the FIXED single report download function
                const result = await downloadSingleReportWithTempFixed(
                    page, 
                    inspectionNumber, 
                    jobDir, // Use temp directory
                    targetDownloadDir, // Final destination
                    record, 
                    includeDownloaded, 
                    language
                );

                downloadResults.push(result);

                if (result.success) {
                    if (result.skipped) {
                        skippedDownloads++;
                    } else {
                        successfulDownloads++;
                        totalFiles += result.fileCount;
                        totalSizeBytes += result.totalSize;

                        if (result.redownloaded) {
                            redownloadedCount++;
                        } else {
                            console.log(`✅ Downloaded: ${inspectionNumber} (${result.fileCount} files)`);
                        }
                    }
                } else {
                    failedDownloads++;
                    console.log(`❌ Failed: ${inspectionNumber} - ${result.error}`);
                }

            } catch (error) {
                console.error(`Error processing record ${record._id}:`, error);
                failedDownloads++;
                downloadResults.push({
                    inspectionNumber: inspectionNumber,
                    groupNumber: record.groupNumber,
                    project: record.project,
                    success: false,
                    error: error.message
                });
            }
        }

        if (browser) {
            await browser.close();
        }

        // 🔥 Cleanup temp directory
        if (jobDir && fs.existsSync(jobDir)) {
            try {
                fs.rmSync(jobDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('Error cleaning up bulk temp directory:', cleanupError);
            }
        }

        const summaryMessage = includeDownloaded 
            ? `Download completed: ${successfulDownloads} successful (${redownloadedCount} re-downloaded), ${failedDownloads} failed, ${skippedDownloads} skipped`
            : `Download completed: ${successfulDownloads} successful, ${failedDownloads} failed, ${skippedDownloads} skipped`;

        res.json({
            success: true,
            message: summaryMessage,
            downloadInfo: {
                totalRecords: records.length,
                successfulDownloads,
                failedDownloads,
                skippedDownloads,
                redownloadedCount,
                totalFiles,
                totalSize: formatBytes(totalSizeBytes),
                downloadPath: targetDownloadDir,
                details: downloadResults,
                includeDownloaded
            }
        });

    } catch (error) {
        console.error('Bulk download failed:', error);

        // Cleanup on error
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }

        if (jobDir && fs.existsSync(jobDir)) {
            try {
                fs.rmSync(jobDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('Error cleaning up temp directory:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// Get total record count endpoint (updated)
export const getRecordCount = async (req, res) => {
    try {
        const { includeDownloaded = 'false' } = req.query;
        
        let query = {};
        if (includeDownloaded !== 'true') {
            query.downloadStatus = { $ne: 'Downloaded' };
        }
        
        const totalRecords = await p88LegacyData.countDocuments(query);
        const downloadedRecords = await p88LegacyData.countDocuments({ downloadStatus: 'Downloaded' });
        const pendingRecords = totalRecords - (includeDownloaded === 'true' ? 0 : downloadedRecords);
        
        res.json({
            success: true,
            totalRecords,
            downloadedRecords: includeDownloaded === 'true' ? downloadedRecords : 0,
            pendingRecords
        });
    } catch (error) {
        console.error('Error getting record count:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Reset download status endpoint (useful for testing)
export const resetDownloadStatus = async (req, res) => {
    try {
        const { recordIds } = req.body;
        
        let result;
        if (recordIds && recordIds.length > 0) {
            // Reset specific records
            result = await p88LegacyData.updateMany(
                { _id: { $in: recordIds } },
                { $unset: { downloadStatus: "", downloadedAt: "" } }
            );
        } else {
            // Reset all records
            result = await p88LegacyData.updateMany(
                {},
                { $unset: { downloadStatus: "", downloadedAt: "" } }
            );
        }
        
        res.json({
            success: true,
            message: `Reset download status for ${result.modifiedCount} records`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error resetting download status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Keep existing functions with minor updates...
export const checkBulkSpace = async (req, res) => {
    try {
        const { 
            downloadPath, 
            startRange, 
            endRange, 
            downloadAll, 
            includeDownloaded = false,
            startDate,
            endDate,
            factoryName
        } = req.body;

         const targetDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Build query for counting records
        let query = {};
        
        // Add date range filter
        if (startDate && endDate) {
            query.submittedInspectionDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        // Add factory filter
        if (factoryName && factoryName.trim() !== '') {
            query.supplier = factoryName;
        }
        
        // Filter out already downloaded records unless specifically requested
        if (!includeDownloaded) {
            query.downloadStatus = { $ne: 'Downloaded' };
        }

        let recordCount;
        if (downloadAll) {
            recordCount = await p88LegacyData.countDocuments(query);
        } else {
            if (!startRange || !endRange || startRange > endRange || startRange < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid range specified'
                });
            }
            
            const totalRecords = await p88LegacyData.countDocuments(query);
            if (startRange > totalRecords) {
                recordCount = 0;
            } else if (endRange > totalRecords) {
                recordCount = totalRecords - startRange + 1;
            } else {
                recordCount = endRange - startRange + 1;
            }
        }

        const availableSpace = await getAvailableSpace(targetDir);
        const estimatedSize = 1024 * 1024 * 2 * recordCount; // 2MB per report estimate
        const hasEnoughSpace = availableSpace > estimatedSize * 1.5; // 1.5x buffer

        res.json({
            success: true,
            availableSpace: formatBytes(availableSpace),
            availableSpaceBytes: availableSpace,
            estimatedDownloadSize: formatBytes(estimatedSize),
            estimatedDownloadSizeBytes: estimatedSize,
            recordCount: recordCount,
            hasEnoughSpace: hasEnoughSpace,
            path: targetDir,
            recommendation: hasEnoughSpace ? 
                `You have sufficient space to download ${recordCount} reports.` : 
                `Warning: Limited disk space for ${recordCount} reports. Consider freeing up space or choosing a different location.`,
            filters: {
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'No date filter',
                factory: factoryName || 'All factories',
                includeDownloaded: includeDownloaded
            }
        });

    } catch (error) {
        console.error('Error checking bulk space:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Keep existing single download function
export const saveDownloadParth = async (req, res) => {
    let browser = null;
    let jobDir = null;
    try {
        const { downloadPath, language = 'english' } = req.body;
        const targetDownloadDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

        // Ensure download directory exists
        if (!fs.existsSync(targetDownloadDir)) {
            fs.mkdirSync(targetDownloadDir, { recursive: true });
        }
        
        // 2️⃣ Launch browser with better configuration
            browser = await puppeteer.launch({
                headless: CONFIG.HEADLESS,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote'
                ],
                defaultViewport: null
            });

            const page = await browser.newPage();

            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // 👉 Enhanced download behavior setup
            const client = await page.createCDPSession();
            await client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: jobDir
            });

            // Also set via page._client() as backup
            try {
                await page._client().send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: jobDir
                });
            } catch (clientError) {
                console.log('⚠️ Backup download behavior setup failed:', clientError.message);
            }

        // Get initial file list and timestamps
        const getFileList = async () => {
            if (!fs.existsSync(targetDownloadDir)) return [];
            const files = await readdir(targetDownloadDir);
            const fileStats = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(targetDownloadDir, file);
                    const stats = await stat(filePath);
                    return {
                        name: file,
                        mtime: stats.mtime.getTime()
                    };
                })
            );
            return fileStats;
        };

        const initialFiles = await getFileList();

        // Login process
        await page.goto(CONFIG.LOGIN_URL);
        await page.waitForSelector('#username');
        await page.type('#username', process.env.P88_USERNAME);
        await page.type('#password', process.env.P88_PASSWORD);
        await page.click('#js-login-submit');
        await page.waitForNavigation();

        // Navigate to the default report (you might want to make this configurable)
        const defaultInspectionNumber = "1528972"; // You can make this dynamic
        await page.goto(`${CONFIG.BASE_REPORT_URL}${defaultInspectionNumber}`);
        
        // Change language if requested
        if (language === 'chinese') {
            await changeLanguage(page, language);
        }
        
        await page.waitForSelector('#page-wrapper a');

        // Click print button
        await page.click('#page-wrapper a');

        // Wait for download to complete - increased wait time
        await new Promise(resolve => setTimeout(resolve, 8000));

        if (browser) {
            await browser.close();
        }

        // Get final file list and identify new files
        const finalFiles = await getFileList();
        const newFiles = finalFiles.filter(finalFile => 
            !initialFiles.some(initialFile => 
                initialFile.name === finalFile.name && 
                initialFile.mtime === finalFile.mtime
            )
        );

        let totalSize = 0;
        const fileDetails = [];

        for (const fileInfo of newFiles) {
            const filePath = path.join(targetDownloadDir, fileInfo.name);
            const size = await getFileSize(filePath);
            totalSize += size;
            fileDetails.push({
                name: fileInfo.name,
                size: formatBytes(size),
                sizeBytes: size
            });
        }

        res.json({
            success: true,
            message: 'Report downloaded successfully',
            downloadInfo: {
                fileCount: newFiles.length,
                totalSize: formatBytes(totalSize),
                totalSizeBytes: totalSize,
                files: fileDetails,
                downloadPath: targetDownloadDir
            }
        });

    } catch (error) {
        console.error('Scraping failed:', error);
        
        // Ensure browser is closed on error
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Keep existing functions
export const checkSpace = async (req, res) => {
    try {
        const { downloadPath } = req.body;
        const targetDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;
        
        // Ensure directory exists for space check
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const availableSpace = await getAvailableSpace(targetDir);
        const estimatedSize = 1024 * 1024 * 2; // 2MB estimate for single report
        const hasEnoughSpace = availableSpace > estimatedSize * 2; // 2x buffer
        
        res.json({
            success: true,
            availableSpace: formatBytes(availableSpace),
            availableSpaceBytes: availableSpace,
            estimatedDownloadSize: formatBytes(estimatedSize),
            estimatedDownloadSizeBytes: estimatedSize,
            hasEnoughSpace: hasEnoughSpace,
            path: targetDir,
            recommendation: hasEnoughSpace ? 
                'You have sufficient space for the download.' : 
                'Warning: Limited disk space available. Consider freeing up space or choosing a different location.'
        });
    } catch (error) {
        console.error('Error checking space:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const validateDownloadParth = async (req, res) => {
    try {
        const { downloadPath } = req.body;
        
        if (!downloadPath) {
            return res.json({
                success: true,
                isValid: true,
                path: CONFIG.DEFAULT_DOWNLOAD_DIR,
                message: 'Using default download directory'
            });
        }

        try {
            const resolvedPath = path.resolve(downloadPath);
            
            // Try to create directory if it doesn't exist
            if (!fs.existsSync(resolvedPath)) {
                fs.mkdirSync(resolvedPath, { recursive: true });
            }

            // Test write permissions
            const testFile = path.join(resolvedPath, 'test_write.tmp');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);

            res.json({
                success: true,
                isValid: true,
                path: resolvedPath,
                message: 'Path is valid and writable'
            });

        } catch (error) {
            let errorMessage = 'Path is not accessible';
            if (error.code === 'EPERM' || error.code === 'EACCES') {
                errorMessage = 'Permission denied. Please choose a folder you have write access to.';
            }
            
            res.json({
                success: true,
                isValid: false,
                path: downloadPath,
                message: errorMessage
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get unique factories from database
export const getFactories = async (req, res) => {
    try {
        const factories = await p88LegacyData.distinct('supplier');
        const filteredFactories = factories.filter(factory => factory && factory.trim() !== '');
        
        res.json({
            success: true,
            factories: filteredFactories.sort()
        });
    } catch (error) {
        console.error('Error getting factories:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Open download folder in system file explorer
export const openDownloadFolder = async (req, res) => {
    try {
        const { downloadPath } = req.body;
        const targetDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;
        
        // Ensure directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        let command;
        if (process.platform === 'win32') {
            command = `explorer "${targetDir}"`;
        } else if (process.platform === 'darwin') {
            command = `open "${targetDir}"`;
        } else {
            command = `xdg-open "${targetDir}"`;
        }
        
        exec(command, (error) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to open download folder'
                });
            }
            
            res.json({
                success: true,
                message: 'Download folder opened successfully',
                path: targetDir
            });
        });
        
    } catch (error) {
        console.error('Error opening download folder:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get date filtered statistics
export const getDateFilteredStats = async (req, res) => {
    try {
        const { startDate, endDate, factoryName, includeDownloaded = 'false' } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        let query = {
            submittedInspectionDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            }
        };

        if (factoryName && factoryName.trim() !== '') {
            query.supplier = factoryName;
        }

        if (includeDownloaded !== 'true') {
            query.downloadStatus = { $ne: 'Downloaded' };
        }

        const totalRecords = await p88LegacyData.countDocuments(query);
        const downloadedQuery = { ...query, downloadStatus: 'Downloaded' };
        const downloadedRecords = await p88LegacyData.countDocuments(downloadedQuery);
        const pendingRecords = totalRecords - (includeDownloaded === 'true' ? 0 : downloadedRecords);

        res.json({
            success: true,
            totalRecords,
            downloadedRecords: includeDownloaded === 'true' ? downloadedRecords : 0,
            pendingRecords,
            dateRange: { startDate, endDate },
            factory: factoryName || 'All Factories'
        });
    } catch (error) {
        console.error('Error getting date filtered stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
