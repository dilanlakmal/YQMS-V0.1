import {
  FUFirstOutput,
  DailyTestingFUQC,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";
import {
  escapeRegex,
} from "../../../Helpers/helperFunctions.js";

// 1. Search Active MOs for FUQC Registration (from fu_first_outputs)
export const getActiveMosForFUQC = async (req, res) => {
  try {
      const { term } = req.query;
      if (!term || typeof term !== "string" || term.trim() === "")
        return res.json([]);
      const trimmedTerm = term.trim();
      if (trimmedTerm === "") return res.json([]);
      const escapedTerm = escapeRegex(trimmedTerm);
  
      if (!FUFirstOutput || typeof FUFirstOutput.aggregate !== "function") {
        console.error(
          "[SERVER FUQC] FUFirstOutput model is not correctly defined."
        );
        return res.status(500).json({ message: "Server configuration error." });
      }
  
      const mos = await FUFirstOutput.aggregate([
        { $match: { moNo: { $regex: escapedTerm, $options: "i" } } },
        { $sort: { moNo: 1, createdAt: -1 } },
        {
          $group: {
            _id: "$moNo",
            moNo: { $first: "$moNo" },
            buyer: { $first: "$buyer" },
            buyerStyle: { $first: "$buyerStyle" }
          }
        },
        {
          $project: {
            _id: 0,
            moNo: 1,
            buyer: { $ifNull: ["$buyer", ""] },
            buyerStyle: { $ifNull: ["$buyerStyle", ""] }
          }
        },
        { $limit: 15 }
      ]);
      res.json(mos);
    } catch (error) {
      console.error("[SERVER FUQC] Error searching active FU MOs:", error);
      res
        .status(500)
        .json({ message: "Failed to search FU MOs", error: error.message });
    }
};

// 2. Get MO Details for FUQC Registration (from fu_first_outputs)
export const getMoDetailsForFUQC = async (req, res) => {
  try {
        const { moNo } = req.query;
        if (!moNo) return res.status(400).json({ message: "MO No is required." });
  
        const sampleRecord = await FUFirstOutput.findOne({ moNo })
          .sort({ inspectionDate: -1, createdAt: -1 })
          .lean();
        if (!sampleRecord)
          return res
            .status(404)
            .json({ message: "MO not found in Fusing First Output records." });
  
        const distinctColors = await FUFirstOutput.distinct("color", { moNo });
        res.json({
          buyer: sampleRecord.buyer || "",
          buyerStyle: sampleRecord.buyerStyle || "",
          colors: distinctColors.sort() || []
        });
      } catch (error) {
        console.error(
          "[SERVER FUQC] Error fetching FU MO details for registration:",
          error
        );
        res.status(500).json({
          message: "Failed to fetch FU MO details",
          error: error.message
        });
      }
};

// 3. Get Specs (Temp only) for FUQC Registration (from fu_first_outputs)
export const getSpecsForFUQC = async (req, res) => {
  try {
      const { moNo, color } = req.query;
      if (!moNo || !color || moNo.trim() === "" || color.trim() === "") {
        return res.status(400).json({ message: "MO No and Color are required." });
      }
      const record = await FUFirstOutput.findOne({
        moNo: moNo.trim(),
        color: color.trim()
      })
        .sort({ inspectionDate: -1, createdAt: -1 })
        .lean();
  
      if (
        !record ||
        !record.standardSpecification ||
        record.standardSpecification.length === 0
      ) {
        return res
          .status(200)
          .json({ message: "FU_SPECS_NOT_FOUND", reqTemp: null, reqTime: null });
      }
      // Prioritize 'first' type spec
      let targetSpec = record.standardSpecification.find(
        (s) => s.type === "first"
      );
  
      if (!targetSpec) {
        // Fallback if no 'first' spec (should ideally not happen)
        targetSpec = record.standardSpecification[0];
      }
  
      if (!targetSpec) {
        // If still no spec
        return res.status(200).json({
          message: "FU_SPEC_DATA_MISSING",
          reqTemp: null,
          reqTime: null
        });
      }
  
      res.json({
        reqTemp: targetSpec.tempC !== undefined ? targetSpec.tempC : null,
        reqTime: targetSpec.timeSec !== undefined ? targetSpec.timeSec : null // Added reqTime
      });
    } catch (error) {
      console.error(
        "[SERVER FUQC] Error fetching FU specs for registration:",
        error
      );
      res.status(500).json({
        message: "Failed to fetch FU specifications",
        error: error.message
      });
    }
};

// 4. Register Machine for Daily FUQC
export const registerMachineForFUQC = async (req, res) => {
  try {
      const {
        inspectionDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        baseReqTemp,
        baseReqTime, // Added baseReqTime
        operatorData, // Expecting { emp_id, emp_eng_name, emp_face_photo, emp_reference_id }
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title
      } = req.body;
  
      const formattedDate = inspectionDate; // Expecting MM/DD/YYYY from frontend
      if (!formattedDate || !machineNo || !moNo || !color) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for FUQC machine registration."
        });
      }
  
      const now = new Date();
      const registrationTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;
  
      const existingRegistration = await DailyTestingFUQC.findOne({
        inspectionDate: formattedDate,
        machineNo,
        moNo,
        color
      });
      if (existingRegistration) {
        return res.status(409).json({
          success: false,
          message:
            "This Machine-MO-Color is already registered for FUQC on this date.",
          data: existingRegistration
        });
      }
  
      const newRegistrationData = {
        inspectionDate: formattedDate,
        machineNo,
        moNo,
        buyer,
        buyerStyle,
        color,
        baseReqTemp: baseReqTemp !== undefined ? baseReqTemp : null,
        baseReqTime: baseReqTime !== undefined ? baseReqTime : null, // Save baseReqTime
        temp_offset: 5, // Default, can be from settings if needed
        operatorData:
          operatorData && operatorData.emp_id && operatorData.emp_reference_id
            ? operatorData
            : null,
        emp_id,
        emp_kh_name,
        emp_eng_name,
        emp_dept_name,
        emp_sect_name,
        emp_job_title,
        inspectionTime: registrationTime,
        inspections: [],
        remarks: "NA"
      };
  
      const newRegistration = new DailyTestingFUQC(newRegistrationData);
      await newRegistration.save();
  
      const populatedRegistration = await DailyTestingFUQC.findById(
        newRegistration._id
      )
        .populate({
          path: "operatorData.emp_reference_id",
          model: UserMain,
          select: "emp_id eng_name face_photo"
        })
        .lean();
  
      res.status(201).json({
        success: true,
        message: "Machine registered successfully for Daily FUQC.",
        data: populatedRegistration || newRegistration
      });
    } catch (error) {
      console.error(
        "[SERVER FUQC] Error registering machine for Daily FUQC:",
        error
      );
      if (error.code === 11000)
        return res.status(409).json({
          success: false,
          message: "Duplicate FUQC registration.",
          error: error.message
        });
      res.status(500).json({
        success: false,
        message: "Failed to register machine for FUQC",
        error: error.message
      });
    }
};

// 5. Get Daily FUQC Records by Date
export const getDailyFUQCRecordsByDate = async (req, res) => {
  try {
      const { inspectionDate, moNo: filterMoNo } = req.query; // Added moNo for filtering
      if (!inspectionDate)
        return res.status(400).json({ message: "Inspection Date is required." });
  
      const query = { inspectionDate: inspectionDate }; // Ensure consistent date format
      if (filterMoNo && filterMoNo !== "All") {
        query.moNo = filterMoNo;
      }
  
      const records = await DailyTestingFUQC.find(query)
        .populate({
          path: "operatorData.emp_reference_id",
          model: UserMain,
          select: "emp_id eng_name face_photo"
        })
        .sort({ machineNo: 1 })
        .lean();
      res.json(records || []);
    } catch (error) {
      console.error(
        "[SERVER FUQC] Error fetching Daily FUQC records by date:",
        error
      );
      res.status(500).json({
        message: "Failed to fetch daily FUQC records",
        error: error.message
      });
    }
};

// NEW Endpoint: Get Distinct MOs for Daily FUQC
export const getDistinctMosForDailyFUQC = async (req, res) => {
  try {
      const { inspectionDate } = req.query;
      if (!inspectionDate) {
        return res.status(400).json({ message: "Inspection Date is required." });
      }
      const formattedDate = inspectionDate;
  
      const distinctMoNos = await DailyTestingFUQC.distinct("moNo", {
        inspectionDate: formattedDate
      });
      res.json(distinctMoNos.sort() || []);
    } catch (error) {
      console.error("Error fetching distinct MOs for Daily FUQC:", error);
      res.status(500).json({
        message: "Failed to fetch distinct MOs for FUQC",
        error: error.message
      });
    }
};

// 6. Submit Slot Inspection for Daily FUQC
export const submitSlotInspectionForFUQC = async (req, res) => {
  try {
      const {
        inspectionDate,
        timeSlotKey,
        inspectionNo,
        dailyFUQCDocId,
        temp_req,
        temp_actual,
        temp_isNA, // temp_isUserModified removed from FUQC schema
        time_req,
        time_actual,
        time_isNA, // Added time fields
        emp_id
      } = req.body;
  
      if (
        !inspectionDate ||
        !timeSlotKey ||
        !inspectionNo ||
        !dailyFUQCDocId ||
        (temp_actual === undefined && !temp_isNA) ||
        (time_actual === undefined && !time_isNA) // Validation for time
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for FUQC slot submission."
        });
      }
      const record = await DailyTestingFUQC.findById(dailyFUQCDocId);
      if (!record)
        return res.status(404).json({
          success: false,
          message: `FUQC Record not found: ${dailyFUQCDocId}`
        });
      if (record.inspectionDate !== inspectionDate)
        return res
          .status(400)
          .json({ success: false, message: "Date mismatch for FUQC record." });
  
      // Calculate results
      let result_temp = "Pending";
      if (temp_isNA) {
        result_temp = "N/A";
      } else if (temp_actual !== null && temp_req !== null) {
        const diff = Math.abs(Number(temp_actual) - Number(temp_req));
        result_temp = diff <= (record.temp_offset || 0) ? "Pass" : "Reject";
      }
  
      let result_time = "Pending";
      if (time_isNA) {
        result_time = "N/A";
      } else if (time_actual !== null && time_req !== null) {
        // For time, tolerance is 0, so actual must equal req
        result_time =
          Number(time_actual) === Number(time_req) ? "Pass" : "Reject";
      }
  
      let final_result_slot = "Pending";
      if (result_temp === "N/A" && result_time === "N/A")
        final_result_slot = "N/A";
      else if (result_temp === "Pass" && result_time === "Pass")
        final_result_slot = "Pass";
      else if (result_temp === "Reject" || result_time === "Reject")
        final_result_slot = "Reject";
      // If one is Pass and other is N/A or Pending, it remains Pending unless both are Pass or one is Reject.
  
      const slotData = {
        inspectionNo: Number(inspectionNo),
        timeSlotKey,
        temp_req: temp_req !== undefined ? temp_req : null,
        temp_actual: temp_isNA
          ? null
          : temp_actual !== undefined
          ? temp_actual
          : null,
        temp_isNA: !!temp_isNA,
        result_temp,
        time_req: time_req !== undefined ? time_req : null,
        time_actual: time_isNA
          ? null
          : time_actual !== undefined
          ? time_actual
          : null,
        time_isNA: !!time_isNA,
        result_time,
        final_result_slot,
        inspectionTimestamp: new Date()
      };
  
      const existingSlotIndex = record.inspections.findIndex(
        (insp) => insp.timeSlotKey === timeSlotKey
      );
      if (existingSlotIndex > -1) {
        return res.status(409).json({
          success: false,
          message: `Slot ${timeSlotKey} already submitted for this FUQC record.`
        });
      } else {
        record.inspections.push(slotData);
      }
      record.inspections.sort(
        (a, b) => (a.inspectionNo || 0) - (b.inspectionNo || 0)
      );
      record.emp_id = emp_id;
      const now = new Date();
      record.inspectionTime = `${String(now.getHours()).padStart(
        2,
        "0"
      )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;
      await record.save();
  
      const populatedRecord = await DailyTestingFUQC.findById(record._id)
        .populate({
          path: "operatorData.emp_reference_id",
          model: UserMain,
          select: "emp_id eng_name face_photo"
        })
        .lean();
  
      res.status(201).json({
        success: true,
        message: `FUQC Inspection for slot ${timeSlotKey} submitted.`,
        data: populatedRecord || record
      });
    } catch (error) {
      console.error(
        "[SERVER FUQC] Error submitting FUQC slot inspection:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to submit FUQC slot inspection",
        error: error.message
      });
    }
};