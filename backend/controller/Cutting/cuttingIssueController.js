import {
  CuttingIssue,                
} from "../MongoDB/dbConnectionController.js"; 
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { __backendDir } from "../../Config/appConfig.js";

/* ------------------------------
  Cutting Issues ENDPOINTS
------------------------------ */

// Add this endpoint after other endpoints
export const getCuttingIssues = async (req, res) => {
    try {
    const issues = await CuttingIssue.find().sort({ no: 1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching cutting issues:", error);
    res.status(500).json({
      message: "Failed to fetch cutting issues",
      error: error.message
    });
  }
};

// --- Image Upload Endpoint (MODIFIED) ---
export const uploadCuttingImage = async (req, res) => {
  try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No file uploaded."
          });
        }
  
        // --- File Saving Logic with Sharp ---
        const cuttingUploadPath = path.join(
          __backendDir,
          "public",
          "storage",
          "cutting" // Your existing path is preserved
        );
        // Ensure the directory exists
        // await fs.promises.mkdir(cuttingUploadPath, { recursive: true });
  
        // Create a unique filename, saving as .webp
        const newFilename = `cutting-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}.webp`;
  
        const finalDiskPath = path.join(cuttingUploadPath, newFilename);
  
        // Use sharp to process the image from buffer
        await sharp(req.file.buffer)
          .resize({
            width: 1024,
            height: 1024,
            fit: "inside",
            withoutEnlargement: true
          })
          .webp({ quality: 80 }) // Convert to efficient WebP format
          .toFile(finalDiskPath);
  
        // --- URL Construction ---
        // Return the relative path, which is what your frontend expects
        const relativeUrl = `/storage/cutting/${newFilename}`;
  
        res.status(200).json({ success: true, url: relativeUrl });
      } catch (error) {
        console.error("Error in /api/upload-cutting-image:", error);
        if (error instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: `File upload error: ${error.message}`
          });
        }
        res.status(500).json({
          success: false,
          message: "Server error during image processing."
        });
      }
};
