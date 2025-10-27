import {
  QAStandardDefectsModel,
} from "../MongoDB/dbConnectionController.js";
import path from "path";
import { __backendDir } from "../../Config/appConfig.js";
import { sanitize } from "../../Helpers/helperFunctions.js";
import { promises as fsPromises } from "fs";
import sharp from "sharp";


// 1. ENDPOINT: Search for QA Standard Defects
export const getStanderdDefect = async (req, res) => {
    try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.json([]);
    }

    const searchNumber = parseInt(searchTerm, 10);
    const query = isNaN(searchNumber)
      ? {
          $or: [
            { english: { $regex: searchTerm, $options: "i" } },
            { khmer: { $regex: searchTerm, $options: "i" } }
          ]
        }
      : { code: searchNumber };

    const defects = await QAStandardDefectsModel.find(query)
      .limit(20)
      .sort({ code: 1 });
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QA standard defects:", error);
    res.status(500).json({ error: "Failed to fetch QA defects" });
  }
};

// 2. ENDPOINT: Image Upload for QA Module
export const saveQaImageUpload = async (req, res) => {
  try {
        const {
        reportType,
        factory,
        lineNo,
        moNo,
        color,
        qcId,
        imageType,
        sectionName
      } = req.body; // imageType can be 'defect', 'spi', etc.
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({ message: "No image file provided." });
      }
      if (!moNo || !qcId || !imageType) {
        return res.status(400).json({ message: "Missing required metadata." });
      }
  
        const uploadPath = path.join(
          __backendDir,
          "public",
          "storage",
          "sub-con-qc1"
        );
        //await fsPromises.mkdir(uploadPath, { recursive: true });
  
          const sanitizedReportType = sanitize(reportType);
          const sanitizedFactory = sanitize(factory);
          const sanitizedlineNo = sanitize(lineNo);
          const sanitizedMoNo = sanitize(moNo);
          const sanitizedColor = sanitize(color);
          const sanitizedQcId = sanitize(qcId);
          const sanitizedImageType = sanitize(imageType);
          const sanitizedSection = sanitize(sectionName || "");
    
          const timestamp = Date.now();
          const newFilename = `${sanitizedImageType}${
            sanitizedSection ? `_${sanitizedSection}` : ""
          }_${sanitizedReportType}_${sanitizedFactory}_${sanitizedlineNo}_${sanitizedMoNo}_${sanitizedColor}_${sanitizedQcId}_${timestamp}.webp`;
          const finalDiskPath = path.join(uploadPath, newFilename);
  
        await sharp(imageFile.buffer)
          .resize({
            width: 1024,
            height: 1024,
            fit: "inside",
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toFile(finalDiskPath);
  
        const relativeUrl = `/storage/sub-con-qc1/${newFilename}`;
        res.json({ success: true, filePath: relativeUrl });
      } catch (error) {
        console.error("Error in Sub-Con QA image upload:", error);
        res
          .status(500)
          .json({ message: "Server error during image processing." });
      }
};