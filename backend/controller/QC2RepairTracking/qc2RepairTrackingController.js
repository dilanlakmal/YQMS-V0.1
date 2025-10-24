import {
  QC2RepairTracking, 
  QC2InspectionPassBundle, 
  QC2OrderData,              
} from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   QC2 - Repair Tracking
------------------------------ */
// 1. Fetch Defect Data by defect_print_id
export const getDefectPrintRecordsByDefectId = async (req, res) => {
    try {
    const { defect_print_id } = req.params;

    // Fetch from qc2_inspection_pass_bundle
    const inspectionRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defect_print_id
    });

    if (!inspectionRecord) {
      return res.status(404).json({ message: "Defect print ID not found" });
    }

    const printData = inspectionRecord.printArray.find(
      (item) => item.defect_print_id === defect_print_id
    );

    if (!printData) {
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    // Fetch existing repair tracking data if it exists
    const repairRecord = await QC2RepairTracking.findOne({ defect_print_id });

    const formattedData = {
      package_no: inspectionRecord.package_no,
      moNo: inspectionRecord.moNo,
      custStyle: inspectionRecord.custStyle,
      color: inspectionRecord.color,
      size: inspectionRecord.size,
      lineNo: inspectionRecord.lineNo,
      department: inspectionRecord.department,
      buyer: inspectionRecord.buyer,
      factory: inspectionRecord.factory,
      sub_con: inspectionRecord.sub_con,
      sub_con_factory: inspectionRecord.sub_con_factory,
      defect_print_id: printData.defect_print_id,
      garments: printData.printData.map((garment) => ({
        garmentNumber: garment.garmentNumber,
        defects: garment.defects.map((defect) => {
          const repairItem = repairRecord
            ? repairRecord.repairArray.find(
                (r) =>
                  r.defectName === defect.name &&
                  r.garmentNumber === garment.garmentNumber
              )
            : null;
          return {
            name: defect.name,
            count: defect.count,
            repair: defect.repair,
            status: repairItem ? repairItem.status : "Fail",
            repair_date: repairItem ? repairItem.repair_date : "",
            repair_time: repairItem ? repairItem.repair_time : "",
            pass_bundle: repairItem ? repairItem.pass_bundle : "Not Checked",
            garmentNumber: garment.garmentNumber
          };
        })
      }))
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching defect track data:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Save/Update Repair Tracking Data
export const saveRepairTrackingData = async (req, res) => {
    try {
    const {
      defect_print_id,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer,
      factory,
      sub_con,
      sub_con_factory,
      repairArray
    } = req.body;

    // // Check if a record already exists
    // let existingRecord = await QC2RepairTracking.findOne({ defect_print_id });

    // if (existingRecord) {
    //   // Update existing record
    //   existingRecord.repairArray = existingRecord.repairArray.map((item) => {
    //     const updatedItem = repairArray.find(
    //       (newItem) =>
    //         newItem.defectName === item.defectName &&
    //         newItem.garmentNumber === item.garmentNumber
    //     );
    //     if (updatedItem) {
    //       // Determine if pass_bundle needs to be updated
    //       let newPassBundle = item.pass_bundle;
    //       if (updatedItem.status !== item.status) {
    //         newPassBundle =
    //           updatedItem.status === "Fail"
    //             ? "Not Checked"
    //             : updatedItem.status === "OK"
    //             ? "Pass"
    //             : updatedItem.status === "B-Grade"
    //             ? "Fail"
    //             : "Fail";
    //       }
    //       return {
    //         ...item,
    //         status: updatedItem.status,
    //         repair_date: updatedItem.repair_date,
    //         repair_time: updatedItem.repair_time,
    //         pass_bundle: newPassBundle
    //       };
    //     }
    //     return item;
    //   });

    //   //Add new items
    //   const newItems = repairArray.filter(
    //     (newItem) =>
    //       !existingRecord.repairArray.some(
    //         (existingItem) =>
    //           existingItem.defectName === newItem.defectName &&
    //           existingItem.garmentNumber === newItem.garmentNumber
    //       )
    //   );

    //   if (newItems.length > 0) {
    //     existingRecord.repairArray.push(...newItems);
    //   }

    //   await existingRecord.save();
    //   res.status(200).json({
    //     message: "Repair tracking updated successfully",
    //     data: existingRecord
    //   });
    // } else {
    //   // Create new record
    //   const newRecord = new QC2RepairTracking({

    if (!defect_print_id || !repairArray) {
      return res
        .status(400)
        .json({ message: "Missing defect_print_id or repairArray." });
    }

    const now = new Date();

    // 1. Enhance the incoming array with correct timestamps based on status
    const enhancedRepairArray = repairArray.map((item) => ({
      ...item,
      repair_date:
        item.status === "OK" ? now.toLocaleDateString("en-US") : null,
      repair_time:
      item.status === "OK"
          ? now.toLocaleTimeString("en-US", { hour12: false })
          : null
    }));

    // 2. Use a single, atomic operation to update or create the document
    const updatedRecord = await QC2RepairTracking.findOneAndUpdate(
      { defect_print_id }, // Query: Find the document by its unique ID
      {
        // Update payload:
        $set: {
        package_no,
        moNo,
        custStyle,
        color,
        size,
        lineNo,
        department,
        buyer,
        factory,
        sub_con,
        sub_con_factory,
      //   defect_print_id,
      //   repairArray: repairArray.map((item) => ({
      //     defectName: item.defectName,
      //     defectCount: item.defectCount,
      //     repairGroup: item.repairGroup,
      //     garmentNumber: item.garmentNumber,
      //     status: item.status || "Fail",
      //     repair_date: item.repair_date || "",
      //     repair_time: item.repair_time || "",
      //     pass_bundle:
      //       item.status === "Fail"
      //         ? "Not Checked"
      //         : item.status === "OK"
      //         ? "Fail"
      //         : "Not Checked"
      //   }))
      // });
      // await newRecord.save();
      // res.status(201).json({
      repairArray: enhancedRepairArray // Replace the entire array with our enhanced one
        },
        $setOnInsert: { defect_print_id } // If creating, ensure defect_print_id is set
      },
      {
        new: true, // Return the updated document
        upsert: true // Create the document if it doesn't exist
      }
    );
        res.status(200).json({
        message: "Repair tracking saved successfully",
        // data: newRecord
        data: updatedRecord
      });
    // }
  } catch (error) {
    console.error("Error saving/updating repair tracking:", error);
    res.status(500).json({
      message: "Failed to save/update repair tracking",
      error: error.message
    });
  }
};

// Endpoint to update defect status for a rejected garment
export const updateDefectStatus = async (req, res) => {
    // const { defect_print_id, garmentNumber, failedDefects, isRejecting } =
  //   req.body;
  const { defect_print_id, garmentNumber, failedDefects } = req.body;
  try {
    // const repairTracking = await QC2RepairTracking.find({ defect_print_id });
    // if (!repairTracking || repairTracking.length == 0) {
    //   return res.status(404).json({ message: "Repair tracking not found" });
    if (!failedDefects || failedDefects.length === 0) {
      return res.status(400).json({ message: "No failed defects provided." });
    }

//     const rt = repairTracking[0];

//     rt.repairArray = rt.repairArray.map((item) => {
//   if (item.garmentNumber === garmentNumber) {
//     if (
//       isRejecting &&
//       failedDefects.some((fd) => fd.name === item.defectName)
//     ) {
//       item.status = "Fail";
//       item.repair_date = null;
//       item.repair_time = null;
//       item.pass_bundle = "Fail";
//     } 
//     // If rejecting but not in failedDefects, do nothing
//   }

//   // New condition: If status is B-Grade, pass_bundle must be Fail
//   if (item.status === "B-Grade") {
//     item.pass_bundle = "Fail";
//   }

//   return item;
// });


//     await rt.save();
const defectNamesToFail = failedDefects.map((d) => d.name);

    const result = await QC2RepairTracking.updateOne(
      { defect_print_id },
      {
        $set: {
          "repairArray.$[elem].status": "Fail",
          "repairArray.$[elem].repair_date": null,
          "repairArray.$[elem].repair_time": null,
          "repairArray.$[elem].pass_bundle": "Fail"
        }
      },
      {
        arrayFilters: [
          {
            "elem.garmentNumber": garmentNumber,
            "elem.defectName": { $in: defectNamesToFail }
          }
        ]
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Repair tracking not found" });
    }
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating re-rejected garment status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Endpoint to update pass_bundle status for all garments
export const updatePassBundleStatus = async (req, res) => {
    try {
      // const { defect_print_id, pass_bundle } = req.body;

      // const repairTracking = await QC2RepairTracking.findOne({
      //   defect_print_id
      // });

      // if (!repairTracking) {
      const { defect_print_id } = req.body;
      const result = await QC2RepairTracking.updateOne(
        { defect_print_id }, // Find the document
        { $set: { "repairArray.$[elem].pass_bundle": "Pass" } }, // The update to apply
        {
          // This filter tells MongoDB to only apply the update to elements where status is "OK"
          arrayFilters: [{ "elem.status": "OK" }],
          new: true
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Repair tracking not found" });
      }

      // const updatedRepairArray = repairTracking.repairArray.map((item) => {
      //   return {
      //     ...item.toObject(),
      //     pass_bundle: item.status === "OK" ? "Pass" : item.pass_bundle
      //   };
      // });

      // repairTracking.repairArray = updatedRepairArray;
      // await repairTracking.save();

      res
        .status(200)
        .json({ message: "pass_bundle status updated successfully" });
    } catch (error) {
      console.error("Error updating pass_bundle status:", error);
      res.status(500).json({
        message: "Failed to update pass_bundle status",
        error: error.message
      });
    }
};

// Endpoint to update defect status by defect name and garment number
export const updateDefectStatusByName = async (req, res) => {
   // const { defect_print_id, garmentNumber, defectName, status } = req.body;
    // try {
    //   const repairTracking = await QC2RepairTracking.findOne({
    //     defect_print_id
    //   });
    //   if (!repairTracking) {
    //     console.error(
    //       `No repair tracking found for defect_print_id: ${defect_print_id}`
    //     ); // Add this line
    //     return res.status(404).json({ message: "Repair tracking not found" });
    //   }

    //   // Find the specific defect and update it
    //   const updatedRepairArray = repairTracking.repairArray.map((item) => {
    //     if (
    //       item.garmentNumber === garmentNumber &&
    //       item.defectName === defectName
    //     ) {
    //       const shouldUpdate = item.status !== status;
    //       if (shouldUpdate) {
    const { defect_print_id, garmentNumber, defectName, status, pass_bundle } =
      req.body;
    try {
            const now = new Date();

              // ...item,
              // status: status,
              // repair_date:
              const updatePayload = {
              "repairArray.$.status": status,
               "repairArray.$.repair_date":
                status === "OK" ? now.toLocaleDateString("en-US") : null,
              // repair_time:
              "repairArray.$.repair_time":
                status === "OK"
                  ? now.toLocaleTimeString("en-US", { hour12: false })
                  : null,
               // pass_bundle: status === "OK" ? "Pass" : status === "Fail" ? "Fail" : item.pass_bundle
      //         pass_bundle: status === "OK" ? "Fail" : item.pass_bundle
      //       };
      //     }
      //   }
      //   return item;
      // });
      // // Check if any changes were made
      // const hasChanges = repairTracking.repairArray.some((item, index) => {
      //   return (
      //     JSON.stringify(item) !== JSON.stringify(updatedRepairArray[index])
      //   );
      // });
      // if (hasChanges) {
      //   repairTracking.repairArray = updatedRepairArray;
      //   await repairTracking.save();
        // console.log("Updated Repair Array:", updatedRepairArray);
        "repairArray.$.pass_bundle": pass_bundle // Pass this directly from the frontend
      };

      // This is the atomic update. It finds the document AND the array element and updates it in one go.
      const result = await QC2RepairTracking.updateOne(
        {
          defect_print_id,
          "repairArray.garmentNumber": garmentNumber,
          "repairArray.defectName": defectName
        },
        { $set: updatePayload }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ message: "Repair tracking or specific defect not found." });
      }

      if (result.modifiedCount === 0) {
        return res.status(200).json({ message: "No changes were needed." });
      }

        res.status(200).json({ message: "Defect status updated successfully" });
      // } else {
      //   res.status(200).json({ message: "No changes were made" });
      // }
    } catch (error) {
      console.error("Error updating defect status:", error);
      res.status(500).json({
        message: "Failed to update defect status",
        error: error.message
      });
    }
};

// // New endpoint to save scan data
// export const saveScanData = async (req, res) => {
//     try {
//         const {
//           bundle_random_id,
//           defect_print_id,
//           scanNo,
//           scanDate,
//           scanTime,
//           totalRejects,
//           totalPass,
//           rejectGarmentCount,
//           defectQty,
//           isRejectGarment,
//           isPassBundle,
//           // sessionData,
//           confirmedDefects,
//           repairStatuses,
//           inspection_operator,
//         } = req.body;
    
    
//         // Optional: Ensure scanDate is in MM/DD/YYYY format
//         let formattedScanDate = scanDate;
//         if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(scanDate)) {
//           const now = new Date();
//           formattedScanDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
//         }
    
    
//         // 1. Save to qc2_orderdata
//         let orderData = await QC2OrderData.findOne({ bundle_random_id });
//         if (!orderData) {
//           orderData = new QC2OrderData({
//             bundle_random_id,
//             qc2InspectionDefect: [], // Initialize as empty array
//           });
//         } 
//         // else {
//         //   console.log('Existing order data found:', orderData);
//         // }
    
//         // Ensure qc2InspectionDefect is an array before pushing
//         if (!Array.isArray(orderData.qc2InspectionDefect)) {
//           orderData.qc2InspectionDefect = [];
//         }
    
//         orderData.qc2InspectionDefect.push({
//           scanNo,
//           scanDate: formattedScanDate,
//           scanTime,
//           rejectGarmentCount,
//           totalPass,
//           totalRejects,
//           defectQty,
//           bundle_random_id,
//           defect_print_id,
//           isRejectGarment,
//           isPassBundle,
//           // sessionData,
//           confirmedDefects,
//           repairStatuses,
//           inspection_operator,
//         });
    
//         await orderData.save();
    
//         // 2. Save to qc2_inspection_pass_bundle
//         const inspectionData = await QC2InspectionPassBundle.findOne({ bundle_random_id });
//         if (inspectionData) {
//           const printEntry = inspectionData.printArray.find(
//             (entry) => entry.defect_print_id === defect_print_id
//           );
//           if (printEntry) {
//             if (!Array.isArray(printEntry.inspectionHistory)) {
//               printEntry.inspectionHistory = [];
//             }
//             printEntry.inspectionHistory.push({
//               scanNo,
//               scanDate: formattedScanDate,
//               scanTime,
//               rejectGarmentCount,
//               totalPass,
//               totalRejects,
//               defectQty,
//               isRejectGarment,
//               isPassBundle,
//               // sessionData,
//               confirmedDefects,
//               repairStatuses,
//               inspection_operator,
//             });
//             await inspectionData.save();
//           }
//         }
    
//         res.status(200).json({ message: 'Scan data saved successfully' });
//       } catch (err) {
//         res.status(500).json({ message: 'Failed to save scan data', error: err.message });
//       }
// };

// export const getScanCount = async (req, res) => {
//     const { bundle_random_id } = req.params;
    
//       try {
//         const inspectionData = await QC2InspectionPassBundle.findOne({ bundle_random_id });
    
//         if (!inspectionData) {
//           return res.status(404).json({ message: 'Bundle not found' });
//         }
    
//         const printEntry = inspectionData.printArray.find(
//           (entry) => entry.defect_print_id === req.query.defect_print_id
//         );
    
//         if (!printEntry) {
//           return res.status(404).json({ message: 'Defect print entry not found' });
//         }
    
//         const currentScanCount = printEntry.inspectionHistory.length;
    
//         res.json({ currentScanCount });
//       } catch (err) {
//         console.error('Error fetching current scan count:', err);
//         res.status(500).json({ message: 'Failed to fetch current scan count', error: err.message });
//       }
// };