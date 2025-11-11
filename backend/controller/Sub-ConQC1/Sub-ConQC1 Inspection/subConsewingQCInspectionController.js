import {
SubconSewingFactory,  
SubConDefect, 
SubconSewingQc1Report,         
} from "../../MongoDB/dbConnectionController.js";

import { generateSubconReportID,
  getBuyerFromMoNumber,
 } from "../../../helpers/helperFunctions.js";

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

// ENDPOINT: Find a specific report to check for existence/edit
export const getSubConSewingQC1Rport = async (req, res) => {
  try {
    const { inspectionDate, factory, lineNo, moNo, color } = req.query;

    if (!inspectionDate || !factory || !lineNo || !moNo || !color) {
      return res
        .status(400)
        .json({ error: "Missing required search parameters." });
    }

    const startOfDay = new Date(inspectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(inspectionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const report = await SubconSewingQc1Report.findOne({
      factory,
      lineNo,
      moNo,
      color,
      inspectionDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    res.json(report);
  } catch (error) {
    console.error("Error finding Sub-Con QC report:", error);
    res.status(500).json({ error: "Failed to find report" });
  }
};


// ADD NEW POST ENDPOINT FOR SAVING REPORTS ---
export const addSubConSewingQC1Report = async (req, res) => {
  try {
      const reportData = req.body;
  
      const startOfDay = new Date(reportData.inspectionDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
  
      // Generate a unique report ID
      const reportID = await generateSubconReportID();
  
      const buyer = getBuyerFromMoNumber(reportData.moNo);
  
      const newReport = new SubconSewingQc1Report({
        ...reportData,
        inspectionDate: startOfDay,
        reportID: reportID,
        buyer: buyer
      });
  
      await newReport.save();
  
      res.status(201).json({
        message: "Report saved successfully!",
        reportID: reportID
      });
    } catch (error) {
      console.error("Error saving Sub-Con QC report:", error);
      // Provide more detailed error message if validation fails
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.message });
      }
      res.status(500).json({ error: "Failed to save report" });
    }
};

// ENDPOINT: Update an existing report by its ID
export const updateSubConSewingQC1Report = async (req, res) => {
  try {
      const { id } = req.params;
      const reportData = req.body;
  
      const startOfDay = new Date(reportData.inspectionDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
  
      // We also re-calculate the buyer in case the MO number was somehow changed.
      const buyer = getBuyerFromMoNumber(reportData.moNo);
  
      const updatedReport = await SubconSewingQc1Report.findByIdAndUpdate(
        id,
        { ...reportData, inspectionDate: startOfDay, buyer: buyer },
        { new: true, runValidators: true } // {new: true} returns the updated document
      );
  
      if (!updatedReport) {
        return res.status(404).json({ error: "Report not found." });
      }
  
      res.json({
        message: "Report updated successfully!",
        report: updatedReport
      });
    } catch (error) {
      console.error("Error updating Sub-Con QC report:", error);
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.message });
      }
      res.status(500).json({ error: "Failed to update report" });
    }
};

