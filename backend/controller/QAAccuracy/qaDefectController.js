import {
  QADefectsModel,
  QAStandardDefectsModel,
} from "../MongoDB/dbConnectionController.js";

// GET - Fetch all QA defects with optional filtering
export const getQADefects = async (req, res) => {
  try {
      const { isCommon } = req.query;
      const filter = {};
      if (isCommon) filter.isCommon = isCommon;
  
      // Fetch defects from the new model, sort by code, and use lean() for performance
      const defects = await QADefectsModel.find(filter).sort({ code: 1 }).lean();
      res.json(defects);
    } catch (error) {
      console.error("Error fetching QA defects:", error);
      res.status(500).json({ message: "Server error fetching QA defects" });
    }
};

// GET - Fetch options for the 'Add QA Defect' form
export const getQADefectOptions = async (req, res) => {
  try {
      // This endpoint is simpler as we don't need categories, repairs, etc.
      const lastDefect = await QADefectsModel.findOne().sort({ code: -1 });
      const nextCode = lastDefect ? lastDefect.code + 1 : 1; // Start from 1 or a higher number like 1001
  
      res.json({ nextCode });
    } catch (error) {
      console.error("Error fetching QA defect options:", error);
      res.status(500).json({ message: "Server error fetching options" });
    }
};

// POST - Add a new QA defect
export const addQADefect = async (req, res) => {
  try {
    const { defectLetter, shortEng, english, khmer, chinese, isCommon } =
      req.body;

    if (!defectLetter || !shortEng || !english || !khmer || !isCommon) {
      return res.status(400).json({
        message: "Required fields are missing. Please fill out all fields."
      });
    }

    const existingDefect = await QADefectsModel.findOne({
      $or: [{ shortEng }, { english }, { defectLetter }]
    });
    if (existingDefect) {
      return res.status(409).json({
        message: `Defect with name or letter already exists.`
      });
    }

    const lastDefect = await QADefectsModel.findOne().sort({ code: -1 });
    const newCode = lastDefect ? lastDefect.code + 1 : 1;

    // Re-use the same logic to create default buyer statuses
    const allBuyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];
    const statusByBuyer = allBuyers.map((buyerName) => ({
      buyerName: buyerName,
      defectStatus: ["Major"],
      isCommon: "Major"
    }));

    const newQADefect = new QADefectsModel({
      code: newCode,
      defectLetter,
      shortEng,
      english,
      khmer,
      chinese: chinese || "",
      isCommon,
      statusByBuyer
      // createdAt and updatedAt are handled by timestamps: true in the schema
    });

    await newQADefect.save();
    res.status(201).json({
      message: "QA defect added successfully",
      defect: newQADefect
    });
  } catch (error) {
    console.error("Error adding QA defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Duplicate entry. Defect code, name, or letter might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add QA defect", error: error.message });
  }
};

// DELETE - Delete a QA defect by its code
export const deleteQADefect = async (req, res) => {
  try {
      const { code } = req.params;
      const defectCode = parseInt(code, 10);
      if (isNaN(defectCode)) {
        return res.status(400).json({ message: "Invalid defect code format." });
      }
      const deletedDefect = await QADefectsModel.findOneAndDelete({
        code: defectCode
      });
      if (!deletedDefect) {
        return res.status(404).json({ message: "QA Defect not found." });
      }
      res.status(200).json({ message: "QA defect deleted successfully" });
    } catch (error) {
      console.error("Error deleting QA defect:", error);
      res.status(500).json({
        message: "Failed to delete QA defect",
        error: error.message
      });
    }
};

// GET - Endpoint for all QA defect details for the management page
export const getQADefectDetails = async (req, res) => {
    try {
    const defects = await QADefectsModel.find({}).sort({ code: 1 }).lean();
    const transformedDefects = defects.map((defect) => ({
      code: defect.code.toString(),
      defectLetter: defect.defectLetter, // Include the new field
      name_en: defect.english,
      name_kh: defect.khmer,
      name_ch: defect.chinese,
      // The other fields like category, repair, type are not in this model
      statusByBuyer: defect.statusByBuyer || []
    }));
    res.json(transformedDefects);
  } catch (error) {
    console.error("Error fetching all QA defect details:", error);
    res.status(500).json({
      message: "Failed to fetch QA defect details",
      error: error.message
    });
  }
};

// POST - Endpoint for updating QA defect buyer statuses (Robust Version)
export const updateQADefectBuyerStatuses = async (req, res) => {
  try {
    const statusesPayload = req.body;
    if (!Array.isArray(statusesPayload)) {
      return res
        .status(400)
        .json({ message: "Invalid payload: Expected an array of statuses." });
    }

    // Group the payload by defectCode
    const updatesByDefect = statusesPayload.reduce((acc, status) => {
      const defectCode = status.defectCode;
      if (!acc[defectCode]) {
        acc[defectCode] = [];
      }
      // Push the full buyer status object
      acc[defectCode].push({
        buyerName: status.buyerName,
        defectStatus: status.defectStatus || [],
        isCommon: status.isCommon || "Major"
      });
      return acc;
    }, {});

    // Create a bulk operation to update each defect's entire statusByBuyer array
    const bulkOps = Object.keys(updatesByDefect).map((defectCodeStr) => {
      const defectCodeNum = parseInt(defectCodeStr, 10);
      return {
        updateOne: {
          filter: { code: defectCodeNum },
          // Overwrite the entire array. This is simpler and more robust.
          update: {
            $set: {
              statusByBuyer: updatesByDefect[defectCodeStr]
            }
          }
        }
      };
    });

    if (bulkOps.length > 0) {
      await QADefectsModel.bulkWrite(bulkOps);
    }

    res.status(200).json({
      message: "QA Defect buyer statuses updated successfully."
    });
  } catch (error) {
    console.error("Error updating QA defect buyer statuses:", error);
    res.status(500).json({
      message: "Failed to update QA defect buyer statuses",
      error: error.message
    });
  }
};

// GET all standard defects
export const getQAStandardDefects = async (req, res) => {
  try {
      const defects = await QAStandardDefectsModel.find({}).sort({ code: 1 });
      res.json(defects);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching standard defects",
        error: error.message
      });
    }
};

// GET next available code
export const getNextCode = async (req, res) => {
   try {
      const lastDefect = await QAStandardDefectsModel.findOne().sort({
        code: -1
      });
      const nextCode = lastDefect ? lastDefect.code + 1 : 1;
      res.json({ nextCode });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching next code", error: error.message });
    }
};

// POST a new standard defect
export const addQAStandardDefect = async (req, res) => {
  try {
      const newDefect = new QAStandardDefectsModel(req.body);
      await newDefect.save();
      res.status(201).json(newDefect);
    } catch (error) {
      res.status(400).json({
        message: "Error creating standard defect",
        error: error.message
      });
    }
};

// PUT (Update) a standard defect
export const updateQAStandardDefect = async (req, res) => {
  try {
    const updatedDefect = await QAStandardDefectsModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDefect) {
      return res.status(404).json({ message: "Defect not found" });
    }
    res.json(updatedDefect);
  } catch (error) {
    res.status(400).json({
      message: "Error updating standard defect",
      error: error.message
    });
  }
};

// DELETE a standard defect
export const deleteQAStandardDefect = async (req, res) => {
  try {
      const deletedDefect = await QAStandardDefectsModel.findByIdAndDelete(
        req.params.id
      );
      if (!deletedDefect) {
        return res.status(404).json({ message: "Defect not found" });
      }
      res.status(200).json({ message: "Defect deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Error deleting standard defect",
        error: error.message
      });
    }
};

// GET - Fetch all QA defects for the dropdown (lightweight version)
export const getQADefectsForDropdown = async (req, res) => {
  try {
      const defects = await QADefectsModel.find({})
        .sort({ code: 1 })
        .select("code english khmer chinese statusByBuyer") // Select only necessary fields
        .lean();
      res.json(defects);
    } catch (error) {
      console.error("Error fetching QA defects list:", error);
      res.status(500).json({ message: "Server error fetching QA defects list" });
    }
};

// --- FIX #2: NEW ENDPOINT TO FETCH STANDARD DEFECTS FOR THE FORM ---
export const getStandardDefectsForForm = async (req, res) => {
   try {
      const defects = await QAStandardDefectsModel.find({})
        .sort({ code: 1 })
        .lean(); // Use lean for performance
      res.json(defects);
    } catch (error) {
      console.error("Error fetching standard defects list:", error);
      res
        .status(500)
        .json({ message: "Server error fetching standard defects list" });
    }
};
