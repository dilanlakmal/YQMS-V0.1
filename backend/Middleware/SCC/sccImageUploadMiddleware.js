import multer from "multer";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const sccImageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = path.join(__dirname, "../../public/storage/scc_images");
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     const { imageType, inspectionDate } = req.body;
//     const datePart = inspectionDate
//       ? inspectionDate.replace(/\//g, "-")
//       : new Date().toISOString().split("T")[0];
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const filename = `${
//       imageType || "sccimage"
//     }-${datePart}-${uniqueSuffix}${path.extname(file.originalname)}`;
//     cb(null, filename);
//   }
// });

// Multer setup for SCC image uploads
const sccImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
  cb(null, "public/storage/scc_images");
  },
  filename: (req, file, cb) => {
  // imageType should be passed in the body: 'referenceSample-HT', 'afterWash-FU', etc.
  const { imageType, inspectionDate } = req.body;
  const datePart = inspectionDate
  ? inspectionDate.replace(/\//g, "-")
  : new Date().toISOString().split("T")[0];
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  // Filename: imageType-date-uniqueSuffix.extension
  const filename = `${
  imageType || "sccimage"
  }-${datePart}-${uniqueSuffix}${path.extname(file.originalname)}`;
  cb(null, filename);
  }
});
export const sccUploadMiddleware = multer({ storage: sccImageStorage }).single("imageFile");