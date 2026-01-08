import {
  QC2InspectionPassBundle,
  QC2DefectPrint,
} from "../../MongoDB/dbConnectionController.js";

import {
    normalizeDateString,
 } from "../../../helpers/helperFunctions.js";

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */
// New endpoint to fetch by bundle_random_id
export const getQC2PassbundleDataByBundleRandomId = async (req, res) => {
  try {
      const { bundle_random_id } = req.params;
      const record = await QC2InspectionPassBundle.findOne({
        bundle_random_id
      });
      if (record) {
        res.json(record);
      } else {
        res.status(404).json({ message: "Record not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// New GET endpoint to fetch record by defect_print_id
export const getQC2PassbundleDataByDefectPrintId = async (req, res) => {
    try {
      const { defect_print_id } = req.params;
      const { includeCompleted } = req.query;

      let query = {
        "printArray.defect_print_id": defect_print_id
      };

      if (includeCompleted !== "true") {
        query["printArray.isCompleted"] = false;
      }

      const record = await QC2InspectionPassBundle.findOne(query);

      if (record) {
        res.json(record);
      } else {
        res
          .status(404)
          .json({ message: "Record not found or already completed" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// Filter Pane for Live Dashboard - EndPoints
export const getQC2PassbundleData = async (req, res) => {
    try {
        const filterOptions = await QC2InspectionPassBundle.aggregate([
          {
            $group: {
              _id: null,
              moNo: { $addToSet: "$moNo" },
              color: { $addToSet: "$color" },
              size: { $addToSet: "$size" },
              department: { $addToSet: "$department" },
              emp_id_inspection: { $addToSet: "$emp_id_inspection" },
              buyer: { $addToSet: "$buyer" },
              package_no: { $addToSet: "$package_no" }, // Added package_no
              lineNo: { $addToSet: "$lineNo" } // Add Line No
            }
          },
          {
            $project: {
              _id: 0,
              moNo: 1,
              color: 1,
              size: 1,
              department: 1,
              emp_id_inspection: 1,
              buyer: 1,
              package_no: 1,
              lineNo: 1 // Include Line No
            }
          }
        ]);

        const result =
          filterOptions.length > 0
            ? filterOptions[0]
            : {
                moNo: [],
                color: [],
                size: [],
                department: [],
                emp_id_inspection: [],
                buyer: [],
                package_no: [],
                lineNo: [] // Include Line No
              };

        Object.keys(result).forEach((key) => {
          result[key] = result[key]
            .filter(Boolean)
            .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b))); // Numeric sort for package_no
          //.sort((a, b) => a.localeCompare(b));
        });

        res.json(result);
      } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ error: "Failed to fetch filter options" });
      }
};

export const getQC2InspectionData = async (req, res) => {
    try {
      const filterOptions = await QC2DefectPrint.aggregate([
        {
          $group: {
            _id: null,
            moNo: { $addToSet: "$moNo" },
            package_no: { $addToSet: "$package_no" },
            repair: { $addToSet: "$repair" }
          }
        },
        {
          $project: {
            _id: 0,
            moNo: 1,
            package_no: 1,
            repair: 1
          }
        }
      ]);
      const result = filterOptions[0] || { moNo: [], package_no: [], repair: [] };
      Object.keys(result).forEach((key) => {
        result[key] = result[key]
          .filter(Boolean)
          .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b)));
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
};
// GET endpoint to fetch all inspection records
export const getAllQC2PassbundleData = async (req, res) => {
    try {
      const {
        moNo,
        package_no,
        emp_id_inspection,
        line_no, // Added
        taskNo,  // Added
        date,
        startDate,
        endDate,
        color,
        size,
        department,
        page = 1,
        limit = 50 // Default to 50 records per page
      } = req.query;

      let match = {};
      if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
      if (package_no) {
        const packageNoNumber = Number(package_no);
        if (isNaN(packageNoNumber)) {
          return res.status(400).json({ error: "Package No must be a number" });
        }
        match.package_no = packageNoNumber;
      }
      if (emp_id_inspection)
        match.emp_id_inspection = {
          $regex: new RegExp(emp_id_inspection.trim(), "i")
        };

        if (line_no) {
        match.lineNo = line_no;
      }
      // Handle taskNo from query, matching against the 'taskNo' field in the database
      if (taskNo) {
        match.taskNo = taskNo;
      }
      if (color) match.color = color;
      if (size) match.size = size;
      if (department) match.department = department;

      if (date) {
          if (date) match.inspection_date = normalizeDateString(date);

      }
      if (startDate || endDate) {
        match.inspection_date = {};
        if (startDate)
          match.inspection_date.$gte = normalizeDateString(startDate);
        if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const pipeline = [
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limitNum }],
            total: [{ $count: "count" }]
          }
        }
      ];

      const result = await QC2InspectionPassBundle.aggregate(pipeline);
      const data = result[0].data || [];
      const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

      // console.log("Search result:", { data, total });
      res.json({ data, total });
    } catch (error) {
      console.error("Error searching data cards:", error);
      res.status(500).json({ error: error.message });
    }
};

export const getQC2Defect = async (req, res) => {
    try {
    const { moNo, package_no, repair,date, page = 1, limit = 50 } = req.query;
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (date) match.inspection_date = normalizeDateString(date);
    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber))
        return res.status(400).json({ error: "Package No must be a number" });
      match.package_no = packageNoNumber;
    }
    if (repair) match.repair = { $regex: new RegExp(repair.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2DefectPrint.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ data, total });
  } catch (error) {
    console.error("Error searching defect print cards:", error);
    res.status(500).json({ error: error.message });
  }
};
