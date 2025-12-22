import {
 QCWashingCheckList,
 QCWashingDefects,
 QCWashingFirstOutput,
 QCWashingMachineStandard,              
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";
import { __backendDir} from "../../../Config/appConfig.js";
import path from "path";
import fs from "fs";

// GET - Fetch all check list items
export const getQCWashingCheckList = async (req, res) => {
  try {
    const checkList = await QCWashingCheckList.find({})
      .sort({ createdAt: -1 }) 
      .lean();
    res.json(checkList);
  } catch (error) {
    console.error("Error fetching QC Washing check list:", error);
    res.status(500).json({ message: "Server error fetching check list" });
  }
};

// POST - Add new check list item
export const addQCWashingCheckListItem = async (req, res) => {
  try {
      const { name, optionType, options, subPoints, failureImpact, addedBy } = req.body;
  
      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required." });
      }
  
      if (!addedBy || !addedBy.emp_id || !addedBy.eng_name) {
        return res.status(400).json({ message: "Added by information is required." });
      }
  
      // Check if checkpoint with same name already exists
      const existingByName = await QCWashingCheckList.findOne({ name: name.trim() });
      if (existingByName) {
        return res.status(409).json({ 
          message: `Check list name '${name}' already exists.` 
        });
      }
  
      // Validate options structure
      if (!options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ message: "At least one option is required." });
      }
  
      // Process main options with remark validation
      const processedOptions = options.map(option => {
        if (!option.name || !String(option.name).trim()) {
          throw new Error("All options must have names");
        }
  
        const processedOption = {
          id: String(option.id || (Date.now() + Math.random())),
          name: String(option.name).trim(),
          isDefault: Boolean(option.isDefault),
          isFail: Boolean(option.isFail),
          hasRemark: Boolean(option.hasRemark)
        };
  
        // Validate and process remark
        if (option.hasRemark) {
          if (!option.remark || !option.remark.english || !option.remark.english.trim()) {
            throw new Error(`Option "${option.name}" has remark enabled but English remark is missing`);
          }
          processedOption.remark = {
            english: String(option.remark.english).trim(),
            khmer: option.remark.khmer ? String(option.remark.khmer).trim() : '',
            chinese: option.remark.chinese ? String(option.remark.chinese).trim() : ''
          };
        } else {
          processedOption.remark = null;
        }
  
        return processedOption;
      });
  
      // Process subPoints with remark validation
      let processedSubPoints = [];
      if (subPoints && Array.isArray(subPoints) && subPoints.length > 0) {
        processedSubPoints = subPoints
          .filter(subPoint => {
            if (!subPoint) return false;
            if (!subPoint.name || !String(subPoint.name).trim()) return false;
            if (!subPoint.options || !Array.isArray(subPoint.options)) return false;
            
            const hasValidOptions = subPoint.options.some(opt => 
              opt && opt.name && String(opt.name).trim().length > 0
            );
            
            return hasValidOptions;
          })
          .map(subPoint => {
            const processedSubPoint = {
              id: String(subPoint.id || (Date.now() + Math.random())),
              name: String(subPoint.name).trim(),
              optionType: subPoint.optionType || 'passfail',
              options: []
            };
  
            // Process subpoint options with remark validation
            if (subPoint.options && Array.isArray(subPoint.options)) {
              processedSubPoint.options = subPoint.options
                .filter(option => option && option.name && String(option.name).trim().length > 0)
                .map(option => {
                  const processedSubOption = {
                    id: String(option.id || (Date.now() + Math.random())),
                    name: String(option.name).trim(),
                    isDefault: Boolean(option.isDefault),
                    isFail: Boolean(option.isFail),
                    hasRemark: Boolean(option.hasRemark)
                  };
  
                  // Validate and process remark for sub point options
                  if (option.hasRemark) {
                    if (!option.remark || !option.remark.english || !option.remark.english.trim()) {
                      throw new Error(`Option "${option.name}" in sub point "${subPoint.name}" has remark enabled but English remark is missing`);
                    }
                    processedSubOption.remark = {
                      english: String(option.remark.english).trim(),
                      khmer: option.remark.khmer ? String(option.remark.khmer).trim() : '',
                      chinese: option.remark.chinese ? String(option.remark.chinese).trim() : ''
                    };
                  } else {
                    processedSubOption.remark = null;
                  }
  
                  return processedSubOption;
                });
            }
            return processedSubPoint;
          });
      }
  
      // Create the document according to the new schema
      const documentToSave = {
        name: String(name).trim(),
        optionType: optionType || 'passfail',
        options: processedOptions,
        subPoints: processedSubPoints, // This will be stored as nested objects
        failureImpact: failureImpact || 'customize',
        addedBy: {
          emp_id: String(addedBy.emp_id),
          eng_name: String(addedBy.eng_name)
        }
      };
  
      const newCheckList = new QCWashingCheckList(documentToSave);
      const savedDocument = await newCheckList.save();
  
      res.status(201).json({
        message: "Check list item added successfully",
        checkList: savedDocument
      });
  
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "Duplicate entry detected." });
      }
      res.status(500).json({ 
        message: error.message || "Failed to add check list item" 
      });
    }
};

// GET - Get a specific check list item by ID
export const getQCWashingCheckListItem = async (req, res) => {
  try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid check list ID format." });
      }
  
      const checkListItem = await QCWashingCheckList.findById(id).lean();
  
      if (!checkListItem) {
        return res.status(404).json({ message: "Check list item not found." });
      }
  
      res.json(checkListItem);
    } catch (error) {
      console.error("Error fetching check list item:", error);
      res.status(500).json({ message: "Server error fetching check list item" });
    }
};

// PUT - Update existing check list item
export const updateQCWashingCheckListItem = async (req, res) => {
  try {
      const { id } = req.params;
      const { name, optionType, options, subPoints, failureImpact, updatedBy } = req.body;
  
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required." });
      }
  
      if (!updatedBy || !updatedBy.emp_id || !updatedBy.eng_name) {
        return res.status(400).json({ message: "Updated by information is required." });
      }
  
      // Check if another checkpoint with same name exists (excluding current one)
      const existingByName = await QCWashingCheckList.findOne({ 
        name: name.trim(), 
        _id: { $ne: id } 
      });
      if (existingByName) {
        return res.status(409).json({ 
          message: `Check list name '${name}' already exists.` 
        });
      }
  
      // Process options and subPoints similar to POST endpoint
      const processedOptions = options.map(option => {
        if (!option.name || !String(option.name).trim()) {
          throw new Error("All options must have names");
        }
  
        const processedOption = {
          id: String(option.id || (Date.now() + Math.random())),
          name: String(option.name).trim(),
          isDefault: Boolean(option.isDefault),
          isFail: Boolean(option.isFail),
          hasRemark: Boolean(option.hasRemark)
        };
  
        if (option.hasRemark) {
          if (!option.remark || !option.remark.english || !option.remark.english.trim()) {
            throw new Error(`Option "${option.name}" has remark enabled but English remark is missing`);
          }
          processedOption.remark = {
            english: String(option.remark.english).trim(),
            khmer: option.remark.khmer ? String(option.remark.khmer).trim() : '',
            chinese: option.remark.chinese ? String(option.remark.chinese).trim() : ''
          };
        } else {
          processedOption.remark = null;
        }
  
        return processedOption;
      });
  
      // Process subPoints
      let processedSubPoints = [];
      if (subPoints && Array.isArray(subPoints) && subPoints.length > 0) {
        processedSubPoints = subPoints
          .filter(subPoint => {
            if (!subPoint) return false;
            if (!subPoint.name || !String(subPoint.name).trim()) return false;
            if (!subPoint.options || !Array.isArray(subPoint.options)) return false;
            
            const hasValidOptions = subPoint.options.some(opt => 
              opt && opt.name && String(opt.name).trim().length > 0
            );
            
            return hasValidOptions;
          })
          .map(subPoint => {
            const processedSubPoint = {
              id: String(subPoint.id || (Date.now() + Math.random())),
              name: String(subPoint.name).trim(),
              optionType: subPoint.optionType || 'passfail',
              options: []
            };
  
            if (subPoint.options && Array.isArray(subPoint.options)) {
              processedSubPoint.options = subPoint.options
                .filter(option => option && option.name && String(option.name).trim().length > 0)
                .map(option => {
                  const processedSubOption = {
                    id: String(option.id || (Date.now() + Math.random())),
                    name: String(option.name).trim(),
                    isDefault: Boolean(option.isDefault),
                    isFail: Boolean(option.isFail),
                    hasRemark: Boolean(option.hasRemark)
                  };
  
                  if (option.hasRemark) {
                    if (!option.remark || !option.remark.english || !option.remark.english.trim()) {
                      throw new Error(`Option "${option.name}" in sub point "${subPoint.name}" has remark enabled but English remark is missing`);
                    }
                    processedSubOption.remark = {
                      english: String(option.remark.english).trim(),
                      khmer: option.remark.khmer ? String(option.remark.khmer).trim() : '',
                      chinese: option.remark.chinese ? String(option.remark.chinese).trim() : ''
                    };
                  } else {
                    processedSubOption.remark = null;
                  }
  
                  return processedSubOption;
                });
            }
  
            return processedSubPoint;
          });
      }
  
      const updateData = {
        name: String(name).trim(),
        optionType: optionType || 'passfail',
        options: processedOptions,
        subPoints: processedSubPoints,
        failureImpact: failureImpact || 'customize',
        updatedBy: {
          emp_id: String(updatedBy.emp_id),
          eng_name: String(updatedBy.eng_name)
        }
      };
  
      const updatedCheckList = await QCWashingCheckList.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
  
      if (!updatedCheckList) {
        return res.status(404).json({ message: "Check list item not found" });
      }
  
      res.json({
        message: "Check list item updated successfully",
        checkList: updatedCheckList
      });
  
    } catch (error) {
      console.error("Error updating check list item:", error);
      if (error.code === 11000) {
        return res.status(409).json({ message: "Duplicate entry detected." });
      }
      res.status(500).json({ 
        message: error.message || "Failed to update check list item" 
      });
    }
};

// DELETE - Delete check list item
export const deleteQCWashingCheckListItem = async (req, res) => {
  try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid check list ID format." });
      }
  
      const deletedItem = await QCWashingCheckList.findByIdAndDelete(id);
  
      if (!deletedItem) {
        return res.status(404).json({ message: "Check list item not found." });
      }
  
      res.status(200).json({ 
        message: "Check list item deleted successfully",
        deletedItem: {
          id: deletedItem._id,
          name: deletedItem.name
        }
      });
    } catch (error) {
      console.error("Error deleting check list item:", error);
      res.status(500).json({
        message: "Failed to delete check list item",
        error: error.message
      });
    }
};

// GET - Get checkpoints summary (for dashboard/overview)
export const getQCWashingCheckListSummary = async (req, res) => {
  try {
    const totalCheckpoints = await QCWashingCheckList.countDocuments();
    const checkpointsWithSubPoints = await QCWashingCheckList.countDocuments({
      "subPoints.0": { $exists: true }
    });
    
    const recentCheckpoints = await QCWashingCheckList.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt addedBy')
      .lean();
    res.json({
      totalCheckpoints,
      checkpointsWithSubPoints,
      checkpointsWithoutSubPoints: totalCheckpoints - checkpointsWithSubPoints,
      recentCheckpoints
    });
  } catch (error) {
    console.error("Error fetching checkpoints summary:", error);
    res.status(500).json({ message: "Server error fetching summary" });
  }
};

// GET - Fetch all QC Washing defects
export const getQCWashingDefects = async (req, res) => {
  try {
    const defects = await QCWashingDefects.find({}).sort({ code: 1 }).lean();
    res.json(defects);
  } catch (error) {
    console.error("Error fetching QC Washing defects:", error);
    res.status(500).json({ message: "Server error fetching defects" });
  }
};

// POST - Add a new QC Washing defect
export const addQCWashingDefect = async (req, res) => {
  try {
    const { code, english, khmer, chinese } = req.body;
    if (code === undefined || !english || !khmer) {
      return res.status(400).json({
        message: "Code, Defect Letter, English & Khmer names are required."
      });
    }
    const existingByCode = await QCWashingDefects.findOne({ code });
    if (existingByCode) {
      return res
        .status(409)
        .json({ message: `Defect code '${code}' already exists.` });
    }
    const newDefect = new QCWashingDefects(req.body);
    await newDefect.save();
    res.status(201).json({
      message: "QC Washing defect added successfully",
      defect: newDefect
    });
  } catch (error) {
    console.error("Error adding QC Washing defect:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "Duplicate entry. Defect code or name might exist." });
    res.status(500).json({
      message: "Failed to add QC Washing defect",
      error: error.message
    });
  }
};

export const getQCWashingNextDefectCode = async (req, res) => {
  try {
  const lastDefect = await QCWashingDefects.findOne()
      .sort({ code: -1 })
      .lean();
    let nextCode = 1; // Default to 1 if no defects exist
    if (lastDefect && lastDefect.code) {
      // Increment the last code
      nextCode = parseInt(lastDefect.code, 10) + 1;
    }
    res.json({ success: true, nextCode });
  } catch (error) {
    console.error("Error fetching next defect code:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch next defect code" });
  }
};

// PUT - Update an existing QC Washing defect by ID
export const updateQCWashingDefect = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }
      const updatedDefect = await QCWashingDefects.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );
      if (!updatedDefect) {
        return res.status(404).json({ message: "QC Washing Defect not found." });
      }
      res.status(200).json({
        message: "QC Washing defect updated successfully",
        defect: updatedDefect
      });
    } catch (error) {
      console.error("Error updating QC Washing defect:", error);
      if (error.code === 11000)
        return res
          .status(409)
          .json({ message: "Update failed due to duplicate code or name." });
      res.status(500).json({
        message: "Failed to update QC Washing defect",
        error: error.message
      });
    }
};

// DELETE - Delete a QC Washing defect by ID
export const deleteQCWashingDefect = async (req, res) => {
  try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid defect ID format." });
      }
      const defect = await QCWashingDefects.findById(id);
      if (!defect) {
        return res.status(404).json({ message: "QC Washing Defect not found." });
      }
      if (defect.image) {
        const imagePath = path.join(
          "storage",
          defect.image.replace("/storage/", "")
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      await QCWashingDefects.findByIdAndDelete(id);
      res.status(200).json({
        message: "QC Washing defect and associated image deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting QC Washing defect:", error);
      res.status(500).json({
        message: "Failed to delete QC Washing defect",
        error: error.message
      });
    }
};

// PUT - Replace image for an existing QC Washing defect
export const updateQCWashingDefectImage = async (req, res) => {
  try {
        const { id } = req.params;
        if (!req.file) {
          return res
            .status(400)
            .json({ success: false, message: "No new image file provided." });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid defect ID." });
        }
        const defect = await QCWashingDefects.findById(id);
        if (!defect) {
          return res
            .status(404)
            .json({ success: false, message: "Defect not found." });
        }
        if (defect.image) {
          const oldImagePath = path.join(__backendDir, "public", defect.image);
          if (fs.existsSync(oldImagePath)) {
            await fs.promises.unlink(oldImagePath);
          }
        }
        const uploadPath = path.join(
          __backendDir,
          "backend",
          "public",
          "storage",
          "qc_washing_images"
        );
        const fileExtension = path.extname(req.file.originalname);
        const newFilename = `qc-washing-defect-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExtension}`;
        const fullFilePath = path.join(uploadPath, newFilename);
        await fs.promises.writeFile(fullFilePath, req.file.buffer);
        const newRelativeUrl = `./public/storage/qc_washing_images/${newFilename}`;
        defect.image = newRelativeUrl;
        const updatedDefect = await defect.save();
        res.status(200).json({
          success: true,
          message: "Image replaced successfully.",
          defect: updatedDefect
        });
      } catch (error) {
        console.error("Error replacing QC Washing defect image:", error);
        res.status(500).json({
          success: false,
          message: "Server error while replacing image."
        });
      }
};

// DELETE - Delete image from an existing QC Washing defect
export const deleteQCWashingDefectImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid defect ID." });
    }
    const defect = await QCWashingDefects.findById(id);
    if (!defect) {
      return res
        .status(404)
        .json({ success: false, message: "Defect not found." });
    }
    if (!defect.image) {
      return res
        .status(200)
        .json({ success: true, message: "No image to delete." });
    }
    const imagePath = path.join(__backendDir, "public", defect.image);
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }
    defect.image = "";
    const updatedDefect = await defect.save();
    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      defect: updatedDefect
    });
  } catch (error) {
    console.error("Error deleting QC Washing defect image:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting image." });
  }
};

// GET all first output records
export const getAllFirstOutputRecords = async (req, res) => {
  try {
    const outputs = await QCWashingFirstOutput.find().sort({ date: -1 });
    res.json(outputs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching records", error });
  }
};

// POST a new first output record
export const addFirstOutputRecord = async (req, res) => {
  try {
    const newOutput = new QCWashingFirstOutput(req.body);
    const savedOutput = await newOutput.save();
    res.status(201).json(savedOutput);
  } catch (error) {
    res.status(400).json({ message: "Error creating record", error });
  }
};

// PUT (update) a first output record by ID
export const updateFirstOutputRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOutput = await QCWashingFirstOutput.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOutput) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(updatedOutput);
  } catch (error) {
    res.status(400).json({ message: "Error updating record", error });
  }
};

// DELETE a first output record by ID
export const deleteFirstOutputRecord = async (req, res) => {
   try {
    const { id } = req.params;
    const deletedOutput = await QCWashingFirstOutput.findByIdAndDelete(id);
    if (!deletedOutput) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting record", error });
  }
};

// POST /api/qc-washing/standards - Updated to save standards under factory
export const addQCWashingStandards = async (req, res) => {
  try {
    const { washType, factoryName, washingMachine, tumbleDry } = req.body;
    
    // Validation
    if (!washType) {
      return res.status(400).json({ 
        success: false, 
        message: "washType is required" 
      });
    }
    
    if (!factoryName) {
      return res.status(400).json({ 
        success: false, 
        message: "factoryName is required" 
      });
    }

    // Find or create factory record
    let factoryRecord = await QCWashingMachineStandard.findOne({ factoryName });
    
    if (factoryRecord) {
      // Update existing factory record
      const existingStandardIndex = factoryRecord.standards.findIndex(
        standard => standard.washType === washType
      );
      
      if (existingStandardIndex !== -1) {
        // Update existing wash type standard
        factoryRecord.standards[existingStandardIndex] = {
          washType,
          washingMachine: washingMachine || {},
          tumbleDry: tumbleDry || {},
          updatedAt: new Date()
        };
      } else {
        // Add new wash type standard
        factoryRecord.standards.push({
          washType,
          washingMachine: washingMachine || {},
          tumbleDry: tumbleDry || {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      factoryRecord.updatedAt = new Date();
      await factoryRecord.save();
    } else {
      // Create new factory record with first standard
      factoryRecord = await QCWashingMachineStandard.create({
        factoryName,
        standards: [{
          washType,
          washingMachine: washingMachine || {},
          tumbleDry: tumbleDry || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Return the specific standard that was saved/updated
    const savedStandard = factoryRecord.standards.find(
      standard => standard.washType === washType
    );

    res.json({ 
      success: true, 
      data: {
        ...savedStandard.toObject(),
        factoryName: factoryRecord.factoryName
      },
      message: `${washType} standard saved successfully for ${factoryName} factory`
    });

  } catch (err) {
    console.error("Error saving QC Washing standards:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to save standards"
    });
  }
};

// GET /api/qc-washing/standards - Updated to get standards by factory
export const getQCWashingStandards = async (req, res) => {
  try {
    const { factoryName } = req.query;
    
    console.log('=== CONTROLLER DEBUG ===');
    console.log('Requested factoryName:', factoryName);
    
    if (!factoryName) {
      return res.status(400).json({ 
        success: false, 
        message: "factoryName query parameter is required" 
      });
    }

    // Use case-insensitive regex for factory name matching
    const factoryRecord = await QCWashingMachineStandard.findOne({ 
      factoryName: { $regex: new RegExp(`^${factoryName}$`, 'i') } 
    });
    
    console.log('Found factory record:', factoryRecord);
    
    if (!factoryRecord) {
      console.log('Factory not found, trying YM fallback');
      // If requested factory not found, try YM as fallback
      const fallbackRecord = await QCWashingMachineStandard.findOne({ 
        factoryName: { $regex: new RegExp('^YM$', 'i') } 
      });
      console.log('Fallback record:', fallbackRecord);
      
      if (!fallbackRecord) {
        return res.json({ 
          success: true, 
          data: [],
          message: `No standards found for ${factoryName} factory or YM fallback`
        });
      }
      
      // Return YM standards as fallback
      const transformedStandards = fallbackRecord.standards.map(standard => ({
        washType: standard.washType,
        washingMachine: standard.washingMachine,
        tumbleDry: standard.tumbleDry,
        factoryName: "YM",
        createdAt: standard.createdAt,
        updatedAt: standard.updatedAt
      }));

      console.log('Returning fallback standards:', transformedStandards);

      return res.json({ 
        success: true, 
        data: transformedStandards,
        factoryInfo: {
          factoryName: "YM",
          totalStandards: fallbackRecord.standards.length,
          lastUpdated: fallbackRecord.updatedAt,
          isFallback: true,
          requestedFactory: factoryName
        },
        message: `Using YM standards as fallback for ${factoryName}`
      });
    }

    // Transform standards to match expected format
    const transformedStandards = factoryRecord.standards.map(standard => {
      console.log('Processing standard:', standard);
      return {
        washType: standard.washType,
        washingMachine: standard.washingMachine,
        tumbleDry: standard.tumbleDry,
        factoryName: factoryRecord.factoryName,
        createdAt: standard.createdAt,
        updatedAt: standard.updatedAt
      };
    });

    console.log('Returning transformed standards:', transformedStandards);

    res.json({ 
      success: true, 
      data: transformedStandards,
      factoryInfo: {
        factoryName: factoryRecord.factoryName,
        totalStandards: factoryRecord.standards.length,
        lastUpdated: factoryRecord.updatedAt,
        isFallback: false
      }
    });

  } catch (err) {
    console.error("Error fetching QC Washing standards:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to fetch standards"
    });
  }
};

// GET /api/qc-washing/standards/all-factories - Get all factories with their standards
export const getAllFactoryStandards = async (req, res) => {
  try {
    const allFactoryRecords = await QCWashingMachineStandard.find({})
          .sort({ factoryName: 1 });

    const factorySummary = allFactoryRecords.map(factory => ({
      factoryName: factory.factoryName,
      totalStandards: factory.standards.length,
      washTypes: factory.standards.map(s => s.washType),
      createdAt: factory.createdAt,
      updatedAt: factory.updatedAt
    }));

    res.json({ 
      success: true, 
      data: factorySummary,
      totalFactories: allFactoryRecords.length
    });

  } catch (err) {
    console.error("Error fetching all factory standards:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to fetch factory standards"
    });
  }
};

// GET /api/qc-washing/standards/factory/:factoryName - Get specific factory's all standards
export const getFactoryStandards = async (req, res) => {
  try {
    const { factoryName } = req.params;
    
    const factoryRecord = await QCWashingMachineStandard.findOne({ factoryName });
    
    if (!factoryRecord) {
      return res.status(404).json({ 
        success: false, 
        message: `Factory '${factoryName}' not found`
      });
    }

    res.json({ 
      success: true, 
      data: {
        factoryName: factoryRecord.factoryName,
        standards: factoryRecord.standards,
        totalStandards: factoryRecord.standards.length,
        createdAt: factoryRecord.createdAt,
        updatedAt: factoryRecord.updatedAt
      }
    });

  } catch (err) {
    console.error("Error fetching factory standards:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to fetch factory standards"
    });
  }
};

// DELETE /api/qc-washing/standards/factory/:factoryName/washtype/:washType - Delete specific wash type standard
export const deleteFactoryWashTypeStandard = async (req, res) => {
  try {
    const { factoryName, washType } = req.params;
    
    const factoryRecord = await QCWashingMachineStandard.findOne({ factoryName });
    
    if (!factoryRecord) {
      return res.status(404).json({ 
        success: false, 
        message: `Factory '${factoryName}' not found`
      });
    }

    // Find and remove the specific wash type standard
    const standardIndex = factoryRecord.standards.findIndex(
      standard => standard.washType === washType
    );

    if (standardIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: `Wash type '${washType}' not found for factory '${factoryName}'`
      });
    }

    // Remove the standard
    factoryRecord.standards.splice(standardIndex, 1);
    factoryRecord.updatedAt = new Date();

    // If no standards left, delete the entire factory record
    if (factoryRecord.standards.length === 0) {
      await QCWashingMachineStandard.findByIdAndDelete(factoryRecord._id);
      return res.json({ 
        success: true, 
        message: `Factory '${factoryName}' and all its standards deleted successfully`
      });
    }

    await factoryRecord.save();

    res.json({ 
      success: true, 
      message: `${washType} standard deleted successfully from ${factoryName} factory`,
      remainingStandards: factoryRecord.standards.length
    });

  } catch (err) {
    console.error("Error deleting wash type standard:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to delete wash type standard"
    });
  }
};

// DELETE /api/qc-washing/standards/factory/:factoryName - Delete entire factory and all its standards
export const deleteFactoryStandards = async (req, res) => {
  try {
    const { factoryName } = req.params;
    
    const deletedFactory = await QCWashingMachineStandard.findOneAndDelete({ factoryName });
    
    if (!deletedFactory) {
      return res.status(404).json({ 
        success: false, 
        message: `Factory '${factoryName}' not found`
      });
    }

    res.json({ 
      success: true, 
      message: `Factory '${factoryName}' and all its standards (${deletedFactory.standards.length} standards) deleted successfully`
    });

  } catch (err) {
    console.error("Error deleting factory standards:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to delete factory standards"
    });
  }
};

// PUT /api/qc-washing/standards/factory/:factoryName/washtype/:washType - Update specific wash type standard
export const updateFactoryWashTypeStandard = async (req, res) => {
  try {
    const { factoryName, washType } = req.params;
    const { washingMachine, tumbleDry } = req.body;
    
    const factoryRecord = await QCWashingMachineStandard.findOne({ factoryName });
    
    if (!factoryRecord) {
      return res.status(404).json({ 
        success: false, 
        message: `Factory '${factoryName}' not found`
      });
    }

    // Find the specific wash type standard
    const standardIndex = factoryRecord.standards.findIndex(
      standard => standard.washType === washType
    );

    if (standardIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: `Wash type '${washType}' not found for factory '${factoryName}'`
      });
    }

    // Update the standard
    factoryRecord.standards[standardIndex] = {
      ...factoryRecord.standards[standardIndex].toObject(),
      washingMachine: washingMachine || factoryRecord.standards[standardIndex].washingMachine,
      tumbleDry: tumbleDry || factoryRecord.standards[standardIndex].tumbleDry,
      updatedAt: new Date()
    };

    factoryRecord.updatedAt = new Date();
    await factoryRecord.save();

    const updatedStandard = factoryRecord.standards[standardIndex];

    res.json({ 
      success: true, 
      data: {
        ...updatedStandard.toObject(),
        factoryName: factoryRecord.factoryName
      },
      message: `${washType} standard updated successfully for ${factoryName} factory`
    });

  } catch (err) {
    console.error("Error updating wash type standard:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to update wash type standard"
    });
  }
};

// GET /api/qc-washing/standards/summary - Get summary of all standards across all factories
export const getStandardsSummary = async (req, res) => {
  try {
    const allFactories = await QCWashingMachineStandard.find({});
    
    let totalStandards = 0;
    const washTypeCounts = {};
    const factoryDetails = [];

    allFactories.forEach(factory => {
      totalStandards += factory.standards.length;
      
      factoryDetails.push({
        factoryName: factory.factoryName,
        standardsCount: factory.standards.length,
        washTypes: factory.standards.map(s => s.washType),
        lastUpdated: factory.updatedAt
      });

      factory.standards.forEach(standard => {
        washTypeCounts[standard.washType] = (washTypeCounts[standard.washType] || 0) + 1;
      });
    });

    res.json({
      success: true,
      summary: {
        totalFactories: allFactories.length,
        totalStandards,
        washTypeCounts,
        factoryDetails
      }
    });

  } catch (err) {
    console.error("Error fetching standards summary:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to fetch standards summary"
    });
  }
};

