import {
  CuttingInspection,                
} from "../../MongoDB/dbConnectionController.js"; 


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

