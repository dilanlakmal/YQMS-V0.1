import { 
  DtOrder,
   BuyerSpecTemplate,
 } from "../MongoDB/dbConnectionController.js";
import { getBuyerFromMoNumber } from "../../helpers/helperFunctions.js";

const processSpecs = (specArray, allSizes) => {
  if (!specArray || specArray.length === 0) {
    return {};
  }

  const groupedSpecs = {};

  specArray.forEach((spec) => {
    const groupKey = spec.kValue === "NA" ? "main" : spec.kValue;
    
    if (!groupedSpecs[groupKey]) {
      groupedSpecs[groupKey] = [];
    }

    // Create a map of size to value for quick lookups
    const valuesMap = new Map();
    if (spec.Specs && Array.isArray(spec.Specs)) {
      spec.Specs.forEach(s => {
        if (s.size && s.decimal !== null && s.decimal !== undefined) {
          valuesMap.set(s.size, s.decimal);
        }
      });
    }

    console.log(`Processing ${spec.MeasurementPointEngName}:`, {
      groupKey,
      valuesMap: Object.fromEntries(valuesMap),
      allSizes
    });

    groupedSpecs[groupKey].push({
      point: spec.MeasurementPointEngName,
      values: allSizes.map(size => {
        const value = valuesMap.get(size);
        return value !== undefined ? value : "N/A";
      }),
      tolerancePlus: spec.TolPlus ? spec.TolPlus.decimal : 0,
      toleranceMinus: spec.TolMinus ? spec.TolMinus.decimal : 0,
    });
  });

  return groupedSpecs;
};

export const getMatchingStyleNos = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(200).json([]); // Return empty array if no query
    }

    // Sanitize the query to escape special regex characters
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Remove the '^' to search anywhere in the string, not just the beginning
    const searchRegex = new RegExp(escapedQuery, "i");

    // Using an aggregation pipeline to correctly apply a limit after getting distinct values.
    const results = await DtOrder.aggregate([
      { $match: { Order_No: searchRegex } },
      { $group: { _id: "$Order_No" } },
      { $sort: { _id: 1 } },
      { $limit: 15 },
      { $project: { _id: 0, styleNo: "$_id" } },
    ]);

    const styleNos = results.map((r) => r.styleNo);
    
    res.status(200).json(styleNos);
  } catch (error) {
    console.error("Error fetching matching style numbers:", error);
    res.status(500).json({
      message:
        "An internal server error occurred while fetching style numbers.",
      error: error.message,
    });
  }
};

export const getMeasurementDataByStyle = async (req, res) => {
  try {
    const { styleNo } = req.params;

    if (!styleNo) {
      return res.status(400).json({ message: "Style No is required." });
    }

    const order = await DtOrder.findOne({ Order_No: styleNo }).lean();

    if (!order) {
      return res.status(404).json({ message: `No order found for Style No: ${styleNo}` });
    }

    // Enhanced size collection - collect from both BeforeWashSpecs and AfterWashSpecs
    const allSizesSet = new Set();
    const specsToScan = [...(order.BeforeWashSpecs || []), ...(order.AfterWashSpecs || [])];
    
    specsToScan.forEach((measurementPoint) => {
      if (measurementPoint.Specs && Array.isArray(measurementPoint.Specs)) {
        measurementPoint.Specs.forEach((spec) => {
          if (spec.size && spec.size.trim() !== '') {
            allSizesSet.add(spec.size.trim());
          }
        });
      }
    });

    // Sort sizes in logical order
    const allSizes = Array.from(allSizesSet).sort((a, b) => {
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.localeCompare(b);
      }
    });

    console.log('All sizes found:', allSizes);

    // Process both before and after wash specs
    const beforeWashData = processSpecs(order.BeforeWashSpecs, allSizes);
    const afterWashData = processSpecs(order.AfterWashSpecs, allSizes);

    console.log('Processed data:', {
      beforeWashData: Object.keys(beforeWashData),
      afterWashData: Object.keys(afterWashData),
      sampleBeforeWash: beforeWashData[Object.keys(beforeWashData)[0]]?.[0]
    });

    const responseData = {
      styleNo: order.Order_No,
      customer: getBuyerFromMoNumber(styleNo),
      custStyle: order.CustStyle || '',
      totalQty: order.TotalQty || '',
      sizes: allSizes,
      measurements: {
        beforeWash: beforeWashData,
        afterWash: afterWashData,
      },
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error fetching measurement data:", error);
    res.status(500).json({
      message: "An internal server error occurred while fetching measurement data.",
      error: error.message,
    });
  }
};

export const getTemplateByBuyer = async (req, res) => {
  try {
    const { buyerName } = req.params;

    if (!buyerName) {
      return res.status(400).json({ message: "Buyer name is required." });
    }

    const template = await  BuyerSpecTemplate.findOne({ buyer: buyerName }).lean();

    if (!template) {
      // It's not an error if a template doesn't exist, just return an empty array.
      return res.status(200).json({ measurementPoints: [] });
    }

    res.status(200).json({ measurementPoints: template.measurementPoints || [] });
  } catch (error) {
    console.error("Error fetching buyer template:", error);
    res.status(500).json({
      message: "An internal server error occurred while fetching the buyer template.",
      error: error.message,
    });
  }
};

export const getTemplateByStyleNo = async (req, res) => {
  try {
    const { styleNo } = req.params;

    if (!styleNo) {
      return res.status(400).json({ message: "Style No is required." });
    }

    // Find the template where 'moNo' matches the provided 'styleNo'
    const template = await BuyerSpecTemplate.findOne({ moNo: styleNo }).lean();

    if (!template) {
      // If no template is found for the style, it's not an error. Return an empty list.
      return res.status(200).json({ measurementPoints: [] });
    }

    // Extract the measurement point names from the template.
    // The points are in specData[0].specDetails, and we need to get the 'specName'.
    const points = template.specData?.[0]?.specDetails?.map(p => p.specName) || [];

    res.status(200).json({ measurementPoints: points });

  } catch (error) {
    console.error("Error fetching buyer template by style:", error);
    res.status(500).json({ message: "An internal server error occurred while fetching the buyer template." });
  }
};
