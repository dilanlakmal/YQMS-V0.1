import mongoose from "mongoose";
import {
    AccessoryIssue,
} from "../../MongoDB/dbConnectionController.js";

// GET - Fetch all Accessory Issues
export const getAllAccessoryIssues = async (req, res) => {
  try {
      const issues = await AccessoryIssue.find({}).sort({ no: 1 }).lean();
      res.json(issues);
    } catch (error) {
      console.error('Error fetching accessory issues:', error);
      res.status(500).json({ message: 'Server error fetching accessory issues' });
    }
};

// POST - Add a new Accessory issue
export const addAccessoryIssue = async (req, res) => {
  try {
    const { no, issueEng, issueKhmer, issueChi } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !issueEng ||
      !issueKhmer ||
      !issueChi
    ) {
      return res.status(400).json({
        message:
          "Issue No, English Name, Khmer Name, and Chinese Name are required."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Issue No must be a positive number." });
    }

    // Check for duplicate 'no'
    const existingIssueByNo = await AccessoryIssue.findOne({ no: Number(no) });
    if (existingIssueByNo) {
      return res
        .status(409)
        .json({ message: `Issue No '${no}' already exists.` });
    }
    // Check for duplicate English name
    const existingIssueByName = await AccessoryIssue.findOne({ issueEng });
    if (existingIssueByName) {
      return res.status(409).json({
        message: `Issue name (English) '${issueEng}' already exists.`
      });
    }

    const newAccessoryIssue = new AccessoryIssue({
      no: Number(no),
      issueEng,
      issueKhmer,
      issueChi
    });
    await newAccessoryIssue.save();
    res.status(201).json({
      message: "Accessory issue added successfully",
      issue: newAccessoryIssue
    });
  } catch (error) {
    console.error("Error adding Accessory issue:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Issue No or Name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add Accessory issue", error: error.message });
  }
};

// PUT - Update an existing Accessory issue by ID
export const updateAccessoryIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { no, issueEng, issueKhmer, issueChi } = req.body;

    // Validate required fields
    if (
      no === undefined ||
      no === null ||
      !issueEng ||
      !issueKhmer ||
      !issueChi
    ) {
      return res.status(400).json({
        message:
          "Issue No, English Name, Khmer Name, and Chinese Name are required for update."
      });
    }
    if (isNaN(parseInt(no)) || parseInt(no) <= 0) {
      return res
        .status(400)
        .json({ message: "Issue No must be a positive number." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID format." });
    }

    // Check for duplicate 'no' (excluding the current document)
    const existingIssueByNo = await AccessoryIssue.findOne({
      no: Number(no),
      _id: { $ne: id }
    });
    if (existingIssueByNo) {
      return res.status(409).json({
        message: `Issue No '${no}' already exists for another issue.`
      });
    }
    // Check for duplicate English name (excluding the current document)
    const existingIssueByName = await AccessoryIssue.findOne({
      issueEng,
      _id: { $ne: id }
    });
    if (existingIssueByName) {
      return res.status(409).json({
        message: `Issue name (English) '${issueEng}' already exists for another issue.`
      });
    }

    const updatedAccessoryIssue = await AccessoryIssue.findByIdAndUpdate(
      id,
      {
        no: Number(no),
        issueEng,
        issueKhmer,
        issueChi
      },
      { new: true, runValidators: true }
    );

    if (!updatedAccessoryIssue) {
      return res.status(404).json({ message: "Accessory Issue not found." });
    }
    res.status(200).json({
      message: "Accessory issue updated successfully",
      issue: updatedAccessoryIssue
    });
  } catch (error) {
    console.error("Error updating Accessory issue:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Update failed due to duplicate Issue No or Name." });
    }
    res.status(500).json({
      message: "Failed to update Accessory issue",
      error: error.message
    });
  }
};

// DELETE - Delete an Accessory issue by ID
export const deleteAccessoryIssue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID format." });
    }

    const deletedAccessoryIssue = await AccessoryIssue.findByIdAndDelete(id);
    if (!deletedAccessoryIssue) {
      return res.status(404).json({ message: "Accessory Issue not found." });
    }
    res.status(200).json({ message: "Accessory issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting Accessory issue:", error);
    res.status(500).json({
      message: "Failed to delete Accessory issue",
      error: error.message
    });
  }
};