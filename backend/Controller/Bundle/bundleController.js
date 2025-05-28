import bcrypt from "bcrypt";
import {
 ymEcoConnection,
 QC2OrderData,                
} from "../../Config/mongodb.js";
import { generateRandomId } from "../../Helpers/heperFunction.js";

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
};

// Fetch colors and sizes for a specific MONo (unchanged)
export const fetchColorsAndSizes = async (req, res) => {
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
};