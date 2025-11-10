import {
 ymProdConnection,               
} from "../MongoDB/dbConnectionController.js";


// Update the MONo search endpoint to handle partial matching
export const getMoNoSearch = async (req, res) => {
    try {
        const term = req.query.term; // Changed from 'digits' to 'term'
        if (!term) {
          return res.status(400).json({ error: "Search term is required" });
        }
    
        const collection = ymProdConnection.db.collection("dt_orders");
    
        // Use a case-insensitive regex to match the term anywhere in Order_No
        const regexPattern = new RegExp(term, "i");
    
        const results = await collection
          .find({
            Order_No: { $regex: regexPattern }
          })
          .project({ Order_No: 1, _id: 0 }) // Only return Order_No field
          .limit(100) // Limit results to prevent overwhelming the UI
          .toArray();
    
        // Extract unique Order_No values
        const uniqueMONos = [...new Set(results.map((r) => r.Order_No))];
    
        res.json(uniqueMONos);
      } catch (error) {
        console.error("Error searching MONo:", error);
        res.status(500).json({ error: "Failed to search MONo" });
      }
};

// Update /api/order-details endpoint
export const getOrderDetails = async (req, res) => {
    try {
    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          colorCode: colorObj.ColorCode,
          chnColor: colorObj.ChnColor,
          colorKey: colorObj.ColorKey,
          sizes: new Map()
        });
      }

      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];
        const cleanSize = sizeName.split(";")[0].trim();

        if (quantity > 0) {
          colorMap.get(colorKey).sizes.set(cleanSize, {
            orderQty: quantity,
            planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
          });
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      factoryname: order.Factory || "N/A",
      custStyle: order.CustStyle || "N/A",
      country: order.Country || "N/A",
      colors: Array.from(colorMap.values()).map((c) => ({
        original: c.originalColor,
        code: c.colorCode,
        chn: c.chnColor,
        key: c.colorKey
      })),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = {
          sizes: Array.from(curr.sizes.keys()),
          details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
            size,
            orderQty: data.orderQty,
            planCutQty: data.planCutQty
          }))
        };
        return acc;
      }, {})
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

// Update /api/order-sizes endpoint
export const getOrderSizes = async (req, res) => {
    try {
    const collection = ymProdConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    const sizesWithDetails = colorObj.OrderQty.filter(
      (entry) => entry[Object.keys(entry)[0]] > 0
    )
      .map((entry) => {
        const sizeName = Object.keys(entry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        return {
          size: cleanSize,
          orderQty: entry[sizeName],
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

    res.json(sizesWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
};

export const saveWashingSpecs = async (req, res) => {
  const { moNo, washingSpecsData } = req.body;
  
    if (!moNo || !washingSpecsData || washingSpecsData.length === 0) {
      return res
        .status(400)
        .json({ message: "Missing MO Number or specs data." });
    }
  
    try {
     const collection = ymProdConnection.db.collection("dt_orders");
      const orderDocument = await collection.findOne({ Order_No: moNo });
      // const orderDocument = await DtOrder.findOne({ Order_No: moNo });
  
      if (!orderDocument) {
        return res.status(404).json({
          message: `Order with MO No '${moNo}' not found in dt_orders.`
        });
      }
  
      // --- DATA TRANSFORMATION LOGIC ---
  
      const afterWashSpecs = [];
      const beforeWashSpecs = [];
  
      // Process AfterWashSpecs from the first sheet
      const firstSheetData = washingSpecsData[0];
      if (firstSheetData && firstSheetData.rows) {
        firstSheetData.rows.forEach((row, rowIndex) => {
          const specsArray = [];
          firstSheetData.headers.forEach((header, headerIndex) => {
            const specData = row.specs[header.size]["After Washing"];
            if (specData) {
              specsArray.push({
                index: headerIndex + 1,
                size: header.size,
                // Save BOTH fraction and decimal for the spec value
                fraction: specData.raw,
                decimal: specData.decimal
              });
            }
          });
  
          afterWashSpecs.push({
            no: rowIndex + 1,
            kValue: "NA",
            MeasurementPointEngName: row["Measurement Point - Eng"],
            MeasurementPointChiName: row["Measurement Point - Chi"],
            // Save the full object for TolMinus and TolPlus
            TolMinus: {
              fraction: row["Tol Minus"].raw,
              decimal: row["Tol Minus"].decimal
            },
            TolPlus: {
              fraction: row["Tol Plus"].raw,
              decimal: row["Tol Plus"].decimal
            },
            Specs: specsArray
          });
        });
      }
  
      // Process BeforeWashSpecs from ALL sheets
      washingSpecsData.forEach((sheetData) => {
        if (sheetData && sheetData.rows) {
          sheetData.rows.forEach((row, rowIndex) => {
            const specsArray = [];
            sheetData.headers.forEach((header, headerIndex) => {
              const specData = row.specs[header.size]["Before Washing"];
              if (specData) {
                specsArray.push({
                  index: headerIndex + 1,
                  size: header.size,
                  // Save BOTH fraction and decimal for the spec value
                  fraction: specData.raw,
                  decimal: specData.decimal
                });
              }
            });
  
            beforeWashSpecs.push({
              no: rowIndex + 1,
              kValue: sheetData.sheetName,
              MeasurementPointEngName: row["Measurement Point - Eng"],
              MeasurementPointChiName: row["Measurement Point - Chi"],
              // Save the full object for TolMinus and TolPlus
              TolMinus: {
                fraction: row["Tol Minus"].raw,
                decimal: row["Tol Minus"].decimal
              },
              TolPlus: {
                fraction: row["Tol Plus"].raw,
                decimal: row["Tol Plus"].decimal
              },
              Specs: specsArray
            });
          });
        }
      });
  
      // --- UPDATE DATABASE ---
      const updateResult = await collection.updateOne(
        { _id: orderDocument._id },
        {
          $set: {
            AfterWashSpecs: afterWashSpecs,
            BeforeWashSpecs: beforeWashSpecs
          }
        }
      );
  
      if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
        return res
          .status(200)
          .json({ message: "Washing specs data is already up to date." });
      }
  
      res.status(200).json({
        message: `Successfully updated washing specs for MO No '${moNo}'.`
      });
    } catch (error) {
      console.error("Error saving washing specs:", error);
      res.status(500).json({
        message: "An internal server error occurred while saving the data."
      });
    }
};

