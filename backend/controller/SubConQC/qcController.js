import {
SubconSewingFactory,  
SubConDefect,          
} from "../MongoDB/dbConnectionController.js";

// ENDPOINT FOR FACTORIES ---
export const getSubConSewingFactory = async (req, res) => {
  try {
    const factories = await SubconSewingFactory.find({}).sort({ factory: 1 });
    res.json(factories);
  } catch (error) {
    console.error("Error fetching sub-con factories:", error);
    res.status(500).json({ error: "Failed to fetch sub-con factories" });
  }
};

export const getSubCondefect = async (req, res) => {
  try {
      // Fetch all defects and sort by DisplayCode
      const defects = await SubConDefect.find({}).sort({ DisplayCode: 1 });
      res.json(defects);
    } catch (error) {
      console.error("Error fetching sub-con defects:", error);
      res.status(500).json({ error: "Failed to fetch sub-con defects" });
    }
};
