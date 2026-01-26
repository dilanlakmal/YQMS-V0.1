import {
  DtOrder
} from "../../MongoDB/dbConnectionController.js";

export const getOrderDetails = async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    console.log('Searching for order:', orderNo); // Debug log
    
    // Find order by Order_No
    const order = await DtOrder.findOne({ Order_No: orderNo });
    
    if (!order) {
      console.log('Order not found:', orderNo);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Found order:', order.Order_No);
    console.log('OrderColors:', order.OrderColors); // Debug log

    // Calculate total quantity from OrderColors with better error handling
    let totalQty = 0;
    if (order.OrderColors && Array.isArray(order.OrderColors)) {
      totalQty = order.OrderColors.reduce((total, color) => {
        if (color.OrderQty && Array.isArray(color.OrderQty)) {
          const colorTotal = color.OrderQty.reduce((colorSum, sizeObj) => {
            const sizeValue = Object.values(sizeObj)[0];
            return colorSum + (sizeValue || 0);
          }, 0);
          return total + colorTotal;
        }
        return total;
      }, 0);
    }

    console.log('Calculated total quantity:', totalQty); // Debug log

    // Format the response data
    const orderDetails = {
      orderNo: order.Order_No,
      companyName: order.EngName,
      cust_Code: order.Cust_Code, // Match your component property name
      customerCode: order.Cust_Code, // Alternative property name
      customerStyle: order.CustStyle,
      totalQuantity: totalQty, // Make sure this is always a number
      orderDate: order.createdAt,
      exFactoryDate: order.updatedAt,
      customerPO: order.CustPORef,
      season: order.Season || '',
      countryOfOrigin: order.Origin,
      
      // Product details
      productDescription: order.Style,
      
      // Colors and sizes breakdown
      colorBreakdown: order.OrderColors && Array.isArray(order.OrderColors) 
        ? order.OrderColors.map(color => ({
            colorCode: color.ColorCode,
            colorName: color.Color,
            chineseColor: color.ChnColor,
            sizes: color.OrderQty && Array.isArray(color.OrderQty) 
              ? color.OrderQty.reduce((sizeObj, size) => {
                  const sizeKey = Object.keys(size)[0];
                  const sizeValue = Object.values(size)[0];
                  sizeObj[sizeKey] = sizeValue || 0;
                  return sizeObj;
                }, {})
              : {},
            colorTotal: color.OrderQty && Array.isArray(color.OrderQty)
              ? color.OrderQty.reduce((total, sizeObj) => {
                  return total + (Object.values(sizeObj)[0] || 0);
                }, 0)
              : 0
          }))
        : [],
      
      // Size list for table headers
      sizeList: order.SizeList || ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
      
      // Additional order information
      currency: order.Ccy,
      country: order.Country,
      factory: order.Factory,
      mode: order.Mode,
      shortName: order.ShortName,
      
      // Shipment information (if available)
      shipmentDetails: order.OrderColorShip ? order.OrderColorShip.map(colorShip => ({
        colorCode: colorShip.ColorCode,
        shipments: colorShip.ShipSeqNo.map(ship => ({
          seqNo: ship.seqNo,
          shipId: ship.Ship_ID,
          sizes: ship.sizes.reduce((sizeObj, size) => {
            const sizeKey = Object.keys(size)[0];
            const sizeValue = Object.values(size)[0];
            sizeObj[sizeKey] = sizeValue || 0;
            return sizeObj;
          }, {})
        }))
      })) : []
    };

    console.log('Sending response:', orderDetails); // Debug log

    res.status(200).json({
      success: true,
      data: orderDetails
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const searchOrderSuggestions = async (req, res) => {
  console.log('✅ searchOrderSuggestions called!');
  console.log('✅ Request method:', req.method);
  console.log('✅ Request path:', req.path);
  console.log('✅ Request URL:', req.url);
  console.log('✅ Request query:', req.query);
  
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      console.log('✅ Query too short or missing:', query);
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    console.log('✅ Searching for orders with query:', query);

    // Test database connection first
    const totalCount = await DtOrder.countDocuments();
    console.log('✅ Total orders in database:', totalCount);

    // Search for orders
    const orders = await DtOrder.find({
      Order_No: { $regex: query, $options: 'i' }
    })
    .select('Order_No Cust_Code CustStyle')
    .limit(10)
    .sort({ Order_No: 1 });

    console.log('✅ Found orders count:', orders.length);
    console.log('✅ Found orders:', orders);

    const suggestions = orders.map(order => ({
      orderNo: order.Order_No,
      customerCode: order.Cust_Code,
      customerStyle: order.CustStyle
    }));

    console.log('✅ Mapped suggestions:', suggestions);

    const response = {
      success: true,
      data: suggestions
    };

    console.log('✅ Sending response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('✅ Error in searchOrderSuggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


