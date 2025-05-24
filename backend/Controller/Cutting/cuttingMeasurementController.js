import bcrypt from "bcrypt";
import {
  CuttingMeasurementPoint,                
} from "../../Config/mongodb.js"; 

/* ------------------------------
   Cutting Measurement Points
------------------------------ */

export const getCutMeasurmentPanel = async (req, res) => {
    try {
        /* CHANGE: Fetch panel, panelKhmer, and panelChinese for multilingual support */
        const panels = await CuttingMeasurementPoint.aggregate([
          {
            $group: {
              _id: "$panel",
              panelKhmer: { $first: "$panelKhmer" },
              panelChinese: { $first: "$panelChinese" }
            }
          },
          {
            $project: {
              panel: "$_id",
              panelKhmer: 1,
              panelChinese: 1,
              _id: 0
            }
          },
          { $sort: { panel: 1 } }
        ]).exec();
        res.status(200).json(panels);
      } catch (error) {
        console.error("Error fetching panels:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch panels", error: error.message });
      }
};

// Endpoint to fetch panelIndexNames and related data for a given panel
export const getPanelIndexNames = async (req, res) => {
    try {
        const { panel } = req.query;
        if (!panel) {
          return res.status(400).json({ message: "Panel is required" });
        }
        // Aggregate to get unique panelIndexName with their latest panelIndex and panelIndexNameKhmer
        const panelIndexData = await CuttingMeasurementPoint.aggregate([
          { $match: { panel } },
          {
            $group: {
              _id: "$panelIndexName",
              panelIndex: { $max: "$panelIndex" },
              panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
              panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
            }
          },
          {
            $project: {
              panelIndexName: "$_id",
              panelIndex: 1,
              panelIndexNameKhmer: 1,
              panelIndexNameChinese: 1,
              _id: 0
            }
          },
          { $sort: { panelIndexName: 1 } }
        ]).exec();
        res.status(200).json(panelIndexData);
      } catch (error) {
        console.error("Error fetching panel index names:", error);
        res.status(500).json({
          message: "Failed to fetch panel index names",
          error: error.message
        });
      }
};

// Endpoint to fetch max panelIndex for a given panel
export const getMaxPanelIndex = async (req, res) => {
    try {
    const { panel } = req.query;
    if (!panel) {
      return res.status(400).json({ message: "Panel is required" });
    }
    const maxPanelIndexDoc = await CuttingMeasurementPoint.findOne({
      panel
    })
      .sort({ panelIndex: -1 })
      .select("panelIndex");
    const maxPanelIndex = maxPanelIndexDoc ? maxPanelIndexDoc.panelIndex : 0;
    res.status(200).json({ maxPanelIndex });
  } catch (error) {
    console.error("Error fetching max panel index:", error);
    res.status(500).json({
      message: "Failed to fetch max panel index",
      error: error.message
    });
  }
};

// Endpoint to save a new measurement point
export const saveMeasurementPoint = async (req, res) => {
    try {
    const measurementPoint = req.body;
    // Find the maximum 'no' in the collection
    const maxNo = await CuttingMeasurementPoint.findOne()
      .sort({ no: -1 })
      .select("no");
    const newNo = maxNo ? maxNo.no + 1 : 1;
    // Create new document
    const newDoc = new CuttingMeasurementPoint({
      ...measurementPoint,
      no: newNo
    });
    await newDoc.save();
    res.status(200).json({ message: "Measurement point saved successfully" });
  } catch (error) {
    console.error("Error saving measurement point:", error);
    res.status(500).json({
      message: "Failed to save measurement point",
      error: error.message
    });
  }
};

/* ------------------------------
   Cutting Measurement Points Edit ENDPOINTS
------------------------------ */

// Endpoint to Search MO Numbers (moNo) from CuttingMeasurementPoint with partial matching
export const searchMoNumbers = async (req, res) => {
    try {
        const searchTerm = req.query.search;
        if (!searchTerm) {
          return res.status(400).json({ error: "Search term is required" });
        }
    
        const regexPattern = new RegExp(searchTerm, "i");
    
        const results = await CuttingMeasurementPoint.find({
          moNo: { $regex: regexPattern }
        })
          .select("moNo")
          .limit(100)
          .sort({ moNo: 1 })
          .exec();
    
        const uniqueMONos = [...new Set(results.map((r) => r.moNo))];
    
        res.json(uniqueMONos);
      } catch (err) {
        console.error(
          "Error fetching MO numbers from CuttingMeasurementPoint:",
          err
        );
        res.status(500).json({
          message: "Failed to fetch MO numbers from CuttingMeasurementPoint",
          error: err.message
        });
      }
};

// Endpoint to fetch measurement points for a given moNo and panel
export const getMeasurementPoints = async (req, res) => {
    try {
    const { moNo, panel } = req.query;
    if (!moNo || !panel) {
      return res.status(400).json({ error: "moNo and panel are required" });
    }

    const points = await CuttingMeasurementPoint.find({
      moNo,
      panel
    }).exec();

    res.json(points);
  } catch (error) {
    console.error("Error fetching measurement points:", error);
    res.status(500).json({
      message: "Failed to fetch measurement points",
      error: error.message
    });
  }
};

// Endpoint to fetch unique panelIndexName and panelIndexNameKhmer for a given moNo and panel, including Common
export const getUniquePanelIndexNames = async (req, res) => {
    try {
          const { moNo, panel } = req.query;
          if (!moNo || !panel) {
            return res.status(400).json({ message: "moNo and panel are required" });
          }
    
          // Check if the moNo exists in CuttingMeasurementPoint
          const moExists = await CuttingMeasurementPoint.exists({ moNo });
    
          let panelIndexData = [];
    
          if (moExists) {
            // Fetch unique panelIndexName for the specific moNo and panel
            const specificMoData = await CuttingMeasurementPoint.aggregate([
              { $match: { moNo, panel } },
              {
                $group: {
                  _id: "$panelIndexName",
                  panelIndex: { $max: "$panelIndex" },
                  panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
                  panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
                }
              },
              {
                $project: {
                  panelIndexName: "$_id",
                  panelIndex: 1,
                  panelIndexNameKhmer: 1,
                  panelIndexNameChinese: 1,
                  _id: 0
                }
              }
            ]).exec();
    
            // Fetch unique panelIndexName for moNo = 'Common' and panel
            const commonData = await CuttingMeasurementPoint.aggregate([
              { $match: { moNo: "Common", panel } },
              {
                $group: {
                  _id: "$panelIndexName",
                  panelIndex: { $max: "$panelIndex" },
                  panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
                  panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
                }
              },
              {
                $project: {
                  panelIndexName: "$_id",
                  panelIndex: 1,
                  panelIndexNameKhmer: 1,
                  panelIndexNameChinese: 1,
                  _id: 0
                }
              }
            ]).exec();
    
            // Combine data, ensuring no duplicates
            const combinedData = [...commonData];
            specificMoData.forEach((specific) => {
              if (
                !combinedData.some(
                  (item) => item.panelIndexName === specific.panelIndexName
                )
              ) {
                combinedData.push(specific);
              }
            });
    
            panelIndexData = combinedData;
          } else {
            // If moNo doesn't exist, fetch only for moNo = 'Common' and panel
            panelIndexData = await CuttingMeasurementPoint.aggregate([
              { $match: { moNo: "Common", panel } },
              {
                $group: {
                  _id: "$panelIndexName",
                  panelIndex: { $max: "$panelIndex" },
                  panelIndexNameKhmer: { $last: "$panelIndexNameKhmer" },
                  panelIndexNameChinese: { $last: "$panelIndexNameChinese" }
                }
              },
              {
                $project: {
                  panelIndexName: "$_id",
                  panelIndex: 1,
                  panelIndexNameKhmer: 1,
                  panelIndexNameChinese: 1,
                  _id: 0
                }
              }
            ]).exec();
          }
    
          // Sort by panelIndexName
          panelIndexData.sort((a, b) =>
            a.panelIndexName.localeCompare(b.panelIndexName)
          );
    
          res.status(200).json(panelIndexData);
        } catch (error) {
          console.error("Error fetching panel index names by MO:", error);
          res.status(500).json({
            message: "Failed to fetch panel index names",
            error: error.message
          });
        }
};

// Endpoint to update a measurement point by _id
export const updateMeasurementPoint = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
    
        const updatedPoint = await CuttingMeasurementPoint.findByIdAndUpdate(
          id,
          { $set: { ...updateData, updated_at: new Date() } },
          { new: true }
        );
    
        if (!updatedPoint) {
          return res.status(404).json({ error: "Measurement point not found" });
        }
    
        res.status(200).json({ message: "Measurement point updated successfully" });
      } catch (error) {
        console.error("Error updating measurement point:", error);
        res.status(500).json({
          message: "Failed to update measurement point",
          error: error.message
        });
      }
};