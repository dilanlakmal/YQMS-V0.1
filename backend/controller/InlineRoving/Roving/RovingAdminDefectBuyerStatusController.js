import {
    SewingDefects,
} from "../../MongoDB/dbConnectionController.js";

/* ------------------------------
   End Points - SewingDefects
------------------------------ */



// DELETE a defect by code
// export const deleteSewingDefect = async (req, res) => {
//     try {
//         const { defectCode } = req.params;
//         const result = await SewingDefects.findOneAndDelete({ code: defectCode });

//         if (!result) {
//           return res.status(404).json({ message: "Defect not found" });
//         }

//         res.status(200).json({ message: "Defect deleted successfully" });
//       } catch (error) {
//         console.error("Error deleting defect:", error);
//         res.status(500).json({ message: "Failed to delete defect", error: error.message });
//       }
// };

/* ------------------------------
   Defect Buyer Status ENDPOINTS
------------------------------ */

// Endpoint for /api/defects/all-details
export const getAllDefectDetails = async (req, res) => {
    try {
    const defects = await SewingDefects.find({}).lean();
    const transformedDefects = defects.map(defect => ({
      code: defect.code.toString(),
      name_en: defect.english,
      name_kh: defect.khmer,
      name_ch: defect.chinese,
      categoryEnglish: defect.categoryEnglish,
      type: defect.type,
      repair: defect.repair,
      statusByBuyer: defect.statusByBuyer || [],
    }));
    res.json(transformedDefects);
  } catch (error) {
    console.error("Error fetching all defect details:", error);
    res.status(500).json({ message: "Failed to fetch defect details", error: error.message });
  }
};

// Endpoint for /api/buyers
export const getAllBuyers = async (req, res) => {
   const buyers = ["Costco", "Aritzia", "Reitmans", "ANF", "MWW"];
  res.json(buyers);
};


// New Endpoint for updating buyer statuses in SewingDefects
export const updateBuyerStatuses = async (req, res) => {
    try {
    const statusesPayload = req.body;
    if (!Array.isArray(statusesPayload)) {
      return res
        .status(400)
        .json({ message: "Invalid payload: Expected an array of statuses." });
    }
    const updatesByDefect = statusesPayload.reduce((acc, status) => {
      const defectCode = status.defectCode;
      if (!acc[defectCode]) {
        acc[defectCode] = [];
      }
      acc[defectCode].push({
        buyerName: status.buyerName,
        defectStatus: Array.isArray(status.defectStatus)
          ? status.defectStatus
          : [],
        isCommon: ["Critical", "Major", "Minor"].includes(status.isCommon)
          ? status.isCommon
          : "Minor"
      });
      return acc;
    }, {});

    const bulkOps = [];
    for (const defectCodeStr in updatesByDefect) {
      const defectCodeNum = parseInt(defectCodeStr, 10);
      if (isNaN(defectCodeNum)) {
        console.warn(
          `Invalid defectCode received: ${defectCodeStr}, skipping.`
        );
        continue;
      }
      const newStatusByBuyerArray = updatesByDefect[defectCodeStr];
      bulkOps.push({
        updateOne: {
          filter: { code: defectCodeNum },
          update: {
            $set: {
              statusByBuyer: newStatusByBuyerArray,
              updatedAt: new Date()
            }
          }
        }
      });
    }
    if (bulkOps.length > 0) {
      await SewingDefects.bulkWrite(bulkOps);
    }
    res.status(200).json({
      message: "Defect buyer statuses updated successfully in SewingDefects."
    });
  } catch (error) {
    console.error("Error updating defect buyer statuses:", error);
    res.status(500).json({
      message: "Failed to update defect buyer statuses",
      error: error.message
    });
  }
};