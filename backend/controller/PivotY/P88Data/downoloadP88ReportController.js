import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { p88LegacyData } from '../../MongoDB/dbConnectionController.js'; 

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

const CONFIG = {
    LOGIN_URL: "https://yw.pivot88.com/login",
    BASE_REPORT_URL: "https://yw.pivot88.com/inspectionreport/show/",
    DEFAULT_DOWNLOAD_DIR: path.resolve("P:/P88Test"),
    TIMEOUT: 15000,
    DELAY_BETWEEN_DOWNLOADS: 3000 
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

// Single report download function (updated with status tracking and custom naming)
const downloadSingleReport = async (page, inspectionNumber, targetDownloadDir, record, includeDownloaded = false) => {
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

// Main bulk download function (updated)
export const downloadBulkReports = async (req, res) => {
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
        
        const targetDownloadDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

        // ... existing validation code ...

        // Get inspection records from database with date and factory filters
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

        // Launch browser for downloading
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        // const browser = await puppeteer.launch({
        //     headless: "new",   // or true
        //     args: [
        //         "--no-sandbox",
        //         "--disable-setuid-sandbox",
        //         "--disable-dev-shm-usage"
        //     ]
        // });

        const page = await browser.newPage();

        // Set download behavior
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: targetDownloadDir
        });

        // Login process
        await page.goto(CONFIG.LOGIN_URL);
        await page.waitForSelector('#username');
        await page.type('#username', 'sreynoch');
        await page.type('#password', 'today2020#88');
        await page.click('#js-login-submit');
        await page.waitForNavigation();

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
                // Pass includeDownloaded parameter to downloadSingleReport
                const result = await downloadSingleReport(page, inspectionNumber, targetDownloadDir, record, includeDownloaded);
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

        await browser.close();

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
    try {
        const { downloadPath } = req.body;
        const targetDownloadDir = downloadPath || CONFIG.DEFAULT_DOWNLOAD_DIR;

        // Ensure download directory exists
        if (!fs.existsSync(targetDownloadDir)) {
            fs.mkdirSync(targetDownloadDir, { recursive: true });
        }

        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // const browser = await puppeteer.launch({
        //     headless: "new",   // or true
        //     args: [
        //         "--no-sandbox",
        //         "--disable-setuid-sandbox",
        //         "--disable-dev-shm-usage"
        //     ]
        // });

        const page = await browser.newPage();

        // Set download behavior
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: targetDownloadDir
        });

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
        await page.type('#username', 'sreynoch');
        await page.type('#password', 'today2020#88');
        await page.click('#js-login-submit');
        await page.waitForNavigation();

        // Navigate to the default report (you might want to make this configurable)
        const defaultInspectionNumber = "1528972"; // You can make this dynamic
        await page.goto(`${CONFIG.BASE_REPORT_URL}${defaultInspectionNumber}`);
        await page.waitForSelector('#page-wrapper a');

        // Click print button
        await page.click('#page-wrapper a');

        // Wait for download to complete - increased wait time
        await new Promise(resolve => setTimeout(resolve, 8000));

        await browser.close();

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

        // Check if path is valid and accessible
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
            res.json({
                success: true,
                isValid: false,
                path: downloadPath,
                message: `Path is not accessible: ${error.message}`
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

