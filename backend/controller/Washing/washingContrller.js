import {
//  QC2OrderData, 
 Washing,
 QC2InspectionPassBundle,               
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   End Points - Washing
------------------------------ */

// New Endpoint to Get Bundle by Random ID
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

export const getWasgingId = async (req, res) => {
    try {
    const record = await Washing.findOne({
      washing_bundle_id: req.params.bundleId
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
};

export const getWashDefectId = async (req, res) => {
    try {
    const { defectPrintId } = req.params;
    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false
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
      bundle_random_id: defectRecord.bundle_random_id
    };
    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card for washing:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getLasrWashId = async (req, res) => {
    try {
        const { emp_id } = req.params;
        const lastRecord = await Washing.findOne(
          { emp_id_washing: emp_id },
          {},
          { sort: { washing_record_id: -1 } }
        );
        const lastRecordId = lastRecord ? lastRecord.washing_record_id : 0;
        res.json({ lastRecordId });
      } catch (error) {
        console.error("Error fetching last washing record ID:", error);
        res.status(500).json({ error: "Failed to fetch last washing record ID" });
      }
};

export const saveWash = async (req, res) => {
    try {
    const newRecord = new Washing(req.body);
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

export const getWasingRecord = async (req, res) => {
   try {
    const records = await Washing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch washing records" });
  }
};

// GET distinct filter options for washing records
export const getWashingFilterOptions = async (req, res) => {
   try {
    // Run all distinct queries in parallel for better performance
    const [
      distinctTaskNos,
      moNosFromMoNoField,
      moNosFromSelectedMonoField,
      distinctPackageNos,
      distinctDepartments,
      distinctLineNos, // ADDED
      distinctQcIds // ADDED
    ] = await Promise.all([
      Washing.distinct("task_no_washing").exec(),
      Washing.distinct("moNo").exec(),
      Washing.distinct("selectedMono").exec(),
      Washing.distinct("package_no").exec(),
      Washing.distinct("department").exec(),
      Washing.distinct("lineNo").exec(), // ADDED: Fetch distinct line numbers
      Washing.distinct("emp_id_washing").exec() // ADDED: Fetch distinct QC IDs from washing records
    ]);

    // Post-processing: Combine, filter, and sort the results after they are fetched

    // 1. Combine MO numbers from two different fields and get only unique values
    const combinedMoNos = [
      ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
    ];

    // 2. Send the cleaned and sorted data in the JSON response
    res.json({
      taskNos: distinctTaskNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      moNos: combinedMoNos.filter((item) => item != null).sort(),

      packageNos: distinctPackageNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      departments: distinctDepartments.filter((item) => item != null).sort(),

      // ADDED: lineNos field
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

      // ADDED: qcIds field
      qcIds: distinctQcIds.filter((item) => item != null).sort()

      // REMOVED: custStyles field is no longer sent
      // custStyles: distinctCustStyles.filter((item) => item != null).sort()
    });
  } catch (error) {
    console.error("Error fetching distinct washing filter options:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct filter options" });
  }
};