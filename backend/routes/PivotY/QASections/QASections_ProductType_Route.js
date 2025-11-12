import express from "express";

import {
  CreateProductType,
  GetProductTypes,
  GetSpecificProductType,
  UpdateProductType,
  DeleteProductType,
  AddProductLocation,
  UpdateProductLocation,
  DeleteProductLocation
} from "../../../controller/PivotY/QASections/QASections_ProductType_Controller.js";
const router = express.Router();

/* ================================================
   CRUD for the main Product Type Document
   ================================================ */

/**
 * POST
 * Route: Creates a new product type
 */
router.post("/api/qa-sections-product-type", CreateProductType);

/**
 * GET
 * Route: Retrieves all product types sorted by no
 */
router.get("/api/qa-sections-product-type", GetProductTypes);

/**
 * GET
 * Route: Retrieves a specific product type by ID
 */
router.get("/api/qa-sections-product-type/:id", GetSpecificProductType);

/**
 * PUT
 * Route: Updates a specific product type
 */
router.put("/api/qa-sections-product-type/:id", UpdateProductType);

/**
 * DELETE
 * Route: Deletes a specific product type
 */
router.delete("/api/qa-sections-product-type/:id", DeleteProductType);

/* ================================================
   🆕 CRUD for managing Product Locations (sub-documents)
   ================================================ */

/**
 * POST
 * Route: Adds a new location to a specific product type.
 */
router.post("/api/qa-sections-product-type/:id/locations", AddProductLocation);

/**
 * PUT
 * Route: Updates a specific location within a product type.
 */
router.put(
  "/api/qa-sections-product-type/:id/locations/:locationId",
  UpdateProductLocation
);

/**
 * DELETE
 * Route: Deletes a specific location from a product type.
 */
router.delete(
  "/api/qa-sections-product-type/:id/locations/:locationId",
  DeleteProductLocation
);

export default router;
