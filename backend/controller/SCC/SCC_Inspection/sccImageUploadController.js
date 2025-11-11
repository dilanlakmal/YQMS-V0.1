import { API_BASE_URL } from "../../../Config/appConfig.js";
import {sccUploadPath } from "../../../helpers/helperFunctions.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export const uploadSccImage = async(req, res) => {
  if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }
  
      try {
        // Generate a unique filename
        const { imageType, inspectionDate } = req.body;
  
        // --- START OF MODIFICATION ---
        // Sanitize the imageType to create a valid filename component
        const sanitizedImageType = (imageType || "sccimage")
          .replace(/[\/\\]/g, "-") // Replace forward and back slashes with a hyphen
          .replace(/\s+/g, "-") // Replace one or more spaces with a single hyphen
          .replace(/[^a-zA-Z0-9._-]/g, ""); // Remove any other non-standard filename characters
        // --- END OF MODIFICATION ---
  
        const datePart = inspectionDate
          ? inspectionDate.replace(/\//g, "-")
          : new Date().toISOString().split("T")[0];
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  
        // Use the sanitizedImageType to build the new filename
        const newFilename = `${sanitizedImageType}-${datePart}-${uniqueSuffix}.webp`;
        const finalDiskPath = path.join(sccUploadPath, newFilename);


        // Use sharp to process the image from the buffer
        await sharp(req.file.buffer)
          .resize({
            width: 1024,
            height: 1024,
            fit: "inside",
            withoutEnlargement: true
          }) // Resize to max 1024px, don't enlarge small images
          .webp({ quality: 80 }) // Convert to WebP format with 80% quality
          .toFile(finalDiskPath); // Save the processed image to disk
  
        // The public URL that the frontend will use to display the image
        const publicUrlPath = `${API_BASE_URL}/storage/scc_images/${newFilename}`;
        res.json({
          success: true,
          filePath: publicUrlPath,
          filename: newFilename
        });
      } catch (error) {
        console.error("Error processing or saving image:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to process uploaded image." });
      }
};
