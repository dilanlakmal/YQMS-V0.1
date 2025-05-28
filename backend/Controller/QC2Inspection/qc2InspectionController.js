import bcrypt from "bcrypt";
import {
  QC2InspectionPassBundle,
  QC2DefectPrint,
  QC2Reworks,
  QC2OrderData,                
} from "../../Config/mongodb.js";

import { io } from "../../Config/appConfig.js";

/* ------------------------------
   QC2 - Inspection Pass Bundle, Reworks
------------------------------ */

// Endpoint to save inspection pass bundle data
export const saveQC2Data = async (req, res) => {
    try {
        const {
          package_no,
          // bundleNo,
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
          printArray,
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
          error: error.message,
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
            runValidators: true,
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
            data: updatedRecord,
          });
        } catch (error) {
          console.error("Error updating inspection pass bundle:", error);
          res.status(500).json({
            message: "Failed to update inspection pass bundle",
            error: error.message,
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
          bundle_random_id,
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
          bundle_random_id,
        });
        await newRecord.save();
        res.status(201).json({
          message: "Reworks data saved successfully",
          data: newRecord,
        });
      } catch (error) {
        console.error("Error saving reworks data:", error);
        res.status(500).json({
          message: "Failed to save reworks data",
          error: error.message,
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
          bundle_random_id,
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
          bundle_random_id,
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
          createdAt: -1,
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
          details: error.message,
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
          repair: { $addToSet: "$repair" },
        },
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          package_no: 1,
          repair: 1,
        },
      },
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
export const editInspectionData = async (req, res) => {
  const { id } = req.params;
    const updateData = req.body;
  
    try {
      // console.log(`Received request to update record with ID: ${id}`);
      // console.log(`Update Data: ${JSON.stringify(updateData)}`);
      const updatedRecord = await QC2InspectionPassBundle.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      if (!updatedRecord) {
        // console.log(`Record with ID: ${id} not found`);
        return res.status(404).send({ message: "Record not found" });
      }
      // console.log(`Record with ID: ${id} updated successfully`);
      res.send(updatedRecord);
    } catch (error) {
      console.error("Error updating record:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
};

