import {
  QAStandardDefectsModel,
} from "../MongoDB/dbConnectionController.js";
import path from "path";
import { __backendDir } from "../Config/appConfig.js";
import { sanitize } from "../Helpers/helperFunctions.js";
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
        ? { english: { $regex: searchTerm, $options: "i" } } // Search by name (case-insensitive)
        : { code: searchNumber }; // Search by code
  
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
        const { date, factory, lineNo, moNo, defectCode } = req.body;
        const imageFile = req.file;
  
        if (!imageFile) {
          return res.status(400).json({ message: "No image file provided." });
        }
        if (!date || !factory || !lineNo || !moNo || !defectCode) {
          return res.status(400).json({ message: "Missing required metadata." });
        }
  
        const uploadPath = path.join(
          __backendDir,
          "public",
          "storage",
          "sub-con-qc1"
        );
        //await fsPromises.mkdir(uploadPath, { recursive: true });
  
        const sanitizedFactory = sanitize(factory);
        const sanitizedDate = sanitize(date);
        const sanitizedLineNo = sanitize(lineNo);
        const sanitizedMoNo = sanitize(moNo);
        const sanitizedDefectCode = sanitize(defectCode);
  
        const imagePrefix = `QA_${sanitizedDate}_${sanitizedFactory}_${sanitizedLineNo}_${sanitizedMoNo}_${sanitizedDefectCode}_`;
  
        const filesInDir = await fsPromises.readdir(uploadPath);
        const existingImageCount = filesInDir.filter((f) =>
          f.startsWith(imagePrefix)
        ).length;
        const imageIndex = existingImageCount + 1;
  
        const newFilename = `${imagePrefix}${imageIndex}.webp`;
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
  
        // ---Use a relative URL for the frontend ---
        const relativeUrl = `/storage/sub-con-qc1/${newFilename}`;
  
        res.json({ success: true, filePath: relativeUrl }); // Send the relative path
      } catch (error) {
        console.error("Error in QA image upload:", error);
        res
          .status(500)
          .json({ message: "Server error during image processing." });
      }
};