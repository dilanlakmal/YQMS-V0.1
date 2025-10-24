import {
    AQLChart,                
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   AQL ENDPOINTS
------------------------------ */

export const getAQLMapings = async (req, res) => {
  try {
      const aqlCharts = await AQLChart.find({}).lean();
      const mappings = {};
  
      // Group by lot size
      aqlCharts.forEach((entry) => {
        const lotSizeKey = `${entry.LotSize.min}-${entry.LotSize.max || "null"}`;
        if (!mappings[lotSizeKey]) {
          mappings[lotSizeKey] = {
            LotSize: {
              min: entry.LotSize.min,
              max: entry.LotSize.max
            },
            General: { I: "", II: "", III: "" },
            Special: { S1: "", S2: "", S3: "", S4: "" }
          };
        }
        if (entry.Type === "General") {
          mappings[lotSizeKey].General[entry.Level] = entry.SampleSizeLetterCode;
        } else if (entry.Type === "Special") {
          mappings[lotSizeKey].Special[entry.Level] = entry.SampleSizeLetterCode;
        }
      });
  
      // Convert mappings object to array
      const mappingsArray = Object.values(mappings);
      res.json(mappingsArray);
    } catch (error) {
      console.error("Error fetching AQL mappings:", error);
      res.status(500).json({ message: "Server error" });
    }
};

export const getSampleSizeCodeLetter = async (req, res) => {
     try {
        const aqlCharts = await AQLChart.find({}).lean();
        const codeLettersMap = {};
    
        // Group by SampleSizeLetterCode
        aqlCharts.forEach((entry) => {
          const code = entry.SampleSizeLetterCode;
          if (!codeLettersMap[code]) {
            codeLettersMap[code] = {
              code,
              sampleSize: entry.SampleSize,
              AQL: []
            };
          }
          // Merge AQL entries, avoiding duplicates
          entry.AQL.forEach((aql) => {
            if (!codeLettersMap[code].AQL.some((a) => a.level === aql.level)) {
              codeLettersMap[code].AQL.push({
                level: aql.level,
                AcceptDefect: aql.AcceptDefect,
                RejectDefect: aql.RejectDefect
              });
            }
          });
        });
    
        // Convert to array and sort AQL by level
        const codeLettersArray = Object.values(codeLettersMap).map((item) => ({
          ...item,
          AQL: item.AQL.sort((a, b) => a.level - b.level)
        }));
    
        res.json(codeLettersArray);
      } catch (error) {
        console.error("Error fetching sample size code letters:", error);
        res.status(500).json({ message: "Server error" });
      }
};

//Cutting Page AQL Level display
export const getAQLDetails = async (req, res) => {
    try {
        const { lotSize } = req.query;
    
        if (!lotSize || isNaN(lotSize)) {
          return res
            .status(400)
            .json({ message: "Lot size is required and must be a number" });
        }
    
        const lotSizeNum = parseInt(lotSize);
    
        // Find AQL chart entry where lotSize falls within LotSize.min and LotSize.max
        const aqlChart = await AQLChart.findOne({
          Type: "General",
          Level: "II",
          "LotSize.min": { $lte: lotSizeNum },
          $or: [{ "LotSize.max": { $gte: lotSizeNum } }, { "LotSize.max": null }]
        }).lean();
    
        if (!aqlChart) {
          return res
            .status(404)
            .json({ message: "No AQL chart found for the given lot size" });
        }
    
        // Find AQL entry for level 1.0
        const aqlEntry = aqlChart.AQL.find((aql) => aql.level === 1.0);
    
        if (!aqlEntry) {
          return res
            .status(404)
            .json({ message: "AQL level 1.0 not found for the given chart" });
        }
    
        res.json({
          SampleSizeLetterCode: aqlChart.SampleSizeLetterCode,
          SampleSize: aqlChart.SampleSize,
          AcceptDefect: aqlEntry.AcceptDefect,
          RejectDefect: aqlEntry.RejectDefect
        });
      } catch (error) {
        console.error("Error fetching AQL details:", error);
        res.status(500).json({ message: "Server error" });
      }
};