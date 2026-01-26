import {
  DtOrder
} from "../../MongoDB/dbConnectionController.js";

export const getOrderDetails = async (req, res) => {
  try {
    const { orderNo } = req.params;
    console.log('Fetching details for:', orderNo);

    const order = await DtOrder.findOne({ Order_No: orderNo }).lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: `Order ${orderNo} not found in database` 
      });
    }

    // Process colorBreakdown: Convert Array of Objects to a Flat Object for each color
    const colorBreakdown = (order.OrderColors || []).map(color => {
      const sizes = {};
      let colorTotal = 0;
      
      if (Array.isArray(color.OrderQty)) {
        color.OrderQty.forEach(sizeObj => {
          // sizeObj is like { "XXS": 76 }
          Object.keys(sizeObj).forEach(key => {
            const cleanKey = key.split(';')[0].trim();
            const val = Number(sizeObj[key]);
            if (!isNaN(val)) {
              sizes[cleanKey] = (sizes[cleanKey] || 0) + val;
              colorTotal += val;
            }
          });
        });
      }

      return {
        ColorCode: color.ColorCode || 'N/A',
        colorName: color.Color || 'Unknown',
        chineseColor: color.ChnColor || '',
        sizes: sizes, // Now looks like { "XXS": 76, "XS": 368 ... }
        colorTotal: colorTotal
      };
    });

    // Map the database fields to the frontend-friendly names
    const orderDetails = {
      orderNo: order.Order_No,
      companyName: order.EngName || 'Yorkmars (cambodia) Garment MFG. Co. Ltd.',
      cust_Code: order.Cust_Code,
      customerCode: order.Cust_Code,
      customerStyle: order.CustStyle,
      totalQuantity: order.TotalQty || 0,
      orderDate: order.createdAt,
      exFactoryDate: order.updatedAt,
      customerPO: order.CustPORef || '',
      season: order.Season || '',
      countryOfOrigin: order.Origin || '',
      productDescription: order.Style || '',
      colorBreakdown: colorBreakdown,
      sizeList: order.SizeList || ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
      currency: order.Ccy || '',
      country: order.Country || '',
      factory: order.Factory || '',
      mode: order.Mode || '',
      shortName: order.ShortName || ''
    };

    return res.status(200).json({ success: true, data: orderDetails });

  } catch (error) {
    console.error('Controller Error:', error);
    return res.status(500).json({ success: false, message: error.message });
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

    const suggestions = orders.map(order => {
      let calculatedQty = 0;
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        order.OrderColors.forEach(color => {
          if (color.OrderQty && Array.isArray(color.OrderQty)) {
            color.OrderQty.forEach(sizeObj => {
              if (typeof sizeObj === 'object' && sizeObj !== null) {
                Object.keys(sizeObj).forEach(key => {
                  const val = Number(sizeObj[key]);
                  if (!isNaN(val)) {
                    calculatedQty += val;
                  }
                });
              }
            });
          }
        });
      }

      return {
        orderNo: order.Order_No,
        customerStyle: order.CustStyle,
        customerCode: order.Cust_Code,
        quantity: calculatedQty > 0 ? calculatedQty : (order.TotalQty || 0),
        colors: order.OrderColors ? order.OrderColors.map(c => c.Color) : []
      };
    });

    res.json(suggestions);

  } catch (error) {
    console.error('Error fetching order suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
