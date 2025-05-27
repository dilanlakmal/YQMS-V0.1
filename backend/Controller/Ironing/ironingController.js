import bcrypt from "bcrypt";
import {
 Ironing,
 QC2InspectionPassBundle,                
} from "../../Config/mongodb.js";

/* ------------------------------
   End Points - Ironing
------------------------------ */

// Check if ironing record exists
export const getIroningId = async (req, res) => {
     try {
        const record = await Ironing.findOne({
          ironing_bundle_id: req.params.bundleId,
        });
        res.json({ exists: !!record });
      } catch (error) {
        res.status(500).json({ error: "Error checking record" });
      }
};

// New endpoint to get the last ironing record ID for a specific emp_id
export const getLastIroningId = async (req, res) => {
    try {
        const { emp_id } = req.params;
        const lastRecord = await Ironing.findOne(
          { emp_id_ironing: emp_id }, // Filter by emp_id_ironing
          {},
          { sort: { ironing_record_id: -1 } } // Sort descending to get the highest ID
        );
        const lastRecordId = lastRecord ? lastRecord.ironing_record_id : 0; // Start at 0 if no records exist
        res.json({ lastRecordId });
      } catch (error) {
        console.error("Error fetching last ironing record ID:", error);
        res.status(500).json({ error: "Failed to fetch last ironing record ID" });
      }
};

// Modified endpoint to fetch defect card data with logging
export const getDefectCardData = async (req, res) => {
     try {
    const { defectPrintId } = req.params;
        //console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log
    
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
          count: defectRecord.checkedQty,
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

// Save ironing record
export const saveIroning = async (req, res) => {
     try {
        const newRecord = new Ironing(req.body);
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

// For Data tab display records in a table
export const getIroningRecords = async (req, res) => {
    try {
        const records = await Ironing.find();
        res.json(records);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch ironing records" });
      }
};

