import bcrypt from "bcrypt";
import fsPromises from 'fs/promises';
import {sanitize } from "../../Helpers/heperFunction.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Endpoint to upload images for QC Inline Roving
// export const saveQCImage = async (req, res) => {
//     try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }
//     const imagePath = `/storage/qcinline/${req.file.filename}`;
//     res.status(200).json({ imagePath });
//   } catch (error) {
//     console.error("Error uploading image:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to upload image", error: error.message });
//   }
// };

//Roving image upload
export const saveRovingImage = async (req, res) => {
    try {
          const { imageType, date, lineNo, moNo, operationId } = req.body;
          const imageFile = req.file;
          if (!imageFile) {
            const errorMessage =
              req.fileValidationError ||
              (req.multerError && req.multerError.message) ||
              "No image file provided or file rejected by filter.";
            return res.status(400).json({ success: false, message: errorMessage });
          }
    
          if (
            !date ||
            !lineNo ||
            lineNo === "NA_Line" ||
            !moNo ||
            moNo === "NA_MO" ||
            !operationId ||
            operationId === "NA_Op"
          ) {
            return res
              .status(400)
              .json({
                success: false,
                message:
                  "Missing or invalid required metadata: date, lineNo, moNo, operationId must be actual values.",
              });
          }
    
          if (!imageType || !["spi", "measurement", "defect"].includes(imageType.toLowerCase())) {
            return res
              .status(400)
              .json({ success: false, message: 'Invalid image type. Must be "spi", "measurement", or "defect".' });
          }
    
          const sanitizedDate = sanitize(date);
          const sanitizedLineNo = sanitize(lineNo);
          const sanitizedMoNo = sanitize(moNo);
          const sanitizedOperationId = sanitize(operationId);
          const upperImageType = imageType.toUpperCase();
    
          const targetDir = path.resolve(
            __dirname,
            "..",
            "..",
            "..",
            "public",
            "storage",
            "roving",
            upperImageType
          );
          await fsPromises.mkdir(targetDir, { recursive: true });
    
          const imagePrefix = `${sanitizedDate}_${sanitizedLineNo}_${sanitizedMoNo}_${sanitizedOperationId}_`;
          let existingImageCount = 0;
          try {
            const filesInDir = await fsPromises.readdir(targetDir);
            filesInDir.forEach((file) => {
              if (file.startsWith(imagePrefix)) {
                existingImageCount++;
              }
            });
          } catch (readDirError) {
            if (readDirError.code !== "ENOENT") {
                        console.error("Error reading directory for indexing:", targetDir, readDirError);
            }
          }
    
          const imageIndex = existingImageCount + 1;
          const fileExtension = path.extname(imageFile.originalname);
          const newFilename = `${imagePrefix}${imageIndex}${fileExtension}`;
          const filePathInPublic = path.join(targetDir, newFilename);
          await fsPromises.writeFile(filePathInPublic, imageFile.buffer);
          const publicUrl = `/storage/roving/${upperImageType}/${newFilename}`;
          res.json({ success: true, filePath: publicUrl, filename: newFilename });
        } catch (error) {
          console.error("Error uploading roving image:", error);
          if (error.message && error.message.startsWith("Error: Images Only!")) {
            return res.status(400).json({ success: false, message: error.message });
          }
          if (error instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Multer error: ${error.message}` });
          }
          res.status(500).json({ success: false, message: "Server error during image upload." });
        }
};