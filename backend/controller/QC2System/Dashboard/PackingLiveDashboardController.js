import {
  Packing ,              
} from "../../MongoDB/dbConnectionController.js";

import { getDayRange } from "../../../helpers/helperFunctions.js";

export const getPackingData = async (req, res) => {
    try {
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo,
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId, // qcId here is emp_id_packing
      packageNo: queryPackageNo
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
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
              dateString: "$packing_updated_date",
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
    if (queryQcId) matchQuery.emp_id_packing = queryQcId;

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
      if (field === "emp_id_packing") queryParamName = "qcId";
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
      { $match: { ...matchQuery, emp_id_packing: { $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$emp_id_packing",
          eng_name: { $first: "$eng_name_packing" }
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
    if (queryQcId) delete qcIdsMatch.emp_id_packing;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_packing: { $ne: null, $ne: "" }
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
      Packing.aggregate(createDynamicPipeline("selectedMono")).exec(),
      Packing.aggregate(createDynamicPipeline("package_no", true)).exec(),
      Packing.aggregate(createDynamicPipeline("custStyle")).exec(),
      Packing.aggregate(createDynamicPipeline("buyer")).exec(),
      Packing.aggregate(createDynamicPipeline("color")).exec(),
      Packing.aggregate(createDynamicPipeline("size")).exec(),
      Packing.aggregate(qcIdsPipeline).exec()
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
    console.error("Error fetching Packing filter options:", error);
    res.status(500).json({ error: "Failed to fetch Packing filter options" });
  }
};

export const getPackingDashboardData = async (req, res) => {
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
    if (qcId) baseMatchQuery.emp_id_packing = qcId;

    // Always filter by task_no_packing = 62 for primary metrics
    baseMatchQuery.task_no_packing = 62;

    let currentPeriodMatchQuery = { ...baseMatchQuery };
    const currentDateMatchAnd = [];
    if (startDate) {
      currentDateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
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
              dateString: "$packing_updated_date",
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
      Object.keys(currentPeriodMatchQuery).length === 1 &&
      currentPeriodMatchQuery.task_no_packing &&
      !startDate &&
      !endDate
    ) {
      // Only task_no filter is active
      const todayRange = getDayRange(new Date());
      currentPeriodMatchQuery.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$packing_updated_date",
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
                  dateString: "$packing_updated_date",
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

    let previousDayMatchQuery = { ...baseMatchQuery }; // Includes task_no_packing = 62
    previousDayMatchQuery.$expr = {
      $and: [
        {
          $gte: [
            {
              $dateFromString: {
                dateString: "$packing_updated_date",
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
                dateString: "$packing_updated_date",
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
          totalPackingQty: { $sum: { $ifNull: ["$passQtyPack", 0] } }, // Sum of passQtyPack for task_no_packing = 62
          totalOrderCardBundles: {
            $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCards: {
            $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCardQty: {
            $sum: {
              $cond: [
                { $eq: ["$packing_record_id", 0] },
                { $ifNull: ["$passQtyPack", 0] },
                0
              ]
            }
          }
        }
      }
    ];

    const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
      Packing.aggregate([
        { $match: currentPeriodMatchQuery },
        ...summaryAggregation
      ]).exec(),
      Packing.aggregate([
        { $match: previousDayMatchQuery },
        ...summaryAggregation
      ]).exec()
    ]);

    const overallSummary = currentSummaryResult[0] || {
      totalPackingQty: 0,
      totalOrderCardBundles: 0,
      totalDefectCards: 0,
      totalDefectCardQty: 0
    };
    const previousDaySummary = previousDaySummaryResult[0] || {
      totalPackingQty: 0,
      totalOrderCardBundles: 0,
      totalDefectCards: 0,
      totalDefectCardQty: 0
    };

    const inspectorSummaryPipeline = [
      { $match: currentPeriodMatchQuery }, // This already has task_no_packing = 62
      {
        $project: {
          emp_id_packing: 1,
          eng_name_packing: 1,
          packing_updated_date: 1,
          passQtyPack: { $ifNull: ["$passQtyPack", 0] },
          packing_record_id: 1,
          parsedDate: {
            $dateFromString: {
              dateString: "$packing_updated_date",
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
            emp_id: "$emp_id_packing",
            date: "$packing_updated_date",
            parsedDate: "$parsedDate"
          },
          eng_name: { $first: "$eng_name_packing" },
          dailyTotalPackingQty: { $sum: "$passQtyPack" },
          dailyOrderCardBundles: {
            $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
          },
          dailyDefectCards: {
            $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
          },
          dailyDefectCardQty: {
            $sum: {
              $cond: [{ $eq: ["$packing_record_id", 0] }, "$passQtyPack", 0]
            }
          }
        }
      },
      { $sort: { "_id.emp_id": 1, "_id.parsedDate": 1 } },
      {
        $project: {
          _id: 0,
          emp_id: "$_id.emp_id",
          eng_name: "$eng_name",
          date: "$_id.date",
          dailyTotalPackingQty: 1,
          dailyOrderCardBundles: 1,
          dailyDefectCards: 1,
          dailyDefectCardQty: 1
        }
      }
    ];
    const inspectorSummaryData = await Packing.aggregate(
      inspectorSummaryPipeline
    ).exec();

    const skipRecords = (parseInt(page) - 1) * parseInt(limit);
    const detailedRecordsPipeline = [
      { $match: currentPeriodMatchQuery }, // This already has task_no_packing = 62
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$packing_updated_date",
              format: "%m/%d/%Y",
              onError: new Date(0),
              onNull: new Date(0)
            }
          },
          cardType: {
            $cond: [
              { $eq: ["$packing_record_id", 0] },
              "Defect Card",
              "Order Card"
            ]
          }
        }
      },
      { $sort: { parsedDate: -1, packing_update_time: -1 } },
      { $skip: skipRecords },
      { $limit: parseInt(limit) },
      {
        $project: {
          packing_updated_date: 1,
          emp_id_packing: 1,
          eng_name_packing: 1,
          dept_name_packing: 1,
          selectedMono: 1,
          package_no: 1,
          cardType: 1,
          custStyle: 1,
          buyer: 1,
          color: 1,
          size: 1,
          packing_update_time: 1,
          passQtyPack: 1, // This is the qty for the specific card
          packing_record_id: 1 // For client-side logic if needed, though cardType is better
        }
      }
    ];
    const detailedRecords = await Packing.aggregate(
      detailedRecordsPipeline
    ).exec();
    const totalRecords = await Packing.countDocuments(
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
    console.error("Error fetching Packing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch Packing dashboard data" });
  }
};

export const getHourlyPackingSummary = async (req, res) => {
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
    matchQuery.task_no_packing = 62; // Crucial for packing

    const dateMatchAnd = [];
    if (startDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$packing_updated_date",
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
              dateString: "$packing_updated_date",
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
                  dateString: "$packing_updated_date",
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
                  dateString: "$packing_updated_date",
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
    if (qcId) matchQuery.emp_id_packing = qcId;

    const hourlyData = await Packing.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$packing_update_time", 0, 2] },
          passQtyPack: { $ifNull: ["$passQtyPack", 0] },
          packing_record_id: 1
        }
      },
      {
        $group: {
          _id: "$hour",
          totalPackingQty: { $sum: "$passQtyPack" },
          totalOrderCardBundles: {
            $sum: { $cond: [{ $ne: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCards: {
            $sum: { $cond: [{ $eq: ["$packing_record_id", 0] }, 1, 0] }
          },
          totalDefectCardQty: {
            $sum: {
              $cond: [{ $eq: ["$packing_record_id", 0] }, "$passQtyPack", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;

      const calculateChange = (current, previous) => {
        if (previous > 0) return ((current - previous) / previous) * 100;
        if (current > 0 && previous === 0) return 100;
        return 0;
      };

      return {
        hour: item._id,
        totalPackingQty: item.totalPackingQty,
        totalOrderCardBundles: item.totalOrderCardBundles,
        totalDefectCards: item.totalDefectCards,
        totalDefectCardQty: item.totalDefectCardQty,
        packingQtyChange: calculateChange(
          item.totalPackingQty,
          prevItem?.totalPackingQty || 0
        ).toFixed(1),
        orderCardBundlesChange: calculateChange(
          item.totalOrderCardBundles,
          prevItem?.totalOrderCardBundles || 0
        ).toFixed(1),
        defectCardsChange: calculateChange(
          item.totalDefectCards,
          prevItem?.totalDefectCards || 0
        ).toFixed(1),
        defectCardQtyChange: calculateChange(
          item.totalDefectCardQty,
          prevItem?.totalDefectCardQty || 0
        ).toFixed(1)
      };
    });
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly Packing summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly Packing summary" });
  }
};