import express from "express";
import {
  upload,
  CreateProductLocation,
  GetProductLocations,
  GetSpecificProductLocation,
  GetProductLocationByType,
  UpdateProductLocation,
  DeleteProductLocation,
  ServeProductLocationImage
} from "../../../controller/PivotY/QASections/QASections_ProductLocation_Controller.js";

const router = express.Router();

/* ============================================================
   QA SECTIONS - PRODUCT LOCATION ROUTES
   ============================================================ */

// CREATE - Upload images and create product location
router.post(
  "/api/qa-sections-product-location",
  upload.fields([
    { name: "frontView", maxCount: 1 },
    { name: "backView", maxCount: 1 }
  ]),
  CreateProductLocation
);

// READ - Get all product locations
router.get("/api/qa-sections-product-location", GetProductLocations);

// READ - Get specific product location by ID
router.get("/api/qa-sections-product-location/:id", GetSpecificProductLocation);

// READ - Get product location by product type
router.get(
  "/api/qa-sections-product-location/product-type/:productTypeId",
  GetProductLocationByType
);

// UPDATE - Update product location
router.put(
  "/api/qa-sections-product-location/:id",
  upload.fields([
    { name: "frontView", maxCount: 1 },
    { name: "backView", maxCount: 1 }
  ]),
  UpdateProductLocation
);

// DELETE - Delete product location
router.delete("/api/qa-sections-product-location/:id", DeleteProductLocation);

// SERVE - Serve product location images
router.get(
  "/api/qa-sections-product-location/image/:filename",
  ServeProductLocationImage
);

export default router;
