import express from "express";
import multer from "multer";
import documentController from "../../controller/production/instruction/translate/document.controller.js";


const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                               Multer Config                                */
/* -------------------------------------------------------------------------- */

/**
 * Allowed MIME types for upload
 * @type {string[]}
 */
const ALLOWED_MIME_TYPES = ["application/pdf"];

/**
 * Multer file filter
 * Ensures only PDF files are accepted
 *
 * @param {express.Request} req
 * @param {Express.Multer.File} file
 * @param {(error: Error | null, acceptFile: boolean) => void} cb
 */
const pdfFileFilter = (req, file, cb) => {
  console.log("fileFilter called", typeof cb);

  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

/**
 * Multer upload instance
 *
 * NOTE:
 * - Files are stored temporarily in /uploads
 * - Controllers are responsible for cleanup
 */
const upload = multer({
  dest: "uploads/",
  fileFilter: pdfFileFilter,
  // limits: {
  //   fileSize: 10 * 1024 * 1024, // 10MB (optional)
  // },
});

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

/**
 * POST /pdf/split
 *
 * Description:
 * - Upload a PDF file
 * - Split each page into a separate PDF
 *
 * Request:
 * - multipart/form-data
 * - field name: "file"
 *
 * Response:
 * - JSON with generated files info
 */
// router.post("/pdf/split", upload.single("file"), splitPDF);
router.post("/document", upload.single("file"), documentController);
/**
 * POST /pdf/to/json
 *
 * Description:
 * - Upload a PDF file
 * - Extract and convert content into structured JSON
 *
 * ⚠️ IMPORTANT:
 * - Must be POST if file upload is required
 * - Do NOT use GET with multipart/form-data
 *
 * Request:
 * - multipart/form-data
 * - field name: "file"
 */

export default router;
