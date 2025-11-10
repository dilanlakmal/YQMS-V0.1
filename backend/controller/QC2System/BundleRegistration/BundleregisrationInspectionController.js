import {
 QC2OrderData,                
} from "../../MongoDB/dbConnectionController.js";

import { generateRandomId } from "../../../helpers/helperFunctions.js";
// Bundle Qty Endpoint
export const getBundleQty = async (req, res) => {
    try {
    const mono = req.params.mono;
    const total = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } }, // Match documents with the given MONo
      {
        $group: {
          _id: null, // Group all matched documents
          total: { $sum: "$totalBundleQty" } // Correct sum using field reference with $
        }
      }
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
    const { type } = req.query; // Get type from query string, e.g., ?type=end

    // Validate type parameter
    if (!type || !["end", "repack"].includes(type)) {
      return res
        .status(400)
        .json({ message: "A valid type ('end' or 'repack') is required." });
    }

    const totalCount = await QC2OrderData.aggregate([
      // Add the new 'type' field to the match criteria
      { $match: { selectedMono: mono, color: color, size: size, type: type } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" }
        }
      }
    ]);

    res.json({ totalCount: totalCount[0]?.totalCount || 0 });
  } catch (error) {
    console.error("Error fetching total garments count:", error);
    res.status(500).json({ error: "Failed to fetch total garments count" });
  }
};

// Save bundle data to MongoDB
export const saveBundleData = async (req, res) => {
    try {
        const { bundleData } = req.body;
        if (!bundleData || !Array.isArray(bundleData)) {
          return res.status(400).json({ message: "Invalid bundle data format." });
        }
        const savedRecords = [];
    
        // Since all bundles in a single generation request are the same, we only need to calculate the starting package_no once.
        const firstBundle = bundleData[0];
        if (!firstBundle.task_no || !firstBundle.type) {
          return res
            .status(400)
            .json({ message: "Task No and Type are required fields." });
        }
    
        let package_no_counter = 1;
    
        if (firstBundle.type === "end") {
          const lastEndBundle = await QC2OrderData.findOne({
            selectedMono: firstBundle.selectedMono,
            color: firstBundle.color,
            size: firstBundle.size,
            type: "end"
          }).sort({ package_no: -1 });
    
          if (lastEndBundle) {
            package_no_counter = lastEndBundle.package_no + 1;
          }
        }
    
        for (const bundle of bundleData) {
          const randomId = await generateRandomId();
          const now = new Date();
          const updated_date_seperator = now.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
          });
          const updated_time_seperator = now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
    
          const newBundle = new QC2OrderData({
            ...bundle,
            package_no: package_no_counter, // Use the calculated package number
            bundle_random_id: randomId,
            bundle_id: `${bundle.date}:${bundle.lineNo}:${bundle.selectedMono}:${bundle.color}:${bundle.size}:${package_no_counter}`,
            updated_date_seperator,
            updated_time_seperator
          });
    
          await newBundle.save();
          savedRecords.push(newBundle);
    
          // If type is 'end', increment package_no for the next bundle in the same batch. For 'repack', it stays 1.
          if (bundle.type === "end") {
            package_no_counter++;
          }
        }
    
        res.status(201).json({
          message: "Bundle data saved successfully",
          data: savedRecords
        });
      } catch (error) {
        console.error("Error saving bundle data:", error);
        res
          .status(500)
          .json({ message: "Failed to save bundle data", error: error.message });
      }
};

// New Endpoint to Get Bundle by Random ID
export const getBundleByRandomId = async (req, res) => {
  try {
      const bundle = await QC2OrderData.findOne({
        bundle_random_id: req.params.randomId
      });
  
      if (!bundle) {
        return res.status(404).json({ error: "Bundle not found" });
      }
  
      res.json(bundle);
    } catch (error) {
      console.error("Error fetching bundle:", error);
      res.status(500).json({ error: "Failed to fetch bundle" });
    }
}


// Check if bundle_id already exists and get the largest number
export const checkBundleIdExists = async (req, res) => {
  try {
      const { date, lineNo, selectedMono, color, size } = req.body;
  
      // Find all bundle IDs matching the criteria
      const existingBundles = await QC2OrderData.find({
        bundle_id: {
          $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`
        }
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
        error: error.message
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
