import multer from "multer";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const qcStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../../public/storage/qcinline");
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const { date, type, emp_id } = req.body;
//     // Validate the inputs to prevent 'undefined' in the filename
//     const currentDate = date || new Date().toISOString().split("T")[0]; // Fallback to current date if not provided
//     const imageType = type || "spi-measurement"; // Fallback to 'unknown' if type is not provided
//     const userEmpId = emp_id || "emp"; // Fallback to 'guest' if emp_id is not provided
//     const randomId = Math.random().toString(36).substring(2, 15);
//     const fileName = `${currentDate}-${imageType}-${userEmpId}-${randomId}${path.extname(file.originalname)}`;
//     cb(null, fileName);
//   }
// });

// Multer instance for QC Inline Roving image uploads
// export const qcUploadMiddleware = multer({
//   storage: qcStorage,
//   limits: { fileSize: 5000000 }, // Limit file size to 5MB
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|gif/;
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = filetypes.test(file.mimetype);
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb("Error: Images Only (jpeg, jpg, png, gif)!");
//     }
//   }
// }).single("image"); 


// Multer storage configuration for Roving images (using memory storage)
const rovingStorage = multer.memoryStorage();

// Multer instance for Roving image uploads
export const rovingUploadMiddleware = multer({
  storage: rovingStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /^(jpeg|jpg|png|gif)$/i;
    const allowedMimeTypes = /^image\/(jpeg|pjpeg|png|gif)$/i;
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    const isExtAllowed = allowedExtensions.test(fileExt);
    const isMimeAllowed = allowedMimeTypes.test(file.mimetype.toLowerCase());
    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else {
      console.error(
        `File rejected by filter: name='${file.originalname}', mime='${file.mimetype}', ext='${fileExt}'. IsMimeAllowed: ${isMimeAllowed}, IsExtAllowed: ${isExtAllowed}`
      );
      cb(new Error("Error: Images Only! (jpeg, jpg, png, gif)"));
    }
  },
});
