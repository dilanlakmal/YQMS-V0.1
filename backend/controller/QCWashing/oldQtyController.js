import { QCWashingQtyOld } from "../MongoDB/dbConnectionController.js";


// Endpoint to fetch wash qty from qc_washing_qty_old collection
export const getQCWashingQty = async (req, res) => {
  try {
    const { date, color, orderNo, qcId } = req.query;

    if (!date || !color || !orderNo || !qcId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: date, color, orderNo, qcId"
      });
    }

    // Parse the date to match the format in the database
    const inspectionDate = new Date(date);
    const startOfDay = new Date(inspectionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(inspectionDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the record matching date, color, and orderNo (style_no)
    // Try exact match first, then partial match for color
    let washQtyRecord = await QCWashingQtyOld.findOne({
      Inspection_date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      Style_No: orderNo,
      Color: color
    });

    // If no exact match, try English-only matching by fetching candidates and filtering
    if (!washQtyRecord) {
      const candidates = await QCWashingQtyOld.find({
        Inspection_date: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        Style_No: orderNo
      });

      // Extract English part from brackets and match
      washQtyRecord = candidates.find((record) => {
        const dbColor = record.Color;
        // Extract text between [ and ]
        const match = dbColor.match(/\[([^\]]+)\]/);
        const englishPart = match ? match[1] : dbColor;
        return englishPart.toLowerCase() === color.toLowerCase();
      });
    }

    if (!washQtyRecord) {
      return res.json({
        success: false,
        washQty: 0,
        message: "No wash qty record found",
        searchCriteria: { date: startOfDay, orderNo, color }
      });
    }

    // Find the specific QC worker's wash qty
    const workerWashQty = washQtyRecord.WorkerWashQty.find(
      (worker) => worker.QC_ID === qcId
    );

    const washQty = workerWashQty ? workerWashQty.Wash_Qty : 0;

    res.json({
      success: true,
      washQty,
      totalWashQty: washQtyRecord.Total_Wash_Qty,
      workerFound: !!workerWashQty
    });
  } catch (error) {
    console.error("Error fetching wash qty:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wash qty",
      error: error.message
    });
  }
};

// Debug endpoint to search wash qty records with flexible criteria
export const searchQCWashingQty = async (req, res) => {
  try {
      const { orderNo, color, qcId, dateFrom, dateTo } = req.query;
  
      let query = {};
  
      if (orderNo) {
        query.Style_No = { $regex: orderNo, $options: "i" };
      }
  
      if (color) {
        query.Color = { $regex: color, $options: "i" };
      }
  
      if (dateFrom || dateTo) {
        query.Inspection_date = {};
        if (dateFrom) {
          query.Inspection_date.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.Inspection_date.$lte = new Date(dateTo);
        }
      }
  
      const records = await QCWashingQtyOld.find(query)
        .sort({ Inspection_date: -1 })
        .limit(10);
  
      // If qcId is provided, filter worker data
      let filteredRecords = records;
      if (qcId) {
        filteredRecords = records.map((record) => {
          const workerData = record.WorkerWashQty.find((w) => w.QC_ID === qcId);
          return {
            ...record.toObject(),
            matchingWorker: workerData || null,
            hasMatchingWorker: !!workerData
          };
        });
      }
  
      res.json({
        success: true,
        records: filteredRecords,
        count: filteredRecords.length,
        searchCriteria: { orderNo, color, qcId, dateFrom, dateTo }
      });
    } catch (error) {
      console.error("Error searching wash qty records:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search wash qty records",
        error: error.message
      });
    }
};

