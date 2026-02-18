import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { API_BASE_URL, __backendDir } from "../../Config/appConfig.js";
import { Buffer } from "buffer";

/* -------------------------------------
// Washing Image Proxy Controller
// Handles image proxying for PDF generation to bypass CORS and serve local files
------------------------------------- */

export const proxyWashingImage = async (req, res) => {
    const { url } = req.query;

    console.log(`[WashingProxy] Request for URL: ${url}`);

    if (!url) {
        console.error("Washing Image Proxy: No URL provided");
        return res.status(400).json({ error: "An image URL is required." });
    }

    try {
        // Helper to serve local file
        const serveLocalFile = async (filePath) => {
            console.log(`[WashingProxy] Checking file existence: ${filePath}`);
            if (fs.existsSync(filePath)) {
                console.log(`[WashingProxy] File found: ${filePath}`);

                const ext = path.extname(filePath).toLowerCase();

                // If it's a WebP image, convert it to JPEG (React-PDF doesn't support WebP)
                if (ext === ".webp") {
                    try {
                        console.log("Converting WebP to JPEG:", filePath);

                        // Use Sharp to convert WebP to JPEG
                        const convertedBuffer = await sharp(filePath)
                            .jpeg({ quality: 90 })
                            .toBuffer();

                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
                        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

                        res.setHeader("Content-Type", "image/jpeg");
                        res.setHeader("Cache-Control", "public, max-age=3600");
                        res.send(convertedBuffer);

                        return true;
                    } catch (conversionError) {
                        console.error("Error converting WebP:", conversionError);
                        // Return false to try fallback or fail gracefully
                        return false;
                    }
                } else {
                    // For non-WebP images, serve as normal
                    let contentType = "application/octet-stream";

                    switch (ext) {
                        case ".jpg":
                        case ".jpeg":
                            contentType = "image/jpeg";
                            break;
                        case ".png":
                            contentType = "image/png";
                            break;
                        case ".gif":
                            contentType = "image/gif";
                            break;
                        case ".svg":
                            contentType = "image/svg+xml";
                            break;
                    }

                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

                    res.setHeader("Content-Type", contentType);
                    res.setHeader("Cache-Control", "public, max-age=3600");

                    const fileStream = fs.createReadStream(filePath);
                    fileStream.pipe(res);
                    return true;
                }
            } else {
                console.log(`[WashingProxy] File NOT found: ${filePath}`);
            }
            return false;
        };

        // 1. Try to identify as local file by URL matching
        let localPath = "";

        // Robust extraction: ignore the domain/IP and just look for /storage/ path
        const storageMatch = url.match(/\/storage\/(.+)$/);

        if (storageMatch && storageMatch[1]) {
            localPath = storageMatch[1];
            // Remove any potential query parameters
            if (localPath.includes("?")) {
                localPath = localPath.split("?")[0];
            }
        }

        // Legacy fallback
        if (!localPath) {
            if (url.includes(`${API_BASE_URL}/storage/`)) {
                localPath = url.replace(`${API_BASE_URL}/storage/`, "");
            }
        }

        if (localPath) {
            console.log(`[WashingProxy] Extracted local path: ${localPath}`);
            // Sanitize path
            const safeLocalPath = decodeURIComponent(localPath).replace(/\.\./g, "");
            const fullPath = path.join(__backendDir, "public/storage", safeLocalPath);

            const served = await serveLocalFile(fullPath);
            if (served) return;

            // Retrying with washing_machine_test prefix if needed
            if (!safeLocalPath.includes("washing_machine_test") && !fs.existsSync(fullPath)) {
                console.log(`[WashingProxy] Retrying with washing_machine_test prefix`);
                const altPath = path.join(__backendDir, "public/storage/washing_machine_test", safeLocalPath);
                if (await serveLocalFile(altPath)) return;
            }
        } else {
            console.log(`[WashingProxy] Could not extract local path from URL`);
        }

        // 2. Fallback: Fetch as external URL
        const https = await import("https");
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        console.log(`[WashingProxy] Fallback fetching external URL: ${url}`);

        const response = await axios({
            method: "get",
            url: url,
            responseType: "arraybuffer",
            timeout: 30000,
            httpsAgent: agent,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; WashingImageProxy/1.0)"
            }
        });

        const contentType = response.headers["content-type"];

        if (!contentType || !contentType.startsWith("image/")) {
            // Handle 404 text response that might look like image request
            console.error("Washing Image Proxy: Invalid content type:", contentType);
            return res.status(400).json({ error: "URL does not point to a valid image." });
        }

        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        // If it's WebP, convert to JPEG
        if (contentType === "image/webp") {
            try {
                console.log("Converting external WebP to JPEG");

                const convertedBuffer = await sharp(Buffer.from(response.data))
                    .jpeg({ quality: 90 })
                    .toBuffer();

                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Cache-Control", "public, max-age=3600");
                res.send(convertedBuffer);
                return;
            } catch (conversionError) {
                console.error("Error converting external WebP:", conversionError);
                return res.status(500).json({ error: "Failed to convert WebP image." });
            }
        } else {
            // For non-WebP images, serve as normal
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "public, max-age=3600");
            res.send(Buffer.from(response.data));
        }
    } catch (error) {
        console.error("Washing Image Proxy Error:", {
            url: url,
            message: error.message
        });

        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: "Image not found." });
        }

        // Ensure no headers were sent before sending 500
        if (!res.headersSent) {
            res.status(500).json({
                error: "Failed to retrieve image.",
                details: error.message
            });
        }
    }
};
