import { 
  DtOrder,
   BuyerSpecTemplate,
 } from "../MongoDB/dbConnectionController.js";

const processSpecs = (specArray, allSizes) => {
  if (!specArray || specArray.length === 0) {
    return {};
  }

  const groupedSpecs = {};

  specArray.forEach((spec) => {
    // Use 'main' for 'NA' kValue, otherwise use the kValue directly (e.g., 'K1', 'K2')
    const groupKey = spec.kValue === "NA" ? "main" : spec.kValue;

    if (!groupedSpecs[groupKey]) {
      groupedSpecs[groupKey] = [];
    }

    // Create a map of size to value for quick lookups
    const valuesMap = new Map();
    if (spec.Specs) {
      spec.Specs.forEach(s => {
        valuesMap.set(s.size, s.decimal);
      });
    }

    groupedSpecs[groupKey].push({
      point: spec.MeasurementPointEngName,
      // For each size, get the value from the map or default to "N/A"
      values: allSizes.map(size => valuesMap.get(size) || "N/A"),
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

    // Find the order in the dt_orders collection by Order_No
    const order = await DtOrder.findOne({ Order_No: styleNo }).lean();

    if (!order) {
      return res.status(404).json({ message: `No order found for Style No: ${styleNo}` });
    }

    // Extract all unique sizes from the first spec array as a reference
    const allSizes = [];
    if (order.BeforeWashSpecs && order.BeforeWashSpecs.length > 0 && order.BeforeWashSpecs[0].Specs) {
        order.BeforeWashSpecs[0].Specs.forEach(spec => {
            if (!allSizes.includes(spec.size)) {
                allSizes.push(spec.size);
            }
        });
    }

    // Process both before and after wash specs
    const beforeWashData = processSpecs(order.BeforeWashSpecs, allSizes);
    const afterWashData = processSpecs(order.AfterWashSpecs, allSizes);

    // Construct the final response object
    const responseData = {
      styleNo: order.Order_No,
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
