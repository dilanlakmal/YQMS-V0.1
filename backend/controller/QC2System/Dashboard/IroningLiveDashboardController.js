import {
  Ironing ,
} from "../../MongoDB/dbConnectionController.js";

import { getDayRange } from "../../../helpers/helperFunctions.js";

export const getIroningData = async (req, res) => {
  try {
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo,
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId,
      packageNo: queryPackageNo
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
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
              dateString: "$ironing_updated_date",
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

    if (queryMoNo) matchQuery.selectedMono = queryMoNo;
    if (queryPackageNo) matchQuery.package_no = parseInt(queryPackageNo);
    if (queryCustStyle) matchQuery.custStyle = queryCustStyle;
    if (queryBuyer) matchQuery.buyer = queryBuyer;
    if (queryColor) matchQuery.color = queryColor;
    if (querySize) matchQuery.size = querySize;
    if (queryQcId) matchQuery.emp_id_ironing = queryQcId;

    const createDynamicPipeline = (
      field,
      isNumeric = false,
      specificMatch = {}
    ) => {
      const baseFieldMatch = isNumeric
        ? { [field]: { $ne: null } }
        : { [field]: { $ne: null, $ne: "" } };
      const pipeline = [
        { $match: { ...matchQuery, ...baseFieldMatch, ...specificMatch } },
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
      let queryParamName = field;
      if (field === "emp_id_ironing") queryParamName = "qcId";
      else if (field === "selectedMono") queryParamName = "moNo";
      else if (field === "package_no") queryParamName = "packageNo";

      if (req.query[queryParamName]) delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        ...baseFieldMatch,
        ...specificMatch
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_ironing: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$emp_id_ironing",
          eng_name: { $first: "$eng_name_ironing" }
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
    if (queryQcId) delete qcIdsMatch.emp_id_ironing;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_ironing: { $ne: null, $ne: "" }
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
      Ironing.aggregate(createDynamicPipeline("selectedMono")).exec(),
      Ironing.aggregate(createDynamicPipeline("package_no", true)).exec(),
      Ironing.aggregate(createDynamicPipeline("custStyle")).exec(),
      Ironing.aggregate(createDynamicPipeline("buyer")).exec(),
      Ironing.aggregate(createDynamicPipeline("color")).exec(),
      Ironing.aggregate(createDynamicPipeline("size")).exec(),
      Ironing.aggregate(qcIdsPipeline).exec()
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
    console.error("Error fetching Ironing filter options:", error);
    res.status(500).json({ error: "Failed to fetch Ironing filter options" });
  }
};

export const getIroningDashboardData = async (req, res) => {
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
      qcId,
      page = 1,
      limit = 20
    } = req.query;

    let baseMatchQuery = {};
    if (moNo) baseMatchQuery.selectedMono = moNo;
    if (packageNo) baseMatchQuery.package_no = parseInt(packageNo);
    if (custStyle) baseMatchQuery.custStyle = custStyle;
    if (buyer) baseMatchQuery.buyer = buyer;
    if (color) baseMatchQuery.color = color;
    if (size) baseMatchQuery.size = size;
    if (qcId) baseMatchQuery.emp_id_ironing = qcId;

    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
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
              dateString: "$ironing_updated_date",
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
                  dateString: "$ironing_updated_date",
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
                  dateString: "$ironing_updated_date",
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
                dateString: "$ironing_updated_date",
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
                dateString: "$ironing_updated_date",
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
          totalIroningQty: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_ironing", 53] },
                { $ifNull: ["$passQtyIron", 0] },
                0
              ]
            }
          },
          totalRecheckIroningQty: {
            $sum: {
              $cond: [
                { $ne: ["$task_no_ironing", 53] },
                { $ifNull: ["$passQtyIron", 0] },
                0
              ]
            }
          },
          totalBundles: { $sum: 1 }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      Ironing.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      Ironing.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalIroningQty: 0,
      totalRecheckIroningQty: 0,
      totalBundles: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalIroningQty: 0,
      totalRecheckIroningQty: 0,
      totalBundles: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $project: {
          emp_id_ironing: 1,
          eng_name_ironing: 1,
          ironing_updated_date: 1,
          passQtyIron: { $ifNull: ["$passQtyIron", 0] },
          task_no_ironing: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$ironing_updated_date",
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
            emp_id: "$emp_id_ironing",
            date: "$ironing_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_ironing" },
          dailyIroningQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          dailyRecheckIroningQty: {
            $sum: {
              $cond: [{ $ne: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
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
          dailyIroningQty: 1,
          dailyRecheckIroningQty: 1,
          dailyBundles: 1
        }
      }
    ];
    const inspectorSummaryData = await Ironing.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery },
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$ironing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          }
        }
      },
      { $sort: { parsedDate: -1, ironing_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          ironing_updated_date: 1,
          emp_id_ironing: 1,
          eng_name_ironing: 1,
          dept_name_ironing: 1,
          selectedMono: 1,
          package_no: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          ironing_update_time: 1,
          ironingQty: {
            $cond: [
              { $eq: ["$task_no_ironing", 53] },
              { $ifNull: ["$passQtyIron", 0] },
              0
            ]
          },
          recheckIroningQty: {
            $cond: [
              { $ne: ["$task_no_ironing", 53] },
              { $ifNull: ["$passQtyIron", 0] },
              0
            ]
          },
          bundleCount: 1
        }
      }
    ];
    const detailedRecords = await Ironing.aggregate(
      detailedRecordsPipeline
    ).exec();
    const totalRecords = await Ironing.countDocuments(
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
    console.error("Error fetching Ironing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch Ironing dashboard data" });
  }
};

export const getHourlyIroningData = async (req, res) => {
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
    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$ironing_updated_date",
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
              dateString: "$ironing_updated_date",
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
      const todayRange = getDayRange(new Date());
      matchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$ironing_updated_date",
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
                  dateString: "$ironing_updated_date",
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

    if (moNo) matchQuery.selectedMono = moNo;
    if (packageNo) matchQuery.package_no = parseInt(packageNo);
    if (custStyle) matchQuery.custStyle = custStyle;
    if (buyer) matchQuery.buyer = buyer;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (qcId) matchQuery.emp_id_ironing = qcId;

    const hourlyData = await Ironing.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$ironing_update_time", 0, 2] },
          passQtyIron: { $ifNull: ["$passQtyIron", 0] },
          task_no_ironing: 1
        }
      },
      {
        $group: {
          _id: "$hour",
          totalIroningQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          totalBundles: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;
      let ironingQtyChange = 0;
      if (prevItem && prevItem.totalIroningQty > 0)
        ironingQtyChange =
          ((item.totalIroningQty - prevItem.totalIroningQty) /
            prevItem.totalIroningQty) *
          100;
      else if (
        prevItem &&
        prevItem.totalIroningQty === 0 &&
        item.totalIroningQty > 0
      )
        ironingQtyChange = 100;

      let bundleQtyChange = 0;
      if (prevItem && prevItem.totalBundles > 0)
        bundleQtyChange =
          ((item.totalBundles - prevItem.totalBundles) /
            prevItem.totalBundles) *
          100;
      else if (prevItem && prevItem.totalBundles === 0 && item.totalBundles > 0)
        bundleQtyChange = 100;

      return {
        hour: item._id,
        totalIroningQty: item.totalIroningQty,
        totalBundles: item.totalBundles,
        ironingQtyChange: ironingQtyChange.toFixed(1),
        bundleQtyChange: bundleQtyChange.toFixed(1)
      };
    });
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly Ironing summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly Ironing summary" });
  }
};