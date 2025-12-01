import { DtOrder } from "../../MongoDB/dbConnectionController.js";

export const searchOrderNo = async (req, res) => {
  try {
    const { term } = req.query;
    
    // UNIQUE IDENTIFIER - if you see this, the new code is loaded
    console.log('🚀 NEW MONGOOSE CODE LOADED - Version 2.0');
    
    // Add validation for search term
    if (!term || term.length < 2) {
      return res.json([]);
    }
    
    console.log('Searching for term:', term);
    console.log('DtOrder object:', DtOrder);
    
    // Check if DtOrder is properly initialized
    if (!DtOrder) {
      console.error('DtOrder is not properly initialized');
      return res.status(500).json({ 
        error: 'Database connection error',
        message: 'DtOrder model is not initialized' 
      });
    }

    let orders;
    
    try {
      console.log('🔍 Attempting MongoDB query with Mongoose...');
      
      // Improved search - works with both letters and numbers
      const searchTerm = term.trim();
      
      // Create multiple search patterns
      const searchQueries = [
        // Exact prefix match (case insensitive)
        { Order_No: { $regex: `^${searchTerm}`, $options: 'i' } },
        // Contains search (case insensitive)
        { Order_No: { $regex: searchTerm, $options: 'i' } },
        // Search in customer style as well
        { CustStyle: { $regex: searchTerm, $options: 'i' } }
      ];
      
      // Use $or to search multiple fields
      orders = await DtOrder.find({
        $or: searchQueries
      })
      .limit(10)
      .lean();
        
      console.log('✅ MongoDB query executed successfully');
      console.log('📊 Found orders count:', orders.length);
      
      // If no results with the above search, try a more flexible search
      if (orders.length === 0) {
        console.log('🔄 Trying flexible search...');
        
        // Remove special characters and search
        const cleanTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, '');
        
        orders = await DtOrder.find({
          $or: [
            { Order_No: { $regex: cleanTerm, $options: 'i' } },
            { CustStyle: { $regex: cleanTerm, $options: 'i' } },
            { Factory: { $regex: cleanTerm, $options: 'i' } }
          ]
        })
        .limit(10)
        .lean();
        
        console.log('📊 Flexible search found:', orders.length);
      }
      
    } catch (queryError) {
      console.error('❌ MongoDB query error:', queryError);
      return res.status(500).json({ 
        error: 'Database query failed',
        message: queryError.message,
        details: queryError.toString()
      });
    }

    // Check if orders exist
    if (!orders || orders.length === 0) {
      console.log('📭 No documents found');
      return res.json([]);
    }

    console.log('📋 Processing orders:', orders.length);

    const suggestions = orders.map((order, index) => {
      try {
        console.log(`📄 Document ${index}:`, {
          Order_No: order.Order_No,
          CustStyle: order.CustStyle,
          Factory: order.Factory
        });
        
        return {
          id: order._id,
          orderNo: order.Order_No,
          customerStyle: order.CustStyle,
          // orderNo: order.Order_No,
          quantity: order.TotalQty,
          colors: order.OrderColors ? order.OrderColors.map(color => color.Color) : [],
          sizes: order.SizeList || [],
          originalData: order
        };
      } catch (docError) {
        console.error(`❌ Error processing document ${index}:`, docError);
        return null;
      }
    }).filter(suggestion => suggestion !== null);

    console.log('✨ Processed suggestions:', suggestions.length);
    res.json(suggestions);

  } catch (error) {
    console.error('💥 Unexpected error in searchOrderNo:', error);
    console.error('📚 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    console.log('Fetching order details for:', orderNo);
    
    // Check if DtOrder is properly initialized
    if (!DtOrder) {
      return res.status(500).json({ 
        error: 'Database connection error',
        message: 'DtOrder model is not initialized' 
      });
    }

    let order;
    
    try {
      // Use Mongoose syntax
      order = await DtOrder.findOne({
        Order_No: orderNo.toUpperCase()
      }).lean();
      
    } catch (queryError) {
      console.error('MongoDB query error:', queryError);
      return res.status(500).json({ 
        error: 'Database query failed',
        message: queryError.message 
      });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = {
      id: order._id,
      orderNo: order.Order_No,
      customerStyle: order.CustStyle,
      // orderNo: order.Order_No,
      quantity: order.TotalQty,
      colors: order.OrderColors ? order.OrderColors.map(color => color.Color) : [],
      sizes: order.SizeList || [],
      country: order.Country,
      currency: order.Ccy,
      custCode: order.Cust_Code,
      engName: order.EngName,
      mode: order.Mode,
      origin: order.Origin,
      originalData: order
    };

    console.log('Order data found:', orderData);
    res.json(orderData);

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order details',
      message: error.message 
    });
  }
};
