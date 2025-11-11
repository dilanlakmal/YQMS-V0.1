import { QASectionsDefectList } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS DEFECT LIST - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-defect-list
 * Controller: Creates a new defect
 */
export const CreateDefect = async (req, res) => {
  try {
    const {
      english,
      khmer,
      chinese,
      defectLetter,
      CategoryCode,
      CategoryEngName,
      isCommon
    } = req.body;

    // Validate required fields
    if (
      !english ||
      !defectLetter ||
      !CategoryCode ||
      !CategoryEngName ||
      isCommon === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "english, defectLetter, CategoryCode, CategoryEngName, and isCommon are required"
      });
    }

    // Get the highest code and increment
    const maxDefect = await QASectionsDefectList.findOne()
      .sort({ code: -1 })
      .select("code");

    const newCode = maxDefect ? maxDefect.code + 1 : 1;

    const newDefect = new QASectionsDefectList({
      code: newCode,
      english,
      khmer: khmer || "",
      chinese: chinese || "",
      defectLetter,
      CategoryCode,
      CategoryEngName,
      isCommon,
      statusByBuyer: [],
      decisions: [],
      defectLocations: []
    });

    await newDefect.save();

    return res.status(201).json({
      success: true,
      message: "Defect created successfully",
      data: newDefect
    });
  } catch (error) {
    console.error("Error creating defect:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate defect code"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create defect",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-defect-list
 * Controller: Retrieves all defects sorted by code
 */
export const GetDefects = async (req, res) => {
  try {
    const defects = await QASectionsDefectList.find().sort({ code: 1 });

    return res.status(200).json({
      success: true,
      count: defects.length,
      data: defects
    });
  } catch (error) {
    console.error("Error fetching defects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defects",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-defect-list/:id
 * Controller: Retrieves a specific defect by ID
 */
export const GetSpecificDefect = async (req, res) => {
  try {
    const defect = await QASectionsDefectList.findById(req.params.id);

    if (!defect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: defect
    });
  } catch (error) {
    console.error("Error fetching defect:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defect",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-defect-list/:id
 * Controller: Updates a specific defect
 */
export const UpdateDefect = async (req, res) => {
  try {
    const {
      english,
      khmer,
      chinese,
      defectLetter,
      CategoryCode,
      CategoryEngName,
      isCommon,
      defectLocations
    } = req.body;

    // Validate required fields
    if (
      !english ||
      !defectLetter ||
      !CategoryCode ||
      !CategoryEngName ||
      isCommon === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "english, defectLetter, CategoryCode, CategoryEngName, and isCommon are required"
      });
    }

    const updatedDefect = await QASectionsDefectList.findByIdAndUpdate(
      req.params.id,
      {
        english,
        khmer: khmer || "",
        chinese: chinese || "",
        defectLetter,
        CategoryCode,
        CategoryEngName,
        isCommon,
        defectLocations: defectLocations || []
      },
      { new: true, runValidators: true }
    );

    if (!updatedDefect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Defect updated successfully",
      data: updatedDefect
    });
  } catch (error) {
    console.error("Error updating defect:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update defect",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-defect-list/:id
 * Controller: Deletes a specific defect
 */
export const DeleteDefect = async (req, res) => {
  try {
    const deletedDefect = await QASectionsDefectList.findByIdAndDelete(
      req.params.id
    );

    if (!deletedDefect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Defect deleted successfully",
      data: deletedDefect
    });
  } catch (error) {
    console.error("Error deleting defect:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete defect",
      error: error.message
    });
  }
};
