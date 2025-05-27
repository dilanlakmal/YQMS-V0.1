import bcrypt from "bcrypt";
import {
  Ironing , 
  QC2OrderData,              
} from "../../Config/mongodb.js";

import { formatDate } from "../../Helpers/heperFunction.js";

/* ------------------------------
   End Points - Download Data
------------------------------ */

// New endpoint to get unique values for filters
export const getUniqueValues = async (req, res) => {
  try {
      const uniqueValues = await QC2OrderData.aggregate([
        {
          $group: {
            _id: null,
            moNos: { $addToSet: "$selectedMono" },
            styleNos: { $addToSet: "$custStyle" },
            lineNos: { $addToSet: "$lineNo" },
            colors: { $addToSet: "$color" },
            sizes: { $addToSet: "$size" },
            buyers: { $addToSet: "$buyer" },
          },
        },
      ]);
  
      const result = uniqueValues[0] || {
        moNos: [],
        styleNos: [],
        lineNos: [],
        colors: [],
        sizes: [],
        buyers: [],
      };
  
      delete result._id;
      Object.keys(result).forEach((key) => {
        result[key] = result[key].filter(Boolean).sort();
      });
  
      res.json(result);
    } catch (error) {
      console.error("Error fetching unique values:", error);
      res.status(500).json({ error: "Failed to fetch unique values" });
    }
};

// Updated endpoint to get filtered data
export const getFilteredData = async (req, res) => {
    try {
      let {
        startDate,
        endDate,
        type,
        taskNo,
        moNo,
        styleNo,
        lineNo,
        color,
        size,
        buyer,
        page = 1,
        limit = 50,
      } = req.query;
  
      // Convert page and limit to numbers
      page = parseInt(page);
      limit = parseInt(limit);
      const skip = (page - 1) * limit;
  
      // Format dates to match the stored format (MM/DD/YYYY)
      if (startDate) {
        startDate = formatDate(new Date(startDate));
      }
      if (endDate) {
        endDate = formatDate(new Date(endDate));
      }
  
      // Build match query
      const matchQuery = {};
  
      // Determine collection and date field based on type/taskNo
      const isIroning = type === "Ironing" || taskNo === "53";
      const collection = isIroning ? Ironing : QC2OrderData;
      const dateField = isIroning ? "ironing_updated_date" : "updated_date_seperator";
  
      // Date range filter
      if (startDate || endDate) {
        matchQuery[dateField] = {};
        if (startDate) matchQuery[dateField].$gte = startDate;
        if (endDate) matchQuery[dateField].$lte = endDate;
      }
  
      // Add other filters if they exist
      if (moNo) matchQuery.selectedMono = moNo;
      if (styleNo) matchQuery.custStyle = styleNo;
      if (lineNo) matchQuery.lineNo = lineNo;
      if (color) matchQuery.color = color;
      if (size) matchQuery.size = size;
      if (buyer) matchQuery.buyer = buyer;
  
      // Add task number filter
      if (taskNo) {
        matchQuery.task_no = parseInt(taskNo);
      }
  
      // console.log("Match Query:", JSON.stringify(matchQuery, null, 2)); // For debugging
  
      // Get total count
      const total = await collection.countDocuments(matchQuery);
  
      // Get paginated data
      const data = await collection
        .find(matchQuery)
        .sort({ [dateField]: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
  
      // console.log("Found records:", data.length); // For debugging
  
      // Transform data for consistent response
      const transformedData = data.map((item) => ({
        date: item[dateField],
        type: isIroning ? "Ironing" : "QC2 Order Data",
        taskNo: isIroning ? "53" : "52",
        selectedMono: item.selectedMono,
        custStyle: item.custStyle,
        lineNo: item.lineNo,
        color: item.color,
        size: item.size,
        buyer: item.buyer,
        bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id,
        factory: item.factory,
        count: item.count
      }));
  
      res.json({
        data: transformedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching download data:", error);
      res.status(500).json({ error: "Failed to fetch download data" });
    }
};