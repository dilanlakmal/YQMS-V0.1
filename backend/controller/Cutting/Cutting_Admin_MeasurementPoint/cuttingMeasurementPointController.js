import {
  CuttingMeasurementPoint,
} from "../../MongoDB/dbConnectionController.js";

/* ------------------------------
   Cutting Measurement Points
------------------------------ */

export const getCutMeasurmentPanel = async (req, res) => {
    try {
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
        const maxNoDoc = await CuttingMeasurementPoint.findOne()
          .sort({ no: -1 })
          .select("no")
          .lean();
        const newNo = maxNoDoc ? maxNoDoc.no + 1 : 1;

        const newDoc = new CuttingMeasurementPoint({
          ...measurementPoint,
          no: newNo
        });
        await newDoc.save();
        res
          .status(200)
          .json({ message: "Measurement point saved successfully", point: newDoc });
      } catch (error) {
        console.error("Error saving measurement point:", error);
        if (error.code === 11000) {
          return res.status(409).json({
            message:
              "Failed to save: Duplicate entry for a unique field (e.g., MO + Panel + Point Name + Index).",
            error: error.message
          });
        }
        res.status(500).json({
          message: "Failed to save measurement point",
          error: error.message
        });
      }
};
