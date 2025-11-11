import {
  CuttingInspection,                
} from "../../MongoDB/dbConnectionController.js"; 
import mongoose from "mongoose";


/* ------------------------------
   Cutting Report ENDPOINTS
------------------------------ */

// Endpoint to fetch distinct filter options based on MO No
export const getCuttingInspectFilterOptions = async (req, res) => {
    try {
      const { moNo } = req.query;
      let match = {};
      if (moNo) match.moNo = new RegExp(moNo, "i");
  
      const lotNos = await CuttingInspection.distinct("lotNo", match);
      const buyers = await CuttingInspection.distinct("buyer", match); // Add buyer filter options
      const colors = await CuttingInspection.distinct("color", match);
      const tableNos = await CuttingInspection.distinct("tableNo", match);
  
      res.json({
        lotNos: lotNos.filter((lot) => lot),
        buyers: buyers.filter((buyer) => buyer), // Return distinct buyers
        colors: colors.filter((color) => color),
        tableNos: tableNos.filter((table) => table)
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
};

// GET Full Cutting Inspection Document for Management/Modification
export const getCuttingInspectDetail = async (req, res) => {
  try {
      const { moNo, tableNo, color } = req.query; // Color might be needed if moNo+tableNo isn't unique
      if (!moNo || !tableNo) {
        return res
          .status(400)
          .json({ message: "MO Number and Table Number are required" });
      }
  
      let query = { moNo, tableNo };
      // If your records are uniquely identified by moNo, tableNo, AND color, add color to the query:
      // if (color) query.color = color;
      // For now, assuming moNo + tableNo is sufficient to find a unique parent record.
  
      const inspectionDoc = await CuttingInspection.findOne(query).lean();
  
      if (!inspectionDoc) {
        return res.status(404).json({ message: "Inspection document not found" });
      }
      res.json(inspectionDoc);
    } catch (error) {
      console.error("Error fetching full inspection details:", error);
      res.status(500).json({
        message: "Failed to fetch full inspection details",
        error: error.message
      });
    }
};

// GET Full Cutting Inspection Document for Management (similar to modify, but might be simpler)
export const getCuttingInspectDetailForManagee = async (req, res) => {
  try {
    const { moNo, tableNo } = req.query;
    if (!moNo || !tableNo) {
      return res
        .status(400)
        .json({ message: "MO Number and Table Number are required" });
    }
    // You might want to add color if moNo + tableNo is not unique enough
    const inspectionDoc = await CuttingInspection.findOne({
      moNo,
      tableNo
    }).lean(); // Use lean for read-only

    if (!inspectionDoc) {
      return res.status(404).json({ message: "Inspection document not found" });
    }
    res.json(inspectionDoc);
  } catch (error) {
    console.error("Error fetching inspection details for management:", error);
    res.status(500).json({
      message: "Failed to fetch inspection details for management",
      error: error.message
    });
  }
};

// DELETE Entire Cutting Inspection Record by document _id
export const deleteCuttingInspection = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Record ID format." });
      }
  
      const deletedRecord = await CuttingInspection.findByIdAndDelete(id);
  
      if (!deletedRecord) {
        return res
          .status(404)
          .json({ message: "Cutting inspection record not found." });
      }
      res
        .status(200)
        .json({ message: "Cutting inspection record deleted successfully." });
    } catch (error) {
      console.error("Error deleting cutting inspection record:", error);
      res.status(500).json({
        message: "Failed to delete cutting inspection record.",
        error: error.message
      });
    }
};

// DELETE Specific Inspected Size from a Cutting Inspection Record
export const deleteCuttingInspectionSize = async (req, res) => {
  try {
        const { id, inspectedSize } = req.params;
  
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid Record ID format." });
        }
        if (!inspectedSize) {
          return res
            .status(400)
            .json({ message: "Inspected size to delete is required." });
        }
  
        const record = await CuttingInspection.findById(id);
        if (!record) {
          return res
            .status(404)
            .json({ message: "Cutting inspection record not found." });
        }
  
        const initialLength = record.inspectionData.length;
        record.inspectionData = record.inspectionData.filter(
          (dataItem) => dataItem.inspectedSize !== inspectedSize
        );
  
        if (record.inspectionData.length === initialLength) {
          return res.status(404).json({
            message: `Inspected size '${inspectedSize}' not found in this record.`
          });
        }
  
        // If all sizes are deleted, consider if the parent document should also be deleted or kept empty.
        // For now, we'll just remove the size. If inspectionData becomes empty, the parent still exists.
        // You might want to add logic here: if (record.inspectionData.length === 0) { await CuttingInspection.findByIdAndDelete(id); ... }
  
        record.updated_at = new Date();
        record.markModified("inspectionData"); // Important for Mongoose to detect array changes
        await record.save();
  
        res.status(200).json({
          message: `Inspection data for size '${inspectedSize}' deleted successfully.`,
          data: record
        });
      } catch (error) {
        console.error(`Error deleting inspected size '${inspectedSize}':`, error);
        res.status(500).json({
          message: `Failed to delete inspection data for size '${inspectedSize}'.`,
          error: error.message
        });
      }
};

// PUT to update general information of a CuttingInspection document
export const updateCuttingInspectionGeneral = async (req, res) => {
  try {
      const { id } = req.params;
      const {
        inspectionDate, // Expecting 'M/D/YYYY' or 'MM/DD/YYYY' string from client
        orderQty,
        totalBundleQty,
        bundleQtyCheck, // These are calculated on client, but we save them
        totalInspectionQty // These are calculated on client, but we save them
        // Add other general fields here if they become editable later
      } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Record ID format." });
      }
  
      const recordToUpdate = await CuttingInspection.findById(id);
      if (!recordToUpdate) {
        return res.status(404).json({ message: "Inspection record not found." });
      }
  
      // Update fields
      if (inspectionDate !== undefined)
        recordToUpdate.inspectionDate = inspectionDate; // Store as string 'M/D/YYYY'
      if (orderQty !== undefined) recordToUpdate.orderQty = Number(orderQty);
      if (totalBundleQty !== undefined)
        recordToUpdate.totalBundleQty = Number(totalBundleQty);
      if (bundleQtyCheck !== undefined)
        recordToUpdate.bundleQtyCheck = Number(bundleQtyCheck);
      if (totalInspectionQty !== undefined)
        recordToUpdate.totalInspectionQty = Number(totalInspectionQty);
  
      recordToUpdate.updated_at = new Date();
  
      const updatedRecord = await recordToUpdate.save();
  
      res.status(200).json({
        message: "General inspection information updated successfully.",
        data: updatedRecord
      });
    } catch (error) {
      console.error("Error updating general inspection information:", error);
      res.status(500).json({
        message: "Failed to update general inspection information.",
        error: error.message
      });
    }
};

// ** NEW: PUT Endpoint to update the full/multiple sections of a CuttingInspection document **
export const updateCuttingInspectionFull = async (req, res) => {
  try {
      const { id } = req.params;
      const updates = req.body; // Contains all fields from frontend: general, fabric, cuttingTable, mackerRatio
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Record ID format." });
      }
  
      const recordToUpdate = await CuttingInspection.findById(id);
      if (!recordToUpdate) {
        return res.status(404).json({ message: "Inspection record not found." });
      }
  
      // Update General Info
      if (updates.inspectionDate !== undefined)
        recordToUpdate.inspectionDate = updates.inspectionDate;
      if (updates.orderQty !== undefined)
        recordToUpdate.orderQty = Number(updates.orderQty);
      if (updates.totalBundleQty !== undefined)
        recordToUpdate.totalBundleQty = Number(updates.totalBundleQty);
      if (updates.bundleQtyCheck !== undefined)
        recordToUpdate.bundleQtyCheck = Number(updates.bundleQtyCheck); // This is auto-calculated on frontend, but save it
      if (updates.totalInspectionQty !== undefined)
        recordToUpdate.totalInspectionQty = Number(updates.totalInspectionQty); // Also auto-calculated
  
      // Update Fabric Details
      if (updates.fabricDetails) {
        recordToUpdate.fabricDetails = {
          fabricType:
            updates.fabricDetails.fabricType ||
            recordToUpdate.fabricDetails.fabricType,
          material:
            updates.fabricDetails.material ||
            recordToUpdate.fabricDetails.material,
          rollQty:
            updates.fabricDetails.rollQty !== undefined
              ? Number(updates.fabricDetails.rollQty)
              : recordToUpdate.fabricDetails.rollQty,
          spreadYds:
            updates.fabricDetails.spreadYds !== undefined
              ? Number(updates.fabricDetails.spreadYds)
              : recordToUpdate.fabricDetails.spreadYds,
          unit: updates.fabricDetails.unit || recordToUpdate.fabricDetails.unit,
          grossKgs:
            updates.fabricDetails.grossKgs !== undefined
              ? Number(updates.fabricDetails.grossKgs)
              : recordToUpdate.fabricDetails.grossKgs,
          netKgs:
            updates.fabricDetails.netKgs !== undefined
              ? Number(updates.fabricDetails.netKgs)
              : recordToUpdate.fabricDetails.netKgs,
          totalTTLRoll:
            updates.fabricDetails.totalTTLRoll !== undefined
              ? Number(updates.fabricDetails.totalTTLRoll)
              : recordToUpdate.fabricDetails.totalTTLRoll
        };
      }
  
      // Update Cutting Table Details (PlanLayers and ActualLayers are display-only on frontend, so we don't update them here from payload)
      // Only update editable fields if provided
      if (updates.cuttingTableDetails) {
        if (updates.cuttingTableDetails.spreadTable !== undefined)
          recordToUpdate.cuttingTableDetails.spreadTable =
            updates.cuttingTableDetails.spreadTable;
        if (updates.cuttingTableDetails.spreadTableNo !== undefined)
          recordToUpdate.cuttingTableDetails.spreadTableNo =
            updates.cuttingTableDetails.spreadTableNo;
        // recordToUpdate.cuttingTableDetails.planLayers remains from DB
        // recordToUpdate.cuttingTableDetails.actualLayers remains from DB
        // recordToUpdate.cuttingTableDetails.totalPcs might need recalculation based on new ratios / layers on server-side if desired for integrity
        if (updates.cuttingTableDetails.mackerNo !== undefined)
          recordToUpdate.cuttingTableDetails.mackerNo =
            updates.cuttingTableDetails.mackerNo;
        if (updates.cuttingTableDetails.mackerLength !== undefined)
          recordToUpdate.cuttingTableDetails.mackerLength = Number(
            updates.cuttingTableDetails.mackerLength
          );
      }
  
      // Update Macker Ratio - Replace the whole array with the new one
      if (Array.isArray(updates.mackerRatio)) {
        recordToUpdate.mackerRatio = updates.mackerRatio.map((ratio) => ({
          index: Number(ratio.index),
          markerSize: ratio.markerSize,
          ratio: Number(ratio.ratio)
        }));
        recordToUpdate.markModified("mackerRatio");
      }
  
      recordToUpdate.updated_at = new Date();
  
      const updatedRecord = await recordToUpdate.save();
  
      res.status(200).json({
        message: "Cutting inspection record updated successfully.",
        data: updatedRecord
      });
    } catch (error) {
      console.error("Error updating full cutting inspection record:", error);
      res.status(500).json({
        message: "Failed to update cutting inspection record.",
        error: error.message
      });
    }
};