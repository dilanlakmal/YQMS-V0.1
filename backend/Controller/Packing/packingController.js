import bcrypt from "bcrypt";
import {
 Packing,
 QC2InspectionPassBundle,                
} from "../../Config/mongodb.js";

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

// New Endpoint to Get Bundle by Random ID (from qc2_inspection_pass_bundle for order cards)
export const getBundleId = async (req, res) => {
    try {
        const randomId = req.params.randomId.trim(); // Trim to avoid whitespace issues
        // console.log("Searching for bundle_random_id:", randomId);
    
        // First, check qc2_inspection_pass_bundle for order card
        const bundle = await QC2InspectionPassBundle.findOne({
          bundle_random_id: randomId,
          "printArray.isCompleted": false, // Ensure bundle is not completed
        });
    
        if (!bundle) {
          return res
            .status(404)
            .json({ error: "This bundle has not been inspected yet" });
        }
    
        // Use the first printArray entry (assuming one bundle_random_id per document for simplicity)
        const printData = bundle.printArray.find(
          (item) => item.isCompleted === false
        );
        if (!printData) {
          return res
            .status(404)
            .json({ error: "No active print data found for this bundle" });
        }
    
        const formattedData = {
          bundle_id: bundle.bundle_id,
          bundle_random_id: bundle.bundle_random_id,
          package_no: bundle.package_no, // Include package_no
          moNo: bundle.moNo,
          selectedMono: bundle.moNo,
          custStyle: bundle.custStyle,
          buyer: bundle.buyer,
          color: bundle.color,
          size: bundle.size,
          factory: bundle.factory || "N/A",
          country: bundle.country || "N/A",
          lineNo: bundle.lineNo,
          department: bundle.department,
          count: bundle.totalPass, // Use totalPass as checkedQty for order cards
          totalBundleQty: 1, // Set hardcoded as 1 for order card
          emp_id_inspection: bundle.emp_id_inspection,
          inspection_date: bundle.inspection_date,
          inspection_time: bundle.inspection_time,
          sub_con: bundle.sub_con,
          sub_con_factory: bundle.sub_con_factory,
        };
    
        res.json(formattedData);
      } catch (error) {
        console.error("Error fetching bundle:", error);
        res.status(500).json({ error: "Failed to fetch bundle" });
      }
};

// Check if Packing record exists (updated for task_no 62)
export const getPackingId = async (req, res) => {
    try {
        const record = await Packing.findOne({
          packing_bundle_id: req.params.bundleId, // No change needed here, but ensure it matches task_no 62 in Packing.jsx
        });
        res.json({ exists: !!record });
      } catch (error) {
        res.status(500).json({ error: "Error checking record" });
      }
};

// New endpoint to get the last Packing record ID for a specific emp_id (no change needed)
export const getLastPackingId = async (req, res) => {
    try {
        const { emp_id } = req.params;
        const lastRecord = await Packing.findOne(
          { emp_id_packing: emp_id }, // Filter by emp_id_packing
          {},
          { sort: { packing_record_id: -1 } } // Sort descending to get the highest ID
        );
        const lastRecordId = lastRecord ? lastRecord.packing_record_id : 0; // Start at 0 if no records exist
        res.json({ lastRecordId });
      } catch (error) {
        console.error("Error fetching last Packing record ID:", error);
        res.status(500).json({ error: "Failed to fetch last Packing record ID" });
      }
};

// Modified endpoint to fetch defect card data from qc2_inspection_pass_bundle with defect_print_id (updated for task_no 62)
export const getDefectCardData = async (req, res) => {
    try {
        const { defectPrintId } = req.params;
        // console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log
    
        const defectRecord = await QC2InspectionPassBundle.findOne({
          "printArray.defect_print_id": defectPrintId,
          "printArray.isCompleted": false,
        });
    
        if (!defectRecord) {
          console.log(
            `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
          );
          return res.status(404).json({ message: "Defect card not found" });
        }
    
        const printData = defectRecord.printArray.find(
          (item) => item.defect_print_id === defectPrintId
        );
        if (!printData) {
          console.log(
            `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
          );
          return res
            .status(404)
            .json({ message: "Defect print ID not found in printArray" });
        }
    
        const formattedData = {
          defect_print_id: printData.defect_print_id,
          totalRejectGarmentCount: printData.totalRejectGarmentCount,
          totalRejectGarment_Var: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var for defect cards
          package_no: defectRecord.package_no, // Include package_no
          moNo: defectRecord.moNo,
          selectedMono: defectRecord.moNo,
          custStyle: defectRecord.custStyle,
          buyer: defectRecord.buyer,
          color: defectRecord.color,
          size: defectRecord.size,
          factory: defectRecord.factory,
          country: defectRecord.country,
          lineNo: defectRecord.lineNo,
          department: defectRecord.department,
          count: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var as count for defect cards
          totalBundleQty: 1, // Set hardcoded as 1 for defect card
          emp_id_inspection: defectRecord.emp_id_inspection,
          inspection_date: defectRecord.inspection_date,
          inspection_time: defectRecord.inspection_time,
          sub_con: defectRecord.sub_con,
          sub_con_factory: defectRecord.sub_con_factory,
          bundle_id: defectRecord.bundle_id,
          bundle_random_id: defectRecord.bundle_random_id,
        };
    
        res.json(formattedData);
      } catch (error) {
        console.error("Error checking defect card:", error);
        res.status(500).json({ message: error.message });
      }
};

// Save Packing record (no change needed, but ensure task_no is 62 in Packing.jsx)
export const savePacking = async (req, res) => {
    try {
    const newRecord = new Packing(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
};

//For Data tab display records in a table (no change needed)
export const getPackingRecords = async (req, res) => {
    try {
        const records = await Packing.find();
        res.json(records);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch Packing records" });
      }
};

// GET distinct filter options for Packing records
export const getPackingFilterOptions = async (req, res) => {
  try {
    const qcIds = await Packing.distinct('emp_id_packing').exec();
    const taskNos = await Packing.distinct('task_no_packing').exec();

    const moNosFromMoNo = await Packing.distinct('moNo').exec();
    const moNosFromSelectedMono = await Packing.distinct('selectedMono').exec();
    const combinedMoNos = [...new Set([...moNosFromMoNo, ...moNosFromSelectedMono].filter(Boolean))];

    const packageNos = await Packing.distinct('package_no').exec();
    const departments = await Packing.distinct('department').exec();
    const custStyles = await Packing.distinct('custStyle').exec();

    res.json({
      qcIds: qcIds.filter(id => id != null),
      taskNos: taskNos.filter(tn => tn != null),
      moNos: combinedMoNos.filter(mo => mo != null),
      packageNos: packageNos.filter(pn => pn != null),
      departments: departments.filter(dept => dept != null),
      custStyles: custStyles.filter(style => style != null),
    });
  } catch (error) {
    console.error('Error fetching distinct Packing filter options:', error);
    res.status(500).json({ message: 'Failed to fetch distinct Packing filter options' });
  }
};