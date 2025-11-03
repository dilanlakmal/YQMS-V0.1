import axios from "axios";
import sharp from "sharp";
import fs from "fs"; 
import path from "path";
import { API_BASE_URL, __backendDir } from "../../../Config/appConfig.js";
import { Buffer } from "buffer";



/* -------------------------------------
// Improved Image Proxy for PDF CORS Issue
// This endpoint acts as a middleman to bypass browser CORS restrictions.
------------------------------------- */
export const proxyPDF = async (req, res) => {
  const { url } = req.query;
  
    if (!url) {
      console.error("Image Proxy: No URL provided");
      return res.status(400).json({ error: "An image URL is required." });
    }
  
    try {
      // If it's a local file on the same server
      if (url.includes(`${API_BASE_URL}/storage/`)) {
        const localPath = url.replace(`${API_BASE_URL}/storage/`, "");
        const fullPath = path.join(__backendDir, "public/storage", localPath);
  
        if (fs.existsSync(fullPath)) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
          );
  
          const ext = path.extname(fullPath).toLowerCase();
  
          // If it's a WebP image, convert it to JPEG
          if (ext === ".webp") {
            try {
              console.log("Converting WebP to JPEG:", fullPath);
  
              // Use Sharp to convert WebP to JPEG
              const convertedBuffer = await sharp(fullPath)
                .jpeg({ quality: 90 })
                .toBuffer();
  
              res.setHeader("Content-Type", "image/jpeg");
              res.setHeader("Cache-Control", "public, max-age=3600");
              res.send(convertedBuffer);
  
              return;
            } catch (conversionError) {
              console.error("Error converting WebP:", conversionError);
              return res
                .status(500)
                .json({ error: "Failed to convert WebP image." });
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
  
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "public, max-age=3600");
  
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
            return;
          }
        } else {
          console.error("Image Proxy: Local file not found:", fullPath);
          return res.status(404).json({ error: "Image file not found." });
        }
      }
  
      // For external URLs, fetch and convert if needed
      const response = await axios({
        method: "get",
        url: url,
        responseType: "arraybuffer",
        timeout: 100000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)"
        }
      });
  
      const contentType = response.headers["content-type"];
  
      if (!contentType || !contentType.startsWith("image/")) {
        console.error(
          "Image Proxy: Not a valid image content type:",
          contentType
        );
        return res
          .status(400)
          .json({ error: "URL does not point to a valid image." });
      }
  
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
  
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
      console.error("Image Proxy Error:", {
        url: url,
        message: error.message,
        code: error.code
      });
  
      res.status(500).json({
        error: "Failed to retrieve image.",
        details: error.message
      });
    }
};
