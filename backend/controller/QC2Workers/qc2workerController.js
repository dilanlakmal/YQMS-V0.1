import {  QC2WorkersData } from "../MongoDB/dbConnectionController.js";

export const getWorkerdate = async (req, res) => {
  try {
      const { qc_id, moNo, taskNo, qty, random_id } = req.body;
  
      if (!qc_id || !moNo || !taskNo || qty === undefined || !random_id) {
        return res.status(400).json({ message: "Missing required fields." });
      }
  
      const inspection_date = new Date().toLocaleDateString("en-US");
  
      // --- FIX: Conditional Duplicate Check ---
      // Only check for duplicates if it's an Order Card (taskNo 54)
      if (taskNo === 54) {
        const workerData = await QC2WorkersData.findOne({
          qc_id,
          inspection_date
        });
  
        // If a record for the worker exists today, check if this Order Card has already been scanned.
        if (
          workerData &&
          workerData.dailyData.some(
            (d) => d.random_id === random_id && d.taskNo === 54
          )
        ) {
          return res.status(200).json({
            message: "You have already scanned this Order Card today.",
            data: workerData
          });
        }
      }
      // If taskNo is 84 (Defect Card), we skip this check and always allow the entry.
  
      // Find the current document to correctly calculate the next 'no'
      const currentWorkerData = await QC2WorkersData.findOne({
        qc_id,
        inspection_date
      });
      const dailyDataNo = currentWorkerData
        ? currentWorkerData.dailyData.length + 1
        : 1;
  
      // Determine which quantity to increment based on the task number
      const qtyIncrementField =
        taskNo === 54 ? "totalQtyTask54" : "totalQtyTask84";
  
      // Use findOneAndUpdate with upsert to create or update the document
      const updatedWorkerData = await QC2WorkersData.findOneAndUpdate(
        { qc_id, inspection_date },
        {
          $inc: {
            totalCheckedQty: qty,
            [qtyIncrementField]: qty
          },
          $push: {
            dailyData: {
              no: dailyDataNo,
              moNo,
              taskNo,
              qty,
              random_id
            }
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
  
      res.status(200).json({
        message: "Worker scan data logged successfully.",
        data: updatedWorkerData
      });
    } catch (error) {
      console.error("Error logging worker scan data:", error);
      res.status(500).json({ message: "Server error logging scan data." });
    }
};

// This endpoint fetches today's summary and detailed data for a specific QC worker.
export const getWorkerCurrentData = async (req, res) => {
  try {
    const { qc_id } = req.params;
    if (!qc_id) {
      return res.status(400).json({ message: "QC ID is required." });
    }

    const inspection_date = new Date().toLocaleDateString("en-US");

    const workerData = await QC2WorkersData.findOne({
      qc_id,
      inspection_date
    }).lean();

    if (!workerData) {
      // If no data exists for today, return a default empty structure.
      return res.json({
        totalCheckedQty: 0,
        totalQtyTask54: 0,
        totalQtyTask84: 0,
        dailyData: []
      });
    }

    // Group daily data by MO Number for the popup view
    const moSummary = workerData.dailyData.reduce((acc, item) => {
      if (!acc[item.moNo]) {
        acc[item.moNo] = {
          moNo: item.moNo,
          totalQty: 0,
          task54Qty: 0,
          task84Qty: 0
        };
      }
      acc[item.moNo].totalQty += item.qty;
      if (item.taskNo === 54) {
        acc[item.moNo].task54Qty += item.qty;
      } else if (item.taskNo === 84) {
        acc[item.moNo].task84Qty += item.qty;
      }
      return acc;
    }, {});

    workerData.moSummary = Object.values(moSummary);

    res.json(workerData);
  } catch (error) {
    console.error("Error fetching today's worker data:", error);
    res.status(500).json({ message: "Server error fetching worker data." });
  }
};