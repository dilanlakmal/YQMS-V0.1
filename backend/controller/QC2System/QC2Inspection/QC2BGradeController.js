import {
  QC2BGrade,
  QC2InspectionPassBundle,
} from "../../MongoDB/dbConnectionController.js";

// --- COMPLETELY FIXED: To save or update B-Grade garment data ---
export const saveBGradeData = async (req, res) => {
  try {
    const { defect_print_id, garmentData, headerData } = req.body;

    if (!defect_print_id || !garmentData || !headerData) {
      return res.status(400).json({ message: "Missing required data." });
    }

    console.log("=== Saving B-Grade Data ===");
    console.log("defect_print_id:", defect_print_id);
    console.log("garmentData:", garmentData);
    console.log("leader_status:", garmentData.leader_status);

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

    // Find bundle_random_id from inspection document
    const inspectionDoc = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defect_print_id
    });

    if (!inspectionDoc) {
      return res.status(400).json({ 
        message: "Cannot find related inspection document for this defect_print_id" 
      });
    }

    const bundle_random_id = inspectionDoc.bundle_random_id;
    console.log(`Found bundle_random_id: ${bundle_random_id} for defect_print_id: ${defect_print_id}`);

    // Check if document exists
    let bGradeRecord = await QC2BGrade.findOne({ defect_print_id });
    
    if (!bGradeRecord) {
      // Document doesn't exist - create new one
      console.log("Creating new B-Grade document");
      
      const initialTotalBgradeQty = garmentData.leader_status === "B Grade" ? 1 : 0;
      console.log(`Setting initial totalBgradeQty to: ${initialTotalBgradeQty}`);
      
      bGradeRecord = new QC2BGrade({
        ...headerData,
        defect_print_id,
        bundle_random_id,
        bgradeArray: [garmentData],
        totalBgradeQty: initialTotalBgradeQty
      });
      
      await bGradeRecord.save();
      console.log(`✓ Created new B-Grade document with totalBgradeQty: ${bGradeRecord.totalBgradeQty}`);
    } else {
      // Document exists - update it
      console.log("Updating existing B-Grade document");
      console.log(`Current totalBgradeQty: ${bGradeRecord.totalBgradeQty}`);
      
      bGradeRecord.bgradeArray.push(garmentData);
      
      // Increment totalBgradeQty if leader_status is "B Grade"
      if (garmentData.leader_status === "B Grade") {
        bGradeRecord.totalBgradeQty += 1;
        console.log(`Incremented totalBgradeQty to: ${bGradeRecord.totalBgradeQty}`);
      }
      
      // Ensure bundle_random_id is set if missing
      if (!bGradeRecord.bundle_random_id) {
        bGradeRecord.bundle_random_id = bundle_random_id;
        console.log("Set missing bundle_random_id");
      }
      
      await bGradeRecord.save();
      console.log(`✓ Updated B-Grade document with totalBgradeQty: ${bGradeRecord.totalBgradeQty}`);
    }

    // VERIFICATION: Double-check the saved document
    const verificationDoc = await QC2BGrade.findOne({ defect_print_id });
    console.log("=== Verification ===");
    console.log(`Saved document totalBgradeQty: ${verificationDoc.totalBgradeQty}`);
    console.log(`Actual B-Grade garments: ${verificationDoc.bgradeArray.filter(g => g.leader_status === "B Grade").length}`);

    // If there's a mismatch, fix it immediately
    const actualBGradeCount = verificationDoc.bgradeArray.filter(g => g.leader_status === "B Grade").length;
    if (verificationDoc.totalBgradeQty !== actualBGradeCount) {
      console.log(`⚠️ Mismatch detected! Fixing: ${verificationDoc.totalBgradeQty} → ${actualBGradeCount}`);
      
      await QC2BGrade.updateOne(
        { defect_print_id },
        { $set: { totalBgradeQty: actualBGradeCount } }
      );
      
      // Get the corrected document
      bGradeRecord = await QC2BGrade.findOne({ defect_print_id });
      console.log(`✓ Fixed totalBgradeQty to: ${bGradeRecord.totalBgradeQty}`);
    }

    // Always decrement reject counts when adding to B-Grade collection
    const updateResult = await QC2InspectionPassBundle.updateOne(
      { "printArray.defect_print_id": defect_print_id },
      {
        $inc: {
          "printArray.$.totalRejectGarmentCount": -1,
          "printArray.$.totalRejectGarment_Var": -1 
        }
      }
    );

    console.log(`Decremented reject counts for defect_print_id: ${defect_print_id}`, updateResult);

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
      { $match: matchFilter },
      { $unwind: "$bgradeArray" },
      { $match: { "bgradeArray.leader_status": "B Grade" } },
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
    res.status(500).json({ message: "Server error fetching B-Grade stock data." });
  }
};

// ENDPOINT 2: Fetch distinct filter options based on a selected date
export const saveBGradeStockFilters = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "A date is required to fetch filter options." });
    }

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const matchFilter = {
      createdAt: { $gte: startDate, $lte: endDate },
      totalBgradeQty: { $gt: 0 }
    };

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

    for (const key in filterOptions) {
      filterOptions[key].sort();
    }

    res.json(filterOptions);
  } catch (error) {
    console.error("Error fetching B-Grade filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options." });
  }
};

// FIXED: Process B-Grade decisions - NO totalPass changes
export const saveBGradeDefect = async (req, res) => {
  const { defect_print_id, decisions } = req.body;
  
  if (!defect_print_id || !decisions || !Object.keys(decisions).length) {
    return res.status(400).json({ message: "Missing required data." });
  }

  try {
    console.log("=== Processing B-Grade Decisions ===");
    console.log("defect_print_id:", defect_print_id);
    console.log("decisions:", decisions);

    // Step 1: Find the B-Grade document
    const bGradeDoc = await QC2BGrade.findOne({ defect_print_id });
    if (!bGradeDoc) {
      throw new Error(`B-Grade document not found for defect ID: ${defect_print_id}`);
    }

    console.log("Current B-Grade document:", {
      bundle_random_id: bGradeDoc.bundle_random_id,
      totalBgradeQty: bGradeDoc.totalBgradeQty,
      garments: bGradeDoc.bgradeArray.map(g => ({
        garmentNumber: g.garmentNumber,
        leader_status: g.leader_status
      }))
    });

    // Step 2: Find bundle_random_id if missing
    let bundle_random_id = bGradeDoc.bundle_random_id;
    
    if (!bundle_random_id) {
      console.log("bundle_random_id is missing, searching for it...");
      
      const inspectionDoc = await QC2InspectionPassBundle.findOne({
        "printArray.defect_print_id": defect_print_id
      });

      if (!inspectionDoc) {
        throw new Error(`Cannot find inspection document with defect_print_id: ${defect_print_id}`);
      }

      bundle_random_id = inspectionDoc.bundle_random_id;
      console.log(`Found bundle_random_id: ${bundle_random_id}`);

      // Update the B-Grade document with the found bundle_random_id
      bGradeDoc.bundle_random_id = bundle_random_id;
    }

    // Step 3: Process decisions
    let garmentsChangedToNotBGrade = 0;
    let garmentsChangedToBGrade = 0;

    bGradeDoc.bgradeArray.forEach((garment) => {
      const garmentNumberStr = String(garment.garmentNumber);
      const decision = decisions[garmentNumberStr];
      
      console.log(`Garment ${garment.garmentNumber}: current=${garment.leader_status}, decision=${decision}`);
      
      if (decision) {
        const oldStatus = garment.leader_status;
        
        if (decision === "Not B Grade" && oldStatus === "B Grade") {
          garment.leader_status = "Not B Grade";
          garmentsChangedToNotBGrade++;
          console.log(`✓ Garment ${garment.garmentNumber}: B Grade → Not B Grade`);
        } else if (decision === "Accept" && oldStatus === "Not B Grade") {
          garment.leader_status = "B Grade";
          garmentsChangedToBGrade++;
          console.log(`✓ Garment ${garment.garmentNumber}: Not B Grade → B Grade`);
        }
      }
    });

    console.log(`Changes: ${garmentsChangedToNotBGrade} to "Not B Grade", ${garmentsChangedToBGrade} to "B Grade"`);

    if (garmentsChangedToNotBGrade === 0 && garmentsChangedToBGrade === 0) {
      return res.status(200).json({ message: "No changes to garment statuses were made." });
    }

    // Step 4: Update B-Grade document counts
    const netBGradeChange = garmentsChangedToBGrade - garmentsChangedToNotBGrade;
    const newTotalBgradeQty = Math.max(0, bGradeDoc.totalBgradeQty + netBGradeChange);
    
    bGradeDoc.totalBgradeQty = newTotalBgradeQty;
    bGradeDoc.markModified("bgradeArray");
    await bGradeDoc.save();

    console.log(`Updated B-Grade document: totalBgradeQty = ${newTotalBgradeQty}`);

    // Step 5: Update inspection document - ONLY reject counts, NO totalPass changes
    console.log("=== Updating Inspection Document ===");
    console.log("Looking for bundle_random_id:", bundle_random_id);

    const inspectionDoc = await QC2InspectionPassBundle.findOne({ 
      bundle_random_id: bundle_random_id 
    });
    
    if (!inspectionDoc) {
      throw new Error(`Inspection document not found for bundle_random_id: ${bundle_random_id}`);
    }

    // Find the specific printArray element
    const printElementIndex = inspectionDoc.printArray.findIndex(p => p.defect_print_id === defect_print_id);
    if (printElementIndex === -1) {
      throw new Error(`Print element not found for defect_print_id: ${defect_print_id}`);
    }

    const printElement = inspectionDoc.printArray[printElementIndex];
    console.log("Current print element:", {
      defect_print_id: printElement.defect_print_id,
      totalRejectGarmentCount: printElement.totalRejectGarmentCount,
      totalRejectGarment_Var: printElement.totalRejectGarment_Var
    });

    // Calculate changes for inspection document
    const oldRejectCount = printElement.totalRejectGarmentCount;
    const oldRejectVar = printElement.totalRejectGarment_Var;

    // FIXED: Only update reject counts, NO totalPass changes
    if (garmentsChangedToNotBGrade > 0) {
      // Garments changed from "B Grade" to "Not B Grade" - increment reject counts back
      inspectionDoc.printArray[printElementIndex].totalRejectGarmentCount += garmentsChangedToNotBGrade;
      inspectionDoc.printArray[printElementIndex].totalRejectGarment_Var += garmentsChangedToNotBGrade;
      console.log(`Incremented reject counts for ${garmentsChangedToNotBGrade} garments changed to "Not B Grade"`);
    }

    if (garmentsChangedToBGrade > 0) {
      // Garments changed from "Not B Grade" to "B Grade" - decrement reject counts
      inspectionDoc.printArray[printElementIndex].totalRejectGarmentCount -= garmentsChangedToBGrade;
      inspectionDoc.printArray[printElementIndex].totalRejectGarment_Var -= garmentsChangedToBGrade;
      console.log(`Decremented reject counts for ${garmentsChangedToBGrade} garments changed to "B Grade"`);
    }

    // Mark the array as modified and save
    inspectionDoc.markModified('printArray');
    await inspectionDoc.save();

    console.log("=== Final Results ===");
    console.log(`Reject counts: ${oldRejectCount} → ${inspectionDoc.printArray[printElementIndex].totalRejectGarmentCount}`);
    console.log(`Reject vars: ${oldRejectVar} → ${inspectionDoc.printArray[printElementIndex].totalRejectGarment_Var}`);
    console.log("totalPass: NO CHANGES (as requested)");

    res.status(200).json({
      message: "B-Grade decisions processed successfully.",
      summary: {
        garmentsChangedToNotBGrade,
        garmentsChangedToBGrade,
        newTotalBgradeQty,
        beforeUpdate: {
          totalRejectGarmentCount: oldRejectCount,
          totalRejectGarment_Var: oldRejectVar
        },
        afterUpdate: {
          totalRejectGarmentCount: inspectionDoc.printArray[printElementIndex].totalRejectGarmentCount,
          totalRejectGarment_Var: inspectionDoc.printArray[printElementIndex].totalRejectGarment_Var
        },
        note: "totalPass was not modified as requested"
      }
    });

  } catch (error) {
    console.error("Error processing B-Grade decisions:", error);
    res.status(500).json({
      message: "An error occurred while processing the request.",
      error: error.message
    });
  }
};

// ENHANCED: Fix existing documents with incorrect totalBgradeQty
export const fixExistingBGradeQty = async (req, res) => {
  try {
    const documentsToFix = await QC2BGrade.find({});
    let fixedCount = 0;
    
    console.log(`Found ${documentsToFix.length} B-Grade documents to check`);
    
    for (const doc of documentsToFix) {
      const actualBGradeCount = doc.bgradeArray.filter(
        garment => garment.leader_status === "B Grade"
      ).length;
      
      console.log(`Document ${doc.defect_print_id}: stored=${doc.totalBgradeQty}, actual=${actualBGradeCount}`);
      
      if (doc.totalBgradeQty !== actualBGradeCount) {
        console.log(`🔧 Fixing document ${doc.defect_print_id}: ${doc.totalBgradeQty} → ${actualBGradeCount}`);
        
        await QC2BGrade.updateOne(
          { _id: doc._id },
          { $set: { totalBgradeQty: actualBGradeCount } }
        );
        
        fixedCount++;
      }
    }
    
    res.json({ 
      message: `Fixed ${fixedCount} B-Grade documents with incorrect totalBgradeQty`,
      totalDocuments: documentsToFix.length,
      fixedDocuments: fixedCount
    });
  } catch (error) {
    console.error("Error fixing B-Grade quantities:", error);
    res.status(500).json({ message: "Error fixing B-Grade quantities" });
  }
};


// ENDPOINT 2: Fetch distinct filter options based on a selected date
export const getBGradeStockFilters = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "A date is required to fetch filter options." });
    }

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const matchFilter = {
      createdAt: { $gte: startDate, $lte: endDate },
      totalBgradeQty: { $gt: 0 }
    };

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

    for (const key in filterOptions) {
      filterOptions[key].sort();
    }

    res.json(filterOptions);
  } catch (error) {
    console.error("Error fetching B-Grade filter options:", error);
    res.status(500).json({ message: "Server error fetching filter options." });
  }
};
