import { 
  SewingDefects,
  UserMain,
 } from "../../MongoDB/dbConnectionController.js";
import { escapeRegex } from "../../../helpers/helperFunctions.js";

export const getSewingDefects = async (req, res) => {
    try {
        const { categoryEnglish, type, isCommon } = req.query;
    
        const filter = {};
        if (categoryEnglish) filter.categoryEnglish = categoryEnglish;
        if (type) filter.type = type;
        if (isCommon) filter.isCommon = isCommon;
    
        const defects = await SewingDefects.find(filter);
    
        res.json(defects);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

export const getDefectDefinition = async (req, res) => {
   try {
      const defects = await SewingDefects.find({}).sort({ code: 1 });
      res.json(defects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch defect definitions' });
    }
};

// Endpoint to search users by emp_id or name (partial match)
export const searchUsers = async (req, res) => {
  try {
      const searchTerm = req.query.term;
  
      if (!searchTerm || searchTerm.trim() === "") {
        return res
          .status(400)
          .json({ error: "Search term is required and cannot be empty." });
      }
  
      const trimmedSearchTerm = searchTerm.trim();
      const escapedSearchTerm = escapeRegex(trimmedSearchTerm);
  
      const query = {
        $or: [
          { emp_id: trimmedSearchTerm }, // Try exact match first
          { emp_id: { $regex: escapedSearchTerm, $options: "i" } },
          { eng_name: { $regex: escapedSearchTerm, $options: "i" } }
        ]
      };
  
      const users = await UserMain.find(
        query,
        "emp_id eng_name face_photo" 
      )
        .limit(10) // Limit results
        .lean();
  
      res.json(users); 
    } catch (error) {
      console.error(
        "[API /api/users/search-by-empid] Error searching users:",
        error
      );
      res.status(500).json({ error: "Failed to search users" });
    }
};

export const getSewingDefectOptiond = async (req, res) => {
  try {
      const [repairs, types, lastDefect, categoryGroups] = await Promise.all([
        SewingDefects.distinct("repair"),
        SewingDefects.distinct("type"),
        SewingDefects.findOne().sort({ code: -1 }),
        SewingDefects.aggregate([
          {
            $group: {
              _id: {
                english: "$categoryEnglish",
                khmer: "$categoryKhmer",
                chinese: "$categoryChinese"
              }
            }
          },
          {
            $project: {
              _id: 0,
              english: "$_id.english",
              khmer: "$_id.khmer",
              chinese: "$_id.chinese"
            }
          },
          { $match: { english: { $ne: null, $ne: "" } } },
          { $sort: { english: 1 } }
        ])
      ]);
  
      const nextCode = lastDefect ? lastDefect.code + 1 : 1001;
  
      res.json({
        repairs: repairs.filter(Boolean),
        types: types.filter(Boolean),
        categories: categoryGroups,
        nextCode
      });
    } catch (error) {
      console.error("Error fetching defect options:", error);
      res.status(500).json({ message: "Server error fetching options" });
    }
};

export  const addSevingDefect = async (req, res) => {
  try {
    const {
      shortEng,
      english,
      khmer,
      chinese,
      repair,
      categoryEnglish,
      categoryKhmer,
      categoryChinese,
      type,
      isCommon
    } = req.body;

    if (
      !shortEng ||
      !english ||
      !khmer ||
      !categoryEnglish ||
      !repair ||
      !type
    ) {
      return res.status(400).json({
        message:
          "Required fields are missing. Please fill out all fields marked with *."
      });
    }

    const existingDefect = await SewingDefects.findOne({
      $or: [{ shortEng }, { english }]
    });
    if (existingDefect) {
      return res.status(409).json({
        message: `Defect with name '${
          existingDefect.shortEng === shortEng ? shortEng : english
        }' already exists.`
      });
    }

    const lastDefect = await SewingDefects.findOne().sort({ code: -1 });
    const newCode = lastDefect ? lastDefect.code + 1 : 1001;

    // *** FIX IS HERE ***
    // Instead of querying a 'Buyer' model, we use the hardcoded list from your /api/buyers endpoint.
    const allBuyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];

    // Now, we map this array of strings to the required object structure.
    const statusByBuyer = allBuyers.map((buyerName) => ({
      buyerName: buyerName, // The buyer's name from the array
      defectStatus: ["Major"],
      isCommon: "Major"
    }));

    const newSewingDefect = new SewingDefects({
      code: newCode,
      shortEng,
      english,
      khmer,
      chinese: chinese || "",
      image: "",
      repair,
      categoryEnglish,
      categoryKhmer,
      categoryChinese,
      type,
      isCommon,
      statusByBuyer,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newSewingDefect.save();
    res.status(201).json({
      message: "Sewing defect added successfully",
      defect: newSewingDefect
    });
  } catch (error) {
    console.error("Error adding sewing defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry. Defect code or name might already exist."
      });
    }
    res
      .status(500)
      .json({ message: "Failed to add sewing defect", error: error.message });
  }
};

export const deleteSewingDefect = async (req, res) => {
  try {
      const { code } = req.params;
      const defectCode = parseInt(code, 10);
      if (isNaN(defectCode)) {
        return res.status(400).json({ message: "Invalid defect code format." });
      }
      const deletedDefect = await SewingDefects.findOneAndDelete({
        code: defectCode
      });
      if (!deletedDefect) {
        return res.status(404).json({ message: "Sewing Defect not found." });
      }
      res.status(200).json({ message: "Sewing defect deleted successfully" });
    } catch (error) {
      console.error("Error deleting sewing defect:", error);
      res.status(500).json({
        message: "Failed to delete sewing defect",
        error: error.message
      });
    }
};
