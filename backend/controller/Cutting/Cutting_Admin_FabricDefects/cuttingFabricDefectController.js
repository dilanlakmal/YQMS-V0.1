import {
  CuttingFabricDefect,                
} from "../../MongoDB/dbConnectionController.js"; 


/* ------------------------------
  Cutting Fabric Defects ENDPOINTS
------------------------------ */
export const getCuttingFabricDefects = async (req, res) => {
  try {
    const defects = await CuttingFabricDefect.find({});
    res.status(200).json(defects);
  } catch (error) {
    console.error("Error fetching cutting fabric defects:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch defects", error: error.message });
  }
};

export const updateCuttingFabricDefect = async (req, res) => {
  try {
    const { defectCode, defectNameEng, defectNameKhmer, defectNameChinese } =
      req.body;

    // Chinese name is optional, so only validate the mandatory fields
    if (!defectCode || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message: "Defect Code, English Name, and Khmer Name are required."
      });
    }

    const existingDefectByCode = await CuttingFabricDefect.findOne({
      defectCode
    });
    if (existingDefectByCode) {
      return res
        .status(409)
        .json({ message: `Defect code '${defectCode}' already exists.` });
    }
    const existingDefectByName = await CuttingFabricDefect.findOne({
      defectNameEng
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists.`
      });
    }

    const newDefect = new CuttingFabricDefect({
      defectCode,
      defectName: defectNameEng,
      defectNameEng,
      defectNameKhmer,
      defectNameChinese: defectNameChinese || "" // Save empty string if not provided
    });
    await newDefect.save();
    res.status(201).json({
      message: "Cutting fabric defect added successfully",
      defect: newDefect
    });
  } catch (error) {
    console.error("Error adding cutting fabric defect:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate defect code or name." });
    }
    res
      .status(500)
      .json({ message: "Failed to add defect", error: error.message });
  }
};

export const updateCuttingFabricDefectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { defectCode, defectNameEng, defectNameKhmer, defectNameChinese } =
      req.body;

    // Chinese name is optional
    if (!defectCode || !defectNameEng || !defectNameKhmer) {
      return res.status(400).json({
        message:
          "Defect Code, English Name, and Khmer Name are required for update."
      });
    }

    const existingDefectByCode = await CuttingFabricDefect.findOne({
      defectCode,
      _id: { $ne: id }
    });
    if (existingDefectByCode) {
      return res.status(409).json({
        message: `Defect code '${defectCode}' already exists for another defect.`
      });
    }
    const existingDefectByName = await CuttingFabricDefect.findOne({
      defectNameEng,
      _id: { $ne: id }
    });
    if (existingDefectByName) {
      return res.status(409).json({
        message: `Defect name (English) '${defectNameEng}' already exists for another defect.`
      });
    }

    const updatedDefect = await CuttingFabricDefect.findByIdAndUpdate(
      id,
      {
        defectCode,
        defectName: defectNameEng,
        defectNameEng,
        defectNameKhmer,
        defectNameChinese: defectNameChinese || "", // Save empty string if not provided
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDefect) {
      return res.status(404).json({ message: "Defect not found." });
    }
    res.status(200).json({
      message: "Cutting fabric defect updated successfully",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error updating cutting fabric defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Update failed due to duplicate defect code or name."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to update defect", error: error.message });
  }
};

export const deleteCuttingFabricDefect = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid defect ID format." });
    }
    const deletedDefect = await CuttingFabricDefect.findByIdAndDelete(id);
    if (!deletedDefect) {
      return res.status(404).json({ message: "Defect not found." });
    }
    res
      .status(200)
      .json({ message: "Cutting fabric defect deleted successfully" });
  } catch (error) {
    console.error("Error deleting cutting fabric defect:", error);
    res
      .status(500)
      .json({ message: "Failed to delete defect", error: error.message });
  }
};