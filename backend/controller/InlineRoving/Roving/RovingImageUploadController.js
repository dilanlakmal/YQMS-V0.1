import fsPromises from "fs/promises";
import { sanitize } from "../../../helpers/helperFunctions.js";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { API_BASE_URL } from "../../../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __backendDir = path.dirname(__filename);

//Roving image upload
export const saveRovingImage = async (req, res) => {
  try {
    // --- Validation ---
    const { imageType, date, lineNo, moNo, operationId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "No image file provided."
      });
    }

    if (!imageType || !date || !lineNo || !moNo || !operationId) {
      return res.status(400).json({
        success: false,
        message: "Missing required metadata fields for image."
      });
    }

    // --- File Saving Logic with Sharp ---
    const qcinlineUploadPath = path.join(
      __backendDir,
      "..",
      "..",
      "..",
      "public",
      "storage",
      "qcinline" // existing path is preserved
    );
    // await fsPromises.mkdir(qcinlineUploadPath, { recursive: true });

    // Sanitize metadata for the filename (existing logic is good)
    const sanitizedImageType = sanitize(imageType.toUpperCase());
    const sanitizedDate = sanitize(date);
    const sanitizedLineNo = sanitize(lineNo);
    const sanitizedMoNo = sanitize(moNo);
    const sanitizedOperationId = sanitize(operationId);

    // Construct the unique prefix
    const imagePrefix = `${sanitizedImageType}_${sanitizedDate}_${sanitizedLineNo}_${sanitizedMoNo}_${sanitizedOperationId}_`;

    // Find the next available index for this prefix
    const filesInDir = await fsPromises.readdir(qcinlineUploadPath);
    const existingImageCount = filesInDir.filter((f) =>
      f.startsWith(imagePrefix)
    ).length;
    const imageIndex = existingImageCount + 1;

    // Create the new filename with a .webp extension
    const newFilename = `${imagePrefix}${imageIndex}.webp`;

    const finalDiskPath = path.join(qcinlineUploadPath, newFilename);

    // Process the image from memory buffer with sharp and save to disk
    await sharp(imageFile.buffer)
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(finalDiskPath);

    // Construct the public URL for the client
    const publicUrl = `${API_BASE_URL}/storage/qcinline/${newFilename}`;

    res.json({
      success: true,
      filePath: publicUrl,
      filename: newFilename
    });
  } catch (error) {
    console.error("Error in /api/roving/upload-roving-image:", error);
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
