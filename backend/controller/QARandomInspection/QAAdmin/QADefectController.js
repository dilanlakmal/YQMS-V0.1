import {
  QADefectsModel,
} from "../../MongoDB/dbConnectionController.js";

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
