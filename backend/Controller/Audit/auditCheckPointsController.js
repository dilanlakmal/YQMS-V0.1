import bcrypt from "bcrypt";
import {  
    AuditCheckPoint,             
} from "../../Config/mongodb.js";

// GET all audit checkpoints, sorted by mainTitleNo
export const getAllAuditCheckpoints = async (req, res) => {
  try {
    const checkpoints = await AuditCheckPoint.find({})
      .sort({ mainTitleNo: 1 })
      .lean();
    res.json(checkpoints);
  } catch (error) {
    console.error("Error fetching audit checkpoints:", error);
    res
      .status(500)
      .json({ message: "Server error fetching audit checkpoints" });
  }
};

// GET unique section titles for dropdowns
export const getUniqueSectionTitles = async (req, res) => {
  try {
    const titles = await AuditCheckPoint.aggregate([
      {
        $group: {
          _id: null,
          eng: { $addToSet: "$sectionTitleEng" },
          khmer: { $addToSet: "$sectionTitleKhmer" },
          chinese: { $addToSet: "$sectionTitleChinese" }
        }
      },
      { $project: { _id: 0, eng: 1, khmer: 1, chinese: 1 } }
    ]);
    res.json(
      titles.length > 0 ? titles[0] : { eng: [], khmer: [], chinese: [] }
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching unique section titles" });
  }
};

// GET unique main topics for dropdowns (can be filtered by mainTitle if needed)
export const getUniqueMainTopics = async (req, res) => {
  try {
    // This gets all unique topics across all checkpoints.
    // You might want to filter by a specific checkpoint if adding to an existing one.
    const topics = await AuditCheckPoint.aggregate([
      { $unwind: "$requirements" },
      {
        $group: {
          _id: null,
          eng: { $addToSet: "$requirements.mainTopicEng" },
          khmer: { $addToSet: "$requirements.mainTopicKhmer" },
          chinese: { $addToSet: "$requirements.mainTopicChinese" }
        }
      },
      { $project: { _id: 0, eng: 1, khmer: 1, chinese: 1 } }
    ]);
    res.json(
      topics.length > 0 ? topics[0] : { eng: [], khmer: [], chinese: [] }
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching unique main topics" });
  }
};

// POST - Create a new audit checkpoint section (e.g., QMS, Fabric)
export const createAuditCheckPoint = async (req, res) => {
    try {
    const {
      mainTitle,
      mainTitleNo,
      sectionTitleEng,
      sectionTitleKhmer,
      sectionTitleChinese
      // requirements array will be empty initially or can be sent
    } = req.body;

    if (
      !mainTitle ||
      mainTitleNo === undefined ||
      !sectionTitleEng ||
      !sectionTitleKhmer ||
      !sectionTitleChinese
    ) {
      return res.status(400).json({
        message: "All main title and section title fields are required."
      });
    }

    const existingCheckpointByNo = await AuditCheckPoint.findOne({
      mainTitleNo
    });
    if (existingCheckpointByNo) {
      return res
        .status(409)
        .json({ message: `Main Title No '${mainTitleNo}' already exists.` });
    }
    const existingCheckpointByTitle = await AuditCheckPoint.findOne({
      mainTitle
    });
    if (existingCheckpointByTitle) {
      return res
        .status(409)
        .json({ message: `Main Title '${mainTitle}' already exists.` });
    }

    const newCheckpoint = new AuditCheckPoint({
      mainTitle,
      mainTitleNo,
      sectionTitleEng,
      sectionTitleKhmer,
      sectionTitleChinese,
      requirements: [] // Start with no requirements, add them separately
    });
    await newCheckpoint.save();
    res.status(201).json({
      message: "Audit checkpoint section created successfully",
      checkpoint: newCheckpoint
    });
  } catch (error) {
    console.error("Error creating audit checkpoint section:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate Main Title or Main Title No." });
    res
      .status(500)
      .json({ message: "Server error creating checkpoint section" });
  }
};

// PUT - Update an audit checkpoint section's titles (not requirements here)
export const updateAuditCheckPoint = async (req, res) => {
    try {
    const { id } = req.params;
    const {
      mainTitle,
      mainTitleNo,
      sectionTitleEng,
      sectionTitleKhmer,
      sectionTitleChinese
    } = req.body;

    if (
      !mainTitle ||
      mainTitleNo === undefined ||
      !sectionTitleEng ||
      !sectionTitleKhmer ||
      !sectionTitleChinese
    ) {
      return res.status(400).json({
        message:
          "All main title and section title fields are required for update."
      });
    }

    // Check for duplicates excluding current
    const existingByNo = await AuditCheckPoint.findOne({
      mainTitleNo,
      _id: { $ne: id }
    });
    if (existingByNo)
      return res
        .status(409)
        .json({ message: `Main Title No '${mainTitleNo}' already taken.` });
    const existingByTitle = await AuditCheckPoint.findOne({
      mainTitle,
      _id: { $ne: id }
    });
    if (existingByTitle)
      return res
        .status(409)
        .json({ message: `Main Title '${mainTitle}' already taken.` });

    const updatedCheckpoint = await AuditCheckPoint.findByIdAndUpdate(
      id,
      {
        mainTitle,
        mainTitleNo,
        sectionTitleEng,
        sectionTitleKhmer,
        sectionTitleChinese
      },
      { new: true, runValidators: true }
    );
    if (!updatedCheckpoint)
      return res
        .status(404)
        .json({ message: "Audit checkpoint section not found." });
    res.json({
      message: "Audit checkpoint section updated successfully",
      checkpoint: updatedCheckpoint
    });
  } catch (error) {
    console.error("Error updating audit checkpoint section:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate Main Title or Main Title No on update." });
    res
      .status(500)
      .json({ message: "Server error updating checkpoint section" });
  }
};

// DELETE - Delete an entire audit checkpoint section
export const deleteAuditCheckPoint = async (req, res) => {
    try {
    const { id } = req.params;
    const deletedCheckpoint = await AuditCheckPoint.findByIdAndDelete(id);
    if (!deletedCheckpoint)
      return res
        .status(404)
        .json({ message: "Audit checkpoint section not found." });
    res.json({ message: "Audit checkpoint section deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit checkpoint section:", error);
    res
      .status(500)
      .json({ message: "Server error deleting checkpoint section" });
  }
};

// POST - Add a requirement to a specific checkpoint section
export const addRequirementToCheckpoint = async (req, res) => {
    try {
      const { checkpointId } = req.params;
      const requirementData = req.body; // { mainTopicEng, ..., mustHave }

      // Basic validation for requirement data
      if (
        !requirementData.mainTopicEng ||
        !requirementData.no ||
        !requirementData.pointTitleEng ||
        !requirementData.pointDescriptionEng ||
        requirementData.levelValue === undefined ||
        requirementData.mustHave === undefined
      ) {
        return res
          .status(400)
          .json({ message: "Missing required fields for the requirement." });
      }

      const checkpoint = await AuditCheckPoint.findById(checkpointId);
      if (!checkpoint)
        return res
          .status(404)
          .json({ message: "Audit checkpoint section not found." });

      // Check if requirement 'no' already exists in this section
      const existingRequirementNo = checkpoint.requirements.find(
        (r) => r.no === requirementData.no
      );
      if (existingRequirementNo) {
        return res.status(409).json({
          message: `Requirement No. '${requirementData.no}' already exists in this section.`
        });
      }

      checkpoint.requirements.push(requirementData);
      await checkpoint.save();
      res
        .status(201)
        .json({ message: "Requirement added successfully", checkpoint });
    } catch (error) {
      console.error("Error adding requirement:", error);
      res.status(500).json({ message: "Server error adding requirement" });
    }
};

// PUT - Update a specific requirement within a checkpoint section
export const updateRequirementInCheckpoint = async (req, res) => {
    try {
      const { checkpointId, requirementId } = req.params;
      const updatedRequirementData = req.body;

      const checkpoint = await AuditCheckPoint.findById(checkpointId);
      if (!checkpoint)
        return res
          .status(404)
          .json({ message: "Audit checkpoint section not found." });

      const requirement = checkpoint.requirements.id(requirementId);
      if (!requirement)
        return res.status(404).json({ message: "Requirement not found." });

      // Check for 'no' conflict if 'no' is being changed
      if (
        updatedRequirementData.no &&
        updatedRequirementData.no !== requirement.no
      ) {
        const existingRequirementNo = checkpoint.requirements.find(
          (r) =>
            r.no === updatedRequirementData.no &&
            r._id.toString() !== requirementId
        );
        if (existingRequirementNo) {
          return res.status(409).json({
            message: `Requirement No. '${updatedRequirementData.no}' already exists in this section for another item.`
          });
        }
      }

      Object.assign(requirement, updatedRequirementData); // Update the subdocument
      await checkpoint.save();
      res.json({ message: "Requirement updated successfully", checkpoint });
    } catch (error) {
      console.error("Error updating requirement:", error);
      res.status(500).json({ message: "Server error updating requirement" });
    }
};

// DELETE - Delete a specific requirement from a checkpoint section
export const deleteRequirementFromCheckpoint = async (req, res) => {
    try {
      const { checkpointId, requirementId } = req.params;
      const checkpoint = await AuditCheckPoint.findById(checkpointId);
      if (!checkpoint)
        return res
          .status(404)
          .json({ message: "Audit checkpoint section not found." });

      const requirement = checkpoint.requirements.id(requirementId);
      if (!requirement)
        return res.status(404).json({ message: "Requirement not found." });

      requirement.remove(); // Mongoose subdocument remove method
      await checkpoint.save();
      res.json({ message: "Requirement deleted successfully", checkpoint });
    } catch (error) {
      console.error("Error deleting requirement:", error);
      res.status(500).json({ message: "Server error deleting requirement" });
    }
};