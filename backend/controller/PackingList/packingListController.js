import {
  PlanPackingList,
} from "../MongoDB/dbConnectionController.js";


export const savePackingList = async (req, res) => {
  try {
    const packingListData = req.body;

    const result = await PlanPackingList.findOneAndUpdate(
      { moNo: packingListData.moNo, poNo: packingListData.poNo }, // Query to find the document
      packingListData, // The new data to insert or update with
      { new: true, upsert: true, runValidators: true } // Options
    );

    res.status(201).json({
      success: true,
      message: "Packing list uploaded successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving packing list:", error);
    // Handle specific error for duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        // 409 Conflict
        success: false,
        message:
          "A packing list with this MO Number and PO Number already exists."
      });
    }
    res.status(500).json({
      success: false,
      message: "An error occurred on the server.",
      error: error.message
    });
  }
};