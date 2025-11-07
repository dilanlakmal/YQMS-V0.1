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

    // Get sizes from OrderColors (actual ordered sizes)
    const getSizesFromOrderColors = (orderColors) => {
      const sizesSet = new Set();
      
      if (orderColors && Array.isArray(orderColors)) {
        orderColors.forEach((color) => {
          if (color.OrderQty && Array.isArray(color.OrderQty)) {
            color.OrderQty.forEach((sizeObj) => {
              Object.keys(sizeObj).forEach((size) => {
                if (size && size.trim() !== '') {
                  sizesSet.add(size.trim());
                }
              });
            });
          }
        });
      }
      
      return Array.from(sizesSet);
    };

    // Get the actual ordered sizes
    const allSizes = getSizesFromOrderColors(order.OrderColors);

    // If no sizes found in OrderColors, fallback to original method
    if (allSizes.length === 0) {
      const getSizeOrderFromBeforeWashSpecs = (beforeWashSpecs) => {
        const sizeOrder = [];
        const sizeOrderSet = new Set();
        
        if (beforeWashSpecs && Array.isArray(beforeWashSpecs)) {
          beforeWashSpecs.forEach((measurementPoint) => {
            if (measurementPoint.Specs && Array.isArray(measurementPoint.Specs)) {
              measurementPoint.Specs.forEach((spec) => {
                if (spec.size && spec.size.trim() !== '' && !sizeOrderSet.has(spec.size.trim())) {
                  sizeOrder.push(spec.size.trim());
                  sizeOrderSet.add(spec.size.trim());
                }
              });
            }
          });
        }
        
        return sizeOrder;
      };

      allSizes.push(...getSizeOrderFromBeforeWashSpecs(order.BeforeWashSpecs));
    }

    // Process both before and after wash specs
    const beforeWashData = processSpecs(order.BeforeWashSpecs, allSizes);
    const afterWashData = processSpecs(order.AfterWashSpecs, allSizes);

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


export const getMeasurementDataByStyleV2 = async (req, res) => {
  try {
    const { styleNo } = req.params;
    const { washType } = req.query;
    
    if (!styleNo) {
      return res.status(400).json({ message: "Style No is required." });
    }

    if (!washType || !['beforeWash', 'afterWash'].includes(washType)) {
      return res.status(400).json({ message: "Valid washType (beforeWash or afterWash) is required." });
    }

    const order = await DtOrder.findOne({ Order_No: styleNo }).lean();

    if (!order) {
      return res.status(404).json({ message: `No order found for Style No: ${styleNo}` });
    }

    // Get sizes from OrderColors (actual ordered sizes)
    const getSizesFromOrderColors = (orderColors) => {
      const sizesSet = new Set();
      
      if (orderColors && Array.isArray(orderColors)) {
        orderColors.forEach((color) => {
          if (color.OrderQty && Array.isArray(color.OrderQty)) {
            color.OrderQty.forEach((sizeObj) => {
              Object.keys(sizeObj).forEach((size) => {
                if (size && size.trim() !== '') {
                  sizesSet.add(size.trim());
                }
              });
            });
          }
        });
      }
      
      return Array.from(sizesSet);
    };

    // Get the actual ordered sizes
    let allSizes = getSizesFromOrderColors(order.OrderColors);

    // If no sizes found in OrderColors, fallback to SizeSpec
    if (allSizes.length === 0) {
      const getSizeOrderFromSizeSpecs = (sizeSpecs) => {
        const sizeOrder = [];
        const sizeOrderSet = new Set();
        
        if (sizeSpecs && Array.isArray(sizeSpecs)) {
          sizeSpecs.forEach((sizeSpec) => {
            if (sizeSpec.Specs && Array.isArray(sizeSpec.Specs)) {
              sizeSpec.Specs.forEach((spec) => {
                Object.keys(spec).forEach(size => {
                  if (size && size.trim() !== '' && !sizeOrderSet.has(size.trim())) {
                    sizeOrder.push(size.trim());
                    sizeOrderSet.add(size.trim());
                  }
                });
              });
            }
          });
        }
        
        return sizeOrder;
      };

      allSizes = getSizeOrderFromSizeSpecs(order.SizeSpec);
    }

    let measurementData = {};

    if (washType === 'beforeWash') {
      measurementData = {
        beforeWash: processSpecs(order.BeforeWashSpecs, allSizes)
      };
    } else if (washType === 'afterWash') {
      measurementData = {
        afterWash: processSizeSpecs(order.SizeSpec, allSizes)
      };
    }

    const responseData = {
      styleNo: order.Order_No,
      customer: getBuyerFromMoNumber(styleNo),
      custStyle: order.CustStyle || '',
      totalQty: order.TotalQty || '',
      sizes: allSizes,
      measurements: measurementData,
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



// New function to process SizeSpec data
const processSizeSpecs = (sizeSpecArray, allSizes) => {
  if (!sizeSpecArray || sizeSpecArray.length === 0) {
    return {};
  }

  const groupedSpecs = {};

  sizeSpecArray.forEach((sizeSpec) => {
    // For SizeSpec, we'll group everything under "main" since there's no kValue
    const groupKey = "main";
    
    if (!groupedSpecs[groupKey]) {
      groupedSpecs[groupKey] = [];
    }

    // Create a map of size to value for quick lookups
    const valuesMap = new Map();
    if (sizeSpec.Specs && Array.isArray(sizeSpec.Specs)) {
      sizeSpec.Specs.forEach(spec => {
        Object.keys(spec).forEach(size => {
          if (spec[size] && spec[size].decimal !== null && spec[size].decimal !== undefined) {
            valuesMap.set(size, spec[size].decimal);
          }
        });
      });
    }

    groupedSpecs[groupKey].push({
      point: sizeSpec.EnglishRemark || sizeSpec.ChineseName || `Point ${sizeSpec.Seq}`,
      values: allSizes.map(size => {
        const value = valuesMap.get(size);
        return value !== undefined ? value : "N/A";
      }),
      tolerancePlus: sizeSpec.TolerancePlus ? sizeSpec.TolerancePlus.decimal : 0,
      toleranceMinus: sizeSpec.ToleranceMinus ? sizeSpec.ToleranceMinus.decimal : 0,
    });
  });

  return groupedSpecs;
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
