import {
  SupplierIssuesDefect,
} from "../MongoDB/dbConnectionController.js";

// GET all supplier issue configurations
export const getSupplierIssueDefects = async (req, res) => {
  try {
      const configs = await SupplierIssuesDefect.find().sort({ factoryType: 1 });
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configurations." });
    }
};

// GET a specific configuration by factory type
export const getSupplierIssueFactoryTypes = async (req, res) => {
  try {
      const config = await SupplierIssuesDefect.findOne({
        factoryType: req.params.factoryType
      });
      if (!config) {
        return res.status(404).json({ error: "Configuration not found." });
      }
      // Sort defect list by the 'no' field
      config.defectList.sort((a, b) => a.no - b.no);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration." });
    }
};

// POST a new Factory Type (creates a new document)
export  const saveSupplierIssureDefect = async (req, res) => {
  try {
      const { factoryType } = req.body;
      if (!factoryType) {
        return res.status(400).json({ error: "Factory type is required." });
      }
      const newConfig = new SupplierIssuesDefect({ factoryType });
      await newConfig.save();
      res.status(201).json(newConfig);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ error: "This Factory Type already exists." });
      }
      res.status(400).json({ error: "Failed to create configuration." });
    }
};

// POST (add) a new Factory Name to a specific Factory Type's list
export const saveSupplierIssueFactoryType = async (req, res) => {
  try {
        const { factoryType } = req.params;
        const { factoryName } = req.body;
        if (!factoryName) {
          return res.status(400).json({ error: "Factory name is required." });
        }
        const result = await SupplierIssuesDefect.updateOne(
          { factoryType },
          { $addToSet: { factoryList: factoryName } } // $addToSet prevents duplicates
        );
        if (result.nModified === 0 && result.n === 0)
          return res.status(404).json({ error: "Factory type not found." });
        res.status(200).json({ message: "Factory name added successfully." });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Server error while adding factory name." });
      }
};

// PUT (update) a Factory Name
export const updateSupplierIssueFactoryType = async (req, res) => {
  try {
        const { factoryType } = req.params;
        const { oldName, newName } = req.body;
        if (!oldName || !newName) {
          return res
            .status(400)
            .json({ error: "Old and new factory names are required." });
        }
        const result = await SupplierIssuesDefect.updateOne(
          { factoryType, factoryList: oldName },
          { $set: { "factoryList.$": newName } }
        );
        if (result.nModified === 0)
          return res
            .status(404)
            .json({ error: "Factory name not found or no change made." });
        res.status(200).json({ message: "Factory name updated successfully." });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Server error while updating factory name." });
      }
};

// DELETE a Factory Name
export const deleteSupplierIssueFactoryType = async (req, res) => {
   try {
        const { factoryType } = req.params;
        const { factoryName } = req.body;
        const result = await SupplierIssuesDefect.updateOne(
          { factoryType },
          { $pull: { factoryList: factoryName } }
        );
        if (result.nModified === 0)
          return res.status(404).json({ error: "Factory name not found." });
        res.status(200).json({ message: "Factory name deleted successfully." });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Server error while deleting factory name." });
      }
};

// POST (add) a new Defect to a specific Factory Type's list
export const saveSupplierIssuesDefect = async (req, res) => {
  try {
        const { factoryType } = req.params;
        const { defectNameEng, defectNameKhmer, defectNameChi } = req.body;
        if (!defectNameEng) {
          return res
            .status(400)
            .json({ error: "Defect Name (English) is required." });
        }
  
        const config = await SupplierIssuesDefect.findOne({ factoryType });
        if (!config) {
          return res.status(404).json({ error: "Factory type not found." });
        }
  
        const nextNo =
          config.defectList.length > 0
            ? Math.max(...config.defectList.map((d) => d.no)) + 1
            : 1;
  
        const newDefect = {
          no: nextNo,
          defectNameEng,
          defectNameKhmer,
          defectNameChi
        };
  
        await SupplierIssuesDefect.updateOne(
          { factoryType },
          { $push: { defectList: newDefect } }
        );
        res
          .status(201)
          .json({ message: "Defect added successfully.", defect: newDefect });
      } catch (error) {
        res.status(500).json({ error: "Server error while adding defect." });
      }
};

// PUT (update) a Defect
export const updateSupplierIssueDefect = async (req, res) => {
  try {
        const { factoryType, defectId } = req.params;
        const updateData = req.body;
  
        const updateFields = {};
        for (const key in updateData) {
          updateFields[`defectList.$.${key}`] = updateData[key];
        }
  
        const result = await SupplierIssuesDefect.updateOne(
          { factoryType, "defectList._id": defectId },
          { $set: updateFields }
        );
  
        if (result.nModified === 0)
          return res
            .status(404)
            .json({ error: "Defect not found or no change made." });
        res.status(200).json({ message: "Defect updated successfully." });
      } catch (error) {
        res.status(500).json({ error: "Server error while updating defect." });
      }
};

// DELETE a Defect
export const deleteSupplierIssueDefect = async (req, res) => {
  try {
        const { factoryType, defectId } = req.params;
  
        const result = await SupplierIssuesDefect.updateOne(
          { factoryType },
          { $pull: { defectList: { _id: defectId } } }
        );
  
        if (result.nModified === 0)
          return res.status(404).json({ error: "Defect not found." });
        res.status(200).json({ message: "Defect deleted successfully." });
      } catch (error) {
        res.status(500).json({ error: "Server error while deleting defect." });
      }
};