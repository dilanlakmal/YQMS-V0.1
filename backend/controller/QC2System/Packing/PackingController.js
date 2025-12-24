import {
 Packing,
 QC2InspectionPassBundle,  
 IEWorkerTask,              
} from "../../MongoDB/dbConnectionController.js";

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

export const updateScanData = async (req, res) => {
  const { randomId, taskNo } = req.body;
  
    if (!randomId || !taskNo) {
      return res
        .status(400)
        .json({ message: "Card ID and Task No are required." });
    }
  
    // --- TASK-SPECIFIC UNIQUENESS CHECK ---
    // The unique ID for a packing operation is the card's ID combined with the task number.
    const uniquePackingId = `${randomId}-${taskNo}`;
    const existingScan = await Packing.findOne({
      packing_bundle_id: uniquePackingId
    });
  
    if (existingScan) {
      return res.status(409).json({
        message: `This card has already been scanned for Task No ${taskNo}.`
      }); // 409 Conflict
    }
  
    try {
      // First, check if the ID corresponds to an Order Card by looking for bundle_random_id.
      let inspectionDoc = await QC2InspectionPassBundle.findOne({
        bundle_random_id: randomId
      });
  
      if (inspectionDoc) {
        // --- It's an ORDER CARD ---
        // Calculate packing quantity as per the new logic.
        const packingQty =
          (inspectionDoc.checkedQty || 0) - (inspectionDoc.totalRejects || 0);
  
        const responseData = {
          isDefectCard: false,
          bundle_id: inspectionDoc.bundle_id,
          bundle_random_id: inspectionDoc.bundle_random_id,
          package_no: inspectionDoc.package_no,
          moNo: inspectionDoc.moNo,
          custStyle: inspectionDoc.custStyle,
          buyer: inspectionDoc.buyer,
          color: inspectionDoc.color,
          size: inspectionDoc.size,
          lineNo: inspectionDoc.lineNo,
          department: inspectionDoc.department,
          factory: inspectionDoc.factory,
          country: inspectionDoc.country,
          sub_con: inspectionDoc.sub_con,
          sub_con_factory: inspectionDoc.sub_con_factory,
          count: packingQty,
          passQtyPacking: packingQty
        };
        return res.json(responseData);
      }
  
      // If not an Order Card, check if it's a Defect Card.
      inspectionDoc = await QC2InspectionPassBundle.findOne({
        "printArray.defect_print_id": randomId
      });
  
      if (inspectionDoc) {
        // --- It's a DEFECT CARD ---
        const printEntry = inspectionDoc.printArray.find(
          (p) => p.defect_print_id === randomId
        );
        if (!printEntry) {
          return res
            .status(404)
            .json({ message: "Defect card data not found within the bundle." });
        }
  
        // Calculate packing quantity for defect card.
        const packingQty =
          (inspectionDoc.totalRejects || 0) -
          (printEntry.totalRejectGarment_Var || 0);
  
        const responseData = {
          isDefectCard: true,
          defect_print_id: printEntry.defect_print_id,
          bundle_id: inspectionDoc.bundle_id,
          bundle_random_id: inspectionDoc.bundle_random_id,
          package_no: inspectionDoc.package_no,
          moNo: inspectionDoc.moNo,
          custStyle: inspectionDoc.custStyle,
          buyer: inspectionDoc.buyer,
          color: inspectionDoc.color,
          size: inspectionDoc.size,
          lineNo: inspectionDoc.lineNo,
          department: inspectionDoc.department,
          factory: inspectionDoc.factory,
          country: inspectionDoc.country,
          sub_con: inspectionDoc.sub_con,
          sub_con_factory: inspectionDoc.sub_con_factory,
          count: packingQty,
          passQtyPacking: packingQty
        };
        return res.json(responseData);
      }
  
      // If the ID is not found in either context, it's invalid.
      return res.status(404).json({
        message: "Invalid QR Code. Not found as an Order Card or a Defect Card."
      });
    } catch (error) {
      console.error("Error fetching packing scan data:", error);
      res.status(500).json({ message: "Server error fetching data." });
    }
};

// Save Packing record (no change needed, but ensure task_no is 62 in Packing.jsx)
export const savePacking = async (req, res) => {
    try {
    const newRecordData = req.body;

    if (!newRecordData.packing_bundle_id) {
      return res
        .status(400)
        .json({ message: "packing_bundle_id is required." });
    }

    const existingScan = await Packing.findOne({
      packing_bundle_id: newRecordData.packing_bundle_id
    });
    if (existingScan) {
      return res.status(409).json({
        message: `This card has already been scanned for Task No ${newRecordData.task_no_packing}.`
      });
    }

    const newRecord = new Packing(newRecordData);
    await newRecord.save();

    res
      .status(201)
      .json({ message: "Packing record saved successfully", data: newRecord });
  } catch (error) {
    console.error("Error saving packing record:", error);
    res.status(500).json({ message: "Failed to save packing record." });
  }
};

//For Data tab display records in a table (no change needed)
export const getPackingRecords = async (req, res) => {
    try {
    const records = await Packing.find().sort({
      packing_updated_date: -1,
      packing_update_time: -1
    });
    res.json(records);
  } catch (error) {
    console.error("Error fetching packing records:", error);
    res.status(500).json({ message: "Failed to fetch packing records." });
  }
};

// GET distinct filter options for Packing records
export const getPackingFilterOptions = async (req, res) => {
  try {
      // Run all distinct queries on the Packing collection in parallel
      const [
        distinctTaskNos,
        moNosFromMoNoField,
        distinctPackageNos,
        distinctDepartments,
        distinctLineNos, // ADDED
        distinctQcIds // ADDED
      ] = await Promise.all([
        Packing.distinct("task_no_packing").exec(),
        Packing.distinct("moNo").exec(),
        Packing.distinct("package_no").exec(),
        Packing.distinct("department").exec(),
        Packing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
        Packing.distinct("emp_id_packing").exec() // ADDED: Fetch distinct QC IDs
      ]);
  
      // Send the cleaned and sorted data in the JSON response
      res.json({
        taskNos: distinctTaskNos
          .filter((item) => item != null)
          .sort((a, b) => a - b),
        moNos: distinctMoNos.filter((item) => item != null).sort(),
        packageNos: distinctPackageNos
          .filter((item) => item != null)
          .sort((a, b) => a - b),
        departments: distinctDepartments.filter((item) => item != null).sort(),
        lineNos: distinctLineNos
          .filter((item) => item != null)
          .sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            if (!isNaN(numA)) return -1;
            if (!isNaN(numB)) return 1;
            return String(a).localeCompare(String(b));
          }),
        qcIds: distinctQcIds.filter((item) => item != null).sort()
      });
    } catch (error) {
      console.error("Error fetching distinct packing filter options:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch distinct packing filter options" });
    }
};

export const getUserPackingTasks = async (req, res) => {
  try {
    const { emp_id } = req.params;
    
    const workerTasks = await IEWorkerTask.findOne({ emp_id });
    
    if (!workerTasks || !workerTasks.tasks) {
      return res.json({ assignedTasks: [] });
    }
    
    // Filter tasks that are relevant to Packing (63, 66, 67, 68)
    const packingRelevantTasks = [63, 66, 67, 68];
    const assignedPackingTasks = workerTasks.tasks.filter(task => 
      packingRelevantTasks.includes(task)
    );
    
    res.json({ assignedTasks: assignedPackingTasks });
  } catch (error) {
    console.error("Error fetching user Packing tasks:", error);
    res.status(500).json({ error: "Failed to fetch user tasks" });
  }
};