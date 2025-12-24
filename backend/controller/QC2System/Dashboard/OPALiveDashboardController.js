import {
  OPA ,              
} from "../../MongoDB/dbConnectionController.js";

import { getDayRange } from "../../../helpers/helperFunctions.js";

// Endpoint to fetch filter options for OPA Dashboard
export const getFilterOptions = async (req, res) => {
  try {
    const {
      startDate: queryStartDate,
      endDate: queryEndDate,
      moNo: queryMoNo,
      custStyle: queryCustStyle,
      buyer: queryBuyer,
      color: queryColor,
      size: querySize,
      qcId: queryQcId, // qcId here is emp_id_opa
      packageNo: queryPackageNo
    } = req.query;

    let matchQuery = {};

    const dateMatchAnd = [];
    if (queryStartDate) {
      dateMatchAnd.push({
        $gte: [
          {
            $dateFromString: {
              dateString: "$opa_updated_date",
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
              dateString: "$opa_updated_date",
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
    if (queryQcId) matchQuery.emp_id_opa = queryQcId;

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
      if (
        req.query[
          field === "emp_id_opa"
            ? "qcId"
            : field === "selectedMono"
            ? "moNo"
            : field === "package_no"
            ? "packageNo"
            : field
        ]
      )
        delete tempMatch[field];
      pipeline[0].$match = {
        ...tempMatch,
        ...baseFieldMatch,
        ...specificMatch
      };
      return pipeline;
    };

    const qcIdsPipeline = [
      { $match: { ...matchQuery, emp_id_opa: { $ne: null, $ne: "" } } },
      { $group: { _id: "$emp_id_opa", eng_name: { $first: "$eng_name_opa" } } },
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
    if (queryQcId) delete qcIdsMatch.emp_id_opa;
    qcIdsPipeline[0].$match = {
      ...qcIdsMatch,
      emp_id_opa: { $ne: null, $ne: "" }
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
      OPA.aggregate(createDynamicPipeline("selectedMono")).exec(),
      OPA.aggregate(createDynamicPipeline("package_no", true)).exec(),
      OPA.aggregate(createDynamicPipeline("custStyle")).exec(),
      OPA.aggregate(createDynamicPipeline("buyer")).exec(),
      OPA.aggregate(createDynamicPipeline("color")).exec(),
      OPA.aggregate(createDynamicPipeline("size")).exec(),
      OPA.aggregate(qcIdsPipeline).exec()
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
    console.error("Error fetching OPA filter options:", error);
    res.status(500).json({ error: "Failed to fetch OPA filter options" });
  }
};

// Endpoint to fetch OPA Dashboard data
export const getOPADashboardData = async (req, res) => {
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
          qcId, // qcId is emp_id_opa
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
        if (qcId) baseMatchQuery.emp_id_opa = qcId;
    
        let currentPeriodMatchQuery = { ...baseMatchQuery };
        const currentDateMatchAnd = [];
        if (startDate) {
          currentDateMatchAnd.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: "$opa_updated_date",
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
                  dateString: "$opa_updated_date",
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
                      dateString: "$opa_updated_date",
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
                      dateString: "$opa_updated_date",
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
                    dateString: "$opa_updated_date",
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
                    dateString: "$opa_updated_date",
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
              totalOPAQty: {
                $sum: {
                  $cond: [
                    { $eq: ["$task_no_opa", 60] },
                    { $ifNull: ["$passQtyOPA", 0] },
                    0
                  ]
                }
              },
              totalRecheckOPAQty: {
                $sum: {
                  $cond: [
                    { $ne: ["$task_no_opa", 60] },
                    { $ifNull: ["$passQtyOPA", 0] },
                    0
                  ]
                }
              }, // Assuming non-60 is recheck
              totalBundles: { $sum: 1 }
            }
          }
        ];
    
        const [currentSummaryResult, previousDaySummaryResult] = await Promise.all([
          OPA.aggregate([
            { $match: currentPeriodMatchQuery },
            ...summaryAggregation
          ]).exec(),
          OPA.aggregate([
            { $match: previousDayMatchQuery },
            ...summaryAggregation
          ]).exec()
        ]);
    
        const overallSummary = currentSummaryResult[0] || {
          totalOPAQty: 0,
          totalRecheckOPAQty: 0,
          totalBundles: 0
        };
        const previousDaySummary = previousDaySummaryResult[0] || {
          totalOPAQty: 0,
          totalRecheckOPAQty: 0,
          totalBundles: 0
        };
    
        const inspectorSummaryPipeline = [
          { $match: currentPeriodMatchQuery },
          {
            $project: {
              emp_id_opa: 1,
              eng_name_opa: 1,
              opa_updated_date: 1,
              passQtyOPA: { $ifNull: ["$passQtyOPA", 0] },
              task_no_opa: 1,
              parsedDate: {
                $dateFromString: {
                  dateString: "$opa_updated_date",
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
                emp_id: "$emp_id_opa",
                date: "$opa_updated_date",
                parsedDate: "$parsedDate"
              },
              eng_name: { $first: "$eng_name_opa" },
              dailyOPAQty: {
                $sum: { $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
              },
              dailyRecheckOPAQty: {
                $sum: { $cond: [{ $ne: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
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
              dailyOPAQty: 1,
              dailyRecheckOPAQty: 1,
              dailyBundles: 1
            }
          }
        ];
        const inspectorSummaryData = await OPA.aggregate(
          inspectorSummaryPipeline
        ).exec();
    
        const skipRecords = (parseInt(page) - 1) * parseInt(limit);
        const detailedRecordsPipeline = [
          { $match: currentPeriodMatchQuery },
          {
            $addFields: {
              parsedDate: {
                $dateFromString: {
                  dateString: "$opa_updated_date",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              }
            }
          },
          { $sort: { parsedDate: -1, opa_update_time: -1 } },
          { $skip: skipRecords },
          { $limit: parseInt(limit) },
          {
            $project: {
              opa_updated_date: 1,
              emp_id_opa: 1,
              eng_name_opa: 1,
              dept_name_opa: 1,
              selectedMono: 1,
              package_no: 1,
              custStyle: 1,
              buyer: 1,
              color: 1,
              size: 1,
              opa_update_time: 1,
              opaQty: {
                $cond: [
                  { $eq: ["$task_no_opa", 60] },
                  { $ifNull: ["$passQtyOPA", 0] },
                  0
                ]
              },
              recheckOPAQty: {
                $cond: [
                  { $ne: ["$task_no_opa", 60] },
                  { $ifNull: ["$passQtyOPA", 0] },
                  0
                ]
              },
              bundleCount: 1 // Assuming 'count' field in schema means total pieces in bundle, or 1 if it's bundle count
            }
          }
        ];
        const detailedRecords = await OPA.aggregate(detailedRecordsPipeline).exec();
        const totalRecords = await OPA.countDocuments(
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
        console.error("Error fetching OPA dashboard data:", error);
        res.status(500).json({ error: "Failed to fetch OPA dashboard data" });
      }
};

// Endpoint for Hourly OPA Data Chart
export const getHourlyOPAData = async (req, res) => {
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
              dateString: "$opa_updated_date",
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
              dateString: "$opa_updated_date",
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
                  dateString: "$opa_updated_date",
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
                  dateString: "$opa_updated_date",
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
    if (qcId) matchQuery.emp_id_opa = qcId;

    const hourlyData = await OPA.aggregate([
      { $match: matchQuery },
      {
        $project: {
          hour: { $substr: ["$opa_update_time", 0, 2] },
          passQtyOPA: { $ifNull: ["$passQtyOPA", 0] },
          task_no_opa: 1
        }
      },
      {
        $group: {
          _id: "$hour",
          totalOPAQty: {
            $sum: { $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0] }
          },
          totalBundles: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();

    const chartData = hourlyData.map((item, index, arr) => {
      const prevItem = index > 0 ? arr[index - 1] : null;
      let opaQtyChange = 0;
      if (prevItem && prevItem.totalOPAQty > 0)
        opaQtyChange =
          ((item.totalOPAQty - prevItem.totalOPAQty) / prevItem.totalOPAQty) *
          100;
      else if (prevItem && prevItem.totalOPAQty === 0 && item.totalOPAQty > 0)
        opaQtyChange = 100;

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
        totalOPAQty: item.totalOPAQty,
        totalBundles: item.totalBundles,
        opaQtyChange: opaQtyChange.toFixed(1),
        bundleQtyChange: bundleQtyChange.toFixed(1)
      };
    });
    res.json(chartData);
  } catch (error) {
    console.error("Error fetching hourly OPA summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly OPA summary" });
  }
};