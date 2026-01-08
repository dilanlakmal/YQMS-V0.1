import {
 QC2OrderData,
} from "../../MongoDB/dbConnectionController.js";

import { normalizeDateString} from "../../../helpers/helperFunctions.js";

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */
export const editBundleData = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await QC2OrderData.findByIdAndUpdate(id, updateData, {
      new: true
    });
    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.send(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//For Data tab display records in a table
export const getUserBatchers = async (req, res) => {
    try {
    const { emp_id } = req.query;
    if (!emp_id) {
      return res.status(400).json({ message: "emp_id is required" });
    }

    const batches = await QC2OrderData.find({ emp_id }).sort({
      updated_date_seperator: -1,
      updated_time_seperator: -1
    });
    res.json(batches);
  } catch (error) {
    console.error("Error fetching user batches:", error);
    res.status(500).json({ message: "Failed to fetch user batches" });
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
         task_no,
         page = 1,
         limit = 15,
         sortBy = "updated_date_seperator",
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
       if (emp_id) matchQuery.emp_id = emp_id;
       if (task_no) matchQuery.task_no = parseInt(task_no, 10); // Add task_no to query

       const pageNum = parseInt(page, 10);
       const limitNum = parseInt(limit, 10);
       const skip = (pageNum - 1) * limitNum;

       // Determine sort direction
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

       // Fetch total count of matching documents for pagination
       const totalRecords = await QC2OrderData.countDocuments(matchQuery);

       // Fetch paginated and sorted records
       const records = await QC2OrderData.find(matchQuery)
         .sort(sortOptions)
         .skip(skip)
         .limit(limitNum);

       const statsPipeline = [
         { $match: matchQuery },
         {
           $group: {
             _id: { task_no: "$task_no", mono: "$selectedMono" },
             garmentQty: { $sum: "$count" },
             bundleCount: { $sum: 1 } // Use 1 to count documents, not bundleQty
           }
         },
         {
           $group: {
             _id: "$_id.task_no",
             totalGarmentQty: { $sum: "$garmentQty" },
             totalBundles: { $sum: "$bundleCount" },
             uniqueStyles: { $addToSet: "$_id.mono" }
           }
         }
       ];

       const statsResults = await QC2OrderData.aggregate(statsPipeline);


       let totalGarmentQty = 0;
       let totalBundles = 0;
       let totalStylesSet = new Set();
       let garmentQtyByTask = {};
       let bundleCountByTask = {};

       statsResults.forEach((result) => {
         const task = result._id || "unknown"; // Handle null task_no if any
         totalGarmentQty += result.totalGarmentQty;
         totalBundles += result.totalBundles;
         result.uniqueStyles.forEach((style) => totalStylesSet.add(style));
         garmentQtyByTask[task] = result.totalGarmentQty;
         bundleCountByTask[task] = result.totalBundles;
       });

       const stats = {
         totalGarmentQty,
         totalBundles,
         totalStyles: totalStylesSet.size,
         garmentQtyByTask, // e.g., { '51': 500, '52': 734 }
         bundleCountByTask
       };

       res.json({
         records,
         stats,
         pagination: {
           currentPage: pageNum,
           totalPages: Math.ceil(totalRecords / limitNum),
           totalRecords: totalRecords,
           limit: limitNum
         }
       });
     } catch (error) {
       console.error("Error fetching filtered bundle data:", error);
       res.status(500).json({ message: "Failed to fetch filtered bundle data" });
     }
};



  // NEW ENDPOINT: Get distinct values for filters
  export const getDistinctFilters = async (req, res) => {
    try {
        const [
          distinctMonos,
          distinctBuyers,
          distinctQcIds,
          distinctLineNos,
          distinctTaskNos
        ] = await Promise.all([
          QC2OrderData.distinct("selectedMono"),
          QC2OrderData.distinct("buyer"),
          QC2OrderData.distinct("emp_id"),
          QC2OrderData.distinct("lineNo"),
          QC2OrderData.distinct("task_no")
        ]);

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
          }),
          taskNos: distinctTaskNos.sort((a, b) => a - b) // Add task numbers
        });
      } catch (error) {
        console.error("Error fetching distinct filter values:", error);
        res.status(500).json({ message: "Failed to fetch distinct filter values" });
      }
  };