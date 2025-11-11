import {
  QC1Sunrise,              
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

// Endpoint to fetch filtered QC1 Sunrise data for the dashboard
export const fetchFilteredQC1SunriseData = async (req, res) => {
    try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    // Build the match stage for the aggregation pipeline
    const matchStage = {};

    // Other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) {
      matchStage["DefectArray.defectName"] = defectName;
    }

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Add a new field with the converted date
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
                "-",
                { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
                "-",
                { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate); // startDate is in YYYY-MM-DD
      const end = new Date(endDate); // endDate is in YYYY-MM-DD

      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          },
          ...matchStage // Include other filters
        }
      });
    } else {
      // If no date range, just apply other filters
      pipeline.push({
        $match: matchStage
      });
    }

    // Stage 3: Filter DefectArray to only include the selected defectName (if provided)
    if (defectName) {
      pipeline.push({
        $addFields: {
          DefectArray: {
            $filter: {
              input: "$DefectArray",
              as: "defect",
              cond: { $eq: ["$$defect.defectName", defectName] }
            }
          }
        }
      });

      // Stage 4: Recalculate totalDefectsQty based on the filtered DefectArray
      pipeline.push({
        $addFields: {
          totalDefectsQty: {
            $sum: "$DefectArray.defectQty"
          }
        }
      });
    }

    // Stage 5: Sort by lineNo
    pipeline.push({
      $sort: { lineNo: 1 } // Sort by Line No (1 to 30)
    });

    // Fetch data from MongoDB using aggregation
    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Transform the inspectionDate to DD/MM/YYYY format for display
    const transformedData = data.map((item) => {
      const [month, day, year] = item.inspectionDate.split("-");
      return {
        ...item,
        inspectionDate: `${day}/${month}/${year}` // Convert to DD/MM/YYYY
      };
    });

    res.json(transformedData);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise data:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise data",
      error: err.message
    });
  }
};

// Endpoint to fetch unique filter values with cross-filtering
export const fetchUniqueFilterValues = async (req, res) => {
    try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    // Build the match stage for the aggregation pipeline
    const matchStage = {};

    // Apply other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Add a new field with the converted date
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
                "-",
                { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
                "-",
                { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate); // startDate is in YYYY-MM-DD
      const end = new Date(endDate); // endDate is in YYYY-MM-DD

      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          },
          ...matchStage // Include other filters
        }
      });
    } else {
      // If no date range, just apply other filters
      pipeline.push({
        $match: matchStage
      });
    }

    // Fetch unique values for each filter using aggregation
    const [
      uniqueLineNos,
      uniqueMONos,
      uniqueColors,
      uniqueSizes,
      uniqueBuyers,
      uniqueDefectNames
    ] = await Promise.all([
      QC1Sunrise.aggregate([
        ...pipeline,
        { $group: { _id: "$lineNo" } }
      ]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$MONo" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Color" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Size" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Buyer" } }]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $unwind: "$DefectArray" },
        { $group: { _id: "$DefectArray.defectName" } }
      ]).exec()
    ]);

    res.json({
      lineNos: uniqueLineNos
        .map((item) => item._id)
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b)), // Sort numerically
      MONos: uniqueMONos
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Colors: uniqueColors
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Sizes: uniqueSizes
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Buyers: uniqueBuyers
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      defectNames: uniqueDefectNames
        .map((item) => item._id)
        .filter(Boolean)
        .sort()
    });
  } catch (err) {
    console.error("Error fetching QC1 Sunrise filter values:", err);
    res.status(500).json({
      message: "Failed to fetch filter values",
      error: err.message
    });
  }
};

// Endpoint for daily trend data
// export const fetchSunriseDailyTrendData = async (req, res) => {
//     try {
//         const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
//           req.query;
    
//         if (!startDate || !endDate) {
//           return res
//             .status(400)
//             .json({ error: "Start and end dates are required." });
//         }
    
//         const matchStage = {};
    
//         // Date filtering using $expr
//         matchStage.$expr = {
//           $and: [
//             {
//               $gte: [
//                 {
//                   $dateFromString: {
//                     dateString: "$inspectionDate",
//                     format: "%m-%d-%Y", // Matches stored format MM-DD-YYYY
//                     onError: null
//                   }
//                 },
//                 { $dateFromString: { dateString: startDate, format: "%Y-%m-%d" } } // Input format YYYY-MM-DD
//               ]
//             },
//             {
//               $lte: [
//                 {
//                   $dateFromString: {
//                     dateString: "$inspectionDate",
//                     format: "%m-%d-%Y",
//                     onError: null
//                   }
//                 },
//                 { $dateFromString: { dateString: endDate, format: "%Y-%m-%d" } } // Input format YYYY-MM-DD
//               ]
//             }
//           ]
//         };
    
//         // Add other filters
//         if (lineNo) matchStage.lineNo = lineNo;
//         if (MONo) matchStage.MONo = MONo;
//         if (Color) matchStage.Color = Color;
//         if (Size) matchStage.Size = Size;
//         if (Buyer) matchStage.Buyer = Buyer;
//         if (defectName) {
//           matchStage["DefectArray.defectName"] = defectName;
//         }
    
//         const pipeline = [
//           { $match: matchStage },
//           // Optional: Filter DefectArray if defectName is provided
//           ...(defectName
//             ? [
//                 {
//                   $addFields: {
//                     DefectArray: {
//                       $filter: {
//                         input: "$DefectArray",
//                         as: "defect",
//                         cond: { $eq: ["$$defect.defectName", defectName] }
//                       }
//                     }
//                   }
//                 },
//                 {
//                   $addFields: {
//                     totalDefectsQty: { $sum: "$DefectArray.defectQty" }
//                   }
//                 }
//               ]
//             : []),
//           {
//             $group: {
//               _id: "$inspectionDate", // Group by the original date string
//               checkedQty: { $sum: "$CheckedQty" },
//               defectQty: { $sum: "$totalDefectsQty" }
//             }
//           },
//           {
//             $project: {
//               _id: 0,
//               date: "$_id", // Keep original MM-DD-YYYY format
//               checkedQty: 1,
//               defectQty: 1,
//               defectRate: {
//                 $cond: [
//                   { $eq: ["$checkedQty", 0] },
//                   0,
//                   { $multiply: [{ $divide: ["$defectQty", "$checkedQty"] }, 100] }
//                 ]
//               }
//             }
//           },
//           // Sort by date after grouping
//           {
//             $addFields: {
//               sortDate: {
//                 $dateFromString: { dateString: "$date", format: "%m-%d-%Y" }
//               }
//             }
//           },
//           { $sort: { sortDate: 1 } },
//           { $project: { sortDate: 0 } } // Remove temporary sort field
//         ];
    
//         const data = await QC1Sunrise.aggregate(pipeline).exec();
    
//         // Transform date to DD/MM/YYYY for frontend display
//         const transformedData = data.map((item) => {
//             const [month, day, year] = item.date.split("-");
//             return {
//               ...item,
//               date: `${day}/${month}/${year}`
//             };
//         });
    
    
//         res.json(transformedData);
//       } catch (err) {
//         console.error("Error fetching QC1 Sunrise daily trend:", err);
//         res.status(500).json({
//           message: "Failed to fetch QC1 Sunrise daily trend",
//           error: err.message
//         });
//       }
// };

// Endpoint for weekly data aggregation
// export const fetchSunriseWeeklyData = async (req, res) => {
//     try {
//         const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
//           req.query;
    
//         if (!startDate || !endDate) {
//           return res
//             .status(400)
//             .json({ error: "Start and end dates are required for weekly view." });
//         }
    
//         // Validate date format YYYY-MM-DD
//         if (
//           !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
//           !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
//         ) {
//           return res
//             .status(400)
//             .json({ error: "Invalid date format. Use YYYY-MM-DD." });
//         }
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//           return res.status(400).json({ error: "Invalid date value." });
//         }
//         end.setHours(23, 59, 59, 999); // Include the full end day
    
//         const matchStageBase = {};
//         if (lineNo) matchStageBase.lineNo = lineNo;
//         if (MONo) matchStageBase.MONo = MONo;
//         if (Color) matchStageBase.Color = Color;
//         if (Size) matchStageBase.Size = Size;
//         if (Buyer) matchStageBase.Buyer = Buyer;
//         if (defectName) matchStageBase["DefectArray.defectName"] = defectName;
    
//         const pipeline = [];
    
//         // Convert stored date string to Date object
//         pipeline.push({
//           $addFields: {
//             inspectionDateAsDate: {
//               $dateFromString: {
//                 dateString: "$inspectionDate",
//                 format: "%m-%d-%Y", // Stored format
//                 onError: null,
//                 onNull: null
//               }
//             }
//           }
//         });
    
//         // Filter by date range and other criteria
//         pipeline.push({
//           $match: {
//             inspectionDateAsDate: {
//               $gte: start,
//               $lte: end,
//               $ne: null // Exclude records with invalid dates
//             },
//             ...matchStageBase
//           }
//         });
    
//         // Optional: Filter DefectArray if defectName is provided
//         if (defectName) {
//           pipeline.push({
//             $addFields: {
//               DefectArray: {
//                 $filter: {
//                   input: "$DefectArray",
//                   as: "defect",
//                   cond: { $eq: ["$$defect.defectName", defectName] }
//                 }
//               }
//             }
//           });
//           // Recalculate totalDefectsQty based on filtered array
//           pipeline.push({
//             $addFields: {
//               totalDefectsQty: { $sum: "$DefectArray.defectQty" }
//             }
//           });
//         }
    
    
//         // Group by week start date (Monday) and other selected fields
//         pipeline.push({
//           $group: {
//             _id: {
//               weekStartDate: {
//                 $dateTrunc: {
//                   date: "$inspectionDateAsDate",
//                   unit: "week",
//                   startOfWeek: "Monday" // Set Monday as the start of the week
//                 }
//               },
//               // Include other grouping fields if needed by frontend logic
//               lineNo: "$lineNo",
//               MONo: "$MONo",
//               Buyer: "$Buyer",
//               Color: "$Color",
//               Size: "$Size"
//             },
//             CheckedQty: { $sum: "$CheckedQty" },
//             totalDefectsQty: { $sum: "$totalDefectsQty" },
//             // Aggregate defects if needed per group, otherwise fetch raw data first
//             DefectArrays: { $push: "$DefectArray" } // Collect arrays to process later if needed
//           }
//         });
    
//         // Re-aggregate defects within each group
//         pipeline.push({ $unwind: { path: "$DefectArrays", preserveNullAndEmptyArrays: true } });
//         pipeline.push({ $unwind: { path: "$DefectArrays", preserveNullAndEmptyArrays: true } });
//         pipeline.push({
//             $group: {
//                 _id: {
//                     groupInfo: "$_id", // Keep the original group _id
//                     defectName: "$DefectArrays.defectName"
//                 },
//                 CheckedQty: { $first: "$CheckedQty" }, // Carry over total checked qty
//                 totalDefectsQty: { $first: "$totalDefectsQty" }, // Carry over total defects qty
//                 defectQty: { $sum: "$DefectArrays.defectQty" } // Sum qty for this specific defect
//             }
//         });
//          // Filter out null defect names that might result from empty arrays
//         pipeline.push({
//             $match: {
//                 "_id.defectName": { $ne: null }
//             }
//         });
//         // Group back by the original group _id to reconstruct the DefectArray
//         pipeline.push({
//             $group: {
//                 _id: "$_id.groupInfo",
//                 CheckedQty: { $first: "$CheckedQty" },
//                 totalDefectsQty: { $first: "$totalDefectsQty" },
//                 DefectArray: {
//                     $push: {
//                         defectName: "$_id.defectName",
//                         defectQty: "$defectQty"
//                     }
//                 }
//             }
//         });
    
    
//         // Project the final structure
//         pipeline.push({
//           $project: {
//             _id: 0,
//             weekStartDate: "$_id.weekStartDate",
//             lineNo: "$_id.lineNo",
//             MONo: "$_id.MONo",
//             Buyer: "$_id.Buyer",
//             Color: "$_id.Color",
//             Size: "$_id.Size",
//             CheckedQty: 1,
//             totalDefectsQty: 1,
//             DefectArray: { // Ensure DefectArray only contains valid defects
//                 $filter: {
//                     input: "$DefectArray",
//                     as: "defect",
//                     cond: { $ne: ["$$defect.defectName", null] }
//                 }
//             }
//           }
//         });
    
//         // Sort the results
//         pipeline.push({
//           $sort: {
//             weekStartDate: 1,
//             lineNo: 1,
//             MONo: 1,
//             Buyer: 1,
//             Color: 1,
//             Size: 1
//           }
//         });
    
//         const data = await QC1Sunrise.aggregate(pipeline).exec();
    
//         // Add weekKey (e.g., "2023-W34") to each result item
//         const transformedData = data.map((item) => {
//           const year = item.weekStartDate.getFullYear();
//           // Calculate ISO week number
//           const date = item.weekStartDate;
//           date.setHours(0, 0, 0, 0);
//           date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7)); // Thursday of the week
//           const week1 = new Date(date.getFullYear(), 0, 4);
//           const weekNum =
//             1 +
//             Math.round(
//               ((date.getTime() - week1.getTime()) / 86400000 -
//                 3 +
//                 ((week1.getDay() + 6) % 7)) /
//                 7
//             );
    
//           return {
//             ...item,
//             weekKey: `${year}-W${String(weekNum).padStart(2, "0")}`
//           };
//         });
    
//         res.json(transformedData);
//       } catch (err) {
//         console.error("Error fetching QC1 Sunrise weekly data:", err);
//         res.status(500).json({
//           message: "Failed to fetch QC1 Sunrise weekly data",
//           error: err.message
//         });
//       }
// };

// Endpoint for weekly filter options
// export const fetchSunriseWeeklyFilters = async (req, res) => {
//     try {
//         const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
//           req.query;
    
//         if (!startDate || !endDate) {
//           return res
//             .status(400)
//             .json({ error: "Start and end dates are required for filters." });
//         }
//         if (
//           !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
//           !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
//         ) {
//           return res
//             .status(400)
//             .json({ error: "Invalid date format. Use YYYY-MM-DD." });
//         }
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//           return res.status(400).json({ error: "Invalid date value." });
//         }
//         end.setHours(23, 59, 59, 999);
    
//         const basePipeline = [];
    
//         // Convert date string and filter by date range
//         basePipeline.push({
//           $addFields: {
//             inspectionDateAsDate: {
//               $dateFromString: {
//                 dateString: "$inspectionDate",
//                 format: "%m-%d-%Y",
//                 onError: null,
//                 onNull: null
//               }
//             }
//           }
//         });
//         basePipeline.push({
//           $match: {
//             inspectionDateAsDate: {
//               $gte: start,
//               $lte: end,
//               $ne: null
//             }
//           }
//         });
    
//         // Apply other filters if provided
//         const matchStageOthers = {};
//         if (lineNo) matchStageOthers.lineNo = lineNo;
//         if (MONo) matchStageOthers.MONo = MONo;
//         if (Color) matchStageOthers.Color = Color;
//         if (Size) matchStageOthers.Size = Size;
//         if (Buyer) matchStageOthers.Buyer = Buyer;
//         if (defectName) matchStageOthers["DefectArray.defectName"] = defectName;
    
//         if (Object.keys(matchStageOthers).length > 0) {
//           basePipeline.push({ $match: matchStageOthers });
//         }
    
//         // Fetch unique values concurrently
//         const [
//           uniqueLineNos,
//           uniqueMONos,
//           uniqueColors,
//           uniqueSizes,
//           uniqueBuyers,
//           uniqueDefectNames
//         ] = await Promise.all([
//           QC1Sunrise.aggregate([
//             ...basePipeline,
//             { $match: { lineNo: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$lineNo" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             ...basePipeline,
//             { $match: { MONo: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$MONo" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             ...basePipeline,
//             { $match: { Color: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$Color" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             ...basePipeline,
//             { $match: { Size: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$Size" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             ...basePipeline,
//             { $match: { Buyer: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$Buyer" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             ...basePipeline,
//             { $unwind: "$DefectArray" },
//             { $match: { "DefectArray.defectName": { $ne: null, $ne: "" } } },
//             { $group: { _id: "$DefectArray.defectName" } }
//           ]).exec()
//         ]);
    
//         // Helper to process results
//         const processResults = (results, numericSort = false) => {
//           const values = results.map((item) => item._id).filter(Boolean);
//           return numericSort
//             ? values.sort((a, b) => parseInt(a) - parseInt(b))
//             : values.sort();
//         };
    
//         res.json({
//           lineNos: processResults(uniqueLineNos, true),
//           MONos: processResults(uniqueMONos),
//           Colors: processResults(uniqueColors),
//           Sizes: processResults(uniqueSizes),
//           Buyers: processResults(uniqueBuyers),
//           defectNames: processResults(uniqueDefectNames)
//         });
//       } catch (err) {
//         console.error("Error fetching QC1 Sunrise weekly filter values:", err);
//         res.status(500).json({
//           message: "Failed to fetch weekly filter values",
//           error: err.message
//         });
//       }
// };

// Endpoint for monthly data aggregation
// export const fetchSunriseMonthlyData = async (req, res) => {
//     try {
//         const { startMonth, endMonth, lineNo, MONo, Color, Size, Buyer, defectName } =
//           req.query;
    
//         if (!startMonth || !endMonth) {
//           return res
//             .status(400)
//             .json({ error: "Start and end months are required." });
//         }
//         if (
//           !/^\d{4}-\d{2}$/.test(startMonth) ||
//           !/^\d{4}-\d{2}$/.test(endMonth)
//         ) {
//           return res
//             .status(400)
//             .json({ error: "Invalid month format. Use YYYY-MM." });
//         }
    
//         const matchStage = {};
    
//         // Filter by month range using $expr
//         matchStage.$expr = {
//           $and: [
//             {
//               $gte: [
//                 {
//                   $concat: [
//                     { $substr: ["$inspectionDate", 6, 4] }, // YYYY
//                     "-",
//                     { $substr: ["$inspectionDate", 0, 2] } // MM
//                   ]
//                 },
//                 startMonth
//               ]
//             },
//             {
//               $lte: [
//                 {
//                   $concat: [
//                     { $substr: ["$inspectionDate", 6, 4] }, // YYYY
//                     "-",
//                     { $substr: ["$inspectionDate", 0, 2] } // MM
//                   ]
//                 },
//                 endMonth
//               ]
//             }
//           ]
//         };
    
//         // Add other filters
//         if (lineNo) matchStage.lineNo = lineNo;
//         if (MONo) matchStage.MONo = MONo;
//         if (Color) matchStage.Color = Color;
//         if (Size) matchStage.Size = Size;
//         if (Buyer) matchStage.Buyer = Buyer;
//         if (defectName) matchStage["DefectArray.defectName"] = defectName;
    
//         const pipeline = [];
//         pipeline.push({ $match: matchStage });
    
//         // Optional: Filter DefectArray if defectName is provided
//         if (defectName) {
//           pipeline.push({
//             $addFields: {
//               DefectArray: {
//                 $filter: {
//                   input: "$DefectArray",
//                   as: "defect",
//                   cond: { $eq: ["$$defect.defectName", defectName] }
//                 }
//               }
//             }
//           });
//           pipeline.push({
//             $addFields: {
//               totalDefectsQty: { $sum: "$DefectArray.defectQty" }
//             }
//           });
//         }
    
//         // Add yearMonth field for sorting/grouping if needed later
//         pipeline.push({
//           $addFields: {
//             yearMonth: {
//               $concat: [
//                 { $substr: ["$inspectionDate", 6, 4] },
//                 "-",
//                 { $substr: ["$inspectionDate", 0, 2] }
//               ]
//             }
//           }
//         });
    
//         // Sort before sending response
//         pipeline.push({
//           $sort: {
//             yearMonth: 1,
//             lineNo: 1,
//             MONo: 1,
//             Buyer: 1,
//             Color: 1,
//             Size: 1
//           }
//         });
    
//         const data = await QC1Sunrise.aggregate(pipeline).exec();
    
//         // Transform date to DD/MM/YYYY for frontend display
//         const transformedData = data.map((item) => {
//           const [month, day, year] = item.inspectionDate.split("-");
//           return {
//             ...item,
//             inspectionDate: `${day}/${month}/${year}`
//           };
//         });
    
//         res.json(transformedData);
//       } catch (err) {
//         console.error("Error fetching QC1 Sunrise monthly data:", err);
//         res.status(500).json({
//           message: "Failed to fetch QC1 Sunrise monthly data",
//           error: err.message
//         });
//       }
// };

// Endpoint for monthly trend data
// export const fetchSunriseMonthlyTrendData = async (req, res) => {
//     try {
//         const { startMonth, endMonth, lineNo, MONo, Color, Size, Buyer, defectName } =
//           req.query;
    
//         if (!startMonth || !endMonth) {
//           return res
//             .status(400)
//             .json({ error: "Start and end months are required." });
//         }
//         if (
//           !/^\d{4}-\d{2}$/.test(startMonth) ||
//           !/^\d{4}-\d{2}$/.test(endMonth)
//         ) {
//           return res
//             .status(400)
//             .json({ error: "Invalid month format. Use YYYY-MM." });
//         }
    
//         const matchStage = {};
    
//         // Filter by month range
//         matchStage.$expr = {
//           $and: [
//             {
//               $gte: [
//                 {
//                   $concat: [
//                     { $substr: ["$inspectionDate", 6, 4] },
//                     "-",
//                     { $substr: ["$inspectionDate", 0, 2] }
//                   ]
//                 },
//                 startMonth
//               ]
//             },
//             {
//               $lte: [
//                 {
//                   $concat: [
//                     { $substr: ["$inspectionDate", 6, 4] },
//                     "-",
//                     { $substr: ["$inspectionDate", 0, 2] }
//                   ]
//                 },
//                 endMonth
//               ]
//             }
//           ]
//         };
    
//         // Add other filters
//         if (lineNo) matchStage.lineNo = lineNo;
//         if (MONo) matchStage.MONo = MONo;
//         if (Color) matchStage.Color = Color;
//         if (Size) matchStage.Size = Size;
//         if (Buyer) matchStage.Buyer = Buyer;
//         if (defectName) matchStage["DefectArray.defectName"] = defectName;
    
//         const pipeline = [
//           { $match: matchStage },
//           // Optional: Filter DefectArray if defectName is provided
//           ...(defectName
//             ? [
//                 {
//                   $addFields: {
//                     DefectArray: {
//                       $filter: {
//                         input: "$DefectArray",
//                         as: "defect",
//                         cond: { $eq: ["$$defect.defectName", defectName] }
//                       }
//                     }
//                   }
//                 },
//                 {
//                   $addFields: {
//                     totalDefectsQty: { $sum: "$DefectArray.defectQty" }
//                   }
//                 }
//               ]
//             : []),
//           // Group by month
//           {
//             $group: {
//               _id: {
//                 $concat: [
//                   { $substr: ["$inspectionDate", 6, 4] }, // YYYY
//                   "-",
//                   { $substr: ["$inspectionDate", 0, 2] } // MM
//                 ]
//               },
//               checkedQty: { $sum: "$CheckedQty" },
//               defectQty: { $sum: "$totalDefectsQty" }
//               // Removed pushing all records for performance in trend view
//             }
//           },
//           // Project final fields
//           {
//             $project: {
//               _id: 0,
//               month: "$_id",
//               checkedQty: 1,
//               defectQty: 1,
//               defectRate: {
//                 $cond: [
//                   { $eq: ["$checkedQty", 0] },
//                   0,
//                   { $multiply: [{ $divide: ["$defectQty", "$checkedQty"] }, 100] }
//                 ]
//               }
//             }
//           },
//           // Sort by month
//           { $sort: { month: 1 } }
//         ];
    
//         const data = await QC1Sunrise.aggregate(pipeline).exec();
    
//         res.json(data);
//       } catch (err) {
//         console.error("Error fetching QC1 Sunrise monthly trend:", err);
//         res.status(500).json({
//           message: "Failed to fetch QC1 Sunrise monthly trend",
//           error: err.message
//         });
//       }
// };

// Endpoint for monthly filter options
// export const fetchSunriseMonthlyFilters = async (req, res) => {
//     try {
//         const { startMonth, endMonth, lineNo, MONo, Color, Size, Buyer, defectName } =
//           req.query;
    
//         const matchStage = {};
    
//         // Filter by month range
//         if (startMonth || endMonth) {
//           matchStage.$expr = matchStage.$expr || {};
//           matchStage.$expr.$and = matchStage.$expr.$and || [];
//           const yearMonthExpr = {
//             $concat: [
//               { $substr: ["$inspectionDate", 6, 4] },
//               "-",
//               { $substr: ["$inspectionDate", 0, 2] }
//             ]
//           };
//           if (startMonth) {
//             matchStage.$expr.$and.push({ $gte: [yearMonthExpr, startMonth] });
//           }
//           if (endMonth) {
//             matchStage.$expr.$and.push({ $lte: [yearMonthExpr, endMonth] });
//           }
//         }
    
//         // Add other filters
//         if (lineNo) matchStage.lineNo = lineNo;
//         if (MONo) matchStage.MONo = MONo;
//         if (Color) matchStage.Color = Color;
//         if (Size) matchStage.Size = Size;
//         if (Buyer) matchStage.Buyer = Buyer;
//         if (defectName) matchStage["DefectArray.defectName"] = defectName;
    
//         // Fetch unique values concurrently
//         const [
//           uniqueLineNos,
//           uniqueMONos,
//           uniqueColors,
//           uniqueSizes,
//           uniqueBuyers,
//           uniqueDefectNames
//         ] = await Promise.all([
//           QC1Sunrise.aggregate([
//             { $match: matchStage },
//             { $match: { lineNo: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$lineNo" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             { $match: matchStage },
//             { $match: { MONo: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$MONo" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             { $match: matchStage },
//             { $match: { Color: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$Color" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             { $match: matchStage },
//             { $match: { Size: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$Size" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             { $match: matchStage },
//             { $match: { Buyer: { $ne: null, $ne: "" } } },
//             { $group: { _id: "$Buyer" } }
//           ]).exec(),
//           QC1Sunrise.aggregate([
//             { $match: matchStage },
//             { $unwind: "$DefectArray" },
//             { $match: { "DefectArray.defectName": { $ne: null, $ne: "" } } },
//             { $group: { _id: "$DefectArray.defectName" } }
//           ]).exec()
//         ]);
    
//         // Helper to process results
//         const processResults = (results, numericSort = false) => {
//           const values = results.map((item) => item._id).filter(Boolean);
//           return numericSort
//             ? values.sort((a, b) => parseInt(a) - parseInt(b))
//             : values.sort();
//         };
    
//         res.json({
//           lineNos: processResults(uniqueLineNos, true),
//           MONos: processResults(uniqueMONos),
//           Colors: processResults(uniqueColors),
//           Sizes: processResults(uniqueSizes),
//           Buyers: processResults(uniqueBuyers),
//           defectNames: processResults(uniqueDefectNames)
//         });
//       } catch (err) {
//         console.error("Error fetching QC1 Sunrise monthly filter values:", err);
//         res.status(500).json({
//           message: "Failed to fetch monthly filter values",
//           error: err.message
//         });
//       }
// };