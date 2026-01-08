import {
 QC2OrderData,
} from "../../MongoDB/dbConnectionController.js";

import { normalizeDateString} from "../../../helpers/helperFunctions.js";


// Combined search endpoint for MONo, Package No, and Emp ID from qc2_orderdata
export const searchQC2OrderData = async (req, res) => {
  try {
    const {
      date,
      lineNo,
      selectedMono,
      packageNo,
      buyer,
      empId, // Renamed from selectedEmpId to empId for consistency
      page = 1,
      limit = 15,
      sortBy = "updated_date_seperator", // Default sort for latest
      sortOrder = "desc"
    } = req.query;

    let matchQuery = {};

    if (date) {
      const normalizedQueryDate = normalizeDateString(date);
      if (normalizedQueryDate) {
        matchQuery.updated_date_seperator = normalizedQueryDate;
      }
    }
    if (lineNo) matchQuery.lineNo = lineNo;
    if (selectedMono) matchQuery.selectedMono = selectedMono;
    if (packageNo) {
      const pkgNo = parseInt(packageNo);
      if (!isNaN(pkgNo)) matchQuery.package_no = pkgNo;
    }
    if (buyer) matchQuery.buyer = buyer;
    if (empId) matchQuery.emp_id = empId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    let sortOptions = {};
    if (sortBy === "updated_date_seperator") {
      sortOptions = {
        updated_date_seperator: sortDirection,
        updated_time_seperator: sortDirection
      };
    } else {
      sortOptions[sortBy] = sortDirection;
    }

    const totalRecords = await QC2OrderData.countDocuments(matchQuery);
    const records = await QC2OrderData.find(matchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // For reprint, we don't necessarily need global stats like in the other tab,
    // but we do need pagination info.
    res.json({
      records,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("Error searching qc2_orderdata for reprint:", error);
    res.status(500).json({ error: "Failed to search records for reprint" });
  }
};

// Fetch colors and sizes for a specific MONo (unchanged)
export const fetchColorsAndSizes = async (req, res) => {
  try {
    const mono = req.params.mono;
    // This fetches distinct color/size combinations for a given MONO from qc2_orderdata
    const result = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } },
      { $group: { _id: { color: "$color", size: "$size" } } },
      { $group: { _id: "$_id.color", sizes: { $addToSet: "$_id.size" } } }, // Use $addToSet for unique sizes
      { $project: { color: "$_id", sizes: 1, _id: 0 } },
      { $sort: { color: 1 } } // Sort colors
    ]);
    // Further sort sizes within each color if needed client-side or here
    result.forEach((item) => item.sizes.sort());
    res.json(result);
  } catch (error) {
    console.error("Error fetching colors/sizes for reprint:", error);
    res.status(500).json({ error: "Failed to fetch colors/sizes for reprint" });
  }
};

// NEW ENDPOINT: Get distinct values for ReprintTab filters from qc2_orderdata
 export const getDistinctReprintFilters = async (req, res) => {
    try {
      const distinctMonos = await QC2OrderData.distinct("selectedMono");
      const distinctPackageNos = await QC2OrderData.distinct("package_no"); // Might be many if not filtered first
      const distinctEmpIds = await QC2OrderData.distinct("emp_id");
      const distinctLineNos = await QC2OrderData.distinct("lineNo");
      const distinctBuyers = await QC2OrderData.distinct("buyer");

      res.json({
        monos: distinctMonos.sort(),
        packageNos: distinctPackageNos
          .map(String)
          .sort((a, b) => parseInt(a) - parseInt(b)), // Ensure string for select, sort numerically
        empIds: distinctEmpIds.sort(),
        lineNos: distinctLineNos.sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return a.localeCompare(b);
        }),
        buyers: distinctBuyers.sort()
      });
    } catch (error) {
      console.error("Error fetching distinct filter values for reprint:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch distinct filter values for reprint" });
    }
  };
