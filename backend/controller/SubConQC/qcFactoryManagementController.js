import { 
SubconSewingFactory,
SubConDefect,           
} from "../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";
import { generateSubconReportID,
  getBuyerFromMoNumber,
 } from "../../Helpers/helperFunctions.js";

 // GET all factories (can also be used for filtering by name)
 export const getSubConSewingFactory = async (req, res) => {
  try {
      let query = {};
      if (req.query.factory) {
        // Using regex for partial matching, case-insensitive
        query.factory = { $regex: req.query.factory, $options: "i" };
      }
      const factories = await SubconSewingFactory.find(query).sort({ no: 1 });
      res.json(factories);
    } catch (error) {
      console.error("Error fetching sub-con factories:", error);
      res.status(500).json({ error: "Failed to fetch factories" });
    }
 };

 // POST a new factory
 export const saveSubConSewingFactory = async (req, res) => {
  try {
    // Auto-increment 'no' field
    const lastFactory = await SubconSewingFactory.findOne().sort({ no: -1 });
    const newNo = lastFactory ? lastFactory.no + 1 : 1;

    const newFactory = new SubconSewingFactory({
      ...req.body,
      no: newNo
    });
    await newFactory.save();
    res.status(201).json(newFactory);
  } catch (error) {
    // Handle potential duplicate factory name error
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "A factory with this name already exists." });
    }
    // General error handling
    console.error("Error creating sub-con factory:", error);
    res.status(500).json({ error: "Failed to create factory" });
  } 
 };

 // PUT (update) an existing factory by its ID
 export const updateSubConSewingFactory = async (req, res) => {
  try {
      const { id } = req.params;
      const updatedFactory = await SubconSewingFactory.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedFactory) {
        return res.status(404).json({ error: "Factory not found." });
      }
      res.json(updatedFactory);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "A factory with this name already exists." });
      }
      console.error("Error updating sub-con factory:", error);
      res.status(500).json({ error: "Failed to update factory" });
    }
 };

 // DELETE an existing factory by its ID
 export const deleteSubConSewingFactory = async (req, res) => {
  try {
      const { id } = req.params;
      const deletedFactory = await SubconSewingFactory.findByIdAndDelete(id);
  
      if (!deletedFactory) {
        return res.status(404).json({ error: "Factory not found." });
      }
  
      res.json({ message: "Factory deleted successfully." });
    } catch (error) {
      console.error("Error deleting sub-con factory:", error);
      res.status(500).json({ error: "Failed to delete factory" });
    }
 };
