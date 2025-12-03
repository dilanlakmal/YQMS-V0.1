import {
  QCRealWashQty,
  QCWashing,
  AQLChart
} from "../MongoDB/dbConnectionController.js";
import {
  getBuyerFromMoNumber,
  getAqlLevelForBuyer
} from "../../helpers/helperFunctions.js";

export const uploadQcRealWashQty = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid data format. Expected array of washing quantity records."
      });
    }

    // Validate required fields
    for (const record of data) {
      if (
        !record.inspectionDate ||
        !record.QC_Id ||
        !record.Style_No ||
        !record.color ||
        record.washQty === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: inspectionDate, QC_Id, Style_No, color, washQty"
        });
      }
    }

    // Helper function to extract English color name from Chinese[English] format
    const extractEnglishColor = (colorString) => {
      // Check if color has format like "中文[ENGLISH]"
      const match = colorString.match(/\[([^\]]+)\]$/);
      if (match) {
        return match[1]; // Return the English part
      }
      return colorString; // Return as-is if no brackets found
    };

    // DEBUG: Log the input data
    console.log("Input data sample:", {
      Style_No: data[0].Style_No,
      color: data[0].color,
      extractedEnglishColor: extractEnglishColor(data[0].color),
      inspectionDate: data[0].inspectionDate,
      QC_Id: data[0].QC_Id,
      washQty: data[0].washQty
    });

    // DEBUG: Check what QCWashing records exist for this Style_No with filters
    const existingRecords = await QCWashing.find({
      orderNo: data[0].Style_No,
      reportType: "Inline",
      factoryName: "YM"
    })
      .select(
        "orderNo color date reportType factoryName actualWashQty actualAQLValue"
      )
      .lean();

    console.log(
      `Existing QCWashing records for orderNo "${data[0].Style_No}" with reportType="Inline" and factoryName="YM":`,
      existingRecords.length
    );
    existingRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        orderNo: record.orderNo,
        color: record.color,
        date: record.date,
        reportType: record.reportType,
        factoryName: record.factoryName,
        actualWashQty: record.actualWashQty,
        hasActualAQL: !!record.actualAQLValue
      });
    });

    // Prepare bulk operations for QCRealWashQty collection
    const bulkOpsRealWash = data.map((record) => ({
      updateOne: {
        filter: {
          inspectionDate: new Date(record.inspectionDate),
          QC_Id: record.QC_Id,
          Style_No: record.Style_No,
          color: record.color
        },
        update: {
          $set: {
            washQty: record.washQty,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    // Prepare bulk operations for QCWashing collection with AQL calculation
    const bulkOpsWashing = [];
    const updateResults = [];

    for (const record of data) {
      try {
        // Calculate AQL based on washQty
        const washQtyNum = parseInt(record.washQty, 10);

        // Get buyer and AQL level
        const buyer = await getBuyerFromMoNumber(record.Style_No);
        const aqlLevel = getAqlLevelForBuyer(buyer);

        console.log("AQL Calculation for Style_No:", record.Style_No, {
          washQty: washQtyNum,
          buyer: buyer,
          aqlLevel: aqlLevel
        });

        // Find the AQL chart document where the wash qty falls within the defined range
        const aqlChart = await AQLChart.findOne({
          Type: "General",
          Level: "II",
          "LotSize.min": { $lte: washQtyNum },
          $or: [
            { "LotSize.max": { $gte: washQtyNum } },
            { "LotSize.max": null }
          ]
        }).lean();

        let actualAQLValue = null;
        if (aqlChart) {
          // Find the specific AQL entry for the buyer's AQL level
          const aqlEntry = aqlChart.AQL.find((aql) => aql.level === aqlLevel);
          if (aqlEntry) {
            actualAQLValue = {
              sampleSize: aqlChart.SampleSize,
              acceptedDefect: aqlEntry.AcceptDefect,
              rejectedDefect: aqlEntry.RejectDefect,
              levelUsed: aqlLevel,
              lotSize: washQtyNum,
              calculatedAt: new Date()
            };
            console.log(
              "AQL Value calculated for Style_No:",
              record.Style_No,
              actualAQLValue
            );
          } else {
            console.log(
              "No AQL entry found for level:",
              aqlLevel,
              "Style_No:",
              record.Style_No
            );
          }
        } else {
          console.log(
            "No AQL chart found for wash qty:",
            washQtyNum,
            "Style_No:",
            record.Style_No
          );
        }

        // Convert inspection date to match QCWashing date format
        const inspectionDate = new Date(record.inspectionDate);
        const startOfDay = new Date(
          inspectionDate.getFullYear(),
          inspectionDate.getMonth(),
          inspectionDate.getDate()
        );
        const endOfDay = new Date(
          inspectionDate.getFullYear(),
          inspectionDate.getMonth(),
          inspectionDate.getDate() + 1
        );

        // Extract English color name for matching
        const englishColor = extractEnglishColor(record.color);

        console.log("Color matching for Style_No:", record.Style_No, {
          originalColor: record.color,
          extractedEnglishColor: englishColor,
          inspectionDate: record.inspectionDate,
          startOfDay: startOfDay,
          endOfDay: endOfDay
        });

        // Create filter for QCWashing update with additional conditions
        const washingFilter = {
          orderNo: record.Style_No,
          color: englishColor, // Use extracted English color
          reportType: "Inline", // Only Inline reports
          factoryName: "YM", // Only YM factory
          date: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        };

        console.log(
          "QCWashing filter for Style_No:",
          record.Style_No,
          washingFilter
        );

        // Check if any records match this filter before updating
        const matchingRecords = await QCWashing.find(washingFilter)
          .select(
            "orderNo color date reportType factoryName actualWashQty actualAQLValue"
          )
          .lean();
        console.log(
          `Records matching filter for Style_No "${record.Style_No}":`,
          matchingRecords.length
        );
        matchingRecords.forEach((matchedRecord, index) => {
          console.log(`Matching record ${index + 1}:`, {
            orderNo: matchedRecord.orderNo,
            color: matchedRecord.color,
            date: matchedRecord.date,
            reportType: matchedRecord.reportType,
            factoryName: matchedRecord.factoryName,
            currentActualWashQty: matchedRecord.actualWashQty,
            currentActualAQL: matchedRecord.actualAQLValue
          });
        });

        // Store the matching info for later verification
        updateResults.push({
          Style_No: record.Style_No,
          originalColor: record.color,
          englishColor: englishColor,
          washQty: record.washQty,
          matchingRecordsCount: matchingRecords.length,
          filter: washingFilter
        });

        // Update QCWashing records that match the criteria
        if (matchingRecords.length > 0) {
          bulkOpsWashing.push({
            updateMany: {
              filter: washingFilter,
              update: {
                $set: {
                  actualWashQty: record.washQty,
                  actualAQLValue: actualAQLValue,
                  updatedAt: new Date()
                }
              }
            }
          });
        } else {
          console.log(
            `No matching records found for Style_No "${record.Style_No}" with color "${englishColor}"`
          );

          // Try fallback without date filter
          const fallbackFilter = {
            orderNo: record.Style_No,
            color: englishColor,
            reportType: "Inline",
            factoryName: "YM"
          };

          const fallbackMatches = await QCWashing.find(fallbackFilter)
            .select("orderNo color date reportType factoryName")
            .lean();
          console.log(
            `Fallback matches (no date filter) for Style_No "${record.Style_No}":`,
            fallbackMatches.length
          );

          if (fallbackMatches.length > 0) {
            console.log("Adding fallback update without date filter");
            bulkOpsWashing.push({
              updateMany: {
                filter: fallbackFilter,
                update: {
                  $set: {
                    actualWashQty: record.washQty,
                    actualAQLValue: actualAQLValue,
                    updatedAt: new Date()
                  }
                }
              }
            });
          }
        }
      } catch (aqlError) {
        console.error(
          `Error calculating AQL for Style_No ${record.Style_No}:`,
          aqlError
        );
        // Continue with the operation but without AQL data
        const inspectionDate = new Date(record.inspectionDate);
        const startOfDay = new Date(
          inspectionDate.getFullYear(),
          inspectionDate.getMonth(),
          inspectionDate.getDate()
        );
        const endOfDay = new Date(
          inspectionDate.getFullYear(),
          inspectionDate.getMonth(),
          inspectionDate.getDate() + 1
        );
        const englishColor = extractEnglishColor(record.color);

        bulkOpsWashing.push({
          updateMany: {
            filter: {
              orderNo: record.Style_No,
              color: englishColor,
              reportType: "Inline",
              factoryName: "YM",
              date: {
                $gte: startOfDay,
                $lt: endOfDay
              }
            },
            update: {
              $set: {
                actualWashQty: record.washQty,
                actualAQLValue: null,
                updatedAt: new Date()
              }
            }
          }
        });
      }
    }

    // Execute both bulk operations
    const [resultRealWash, resultWashing] = await Promise.all([
      QCRealWashQty.bulkWrite(bulkOpsRealWash),
      bulkOpsWashing.length > 0
        ? QCWashing.bulkWrite(bulkOpsWashing)
        : { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
    ]);

    console.log("QCWashing bulk write result:", {
      matchedCount: resultWashing.matchedCount,
      modifiedCount: resultWashing.modifiedCount,
      upsertedCount: resultWashing.upsertedCount,
      operations: bulkOpsWashing.length
    });

    // Verification queries for each processed record
    const verificationResults = [];
    for (const record of data) {
      const englishColor = extractEnglishColor(record.color);
      const verificationQuery = await QCWashing.findOne({
        orderNo: record.Style_No,
        color: englishColor,
        reportType: "Inline",
        factoryName: "YM"
      })
        .select(
          "orderNo color actualWashQty actualAQLValue updatedAt reportType factoryName"
        )
        .lean();

      verificationResults.push({
        Style_No: record.Style_No,
        originalColor: record.color,
        englishColor: englishColor,
        found: !!verificationQuery,
        actualWashQty: verificationQuery?.actualWashQty,
        hasActualAQL: !!verificationQuery?.actualAQLValue,
        updatedAt: verificationQuery?.updatedAt
      });

      console.log(
        `Verification for Style_No "${record.Style_No}", color "${englishColor}":`,
        {
          found: !!verificationQuery,
          orderNo: verificationQuery?.orderNo,
          color: verificationQuery?.color,
          reportType: verificationQuery?.reportType,
          factoryName: verificationQuery?.factoryName,
          actualWashQty: verificationQuery?.actualWashQty,
          hasActualAQL: !!verificationQuery?.actualAQLValue,
          updatedAt: verificationQuery?.updatedAt
        }
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Washing quantity data and AQL values saved successfully to both collections",
      data: {
        qcRealWashingQty: {
          inserted: resultRealWash.upsertedCount,
          updated: resultRealWash.modifiedCount,
          total: resultRealWash.upsertedCount + resultRealWash.modifiedCount
        },
        qcWashing: {
          matched: resultWashing.matchedCount,
          modified: resultWashing.modifiedCount,
          operations: bulkOpsWashing.length
        }
      },
      debug: {
        updateResults: updateResults,
        verificationResults: verificationResults,
        existingRecordsCount: existingRecords.length
      }
    });
  } catch (error) {
    console.error("Error saving washing quantity data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const returnFilterData = async (req, res) => {
  try {
    const {
      inspectionDate,
      QC_Id,
      Style_No,
      color,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};

    if (inspectionDate) {
      filter.inspectionDate = new Date(inspectionDate);
    }

    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (QC_Id) filter.QC_Id = QC_Id;
    if (Style_No) filter.Style_No = new RegExp(Style_No, "i");
    if (color) filter.color = new RegExp(color, "i");

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [records, total] = await Promise.all([
      QCRealWashQty.find(filter)
        .sort({ inspectionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QCRealWashQty.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: records.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error("Error retrieving washing quantity data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getSummaryStatuctics = async (req, res) => {
  try {
    const { startDate, endDate, QC_Id } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (QC_Id) matchStage.QC_Id = QC_Id;

    const summary = await QCRealWashQty.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalWashQty: { $sum: "$washQty" },
          totalRecords: { $sum: 1 },
          uniqueStyles: { $addToSet: "$Style_No" },
          uniqueColors: { $addToSet: "$color" },
          avgWashQty: { $avg: "$washQty" }
        }
      },
      {
        $project: {
          _id: 0,
          totalWashQty: 1,
          totalRecords: 1,
          uniqueStylesCount: { $size: "$uniqueStyles" },
          uniqueColorsCount: { $size: "$uniqueColors" },
          avgWashQty: { $round: ["$avgWashQty", 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary[0] || {
        totalWashQty: 0,
        totalRecords: 0,
        uniqueStylesCount: 0,
        uniqueColorsCount: 0,
        avgWashQty: 0
      }
    });
  } catch (error) {
    console.error("Error getting summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const deleteWashingQty = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Expected array of record IDs."
      });
    }

    const result = await QCRealWashQty.deleteMany({
      _id: { $in: ids }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting records:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getrealWashQty = async (req, res) => {
  try {
    const { inspectionDate, styleNo, color } = req.query;

    if (!inspectionDate || !styleNo || !color) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: inspectionDate, styleNo, color"
      });
    }

    // Parse the inspection date
    const searchDate = new Date(inspectionDate);

    // Create flexible color matching - search for colors that contain the search term
    // This handles cases like "BLACK" matching "黑色[BLACK]"
    const colorRegex = new RegExp(
      color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    // Search for matching records with flexible color matching
    const records = await QCRealWashQty.aggregate([
      {
        $match: {
          inspectionDate: searchDate,
          Style_No: styleNo,
          $or: [
            { color: color }, // Exact match
            { color: colorRegex }, // Regex match for partial matches
            { color: { $regex: `\\[${color}\\]`, $options: "i" } } // Match color in brackets like [BLACK]
          ]
        }
      },
      {
        $group: {
          _id: {
            inspectionDate: "$inspectionDate",
            Style_No: "$Style_No",
            color: "$color"
          },
          totalWashQty: { $sum: "$washQty" },
          qcIds: { $push: "$QC_Id" },
          recordCount: { $sum: 1 },
          matchedColors: { $addToSet: "$color" }
        }
      }
    ]);

    const totalWashQty = records.length > 0 ? records[0].totalWashQty : 0;

    res.json({
      success: true,
      washQty: totalWashQty,
      found: records.length > 0,
      details: records.length > 0 ? records[0] : null,
      searchCriteria: { inspectionDate, styleNo, color }
    });
  } catch (error) {
    console.error("Error searching real wash qty:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search real wash qty",
      error: error.message
    });
  }
};
