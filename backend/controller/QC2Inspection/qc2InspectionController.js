import mongoose from "mongoose";
import path from "path";
import fs from 'fs';
import {
  QC2InspectionPassBundle,
  QC2DefectPrint,
  QC2Reworks,
  QC2OrderData, 
  QC2Defects,       
} from "../MongoDB/dbConnectionController.js";

import { io, __backendDir } from "../../Config/appConfig.js";

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */

// Endpoint to save inspection pass bundle data
export const saveQC2Data = async (req, res) => {
    try {
        const {
          package_no,
          moNo,
          custStyle,
          color,
          size,
          lineNo,
          department,
          buyer,
          factory,
          country,
          sub_con,
          sub_con_factory,
          checkedQty,
          totalPass,
          totalRejects,
          totalRepair,
          defectQty,
          defectArray,
          rejectGarments,
          inspection_time,
          inspection_date,
          emp_id_inspection,
          eng_name_inspection,
          kh_name_inspection,
          job_title_inspection,
          dept_name_inspection,
          sect_name_inspection,
          bundle_id,
          bundle_random_id,
          printArray
        } = req.body;
    
        const newRecord = new QC2InspectionPassBundle({
          package_no,
          //bundleNo,
          moNo,
          custStyle,
          color,
          size,
          lineNo,
          department,
          buyer: buyer || "N/A",
          factory: factory || "N/A",
          country: country || "N/A",
          sub_con: sub_con || "No",
          sub_con_factory: sub_con_factory || "N/A",
          checkedQty,
          totalPass,
          totalRejects,
          totalRepair: totalRepair || 0,
          defectQty,
          defectArray: defectArray || [],
          rejectGarments: rejectGarments || [],
          inspection_time,
          inspection_date,
          emp_id_inspection,
          eng_name_inspection,
          kh_name_inspection,
          job_title_inspection,
          dept_name_inspection,
          sect_name_inspection,
          bundle_id,
          bundle_random_id,
          printArray: printArray || []
        });
    
        await newRecord.save();
    
        // Emit event to all clients
        io.emit("qc2_data_updated");
    
        res.status(201).json({
          message: "Inspection pass bundle saved successfully",
          data: newRecord
        });
      } catch (error) {
        console.error("Error saving inspection pass bundle:", error);
        res.status(500).json({
          message: "Failed to save inspection pass bundle",
          error: error.message
        });
      }
};

//Update QC2 inspection records for each of reject garments - PUT endpoint to update inspection records
export const updateQC2InspectionData = async (req, res) => {
    try {
        const { bundle_random_id } = req.params;
        const { updateOperations, arrayFilters } = req.body || {};
  
        let updateData = req.body;
        if (updateOperations) {
          updateData = updateOperations;
        }
  
        const updateOperationsFinal = {};
        if (updateData.$set) {
          updateOperationsFinal.$set = updateData.$set;
        }
        if (updateData.$push) {
          updateOperationsFinal.$push = updateData.$push;
        }
        if (updateData.$inc) {
          updateOperationsFinal.$inc = updateData.$inc;
        }
        if (!updateData.$set && !updateData.$push && !updateData.$inc) {
          updateOperationsFinal.$set = updateData;
        }
  
        // Ensure totalRejectGarment_Var remains unchanged when updating printArray
        if (updateOperationsFinal.$set?.printArray) {
          updateOperationsFinal.$set.printArray =
            updateOperationsFinal.$set.printArray.map((printEntry) => ({
              ...printEntry,
              totalRejectGarment_Var:
                printEntry.totalRejectGarment_Var ||
                printEntry.totalRejectGarmentCount
            }));
        }
  
        const options = {
          new: true,
          runValidators: true
        };
        if (arrayFilters) {
          options.arrayFilters = arrayFilters;
        }
  
        const updatedRecord = await QC2InspectionPassBundle.findOneAndUpdate(
          { bundle_random_id },
          updateOperationsFinal,
          options
        );
  
        if (!updatedRecord) {
          return res.status(404).json({ error: "Record not found" });
        }
  
        // Update qc2_orderdata for qc2InspectionFirst and qc2InspectionDefect
        const qc2OrderDataRecord = await QC2OrderData.findOne({
          bundle_random_id
        });
  
        // Case 1: Initial inspection completed (inspection_time is set)
        if (
          updateOperationsFinal.$set &&
          updateOperationsFinal.$set.inspection_time
        ) {
          if (qc2OrderDataRecord) {
            // Check if an entry with the same inspection_time, emp_id, and bundle_random_id already exists
            const existingEntry = qc2OrderDataRecord.qc2InspectionFirst.find(
              (entry) =>
                entry.inspectionRecordId === updatedRecord._id.toString() ||
                (entry.updated_date === updatedRecord.inspection_date &&
                  entry.update_time === updatedRecord.inspection_time &&
                  entry.emp_id === updatedRecord.emp_id_inspection)
            );
  
            if (!existingEntry) {
              const inspectionFirstEntry = {
                process: "qc2",
                task_no: 100,
                checkedQty: updatedRecord.checkedQty,
                totalPass: updatedRecord.totalPass,
                totalRejects: updatedRecord.totalRejects,
                defectQty: updatedRecord.defectQty,
                defectArray: updatedRecord.defectArray,
                rejectGarments: updatedRecord.rejectGarments.map((rg) => ({
                  totalCount: rg.totalCount,
                  defects: rg.defects.map((d) => ({
                    name: d.name,
                    count: d.count,
                    repair: d.repair,
                    status: "Fail"
                  })),
                  garment_defect_id: rg.garment_defect_id,
                  rejectTime: rg.rejectTime
                })),
                updated_date: updatedRecord.inspection_date,
                update_time: updatedRecord.inspection_time,
                emp_id: updatedRecord.emp_id_inspection,
                eng_name: updatedRecord.eng_name_inspection,
                kh_name: updatedRecord.kh_name_inspection,
                job_title: updatedRecord.job_title_inspection,
                dept_name: updatedRecord.dept_name_inspection,
                sect_name: updatedRecord.sect_name_inspection,
                inspectionRecordId: updatedRecord._id.toString() // Add unique identifier
              };
              qc2OrderDataRecord.qc2InspectionFirst.push(inspectionFirstEntry);
              await qc2OrderDataRecord.save();
            } else {
              console.log(
                "Duplicate entry detected, skipping push to qc2InspectionFirst"
              );
            }
          }
        }
  
        // Case 2: Return inspection completed (repairGarmentsDefects is pushed)
        if (
          updateOperationsFinal.$push &&
          updateOperationsFinal.$push[
            "printArray.$[elem].repairGarmentsDefects"
          ] &&
          updateData.sessionData
        ) {
          const sessionData = updateData.sessionData;
          const {
            sessionTotalPass,
            sessionTotalRejects,
            sessionDefectsQty,
            sessionRejectedGarments,
            inspectionNo,
            defect_print_id
          } = sessionData;
  
          if (qc2OrderDataRecord) {
            const now = new Date();
            const inspectionDefectEntry = {
              process: "qc2",
              task_no: 101,
              defect_print_id,
              inspectionNo,
              checkedQty: sessionTotalPass + sessionTotalRejects,
              totalPass: sessionTotalPass,
              totalRejects: sessionTotalRejects,
              defectQty: sessionDefectsQty,
              // Omit defectArray
              rejectGarments: sessionRejectedGarments.map((rg) => ({
                totalCount: rg.totalDefectCount,
                defects: rg.repairDefectArray.map((d) => ({
                  name: d.name,
                  count: d.count,
                  repair:
                    allDefects.find((def) => def.english === d.name)?.repair ||
                    "Unknown",
                  status: "Fail"
                })),
                garment_defect_id: generateGarmentDefectId(),
                rejectTime: now.toLocaleTimeString("en-US", { hour12: false })
              })),
              updated_date: now.toLocaleDateString("en-US"),
              update_time: now.toLocaleTimeString("en-US", { hour12: false }),
              emp_id: updatedRecord.emp_id_inspection,
              eng_name: updatedRecord.eng_name_inspection,
              kh_name: updatedRecord.kh_name_inspection,
              job_title: updatedRecord.job_title_inspection,
              dept_name: updatedRecord.dept_name_inspection,
              sect_name: updatedRecord.sect_name_inspection
            };
            qc2OrderDataRecord.qc2InspectionDefect.push(inspectionDefectEntry);
            await qc2OrderDataRecord.save();
          }
        }
  
        io.emit("qc2_data_updated");
        res.json({
          message: "Inspection pass bundle updated successfully",
          data: updatedRecord
        });
      } catch (error) {
        console.error("Error updating inspection pass bundle:", error);
        res.status(500).json({
          message: "Failed to update inspection pass bundle",
          error: error.message
        });
      }
};

/* ------------------------------
   QC2 - Reworks
------------------------------ */

// Endpoint to save reworks (reject garment) data
export const saveQC2ReworksData = async (req, res) => {
     try {
        const {
          package_no,
          //bundleNo,
          moNo,
          custStyle,
          color,
          size,
          lineNo,
          department,
          reworkGarments,
          emp_id_inspection,
          eng_name_inspection,
          kh_name_inspection,
          job_title_inspection,
          dept_name_inspection,
          sect_name_inspection,
          bundle_id,
          bundle_random_id
        } = req.body;
    
        const newRecord = new QC2Reworks({
          package_no,
          //bundleNo,
          moNo,
          custStyle,
          color,
          size,
          lineNo,
          department,
          reworkGarments,
          emp_id_inspection,
          eng_name_inspection,
          kh_name_inspection,
          job_title_inspection,
          dept_name_inspection,
          sect_name_inspection,
          bundle_id,
          bundle_random_id
        });
        await newRecord.save();
        res.status(201).json({
          message: "Reworks data saved successfully",
          data: newRecord
        });
      } catch (error) {
        console.error("Error saving reworks data:", error);
        res.status(500).json({
          message: "Failed to save reworks data",
          error: error.message
        });
      }
};


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

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */

// Edit the Inspection Data
// export const editInspectionData = async (req, res) => {
//   const { id } = req.params;
//     const updateData = req.body;
  
//     try {
//       // console.log(`Received request to update record with ID: ${id}`);
//       // console.log(`Update Data: ${JSON.stringify(updateData)}`);
//       const updatedRecord = await QC2InspectionPassBundle.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true }
//       );
//       if (!updatedRecord) {
//         // console.log(`Record with ID: ${id} not found`);
//         return res.status(404).send({ message: "Record not found" });
//       }
//       // console.log(`Record with ID: ${id} updated successfully`);
//       res.send(updatedRecord);
//     } catch (error) {
//       console.error("Error updating record:", error);
//       res.status(500).send({ message: "Internal Server Error" });
//     }
// };


/* ------------------------------
   End Points - QC2 Defects
------------------------------ */

// GET - Fetch all QC2 defects
export const getAllQC2Defects = async (req, res) => {
    try {
      const defects = await QC2Defects.find({}).sort({ code: 1 }).lean();
      res.json(defects);
    } catch (error) {
      console.error("Error fetching QC2 defects:", error);
      res.status(500).json({ message: "Server error fetching defects" });
    }
};

// POST - Add a new QC2 defect
export const addQC2Defect = async (req, res) => {
    try {
      const { code, defectLetter, english, khmer } = req.body;
      if (code === undefined || !defectLetter || !english || !khmer) {
        return res.status(400).json({
          message: "Code, Defect Letter, English & Khmer names are required."
        });
      }
      const existingByCode = await QC2Defects.findOne({ code });
      if (existingByCode) {
        return res
          .status(409)
          .json({ message: `Defect code '${code}' already exists.` });
      }
      const newDefect = new QC2Defects(req.body);
      await newDefect.save();
      res
        .status(201)
        .json({ message: "QC2 defect added successfully", defect: newDefect });
    } catch (error) {
      console.error("Error adding QC2 defect:", error);
      if (error.code === 11000)
        return res
          .status(409)
          .json({ message: "Duplicate entry. Defect code or name might exist." });
      res
        .status(500)
        .json({ message: "Failed to add QC2 defect", error: error.message });
    }
};

// PUT - Update an existing QC2 defect by ID
export const updateQC2Defect = async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }
      const updatedDefect = await QC2Defects.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
      if (!updatedDefect) {
        return res.status(404).json({ message: "QC2 Defect not found." });
      }
      res.status(200).json({
        message: "QC2 defect updated successfully",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error updating QC2 defect:", error);
      if (error.code === 11000)
        return res
          .status(409)
          .json({ message: "Update failed due to duplicate code or name." });
      res
        .status(500)
        .json({ message: "Failed to update QC2 defect", error: error.message });
    }
};

// DELETE - Delete a QC2 defect by ID
export const deleteQC2Defect = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }
      const defect = await QC2Defects.findById(id);
      if (!defect) {
        return res.status(404).json({ message: "QC2 Defect not found." });
      }
      // Delete associated image file before deleting the record
      if (defect.image) {
        const imagePath = path.join(
          "storage",
          defect.image.replace("/storage/", "")
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      await QC2Defects.findByIdAndDelete(id);
      res.status(200).json({
        message: "QC2 defect and associated image deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting QC2 defect:", error);
      res
        .status(500)
        .json({ message: "Failed to delete QC2 defect", error: error.message });
    } 
};

/* -------------------------------------
   NEW End Point - QC2 Defect Categories
------------------------------------- */

// GET - Fetch all unique QC2 defect categories
export const getAllQC2DefectCategories = async (req, res) => {
   try {
       const categories = await QC2Defects.distinct("categoryEnglish");
   
       res.json(categories.sort());
     } catch (error) {
       console.error("Error fetching QC2 defect categories:", error);
       res
         .status(500)
         .json({ message: "Server error fetching defect categories" });
     }
};

export const saveQC2Image = async (req, res) => {
  try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file provided." });
      }

      const uploadPath = path.join(
        __backendDir,
        "public",
        "storage",
        "qc2_images"
      );
      //await fs.promises.mkdir(uploadPath, { recursive: true });

      const fileExtension = path.extname(req.file.originalname);
      const newFilename = `qc2-defect-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${fileExtension}`;

      const fullFilePath = path.join(uploadPath, newFilename);
      await fs.promises.writeFile(fullFilePath, req.file.buffer);

      // Return the relative URL path for the database
      const relativeUrl = `/storage/qc2_images/${newFilename}`;

      res.status(200).json({ success: true, url: relativeUrl });
    } catch (error) {
      console.error("Error in /api/qc2-defects/upload-image:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error during image upload." });
    }
};

export const editQC2Image = async (req, res) => {
  try {
        const { id } = req.params;
  
        if (!req.file) {
          return res
            .status(400)
            .json({ success: false, message: "No new image file provided." });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid defect ID." });
        }
  
        const defect = await QC2Defects.findById(id);
        if (!defect) {
          return res
            .status(404)
            .json({ success: false, message: "Defect not found." });
        }
  
        // --- Delete the old image file if it exists ---
        if (defect.image) {
          const oldImagePath = path.join(__backendDir, "public", defect.image);
          if (fs.existsSync(oldImagePath)) {
            await fs.promises.unlink(oldImagePath);
          }
        }
  
        // --- Save the new image file ---
        const uploadPath = path.join(
          __backendDir,
          "public",
          "storage",
          "qc2_images"
        );
        const fileExtension = path.extname(req.file.originalname);
        const newFilename = `qc2-defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadPath, newFilename);
        await fs.promises.writeFile(fullFilePath, req.file.buffer);
  
        // --- Update the database with the new path ---
        const newRelativeUrl = `/storage/qc2_images/${newFilename}`;
        defect.image = newRelativeUrl;
        const updatedDefect = await defect.save();
  
        res.status(200).json({
          success: true,
          message: "Image replaced successfully.",
          defect: updatedDefect
        });
      } catch (error) {
        console.error("Error replacing defect image:", error);
        res.status(500).json({
          success: false,
          message: "Server error while replacing image."
        });
      }
};

export const deleteQC2Image = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid defect ID." });
      }
  
      const defect = await QC2Defects.findById(id);
      if (!defect) {
        return res
          .status(404)
          .json({ success: false, message: "Defect not found." });
      }
  
      if (!defect.image) {
        return res
          .status(200)
          .json({ success: true, message: "No image to delete." });
      }
  
      // --- Delete the image file from the filesystem ---
      const imagePath = path.join(__backendDir, "public", defect.image);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath);
      }
  
      // --- Update the database to remove the image path ---
      defect.image = ""; // Set to empty string or null
      const updatedDefect = await defect.save();
  
      res.status(200).json({
        success: true,
        message: "Image deleted successfully.",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error deleting defect image:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error while deleting image." });
    }
};