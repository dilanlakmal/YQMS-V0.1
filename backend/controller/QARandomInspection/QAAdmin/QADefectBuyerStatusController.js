import {
  QADefectsModel,
} from "../../MongoDB/dbConnectionController.js";

// GET - Endpoint for all QA defect details for the management page
export const getQADefectDetails = async (req, res) => {
    try {
    const defects = await QADefectsModel.find({}).sort({ code: 1 }).lean();
    const transformedDefects = defects.map((defect) => ({
      code: defect.code.toString(),
      defectLetter: defect.defectLetter, // Include the new field
      name_en: defect.english,
      name_kh: defect.khmer,
      name_ch: defect.chinese,
      // The other fields like category, repair, type are not in this model
      statusByBuyer: defect.statusByBuyer || []
    }));
    res.json(transformedDefects);
  } catch (error) {
    console.error("Error fetching all QA defect details:", error);
    res.status(500).json({
      message: "Failed to fetch QA defect details",
      error: error.message
    });
  }
};

// POST - Endpoint for updating QA defect buyer statuses (Robust Version)
export const updateQADefectBuyerStatuses = async (req, res) => {
  try {
    const statusesPayload = req.body;
    if (!Array.isArray(statusesPayload)) {
      return res
        .status(400)
        .json({ message: "Invalid payload: Expected an array of statuses." });
    }

    // Group the payload by defectCode
    const updatesByDefect = statusesPayload.reduce((acc, status) => {
      const defectCode = status.defectCode;
      if (!acc[defectCode]) {
        acc[defectCode] = [];
      }
      // Push the full buyer status object
      acc[defectCode].push({
        buyerName: status.buyerName,
        defectStatus: status.defectStatus || [],
        isCommon: status.isCommon || "Major"
      });
      return acc;
    }, {});

    // Create a bulk operation to update each defect's entire statusByBuyer array
    const bulkOps = Object.keys(updatesByDefect).map((defectCodeStr) => {
      const defectCodeNum = parseInt(defectCodeStr, 10);
      return {
        updateOne: {
          filter: { code: defectCodeNum },
          // Overwrite the entire array. This is simpler and more robust.
          update: {
            $set: {
              statusByBuyer: updatesByDefect[defectCodeStr]
            }
          }
        }
      };
    });

    if (bulkOps.length > 0) {
      await QADefectsModel.bulkWrite(bulkOps);
    }

    res.status(200).json({
      message: "QA Defect buyer statuses updated successfully."
    });
  } catch (error) {
    console.error("Error updating QA defect buyer statuses:", error);
    res.status(500).json({
      message: "Failed to update QA defect buyer statuses",
      error: error.message
    });
  }
};

