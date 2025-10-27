import { 
  YorksysOrders,
 } from "../MongoDB/dbConnectionController.js";

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

    // ============================================================
    // 🆕 MODIFIED: Use findOneAndUpdate with upsert to replace existing record
    // ============================================================
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
    // ============================================================
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