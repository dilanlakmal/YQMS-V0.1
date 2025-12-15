import { Builder, Browser, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import path from "path";
import fs from "fs";

/* ======================
   CONFIG
====================== */
const CONFIG = {
    LOGIN_URL: "https://yw.pivot88.com/login",
    REPORT_URL: "https://yw.pivot88.com/inspectionreport/show/1528972",
    DOWNLOAD_DIR: path.resolve("./downloads"),
    CHROME_BINARY: "./chrome/win64-139.0.7258.154/chrome-win64/chrome.exe", // to get this file need to run this command " npx @puppeteer/browsers install chrome@139"
    TIMEOUT: 15000
};

/* ======================
   UTILITIES
====================== */
function ensureDownloadDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
async function waitForDownloadComplete(dir, timeout = 30000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const files = fs.readdirSync(dir);

        const tmpFiles = files.filter(f => f.endsWith(".tmp"));
        if (tmpFiles.length === 0 && files.length > 0) {
            return;
        }

        await new Promise(r => setTimeout(r, 500));
    }

    throw new Error("Download timeout");
}
function createChromeOptions() {
    const options = new chrome.Options();

    options.setChromeBinaryPath(CONFIG.CHROME_BINARY);

    options.setUserPreferences({
        "download.default_directory": CONFIG.DOWNLOAD_DIR,
        "download.prompt_for_download": false,
        "directory_upgrade": true,
        "safebrowsing.enabled": true,
        "plugins.always_open_pdf_externally": true

    });

    return options;
}

async function createDriver() {
    return new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(createChromeOptions())
        .build();
}

/* ======================
   ACTIONS
====================== */
async function login(driver) {
    await driver.get(CONFIG.LOGIN_URL);

    const usernameInput = await driver.wait(
        until.elementLocated(By.id("username")),
        CONFIG.TIMEOUT
    );
    await usernameInput.sendKeys("sreynoch");

    const passwordInput = await driver.findElement(By.id("password"));
    await passwordInput.sendKeys("today2020#88");

    const submitButton = await driver.findElement(By.id("js-login-submit"));
    await submitButton.click();
}

async function openReport(driver) {
    await driver.get(CONFIG.REPORT_URL);
}

async function downloadImages(driver) {
    const container = await driver.wait(
        until.elementLocated(By.id("defects-body3117211")),
        CONFIG.TIMEOUT
    );

    const downloadButtons = await container.findElements(By.css("a"));

    for (const btn of downloadButtons) {
        await btn.click();
    }
}

async function printReport(driver) {
    const printButton = await driver.wait(
        until.elementLocated(By.css("#page-wrapper a")),
        // CONFIG.TIMEOUT
    );
    
    await printButton.click();

}

/* ======================
   MAIN
====================== */
async function Scraping() {
    ensureDownloadDir(CONFIG.DOWNLOAD_DIR);

    const driver = await createDriver();

    try {
        await login(driver);
        await openReport(driver);
        // await downloadImages(driver);
        await printReport(driver);
        await waitForDownloadComplete(CONFIG.DOWNLOAD_DIR);

        console.log("✅ Scraping completed successfully");
    } catch (error) {
        console.error("❌ Scraping failed:", error);
    } finally {
        await driver.quit();
    }
}

// Top-level await (ESM)
await Scraping();
