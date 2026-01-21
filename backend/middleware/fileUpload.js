
import multer from "multer";

/**
 * Allowed MIME types for upload
 */
const ALLOWED_MIME_TYPES = ["application/pdf"];

/**
 * PDF File Filter
 * @param {express.Request} req
 * @param {Express.Multer.File} file
 * @param {Function} cb
 */
const pdfFileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

/**
 * Multer PDF Upload Instance
 */
export const uploadPdf = multer({
    dest: "uploads/",
    fileFilter: pdfFileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
    },
});
