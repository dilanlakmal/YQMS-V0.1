import {
  Washing ,
} from "../../MongoDB/dbConnectionController.js";

import { getDayRange } from "../../../helpers/helperFunctions.js";

// Endpoint to fetch filter options for Washing Dashboard
export const getFilterOptions = async (req, res) => {
    try {
    // Destructure query params, ensuring they are used correctly
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo, // This will be the selectedMono value from the client
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId,
      packageNo: queryPackageNo // This will be the package_no value
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(queryStartDate)
        ]
      });
    }
    if (queryEndDate) {
      const endOfDay = new Date(queryEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }

    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    }

    // Build matchQuery for filtering options based on *other* active filters
    // MO No Filter (selectedMono)
    if (queryMoNo) matchQuery.selectedMono = queryMoNo;
    // Package No Filter
    if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
    // Other text/select filters
    if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
    if (queryBuyer) matchQuery.buyer = queryBuyer;
    if (queryColor) matchQuery.color = queryColor;
    if (querySize) matchQuery.size = querySize;
    if (queryQcId) matchQuery.emp_id_washing = queryQcId;

    // --- Pipelines for distinct values ---
    // MO Nos (from selectedMono)
    const moNosPipeline = [
      { $match: { ...matchQuery, selectedMono: { $ne: null, $ne: "" } } }, // Apply general filters
      { $group: { _id: "$selectedMono" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, value: "$_id", label: "$_id" } }
    ];
    // If a moNo is already selected, we don't need to filter the moNo list by itself.
    // So, if queryMoNo is active, for *this specific pipeline*, remove it from matchQuery
    const moNosMatch = { ...matchQuery };
    if (queryMoNo) delete moNosMatch.selectedMono;
    moNosPipeline[0].$match = {
      ...moNosMatch,
      selectedMono: { $ne: null, $ne: "" }
    };

    // Package Nos
    const packageNosPipeline = [
      { $match: { ...matchQuery, package_no: { $ne: null } } },
      { $group: { _id: "$package_no" } },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: { $toString: "$_id" },
          label: { $toString: "$_id" }
        }
      }
    ];
    const packageNosMatch = { ...matchQuery };
    if (queryPackageNo) delete packageNosMatch.package_no;
    packageNosPipeline[0].$match = {
      ...packageNosMatch,
      package_no: { $ne: null }
    };

    // Similar logic for other filters to ensure cross-filtering
    const createDynamicPipeline = (field, isNumeric = false) => {
      const pipeline = [
        {
          $match: {
            ...matchQuery,
            [field]: isNumeric ? { $ne: null } : { $ne: null, $ne: "" }
          }
        },
        { $group: { _id: `$${field}` } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            value: isNumeric ? { $toString: `$_id` } : `$_id`,
            label: isNumeric ? { $toString: `$_id` } : `$_id`
          }
        }
      ];
      const tempMatch = { ...matchQuery };
      // if the current field is being filtered by (e.g. queryCustStyle for custStyle pipeline), remove it from this pipeline's match
      if (req.query[field === "emp_id_washing" ? "qcId" : field])
        delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        [field]: isNumeric ? { $ne: null } : { $ne: null, $ne: "" }
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_washing: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$emp_id_washing",
          eng_name: { $first: "$eng_name_washing" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          value: "$_id",
          label: {
            $concat: ["$_id", " (", { $ifNull: ["$eng_name", "N/A"] }, ")"]
          }
        }
      }
    ];
    const qcIdsMatch = { ...matchQuery };
    if (queryQcId) delete qcIdsMatch.emp_id_washing;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_washing: { $ne: null, $ne: "" }
    };

    const [
      moNosData,
      packageNosData,
      custStylesData,
      buyersData,
      colorsData,
      sizesData,
      qcIdsDataResult
    ] = await Promise.all([
      Washing.aggregate(moNosPipeline).exec(),
      Washing.aggregate(packageNosPipeline).exec(),
      Washing.aggregate(createDynamicPipeline("custStyle")).exec(),
      Washing.aggregate(createDynamicPipeline("buyer")).exec(),
      Washing.aggregate(createDynamicPipeline("color")).exec(),
      Washing.aggregate(createDynamicPipeline("size")).exec(),
      Washing.aggregate(qcIdsPipeline).exec()
    ]);

    res.json({
      moNos: moNosData.filter((item) => item.value),
      packageNos: packageNosData.filter((item) => item.value),
      custStyles: custStylesData.filter((item) => item.value),
      buyers: buyersData.filter((item) => item.value),
      colors: colorsData.filter((item) => item.value),
      sizes: sizesData.filter((item) => item.value),
      qcIds: qcIdsDataResult.filter((item) => item.value)
    });
  } catch (error) {
    console.error("Error fetching washing filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
};

// Endpoint to fetch Washing Dashboard data
export const getWashingDashboardData = async (req, res) => {
    try {
    const {
      startDate,
      endDate,
      moNo, // This is selectedMono
      packageNo, // This is package_no
      custStyle,
      buyer,
      color,
      size,
      qcId,
      page = 1,
      limit = 20
    } = req.query;

    let baseMatchQuery = {};
    if (moNo) baseMatchQuery.selectedMono = moNo; // Correctly filter by selectedMono
    if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
    if (custStyle) baseMatchQuery.custStyle = custStyle;
    if (buyer) baseMatchQuery.buyer = buyer;
    if (color) baseMatchQuery.color = color;
    if (size) baseMatchQuery.size = size;
    if (qcId) baseMatchQuery.emp_id_washing = qcId;

    // Current period match query
    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      currentDateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (currentDateMatchAnd.length > 0) {
      currentPeriodMatchQuery.$expr = { $and: currentDateMatchAnd };
    } else if (
      Object.keys(currentPeriodMatchQuery).length === 0 &&
      !startDate &&
      !endDate
    ) {
      const todayRange = getDayRange(new Date());
      currentPeriodMatchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    let referenceDateForPrev = startDate ? new Date(startDate) : new Date();
    const prevDate = new Date(referenceDateForPrev);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDayDateRange = getDayRange(prevDate);

    let previousDayMatchQuery = { ...baseMatchQuery };
    previousDayMatchQuery.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$washing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(0),
                onNull: new Date(0)
              }
            },
            prevDayDateRange.start
          ]
        },
        {
          $lte: [
            {
              $dateFromString: {
                dateString: "$washing_updated_date",
                format: "%m/%d/%Y",
                onError: new Date(Date.now() + 86400000 * 365 * 10),
                onNull: new Date(Date.now() + 86400000 * 365 * 10)
              }
            },
            prevDayDateRange.end
          ]
        }
      ]
    };

    const summaryAggregation = [
      {
        $group: {
          _id: null,
          totalWashingQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 55] },
                { $ifNull: ["$passQtyWash", 0] },
                0
              ]
            }
          },
          totalRewashQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 86] },
                { $ifNull: ["$passQtyWash", 0] },
                0
              ]
            }
          },
          totalBundles: { $sum: 1 }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      Washing.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      Washing.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalWashingQty: 0,
      totalRewashQty: 0,
      totalBundles: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalWashingQty: 0,
      totalRewashQty: 0,
      totalBundles: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $project: {
          emp_id_washing: 1,
          eng_name_washing: 1,
          washing_updated_date: 1,
          passQtyWash: { $ifNull: ["$passQtyWash", 0] },
          task_no_washing: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            emp_id: "$emp_id_washing",
            date: "$washing_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_washing" },
          dailyWashingQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 55] }, "$passQtyWash", 0]
            }
          },
          dailyRewashQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 86] }, "$passQtyWash", 0]
            }
          },
          dailyBundles: { $sum: 1 }
        }
      },
      { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
      {
        $project: {
          _id: 0,
          emp_id: "$_id.emp_id",
          eng_name: "$eng_name",
          date: "$_id.date",
          dailyWashingQty: 1,
          dailyRewashQty: 1,
          dailyBundles: 1
        }
      }
    ];
    const inspectorSummaryData = await Washing.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          }
        }
      },
      { $sort: { parsedDate: -1, washing_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          washing_updated_date: 1,
          emp_id_washing: 1,
          eng_name_washing: 1,
          dept_name_washing: 1,
          selectedMono: 1, // This is MO No for display
          package_no: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          washing_update_time: 1,
          washingQty: {
            $cond: [
              { $eq: ["$task_no_washing", 55] },
              { $ifNull: ["$passQtyWash", 0] },
              0
            ]
          },
          rewashQty: {
            $cond: [
              { $eq: ["$task_no_washing", 86] },
              { $ifNull: ["$passQtyWash", 0] },
              0
            ]
          },
          bundleCount: 1
        }
      }
    ];
    const detailedRecords = await Washing.aggregate(
      detailedRecordsPipeline
    ).exec();
    const totalRecords = await Washing.countDocuments(
      currentPeriodMatchQuery
    ).exec();

    res.json({
      overallSummary,
      previousDaySummary,
      inspectorSummaryData,
      detailedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching washing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

/* ------------------------------------
Endpoint for Hourly Washing Data Chart
------------------------------------ */
export const getHourlyWashingData = async (req, res) => {
try {
    const {
      startDate,
      endDate,
      moNo,
      packageNo,
      custStyle,
      buyer,
      color,
      size,
      qcId
    } = req.query;

    let matchQuery = {};
    // Date filtering
    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          new Date(startDate)
        ]
      });
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateMatchAnd.push({
        $lte: [
          {
            $dateFromString: {
              dateString: "$washing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(Date.now() + 86400000 * 365 * 10),
              onNull: new Date(Date.now() + 86400000 * 365 * 10)
            }
          },
          endOfDay
        ]
      });
    }
    if (dateMatchAnd.length > 0) {
      matchQuery.$expr = { $and: dateMatchAnd };
    } else {
      // Default to today if no date range
      const todayRange = getDayRange(new Date()); // Ensure getDayRange is defined
      matchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              },
              todayRange.start
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: "$washing_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(Date.now() + 86400000 * 365 * 10),
                  onNull: new Date(Date.now() + 86400000 * 365 * 10)
                }
              },
              todayRange.end
            ]
          }
        ]
      };
    }

    // Other filters
    if (moNo) matchQuery.selectedMono = moNo;
    if (packageNo) matchQuery.package_no = parseInt(packageNo);
    if (custStyle) matchQuery.custStyle = custStyle;
    if (buyer) matchQuery.buyer = buyer;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (qcId) matchQuery.emp_id_washing = qcId;

    const hourlyData = await Washing.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$washing_update_time", 0, 2] }, // Extract HH from HH:MM:SS
          passQtyWash: { $ifNull: ["$passQtyWash", 0] },
          task_no_washing: 1
          // bundle_id: 1 // Assuming each record is one bundle for bundle count
        }
      },
      {
        $group: {
          _id: "$hour",
          totalWashingQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 55] }, "$passQtyWash", 0]
            }
          },
          totalBundles: { $sum: 1 } // Count each document as a bundle
        }
      },
      { $sort: { _id: 1 } } // Sort by hour
    ]).exec();

    // Prepare data for chart (calculate previous hour % change)
    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;

      let washingQtyChange = 0;
      if (prevItem && prevItem.totalWashingQty > 0) {
        washingQtyChange =
          ((item.totalWashingQty - prevItem.totalWashingQty) /
            prevItem.totalWashingQty) *
          100;
      } else if (
        prevItem &&
        prevItem.totalWashingQty === 0 &&
        item.totalWashingQty > 0
      ) {
        washingQtyChange = 100;
      }

      let bundleQtyChange = 0;
      if (prevItem && prevItem.totalBundles > 0) {
        bundleQtyChange =
          ((item.totalBundles - prevItem.totalBundles) /
            prevItem.totalBundles) *
          100;
      } else if (
        prevItem &&
        prevItem.totalBundles === 0 &&
        item.totalBundles > 0
      ) {
        bundleQtyChange = 100;
      }

      return {
        hour: item._id, // HH string
        totalWashingQty: item.totalWashingQty,
        totalBundles: item.totalBundles,
        washingQtyChange: washingQtyChange.toFixed(1),
        bundleQtyChange: bundleQtyChange.toFixed(1)
      };
    });

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly washing summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly summary" });
  }
};