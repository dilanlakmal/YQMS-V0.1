import mongoose from "mongoose";

export default function setupBundleRoutes(app, { QC2OrderData, UserMain }) {

  // Generate a random ID for the bundle
  const generateRandomId = async () => {
    let randomId;
    let isUnique = false;

    while (!isUnique) {
      randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
      if (!existing) isUnique = true;
    }

    return randomId;
  };

  // POST /api/save-bundle-data
  app.post("/api/save-bundle-data", async (req, res) => {
    try {
      const { bundleData } = req.body;
      const savedRecords = [];

      // Save each bundle record
      for (const bundle of bundleData) {

        const packageCount = await QC2OrderData.countDocuments({
          selectedMono: bundle.selectedMono,
          //color: bundle.color, // Consider if package_no should be unique per MO+Color or just per MO
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
  });

  // PUT /api/update-bundle-data/:id
  app.put('/api/update-bundle-data/:id', async (req, res) => {
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
  });

  // GET /api/user-batches
  app.get("/api/user-batches", async (req, res) => {
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
  });

  // GET /api/reprint-search
  app.get("/api/reprint-search", async (req, res) => {
    try {
      const { mono, packageNo, empId } = req.query;

      // Build the query dynamically based on provided parameters
      const query = {};
      if (mono) {
        query.selectedMono = { $regex: mono, $options: "i" }; // Case-insensitive partial match
      }
      if (packageNo) {
        const packageNoInt = parseInt(packageNo);
        if (!isNaN(packageNoInt)) {
          query.package_no = packageNoInt; // Exact match for integer
        }
      }
      if (empId) {
        query.emp_id = { $regex: empId, $options: "i" }; // Case-insensitive partial match
      }

      // Fetch matching records from qc2_orderdata
      const records = await QC2OrderData.find(query)
        .sort({ package_no: 1 }) // Sort by package_no ascending
        .limit(100); // Limit to prevent overload

      res.json(records);
    } catch (error) {
      console.error("Error searching qc2_orderdata:", error);
      res.status(500).json({ error: "Failed to search records" });
    }
  });

  // GET /api/reprint-colors-sizes/:mono
  app.get("/api/reprint-colors-sizes/:mono", async (req, res) => {
    try {
      const mono = req.params.mono;
      const result = await QC2OrderData.aggregate([
        { $match: { selectedMono: mono } },
        {
          $group: {
            _id: {
              color: "$color",
              size: "$size",
            },
            colorCode: { $first: "$colorCode" },
            chnColor: { $first: "$chnColor" },
            package_no: { $first: "$package_no" },
          },
        },
        {
          $group: {
            _id: "$_id.color",
            sizes: { $push: "$_id.size" },
            colorCode: { $first: "$colorCode" },
            chnColor: { $first: "$chnColor" },
          },
        },
      ]);

      const colors = result.map((c) => ({
        color: c._id,
        sizes: c.sizes,
        colorCode: c.colorCode,
        chnColor: c.chnColor,
      }));

      res.json(colors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch colors/sizes" });
    }
  });

  // GET /api/bundle-by-random-id/:randomId (used by Ironing, Washing, OPA)
  app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
    try {
      const bundle = await QC2OrderData.findOne({
        bundle_random_id: req.params.randomId,
      });

      if (!bundle) {
        return res.status(404).json({ error: "Bundle not found" });
      }

      res.json(bundle);
    } catch (error) {
      console.error("Error fetching bundle:", error);
      res.status(500).json({ error: "Failed to fetch bundle" });
    }
  });

  // POST /api/check-bundle-id
  app.post("/api/check-bundle-id", async (req, res) => {
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
  });

  // GET /api/total-bundle-qty/:mono
  app.get("/api/total-bundle-qty/:mono", async (req, res) => {
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
  });

  // GET /api/total-garments-count/:mono/:color/:size
  app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
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
  });

  // GET /api/qc2-orderdata/filter-options (used by LiveDashboard)
  app.get("/api/qc2-orderdata/filter-options", async (req, res) => {
    try {
      const filterOptions = await QC2OrderData.aggregate([
        {
          $group: {
            _id: null,
            moNo: { $addToSet: "$selectedMono" },
            color: { $addToSet: "$color" },
            size: { $addToSet: "$size" },
            department: { $addToSet: "$department" },
            empId: { $addToSet: "$emp_id" },
            buyer: { $addToSet: "$buyer" },
            lineNo: { $addToSet: "$lineNo" }
          }
        },
        {
          $project: {
            _id: 0,
            moNo: 1,
            color: 1,
            size: 1,
            department: 1,
            empId: 1,
            buyer: 1,
            lineNo: 1
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
              empId: [],
              buyer: [],
              lineNo: []
            };

      Object.keys(result).forEach((key) => {
        result[key] = result[key]
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  });

  // GET /api/qc2-orderdata-summary (used by LiveDashboard)
  app.get("/api/qc2-orderdata-summary", async (req, res) => {
    try {
      const {
        moNo,
        startDate,
        endDate,
        color,
        size,
        department,
        empId,
        buyer,
        lineNo,
        page = 1,
        limit = 50
      } = req.query;

      let match = {};
      if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
      if (color) match.color = color;
      if (size) match.size = size;
      if (department) match.department = department;
      if (empId) match.emp_id = { $regex: new RegExp(empId.trim(), "i") };
      if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };
      if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };
      if (startDate || endDate) {
        match.updated_date_seperator = {};
        if (startDate) match.updated_date_seperator.$gte = startDate;
        if (endDate) match.updated_date_seperator.$lte = endDate;
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const pipeline = [
        { $match: match },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                  totalGarmentsQty: { $sum: "$count" },
                  uniqueMONos: { $addToSet: "$selectedMono" },
                  uniqueColors: { $addToSet: "$color" }, // Add unique colors
                  uniqueSizes: { $addToSet: "$size" }, // Add unique sizes
                  uniqueOrderQty: {
                    $addToSet: { moNo: "$selectedMono", orderQty: "$orderQty" }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  totalRegisteredBundleQty: 1,
                  totalGarmentsQty: 1,
                  totalMO: { $size: "$uniqueMONos" },
                  totalColors: { $size: "$uniqueColors" }, // Count unique colors
                  totalSizes: { $size: "$uniqueSizes" }, // Count unique sizes
                  totalOrderQty: {
                    $sum: {
                      $map: {
                        input: "$uniqueOrderQty",
                        in: "$$this.orderQty"
                      }
                    }
                  }
                }
              }
            ]
          },
          tableData: [
            {
              $group: {
                _id: {
                  lineNo: "$lineNo",
                  moNo: "$selectedMono",
                  custStyle: "$custStyle",
                  country: "$country",
                  buyer: "$buyer",
                  color: "$color",
                  size: "$size",
                  empId: "$emp_id" // Add emp_id to group
                }
              },
              totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
              totalGarments: { $sum: "$count" },
              orderQty: { $first: "$orderQty" } // Use $first to get orderQty for each unique MO
            }
          ],
          total: [{ $count: "count" }]
        }
      }
      ];

      const result = await QC2OrderData.aggregate(pipeline);
      const summary = result[0].summary[0] || {
        totalRegisteredBundleQty: 0,
        totalGarmentsQty: 0,
        totalMO: 0,
        totalColors: 0, // Default for new fields
        totalSizes: 0,
        totalOrderQty: 0
      };
      const tableData = result[0].tableData || [];
      const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

      res.json({ summary, tableData, total });
    } catch (error) {
      console.error("Error fetching order data summary:", error);
      res.status(500).json({ error: "Failed to fetch order data summary" });
    }
  });

  // GET /api/unique-values (used by DownloadData)
  app.get("/api/unique-values", async (req, res) => {
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
  });

  // GET /api/download-data (used by DownloadData)
  app.get("/api/download-data", async (req, res) => {
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

      // Determine collection and date field based on type/taskNo
      const isIroning = type === "Ironing" || taskNo === "53";
      const collection = isIroning ? Ironing : QC2OrderData; // Assuming Ironing model is available
      const dateField = isIroning ? "ironing_updated_date" : "updated_date_seperator";

      // Build match query
      const matchQuery = {};

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

      // Get total count
      const total = await collection.countDocuments(matchQuery);

      // Get paginated data
      const data = await collection
        .find(matchQuery)
        .sort({ [dateField]: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

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
        bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id, // Adjust bundle_id field name based on collection
        factory: item.factory,
        count: item.count // Assuming count is present in both collections
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
  });

}