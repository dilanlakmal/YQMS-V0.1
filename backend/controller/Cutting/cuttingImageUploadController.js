import multer from "multer";
import sharp from "sharp";
import path from "path";
// Image upload endpoint
export const uploadImage = async(req, res) => { 
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
        "cutting" 
      );

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
        .webp({ quality: 80 })
        .toFile(finalDiskPath);

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
