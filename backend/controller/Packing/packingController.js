import {
 Packing,
 QC2InspectionPassBundle,
 QC2OrderData,                
} from "../MongoDB/dbConnectionController.js";

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

// New Endpoint to Get Bundle by Random ID (from qc2_inspection_pass_bundle for order cards)
export const getBundleId = async (req, res) => {
    try {
        const bundle = await QC2OrderData.findOne({
          bundle_random_id: req.params.randomId
        });
        if (!bundle) {
          return res.status(404).json({ error: "Bundle not found" });
        }
        res.json(bundle);
      } catch (error) {
        console.error("Error fetching bundle:", error);
        res.status(500).json({ error: "Failed to fetch bundle" });
      }
};

// Check if Packing record exists (updated for task_no 62)
// export const getPackingId = async (req, res) => {
//     try {
//         const record = await Packing.findOne({
//           packing_bundle_id: req.params.bundleId, // No change needed here, but ensure it matches task_no 62 in Packing.jsx
//         });
//         res.json({ exists: !!record });
//       } catch (error) {
//         res.status(500).json({ error: "Error checking record" });
//       }
// };

// New endpoint to get the last Packing record ID for a specific emp_id (no change needed)
// export const getLastPackingId = async (req, res) => {
//     try {
//         const { emp_id } = req.params;
//         const lastRecord = await Packing.findOne(
//           { emp_id_packing: emp_id }, // Filter by emp_id_packing
//           {},
//           { sort: { packing_record_id: -1 } } // Sort descending to get the highest ID
//         );
//         const lastRecordId = lastRecord ? lastRecord.packing_record_id : 0; // Start at 0 if no records exist
//         res.json({ lastRecordId });
//       } catch (error) {
//         console.error("Error fetching last Packing record ID:", error);
//         res.status(500).json({ error: "Failed to fetch last Packing record ID" });
//       }
// };

// Modified endpoint to fetch defect card data from qc2_inspection_pass_bundle with defect_print_id (updated for task_no 62)
// export const getDefectCardData = async (req, res) => {
//     try {
//         const { defectPrintId } = req.params;
//         // console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log
    
//         const defectRecord = await QC2InspectionPassBundle.findOne({
//           "printArray.defect_print_id": defectPrintId,
//           "printArray.isCompleted": false,
//         });
    
//         if (!defectRecord) {
//           console.log(
//             `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
//           );
//           return res.status(404).json({ message: "Defect card not found" });
//         }
    
//         const printData = defectRecord.printArray.find(
//           (item) => item.defect_print_id === defectPrintId
//         );
//         if (!printData) {
//           console.log(
//             `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
//           );
//           return res
//             .status(404)
//             .json({ message: "Defect print ID not found in printArray" });
//         }
    
//         const formattedData = {
//           defect_print_id: printData.defect_print_id,
//           totalRejectGarmentCount: printData.totalRejectGarmentCount,
//           totalRejectGarment_Var: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var for defect cards
//           package_no: defectRecord.package_no, // Include package_no
//           moNo: defectRecord.moNo,
//           selectedMono: defectRecord.moNo,
//           custStyle: defectRecord.custStyle,
//           buyer: defectRecord.buyer,
//           color: defectRecord.color,
//           size: defectRecord.size,
//           factory: defectRecord.factory,
//           country: defectRecord.country,
//           lineNo: defectRecord.lineNo,
//           department: defectRecord.department,
//           count: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var as count for defect cards
//           totalBundleQty: 1, // Set hardcoded as 1 for defect card
//           emp_id_inspection: defectRecord.emp_id_inspection,
//           inspection_date: defectRecord.inspection_date,
//           inspection_time: defectRecord.inspection_time,
//           sub_con: defectRecord.sub_con,
//           sub_con_factory: defectRecord.sub_con_factory,
//           bundle_id: defectRecord.bundle_id,
//           bundle_random_id: defectRecord.bundle_random_id,
//         };
    
//         res.json(formattedData);
//       } catch (error) {
//         console.error("Error checking defect card:", error);
//         res.status(500).json({ message: error.message });
//       }
// };

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