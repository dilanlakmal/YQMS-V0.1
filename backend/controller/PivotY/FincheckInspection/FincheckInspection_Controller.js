import {
  DtOrder,
  YorksysOrders,
  QASectionsAqlBuyerConfig,
  SubconSewingFactory
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// Helper: Extract base order number (common part)
// Handles patterns like: PTCOC335, PTCOC335A, PTCOC325-1, PTCOC325-2
// ============================================================
const extractBaseOrderNo = (orderNo) => {
  if (!orderNo) return "";

  // Remove trailing letters (A, B, C...) or numbers after hyphen (-1, -2...)
  // Pattern: Remove -N (dash followed by numbers) or trailing single letters
  let base = orderNo.trim();

  // First, try to remove -N pattern (e.g., PTCOC325-1 -> PTCOC325)
  base = base.replace(/-\d+$/, "");

  // Then, try to remove trailing single uppercase letter (e.g., PTCOC335A -> PTCOC335)
  // But only if the base has letters before it (avoid removing from "ABC123A" -> "ABC123")
  const trailingLetterMatch = base.match(/^(.+?)([A-Z])$/);
  if (trailingLetterMatch) {
    const potentialBase = trailingLetterMatch[1];
    // Check if the potential base ends with a digit (meaning the trailing letter is a suffix)
    if (/\d$/.test(potentialBase)) {
      base = potentialBase;
    }
  }

  return base;
};

// ============================================================
// Search Orders for Inspection (with Multi-order grouping)
// ============================================================
export const searchInspectionOrders = async (req, res) => {
  try {
    const { term, mode = "single" } = req.query;

    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 2 characters."
      });
    }

    const regexPattern = new RegExp(term, "i");

    const results = await DtOrder.find({
      Order_No: { $regex: regexPattern }
    })
      .select("Order_No CustStyle EngName Factory TotalQty")
      .limit(100)
      .lean();

    // For Multi mode, group by base order number
    if (mode === "multi") {
      const groupedOrders = {};

      results.forEach((order) => {
        const base = extractBaseOrderNo(order.Order_No);
        if (!groupedOrders[base]) {
          groupedOrders[base] = {
            baseOrderNo: base,
            orders: [],
            totalQty: 0,
            custStyle: order.CustStyle,
            engName: order.EngName,
            factory: order.Factory
          };
        }
        groupedOrders[base].orders.push(order);
        groupedOrders[base].totalQty += order.TotalQty || 0;
      });

      // Filter groups that have more than one order OR exact match
      const groupedResults = Object.values(groupedOrders)
        .filter((group) => group.orders.length >= 1)
        .map((group) => ({
          ...group,
          orderCount: group.orders.length,
          orderNos: group.orders.map((o) => o.Order_No)
        }));

      return res.status(200).json({
        success: true,
        mode: "multi",
        data: groupedResults
      });
    }

    return res.status(200).json({
      success: true,
      mode: "single",
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

// ============================================================
// Get Order Details for Single Order
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

    const sizeTotals = {};
    const sizeList = Array.from(sizeSet);

    sizeList.forEach((size) => {
      sizeTotals[size] = colorSizeData.reduce(
        (sum, row) => sum + (row.sizes[size] || 0),
        0
      );
    });

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
// Get Multiple Order Details (for Multi/Batch mode)
// ============================================================
export const getMultipleOrderDetails = async (req, res) => {
  try {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required."
      });
    }

    // Fetch all orders from both collections
    const [dtOrders, yorksysOrders] = await Promise.all([
      DtOrder.find({ Order_No: { $in: orderNos } }).lean(),
      YorksysOrders.find({ moNo: { $in: orderNos } }).lean()
    ]);

    if (dtOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found in dt_orders."
      });
    }

    // Create a map for yorksys orders
    const yorksysMap = {};
    yorksysOrders.forEach((order) => {
      yorksysMap[order.moNo] = order;
    });

    // Process combined data
    let combinedTotalQty = 0;
    const allCustStyles = new Set();
    const allCustomers = new Set();
    const allFactories = new Set();
    const allOrigins = new Set();
    const allModes = new Set();
    const allSalesTeams = new Set();
    const allCountries = new Set();

    // Yorksys combined data
    const allSkuDescriptions = new Set();
    const allDestinations = new Set();
    const allSeasons = new Set();
    const allProductTypes = new Set();
    const allFabricContents = [];

    // Per-order breakdowns
    const orderBreakdowns = [];

    dtOrders.forEach((dtOrder) => {
      const orderNo = dtOrder.Order_No;

      // Accumulate combined values
      combinedTotalQty += dtOrder.TotalQty || 0;
      if (dtOrder.CustStyle) allCustStyles.add(dtOrder.CustStyle);
      if (dtOrder.EngName) allCustomers.add(dtOrder.EngName);
      if (dtOrder.Factory) allFactories.add(dtOrder.Factory);
      if (dtOrder.Origin) allOrigins.add(dtOrder.Origin);
      if (dtOrder.Mode) allModes.add(dtOrder.Mode);
      if (dtOrder.SalesTeamName) allSalesTeams.add(dtOrder.SalesTeamName);
      if (dtOrder.Country) allCountries.add(dtOrder.Country);

      // Process Color/Size breakdown for this order
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

      const sizeTotals = {};
      const sizeList = Array.from(sizeSet);
      sizeList.forEach((size) => {
        sizeTotals[size] = colorSizeData.reduce(
          (sum, row) => sum + (row.sizes[size] || 0),
          0
        );
      });

      // Check yorksys data for this order
      const yorksysOrder = yorksysMap[orderNo];
      let yorksysData = null;

      if (yorksysOrder) {
        if (
          yorksysOrder.skuDescription &&
          yorksysOrder.skuDescription !== "N/A"
        ) {
          allSkuDescriptions.add(yorksysOrder.skuDescription);
        }
        if (yorksysOrder.destination && yorksysOrder.destination !== "N/A") {
          allDestinations.add(yorksysOrder.destination);
        }
        if (yorksysOrder.season && yorksysOrder.season !== "N/A") {
          allSeasons.add(yorksysOrder.season);
        }
        if (yorksysOrder.productType && yorksysOrder.productType !== "N/A") {
          allProductTypes.add(yorksysOrder.productType);
        }
        if (
          yorksysOrder.FabricContent &&
          yorksysOrder.FabricContent.length > 0
        ) {
          yorksysOrder.FabricContent.forEach((fc) => {
            const key = `${fc.fabricName}-${fc.percentageValue}`;
            if (
              !allFabricContents.find(
                (f) => `${f.fabricName}-${f.percentageValue}` === key
              )
            ) {
              allFabricContents.push(fc);
            }
          });
        }

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

      orderBreakdowns.push({
        orderNo: orderNo,
        totalQty: dtOrder.TotalQty || 0,
        colorSizeBreakdown: {
          sizeList: sizeList,
          colors: colorSizeData,
          sizeTotals: sizeTotals,
          grandTotal: grandTotal
        },
        yorksysOrder: yorksysData
      });
    });

    // Helper to join set values
    const joinSet = (set) => {
      const arr = Array.from(set).filter((v) => v && v !== "N/A");
      return arr.length > 0 ? arr.join(", ") : "N/A";
    };

    // Combined order info
    const combinedDtOrder = {
      orderNo: orderNos.join(", "),
      orderNos: orderNos,
      custStyle: joinSet(allCustStyles),
      customer: joinSet(allCustomers),
      factory: joinSet(allFactories),
      totalQty: combinedTotalQty,
      origin: joinSet(allOrigins),
      mode: joinSet(allModes),
      salesTeamName: joinSet(allSalesTeams),
      country: joinSet(allCountries)
    };

    // Combined yorksys info
    const combinedYorksysOrder = {
      skuDescription: joinSet(allSkuDescriptions),
      destination: joinSet(allDestinations),
      season: joinSet(allSeasons),
      productType: joinSet(allProductTypes),
      fabricContent: allFabricContents
    };

    return res.status(200).json({
      success: true,
      data: {
        dtOrder: combinedDtOrder,
        yorksysOrder: combinedYorksysOrder,
        orderBreakdowns: orderBreakdowns,
        foundOrders: dtOrders.map((o) => o.Order_No),
        missingOrders: orderNos.filter(
          (no) => !dtOrders.find((o) => o.Order_No === no)
        )
      }
    });
  } catch (error) {
    console.error("Error fetching multiple order details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order details.",
      error: error.message
    });
  }
};

// ============================================================
// Find related orders by base order number (for Multi mode)
// ============================================================
export const findRelatedOrders = async (req, res) => {
  try {
    const { baseOrderNo } = req.query;

    if (!baseOrderNo) {
      return res.status(400).json({
        success: false,
        message: "Base order number is required."
      });
    }

    // Create regex to find all related orders
    // Pattern matches: baseOrderNo, baseOrderNoA, baseOrderNo-1, etc.
    const regexPattern = new RegExp(`^${baseOrderNo}([A-Z]|-\\d+)?$`, "i");

    const relatedOrders = await DtOrder.find({
      Order_No: { $regex: regexPattern }
    })
      .select("Order_No CustStyle EngName Factory TotalQty")
      .lean();

    return res.status(200).json({
      success: true,
      baseOrderNo: baseOrderNo,
      data: relatedOrders,
      totalOrders: relatedOrders.length,
      totalQty: relatedOrders.reduce((sum, o) => sum + (o.TotalQty || 0), 0)
    });
  } catch (error) {
    console.error("Error finding related orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while finding related orders.",
      error: error.message
    });
  }
};

// ============================================================
// Get Distinct Colors for Selected Orders
// ============================================================
export const getOrderColors = async (req, res) => {
  try {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required."
      });
    }

    // Fetch all orders
    const dtOrders = await DtOrder.find({ Order_No: { $in: orderNos } })
      .select("Order_No OrderColors")
      .lean();

    if (dtOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found."
      });
    }

    // Extract distinct colors
    const colorMap = new Map();

    dtOrders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        order.OrderColors.forEach((colorObj) => {
          const colorName = colorObj.Color?.trim();
          if (colorName && !colorMap.has(colorName.toLowerCase())) {
            colorMap.set(colorName.toLowerCase(), {
              color: colorName,
              colorCode: colorObj.ColorCode || "",
              chnColor: colorObj.ChnColor || "",
              colorKey: colorObj.ColorKey || null
            });
          }
        });
      }
    });

    const distinctColors = Array.from(colorMap.values()).sort((a, b) =>
      a.color.localeCompare(b.color)
    );

    return res.status(200).json({
      success: true,
      data: distinctColors,
      totalColors: distinctColors.length,
      ordersProcessed: dtOrders.length
    });
  } catch (error) {
    console.error("Error fetching order colors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching colors.",
      error: error.message
    });
  }
};

// ============================================================
// Get AQL Config for Buyer
// ============================================================
export const getAqlConfigByBuyer = async (req, res) => {
  try {
    const { buyer } = req.query;

    if (!buyer) {
      return res.status(400).json({
        success: false,
        message: "Buyer is required."
      });
    }

    const configs = await QASectionsAqlBuyerConfig.find({
      Buyer: buyer
    }).lean();

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No AQL configuration found for buyer: ${buyer}`
      });
    }

    // Organize by status (Minor, Major, Critical)
    const organizedConfigs = {
      Minor: configs.find((c) => c.Status === "Minor") || null,
      Major: configs.find((c) => c.Status === "Major") || null,
      Critical: configs.find((c) => c.Status === "Critical") || null
    };

    return res.status(200).json({
      success: true,
      data: configs,
      organized: organizedConfigs
    });
  } catch (error) {
    console.error("Error fetching AQL config:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching AQL config.",
      error: error.message
    });
  }
};

// ============================================================
// Get Sub-Con Factories for Dropdown
// ============================================================
export const getSubConFactories = async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { factory: { $regex: search, $options: "i" } },
          { factory_second_name: { $regex: search, $options: "i" } }
        ]
      };
    }

    const factories = await SubconSewingFactory.find(query)
      .select("_id no factory factory_second_name lineList")
      .sort({ no: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: factories
    });
  } catch (error) {
    console.error("Error fetching sub-con factories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching sub-con factories.",
      error: error.message
    });
  }
};
