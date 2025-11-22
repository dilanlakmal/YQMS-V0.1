import { QASectionsAqlValues } from "../../MongoDB/dbConnectionController.js";

// Get all AQL Values
export const getAQLValues = async (req, res) => {
  try {
    const data = await QASectionsAqlValues.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new AQL Value entry
export const createAQLValue = async (req, res) => {
  const newData = new QASectionsAqlValues(req.body);
  try {
    await newData.save();
    res.status(201).json(newData);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Update existing AQL Value by ID
export const updateAQLValue = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedData = await QASectionsAqlValues.findByIdAndUpdate(id, data, {
      new: true
    });
    if (!updatedData) {
      return res.status(404).json({ message: "AQL Value entry not found" });
    }
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Delete AQL Value by ID
export const deleteAQLValue = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedData = await QASectionsAqlValues.findByIdAndDelete(id);
    if (!deletedData) {
      return res.status(404).json({ message: "AQL Value entry not found" });
    }
    res.status(200).json({ message: "AQL Value entry deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
