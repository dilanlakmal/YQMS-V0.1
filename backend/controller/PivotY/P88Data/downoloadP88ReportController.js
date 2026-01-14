import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { exec } from 'child_process';
import { p88LegacyData } from '../../MongoDB/dbConnectionController.js'; 
import { Builder, Browser, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import archiver from 'archiver';

const stat = promisify(fs.stat);
// const readdir = promisify(fs.readdir);

const baseTempDir = process.platform === 'win32' 
    ? path.join(process.env.TEMP || 'C:/temp', 'p88-bulk-temp')
    : '/tmp/p88-bulk-temp';

if (!fs.existsSync(baseTempDir)) fs.mkdirSync(baseTempDir, { recursive: true });


const CONFIG = {
    LOGIN_URL: "https://yw.pivot88.com/login",
    BASE_REPORT_URL: "https://yw.pivot88.com/inspectionreport/show/",
    DEFAULT_DOWNLOAD_DIR: process.platform === 'win32' ? "P:/P88Test" : "/tmp/p88-reports",
    HEADLESS: 'new', 
};

// Enhanced waitForNewFile function with better error handling
async function waitForNewFile(dir, existingFiles, timeout = 90000) { // Increased timeout
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
        if (fs.existsSync(dir)) {
            const currentFiles = fs.readdirSync(dir);
            
            // Find files that are PDFs and were NOT in the initial list
            const newPdfs = currentFiles.filter(f => 
                f.endsWith('.pdf') && 
                !existingFiles.includes(f) && 
                !f.endsWith('.crdownload') && 
                !f.endsWith('.tmp') &&
                !f.endsWith('.part')
            );

            // Check if there are any active downloads still happening
            const isDownloading = currentFiles.some(f => 
                f.endsWith('.crdownload') || 
                f.endsWith('.tmp') || 
                f.endsWith('.part')
            );

            if (newPdfs.length > 0 && !isDownloading) {
                // Double check file size to ensure it's not a 0-byte placeholder
                const filePath = path.join(dir, newPdfs[0]);
                const fileSize = fs.statSync(filePath).size;
                
                if (fileSize > 1000) { 
                    return newPdfs;
                }
            }
        }
        
        await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
    }
    throw new Error('Download timeout: No new PDF file detected within 90 seconds.');
}


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
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
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

export const downloadBulkReportsUbuntu = async (req, res) => {
    let driver = null;
    let jobDir = null;
    try {
        const { startRange, endRange, downloadAll, startDate, endDate, factoryName, language = 'english', includeDownloaded = false  } = req.body;
        
        jobDir = path.join(baseTempDir, `selenium_${Date.now()}`);
        fs.mkdirSync(jobDir, { recursive: true });

        const records = await getInspectionRecords(startRange, endRange, downloadAll, startDate, endDate, factoryName, includeDownloaded );
        if (records.length === 0) return res.json({ success: false, message: 'No records matching criteria' });

        const options = new chrome.Options();
        options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
        options.setUserPreferences({ 'download.default_directory': jobDir });

        driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
        await driver.sendAndGetDevToolsCommand('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: jobDir });

        // Login
        await driver.get(CONFIG.LOGIN_URL);
        await driver.findElement(By.id('username')).sendKeys(process.env.P88_USERNAME);
        await driver.findElement(By.id('password')).sendKeys(process.env.P88_PASSWORD);
        await driver.findElement(By.id('js-login-submit')).click();
        await driver.wait(until.urlContains('dashboard'), 20000);

        for (const record of records) {
            const inspNo = record.inspectionNumbers?.[0] || record.inspectionNumbersKey?.split('-')[0];
            if (!inspNo) continue;

            try {
                await updateDownloadStatus(record._id, 'In Progress');
                
                const filesBefore = fs.readdirSync(jobDir);
                
                // Navigate to report
                await driver.get(`${CONFIG.BASE_REPORT_URL}${inspNo}`);
                
                const printBtn = await driver.wait(until.elementLocated(By.css('#page-wrapper a')), 15000);
                await printBtn.click();

                const newFiles = await waitForNewFile(jobDir, filesBefore);
                const baseName = getFilename(record);

                newFiles.forEach((file, index) => {
                    const oldPath = path.join(jobDir, file);
                    const newName = `${baseName}${newFiles.length > 1 ? `_${index + 1}` : ''}.pdf`;
                    fs.renameSync(oldPath, path.join(jobDir, newName));
                });

                await updateDownloadStatus(record._id, 'Downloaded');
            } catch (err) {
                console.error(`❌ Error on ${inspNo}:`, err.message);
                await updateDownloadStatus(record._id, 'Failed');
            }
        }

        await driver.quit();
        await streamZipAndCleanup(jobDir, res);
    } catch (error) {
        if (driver) await driver.quit();
        res.status(500).json({ success: false, error: error.message });
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

// Enhanced Language change function for Puppeteer
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
const updateDownloadStatus = async (recordId, status) => {
    try {
        await p88LegacyData.findByIdAndUpdate(recordId, { 
            downloadStatus: status, 
            downloadedAt: status === 'Downloaded' ? new Date() : null 
        });
    } catch (e) { console.error("DB Error:", e.message); }
};

const getFilename = (record) => {
    const reportType = (record.reportType || 'Report').replace(/[/\\?%*:|"<>]/g, '-');
    const po = (record.poNumbers?.length > 0 ? record.poNumbers[0] : 'NO-PO');
    const group = record.groupNumber || 'NO-GROUP';
    return `${reportType}-${po}-${group}`;
};

// Get inspection records from your MongoDB collection (updated to include download status)
const getInspectionRecords = async (startRange, endRange, downloadAll, startDate, endDate, factoryName, includeDownloaded = false) => {
    let query = {};
    
    // Only exclude downloaded records if user hasn't selected to include them
    if (!includeDownloaded) {
        query.downloadStatus = { $ne: 'Downloaded' };
    }
    
    if (startDate && endDate) {
        query.submittedInspectionDate = { 
            $gte: new Date(startDate), 
            $lte: new Date(endDate + 'T23:59:59.999Z') 
        };
    }
    
    if (factoryName?.trim()) {
        query.supplier = factoryName;
    }
    
    console.log(`🔍 Query for records:`, query);
    console.log(`📊 Include downloaded: ${includeDownloaded}`);
    
    if (downloadAll) {
        const records = await p88LegacyData.find(query).sort({ submittedInspectionDate: 1 }).lean();
        console.log(`📋 Found ${records.length} records for download`);
        return records;
    }
    
    const skip = Math.max(0, startRange - 1);
    const limit = Math.max(1, endRange - startRange + 1);
    const records = await p88LegacyData.find(query).sort({ submittedInspectionDate: 1 }).skip(skip).limit(limit).lean();
    console.log(`📋 Found ${records.length} records for range ${startRange}-${endRange}`);
    return records;
};

export const downloadBulkReportsAuto = async (req, res) => {
    process.platform === 'linux' ? await downloadBulkReportsUbuntu(req, res) : await downloadBulkReports(req, res);
};

// NEW: Single file download with temp folder and direct serve
export const downloadSingleReportDirect = async (req, res) => {
    let browser = null;
    let jobDir = null;
    try {
        const { inspectionNumber, language = 'english' } = req.body;
        
        console.log(`🌐 Starting single download with language: ${language}`);
        
        if (!inspectionNumber) {
            return res.status(400).json({
                success: false,
                error: 'Inspection number is required'
            });
        }

        const jobId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        jobDir = path.join(baseTempDir, jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        browser = await puppeteer.launch({
            headless: CONFIG.HEADLESS,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
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

        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 🔥 ALWAYS try to change language (for both English and Chinese)
        console.log(`🌐 Changing language to ${language} for report ${inspectionNumber}`);
        const languageChanged = await changeLanguage(page, language);
        if (languageChanged) {
            console.log(`✅ Language changed to ${language} for ${inspectionNumber}`);
        } else {
            console.warn(`⚠️ Language change failed for ${inspectionNumber}`);
        }

        // Wait for print button and click
        await page.waitForSelector('#page-wrapper a', { timeout: 15000 });
        await page.click('#page-wrapper a');
        
        // Wait and check for file creation
        let downloadedFile = null;
        let attempts = 0;
        const maxAttempts = 30;
        
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
            throw new Error('Download timeout - no file was downloaded within 30 seconds');
        }

        // Send file to the user
        const filePath = path.join(jobDir, downloadedFile);
        const customFileName = `Report-${inspectionNumber}-${language}-${Date.now()}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${customFileName}"`);
        res.setHeader('Content-Type', 'application/pdf');

        res.download(filePath, customFileName, (err) => {
            // Cleanup temp directory
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
                console.log(`✅ File sent successfully to user in ${language}`);
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

// Updated downloadBulkReports function
export const downloadBulkReports = async (req, res) => {
    let browser = null;
    let jobDir = null;
    try {
        const { startRange, endRange, downloadAll, startDate, endDate, factoryName, language = 'english', includeDownloaded = false } = req.body;
        
        console.log(`🌐 Starting bulk download with language: ${language}`);
        
        jobDir = path.join(baseTempDir, `puppeteer_${Date.now()}`);
        fs.mkdirSync(jobDir, { recursive: true });

        const records = await getInspectionRecords(startRange, endRange, downloadAll, startDate, endDate, factoryName, includeDownloaded );
        
        browser = await puppeteer.launch({ 
            headless: CONFIG.HEADLESS, 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set longer timeouts
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: jobDir });

        // Login process
        await page.goto(CONFIG.LOGIN_URL);
        await page.waitForSelector('#username');
        await page.type('#username', process.env.P88_USERNAME);
        await page.type('#password', process.env.P88_PASSWORD);
        await page.click('#js-login-submit');
        await page.waitForNavigation();

        for (const record of records) {
            const inspNo = record.inspectionNumbers?.[0] || record.inspectionNumbersKey?.split('-')[0];
            if (!inspNo) continue;

            try {
                console.log(`🚀 Processing: ${inspNo} in ${language}`);
                await updateDownloadStatus(record._id, 'In Progress');
                const filesBefore = fs.readdirSync(jobDir);

                // Navigate to report
                await page.goto(`${CONFIG.BASE_REPORT_URL}${inspNo}`, { 
                    waitUntil: 'networkidle0',
                    timeout: 60000 
                });

                // Wait for page to fully load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // 🔥 ALWAYS try to change language (for both English and Chinese)
                console.log(`🌐 Changing language to ${language} for report ${inspNo}`);
                const languageChanged = await changeLanguage(page, language);
                if (languageChanged) {
                    console.log(`✅ Language changed to ${language} for ${inspNo}`);
                    // Wait for page to reload with new language
                    await new Promise(resolve => setTimeout(resolve, 4000));
                } else {
                    console.warn(`⚠️ Language change failed for ${inspNo}, continuing with current language`);
                }

                // Wait for and click print button with multiple selectors
                console.log(`🖨️ Looking for print button...`);
                let printButton = null;
                
                const printSelectors = [
                    '#page-wrapper a',
                    'a[href*="print"]',
                    'a[onclick*="print"]',
                    '.print-btn',
                    'button[onclick*="print"]'
                ];
                
                for (const selector of printSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 5000 });
                        printButton = await page.$(selector);
                        if (printButton) {
                            console.log(`✅ Found print button with selector: ${selector}`);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                if (!printButton) {
                    throw new Error('Print button not found with any selector');
                }

                // Click print button
                console.log(`🖨️ Clicking print button...`);
                await printButton.click();
                
                // Wait a bit for download to start
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Wait for file download
                console.log(`⏳ Waiting for file download...`);
                const newFiles = await waitForNewFile(jobDir, filesBefore);

                // Rename files
                const baseName = getFilename(record);
                newFiles.forEach((file, index) => {
                    const oldPath = path.join(jobDir, file);
                    const newName = `${baseName}${newFiles.length > 1 ? `_${index + 1}` : ''}.pdf`;
                    fs.renameSync(oldPath, path.join(jobDir, newName));
                    console.log(`📄 Renamed: ${file} → ${newName}`);
                });

                await updateDownloadStatus(record._id, 'Downloaded');
                console.log(`✅ Downloaded: ${inspNo} in ${language}`);
                
            } catch (err) {
                console.error(`❌ Error downloading ${inspNo}:`, err.message);
                await updateDownloadStatus(record._id, 'Failed');
                
                // Take screenshot for debugging
                try {
                    const screenshotPath = path.join(jobDir, `error_${inspNo}_${Date.now()}.png`);
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    console.log(`📸 Error screenshot saved: ${screenshotPath}`);
                } catch (screenshotError) {
                    console.log('Could not take error screenshot:', screenshotError.message);
                }
            }
        }

        await browser.close();
        await streamZipAndCleanup(jobDir, res);
    } catch (error) {
        console.error('❌ Bulk download failed:', error);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
};

async function streamZipAndCleanup(jobDir, res) {
    const zipName = `Reports_${Date.now()}.zip`;
    const zipPath = path.join(baseTempDir, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        res.download(zipPath, zipName, (err) => {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            if (fs.existsSync(jobDir)) fs.rmSync(jobDir, { recursive: true, force: true });
        });
    });

    archive.pipe(output);
    archive.directory(jobDir, false);
    await archive.finalize();
}

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
