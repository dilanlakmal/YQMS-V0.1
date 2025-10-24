import {
  CuttingInspection,                
} from "../MongoDB/dbConnectionController.js"; 

import { normalizeDateString, getResult, buildReportMatchPipeline  } from "../../Helpers/helperFunctions.js";

export const saveCuttingInspection = async (req, res) => {
try {
    const {
      inspectionDate,
      cutting_emp_id,
      cutting_emp_engName,
      cutting_emp_khName,
      cutting_emp_dept,
      cutting_emp_section,
      moNo,
      tableNo,
      buyerStyle,
      buyer,
      color,
      lotNo,
      orderQty,
      totalOrderQtyStyle,
      fabricDetails,
      cuttingTableDetails,
      mackerRatio,
      totalBundleQty,
      bundleQtyCheck,
      totalInspectionQty,
      cuttingtype,
      garmentType,
      inspectionData
    } = req.body;

    // Basic validation
    if (!inspectionData || !Array.isArray(inspectionData)) {
      return res.status(400).json({ message: "Invalid inspectionData format" });
    }

    // Validate that each bundleInspectionData entry has measurementInsepctionData
    for (const data of inspectionData) {
      if (
        !data.bundleInspectionData ||
        !Array.isArray(data.bundleInspectionData)
      ) {
        return res
          .status(400)
          .json({ message: "Invalid bundleInspectionData format" });
      }
      for (const bundle of data.bundleInspectionData) {
        if (
          !bundle.measurementInsepctionData ||
          !Array.isArray(bundle.measurementInsepctionData)
        ) {
          return res.status(400).json({
            message: "Missing or invalid measurementInsepctionData for bundle"
          });
        }
      }
    }

    const existingDoc = await CuttingInspection.findOne({
      inspectionDate,
      moNo,
      tableNo,
      color
    });

    if (existingDoc) {
      existingDoc.inspectionData.push(...inspectionData);
      existingDoc.updated_at = new Date();
      await existingDoc.save();
      res.status(200).json({ message: "Data appended successfully" });
    } else {
      const newDoc = new CuttingInspection({
        inspectionDate,
        cutting_emp_id,
        cutting_emp_engName,
        cutting_emp_khName,
        cutting_emp_dept,
        cutting_emp_section,
        moNo,
        tableNo,
        buyerStyle,
        buyer,
        color,
        lotNo,
        orderQty,
        totalOrderQtyStyle,
        fabricDetails,
        cuttingTableDetails,
        mackerRatio,
        totalBundleQty,
        bundleQtyCheck,
        totalInspectionQty,
        cuttingtype,
        garmentType,
        inspectionData
      });
      await newDoc.save();
      res.status(200).json({ message: "Data saved successfully" });
    }
  } catch (error) {
    console.error("Error saving cutting inspection data:", error);
    res
      .status(500)
      .json({ message: "Failed to save data", error: error.message });
  }
};

export const getCuttingInspectionProgress = async (req, res) => {
    try {
    const { moNo, tableNo, garmentType } = req.query;

    // Validate required query parameters
    if (!moNo || !tableNo || !garmentType) {
      return res
        .status(400)
        .json({ message: "moNo, tableNo, and garmentType are required" });
    }

    // Find the inspection document
    const inspection = await CuttingInspection.findOne({
      moNo,
      tableNo,
      garmentType
    });

    if (!inspection) {
      return res.status(200).json({
        progress: null,
        inspectedSizes: [],
        message: "No inspection record found"
      });
    }

    // Calculate progress and stats
    const bundleQtyCheck = inspection.bundleQtyCheck || 0;
    let completedBundles = 0;
    let totalInspected = 0;
    let totalPass = 0;
    let totalReject = 0;
    const inspectedSizes = [];

    // Iterate through inspectionData to aggregate stats
    if (inspection.inspectionData && Array.isArray(inspection.inspectionData)) {
      inspection.inspectionData.forEach((data) => {
        if (data.inspectedSize) {
          inspectedSizes.push(data.inspectedSize);
        }
        if (data.bundleQtyCheckSize) {
          completedBundles += data.bundleQtyCheckSize;
        }
        if (data.pcsSize && data.pcsSize.total) {
          totalInspected += data.pcsSize.total;
        }
        if (data.passSize && data.passSize.total) {
          totalPass += data.passSize.total;
        }
        if (data.rejectSize && data.rejectSize.total) {
          totalReject += data.rejectSize.total;
        }
      });
    }

    // Calculate pass rate
    const passRate =
      totalInspected > 0 ? (totalPass / totalInspected) * 100 : 0;

    // Prepare response
    const progress = {
      completed: completedBundles,
      total: bundleQtyCheck,
      inspected: totalInspected,
      pass: totalPass,
      reject: totalReject,
      passRate: parseFloat(passRate.toFixed(2))
    };

    res.status(200).json({
      progress,
      inspectedSizes: [...new Set(inspectedSizes)], // Remove duplicates
      message: "Inspection progress retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching cutting inspection progress:", error);
    res.status(500).json({
      message: "Failed to fetch inspection progress",
      error: error.message
    });
  }
};

export const getCuttingInspectionMono = async (req, res) => {
    try {
    const { search, startDate, endDate } = req.query;

    const pipeline = [];

    // ---  DATE FILTERING LOGIC ---
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $addFields: {
          // Convert the 'MM/DD/YYYY' string to a real date object
          inspectionDateAsDate: {
            $dateFromString: {
              dateString: "$inspectionDate",
              format: "%m/%d/%Y"
            }
          }
        }
      });
      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          }
        }
      });
    }

    // --- Existing Search Logic ---
    if (search) {
      pipeline.push({ $match: { moNo: { $regex: search, $options: "i" } } });
    }

    // --- Final Aggregation Stages ---
    pipeline.push({ $group: { _id: "$moNo" } });
    pipeline.push({ $sort: { _id: 1 } });

    const results = await CuttingInspection.aggregate(pipeline);
    const moNumbers = results.map((item) => item._id);

    res.json(moNumbers);
  } catch (error) {
    console.error("Error fetching MO numbers from cutting inspections:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch MO numbers", error: error.message });
  }
};

export const getCuttingInspectionTable = async (req, res) => {
    try {
    const { moNo, search, startDate, endDate } = req.query;
    if (!moNo) {
      return res.status(400).json({ message: "MO Number is required" });
    }

    const pipeline = [];

    // --- Match by MO Number first ---
    pipeline.push({ $match: { moNo } });

    // --- FIX: DATE FILTERING LOGIC ---
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $addFields: {
          inspectionDateAsDate: {
            $dateFromString: {
              dateString: "$inspectionDate",
              format: "%m/%d/%Y"
            }
          }
        }
      });
      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          }
        }
      });
    }

    // --- Existing Search Logic ---
    if (search) {
      pipeline.push({ $match: { tableNo: { $regex: search, $options: "i" } } });
    }

    // --- Final Aggregation Stages ---
    pipeline.push({ $group: { _id: "$tableNo" } });
    pipeline.push({ $sort: { _id: 1 } });

    const results = await CuttingInspection.aggregate(pipeline);
    const tableNumbers = results.map((item) => item._id);

    res.json(tableNumbers);
  } catch (error) {
    console.error(
      "Error fetching Table numbers from cutting inspections:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch Table numbers", error: error.message });
  }
};

export const getCuttinginspectionDetail = async (req, res) => {
    try {
    const { moNo, tableNo } = req.query;
    if (!moNo || !tableNo) {
      return res
        .status(400)
        .json({ message: "MO Number and Table Number are required" });
    }

    const inspectionDoc = await CuttingInspection.findOne({ moNo, tableNo });
    if (!inspectionDoc) {
      return res.status(404).json({ message: "Inspection document not found" });
    }
    res.json(inspectionDoc);
  } catch (error) {
    console.error("Error fetching inspection details for modify:", error);
    res.status(500).json({
      message: "Failed to fetch inspection details",
      error: error.message
    });
  }
};

export const updateCuttingInspection = async (req, res) => {
    try {
        const { moNo, tableNo, updatedFields, updatedInspectionDataItem } =
          req.body;
    
        if (!moNo || !tableNo) {
          return res.status(400).json({
            message: "MO Number and Table Number are required for update."
          });
        }
        if (
          !updatedInspectionDataItem ||
          !updatedInspectionDataItem.inspectedSize
        ) {
          return res.status(400).json({
            message:
              "Valid 'updatedInspectionDataItem' with 'inspectedSize' is required."
          });
        }
    
        const inspectionDoc = await CuttingInspection.findOne({ moNo, tableNo });
    
        if (!inspectionDoc) {
          return res
            .status(404)
            .json({ message: "Inspection document not found to update." });
        }

        if (updatedFields) {
          if (updatedFields.totalBundleQty !== undefined)
            inspectionDoc.totalBundleQty = updatedFields.totalBundleQty;
          if (updatedFields.bundleQtyCheck !== undefined)
            inspectionDoc.bundleQtyCheck = updatedFields.bundleQtyCheck;
          if (updatedFields.totalInspectionQty !== undefined)
            inspectionDoc.totalInspectionQty = updatedFields.totalInspectionQty;
          if (updatedFields.cuttingtype !== undefined)
            inspectionDoc.cuttingtype = updatedFields.cuttingtype;
        }
    
        const itemIndex = inspectionDoc.inspectionData.findIndex(
          (item) => item.inspectedSize === updatedInspectionDataItem.inspectedSize
        );
    
        if (itemIndex > -1) {
          inspectionDoc.inspectionData[itemIndex] = {
            ...inspectionDoc.inspectionData[itemIndex], 
            ...updatedInspectionDataItem, 
            updated_at: new Date() 
          };
        } else {
          return res.status(400).json({
            message: `Inspection data for size ${updatedInspectionDataItem.inspectedSize} not found in the document. Cannot update.`
          });
        }
    
        inspectionDoc.updated_at = new Date(); 
        inspectionDoc.markModified("inspectionData"); 
    
        await inspectionDoc.save();
    
        res.status(200).json({
          message: "Cutting inspection data updated successfully.",
          data: inspectionDoc
        });
      } catch (error) {
        console.error("Error updating cutting inspection data:", error);
        res.status(500).json({
          message: "Failed to update cutting inspection data",
          error: error.message
        });
      }
};

/* ------------------------------
   Cutting Report ENDPOINTS
------------------------------ */

// GET QC IDs (cutting_emp_id and names) from cuttinginspections
export const getCuttingQCInspectors = async (req, res) => {
    try {
    const inspectors = await CuttingInspection.aggregate([
      {
        $group: {
          _id: "$cutting_emp_id",
          engName: { $first: "$cutting_emp_engName" },
          khName: { $first: "$cutting_emp_khName" }
        }
      },
      {
        $project: {
          _id: 0,
          emp_id: "$_id",
          eng_name: "$engName",
          kh_name: "$khName"
        }
      },
      { $sort: { emp_id: 1 } }
    ]);
    res.json(inspectors);
  } catch (error) {
    console.error(
      "Error fetching QC inspectors from cutting inspections:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch QC inspectors", error: error.message });
  }
};

// GET Paginated Cutting Inspection Reports
export const getCuttingInspectionRepo = async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;
    
        const pipeline = buildReportMatchPipeline(req.query);
        const countPipeline = [...pipeline]; // For counting total documents
    
        const skip = (parseInt(page) - 1) * parseInt(limit);
    
        // Add sorting, skipping, and limiting for the data fetch
        pipeline.push(
          {
            $addFields: {
              convertedDate: {
                $dateFromString: {
                  dateString: "$inspectionDate",
                  format: "%m/%d/%Y",
                  onError: new Date(0),
                  onNull: new Date(0)
                }
              }
            }
          },
          { $sort: { convertedDate: -1, moNo: 1, tableNo: 1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
          {
            $project: {
              _id: 1,
              inspectionDate: 1,
              buyer: 1,
              moNo: 1,
              tableNo: 1,
              buyerStyle: 1, // Cust. Style
              cuttingTableDetails: 1, // For Spread Table, Layer Details, Macker No
              fabricDetails: 1, // For Material
              lotNo: 1,
              cutting_emp_id: 1,
              color: 1,
              garmentType: 1,
              mackerRatio: 1,
              totalBundleQty: 1,
              bundleQtyCheck: 1,
              totalInspectionQty: 1,
              numberOfInspectedSizes: {
                $size: { $ifNull: ["$inspectionData", []] }
              },
              sumTotalPcs: { $sum: "$inspectionData.totalPcsSize" },
              sumTotalPass: { $sum: "$inspectionData.passSize.total" },
              sumTotalReject: { $sum: "$inspectionData.rejectSize.total" },
              sumTotalRejectMeasurement: {
                $sum: "$inspectionData.rejectMeasurementSize.total"
              },
              sumTotalRejectDefects: {
                $sum: "$inspectionData.rejectGarmentSize.total"
              }
            }
          },
          {
            $addFields: {
              overallPassRate: {
                $cond: [
                  { $gt: ["$sumTotalPcs", 0] },
                  {
                    $multiply: [{ $divide: ["$sumTotalPass", "$sumTotalPcs"] }, 100]
                  },
                  0
                ]
              }
            }
          }
        );
    
        const reports = await CuttingInspection.aggregate(pipeline);
    
        // Get total count
        countPipeline.push({ $count: "total" });
        const countResult = await CuttingInspection.aggregate(countPipeline);
        const totalDocuments = countResult.length > 0 ? countResult[0].total : 0;
    
        res.json({
          reports,
          totalPages: Math.ceil(totalDocuments / parseInt(limit)),
          currentPage: parseInt(page),
          totalReports: totalDocuments
        });
      } catch (error) {
        console.error("Error fetching cutting inspection reports:", error);
        res.status(500).json({
          message: "Failed to fetch cutting inspection reports",
          error: error.message
        });
      }
};

// GET Single Cutting Inspection Report Detail
export const getCuttingInspectionReportDetail = async (req, res) => {
  try {
      const { id } = req.params;
      const report = await CuttingInspection.findById(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching cutting inspection report detail:", error);
      res.status(500).json({
        message: "Failed to fetch report detail",
        error: error.message
      });
    }
};

//Old endpoint remove later
export const getCuttingInspectDetailRepo = async (req, res) => {
    try {
        const {
          startDate,
          endDate,
          moNo,
          lotNo,
          buyer,
          color,
          tableNo,
          page = 0,
          limit = 1
        } = req.query;
    
        let match = {};
    
        // Date filtering
        if (startDate || endDate) {
          match.$expr = match.$expr || {};
          match.$expr.$and = match.$expr.$and || [];
          if (startDate) {
            const normalizedStartDate = normalizeDateString(startDate);
            match.$expr.$and.push({
              $gte: [
                {
                  $dateFromString: {
                    dateString: "$inspectionDate",
                    format: "%m/%d/%Y"
                  }
                },
                {
                  $dateFromString: {
                    dateString: normalizedStartDate,
                    format: "%m/%d/%Y"
                  }
                }
              ]
            });
          }
          if (endDate) {
            const normalizedEndDate = normalizeDateString(endDate);
            match.$expr.$and.push({
              $lte: [
                {
                  $dateFromString: {
                    dateString: "$inspectionDate",
                    format: "%m/%d/%Y"
                  }
                },
                {
                  $dateFromString: {
                    dateString: normalizedEndDate,
                    format: "%m/%d/%Y"
                  }
                }
              ]
            });
          }
        }
    
        // Other filters with case-insensitive regex
        if (moNo) match.moNo = new RegExp(moNo, "i");
        if (lotNo) match.lotNo = new RegExp(lotNo, "i");
        if (buyer) match.buyer = new RegExp(buyer, "i");
        if (color) match.color = new RegExp(color, "i");
        if (tableNo) match.tableNo = new RegExp(tableNo, "i");
    
        const totalDocs = await CuttingInspection.countDocuments(match);
        const totalPages = Math.ceil(totalDocs / limit);
    
        const inspections = await CuttingInspection.find(match)
          .skip(page * limit)
          .limit(parseInt(limit))
          .lean();
    
        // Calculate summary data for each inspection
        inspections.forEach((inspection) => {
          let totalPcs = 0;
          let totalPass = 0;
          let totalReject = 0;
          let totalRejectMeasurement = 0;
          let totalRejectDefects = 0;
    
          inspection.inspectionData.forEach((data) => {
            totalPcs += data.totalPcs;
            totalPass += data.totalPass;
            totalReject += data.totalReject;
            totalRejectMeasurement += data.totalRejectMeasurement;
            totalRejectDefects += data.totalRejectDefects;
          });
    
          const passRate =
            totalPcs > 0 ? ((totalPass / totalPcs) * 100).toFixed(2) : "0.00";
          const result = getResult(inspection.bundleQtyCheck, totalReject);
    
          inspection.summary = {
            totalPcs,
            totalPass,
            totalReject,
            totalRejectMeasurement,
            totalRejectDefects,
            passRate,
            result
          };
        });
    
        res.status(200).json({ data: inspections, totalPages });
      } catch (error) {
        console.error("Error fetching detailed cutting inspection report:", error);
        res.status(500).json({
          message: "Failed to fetch detailed report",
          error: error.message
        });
      }
};

// Endpoint to fetch distinct MO Nos
export const getCuttingInspectMoNo = async (req, res) => {
    try {
    const moNos = await CuttingInspection.distinct("moNo");
    res.json(moNos.filter((mo) => mo));
  } catch (error) {
    console.error("Error fetching MO Nos:", error);
    res.status(500).json({ message: "Failed to fetch MO Nos" });
  }
};

// Endpoint to fetch distinct filter options based on MO No
export const getCuttingInspectFilterOptions = async (req, res) => {
    try {
      const { moNo } = req.query;
      let match = {};
      if (moNo) match.moNo = new RegExp(moNo, "i");
  
      const lotNos = await CuttingInspection.distinct("lotNo", match);
      const buyers = await CuttingInspection.distinct("buyer", match); // Add buyer filter options
      const colors = await CuttingInspection.distinct("color", match);
      const tableNos = await CuttingInspection.distinct("tableNo", match);
  
      res.json({
        lotNos: lotNos.filter((lot) => lot),
        buyers: buyers.filter((buyer) => buyer), // Return distinct buyers
        colors: colors.filter((color) => color),
        tableNos: tableNos.filter((table) => table)
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
};