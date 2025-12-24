import {
  QAStandardDefectsModel,
} from "../../MongoDB/dbConnectionController.js";


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


