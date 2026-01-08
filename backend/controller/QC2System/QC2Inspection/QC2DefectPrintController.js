import {
  QC2DefectPrint,
} from "../../MongoDB/dbConnectionController.js";


/* ------------------------------
   QC2 - Defect Print
------------------------------ */

// Create new defect print record
export const createDefectPrintRecord = async (req, res) => {
    try {
    const {
      factory,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      repair,
      count,
      count_print,
      defects,
      defect_id,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id
    } = req.body;

    const now = new Date();
    const print_time = now.toLocaleTimeString("en-US", { hour12: false });

    const defectPrint = new QC2DefectPrint({
      factory,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      repair,
      count,
      count_print,
      defects,
      print_time,
      defect_id,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id
    });

    const savedDefectPrint = await defectPrint.save();
    res.json(savedDefectPrint);
  } catch (error) {
    console.error("Error creating defect print record:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search defect print records
export const searchDefectPrintRecords = async (req, res) => {
    try {
      const { moNo, package_no, repair } = req.query;
      const query = {};

      // Build the query object based on provided parameters
      if (moNo) {
        query.moNo = { $regex: new RegExp(moNo.trim(), "i") };
      }

      if (package_no) {
        const packageNoNumber = Number(package_no);
        if (isNaN(packageNoNumber)) {
          return res.status(400).json({ error: "Package No must be a number" });
        }
        query.package_no = packageNoNumber;
      }

      if (repair) {
        query.repair = { $regex: new RegExp(repair.trim(), "i") };
      }

      // Execute the search query
      const defectPrints = await QC2DefectPrint.find(query).sort({
        createdAt: -1
      });

      // Return empty array if no results found
      if (!defectPrints || defectPrints.length === 0) {
        return res.json([]);
      }

      res.json(defectPrints);
    } catch (error) {
      console.error("Error searching defect print records:", error);
      res.status(500).json({
        error: "Failed to search defect cards",
        details: error.message
      });
    }
};

// Fetch all defect print records
export const fetchAllDefectPrintRecords = async (req, res) => {
    try {
    const defectPrints = await QC2DefectPrint.find().sort({ createdAt: -1 });

    if (!defectPrints || defectPrints.length === 0) {
      return res.json([]);
    }

    res.json(defectPrints);
  } catch (error) {
    console.error("Error fetching defect print records:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get defect print records by defect_id
export const getDefectPrintRecordsByDefectId = async (req, res) => {
    try {
    const { defect_id } = req.params;
    const defectPrint = await QC2DefectPrint.findOne({ defect_id });

    if (!defectPrint) {
      return res.status(404).json({ error: "Defect print record not found" });
    }

    res.json(defectPrint);
  } catch (error) {
    console.error("Error fetching defect print record:", error);
    res.status(500).json({ error: error.message });
  }
};
