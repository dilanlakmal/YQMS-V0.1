import {
  DtOrder
} from "../../MongoDB/dbConnectionController.js";

export const getOrderDetails = async (req, res) => {
  try {
    const { orderNo } = req.params;

    // Find order by Order_No
    const order = await DtOrder.findOne({ Order_No: orderNo }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ensure colorBreakdown is always an array (even if empty)
    const colorBreakdown = order.OrderColors && Array.isArray(order.OrderColors)
      ? order.OrderColors.map(color => {
        const sizes = {};
        let colorTotal = 0;

        if (color.OrderQty && Array.isArray(color.OrderQty)) {
          color.OrderQty.forEach(sizeObj => {
            if (typeof sizeObj === 'object' && sizeObj !== null) {
              Object.keys(sizeObj).forEach(key => {
                const cleanKey = key.split(';')[0].trim();
                const val = Number(sizeObj[key]);
                if (!isNaN(val)) {
                  sizes[cleanKey] = val;
                  colorTotal += val;
                }
              });
            }
          });
        }

        return {
          colorCode: color.ColorCode || 'N/A',
          colorName: color.Color || 'Unknown Color',
          chineseColor: color.ChnColor || '',
          sizes: sizes,
          colorTotal: colorTotal
        };
      })
      : [];

    // Ensure sizeList is always an array (even if empty)
    const sizeList = order.SizeList && Array.isArray(order.SizeList) && order.SizeList.length > 0
      ? order.SizeList
      : ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']; // Default sizes if none found

    // Format the response data
    const orderDetails = {
      orderNo: order.Order_No,
      companyName: order.EngName || 'Yorkmars (cambodia) Garment MFG. Co. Ltd.',
      cust_Code: order.Cust_Code || 'N/A',
      customerCode: order.Cust_Code || 'N/A',
      customerStyle: order.CustStyle || 'N/A',
      totalQuantity: order.TotalQty || 0,
      orderDate: order.createdAt,
      exFactoryDate: order.updatedAt,
      customerPO: order.CustPORef || '',
      season: order.Season || '',
      countryOfOrigin: order.Origin || '',
      
      // Product details
      productDescription: order.Style || '',
      
      // Colors and sizes breakdown - ALWAYS arrays
      colorBreakdown: colorBreakdown,
      sizeList: sizeList,
      sizeSpec: order.SizeSpec || [],
      
      // Additional order information
      currency: order.Ccy || '',
      country: order.Country || '',
      factory: order.Factory || '',
      mode: order.Mode || '',
      shortName: order.ShortName || '',
      
      // Shipment information (if available)
      shipmentDetails: order.OrderColorShip ? order.OrderColorShip.map(colorShip => ({
        colorCode: colorShip.ColorCode,
        shipments: colorShip.ShipSeqNo.map(ship => ({
          seqNo: ship.seqNo,
          shipId: ship.Ship_ID,
          sizes: ship.sizes.reduce((sizeObj, size) => {
            const sizeKey = Object.keys(size)[0].split(';')[0].trim();
            const sizeValue = Object.values(size)[0];
            sizeObj[sizeKey] = sizeValue || 0;
            return sizeObj;
          }, {})
        }))
      })) : []
    };

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
    try {
    const { term } = req.query;
    
    if (!term || term.length < 2) {
      return res.json([]);
    }

    const searchPatterns = [
      { Order_No: { $regex: term, $options: 'i' } },
      { Cust_Code: { $regex: term, $options: 'i' } },
      { CustStyle: { $regex: term, $options: 'i' } }
    ];

    const orders = await DtOrder.find({
      $or: searchPatterns
    })
    .limit(10)
    .lean();

    const suggestions = orders.map(order => ({
        orderNo: order.Order_No,
        customerStyle: order.CustStyle,
        customerCode: order.Cust_Code,
        quantity: order.TotalQty,
        colors: order.OrderColors ? order.OrderColors.map(c => c.Color) : []
    }));

    res.json(suggestions);

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};