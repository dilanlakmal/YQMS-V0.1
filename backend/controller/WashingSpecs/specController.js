import { ymProdConnection } from "../MongoDB/dbConnectionController.js";

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