import {
  QC2BGrade,
  QC2InspectionPassBundle,
} from "../../MongoDB/dbConnectionController.js";

// --- NEW ENDPOINT: To save or update B-Grade garment data ---
export const saveBGradeData = async (req, res) => {
  try {
      const { defect_print_id, garmentData, headerData } = req.body;
  
      if (!defect_print_id || !garmentData || !headerData) {
        return res.status(400).json({ message: "Missing required data." });
      }
  
      // First, check if this garment is already in the B-Grade document to prevent duplicates
      const existingBGrade = await QC2BGrade.findOne({
        defect_print_id,
        "bgradeArray.garmentNumber": garmentData.garmentNumber
      });
  
      if (existingBGrade) {
        return res.status(200).json({
          message: "This garment has already been marked as B-Grade.",
          data: existingBGrade
        });
      }
  
      const updateOperations = {
        $setOnInsert: headerData, 
        $push: { bgradeArray: garmentData } 
      };
  
      if (garmentData.leader_status !== "Not B Grade") {
        updateOperations.$inc = { totalBgradeQty: 1 };
      }
  
      const bGradeRecord = await QC2BGrade.findOneAndUpdate(
        { defect_print_id },
        updateOperations, 
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
  
      // --- THIS IS THE CRUCIAL NEW LOGIC ---t
      await QC2InspectionPassBundle.updateOne(
        { "printArray.defect_print_id": defect_print_id },
        {
          $inc: {
            "printArray.$.totalRejectGarmentCount": -1,
            "printArray.$.totalRejectGarment_Var": -1 
          }
        }
      );
  
      res.status(200).json({
        message: "B-Grade garment recorded successfully.",
        data: bGradeRecord
      });
    } catch (error) {
      console.error("Error saving B-Grade data:", error);
      res.status(500).json({ message: "Server error saving B-Grade data." });
    }
};

// --- NEW ENDPOINT: To fetch B-Grade data by defect_print_id ---
export const getBGradeDataByDefectId = async (req, res) => {
  try {
      const { defect_print_id } = req.params;
      const bGradeData = await QC2BGrade.findOne({ defect_print_id }).lean();
  
      if (!bGradeData) {
        return res.status(404).json({ message: "No B-Grade records found." });
      }
      res.json(bGradeData);
    } catch (error) {
      console.error("Error fetching B-Grade data by defect ID:", error);
      res.status(500).json({ message: "Server error." });
    }
};


// ENDPOINT 1: Fetch B-Grade Stock Data based on filters
export const saveBGradeStock = async (req, res) => {
  try {
      const { date, moNo, lineNo, packageNo, color, size, department } = req.body;
  
      const matchFilter = {
        totalBgradeQty: { $gt: 0 }
      };
  
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
  
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
  
        matchFilter.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
  
      if (moNo) matchFilter.moNo = moNo;
      if (lineNo) matchFilter.lineNo = lineNo;
      if (packageNo) matchFilter.package_no = Number(packageNo);
      if (color) matchFilter.color = color;
      if (size) matchFilter.size = size;
      if (department) matchFilter.department = department;
  
      const bGradeStock = await QC2BGrade.aggregate([
        // Stage 1: Initial filtering based on user's criteria
        { $match: matchFilter },
  
        // Stage 2: Deconstruct the bgradeArray to process each garment individually
        { $unwind: "$bgradeArray" },
  
        // Stage 3: Filter out garments that are marked as "Not B Grade"
        { $match: { "bgradeArray.leader_status": "B Grade" } },
  
        // Stage 4: Group the valid B-Grade garments back by their parent document ID
        {
          $group: {
            _id: "$_id", 
            moNo: { $first: "$moNo" },
            package_no: { $first: "$package_no" },
            lineNo: { $first: "$lineNo" },
            color: { $first: "$color" },
            size: { $first: "$size" },
            bgradeArray: { $push: "$bgradeArray" }
          }
        },
  
        {
          $project: {
            moNo: 1,
            package_no: 1,
            lineNo: 1,
            color: 1,
            size: 1,
            bGradeQty: { $size: "$bgradeArray" },
            defectDetails: "$bgradeArray",
            _id: 0
          }
        },
  
        { $sort: { package_no: 1, moNo: 1 } }
      ]);
  
      res.json(bGradeStock);
    } catch (error) {
      console.error("Error fetching B-Grade stock:", error);
      res
        .status(500)
        .json({ message: "Server error fetching B-Grade stock data." });
    }
};

// ENDPOINT 2: Fetch distinct filter options based on a selected date
export const getBGradeStockFilters = async (req, res) => {
  try {
      const { date } = req.query;
  
      if (!date) {
        return res
          .status(400)
          .json({ message: "A date is required to fetch filter options." });
      }
  
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
  
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
  
      // Filter for documents on the selected date that have B-Grade items
      const matchFilter = {
        createdAt: { $gte: startDate, $lte: endDate },
        totalBgradeQty: { $gt: 0 }
      };
  
      // Use an aggregation pipeline to get all distinct values in one DB call
      const [filterOptions] = await QC2BGrade.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            moNos: { $addToSet: "$moNo" },
            lineNos: { $addToSet: "$lineNo" },
            packageNos: { $addToSet: "$package_no" },
            colors: { $addToSet: "$color" },
            sizes: { $addToSet: "$size" },
            departments: { $addToSet: "$department" }
          }
        },
        {
          $project: {
            _id: 0,
            moNos: 1,
            lineNos: 1,
            packageNos: 1,
            colors: 1,
            sizes: 1,
            departments: 1
          }
        }
      ]);
  
      // If no records found for that date, return empty arrays
      if (!filterOptions) {
        return res.json({
          moNos: [],
          lineNos: [],
          packageNos: [],
          colors: [],
          sizes: [],
          departments: []
        });
      }
  
      // Sort the arrays before sending
      for (const key in filterOptions) {
        filterOptions[key].sort();
      }
  
      res.json(filterOptions);
    } catch (error) {
      console.error("Error fetching B-Grade filter options:", error);
      res.status(500).json({ message: "Server error fetching filter options." });
    }
};

export const saveBGradeDefect = async (req, res) => {
  const { defect_print_id, decisions } = req.body;
  
    if (!defect_print_id || !decisions || !Object.keys(decisions).length) {
      return res.status(400).json({ message: "Missing required data." });
    }
  
    try {
  
      // Step 1: Find the B-Grade document to get its bundle_random_id.
      const bGradeDoc = await QC2BGrade.findOne({ defect_print_id });
      if (!bGradeDoc) {
        throw new Error(
          `B-Grade document not found for defect ID: ${defect_print_id}`
        );
      }
  
      let garmentsChangedToNotBGrade = 0;
  
      // Step 2: Update the bGradeDoc based on decisions.
      bGradeDoc.bgradeArray.forEach((garment) => {
        const garmentNumberStr = String(garment.garmentNumber);
        if (
          decisions[garmentNumberStr] === "Not B Grade" &&
          garment.leader_status === "B Grade"
        ) {
          garment.leader_status = "Not B Grade";
          garmentsChangedToNotBGrade++;
        }
      });
  
      if (garmentsChangedToNotBGrade === 0) {
        return res
          .status(200)
          .json({ message: "No changes to 'Not B-Grade' were made." });
      }
  
      // Step 3: Update counts and save the B-Grade document.
      bGradeDoc.totalBgradeQty -= garmentsChangedToNotBGrade;
      bGradeDoc.markModified("bgradeArray");
      // We save this document first.
      await bGradeDoc.save();
  
      // Step 4: Find and update the Inspection document.
      const filter = { bundle_random_id: bGradeDoc.bundle_random_id };
      const update = {
        $inc: {
          totalPass: garmentsChangedToNotBGrade,
          "printArray.$[elem].totalRejectGarment_Var": -garmentsChangedToNotBGrade
        }
      };
      const options = {
        arrayFilters: [{ "elem.defect_print_id": defect_print_id }]
      };
  
      await QC2InspectionPassBundle.updateOne(filter, update, options);
  
      res.status(200).json({
        message: "B-Grade decisions processed successfully."
      });
    } catch (error) {
      console.error("Error processing B-Grade decisions:", error);
      res.status(500).json({
        message: "An error occurred while processing the request.",
        error: error.message
      });
    }
};