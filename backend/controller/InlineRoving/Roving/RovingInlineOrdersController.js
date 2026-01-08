import {
 InlineOrders
} from "../../MongoDB/dbConnectionController.js";


/* ------------------------------
   QC Inline Roving New
------------------------------ */

// Updated Endpoint to Search MO Numbers (St_No) from inline_orders in MongoDB with partial matching
export const searchMoNumbers = async (req, res) => {
  try {
      const searchTerm = req.query.search; // Get the search term from query params
      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }

      // Use a case-insensitive regex to match the term anywhere in St_No
      const regexPattern = new RegExp(searchTerm, "i");

      // Query the inline_orders collection
      const results = await InlineOrders.find({
        St_No: { $regex: regexPattern }
      })
        .select("St_No") // Only return the St_No field (equivalent to .project({ St_No: 1, _id: 0 }))
        .limit(100) // Limit results to prevent overwhelming the UI
        .sort({ St_No: 1 }) // Sort alphabetically
        .exec();

      // Extract unique St_No values
      const uniqueMONos = [...new Set(results.map((r) => r.St_No))];

      res.json(uniqueMONos);
    } catch (err) {
      console.error("Error fetching MO numbers from inline_orders:", err);
      res.status(500).json({
        message: "Failed to fetch MO numbers from inline_orders",
        error: err.message
      });
    }
};

// New Endpoint to Fetch Inline Order Details for a given MO No (St_No)
export const getInlineOrderDetails = async (req, res) => {
  try {
    const stNo = req.query.stNo;
    if (!stNo) {
      return res.status(400).json({ error: "St_No is required" });
    }

    // Find the document where St_No matches
    const document = await InlineOrders.findOne({ St_No: stNo }).exec();

    if (!document) {
      return res.status(404).json({ error: "MO No not found" });
    }

    res.json(document);
  } catch (err) {
    console.error("Error fetching Inline Order details:", err);
    res.status(500).json({
      message: "Failed to fetch Inline Order details",
      error: err.message
    });
  }
};