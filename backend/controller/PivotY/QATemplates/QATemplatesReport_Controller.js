import {
  QASectionsTemplates,
  QASectionsDefectCategory,
  QASectionsPhotos
} from "../../MongoDB/dbConnectionController.js";

/**
 * CREATE Template
 */
export const CreateTemplate = async (req, res) => {
  try {
    const {
      ReportType,
      Measurement,
      Header,
      Photos,
      Line,
      Table,
      Colors,
      ShippingStage,
      InspectedQtyMethod,
      isCarton,
      isQCScan,
      InspectedQty,
      QualityPlan,
      Conclusion,
      DefectCategoryList,
      SelectedPhotoSectionList
    } = req.body;

    if (!ReportType) {
      return res
        .status(400)
        .json({ success: false, message: "Report Type is required." });
    }

    // Auto-increment 'no'
    const maxDoc = await QASectionsTemplates.findOne()
      .sort({ no: -1 })
      .select("no");
    const nextNo = maxDoc ? maxDoc.no + 1 : 1;

    const newTemplate = new QASectionsTemplates({
      no: nextNo,
      ReportType,
      Measurement,
      Header,
      Photos,
      Line: Line || "Yes",
      Table: Table || "Yes",
      Colors: Colors || "Yes",
      ShippingStage: ShippingStage || "Yes",
      InspectedQtyMethod: InspectedQtyMethod || "NA",
      isCarton: isCarton || "No",
      isQCScan: isQCScan || "No",
      InspectedQty: InspectedQty || 0,
      QualityPlan,
      Conclusion,
      DefectCategoryList: DefectCategoryList || [],
      SelectedPhotoSectionList: SelectedPhotoSectionList || []
    });

    await newTemplate.save();

    res.status(201).json({
      success: true,
      message: "Report Template created successfully.",
      data: newTemplate
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET All Templates (Sorted by No)
 */
export const GetTemplates = async (req, res) => {
  try {
    const templates = await QASectionsTemplates.find().sort({ no: 1 });
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE Template
 */
export const UpdateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTemplate = await QASectionsTemplates.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found." });
    }

    res.status(200).json({
      success: true,
      message: "Report Template updated successfully.",
      data: updatedTemplate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE Template
 */
export const DeleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await QASectionsTemplates.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Template deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * HELPER: Get All Defect Categories (For the Modal Checkboxes)
 */
export const GetCategoriesForSelection = async (req, res) => {
  try {
    // We reuse the existing collection but this is a specific helper for this UI
    const categories = await QASectionsDefectCategory.find().sort({ no: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * HELPER: Get All Photo Sections (For the Modal Checkboxes)
 */
export const GetPhotoSectionsForSelection = async (req, res) => {
  try {
    // Select only what we need for the UI
    const photoSections = await QASectionsPhotos.find()
      .select("sectionName itemList")
      .sort({ sectionName: 1 });
    res.status(200).json({ success: true, data: photoSections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
