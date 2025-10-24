import {
  CuttingIssue,                
} from "../MongoDB/dbConnectionController.js"; 

/* ------------------------------
  Cutting Issues ENDPOINTS
------------------------------ */

// Add this endpoint after other endpoints
export const getCuttingIssues = async (req, res) => {
    try {
    const issues = await CuttingIssue.find().sort({ no: 1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching cutting issues:", error);
    res.status(500).json({
      message: "Failed to fetch cutting issues",
      error: error.message
    });
  }
};