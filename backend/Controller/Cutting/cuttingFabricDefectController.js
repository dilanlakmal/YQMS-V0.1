import bcrypt from "bcrypt";
import {
  CuttingFabricDefect,                
} from "../../Config/mongodb.js"; 


/* ------------------------------
  Cutting Fabric Defects ENDPOINTS
------------------------------ */
export const getCuttingFabricDefects = async (req, res) => {
    try {
        const defects = await CuttingFabricDefect.find({});
        res.status(200).json(defects);
      } catch (error) {
        console.error("Error fetching cutting fabric defects:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch defects", error: error.message });
      }
};