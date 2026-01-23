import { DtOrder } from '../../../MongoDB/dbConnectionController.js'; 
import mongoose from 'mongoose';

// Get DT Order by Order Number
export const getDtOrderByOrderNo = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { suggest } = req.query; // New query parameter for suggestions
    
    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required'
      });
    }
    
    // If suggest=true, return suggestions instead of exact match
    if (suggest === 'true') {
      
      if (orderNo.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Query must be at least 2 characters long for suggestions'
        });
      }

      // Search for orders that match the query (case-insensitive)
      const suggestions = await DtOrder.find({
        $or: [
          { Order_No: { $regex: orderNo, $options: 'i' } },
          { Style: { $regex: orderNo, $options: 'i' } },
          { CustStyle: { $regex: orderNo, $options: 'i' } }
        ]
      })
      .select('Order_No Style CustStyle ShortName TotalQty isModify')
      .limit(10) 
      .sort({ Order_No: 1 });

      return res.status(200).json({
        success: true,
        data: suggestions,
        count: suggestions.length,
        type: 'suggestions'
      });
    }

    // Original exact match logic
    const order = await DtOrder.findOne({ Order_No: orderNo });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(200).json({
      success: true,
      data: order,
      type: 'exact_match'
    });

  } catch (error) {
    console.error('Error fetching DT order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update DT Order by ID
export const updateDtOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Extract user info from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    let userInfo = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userInfo = decoded;
        console.log('🔐 Authenticated user:', userInfo);
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
      }
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // ❌ REMOVE THIS SECTION - No need to convert again
    // Frontend already sends converted values
    /*
    if (updateData.SizeSpec && Array.isArray(updateData.SizeSpec)) {
      updateData.SizeSpec = updateData.SizeSpec.map(spec => {
        // ... conversion logic removed
      });
    }
    */

    // Set modification fields with actual user data
    updateData.isModify = true;
    updateData.modifiedAt = new Date();
    updateData.updatedAt = new Date();
    
    updateData.modifiedBy = userInfo ? 
      (userInfo.eng_name || userInfo.emp_id || userInfo.email || 'Authenticated User') : 
      (updateData.modifiedBy || 'Unknown User');

    // Add to modification history
    if (!updateData.modificationHistory) {
      updateData.modificationHistory = [];
    }
    
    updateData.modificationHistory.push({
      modifiedAt: new Date(),
      modifiedBy: updateData.modifiedBy,
      changes: updateData.changes || 'Order specifications and tolerances modified',
      userDetails: userInfo ? {
        userId: userInfo.emp_id,
        empId: userInfo.emp_id,
        engName: userInfo.eng_name,
        email: userInfo.email
      } : null
    });

    console.log('💾 Updating order with user:', updateData.modifiedBy);

    // Update the order - frontend data already has correct decimal values
    const updatedOrder = await DtOrder.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: false, 
        strict: false, 
        upsert: false 
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Order updated successfully by:', updateData.modifiedBy);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Error updating DT order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get all DT Orders (optional - for listing/searching)
export const getAllDtOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      factory = '', 
      customer = '' 
    } = req.query;

    // Build search query
    const query = {};
    
    if (search) {
      query.$or = [
        { Order_No: { $regex: search, $options: 'i' } },
        { Style: { $regex: search, $options: 'i' } },
        { CustStyle: { $regex: search, $options: 'i' } }
      ];
    }

    if (factory) {
      query.Factory = factory;
    }

    if (customer) {
      query.Cust_Code = customer;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with pagination
    const orders = await DtOrder.find(query)
      .select('Order_No Style CustStyle Factory Cust_Code ShortName TotalQty isModify createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await DtOrder.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching DT orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Validate order data before update (helper function)
export const validateOrderData = (orderData) => {
  const errors = [];

  // Validate SizeSpec structure
  if (orderData.SizeSpec) {
    orderData.SizeSpec.forEach((spec, index) => {
      if (!spec.Seq) {
        errors.push(`SizeSpec[${index}]: Seq is required`);
      }
      
      if (spec.Specs && !Array.isArray(spec.Specs)) {
        errors.push(`SizeSpec[${index}]: Specs must be an array`);
      }
    });
  }

  // Validate OrderColors structure
  if (orderData.OrderColors) {
    orderData.OrderColors.forEach((color, index) => {
      if (!color.ColorCode) {
        errors.push(`OrderColors[${index}]: ColorCode is required`);
      }
      
      if (color.OrderQty && !Array.isArray(color.OrderQty)) {
        errors.push(`OrderColors[${index}]: OrderQty must be an array`);
      }
      
      if (color.CutQty && typeof color.CutQty !== 'object') {
        errors.push(`OrderColors[${index}]: CutQty must be an object`);
      }
    });
  }

  // Validate SizeList consistency
  if (orderData.SizeList && orderData.NoOfSize) {
    if (orderData.SizeList.length !== orderData.NoOfSize) {
      errors.push('SizeList length must match NoOfSize');
    }
  }

  return errors;
};

// Backup original order before modification (optional)
export const backupOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await DtOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create backup collection name
    const backupCollectionName = `dt_orders_backup_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
    
    // Create backup document
    const backupData = {
      ...order.toObject(),
      originalId: order._id,
      backupDate: new Date(),
      backupReason: 'Pre-modification backup'
    };

    // Save to backup collection
    const BackupModel = mongoose.model('DtOrderBackup', DtOrder.schema, backupCollectionName);
    await BackupModel.create(backupData);

    res.status(200).json({
      success: true,
      message: 'Order backed up successfully'
    });

  } catch (error) {
    console.error('Error backing up order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const deleteSizeFromOrder = async (req, res) => {
  try {
    
    const { id } = req.params;
    const { sizeToDelete } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Validate size parameter
    if (!sizeToDelete || typeof sizeToDelete !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Size to delete is required and must be a string'
      });
    }

    // Find the order first
    const order = await DtOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if size exists in the order
    if (!order.SizeList || !order.SizeList.includes(sizeToDelete)) {
      return res.status(400).json({
        success: false,
        message: `Size "${sizeToDelete}" not found in this order`
      });
    }

    // Create updated data by removing the size from all relevant places
    const updatedData = { ...order.toObject() };

    // 1. Remove from SizeList
    updatedData.SizeList = order.SizeList.filter(size => size !== sizeToDelete);
    updatedData.NoOfSize = updatedData.SizeList.length;

    // 2. Remove from SizeSpec
    if (updatedData.SizeSpec && Array.isArray(updatedData.SizeSpec)) {
      updatedData.SizeSpec = updatedData.SizeSpec.map(spec => ({
        ...spec,
        Specs: spec.Specs.filter(specItem => !Object.prototype.hasOwnProperty.call(specItem, sizeToDelete))
      }));
    }

    // 3. Remove from OrderColors (OrderQty and CutQty)
    if (updatedData.OrderColors && Array.isArray(updatedData.OrderColors)) {
      updatedData.OrderColors = updatedData.OrderColors.map(color => {
        const updatedColor = { ...color };
        
        // Remove from OrderQty
        if (updatedColor.OrderQty && Array.isArray(updatedColor.OrderQty)) {
          updatedColor.OrderQty = updatedColor.OrderQty.filter(qtyItem => 
            !Object.prototype.hasOwnProperty.call(qtyItem, sizeToDelete)
          );
        }
        
        // Remove from CutQty
        if (updatedColor.CutQty && typeof updatedColor.CutQty === 'object') {
          const { [sizeToDelete]: deletedSize, ...remainingCutQty } = updatedColor.CutQty;
          updatedColor.CutQty = remainingCutQty;
        }
        
        return updatedColor;
      });
    }

    // 4. Remove from OrderColorShip
    if (updatedData.OrderColorShip && Array.isArray(updatedData.OrderColorShip)) {
      updatedData.OrderColorShip = updatedData.OrderColorShip.map(colorShip => ({
        ...colorShip,
        ShipSeqNo: colorShip.ShipSeqNo.map(shipSeq => ({
          ...shipSeq,
          sizes: shipSeq.sizes.filter(sizeItem => !Object.prototype.hasOwnProperty.call(sizeItem, sizeToDelete))
        }))
      }));
    }

    // Add modification flags
    updatedData.isModify = true;
    updatedData.updatedAt = new Date();

    // Update the order in database
    const updatedOrder = await DtOrder.findByIdAndUpdate(
      id,
      updatedData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update order after size deletion'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Size "${sizeToDelete}" deleted successfully from order`,
      data: updatedOrder,
      deletedSize: sizeToDelete,
      remainingSizes: updatedOrder.SizeList
    });

  } catch (error) {
    console.error('❌ Error deleting size from order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
