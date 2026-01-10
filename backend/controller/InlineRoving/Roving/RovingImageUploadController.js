import fsPromises from "fs/promises";
import path from "path";
import { __backendDir } from "../../../Config/appConfig.js";

function getServerBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

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
    
          const serverBaseUrl = getServerBaseUrl(req);

          const qcinlineUploadPath = path.join(
            __backendDir,
            "./public",
            "storage",
            "qcinline"
          );
          await fsPromises.mkdir(qcinlineUploadPath, { recursive: true });
    
          const fileExtension = path.extname(imageFile.originalname);
          const newFilename = `roving-${Date.now()}-${Math.round(
            Math.random() * 1e9
          )}${fileExtension}`;
          const finalDiskPath = path.join(qcinlineUploadPath, newFilename);
    
          await fsPromises.writeFile(finalDiskPath, imageFile.buffer);
    
          // Construct the public URL for the client
          const publicUrl = `${serverBaseUrl}/storage/qcinline/${newFilename}`;
    
          res.json({
            success: true,
            filePath: publicUrl,
            filename: newFilename
          });
        } catch (error) {
          console.error("Error in /api/roving/upload-roving-image:", error);
          res.status(500).json({
            success: false,
            message: "Server error during image processing."
          });
        }
};
