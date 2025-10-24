import { 
  SewingDefects,
  UserMain,
 } from "../MongoDB/dbConnectionController.js";
import { escapeRegex } from "../../Helpers/helperFunctions.js";

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