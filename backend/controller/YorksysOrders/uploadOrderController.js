import { YorksysOrders, ymProdConnection } from "../MongoDB/dbConnectionController.js";

//Saves Yorksys order data to MongoDB
export const saveYorksysOrderData = async (req, res) => {
  try {
    const orderPayload = req.body;

    // Validate required fields
    if (!orderPayload.moNo || !orderPayload.factory || !orderPayload.buyer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: moNo, factory, or buyer."
      });
    }

    // Use findOneAndUpdate with upsert to replace existing record
    const updatedOrder = await YorksysOrders.findOneAndUpdate(
      {
        moNo: orderPayload.moNo,
        factory: orderPayload.factory
      },
      orderPayload, // Replace entire document with new data
      {
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist
        runValidators: true // Run schema validators
      }
    );

    // Check if it was an update or insert
    const isNewRecord =
      !updatedOrder.createdAt ||
      updatedOrder.createdAt.getTime() === updatedOrder.updatedAt.getTime();

    return res.status(isNewRecord ? 201 : 200).json({
      success: true,
      message: isNewRecord
        ? `Order ${orderPayload.moNo} saved successfully!`
        : `Order ${orderPayload.moNo} updated successfully!`,
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error saving Yorksys order:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: " + error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while saving order.",
      error: error.message
    });
  }
};

//Retrieves a specific order by MO Number
export const getYorksysOrder = async (req, res) => {
  try {
    const { moNo } = req.params;
    const order = await YorksysOrders.findOne({ moNo });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${moNo} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Error fetching Yorksys order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order.",
      error: error.message
    });
  }
};

//washing test Retrieves a specific order by Style (YM Style)
// Checks both yorksys_orders and dt_orders collections
export const getYorksysOrderByStyle = async (req, res) => {
  try {
    const { style } = req.params;
    const trimmedStyle = style.trim();

    // First, try to find in yorksys_orders collection
    // Use case-insensitive regex search to match the style field
    // This handles cases where the style might have different casing or extra spaces
    // Also try exact match first for better performance
    let order = await YorksysOrders.findOne({
      $or: [
        { style: trimmedStyle },
        { moNo: trimmedStyle }, // Search by MO Number as well
        { style: { $regex: new RegExp(`^${trimmedStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
        { moNo: { $regex: new RegExp(`^${trimmedStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } }
      ]
    });

    // If still not found, try searching with trimmed style field values
    if (!order) {
      // Try matching against trimmed style values in database
      const allOrders = await YorksysOrders.find({
        style: { $exists: true, $ne: "N/A", $ne: null }
      }).select("style moNo").lean();

      // Find order where style matches after trimming
      const matchingOrder = allOrders.find(o =>
        o.style && o.style.trim().toLowerCase() === trimmedStyle.toLowerCase()
      );

      if (matchingOrder) {
        // Fetch the full order document
        order = await YorksysOrders.findOne({ _id: matchingOrder._id });
      }
    }

    // If found in yorksys_orders, return it
    if (order) {
      return res.status(200).json({
        success: true,
        data: order,
        source: "yorksys_orders"
      });
    }

    // If not found in yorksys_orders, check dt_orders collection
    // In dt_orders, the Order_No field corresponds to YM Style
    const dtOrdersCollection = ymProdConnection.db.collection("dt_orders");

    // Try exact match first
    let dtOrder = await dtOrdersCollection.findOne({
      $or: [
        { Order_No: trimmedStyle },
        { CustStyle: trimmedStyle }
      ]
    });

    // If not found, try case-insensitive search
    if (!dtOrder) {
      const regex = new RegExp(`^${trimmedStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
      dtOrder = await dtOrdersCollection.findOne({
        $or: [
          { Order_No: { $regex: regex } },
          { CustStyle: { $regex: regex } }
        ]
      });
    }

    if (dtOrder) {
      // Order exists in dt_orders but not in yorksys_orders
      // Return a response indicating this (but no SKUData available)
      return res.status(200).json({
        success: true,
        message: `Order "${trimmedStyle}" found in dt_orders but not in yorksys_orders. ETD and PO data not available.`,
        data: {
          style: trimmedStyle,
          existsInDtOrders: true,
          existsInYorksysOrders: false,
          // Return empty SKUData since it doesn't exist in yorksys_orders
          SKUData: []
        },
        source: "dt_orders"
      });
    }

    // Not found in either collection
    // Log for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      // Check if there are similar styles (for debugging)
      const similarStyles = await YorksysOrders.find({
        style: { $regex: new RegExp(trimmedStyle.substring(0, Math.min(6, trimmedStyle.length)), "i") }
      }).select("style moNo").limit(5).lean();

      if (similarStyles.length > 0) {
        console.log(`[DEBUG] Order "${trimmedStyle}" not found. Similar styles in yorksys_orders:`,
          similarStyles.map(s => ({ style: s.style, moNo: s.moNo }))
        );
      }
    }

    return res.status(200).json({
      success: false,
      message: `Order with style "${trimmedStyle}" not found in either yorksys_orders or dt_orders collection.`
    });
  } catch (error) {
    console.error("Error fetching Yorksys order by style:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order by style.",
      error: error.message
    });
  }
};

// ============================================================
// Retrieves unique values for filter dropdowns
// ============================================================
export const getYorksysOrderFilterOptions = async (req, res) => {
  try {
    // Fetch distinct values in parallel for better performance
    const [factories, buyers, seasons] = await Promise.all([
      YorksysOrders.distinct("factory"),
      YorksysOrders.distinct("buyer"),
      YorksysOrders.distinct("season")
    ]);

    res.status(200).json({
      success: true,
      data: {
        // Filter out any null/empty values and sort them
        factories: factories.filter(Boolean).sort(),
        buyers: buyers.filter(Boolean).sort(),
        seasons: seasons.filter(Boolean).sort()
      }
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching filter options.",
      error: error.message
    });
  }
};

// ============================================================
// Retrieves all Yorksys orders with pagination
// ============================================================
export const getYorksysOrdersPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Allow limit to be 0 for "all records", otherwise default to 10
    let limit = parseInt(req.query.limit);
    if (isNaN(limit)) limit = 10;

    const skip = (page - 1) * limit;

    // --- Build Filter Object ---
    const filter = {};
    if (req.query.factory) filter.factory = req.query.factory;
    if (req.query.buyer) filter.buyer = req.query.buyer;
    if (req.query.season) filter.season = req.query.season;
    // Use case-insensitive regex for text searches
    if (req.query.moNo)
      filter.moNo = { $regex: new RegExp(req.query.moNo, "i") };
    if (req.query.style)
      filter.style = { $regex: new RegExp(req.query.style, "i") };

    // Fetch filtered data and total count in parallel
    let query = YorksysOrders.find(filter).sort({ createdAt: -1 });

    // Apply pagination only if limit is greater than 0
    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    const [orders, totalRecords] = await Promise.all([
      query,
      YorksysOrders.countDocuments(filter) // Count only filtered documents
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        limit: limit
      }
    });
  } catch (error) {
    console.error("Error fetching all Yorksys orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching orders.",
      error: error.message
    });
  }
};

// ============================================================
// Updates the productType for a specific Yorksys order
// ============================================================
export const updateYorksysOrderProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { productType } = req.body;

    // Validate input
    if (!productType) {
      return res.status(400).json({
        success: false,
        message: "Product type is required."
      });
    }

    const updatedOrder = await YorksysOrders.findByIdAndUpdate(
      id,
      { productType: productType },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${id} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product type for MO ${updatedOrder.moNo} updated successfully!`,
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error updating product type:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating product type.",
      error: error.message
    });
  }
};

// ============================================================
//  PREVIEWS the number of matching records for bulk update
// ============================================================
export const previewBulkUpdateProductType = async (req, res) => {
  try {
    const { moNos } = req.body;

    if (!moNos || !Array.isArray(moNos)) {
      return res.status(400).json({
        success: false,
        message: "An array of 'moNos' is required."
      });
    }

    const matchCount = await YorksysOrders.countDocuments({
      moNo: { $in: moNos }
    });

    res.status(200).json({
      success: true,
      data: {
        matchCount: matchCount
      }
    });
  } catch (error) {
    console.error("Error previewing bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during bulk update preview.",
      error: error.message
    });
  }
};

// ============================================================
//  PERFORMS a bulk update of productType from cutting data
// ============================================================
export const bulkUpdateProductTypeFromCutting = async (req, res) => {
  try {
    const cuttingData = req.body; // Expects an array of { moNo, garmentType }

    if (
      !cuttingData ||
      !Array.isArray(cuttingData) ||
      cuttingData.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A non-empty array of cutting data is required."
      });
    }

    // Create an array of bulk write operations
    const operations = cuttingData.map((item) => ({
      updateOne: {
        filter: { moNo: item.moNo },
        update: { $set: { productType: item.garmentType } }
      }
    }));

    // Execute the bulk write operation
    const result = await YorksysOrders.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Bulk update completed successfully. ${result.modifiedCount} records updated.`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error("Error performing bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during bulk update.",
      error: error.message
    });
  }
};

// ============================================================
// Updates ONLY the Rib Content for a specific Yorksys order
// ============================================================
export const updateYorksysOrderRibContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { ribContent } = req.body; // Expecting array: [{ fabricName, percentageValue }]

    // Basic Validation
    if (!Array.isArray(ribContent)) {
      return res.status(400).json({
        success: false,
        message: "Rib Content must be an array."
      });
    }

    const updatedOrder = await YorksysOrders.findByIdAndUpdate(
      id,
      { RibContent: ribContent },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${id} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Rib Content for MO ${updatedOrder.moNo} updated successfully!`,
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error updating Rib Content:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating Rib Content.",
      error: error.message
    });
  }
};
