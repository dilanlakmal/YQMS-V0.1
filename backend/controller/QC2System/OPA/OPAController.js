import {
 OPA,
 QC2InspectionPassBundle, 
 IEWorkerTask,             
} from "../../MongoDB/dbConnectionController.js";

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
      opa_bundle_id: req.params.bundleId
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

// GET distinct filter options for OPA records
export const getOpaFilterOptions = async (req, res) => {
  try {
    const [
      distinctTaskNos,
      moNosFromMoNoField,
      moNosFromSelectedMonoField,
      distinctPackageNos,
      distinctDepartments,
      distinctLineNos,
      distinctQcIds
    ] = await Promise.all([
      OPA.distinct("task_no_opa").exec(),
      OPA.distinct("moNo").exec(),
      OPA.distinct("selectedMono").exec(),
      OPA.distinct("package_no").exec(),
      OPA.distinct("department").exec(),
      OPA.distinct("lineNo").exec(),
      OPA.distinct("emp_id_opa").exec()
    ]);

    // Combine MO numbers from two different fields and get only unique values
    const combinedMoNos = [
      ...new Set([...moNosFromMoNoField, ...moNosFromSelectedMonoField])
    ];

    // Send the cleaned and sorted data in the JSON response
    res.json({
      taskNos: distinctTaskNos
        .filter((item) => item != null)
        .sort((a, b) => a - b),

      moNos: combinedMoNos.filter((item) => item != null).sort(),

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
    console.error("Error fetching distinct OPA filter options:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch distinct OPA filter options" });
  }
};

export const getUserOPATasks = async (req, res) => {
  try {
    const { emp_id } = req.params;
    
    const workerTasks = await IEWorkerTask.findOne({ emp_id });
    
    if (!workerTasks || !workerTasks.tasks) {
      return res.json({ assignedTasks: [] });
    }
    
    // Filter tasks that are relevant to OPA (60, 61, 62, 103, 104, 105)
    const opaRelevantTasks = [60, 61, 62, 103, 104, 105];
    const assignedOpaTasks = workerTasks.tasks.filter(task => 
      opaRelevantTasks.includes(task)
    );
    
    res.json({ assignedTasks: assignedOpaTasks });
  } catch (error) {
    console.error("Error fetching user OPA tasks:", error);
    res.status(500).json({ error: "Failed to fetch user tasks" });
  }
};
