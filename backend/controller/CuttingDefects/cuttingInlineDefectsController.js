import { CuttingInlineDefect } from "../MongoDB/dbConnectionController.js";

// Get all cutting inline defects
export const getAllCuttingInlineDefects = async (req, res) => {
  try {
    const defects = await CuttingInlineDefect.find().sort({ created_at: 1 });
    
    res.status(200).json({
      success: true,
      data: defects,
      count: defects.length
    });
  } catch (error) {
    console.error("Error fetching cutting inline defects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cutting inline defects",
      error: error.message
    });
  }
};

// Initialize cutting inline defects (run once)
export const initializeCuttingInlineDefects = async (req, res) => {
  try {
    // Delete all existing defects to ensure clean initialization
    const deleteResult = await CuttingInlineDefect.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing defects`);

    // Drop old indexes (especially defectCode_1)
    try {
      await CuttingInlineDefect.collection.dropIndex("defectCode_1");
      console.log("Dropped old defectCode_1 index");
    } catch (indexError) {
      console.log("Index defectCode_1 not found or already dropped");
    }

    // Define the inline defects
    const inlineDefects = [
      {
        defectName: "Holes",
        defectNameEng: "Holes",
        defectNameKhmer: "ធ្លុះ",
        defectNameChinese: "破洞"
      },
      {
        defectName: "Barre Line",
        defectNameEng: "Barre Line",
        defectNameKhmer: "ឆ្នូតសាច់ក្រណាត់",
        defectNameChinese: "条痕"
      },
      {
        defectName: "Color Spot",
        defectNameEng: "Color Spot",
        defectNameKhmer: "ពណ៌ចំណុច",
        defectNameChinese: "色斑"
      },
      {
        defectName: "Color Shading",
        defectNameEng: "Color Shading",
        defectNameKhmer: "ពណ៌មិនដូចគ្នា",
        defectNameChinese: "色差"
      },
      {
        defectName: "Scratches",
        defectNameEng: "Scratches",
        defectNameKhmer: "ស្នាមខូច",
        defectNameChinese: "划痕"
      },
      {
        defectName: "Stain",
        defectNameEng: "Stain",
        defectNameKhmer: "ប្រលាក់",
        defectNameChinese: "污渍"
      },
      {
        defectName: "Other",
        defectNameEng: "Other",
        defectNameKhmer: "ផ្សេងៗ",
        defectNameChinese: "其他"
      }
    ];

    // Insert the defects
    const result = await CuttingInlineDefect.insertMany(inlineDefects);

    res.status(201).json({
      success: true,
      message: "Cutting inline defects initialized successfully",
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error("Error initializing cutting inline defects:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing cutting inline defects",
      error: error.message
    });
  }
};

// Create a new defect
export const createCuttingInlineDefect = async (req, res) => {
  try {
    const { defectName, defectNameEng, defectNameKhmer, defectNameChinese } = req.body;

    // Validate required fields
    if (!defectName || !defectNameEng || !defectNameKhmer || !defectNameChinese) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const newDefect = new CuttingInlineDefect({
      defectName,
      defectNameEng,
      defectNameKhmer,
      defectNameChinese
    });

    const savedDefect = await newDefect.save();

    res.status(201).json({
      success: true,
      message: "Defect created successfully",
      data: savedDefect
    });
  } catch (error) {
    console.error("Error creating defect:", error);
    res.status(500).json({
      success: false,
      message: "Error creating defect",
      error: error.message
    });
  }
};

// Update a defect
export const updateCuttingInlineDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: Date.now() };

    const updatedDefect = await CuttingInlineDefect.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDefect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Defect updated successfully",
      data: updatedDefect
    });
  } catch (error) {
    console.error("Error updating defect:", error);
    res.status(500).json({
      success: false,
      message: "Error updating defect",
      error: error.message
    });
  }
};

// Delete a defect
export const deleteCuttingInlineDefect = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDefect = await CuttingInlineDefect.findByIdAndDelete(id);

    if (!deletedDefect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Defect deleted successfully",
      data: deletedDefect
    });
  } catch (error) {
    console.error("Error deleting defect:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting defect",
      error: error.message
    });
  }
};

