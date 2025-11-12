import { QASectionsProductType } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS PRODUCT TYPE - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-product-type
 * Controller: Creates a new product type
 */
export const CreateProductType = async (req, res) => {
  try {
    const {
      EnglishProductName,
      KhmerProductName,
      ChineseProductName,
      ProductLocation
    } = req.body;

    // Validate required fields based on the new schema
    if (!EnglishProductName || !KhmerProductName || !ChineseProductName) {
      return res.status(400).json({
        success: false,
        message:
          "EnglishProductName, KhmerProductName, and ChineseProductName are required"
      });
    }

    // Get the highest 'no' and increment it for the new entry
    const maxProductType = await QASectionsProductType.findOne()
      .sort({ no: -1 })
      .select("no");

    const newNo = maxProductType ? maxProductType.no + 1 : 1;

    const newProductType = new QASectionsProductType({
      no: newNo,
      EnglishProductName,
      KhmerProductName,
      ChineseProductName,
      ProductLocation: ProductLocation || []
    });

    await newProductType.save();

    return res.status(201).json({
      success: true,
      message: "Product type created successfully",
      data: newProductType
    });
  } catch (error) {
    console.error("Error creating product type:", error);

    // Handle duplicate key error for the 'no' field
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry for 'no' or other unique field."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product type",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-product-type
 * Controller: Retrieves all product types sorted by no
 */
export const GetProductTypes = async (req, res) => {
  try {
    const productTypes = await QASectionsProductType.find().sort({ no: 1 });

    return res.status(200).json({
      success: true,
      count: productTypes.length,
      data: productTypes
    });
  } catch (error) {
    console.error("Error fetching product types:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product types",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-product-type/:id
 * Controller: Retrieves a specific product type by ID
 */
export const GetSpecificProductType = async (req, res) => {
  try {
    const productType = await QASectionsProductType.findById(req.params.id);

    if (!productType) {
      return res.status(404).json({
        success: false,
        message: "Product type not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: productType
    });
  } catch (error) {
    console.error("Error fetching specific product type:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product type",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-product-type/:id
 * Controller: Updates a specific product type
 */
export const UpdateProductType = async (req, res) => {
  try {
    const {
      EnglishProductName,
      KhmerProductName,
      ChineseProductName,
      ProductLocation
    } = req.body;

    // Validate required fields
    if (!EnglishProductName || !KhmerProductName || !ChineseProductName) {
      return res.status(400).json({
        success: false,
        message:
          "EnglishProductName, KhmerProductName, and ChineseProductName are required"
      });
    }

    // Only include ProductLocation in the update if it's provided
    if (ProductLocation !== undefined) {
      updateData.ProductLocation = ProductLocation;
    }

    const updatedProductType = await QASectionsProductType.findByIdAndUpdate(
      req.params.id,
      {
        EnglishProductName,
        KhmerProductName,
        ChineseProductName
      },
      { new: true, runValidators: true }
    );

    if (!updatedProductType) {
      return res.status(404).json({
        success: false,
        message: "Product type not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product type updated successfully",
      data: updatedProductType
    });
  } catch (error) {
    console.error("Error updating product type:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product type",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-product-type/:id
 * Controller: Deletes a specific product type
 */
export const DeleteProductType = async (req, res) => {
  try {
    const deletedProductType = await QASectionsProductType.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProductType) {
      return res.status(404).json({
        success: false,
        message: "Product type not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product type deleted successfully",
      data: deletedProductType
    });
  } catch (error) {
    console.error("Error deleting product type:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product type",
      error: error.message
    });
  }
};

/* ============================================================
   🆕 Controllers for Managing Product Locations
   ============================================================ */

/**
 * POST /api/qa-sections-product-type/:id/locations
 * Controller: Adds a new location to a product type.
 */
export const AddProductLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name } = req.body;

    if (!Name) {
      return res
        .status(400)
        .json({ success: false, message: "Location 'Name' is required." });
    }

    const productType = await QASectionsProductType.findById(id);
    if (!productType) {
      return res
        .status(404)
        .json({ success: false, message: "Product type not found." });
    }

    // Determine the next 'No'
    const maxNo = productType.ProductLocation.reduce(
      (max, loc) => (loc.No > max ? loc.No : max),
      0
    );
    const newLocation = {
      No: maxNo + 1,
      Name: Name
    };

    productType.ProductLocation.push(newLocation);
    await productType.save();

    res.status(201).json({
      success: true,
      message: "Location added successfully.",
      data: productType
    });
  } catch (error) {
    console.error("Error adding product location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add location.",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-product-type/:id/locations/:locationId
 * Controller: Updates a specific location within a product type.
 */
export const UpdateProductLocation = async (req, res) => {
  try {
    const { id, locationId } = req.params;
    const { Name, No } = req.body; // Allow updating Name and/or No

    if (!Name && No === undefined) {
      return res.status(400).json({
        success: false,
        message: "Either 'Name' or 'No' must be provided for update."
      });
    }

    const productType = await QASectionsProductType.findById(id);
    if (!productType) {
      return res
        .status(404)
        .json({ success: false, message: "Product type not found." });
    }

    const location = productType.ProductLocation.id(locationId);
    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found." });
    }

    // Update fields if they are provided
    if (Name) location.Name = Name;
    if (No !== undefined) location.No = No;

    await productType.save();

    res.status(200).json({
      success: true,
      message: "Location updated successfully.",
      data: productType
    });
  } catch (error) {
    console.error("Error updating product location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location.",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-product-type/:id/locations/:locationId
 * Controller: Deletes a specific location from a product type.
 */
export const DeleteProductLocation = async (req, res) => {
  try {
    const { id, locationId } = req.params;

    // Use findByIdAndUpdate with the $pull operator for an atomic and reliable update.
    const updatedProductType = await QASectionsProductType.findByIdAndUpdate(
      id, // The ID of the parent document to find
      {
        // The update operation:
        $pull: {
          // Specify the array field:
          ProductLocation: {
            // Specify the condition to match the element to remove:
            _id: locationId
          }
        }
      },
      { new: true } // This option returns the document *after* the update has been applied
    );

    if (!updatedProductType) {
      return res
        .status(404)
        .json({ success: false, message: "Product type not found." });
    }

    res.status(200).json({
      success: true,
      message: "Location deleted successfully.",
      data: updatedProductType // Send back the updated parent document
    });
  } catch (error) {
    console.error("Error deleting product location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete location.",
      error: error.message
    });
  }
};
