import {
  DtOrder,
  YorksysOrders,
  QASectionsAqlBuyerConfig,
  SubconSewingFactory,
  QASectionsProductType,
  FincheckInspectionReports
} from "../../MongoDB/dbConnectionController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

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

// ============================================================
// NEW: Get Product Type Info for Orders
// ============================================================
export const getOrderProductTypeInfo = async (req, res) => {
  try {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required."
      });
    }

    // Fetch yorksys orders for the given order numbers
    const yorksysOrders = await YorksysOrders.find({ moNo: { $in: orderNos } })
      .select("moNo productType")
      .lean();

    if (yorksysOrders.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          productType: null,
          imageURL: null,
          hasProductType: false
        }
      });
    }

    // Get product types from the orders
    const productTypes = yorksysOrders
      .map((order) => order.productType)
      .filter((pt) => pt && pt.trim() !== "" && pt !== "N/A");

    // If no product type found
    if (productTypes.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          productType: null,
          imageURL: null,
          hasProductType: false
        }
      });
    }

    // Use the first product type
    const productTypeName = productTypes[0];

    // Find the matching product type in qa_sections_product_type
    const productTypeDoc = await QASectionsProductType.findOne({
      EnglishProductName: { $regex: new RegExp(`^${productTypeName}$`, "i") }
    }).lean();

    return res.status(200).json({
      success: true,
      data: {
        productType: productTypeName,
        imageURL: productTypeDoc?.imageURL || null,
        hasProductType: true,
        productTypeId: productTypeDoc?._id || null,
        productTypeDetails: productTypeDoc || null
      }
    });
  } catch (error) {
    console.error("Error fetching order product type info:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product type info.",
      error: error.message
    });
  }
};

// ============================================================
// NEW: Get All Product Type Options for Dropdown
// ============================================================
export const getProductTypeOptions = async (req, res) => {
  try {
    const productTypes = await QASectionsProductType.find()
      .select(
        "_id no EnglishProductName KhmerProductName ChineseProductName imageURL"
      )
      .sort({ no: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: productTypes
    });
  } catch (error) {
    console.error("Error fetching product type options:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product type options.",
      error: error.message
    });
  }
};

// ============================================================
// NEW: Update Product Type for Order(s)
// ============================================================
export const updateOrderProductType = async (req, res) => {
  try {
    const { orderNos, productType } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required."
      });
    }

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: "Product type is required."
      });
    }

    // Update all matching orders in yorksys_orders
    const result = await YorksysOrders.updateMany(
      { moNo: { $in: orderNos } },
      { $set: { productType: productType } }
    );

    // Get the product type image
    const productTypeDoc = await QASectionsProductType.findOne({
      EnglishProductName: { $regex: new RegExp(`^${productType}$`, "i") }
    }).lean();

    return res.status(200).json({
      success: true,
      message: `Product type updated for ${result.modifiedCount} order(s).`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        productType: productType,
        imageURL: productTypeDoc?.imageURL || null
      }
    });
  } catch (error) {
    console.error("Error updating order product type:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating product type.",
      error: error.message
    });
  }
};

// Helper to safely parse numbers
const parseNullableInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

const parseIntWithDefault = (value, defaultVal = 0) => {
  if (value === undefined || value === null || value === "") return defaultVal;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

// MODIFIED: Returns a Number type
const generateReportId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000);
};

export const createInspectionReport = async (req, res) => {
  try {
    const {
      inspectionDate,
      inspectionType,
      orderNos,
      orderType,
      empId,
      empName,
      inspectionDetails
    } = req.body;

    if (
      !inspectionDate ||
      !inspectionType ||
      !orderNos ||
      !empId ||
      !inspectionDetails
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const sortedOrderNos = [...orderNos].sort();
    const orderNosString = sortedOrderNos.join(", ");

    // --- MODIFIED: AQL Logic to match new Schema ---
    let processedAqlConfig = {};
    if (inspectionDetails.method === "AQL" && inspectionDetails.aqlConfig) {
      const src = inspectionDetails.aqlConfig;
      processedAqlConfig = {
        inspectionType: src.inspectionType || "",
        level: src.level || "",
        // Save floats
        minorAQL: parseFloat(src.minorAQL) || 0,
        majorAQL: parseFloat(src.majorAQL) || 0,
        criticalAQL: parseFloat(src.criticalAQL) || 0,

        inspectedQty: parseIntWithDefault(src.inspectedQty, 0),
        batch: src.batch || "",
        sampleLetter: src.sampleLetter || "",
        sampleSize: parseIntWithDefault(src.sampleSize, 0),

        // Map Items
        items: Array.isArray(src.items)
          ? src.items.map((item) => ({
              status: item.status,
              ac: parseIntWithDefault(item.ac, 0),
              re: parseIntWithDefault(item.re, 0)
            }))
          : []
      };
    }
    const processedProductionStatus =
      inspectionDetails.qualityPlanEnabled && inspectionDetails.productionStatus
        ? inspectionDetails.productionStatus
        : {};

    const processedPackingList =
      inspectionDetails.qualityPlanEnabled && inspectionDetails.packingList
        ? inspectionDetails.packingList
        : {};

    const updateData = {
      inspectionDate: new Date(inspectionDate),
      inspectionType,
      orderNos: sortedOrderNos,
      orderNosString,
      orderType,
      buyer: inspectionDetails.buyer,
      productType: inspectionDetails.productType,
      productTypeId: inspectionDetails.productTypeId,
      reportType: inspectionDetails.reportTypeName,
      reportTypeId: inspectionDetails.reportTypeId,
      empId,
      empName,
      measurementMethod: inspectionDetails.measurement || "N/A",
      inspectionMethod: inspectionDetails.method || "N/A",

      inspectionDetails: {
        supplier: inspectionDetails.supplier || "",
        isSubCon: inspectionDetails.isSubCon || false,
        subConFactory: inspectionDetails.subConFactory || "",
        subConFactoryId: inspectionDetails.subConFactoryId || null,
        factory: inspectionDetails.factory || "",
        shippingStage: inspectionDetails.shippingStage || "",
        remarks: inspectionDetails.remarks || "",
        custStyle: inspectionDetails.custStyle || "",
        customer: inspectionDetails.customer || "",
        buyerCode: inspectionDetails.buyerCode || "",

        inspectedQty: parseNullableInt(inspectionDetails.inspectedQty),
        cartonQty: parseNullableInt(inspectionDetails.cartonQty),

        aqlSampleSize: parseIntWithDefault(inspectionDetails.aqlSampleSize, 0),
        totalOrderQty: parseIntWithDefault(inspectionDetails.totalOrderQty, 0),

        aqlConfig: processedAqlConfig,
        productionStatus: processedProductionStatus,
        packingList: processedPackingList,
        qualityPlanEnabled: inspectionDetails.qualityPlanEnabled || false
      }
    };

    const filter = {
      inspectionDate: new Date(inspectionDate),
      inspectionType: inspectionType,
      orderNos: sortedOrderNos,
      reportTypeId: inspectionDetails.reportTypeId,
      productTypeId: inspectionDetails.productTypeId,
      empId: empId
    };

    const report = await FincheckInspectionReports.findOneAndUpdate(
      filter,
      {
        $set: updateData,
        $setOnInsert: {
          reportId: generateReportId(), // Generates Number
          status: "draft"
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const isNew = report.createdAt.getTime() === report.updatedAt.getTime();
    const message = isNew
      ? "Inspection report created successfully."
      : "Existing report updated successfully.";

    return res.status(200).json({
      success: true,
      message: message,
      isNew: isNew,
      data: report
    });
  } catch (error) {
    console.error("Error saving inspection report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while saving report.",
      error: error.message
    });
  }
};

// ============================================================
// Get Inspection Report by ID
// ============================================================
export const getInspectionReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await FincheckInspectionReports.findOne({ reportId }).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};

// ============================================================
// Check Existing Report (Matches Unique Index Logic)
// ============================================================
export const checkExistingReport = async (req, res) => {
  try {
    const {
      inspectionDate,
      inspectionType,
      orderNos,
      empId,
      productTypeId,
      reportTypeId
    } = req.body;

    // Validate required fields for uniqueness check
    if (
      !inspectionDate ||
      !inspectionType ||
      !orderNos ||
      !empId ||
      !productTypeId ||
      !reportTypeId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters for existence check."
      });
    }

    const sortedOrderNos = [...orderNos].sort();

    const existingReport = await FincheckInspectionReports.findOne({
      inspectionDate: new Date(inspectionDate),
      inspectionType: inspectionType,
      orderNos: sortedOrderNos,
      productTypeId: productTypeId,
      reportTypeId: reportTypeId,
      empId: empId
    }).lean();

    return res.status(200).json({
      success: true,
      exists: !!existingReport,
      data: existingReport || null
    });
  } catch (error) {
    console.error("Error checking existing report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};

// Define Storage Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirHeader = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/HeaderData"
);

// Ensure directory exists
if (!fs.existsSync(uploadDirHeader)) {
  fs.mkdirSync(uploadDirHeader, { recursive: true });
}

// Helper: Save Base64 Image to Disk
const saveBase64Image = (base64String, reportId, sectionId, index) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    // Create unique filename
    const filename = `header_${reportId}_${sectionId}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirHeader, filename);

    fs.writeFileSync(filepath, data);

    // Return relative URL for frontend access
    return `/storage/PivotY/Fincheck/HeaderData/${filename}`;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    return null;
  }
};

// ============================================================
// Update Header Data (Selections, Remarks, Images)
// ============================================================
export const updateHeaderData = async (req, res) => {
  try {
    const { reportId, headerData } = req.body;

    if (!reportId || !headerData || !Array.isArray(headerData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    const processedHeaderData = headerData.map((section) => {
      const processedImages = (section.images || [])
        .map((img, idx) => {
          let finalUrl = img.imageURL;

          if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
            const savedPath = saveBase64Image(
              img.imgSrc,
              reportId,
              section.headerId,
              idx
            );
            if (savedPath) finalUrl = savedPath;
          }

          return {
            // FIX: Ensure imageId exists. Use provided ID or generate fallback.
            imageId:
              img.id ||
              img.imageId ||
              `${section.headerId}_${idx}_${Date.now()}`,
            imageURL: finalUrl
          };
        })
        .filter((img) => img.imageURL);

      return {
        headerId: section.headerId,
        name: section.name,
        selectedOption: section.selectedOption,
        remarks: section.remarks,
        images: processedImages
      };
    });

    report.headerData = processedHeaderData;
    await report.save(); // Mongoose validation will now pass because imageId is guaranteed

    return res.status(200).json({
      success: true,
      message: "Header data saved successfully.",
      data: report.headerData
    });
  } catch (error) {
    console.error("Error updating header data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};

// Define Photo Storage Path
const uploadDirPhoto = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/PhotoData"
);

// Ensure directory exists
if (!fs.existsSync(uploadDirPhoto)) {
  fs.mkdirSync(uploadDirPhoto, { recursive: true });
}

// Helper: Save Photo Base64 Image to Disk
const savePhotoBase64Image = (
  base64String,
  reportId,
  sectionId,
  itemNo,
  index
) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    // Create unique filename
    const filename = `photo_${reportId}_${sectionId}_${itemNo}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirPhoto, filename);

    fs.writeFileSync(filepath, data);

    // Return relative URL
    return `/storage/PivotY/Fincheck/PhotoData/${filename}`;
  } catch (error) {
    console.error("Error saving photo base64 image:", error);
    return null;
  }
};

// ============================================================
// Update Photo Data (Images, Remarks)
// ============================================================
export const updatePhotoData = async (req, res) => {
  try {
    const { reportId, photoData } = req.body;

    if (!reportId || !photoData || !Array.isArray(photoData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Process nested structure: Sections -> Items -> Images
    const processedPhotoData = photoData.map((section) => {
      const processedItems = (section.items || []).map((item) => {
        const processedImages = (item.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;

            // If it's a new Base64 image, save it
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = savePhotoBase64Image(
                img.imgSrc,
                reportId,
                section.sectionId,
                item.itemNo,
                idx
              );
              if (savedPath) finalUrl = savedPath;
            }

            return {
              imageId:
                img.id ||
                `${section.sectionId}_${item.itemNo}_${idx}_${Date.now()}`,
              imageURL: finalUrl
            };
          })
          .filter((img) => img.imageURL); // Remove invalid images

        return {
          itemNo: item.itemNo,
          itemName: item.itemName,
          remarks: item.remarks,
          images: processedImages
        };
      });

      return {
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        items: processedItems
      };
    });

    report.photoData = processedPhotoData;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Photo data saved successfully.",
      data: report.photoData
    });
  } catch (error) {
    console.error("Error updating photo data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};

// ============================================================
// Update Inspection Configuration (Info Tab)
// ============================================================
export const updateInspectionConfig = async (req, res) => {
  try {
    const { reportId, configData } = req.body;

    if (!reportId || !configData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Construct the object based on schema
    const newConfigItem = {
      reportName: configData.reportName,
      inspectionMethod: configData.inspectionMethod,
      sampleSize: configData.sampleSize,
      configGroups: configData.configGroups, // The updated list
      updatedAt: new Date()
    };

    // 1. Assign the new object
    report.inspectionConfig = newConfigItem;

    // 2. Force Mongoose to acknowledge the change
    // This ensures deletions in the Mixed array are persisted
    report.markModified("inspectionConfig");

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Inspection configuration saved successfully.",
      data: report.inspectionConfig
    });
  } catch (error) {
    console.error("Error updating inspection config:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};

// ============================================================
// Update Measurement Data
// ============================================================

// Define Path
const uploadDirMeasManual = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/MeasurementManual"
);

if (!fs.existsSync(uploadDirMeasManual)) {
  fs.mkdirSync(uploadDirMeasManual, { recursive: true });
}

// Helper Function
const saveMeasManualBase64Image = (base64String, reportId, groupId, index) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    const filename = `meas_man_${reportId}_${groupId}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirMeasManual, filename);

    fs.writeFileSync(filepath, data);
    return `/storage/PivotY/Fincheck/MeasurementManual/${filename}`;
  } catch (error) {
    console.error("Error saving Measurement Manual image:", error);
    return null;
  }
};

export const updateMeasurementData = async (req, res) => {
  try {
    const { reportId, measurementData } = req.body;

    if (!reportId || !measurementData || !Array.isArray(measurementData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Process the incoming array. If an item has manualData with images, process them.
    const processedMeasurementData = measurementData.map((item) => {
      let processedManualData = null;

      if (item.manualData) {
        // Handle Images in Manual Data
        const processedImages = (item.manualData.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;

            // Check if Base64 (New Image)
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = saveMeasManualBase64Image(
                img.imgSrc,
                reportId,
                item.groupId, // Use Group ID for uniqueness scope
                idx
              );
              if (savedPath) finalUrl = savedPath;
            }

            return {
              imageId:
                img.id ||
                img.imageId ||
                `mm_${item.groupId}_${idx}_${Date.now()}`,
              imageURL: finalUrl,
              remark: img.remark || "" // Persist the image remark
            };
          })
          .filter((img) => img.imageURL); // Remove failed saves

        processedManualData = {
          remarks: item.manualData.remarks || "",
          status: item.manualData.status || "Pass",
          images: processedImages
        };
      }

      return {
        ...item,
        manualData: processedManualData
      };
    });

    // Replace existing data
    report.measurementData = processedMeasurementData;

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Measurement data saved successfully.",
      data: report.measurementData
    });
  } catch (error) {
    console.error("Error updating measurement data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};

// ============================================================
// Update Defect Data
// ============================================================

// Define Defect Storage Path
const uploadDirDefect = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/DefectData"
);

// Define Manual Defect Storage Path
const uploadDirDefectManual = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/DefectManualData"
);

// Ensure directory exists
if (!fs.existsSync(uploadDirDefect)) {
  fs.mkdirSync(uploadDirDefect, { recursive: true });
}

if (!fs.existsSync(uploadDirDefectManual))
  fs.mkdirSync(uploadDirDefectManual, { recursive: true });

// Helper: Save Defect Base64 Image
const saveDefectBase64Image = (base64String, reportId, defectCode, index) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    // Create unique filename
    const filename = `defect_${reportId}_${defectCode}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirDefect, filename);

    fs.writeFileSync(filepath, data);

    // Return relative URL
    return `/storage/PivotY/Fincheck/DefectData/${filename}`;
  } catch (error) {
    console.error("Error saving defect base64 image:", error);
    return null;
  }
};

// Helper: Save Defect LOCATION Image
const saveDefectLocationBase64Image = (
  base64String,
  reportId,
  defectCode,
  locationId,
  index
) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    // Naming: def_loc_{reportId}_{defectCode}_{locationId}_{index}_{timestamp}
    const filename = `def_loc_${reportId}_${defectCode}_${locationId}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirDefect, filename);
    fs.writeFileSync(filepath, data);
    return `/storage/PivotY/Fincheck/DefectData/${filename}`;
  } catch (error) {
    console.error("Error saving defect location image:", error);
    return null;
  }
};

// Helper: Save Defect MANUAL Image
const saveDefectManualBase64Image = (
  base64String,
  reportId,
  groupId,
  index
) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    const filename = `def_man_${reportId}_${groupId}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirDefectManual, filename);
    fs.writeFileSync(filepath, data);
    return `/storage/PivotY/Fincheck/DefectManualData/${filename}`;
  } catch (error) {
    console.error("Error saving defect manual image:", error);
    return null;
  }
};

export const updateDefectData = async (req, res) => {
  try {
    const { reportId, defectData, defectManualData } = req.body;

    if (!reportId)
      return res
        .status(400)
        .json({ success: false, message: "Report ID required." });

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });

    // A. Process Standard Defects
    if (Array.isArray(defectData)) {
      const processedDefectData = defectData.map((defect) => {
        // 1. Process Locations (and their images)
        const processedLocations = (defect.locations || []).map((loc) => {
          const processedLocImages = (loc.images || [])
            .map((img, idx) => {
              let finalUrl = img.imageURL;
              if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
                const savedPath = saveDefectLocationBase64Image(
                  img.imgSrc,
                  reportId,
                  defect.defectCode,
                  loc.locationId,
                  idx
                );
                if (savedPath) finalUrl = savedPath;
              }
              // Determine name (Pcs1, Pcs2, Extra...)
              // Logic: if index < qty, it is Pcs{index+1}, else Extra
              const name = idx < loc.qty ? `Pcs${idx + 1}` : "Extra";

              return {
                imageId: img.id || `${loc.locationId}_${idx}_${Date.now()}`,
                imageURL: finalUrl,
                name: name
              };
            })
            .filter((img) => img.imageURL);

          return {
            ...loc,
            images: processedLocImages
          };
        });

        // 2. Process General Defect Images (Legacy or top-level)
        const processedGeneralImages = (defect.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = saveDefectBase64Image(
                img.imgSrc,
                reportId,
                defect.defectCode,
                idx
              );
              if (savedPath) finalUrl = savedPath;
            }
            return {
              imageId: img.id || `${defect.defectCode}_${idx}_${Date.now()}`,
              imageURL: finalUrl
            };
          })
          .filter((img) => img.imageURL);

        return {
          ...defect,
          locations: processedLocations,
          images: processedGeneralImages,
          additionalRemark: defect.additionalRemark || ""
        };
      });
      report.defectData = processedDefectData;
    }

    // B. Process Manual Defect Data
    if (Array.isArray(defectManualData)) {
      const processedManualData = defectManualData.map((manualItem) => {
        const processedImages = (manualItem.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = saveDefectManualBase64Image(
                img.imgSrc,
                reportId,
                manualItem.groupId,
                idx
              );
              if (savedPath) finalUrl = savedPath;
            }
            return {
              imageId:
                img.id ||
                img.imageId ||
                `dm_${manualItem.groupId}_${idx}_${Date.now()}`,
              imageURL: finalUrl,
              remark: img.remark || ""
            };
          })
          .filter((img) => img.imageURL);

        return {
          groupId: manualItem.groupId,
          remarks: manualItem.remarks || "",
          images: processedImages,
          // Add context fields if provided by frontend
          line: manualItem.line || "",
          table: manualItem.table || "",
          color: manualItem.color || "",
          qcUser: manualItem.qcUser || null
        };
      });
      report.defectManualData = processedManualData;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Defect data saved successfully.",
      data: {
        defectData: report.defectData,
        defectManualData: report.defectManualData
      }
    });
  } catch (error) {
    console.error("Error updating defect data:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal Error",
        error: error.message
      });
  }
};

// ============================================================
// Update PP Sheet Data
// ============================================================

// Define PP Sheet Storage Path
const uploadDirPPSheet = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/PPSheetData"
);

// Ensure directory exists
if (!fs.existsSync(uploadDirPPSheet)) {
  fs.mkdirSync(uploadDirPPSheet, { recursive: true });
}

// Helper: Save PP Sheet Base64 Image
const savePPSheetBase64Image = (base64String, reportId, index) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    // Create unique filename
    const filename = `ppsheet_${reportId}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirPPSheet, filename);

    fs.writeFileSync(filepath, data);

    // Return relative URL
    return `/storage/PivotY/Fincheck/PPSheetData/${filename}`;
  } catch (error) {
    console.error("Error saving PP Sheet base64 image:", error);
    return null;
  }
};

export const updatePPSheetData = async (req, res) => {
  try {
    const { reportId, ppSheetData } = req.body;

    if (!reportId || !ppSheetData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId)
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Process Images
    const processedImages = (ppSheetData.images || [])
      .map((img, idx) => {
        let finalUrl = img.imageURL;

        // If new Base64 image, save to disk
        if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
          const savedPath = savePPSheetBase64Image(img.imgSrc, reportId, idx);
          if (savedPath) finalUrl = savedPath;
        }

        return {
          imageId: img.id || `pp_${idx}_${Date.now()}`,
          imageURL: finalUrl
        };
      })
      .filter((img) => img.imageURL); // Remove failed saves

    // Construct the final object
    const finalData = {
      ...ppSheetData,
      images: processedImages,
      timestamp: new Date()
    };

    report.ppSheetData = finalData;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "PP Sheet data saved successfully.",
      data: report.ppSheetData
    });
  } catch (error) {
    console.error("Error updating PP Sheet data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message
    });
  }
};
