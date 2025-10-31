import {
  CuttingInspection,
  CuttingMeasurementPoint,                
} from "../../MongoDB/dbConnectionController.js"; 
import { normalizeDateString } from "../../../Helpers/helperFunctions.js";

// --- Trend Analysis Filter Options ---//
export const getCuttingFilterMo = async (req, res) => {
    try {
      const { search, startDate, endDate, tableNo, buyer } = req.query;
      const match = {};
      if (search) match.moNo = { $regex: search, $options: "i" };
      if (tableNo) match.tableNo = { $regex: tableNo, $options: "i" };
      if (buyer) match.buyer = { $regex: buyer, $options: "i" };
      if (startDate || endDate) {
        match.$expr = match.$expr || {};
        match.$expr.$and = match.$expr.$and || [];
        if (startDate)
          match.$expr.$and.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(0)
                }
              },
              {
                $dateFromString: {
                  dateString: normalizeDateString(startDate),
                  format: "%m/%d/%Y",
                  onError: new Date(0)
                }
              }
            ]
          });
        if (endDate)
          match.$expr.$and.push({
            $lte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date()
                }
              },
              {
                $dateFromString: {
                  dateString: normalizeDateString(endDate),
                  format: "%m/%d/%Y",
                  onError: new Date()
                }
              }
            ]
          });
      }
      const moNumbers = await CuttingInspection.distinct("moNo", match);
      res.json(moNumbers.sort());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch MO numbers for filter" });
    }
};

export const getCuttingFilterTable = async (req, res) => {
    try {
        const { search, startDate, endDate, moNo, buyer } = req.query;
        const match = {};
        if (moNo) match.moNo = moNo; 
        else if (search && !moNo)
          match.tableNo = { $regex: search, $options: "i" }; 
        else if (search && moNo) match.tableNo = { $regex: search, $options: "i" };
    
        if (buyer) match.buyer = { $regex: buyer, $options: "i" };
        if (startDate || endDate) {
          /* ... date filter logic ... */
        }
        const tableNumbers = await CuttingInspection.distinct("tableNo", match);
        res.json(tableNumbers.sort());
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch Table numbers for filter" });
      }
};

export const getCuttingFilterBuyer = async (req, res) => {
    try {
      const { search, startDate, endDate, moNo, tableNo } = req.query;
      const match = {};
      if (search) match.buyer = { $regex: search, $options: "i" };
      if (moNo) match.moNo = moNo;
      if (tableNo) match.tableNo = tableNo;
      if (startDate || endDate) {
        /* ... date filter logic ... */
      }
      const buyers = await CuttingInspection.distinct("buyer", {
        ...match,
        buyer: { $ne: null, $ne: "" }
      });
      res.json(buyers.sort());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Buyers for filter" });
    }
};

export const getCuttingFiltergarment = async (req, res) => { 
  try {
      const garmentTypes = await CuttingInspection.distinct("garmentType", {
        garmentType: { $ne: null, $ne: "" }
      });
      res.json(garmentTypes.sort());
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch Garment Types for filter" });
    }
};

export const getCuttingPart = async (req, res) => {
  try {
      const { garmentType } = req.query;
      const match = {};
      if (garmentType) match.panel = garmentType; 
      const partNamesData = await CuttingMeasurementPoint.aggregate([
        { $match: match },
        { $group: { _id: "$panelIndexName" } },
        { $project: { _id: 0, partName: "$_id" } },
        { $sort: { partName: 1 } }
      ]);
      res.json(partNamesData.map((p) => p.partName));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Part Names" });
    }
};

// --- Trend Analysis Data Endpoints ---

// 1. Garment Type Trend Analysis
export const getGarmentTypeTrend = async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer } = req.query;
      const matchConditions = {};
      if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
      if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
      if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
    
      if (startDate || endDate) {
        matchConditions.$expr = matchConditions.$expr || {};
        matchConditions.$expr.$and = matchConditions.$expr.$and || [];
        if (startDate)
          matchConditions.$expr.$and.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(0)
                }
              },
              {
                $dateFromString: {
                  dateString: normalizeDateString(startDate),
                  format: "%m/%d/%Y",
                  onError: new Date(0)
                }
              }
            ]
          });
        if (endDate)
          matchConditions.$expr.$and.push({
            $lte: [
              {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date()
                }
              },
              {
                $dateFromString: {
                  dateString: normalizeDateString(endDate),
                  format: "%m/%d/%Y",
                  onError: new Date()
                }
              }
            ]
          });
      }
    
      try {
        const data = await CuttingInspection.aggregate([
          { $match: matchConditions },
         
          {
            $project: {
              garmentType: 1,
              moNo: 1,
              tableNo: 1,
              totalInspectionQty: 1,
              totalBundleQty: 1,
              bundleQtyCheck: 1,
              totalPcsTop: {
                $sum: "$inspectionData.pcsSize.top"
              },
              totalPcsMiddle: {
                $sum: "$inspectionData.pcsSize.middle"
              },
              totalPcsBottom: {
                $sum: "$inspectionData.pcsSize.bottom"
              },
              totalPassTop: {
                $sum: "$inspectionData.passSize.top"
              },
              totalPassMiddle: {
                $sum: "$inspectionData.passSize.middle"
              },
              totalPassBottom: {
                $sum: "$inspectionData.passSize.bottom"
              },
              totalRejectTop: {
                $sum: "$inspectionData.rejectSize.top"
              },
              totalRejectMiddle: {
                $sum: "$inspectionData.rejectSize.middle"
              },
              totalRejectBottom: {
                $sum: "$inspectionData.rejectSize.bottom"
              },
              totalRejectMeasTop: {
                $sum: "$inspectionData.rejectMeasurementSize.top"
              },
              totalRejectMeasMiddle: {
                $sum: "$inspectionData.rejectMeasurementSize.middle"
              },
              totalRejectMeasBottom: {
                $sum: "$inspectionData.rejectMeasurementSize.bottom"
              },
              totalRejectGarmentTop: {
                $sum: "$inspectionData.rejectGarmentSize.top"
              },
              totalRejectGarmentMiddle: {
                $sum: "$inspectionData.rejectGarmentSize.middle"
              },
              totalRejectGarmentBottom: {
                $sum: "$inspectionData.rejectGarmentSize.bottom"
              },
              totalPcsAll: {
                $sum: "$inspectionData.totalPcsSize"
              },
              sumTotalReject: {
                $sum: "$inspectionData.rejectSize.total"
              }
            }
          },
          {
            $group: {
              _id: "$garmentType",
              noOfInspections: {
                $addToSet: { moNo: "$moNo", tableNo: "$tableNo" }
              },
              totalBundleQty: { $sum: "$totalBundleQty" },
              bundleQtyCheck: { $sum: "$bundleQtyCheck" },
              totalInspectedQty: { $sum: "$totalPcsAll" },
              sumTotalPcsTop: { $sum: "$totalPcsTop" },
              sumTotalPcsMiddle: { $sum: "$totalPcsMiddle" },
              sumTotalPcsBottom: { $sum: "$totalPcsBottom" },
              sumTotalPassTop: { $sum: "$totalPassTop" },
              sumTotalPassMiddle: { $sum: "$totalPassMiddle" },
              sumTotalPassBottom: { $sum: "$totalPassBottom" },
              sumTotalRejectTop: { $sum: "$totalRejectTop" },
              sumTotalRejectMiddle: { $sum: "$totalRejectMiddle" },
              sumTotalRejectBottom: { $sum: "$totalRejectBottom" },
              sumTotalRejectMeasTop: { $sum: "$totalRejectMeasTop" },
              sumTotalRejectMeasMiddle: { $sum: "$totalRejectMeasMiddle" },
              sumTotalRejectMeasBottom: { $sum: "$totalRejectMeasBottom" },
              sumTotalRejectGarmentTop: { $sum: "$totalRejectGarmentTop" },
              sumTotalRejectGarmentMiddle: { $sum: "$totalRejectGarmentMiddle" },
              sumTotalRejectGarmentBottom: { $sum: "$totalRejectGarmentBottom" },
              aqlRelevantData: {
                $push: {
                  totalInspectionQty: "$totalInspectionQty",
                  sumTotalReject: "$sumTotalReject",
                  totalPcsAll: "$totalPcsAll"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              garmentType: "$_id",
              noOfInspections: { $size: "$noOfInspections" },
              totalBundleQty: 1,
              bundleQtyCheck: 1,
              totalInspectedQty: 1,
              totalPcs: {
                top: "$sumTotalPcsTop",
                middle: "$sumTotalPcsMiddle",
                bottom: "$sumTotalPcsBottom"
              },
              totalPass: {
                top: "$sumTotalPassTop",
                middle: "$sumTotalPassMiddle",
                bottom: "$sumTotalPassBottom"
              },
              totalReject: {
                top: "$sumTotalRejectTop",
                middle: "$sumTotalRejectMiddle",
                bottom: "$sumTotalRejectBottom"
              },
              totalRejectMeasurements: {
                top: "$sumTotalRejectMeasTop",
                middle: "$sumTotalRejectMeasMiddle",
                bottom: "$sumTotalRejectMeasBottom"
              },
              totalRejectDefects: {
                top: "$sumTotalRejectGarmentTop",
                middle: "$sumTotalRejectGarmentMiddle",
                bottom: "$sumTotalRejectGarmentBottom"
              },
              aqlRelevantData: 1
            }
          },
          { $sort: { garmentType: 1 } }
        ]);
    
        const getAQLResultStatusServer = (
          totalInspectionQty,
          sumTotalReject,
          totalPcsAll
        ) => {
          if (!totalInspectionQty || totalPcsAll < totalInspectionQty) {
            return { key: "pending" };
          }
          if (totalInspectionQty >= 30 && totalInspectionQty < 45) {
            return sumTotalReject > 0 ? { key: "reject" } : { key: "pass" };
          }
          if (totalInspectionQty >= 45 && totalInspectionQty < 60) {
            return sumTotalReject > 0 ? { key: "reject" } : { key: "pass" };
          }
          if (totalInspectionQty >= 60 && totalInspectionQty < 90) {
            return sumTotalReject > 1 ? { key: "reject" } : { key: "pass" };
          }
          if (totalInspectionQty >= 90 && totalInspectionQty < 135) {
            return sumTotalReject > 2 ? { key: "reject" } : { key: "pass" };
          }
          if (totalInspectionQty >= 135 && totalInspectionQty < 210) {
            return sumTotalReject > 3 ? { key: "reject" } : { key: "pass" };
          }
          if (totalInspectionQty >= 210 && totalInspectionQty < 315) {
            return sumTotalReject > 5 ? { key: "reject" } : { key: "pass" };
          }
          if (totalInspectionQty >= 315) {
            return sumTotalReject > 7 ? { key: "reject" } : { key: "pass" };
          }
          return { key: "pending" };
        };
    
        const processedData = data.map((item) => {
          let aqlPass = 0,
            aqlReject = 0,
            aqlPending = 0;
          item.aqlRelevantData.forEach((aqlItem) => {
            const status = getAQLResultStatusServer(
              aqlItem.totalInspectionQty,
              aqlItem.sumTotalReject,
              aqlItem.totalPcsAll
            );
            if (status.key === "pass") aqlPass++;
            else if (status.key === "reject") aqlReject++;
            else aqlPending++;
          });
    
          const totalPcsOverall =
            (item.totalPcs.top || 0) +
            (item.totalPcs.middle || 0) +
            (item.totalPcs.bottom || 0);
          const totalPassOverall =
            (item.totalPass.top || 0) +
            (item.totalPass.middle || 0) +
            (item.totalPass.bottom || 0);
    
          return {
            ...item,
            passRate: {
              top:
                item.totalPcs.top > 0
                  ? ((item.totalPass.top || 0) / item.totalPcs.top) * 100
                  : 0,
              middle:
                item.totalPcs.middle > 0
                  ? ((item.totalPass.middle || 0) / item.totalPcs.middle) * 100
                  : 0,
              bottom:
                item.totalPcs.bottom > 0
                  ? ((item.totalPass.bottom || 0) / item.totalPcs.bottom) * 100
                  : 0,
              overall:
                totalPcsOverall > 0 ? (totalPassOverall / totalPcsOverall) * 100 : 0
            },
            aqlSummary: { pass: aqlPass, reject: aqlReject, pending: aqlPending }
          };
        });
        res.json(processedData);
      } catch (error) {
        console.error("Garment Type Trend Error:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch garment type trend data" });
      }
};

// 2. Measurement Points Trend Analysis
export const getMeasurementPointsTrend = async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer, garmentType, partName } =
        req.query;
      const matchConditions = {};
     
      if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
      if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
      if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
      if (garmentType) matchConditions.garmentType = garmentType;
 
    
      if (startDate || endDate) {
        /* ... date filter logic ... */
      }
    
      try {
        const pipeline = [
          { $match: matchConditions },
          { $unwind: "$inspectionData" },
          { $unwind: "$inspectionData.bundleInspectionData" },
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData"
          },
          ...(partName
            ? [
                {
                  $match: {
                    "inspectionData.bundleInspectionData.measurementInsepctionData.partName":
                      partName
                  }
                }
              ]
            : []),
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
          },
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
          },
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
          },
          {
            $project: {
              inspectionDate: "$inspectionDate",
              garmentType: "$garmentType",
              partName:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.partName",
              measurementPoint:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
              value:
                "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
              toleranceMin: "$inspectionData.tolerance.min",
              toleranceMax: "$inspectionData.tolerance.max"
            }
          },
          {
            $group: {
              _id: {
                date: "$inspectionDate", 
                garmentType: "$garmentType",
                partName: "$partName",
                measurementPoint: "$measurementPoint"
              },
              withinTol: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$value", "$toleranceMin"] },
                        { $lte: ["$value", "$toleranceMax"] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              outOfTolNeg: {
                $sum: { $cond: [{ $lt: ["$value", "$toleranceMin"] }, 1, 0] }
              },
              outOfTolPos: {
                $sum: { $cond: [{ $gt: ["$value", "$toleranceMax"] }, 1, 0] }
              },
              totalPoints: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: {
                garmentType: "$_id.garmentType",
                partName: "$_id.partName",
                measurementPoint: "$_id.measurementPoint"
              },
              dailyData: {
                $push: {
                  date: "$_id.date",
                  withinTol: "$withinTol",
                  outOfTolNeg: "$outOfTolNeg",
                  outOfTolPos: "$outOfTolPos",
                  passRate: {
                    $cond: [
                      { $gt: ["$totalPoints", 0] },
                      {
                        $multiply: [
                          { $divide: ["$withinTol", "$totalPoints"] },
                          100
                        ]
                      },
                      0
                    ]
                  }
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              garmentType: "$_id.garmentType",
              partName: "$_id.partName",
              measurementPoint: "$_id.measurementPoint",
              dailyData: 1
            }
          },
          { $sort: { garmentType: 1, partName: 1, measurementPoint: 1 } }
        ];
    
        const result = await CuttingInspection.aggregate(pipeline);
    
        const dateHeaders = [
          ...new Set(result.flatMap((r) => r.dailyData.map((d) => d.date)))
        ].sort();
        const transformedData = result.map((item) => {
          const valuesByDate = {};
          dateHeaders.forEach((header) => {
            const dayData = item.dailyData.find((d) => d.date === header);
            valuesByDate[header] = dayData
              ? {
                  withinTol: dayData.withinTol,
                  outOfTolNeg: dayData.outOfTolNeg,
                  outOfTolPos: dayData.outOfTolPos,
                  passRate: dayData.passRate
                }
              : { withinTol: 0, outOfTolNeg: 0, outOfTolPos: 0, passRate: 0 };
          });
          return {
            garmentType: item.garmentType,
            partName: item.partName,
            measurementPoint: item.measurementPoint,
            values: valuesByDate
          };
        });
    
        res.json({ headers: dateHeaders, data: transformedData });
      } catch (error) {
        console.error("Measurement Points Trend Error:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch measurement points trend data" });
      }
};

// 3. Fabric Defect Trend Chart
export const getFabricDefectTrend = async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer, garmentType, partName } =
        req.query;
      const matchConditions = {};
      if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
      if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
      if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
      if (garmentType) matchConditions.garmentType = garmentType;
      if (startDate || endDate) {
        /* ... date filter logic ... */
      }
    
      try {
        const pipeline = [
          { $match: matchConditions },
          { $unwind: "$inspectionData" },
          { $unwind: "$inspectionData.bundleInspectionData" },
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData"
          },
          ...(partName
            ? [
                {
                  $match: {
                    "inspectionData.bundleInspectionData.measurementInsepctionData.partName":
                      partName
                  }
                }
              ]
            : []),
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
          },
          {
            $unwind:
              "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
          },
          {
            $group: {
              _id: {
                date: "$inspectionDate",
                garmentType: "$garmentType",
                partName:
                  "$inspectionData.bundleInspectionData.measurementInsepctionData.partName"
              },
              totalRejectGarmentsForDay: {
                $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.totalDefects"
              }, 
              totalPcsForDay: { $sum: "$inspectionData.totalPcsSize" } 
            }
          },
          {
            $group: {
              _id: {
                garmentType: "$_id.garmentType",
                partName: "$_id.partName"
              },
              dailyData: {
                $push: {
                  date: "$_id.date",
                  rejectCount: "$totalRejectGarmentsForDay",
                  defectRate: {
                    $cond: [
                      { $gt: ["$totalPcsForDay", 0] },
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$totalRejectGarmentsForDay",
                              "$totalPcsForDay"
                            ]
                          },
                          100
                        ]
                      },
                      0
                    ]
                  }
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              garmentType: "$_id.garmentType",
              partName: "$_id.partName",
              dailyData: 1
            }
          },
          { $sort: { garmentType: 1, partName: 1 } }
        ];
    
        const result = await CuttingInspection.aggregate(pipeline);
    
        const dateHeaders = [
          ...new Set(result.flatMap((r) => r.dailyData.map((d) => d.date)))
        ].sort();
        const transformedData = result.map((item) => {
          const valuesByDate = {};
          dateHeaders.forEach((header) => {
            const dayData = item.dailyData.find((d) => d.date === header);
            valuesByDate[header] = dayData
              ? { rejectCount: dayData.rejectCount, defectRate: dayData.defectRate }
              : { rejectCount: 0, defectRate: 0 };
          });
          return {
            garmentType: item.garmentType,
            partName: item.partName,
            values: valuesByDate
          };
        });
        res.json({ headers: dateHeaders, data: transformedData });
      } catch (error) {
        console.error("Fabric Defect Trend Error:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch fabric defect trend data" });
      }
};

// 4. Top Measurement Issues
export const getTopMeasurementIssues = async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer } = req.query;
  const matchConditions = {};
  // ... (build matchConditions) ...
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
  if (startDate || endDate) {
    /* ... date filter logic ... */
  }

  try {
    const data = await CuttingInspection.aggregate([
      { $match: matchConditions },
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements"
      },
      {
        $group: {
          _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementPointName",
          passPoints: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                    "Pass"
                  ]
                },
                1,
                0
              ]
            }
          },
          rejectTolNegPoints: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                        "Fail"
                      ]
                    },
                    {
                      $lt: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                        "$inspectionData.tolerance.min"
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          rejectTolPosPoints: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.status",
                        "Fail"
                      ]
                    },
                    {
                      $gt: [
                        "$inspectionData.bundleInspectionData.measurementInsepctionData.measurementPointsData.measurementValues.measurements.valuedecimal",
                        "$inspectionData.tolerance.max"
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalPoints: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          measurementPoint: "$_id",
          passPoints: 1,
          rejectTolNegPoints: 1,
          rejectTolPosPoints: 1,
          issuePercentage: {
            $cond: [
              { $gt: ["$totalPoints", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ["$rejectTolNegPoints", "$rejectTolPosPoints"] },
                      "$totalPoints"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { issuePercentage: -1 } },
      { $limit: 10 } 
    ]);
    res.json(data);
  } catch (error) {
    console.error("Top Measurement Issues Error:", error);
    res.status(500).json({ message: "Failed to fetch top measurement issues" });
  }
};

// 5. Top Defect Issues
export const getTopDefectIssues = async (req, res) => {
    const { startDate, endDate, moNo, tableNo, buyer } = req.query;
  const matchConditions = {};
  if (moNo) matchConditions.moNo = { $regex: moNo, $options: "i" };
  if (tableNo) matchConditions.tableNo = { $regex: tableNo, $options: "i" };
  if (buyer) matchConditions.buyer = { $regex: buyer, $options: "i" };
  if (startDate || endDate) {
    //
  }

  try {
    const data = await CuttingInspection.aggregate([
      { $match: matchConditions },
      { $unwind: "$inspectionData" },
      { $unwind: "$inspectionData.bundleInspectionData" },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData"
      },
      {
        $unwind:
          "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects"
      },
      {
        $group: {
          _id: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectName",
          defectQty: {
            $sum: "$inspectionData.bundleInspectionData.measurementInsepctionData.fabricDefects.defectData.defects.defectQty"
          }
        }
      },
      {
        $lookup: {
          from: "cuttinginspections", 
          pipeline: [
            { $match: matchConditions },
            { $unwind: "$inspectionData" },
            {
              $group: {
                _id: null,
                totalInspectedPieces: { $sum: "$inspectionData.totalPcsSize" }
              }
            }
          ],
          as: "total_inspected_info"
        }
      },
      {
        $unwind: {
          path: "$total_inspected_info",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          defectName: "$_id",
          // defectNameKhmer:  
          // defectNameChinese: 
          defectQty: 1,
          defectRate: {
            $cond: [
              {
                $and: [
                  { $gt: ["$defectQty", 0] },
                  { $gt: ["$total_inspected_info.totalInspectedPieces", 0] }
                ]
              },
              {
                $multiply: [
                  {
                    $divide: [
                      "$defectQty",
                      "$total_inspected_info.totalInspectedPieces"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }, 
      { $limit: 10 } 
    ]);
    res.json(data);
  } catch (error) {
    console.error("Top Defect Issues Error:", error);
    res.status(500).json({ message: "Failed to fetch top defect issues" });
  }
};

