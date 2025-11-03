import {
  HTFirstOutput,
  SCCDailyTesting,
  DailyTestingHTFU,
  HTInspectionReport,
  UserMain,
  FUFirstOutput,
  DailyTestingFUQC,
  EMBReport,
  ElasticReport,
  UserProd,
} from "../../MongoDB/dbConnectionController.js";
import {
  getConsolidatedDateFormats,
} from "../../../helpers/helperFunctions.js";

export const getFinalHTreport = async (req, res) => {
  try {
      const { startDate, endDate, empId, moNo, machineNo } = req.query;
  
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Start date and end date are required." });
      }
  
      // --- Build Filters ---
      const baseFilter = {};
      if (empId && empId !== "All") baseFilter.emp_id = empId;
      if (moNo && moNo !== "All") baseFilter.moNo = moNo;
      if (machineNo && machineNo !== "All") baseFilter.machineNo = machineNo;
  
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
  
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
  
      const dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
      const finalFilter = { ...baseFilter, ...dateFilter };
      const dropdownOptionsFilter = { ...dateFilter };
  
      // --- Execute All Queries Concurrently ---
      // NOTE: For this to work, ensure ALL 4 schemas have `timestamps: true`
      const [
        firstOutputData,
        dailyWashingData,
        machineCalibrationData,
        htInspectionData,
        uniqueEmpIds_1,
        uniqueEmpIds_2,
        uniqueEmpIds_3,
        uniqueEmpIds_4,
        uniqueMoNos_1,
        uniqueMoNos_2,
        uniqueMoNos_3,
        uniqueMoNos_4
      ] = await Promise.all([
        // Data queries
        HTFirstOutput.find(finalFilter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserMain // MODIFICATION: Changed from UserProd
          })
          .lean(),
        SCCDailyTesting.find(finalFilter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserMain // MODIFICATION: Changed from UserProd
          })
          .lean(),
        DailyTestingHTFU.find(finalFilter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserMain // MODIFICATION: Changed from UserProd
          })
          .lean(),
        HTInspectionReport.find(finalFilter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserMain // MODIFICATION: Changed from UserProd
          })
          .lean(),
  
        // Filter option queries
        HTFirstOutput.distinct("emp_id", dropdownOptionsFilter),
        SCCDailyTesting.distinct("emp_id", dropdownOptionsFilter),
        DailyTestingHTFU.distinct("emp_id", dropdownOptionsFilter),
        HTInspectionReport.distinct("emp_id", dropdownOptionsFilter),
        HTFirstOutput.distinct("moNo", dropdownOptionsFilter),
        SCCDailyTesting.distinct("moNo", dropdownOptionsFilter),
        DailyTestingHTFU.distinct("moNo", dropdownOptionsFilter),
        HTInspectionReport.distinct("moNo", dropdownOptionsFilter)
      ]);
  
      const allEmpIds = [
        ...uniqueEmpIds_1,
        ...uniqueEmpIds_2,
        ...uniqueEmpIds_3,
        ...uniqueEmpIds_4
      ];
      const uniqueEmpIds = [...new Set(allEmpIds)].filter(Boolean).sort();
      const allMoNos = [
        ...uniqueMoNos_1,
        ...uniqueMoNos_2,
        ...uniqueMoNos_3,
        ...uniqueMoNos_4
      ];
      const uniqueMoNos = [...new Set(allMoNos)].filter(Boolean).sort();
  
      const processedFirstOutput = firstOutputData.map((doc) => {
        const firstSpec = doc.standardSpecification.find(
          (s) => s.type === "first"
        );
        const secondSpec = doc.standardSpecification.find(
          (s) => s.type === "2nd heat"
        );
        return {
          ...doc,
          specs: firstSpec
            ? {
                tempC: firstSpec.tempC,
                timeSec: firstSpec.timeSec,
                pressure: firstSpec.pressure
              }
            : {},
          secondHeatSpecs: secondSpec
            ? {
                tempC: secondSpec.tempC,
                timeSec: secondSpec.timeSec,
                pressure: secondSpec.pressure
              }
            : null,
          referenceSampleImage: doc.referenceSampleImage,
          afterWashImage: doc.afterWashImage
        };
      });
  
      const consolidatedInspections = {};
      htInspectionData.forEach((doc) => {
        const key = `${doc.machineNo}-${doc.moNo}-${doc.color}-${doc.tableNo}`;
        if (!consolidatedInspections[key]) {
          consolidatedInspections[key] = {
            inspectionDate: doc.inspectionDate,
            machineNo: doc.machineNo,
            moNo: doc.moNo,
            buyer: doc.buyer,
            buyerStyle: doc.buyerStyle,
            color: doc.color,
            operatorData: doc.operatorData,
            batchNo: doc.batchNo,
            tableNo: doc.tableNo,
            totalPcs: 0,
            totalInspectedQty: 0,
            totalDefectsQty: 0,
            defectSummary: {},
            defectImageUrls: []
          };
        }
        const group = consolidatedInspections[key];
        group.totalPcs += doc.totalPcs || 0;
        group.totalInspectedQty += doc.aqlData?.sampleSize || 0;
        group.totalDefectsQty += doc.defectsQty || 0;
        if (
          doc.defectImageUrl &&
          !group.defectImageUrls.includes(doc.defectImageUrl)
        ) {
          group.defectImageUrls.push(doc.defectImageUrl);
        }
        doc.defects.forEach((defect) => {
          const name = defect.defectNameEng;
          group.defectSummary[name] =
            (group.defectSummary[name] || 0) + defect.count;
        });
      });
  
      const finalInspectionArray = Object.values(consolidatedInspections).map(
        (group) => {
          const finalDefectRate =
            group.totalInspectedQty > 0
              ? group.totalDefectsQty / group.totalInspectedQty
              : 0;
          return {
            ...group,
            finalDefectRate,
            defectImageUrl: group.defectImageUrls[0] || null
          };
        }
      );
  
      res.json({
        firstOutput: processedFirstOutput,
        dailyWashing: dailyWashingData,
        machineCalibration: machineCalibrationData,
        htInspection: finalInspectionArray,
        filterOptions: { empIds: uniqueEmpIds, moNos: uniqueMoNos }
      });
    } catch (error) {
      console.error("Error creating consolidated HT report:", error); // Check server logs for this!
      res.status(500).json({
        message: "Failed to generate consolidated report",
        error: error.message
      });
    }
};

export const getFinalFUReport = async (req, res) => {
  try {
      const { date, empId, moNo, machineNo } = req.query;
      if (!date) {
        return res.status(400).json({ message: "Date is required." });
      }
  
      const { stringDate, paddedStringDate } = getConsolidatedDateFormats(date);
  
      // --- Build Filter Queries ---
      const stringDateFilter = { inspectionDate: stringDate };
      if (empId && empId !== "All") stringDateFilter.emp_id = empId;
      if (moNo && moNo !== "All") stringDateFilter.moNo = moNo;
      if (machineNo && machineNo !== "All")
        stringDateFilter.machineNo = machineNo;
  
      const paddedDateFilter = { inspectionDate: paddedStringDate };
      if (empId && empId !== "All") paddedDateFilter.emp_id = empId;
      if (moNo && moNo !== "All") paddedDateFilter.moNo = moNo;
      if (machineNo && machineNo !== "All")
        paddedDateFilter.machineNo = machineNo;
  
      // --- Execute All FU Queries Concurrently ---
      const [
        firstOutputData,
        machineCalibrationData,
        // Queries for filter dropdowns
        uniqueEmpIds_1,
        uniqueEmpIds_2,
        uniqueMoNos_1,
        uniqueMoNos_2
      ] = await Promise.all([
        // Data queries with filters
        FUFirstOutput.find(stringDateFilter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserProd
          })
          .lean(),
        DailyTestingFUQC.find(paddedDateFilter)
          .populate({
            path: "operatorData.emp_reference_id",
            select: "emp_id eng_name face_photo",
            model: UserProd
          })
          .lean(),
  
        // Filter option queries (only by date)
        FUFirstOutput.distinct("emp_id", { inspectionDate: stringDate }),
        DailyTestingFUQC.distinct("emp_id", { inspectionDate: paddedStringDate }),
        FUFirstOutput.distinct("moNo", { inspectionDate: stringDate }),
        DailyTestingFUQC.distinct("moNo", { inspectionDate: paddedStringDate })
      ]);
  
      // Combine and get unique filter options
      const allEmpIds = [...uniqueEmpIds_1, ...uniqueEmpIds_2];
      const uniqueEmpIds = [...new Set(allEmpIds)].filter(Boolean).sort();
  
      const allMoNos = [...uniqueMoNos_1, ...uniqueMoNos_2];
      const uniqueMoNos = [...new Set(allMoNos)].filter(Boolean).sort();
  
      // Process First Output Data
      const processedFirstOutput = firstOutputData.map((doc) => {
        const firstSpec = doc.standardSpecification.find(
          (s) => s.type === "first"
        );
        return {
          ...doc,
          specs: firstSpec
            ? { tempC: firstSpec.tempC, timeSec: firstSpec.timeSec }
            : {}
        };
      });
  
      res.json({
        firstOutput: processedFirstOutput,
        machineCalibration: machineCalibrationData,
        filterOptions: {
          empIds: uniqueEmpIds,
          moNos: uniqueMoNos
        }
      });
    } catch (error) {
      console.error("Error creating consolidated FU report:", error);
      res.status(500).json({
        message: "Failed to generate consolidated FU report",
        error: error.message
      });
    }
};

export const getFinalEMBReport = async (req, res) => {
  try {
      const { date, empId, moNo, factoryName } = req.query; // New 'factoryName' filter
      if (!date) {
        return res.status(400).json({ message: "Date is required." });
      }
  
      // The EMBReport schema uses ISODate, so we only need the date range
      const { isoStartDate, isoEndDate } = getConsolidatedDateFormats(date);
  
      // --- Build Filter Query ---
      const filter = { inspectionDate: { $gte: isoStartDate, $lte: isoEndDate } };
      if (empId && empId !== "All") filter.emp_id = empId;
      if (moNo && moNo !== "All") filter.moNo = moNo;
      if (factoryName && factoryName !== "All") filter.factoryName = factoryName;
  
      // --- Execute Queries Concurrently ---
      const [
        reportData,
        // Queries to get unique filter options for the selected DATE only
        uniqueEmpIds,
        uniqueMoNos,
        uniqueFactories
      ] = await Promise.all([
        // Data query with all filters applied
        EMBReport.find(filter).lean(),
        // Filter option queries (only filter by date)
        EMBReport.distinct("emp_id", {
          inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
        }),
        EMBReport.distinct("moNo", {
          inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
        }),
        EMBReport.distinct("factoryName", {
          inspectionDate: { $gte: isoStartDate, $lte: isoEndDate }
        })
      ]);
  
      // --- Process and Consolidate Data ---
      // This is similar to the HT Inspection consolidation logic
      const consolidatedReports = {};
      reportData.forEach((doc) => {
        const key = `${doc.factoryName}-${doc.moNo}-${doc.color}-${doc.tableNo}-${doc.batchNo}`;
        if (!consolidatedReports[key]) {
          consolidatedReports[key] = {
            factoryName: doc.factoryName,
            moNo: doc.moNo,
            buyer: doc.buyer,
            buyerStyle: doc.buyerStyle,
            color: doc.color,
            batchNo: doc.batchNo,
            tableNo: doc.tableNo,
            totalPcs: 0,
            totalInspectedQty: 0,
            totalDefectsQty: 0,
            defectSummary: {}
          };
        }
        const group = consolidatedReports[key];
        group.totalPcs += doc.totalPcs || 0;
        group.totalInspectedQty += doc.aqlData?.sampleSize || 0;
        group.totalDefectsQty += doc.defectsQty || 0;
  
        (doc.defects || []).forEach((defect) => {
          const name = defect.defectNameEng;
          group.defectSummary[name] =
            (group.defectSummary[name] || 0) + defect.count;
        });
      });
  
      const finalReportArray = Object.values(consolidatedReports).map((group) => {
        const finalDefectRate =
          group.totalInspectedQty > 0
            ? group.totalDefectsQty / group.totalInspectedQty
            : 0;
        return { ...group, finalDefectRate };
      });
  
      res.json({
        embReport: finalReportArray,
        filterOptions: {
          empIds: uniqueEmpIds.filter(Boolean).sort(),
          moNos: uniqueMoNos.filter(Boolean).sort(),
          factories: uniqueFactories.filter(Boolean).sort()
        }
      });
    } catch (error) {
      console.error("Error creating consolidated EMB report:", error);
      res.status(500).json({
        message: "Failed to generate consolidated EMB report",
        error: error.message
      });
    }
};

export const getFinalElasticreport = async (req, res) => {
  try {
      const { date, empId, operatorId, moNo, machineNo } = req.query; // Added operatorId
      if (!date) {
        return res.status(400).json({ message: "Date is required." });
      }
  
      const d = new Date(date);
      const formattedDate = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  
      // --- Build Filter Query ---
      const filter = { inspectionDate: formattedDate };
      if (empId && empId !== "All") filter.registeredBy_emp_id = empId; // Filter by Inspector
      if (operatorId && operatorId !== "All")
        filter["operatorData.emp_id"] = operatorId; // Filter by Operator
      if (moNo && moNo !== "All") filter.moNo = moNo;
      if (machineNo && machineNo !== "All") filter.machineNo = machineNo;
  
      // --- Execute All Elastic Queries Concurrently ---
      const [reportData, uniqueInspectorIds, uniqueOperatorObjects, uniqueMoNos] =
        await Promise.all([
          // Data query with all filters
          ElasticReport.find(filter)
            .populate({
              path: "operatorData.emp_reference_id",
              select: "emp_id eng_name face_photo",
              model: UserProd
            })
            .lean(),
  
          // Filter option queries (based on date only)
          ElasticReport.distinct("registeredBy_emp_id", {
            inspectionDate: formattedDate
          }),
          ElasticReport.find({ inspectionDate: formattedDate })
            .select("operatorData.emp_id")
            .lean(),
          ElasticReport.distinct("moNo", { inspectionDate: formattedDate })
        ]);
  
      // Combine and get unique filter options
      const uniqueOperatorIds = [
        ...new Set(uniqueOperatorObjects.map((item) => item.operatorData?.emp_id))
      ]
        .filter(Boolean)
        .sort();
  
      // --- Process Data for Aggregation ---
      const processedData = reportData.map((doc) => {
        let totalCheckedQty = 0;
        let totalDefectsQty = 0;
        const defectSummary = {};
        let measurementPassCount = 0;
        let measurementTotalCount = 0;
  
        doc.inspections.forEach((insp) => {
          totalCheckedQty += insp.checkedQty || 0;
          totalDefectsQty += insp.totalDefectQty || 0;
  
          if (insp.measurement) {
            measurementTotalCount++;
            if (insp.measurement === "Pass") {
              measurementPassCount++;
            }
          }
  
          (insp.defectDetails || []).forEach((defect) => {
            defectSummary[defect.name] =
              (defectSummary[defect.name] || 0) + defect.qty;
          });
        });
  
        const totalDefectRate =
          totalCheckedQty > 0 ? totalDefectsQty / totalCheckedQty : 0;
  
        return {
          ...doc,
          totalCheckedQty,
          totalDefectsQty,
          defectSummary,
          totalDefectRate,
          measurementSummary: `${measurementPassCount}/${measurementTotalCount} Pass`
        };
      });
  
      res.json({
        elasticReport: processedData,
        filterOptions: {
          empIds: uniqueInspectorIds.filter(Boolean).sort(),
          operatorIds: uniqueOperatorIds,
          moNos: uniqueMoNos.sort()
        }
      });
    } catch (error) {
      console.error("Error creating consolidated Elastic report:", error);
      res.status(500).json({
        message: "Failed to generate consolidated Elastic report",
        error: error.message
      });
    }
};