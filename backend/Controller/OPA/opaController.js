import bcrypt from "bcrypt";
import {
 OPA,
 QC2InspectionPassBundle,               
} from "../../Config/mongodb.js";

/* ------------------------------
   End Points - Washing
------------------------------ */
// export const getBundleId = async (req, res) => {
//     try {
//         const bundle = await QC2OrderData.findOne({
//           bundle_random_id: req.params.randomId,
//         });
//         if (!bundle) {
//           return res.status(404).json({ error: "Bundle not found" });
//         }
//         res.json(bundle);
//       } catch (error) {
//         console.error("Error fetching bundle:", error);
//         res.status(500).json({ error: "Failed to fetch bundle" });
//       }
// };

export const getOPAId = async (req, res) => {
    try {
        const record = await OPA.findOne({
          opa_bundle_id: req.params.bundleId,
        });
        res.json({ exists: !!record });
      } catch (error) {
        res.status(500).json({ error: "Error checking record" });
      }
};

export const getOPADefectId = async (req, res) => {
    try {
        const { defectPrintId } = req.params;
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
          package_no: defectRecord.package_no,
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
        console.error("Error checking defect card for OPA:", error);
        res.status(500).json({ message: error.message });
      }
};

export const getLastOPAId = async (req, res) => {
    try {
        const { emp_id } = req.params;
        const lastRecord = await OPA.findOne(
          { emp_id_opa: emp_id },
          {},
          { sort: { opa_record_id: -1 } }
        );
        const lastRecordId = lastRecord ? lastRecord.opa_record_id : 0;
        res.json({ lastRecordId });
      } catch (error) {
        console.error("Error fetching last OPA record ID:", error);
        res.status(500).json({ error: "Failed to fetch last OPA record ID" });
      }
};

export const saveOPA = async (req, res) => {
    try {
    const newRecord = new OPA(req.body);
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

export const getOPARecords = async (req, res) => {
    try {
    const records = await OPA.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch OPA records" });
  }
};