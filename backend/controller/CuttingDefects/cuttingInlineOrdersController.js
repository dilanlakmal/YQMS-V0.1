import { ymProdConnection } from "../MongoDB/dbConnectionController.js";
import { ObjectId } from "mongodb";

// Get cutting inline order by barcode
export const getCuttingInlineOrderByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "Barcode is required"
      });
    }

    // Try to find by both string and number barcode using $or operator
    const searchConditions = [
      { barcode: barcode }, // String search
      { barcode: parseInt(barcode) } // Number search (if barcode is numeric)
    ];
    
    // Only add number search if barcode is actually a number
    if (isNaN(barcode)) {
      searchConditions.pop(); // Remove number search if barcode is not numeric
    }
    
    // Debug: Let's also try a direct number search first
    let order = await ymProdConnection.db.collection('cutting_inline_orders').findOne({ barcode: parseInt(barcode) });
    
    // If not found as number, try the $or approach
    if (!order) {
      order = await ymProdConnection.db.collection('cutting_inline_orders').findOne({
        $or: searchConditions
      });
    }
    
    // Debug: Log the search and result
    console.log(`🔍 Searching for barcode: ${barcode} (type: ${typeof barcode})`);
    console.log(`📊 Search conditions:`, searchConditions);
    console.log(`📊 Found order:`, order ? 'Yes' : 'No');
    if (order) {
      console.log(`📋 Order details:`, {
        _id: order._id,
        barcode: order.barcode,
        barcodeType: typeof order.barcode,
        buyer: order.buyer,
        styleNo: order.styleNo
      });
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found with the provided barcode"
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: "Order found successfully"
    });

  } catch (error) {
    console.error("Error fetching cutting inline order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all cutting inline orders
export const getAllCuttingInlineOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, buyer, styleNo } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (buyer) filter.buyer = { $regex: buyer, $options: 'i' };
    if (styleNo) filter.styleNo = { $regex: styleNo, $options: 'i' };

    const orders = await ymProdConnection.db.collection('cutting_inline_orders')
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ _id: 1 })
      .toArray();
    
    // Debug: Log sample data structure
    if (orders.length > 0) {
      console.log(`📊 Sample order structure:`, {
        _id: orders[0]._id,
        barcode: orders[0].barcode,
        barcodeType: typeof orders[0].barcode,
        buyer: orders[0].buyer,
        styleNo: orders[0].styleNo
      });
    }

    const total = await ymProdConnection.db.collection('cutting_inline_orders').countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      message: "Orders retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching cutting inline orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Create a new cutting inline order
export const createCuttingInlineOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Check if barcode already exists
    const existingOrder = await ymProdConnection.db.collection('cutting_inline_orders').findOne({ barcode: orderData.barcode });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Order with this barcode already exists"
      });
    }

    const savedOrder = await ymProdConnection.db.collection('cutting_inline_orders').insertOne(orderData);

    res.status(201).json({
      success: true,
      data: savedOrder,
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Error creating cutting inline order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update cutting inline order
export const updateCuttingInlineOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedOrder = await ymProdConnection.db.collection('cutting_inline_orders').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Order updated successfully"
    });

  } catch (error) {
    console.error("Error updating cutting inline order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete cutting inline order
export const deleteCuttingInlineOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await ymProdConnection.db.collection('cutting_inline_orders').findOneAndDelete({ _id: new ObjectId(id) });

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting cutting inline order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Debug endpoint to check database and collections
export const debugDatabase = async (req, res) => {
  try {
    // List all collections
    const collections = await ymProdConnection.db.listCollections().toArray();
    
    // Get sample data from multiple related collections
    const relatedCollections = ['cutting_inline_orders', 'inlineorders', 'cuttingorders'];
    const collectionData = {};
    
    for (const collectionName of relatedCollections) {
      try {
        const totalCount = await ymProdConnection.db.collection(collectionName).countDocuments();
        const sampleData = await ymProdConnection.db.collection(collectionName).findOne();
        collectionData[collectionName] = {
          exists: true,
          totalCount: totalCount,
          sampleData: sampleData
        };
      } catch (error) {
        collectionData[collectionName] = {
          exists: false,
          error: error.message
        };
      }
    }

    res.status(200).json({
      success: true,
      debug: {
        database: ymProdConnection.name,
        collections: collections.map(col => col.name),
        relatedCollections: collectionData
      }
    });

  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Debug error",
      error: error.message
    });
  }
};
