import {
  HTFirstOutput,
} from "../../MongoDB/dbConnectionController.js";
import { 
  escapeRegex,
} from "../../../helpers/helperFunctions.js";

// 1. GET /api/scc/ht-first-output/search-active-mos?term=<searchTerm>
//    Searches ht_first_outputs for MOs based on a search term.
export const getActiveMos = async (req, res) => {
  try {
      const { term } = req.query;
  
      // Uncomment for debugging
      // console.log("[SERVER] /search-active-mos - Received term:", term);
  
      if (!term || typeof term !== "string" || term.trim() === "") {
        // console.log("[SERVER] /search-active-mos - No valid term, returning [].");
        return res.json([]);
      }
  
      const trimmedTerm = term.trim();
      if (trimmedTerm === "") {
        return res.json([]);
      }
      const escapedTerm = escapeRegex(trimmedTerm); // Escape the trimmed term
  
      // Ensure HTFirstOutput is correctly defined and connected
      if (!HTFirstOutput || typeof HTFirstOutput.aggregate !== "function") {
        console.error(
          "[SERVER] HTFirstOutput model is not correctly defined or initialized."
        );
        return res.status(500).json({ message: "Server configuration error." });
      }
  
      const mos = await HTFirstOutput.aggregate([
        {
          $match: {
            // Changed from `^${escapedTerm}` (starts with) to `escapedTerm` (contains)
            moNo: { $regex: escapedTerm, $options: "i" }
          }
        },
        {
          // Sorting helps $first pick a consistent (e.g., latest) buyer/style if multiple entries exist for an MO
          $sort: { moNo: 1, createdAt: -1 }
        },
        {
          $group: {
            _id: "$moNo", // Group by MO number to get distinct MOs
            moNo: { $first: "$moNo" },
            buyer: { $first: "$buyer" },
            buyerStyle: { $first: "$buyerStyle" }
          }
        },
        {
          $project: {
            _id: 0, // Exclude the default _id from group stage
            moNo: 1,
            buyer: { $ifNull: ["$buyer", ""] }, // Ensure buyer is always a string
            buyerStyle: { $ifNull: ["$buyerStyle", ""] } // Ensure buyerStyle is always a string
          }
        },
        { $limit: 15 } // Limit results for performance, increased slightly
      ]);
  
      // Uncomment for debugging
      // console.log("[SERVER] /search-active-mos - Found MOs:", mos.length, JSON.stringify(mos));
      res.json(mos);
    } catch (error) {
      console.error(
        "[SERVER] Error searching active MOs from HTFirstOutput:",
        error
      );
      res
        .status(500)
        .json({ message: "Failed to search MOs", error: error.message });
    }
};

// 2. GET /api/scc/ht-first-output/mo-details-for-registration?moNo=<moNo>
//    Fetches buyer, buyerStyle, and distinct colors for a given MO from ht_first_outputs.
export const getMoDetailsForRegistration = async (req, res) => {
  try {
        const { moNo } = req.query;
        if (!moNo) {
          return res.status(400).json({ message: "MO No is required." });
        }
  
        const sampleRecord = await HTFirstOutput.findOne({ moNo })
          .sort({ inspectionDate: -1, createdAt: -1 }) // Get the latest overall record for buyer/style consistency
          .lean();
  
        if (!sampleRecord) {
          return res
            .status(404)
            .json({ message: "MO not found in HT First Output records." });
        }
  
        // Fetch distinct colors for the MO across all its records.
        const distinctColors = await HTFirstOutput.distinct("color", { moNo });
  
        res.json({
          buyer: sampleRecord.buyer || "",
          buyerStyle: sampleRecord.buyerStyle || "",
          colors: distinctColors.sort() || [] // Sort colors alphabetically
        });
      } catch (error) {
        console.error("Error fetching MO details for registration:", error);
        res.status(500).json({
          message: "Failed to fetch MO details",
          error: error.message
        });
      }
};

// 3. GET /api/scc/ht-first-output/specs-for-registration?moNo=<moNo>&color=<color>
//    Fetches the standard specs (Temp, Time, Pressure) for a given MO/Color from ht_first_outputs.
export const getSpecsForRegistration = async (req, res) => {
  try {
      const { moNo, color } = req.query;
  
      if (!moNo || !color || moNo.trim() === "" || color.trim() === "") {
        console.log(
          "[SPECS_ENDPOINT] Validation Error: MO No and Color are required and cannot be empty."
        );
        return res
          .status(400)
          .json({ message: "MO No and Color are required and cannot be empty." });
      }
  
      const trimmedMoNo = moNo.trim();
      const trimmedColor = color.trim();
  
      const record = await HTFirstOutput.findOne({
        moNo: trimmedMoNo,
        color: trimmedColor
      })
        .sort({ inspectionDate: -1, createdAt: -1 }) // Get the latest based on date, then creation
        .lean();
  
      if (!record) {
        return res.status(200).json({
          // Send 200 with message, client handles it
          message: "SPECS_NOT_FOUND_NO_RECORD",
          reqTemp: null,
          reqTime: null,
          reqPressure: null
        });
      }
  
      if (
        !record.standardSpecification ||
        record.standardSpecification.length === 0
      ) {
        return res.status(200).json({
          message: "SPECS_NOT_FOUND_STANDARD_SPEC_ARRAY_EMPTY",
          reqTemp: null,
          reqTime: null,
          reqPressure: null
        });
      }
  
      // Primary target: 'first' type spec with all values non-null
      let firstSpec = record.standardSpecification.find(
        (s) =>
          s.type === "first" &&
          s.tempC != null &&
          s.timeSec != null &&
          s.pressure != null
      );
  
      if (firstSpec) {
        return res.json({
          reqTemp: firstSpec.tempC,
          reqTime: firstSpec.timeSec,
          reqPressure: firstSpec.pressure
        });
      }
  
      // Fallback: If no complete 'first' spec, try to find any 'first' spec
  
      firstSpec = record.standardSpecification.find((s) => s.type === "first");
  
      if (firstSpec) {
        return res.json({
          reqTemp: firstSpec.tempC !== undefined ? firstSpec.tempC : null,
          reqTime: firstSpec.timeSec !== undefined ? firstSpec.timeSec : null,
          reqPressure:
            firstSpec.pressure !== undefined ? firstSpec.pressure : null
        });
      }
  
      // If no 'first' spec of any kind is found
  
      return res.status(200).json({
        message: "SPECS_NOT_FOUND_NO_FIRST_TYPE",
        reqTemp: null,
        reqTime: null,
        reqPressure: null
      });
    } catch (error) {
      console.error(
        `[SPECS_ENDPOINT] Critical error fetching specs for MO: "${req.query.moNo}", Color: "${req.query.color}":`,
        error
      );
      res.status(500).json({
        message: "Failed to fetch specifications due to server error",
        error: error.message
      });
    }
};
