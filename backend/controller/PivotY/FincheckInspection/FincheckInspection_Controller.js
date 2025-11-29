import {
  DtOrder,
  YorksysOrders
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// Get Order Details for Inspection (Combined from dt_orders and yorksys_orders)
// ============================================================
export const getInspectionOrderDetails = async (req, res) => {
  try {
    const { moNo } = req.params;

    if (!moNo) {
      return res.status(400).json({
        success: false,
        message: "MO Number is required."
      });
    }

    // Fetch from both collections in parallel using Mongoose models
    const [dtOrder, yorksysOrder] = await Promise.all([
      DtOrder.findOne({ Order_No: moNo }).lean(),
      YorksysOrders.findOne({ moNo: moNo }).lean()
    ]);

    if (!dtOrder) {
      return res.status(404).json({
        success: false,
        message: `Order ${moNo} not found in dt_orders.`
      });
    }

    // Process dt_orders data
    const dtOrderData = {
      orderNo: dtOrder.Order_No,
      custStyle: dtOrder.CustStyle || "N/A",
      customer: dtOrder.EngName || "N/A",
      factory: dtOrder.Factory || "N/A",
      totalQty: dtOrder.TotalQty || 0,
      origin: dtOrder.Origin || "N/A",
      mode: dtOrder.Mode || "N/A",
      salesTeamName: dtOrder.SalesTeamName || "N/A",
      country: dtOrder.Country || "N/A",
      sizeList: dtOrder.SizeList || []
    };

    // Process OrderColors for Color/Size breakdown
    const colorSizeData = [];
    const sizeSet = new Set();
    let grandTotal = 0;

    if (dtOrder.OrderColors && Array.isArray(dtOrder.OrderColors)) {
      dtOrder.OrderColors.forEach((colorObj) => {
        const colorRow = {
          color: colorObj.Color || "N/A",
          colorCode: colorObj.ColorCode || "",
          sizes: {},
          total: 0
        };

        if (colorObj.OrderQty && Array.isArray(colorObj.OrderQty)) {
          colorObj.OrderQty.forEach((qtyObj) => {
            const sizeName = Object.keys(qtyObj)[0];
            const qty = qtyObj[sizeName] || 0;

            // Clean size name (remove any suffix after ;)
            const cleanSize = sizeName.split(";")[0].trim();

            if (qty > 0) {
              sizeSet.add(cleanSize);
              colorRow.sizes[cleanSize] = qty;
              colorRow.total += qty;
            }
          });
        }

        if (colorRow.total > 0) {
          grandTotal += colorRow.total;
          colorSizeData.push(colorRow);
        }
      });
    }

    // Calculate size totals
    const sizeTotals = {};
    const sizeList = Array.from(sizeSet);

    sizeList.forEach((size) => {
      sizeTotals[size] = colorSizeData.reduce(
        (sum, row) => sum + (row.sizes[size] || 0),
        0
      );
    });

    // Process yorksys_orders data if available
    let yorksysData = null;
    if (yorksysOrder) {
      yorksysData = {
        skuDescription: yorksysOrder.skuDescription || "N/A",
        destination: yorksysOrder.destination || "N/A",
        season: yorksysOrder.season || "N/A",
        productType: yorksysOrder.productType || "N/A",
        fabricContent: yorksysOrder.FabricContent || [],
        skuData: yorksysOrder.SKUData || [],
        moSummary: yorksysOrder.MOSummary?.[0] || null
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        dtOrder: dtOrderData,
        colorSizeBreakdown: {
          sizeList: sizeList,
          colors: colorSizeData,
          sizeTotals: sizeTotals,
          grandTotal: grandTotal
        },
        yorksysOrder: yorksysData
      }
    });
  } catch (error) {
    console.error("Error fetching inspection order details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order details.",
      error: error.message
    });
  }
};

// ============================================================
// Search Orders for Inspection
// ============================================================
export const searchInspectionOrders = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 2 characters."
      });
    }

    const regexPattern = new RegExp(term, "i");

    // Use Mongoose model with lean() for better performance
    const results = await DtOrder.find({
      Order_No: { $regex: regexPattern }
    })
      .select("Order_No CustStyle EngName Factory TotalQty")
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Error searching inspection orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while searching orders.",
      error: error.message
    });
  }
};
