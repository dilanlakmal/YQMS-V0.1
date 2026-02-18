import express from "express";
import { getWashingMachineTestImage } from "../../controller/ReportWashing/reportWashingController.js";
import { proxyWashingImage } from "../../controller/ReportWashing/WashingImageController.js";

const router = express.Router();

// Image Proxy route for PDF generation
router.get("/api/report-washing/image-proxy", proxyWashingImage);

// Route to serve washing machine test images.
// Uses wildcard /* so Express captures filenames with dots (e.g. photo.webp.jpg).
// Strips a trailing .jpg suffix added by @react-pdf/renderer for URL extension validation.
router.get("/api/report-washing/image/*", (req, res, next) => {
    // Extract filename from the wildcard path
    let filename = req.params[0] || "";

    // Strip trailing .jpg if the real extension is embedded before it (e.g. photo.webp.jpg)
    if (filename.endsWith(".jpg")) {
        const withoutJpg = filename.slice(0, -4);
        const innerExt = withoutJpg.split(".").pop().toLowerCase();
        if (["webp", "png", "gif", "jpeg"].includes(innerExt)) {
            filename = withoutJpg;
        }
    }

    // Inject back as req.params.filename for getWashingMachineTestImage
    req.params.filename = filename;
    next();
}, getWashingMachineTestImage);

export default router;