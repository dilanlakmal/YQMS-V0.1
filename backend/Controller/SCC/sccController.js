import bcrypt from "bcrypt";
import {
  HTFirstOutput,
  FUFirstOutput,
  SCCDailyTesting,
  DailyTestingHTFU,                
} from "../../Config/mongodb.js";
import  { formatDateToMMDDYYYY } from "../../Helpers/heperFunction.js";

export const saveHtFirstOutput = async (req, res) => {
    try {
        const { _id, ...dataToSave } = req.body;
        dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    
        // Ensure remarks fields are "NA" if empty
        dataToSave.remarks = dataToSave.remarks?.trim() || "NA";
        if (
          dataToSave.standardSpecification &&
          dataToSave.standardSpecification.length > 0
        ) {
          dataToSave.standardSpecification = dataToSave.standardSpecification.map(
            (spec) => ({
              ...spec,
              remarks: spec.remarks?.trim() || "NA"
            })
          );
        }
    
        let record;
        if (_id) {
          record = await HTFirstOutput.findByIdAndUpdate(_id, dataToSave, {
            new: true,
            runValidators: true,
            upsert: false
          }); // Make sure upsert is false for explicit update
          if (!record)
            return res
              .status(404)
              .json({ message: "Record not found for update." });
        } else {
          // Check for existing record by moNo, color, and inspectionDate before creating
          const existing = await HTFirstOutput.findOne({
            moNo: dataToSave.moNo,
            color: dataToSave.color,
            inspectionDate: dataToSave.inspectionDate
          });
          if (existing) {
            // If it exists, update it
            record = await HTFirstOutput.findByIdAndUpdate(
              existing._id,
              dataToSave,
              { new: true, runValidators: true }
            );
          } else {
            record = new HTFirstOutput(dataToSave);
            await record.save();
          }
        }
        res
          .status(201)
          .json({ message: "HT First Output saved successfully", data: record });
      } catch (error) {
        console.error("Error saving HT First Output:", error);
        if (error.code === 11000) {
          // Mongoose duplicate key error
          return res.status(409).json({
            message:
              "Duplicate entry. A record with this MO, Color, and Date already exists.",
            error: error.message,
            errorCode: "DUPLICATE_KEY"
          });
        }
        res.status(500).json({
          message: "Failed to save HT First Output",
          error: error.message,
          details: error
        });
      }
};

export const getHtFirstOutput = async (req, res) => {
    try {
    const { moNo, color, inspectionDate } = req.query;
    if (!moNo || !color || !inspectionDate) {
      return res
        .status(400)
        .json({ message: "MO No, Color, and Inspection Date are required." });
    }
    const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    const record = await HTFirstOutput.findOne({
      moNo,
      color,
      inspectionDate: formattedDate
    });
    if (!record) {
      // Return 200 with a specific message for "not found" so frontend can handle it as new record
      return res
        .status(200)
        .json({ message: "HT_RECORD_NOT_FOUND", data: null });
    }
    res.json(record); // Existing record data will be in record directly, not record.data
  } catch (error) {
    console.error("Error fetching HT First Output:", error);
    res.status(500).json({
      message: "Failed to fetch HT First Output",
      error: error.message
    });
  }
};

// REVISED Endpoints for FUFirstOutput (similar changes as HT)
export const saveFuFirstOutput = async (req, res) => {
    try {
        const { _id, ...dataToSave } = req.body;
        dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
    
        dataToSave.remarks = dataToSave.remarks?.trim() || "NA";
        if (
          dataToSave.standardSpecification &&
          dataToSave.standardSpecification.length > 0
        ) {
          dataToSave.standardSpecification = dataToSave.standardSpecification.map(
            (spec) => ({
              ...spec,
              remarks: spec.remarks?.trim() || "NA"
            })
          );
        }
    
        let record;
        if (_id) {
          record = await FUFirstOutput.findByIdAndUpdate(_id, dataToSave, {
            new: true,
            runValidators: true,
            upsert: false
          });
          if (!record)
            return res
              .status(404)
              .json({ message: "Record not found for update." });
        } else {
          const existing = await FUFirstOutput.findOne({
            moNo: dataToSave.moNo,
            color: dataToSave.color,
            inspectionDate: dataToSave.inspectionDate
          });
          if (existing) {
            record = await FUFirstOutput.findByIdAndUpdate(
              existing._id,
              dataToSave,
              { new: true, runValidators: true }
            );
          } else {
            record = new FUFirstOutput(dataToSave);
            await record.save();
          }
        }
        res
          .status(201)
          .json({ message: "FU First Output saved successfully", data: record });
      } catch (error) {
        console.error("Error saving FU First Output:", error);
        if (error.code === 11000) {
          return res.status(409).json({
            message:
              "Duplicate entry. A record with this MO, Color, and Date already exists.",
            error: error.message,
            errorCode: "DUPLICATE_KEY"
          });
        }
        res.status(500).json({
          message: "Failed to save FU First Output",
          error: error.message,
          details: error
        });
      }
};

export const getFuFirstOutput = async (req, res) => {
    try {
        const { moNo, color, inspectionDate } = req.query;
        if (!moNo || !color || !inspectionDate) {
          return res
            .status(400)
            .json({ message: "MO No, Color, and Inspection Date are required." });
        }
        const formattedDate = formatDateToMMDDYYYY(inspectionDate);
        const record = await FUFirstOutput.findOne({
          moNo,
          color,
          inspectionDate: formattedDate
        });
        if (!record) {
          return res
            .status(200)
            .json({ message: "FU_RECORD_NOT_FOUND", data: null });
        }
        res.json(record);
      } catch (error) {
        console.error("Error fetching FU First Output:", error);
        res.status(500).json({
          message: "Failed to fetch FU First Output",
          error: error.message
        });
      }
};

/* ------------------------------
   End Points - SCC HT/FU - Daily Testing
------------------------------ */

export const getFirstOutput = async (req, res) => {
    try {
        const { moNo, color, inspectionDate } = req.query;
        if (!moNo || !color || !inspectionDate) {
          return res
            .status(400)
            .json({ message: "MO No, Color, and Inspection Date are required." });
        }
        const formattedDate = formatDateToMMDDYYYY(inspectionDate);
    
        let specs = null;
        // Try HT First Output
        const htRecord = await HTFirstOutput.findOne({
          moNo,
          color,
          inspectionDate: formattedDate
        }).lean();
        if (htRecord && htRecord.standardSpecification) {
          const afterHatSpec = htRecord.standardSpecification.find(
            (s) => s.type === "afterHat" && s.timeSec && s.tempC && s.pressure
          );
          const firstSpec = htRecord.standardSpecification.find(
            (s) => s.type === "first"
          );
          if (afterHatSpec) {
            specs = {
              tempC: afterHatSpec.tempC,
              timeSec: afterHatSpec.timeSec,
              pressure: afterHatSpec.pressure
            };
          } else if (firstSpec) {
            specs = {
              tempC: firstSpec.tempC,
              timeSec: firstSpec.timeSec,
              pressure: firstSpec.pressure
            };
          }
        }
    
        // If not found in HT, try FU First Output (assuming similar logic might apply or distinct records)
        if (!specs) {
          const fuRecord = await FUFirstOutput.findOne({
            moNo,
            color,
            inspectionDate: formattedDate
          }).lean();
          if (fuRecord && fuRecord.standardSpecification) {
            const afterHatSpec = fuRecord.standardSpecification.find(
              (s) => s.type === "afterHat" && s.timeSec && s.tempC && s.pressure
            );
            const firstSpec = fuRecord.standardSpecification.find(
              (s) => s.type === "first"
            );
            if (afterHatSpec) {
              specs = {
                tempC: afterHatSpec.tempC,
                timeSec: afterHatSpec.timeSec,
                pressure: afterHatSpec.pressure
              };
            } else if (firstSpec) {
              specs = {
                tempC: firstSpec.tempC,
                timeSec: firstSpec.timeSec,
                pressure: firstSpec.pressure
              };
            }
          }
        }
    
        if (!specs) {
          return res.status(200).json({ message: "SPECS_NOT_FOUND", data: null });
        }
        res.json({ data: specs });
      } catch (error) {
        console.error("Error fetching first output specs:", error);
        res.status(500).json({
          message: "Failed to fetch first output specifications",
          error: error.message
        });
      }
};

// Endpoints for SCCDailyTesting
export const saveSccDailyTesting = async (req, res) => {
    try {
        const { _id, ...dataToSave } = req.body;
        dataToSave.inspectionDate = formatDateToMMDDYYYY(dataToSave.inspectionDate);
        dataToSave.remarks = dataToSave.remarks?.trim() || "NA";
    
        let record;
        if (_id) {
          record = await SCCDailyTesting.findByIdAndUpdate(_id, dataToSave, {
            new: true,
            runValidators: true
          });
          if (!record)
            return res
              .status(404)
              .json({ message: "Daily Testing record not found for update." });
        } else {
          const existing = await SCCDailyTesting.findOne({
            moNo: dataToSave.moNo,
            color: dataToSave.color,
            machineNo: dataToSave.machineNo,
            inspectionDate: dataToSave.inspectionDate
          });
          if (existing) {
            record = await SCCDailyTesting.findByIdAndUpdate(
              existing._id,
              dataToSave,
              { new: true, runValidators: true }
            );
          } else {
            record = new SCCDailyTesting(dataToSave);
            await record.save();
          }
        }
        res.status(201).json({
          message: "Daily Testing report saved successfully",
          data: record
        });
      } catch (error) {
        console.error("Error saving Daily Testing report:", error);
        if (error.code === 11000) {
          return res.status(409).json({
            message:
              "Duplicate entry. A record with this MO, Color, Machine No, and Date already exists.",
            error: error.message,
            errorCode: "DUPLICATE_KEY"
          });
        }
        res.status(500).json({
          message: "Failed to save Daily Testing report",
          error: error.message,
          details: error
        });
      }
};

export const getSccDailyTesting = async (req, res) => {
    try {
        const { moNo, color, machineNo, inspectionDate } = req.query;
        if (!moNo || !color || !machineNo || !inspectionDate) {
          return res.status(400).json({
            message: "MO No, Color, Machine No, and Inspection Date are required."
          });
        }
        const formattedDate = formatDateToMMDDYYYY(inspectionDate);
        const record = await SCCDailyTesting.findOne({
          moNo,
          color,
          machineNo,
          inspectionDate: formattedDate
        });
        if (!record) {
          return res
            .status(200)
            .json({ message: "DAILY_TESTING_RECORD_NOT_FOUND", data: null });
        }
        res.json(record); // Returns the existing record
      } catch (error) {
        console.error("Error fetching Daily Testing report:", error);
        res.status(500).json({
          message: "Failed to fetch Daily Testing report",
          error: error.message
        });
      }
};

/* ------------------------------
   End Points - SCC Daily HT/FU QC Test
------------------------------ */

// GET Endpoint to fetch existing Daily HT/FU Test data or MO list
export const getDailyHtFuTest = async (req, res) => {
    try {
        const { inspectionDate, machineNo, moNo, color } = req.query;
        const formattedDate = inspectionDate
          ? formatDateToMMDDYYYY(inspectionDate)
          : null;
    
        if (!formattedDate || !machineNo) {
          return res
            .status(400)
            .json({ message: "Inspection Date and Machine No are required." });
        }
    
        // Scenario 1: Fetch specific record if moNo and color are provided
        if (moNo && color) {
          const record = await DailyTestingHTFU.findOne({
            inspectionDate: formattedDate,
            machineNo,
            moNo,
            color
          });
          if (!record) {
            return res
              .status(200)
              .json({ message: "DAILY_HTFU_RECORD_NOT_FOUND", data: null });
          }
          return res.json({ message: "RECORD_FOUND", data: record });
        } else {
          // Scenario 2: Fetch distinct MO/Color combinations for a given Date/MachineNo
          const records = await DailyTestingHTFU.find(
            { inspectionDate: formattedDate, machineNo },
            "moNo color buyer buyerStyle" // Select only necessary fields
          ).distinct("moNo"); // Or more complex aggregation if needed to pair MO with Color
    
          // For simplicity, let's return distinct MOs, client can then pick color
          // A better approach might be to return {moNo, color, buyer, buyerStyle} tuples
          const distinctEntries = await DailyTestingHTFU.aggregate([
            { $match: { inspectionDate: formattedDate, machineNo } },
            {
              $group: {
                _id: { moNo: "$moNo", color: "$color" },
                buyer: { $first: "$buyer" },
                buyerStyle: { $first: "$buyerStyle" },
                // If you need to know if a full record exists to load it directly
                docId: { $first: "$_id" }
              }
            },
            {
              $project: {
                _id: 0,
                moNo: "$_id.moNo",
                color: "$_id.color",
                buyer: "$buyer",
                buyerStyle: "$buyerStyle",
                docId: "$docId"
              }
            }
          ]);
    
          if (distinctEntries.length === 0) {
            return res.status(200).json({
              message: "NO_RECORDS_FOR_DATE_MACHINE",
              data: []
            });
          }
          // If only one unique MO/Color combo, frontend might auto-load it fully later
          return res.json({
            message: "MULTIPLE_MO_COLOR_FOUND",
            data: distinctEntries // Array of {moNo, color, buyer, buyerStyle, docId}
          });
        }
      } catch (error) {
        console.error("Error fetching Daily HT/FU Test data:", error);
        res.status(500).json({
          message: "Failed to fetch Daily HT/FU Test data",
          error: error.message
        });
      }
};

// POST Endpoint to save/update Daily HT/FU Test data
export const saveDailyHtFuTest = async (req, res) => {
    try {
        const {
          _id, // ID of the main document if updating
          inspectionDate,
          machineNo,
          moNo,
          buyer,
          buyerStyle,
          color,
          emp_id,
          emp_kh_name,
          emp_eng_name,
          emp_dept_name,
          emp_sect_name,
          emp_job_title, // User details
          baseReqTemp,
          baseReqTime,
          baseReqPressure, // Base specs from first output
          currentInspection, // The data for the specific slot being submitted
          stretchTestResult,
          washingTestResult // Overall tests
        } = req.body;
    
        const formattedDate = formatDateToMMDDYYYY(inspectionDate);
        if (!formattedDate || !machineNo || !moNo || !color || !currentInspection) {
          return res
            .status(400)
            .json({ message: "Missing required fields for submission." });
        }
    
        const now = new Date();
        const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    
        const query = { inspectionDate: formattedDate, machineNo, moNo, color };
        let record = await DailyTestingHTFU.findOne(query);
    
        if (record) {
          // Update existing record
          record.baseReqTemp = baseReqTemp ?? record.baseReqTemp;
          record.baseReqTime = baseReqTime ?? record.baseReqTime;
          record.baseReqPressure = baseReqPressure ?? record.baseReqPressure;
          record.emp_id = emp_id; // Update user details on each submission if needed
          record.emp_kh_name = emp_kh_name;
          record.emp_eng_name = emp_eng_name;
          record.emp_dept_name = emp_dept_name;
          record.emp_sect_name = emp_sect_name;
          record.emp_job_title = emp_job_title;
          record.inspectionTime = inspectionTime;
    
          // Update or add the specific inspection slot
          const slotIndex = record.inspections.findIndex(
            (insp) => insp.timeSlotKey === currentInspection.timeSlotKey
          );
          if (slotIndex > -1) {
            // Update existing slot, ensuring not to overwrite with nulls if not intended
            record.inspections[slotIndex] = {
              ...record.inspections[slotIndex], // keep old values not submitted
              ...currentInspection, // new values for the slot
              inspectionTimestamp: new Date()
            };
          } else {
            record.inspections.push({
              ...currentInspection,
              inspectionTimestamp: new Date()
            });
          }
          // Sort inspections by inspectionNo after modification
          record.inspections.sort(
            (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
          );
    
          // Update stretch/washing tests only if they are being set and not already "Done"
          // Or if they are 'Pending' and now being set to 'Pass'/'Reject'
          if (
            !record.isStretchWashingTestDone ||
            record.stretchTestResult === "Pending"
          ) {
            if (stretchTestResult && stretchTestResult !== "Pending") {
              record.stretchTestResult = stretchTestResult;
            }
          }
          if (
            !record.isStretchWashingTestDone ||
            record.washingTestResult === "Pending"
          ) {
            if (washingTestResult && washingTestResult !== "Pending") {
              record.washingTestResult = washingTestResult;
            }
          }
          // Mark as done if both are now Pass/Reject
          if (
            (record.stretchTestResult === "Pass" ||
              record.stretchTestResult === "Reject") &&
            (record.washingTestResult === "Pass" ||
              record.washingTestResult === "Reject")
          ) {
            record.isStretchWashingTestDone = true;
          }
        } else {
          // Create new record
          record = new DailyTestingHTFU({
            inspectionDate: formattedDate,
            machineNo,
            moNo,
            buyer,
            buyerStyle,
            color,
            emp_id,
            emp_kh_name,
            emp_eng_name,
            emp_dept_name,
            emp_sect_name,
            emp_job_title,
            inspectionTime,
            baseReqTemp,
            baseReqTime,
            baseReqPressure,
            inspections: [
              { ...currentInspection, inspectionTimestamp: new Date() }
            ],
            stretchTestResult:
              stretchTestResult && stretchTestResult !== "Pending"
                ? stretchTestResult
                : "Pending",
            washingTestResult:
              washingTestResult && washingTestResult !== "Pending"
                ? washingTestResult
                : "Pending"
          });
          if (
            (record.stretchTestResult === "Pass" ||
              record.stretchTestResult === "Reject") &&
            (record.washingTestResult === "Pass" ||
              record.washingTestResult === "Reject")
          ) {
            record.isStretchWashingTestDone = true;
          }
        }
    
        await record.save();
        res.status(201).json({
          message: "Daily HT/FU QC Test saved successfully",
          data: record
        });
      } catch (error) {
        console.error("Error saving Daily HT/FU QC Test:", error);
        if (error.code === 11000) {
          // Duplicate key error
          return res.status(409).json({
            message:
              "A record with this Date, Machine No, MO No, and Color already exists. Submission failed.",
            error: error.message,
            errorCode: "DUPLICATE_KEY"
          });
        }
        res.status(500).json({
          message: "Failed to save Daily HT/FU QC Test",
          error: error.message,
          details: error // Mongoose validation errors might be here
        });
      }
};