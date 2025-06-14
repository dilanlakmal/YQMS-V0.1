import bcrypt from "bcrypt";
import {
 ymEcoConnection,
 QC2OrderData,                
} from "../../Config/mongodb.js";
import { generateRandomId } from "../../Helpers/helperFunction.js";

import { normalizeDateString } from "../../Helpers/helperFunction.js";

// Update the MONo search endpoint to handle partial matching
export const getMoNoSearch = async (req, res) => {
    try {
        const term = req.query.term; // Changed from 'digits' to 'term'
        if (!term) {
          return res.status(400).json({ error: "Search term is required" });
        }
    
        const collection = ymEcoConnection.db.collection("dt_orders");
    
        // Use a case-insensitive regex to match the term anywhere in Order_No
        const regexPattern = new RegExp(term, "i");
    
        const results = await collection
          .find({
            Order_No: { $regex: regexPattern }
          })
          .project({ Order_No: 1, _id: 0 }) // Only return Order_No field
          .limit(100) // Limit results to prevent overwhelming the UI
          .toArray();
    
        // Extract unique Order_No values
        const uniqueMONos = [...new Set(results.map((r) => r.Order_No))];
    
        res.json(uniqueMONos);
      } catch (error) {
        console.error("Error searching MONo:", error);
        res.status(500).json({ error: "Failed to search MONo" });
      }
};

// Update /api/order-details endpoint
export const getOrderDetails = async (req, res) => {
    try {
        const collection = ymEcoConnection.db.collection("dt_orders");
        const order = await collection.findOne({
          Order_No: req.params.mono,
        });
    
        if (!order) return res.status(404).json({ error: "Order not found" });
    
        const colorMap = new Map();
        order.OrderColors.forEach((colorObj) => {
          const colorKey = colorObj.Color.toLowerCase().trim();
          const originalColor = colorObj.Color.trim();
    
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, {
              originalColor,
              colorCode: colorObj.ColorCode,
              chnColor: colorObj.ChnColor,
              colorKey: colorObj.ColorKey,
              sizes: new Map(),
            });
          }
    
          colorObj.OrderQty.forEach((sizeEntry) => {
            const sizeName = Object.keys(sizeEntry)[0];
            const quantity = sizeEntry[sizeName];
            const cleanSize = sizeName.split(";")[0].trim();
    
            if (quantity > 0) {
              colorMap.get(colorKey).sizes.set(cleanSize, {
                orderQty: quantity,
                planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0,
              });
            }
          });
        });
    
        const response = {
          engName: order.EngName,
          totalQty: order.TotalQty,
          factoryname: order.Factory || "N/A",
          custStyle: order.CustStyle || "N/A",
          country: order.Country || "N/A",
          colors: Array.from(colorMap.values()).map((c) => ({
            original: c.originalColor,
            code: c.colorCode,
            chn: c.chnColor,
            key: c.colorKey,
          })),
          colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
            acc[curr.originalColor.toLowerCase()] = {
              sizes: Array.from(curr.sizes.keys()),
              details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
                size,
                orderQty: data.orderQty,
                planCutQty: data.planCutQty,
              })),
            };
            return acc;
          }, {}),
        };
    
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch order details" });
      }
};

// Update /api/order-sizes endpoint
export const getOrderSizes = async (req, res) => {
    try {
    const collection = ymEcoConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });
    if (!order) return res.status(404).json({ error: "Order not found" });
    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );
    if (!colorObj) return res.json([]);
    const sizesWithDetails = colorObj.OrderQty.filter(
      (entry) => entry[Object.keys(entry)[0]] > 0
    )
      .map((entry) => {
        const sizeName = Object.keys(entry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        return {
          size: cleanSize,
          orderQty: entry[sizeName],
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0,
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

    res.json(sizesWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
};

// Bundle Qty Endpoint
export const getBundleQty = async (req, res) => {
    try {
        const mono = req.params.mono;
        const total = await QC2OrderData.aggregate([
          { $match: { selectedMono: mono } }, // Match documents with the given MONo
          {
            $group: {
              _id: null, // Group all matched documents
              total: { $sum: "$totalBundleQty" }, // Correct sum using field reference with $
            },
          },
        ]);
        res.json({ total: total[0]?.total || 0 }); // Return the summed total or 0 if no documents
      } catch (error) {
        console.error("Error fetching total bundle quantity:", error);
        res.status(500).json({ error: "Failed to fetch total bundle quantity" });
      }
};

// Endpoint to get total garments count for a specific MONo, Color, and Size
export const getTotalGarmentsCount = async (req, res) => {
    try {
        const { mono, color, size } = req.params;
    
        const totalCount = await QC2OrderData.aggregate([
          { $match: { selectedMono: mono, color: color, size: size } },
          {
            $group: {
              _id: null,
              totalCount: { $sum: "$count" }, // Sum the count field
            },
          },
        ]);
    
        res.json({ totalCount: totalCount[0]?.totalCount || 0 }); // Return total count or 0
      } catch (error) {
        console.error("Error fetching total garments count:", error);
        res.status(500).json({ error: "Failed to fetch total garments count" });
      }
};

// Endpoint to fetch available colors for a selected order
export const getAvailableColors = async (req, res) => {
    try {
        const { styleNo } = req.query;
        if (!styleNo) {
          return res.status(400).json({ error: "styleNo is required" });
        }
    
        const collection = ymEcoConnection.db.collection("dt_orders");
        const order = await collection.findOne({ Order_No: styleNo });
    
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
    
        const colors = order.OrderColors.map(colorObj => colorObj.Color.trim());
        res.json({ colors });
      } catch (error) {
        console.error("Error fetching colors:", error);
        res.status(500).json({ error: "Failed to fetch colors" });
      }
};

// Endpoint to fetch available sizes for a selected order
export const getAvailableSizes = async (req, res) => {
    try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "styleNo is required" });
    }

    const collection = ymEcoConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: styleNo });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const sizes = new Set();
    order.OrderColors.forEach(colorObj => {
      colorObj.OrderQty.forEach(sizeEntry => {
        const sizeName = Object.keys(sizeEntry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        sizes.add(cleanSize);
      });
    });

    res.json({ sizes: Array.from(sizes) });
  } catch (error) {
    console.error("Error fetching sizes:", error);
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
};

// Save bundle data to MongoDB
export const saveBundleData = async (req, res) => {
    try {
        const { bundleData } = req.body;
        const savedRecords = [];
    
        // Save each bundle record
        for (const bundle of bundleData) {
    
          const packageCount = await QC2OrderData.countDocuments({
            selectedMono: bundle.selectedMono,
            //color: bundle.color,
            //size: bundle.size,
          });
    
          const randomId = await generateRandomId();
    
          const now = new Date();
    
          // Format timestamps
          const updated_date_seperator = now.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          });
    
          const updated_time_seperator = now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
    
          const newBundle = new QC2OrderData({
            ...bundle,
            package_no: packageCount + 1,
            bundle_random_id: randomId,
            factory: bundle.factory || "N/A", // Handle null factory
            custStyle: bundle.custStyle || "N/A", // Handle null custStyle
            country: bundle.country || "N/A", // Handle null country
            department: bundle.department,
            sub_con: bundle.sub_con || "No",
            sub_con_factory:
              bundle.sub_con === "Yes" ? bundle.sub_con_factory || "" : "N/A",
            updated_date_seperator,
            updated_time_seperator,
            // Ensure user fields are included
            emp_id: bundle.emp_id,
            eng_name: bundle.eng_name,
            kh_name: bundle.kh_name || "",
            job_title: bundle.job_title || "",
            dept_name: bundle.dept_name,
            sect_name: bundle.sect_name || "",
          });
          await newBundle.save();
          savedRecords.push(newBundle);
        }
        // const savedRecords = await QC2OrderData.insertMany(bundleData);
    
        res.status(201).json({
          message: "Bundle data saved successfully",
          data: savedRecords,
        });
      } catch (error) {
        console.error("Error saving bundle data:", error);
        res.status(500).json({
          message: "Failed to save bundle data",
          error: error.message,
        });
      }
};

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */
export const editBundleData = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await QC2OrderData.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedOrder) {
      return res.status(404).send({ message: 'Order not found' });
    }
    res.send(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
};

//For Data tab display records in a table
export const getUserBatchers = async (req, res) => {
    try {
        const { emp_id } = req.query;
        if (!emp_id) {
          return res.status(400).json({ message: "emp_id is required" });
        }
        const batches = await QC2OrderData.find({ emp_id });
        res.json(batches);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch user batches" });
      }
};

// Check if bundle_id already exists and get the largest number
export const checkBundleIdExists = async (req, res) => {
    try {
        const { date, lineNo, selectedMono, color, size } = req.body;
    
        // Find all bundle IDs matching the criteria
        const existingBundles = await QC2OrderData.find({
          bundle_id: {
            $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`,
          },
        });
    
        // Extract the largest number from the bundle IDs
        let largestNumber = 0;
        existingBundles.forEach((bundle) => {
          const parts = bundle.bundle_id.split(":");
          const number = parseInt(parts[parts.length - 1]);
          if (number > largestNumber) {
            largestNumber = number;
          }
        });
    
        res.status(200).json({ largestNumber });
      } catch (error) {
        console.error("Error checking bundle ID:", error);
        res.status(500).json({
          message: "Failed to check bundle ID",
          error: error.message,
        });
      }
};

/* ------------------------------
  PUT Endpoints - Update QC2 Order Data
------------------------------ */
export const updateQC2OrderData = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { inspectionType, process, data } = req.body;

    if (!["first", "defect"].includes(inspectionType)) {
      return res.status(400).json({ error: "Invalid inspection type" });
    }

    const updateField =
      inspectionType === "first" ? "inspectionFirst" : "inspectionDefect";
    const updateOperation = {
      $push: {
        [updateField]: {
          process,
          ...data
        }
      }
    };

    // For defect scans, ensure defect_print_id is provided
    if (inspectionType === "defect" && !data.defect_print_id) {
      return res
        .status(400)
        .json({ error: "defect_print_id is required for defect scans" });
    }

    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      updateOperation,
      { new: true, upsert: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    console.error("Error updating qc2_orderdata:", error);
    res
      .status(500)
      .json({ error: "Failed to update record", details: error.message });
  }
};

/* ------------------------------
   End Points - Reprint - qc2_orderdata
------------------------------ */

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

// NEW ENDPOINT: Get distinct values for filters
export const getDistinctFilters = async (req, res) => {
  try {
    const distinctMonos = await QC2OrderData.distinct("selectedMono");
    const distinctBuyers = await QC2OrderData.distinct("buyer");
    const distinctQcIds = await QC2OrderData.distinct("emp_id"); // Assuming emp_id is QC ID
    const distinctLineNos = await QC2OrderData.distinct("lineNo");

    res.json({
      monos: distinctMonos.sort(),
      buyers: distinctBuyers.sort(),
      qcIds: distinctQcIds.sort(),
      lineNos: distinctLineNos.sort((a, b) => {
        // Custom sort for alphanumeric line numbers
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1; // Numbers first
        if (!isNaN(numB)) return 1;
        return a.localeCompare(b); // Then string compare
      })
    });
  } catch (error) {
    console.error("Error fetching distinct filter values:", error);
    res.status(500).json({ message: "Failed to fetch distinct filter values" });
  }
};

// MODIFIED ENDPOINT: Fetch filtered bundle data with pagination and aggregated stats
export const fetchFilteredBundleData = async (req, res) => {
   try {
    const {
      date,
      lineNo,
      selectedMono,
      packageNo,
      buyer,
      emp_id,
      page = 1,
      limit = 15, // Pagination params, default to page 1, 10 items per page
      sortBy = "updated_date_seperator", // Default sort field
      sortOrder = "desc" // Default sort order (descending for latest first)
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
    if (emp_id) matchQuery.emp_id = emp_id;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    let sortOptions = {};
    if (sortBy === "updated_date_seperator") {
      // For date and time, sort by date then time if dates are equal
      sortOptions = {
        updated_date_seperator: sortDirection,
        updated_time_seperator: sortDirection
      };
    } else {
      sortOptions[sortBy] = sortDirection;
    }

    // Fetch total count of matching documents for pagination
    const totalRecords = await QC2OrderData.countDocuments(matchQuery);

    // Fetch paginated and sorted records
    const records = await QC2OrderData.find(matchQuery)
      .sort(sortOptions) // Apply sorting
      .skip(skip) // Apply skip for pagination
      .limit(limitNum); // Apply limit for pagination

    // Calculate aggregated stats based on ALL filtered records (not just the current page)
    // This might be resource-intensive if the filtered set is very large.
    // Consider if stats should also be paginated or if an approximation is okay for large sets.
    // For now, calculating on the full filtered set.
    const allFilteredRecordsForStats = await QC2OrderData.find(matchQuery); // Re-query without pagination for stats

    let totalGarmentQty = 0;
    let uniqueStyles = new Set();

    allFilteredRecordsForStats.forEach((record) => {
      totalGarmentQty += record.count || 0;
      if (record.selectedMono) {
        uniqueStyles.add(record.selectedMono);
      }
    });

    const totalBundlesFromStats = allFilteredRecordsForStats.length; // This is the true total bundles for the filter
    const totalStyles = uniqueStyles.size;

    res.json({
      records,
      stats: {
        totalGarmentQty,
        totalBundles: totalBundlesFromStats, // Use count from all filtered records for stats
        totalStyles
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords: totalRecords, // Total records matching the filter
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("Error fetching filtered bundle data:", error);
    res.status(500).json({ message: "Failed to fetch filtered bundle data" });
  }
};


 const formatDateToMMDDYYYY = (dateInput) => {
   if (!dateInput) return null;
  const d = new Date(dateInput);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};
// Endpoint to get hourly summary for qc2_orderdata
export const getHourlySummary = async (req, res) => {
  try {
    const { date: queryDate } = req.query;

    if (!queryDate) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const formattedDate = formatDateToMMDDYYYY(queryDate);
    if (!formattedDate) {
      return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
    }

    const results = await QC2OrderData.aggregate([
      {
        $match: {
          updated_date_seperator: formattedDate,
        },
      },
      {
        $addFields: {
          hour: { $toInt: { $substrCP: ["$updated_time_seperator", 0, 2] } },
        },
      },
      {
        $match: {
          hour: { $gte: 6, $lte: 17 }, // Hours from 6 AM to 5 PM (up to 17:59:59)
        },
      },
      {
        $group: {
          _id: "$hour",
          totalBundles: { $sum: "$totalBundleQty" },
          totalGarments: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } }, // Sort by hour
    ]);

    const hourlySummary = {};
    for (let i = 6; i <= 17; i++) {
      const hourKey = String(i).padStart(2, '0');
      const found = results.find(r => r._id === i);
      hourlySummary[hourKey] = found ? { totalBundles: found.totalBundles, totalGarments: found.totalGarments } : { totalBundles: 0, totalGarments: 0 };
    }

    res.json(hourlySummary);
  } catch (error) {
    console.error("Error fetching hourly summary:", error);
    res.status(500).json({ error: "Failed to fetch hourly summary", details: error.message });
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