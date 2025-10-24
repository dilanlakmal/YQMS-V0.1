import {
  // CuttingOrders,                
} from "../../controller/MongoDB/dbConnectionController.js";

/* ------------------------------
   Updated Endpoints for Cutting.jsx
------------------------------ */

// Endpoint to Search MO Numbers (StyleNo) from cuttingOrders with partial matching
// export const getCutOrderMoNo = async (req, res) => {
//  try {
//     const searchTerm = req.query.search;
//     if (!searchTerm) {
//       return res.status(400).json({ error: "Search term is required" });
//     }

//     // Use a case-insensitive regex to match the term anywhere in StyleNo
//     const regexPattern = new RegExp(searchTerm, "i");

//     // Query the cuttingOrders collection
//     const results = await CuttingOrders.find({
//       StyleNo: { $regex: regexPattern }
//     })
//       .select("StyleNo") // Only return the StyleNo field
//       .limit(100) // Limit results to prevent overwhelming the UI
//       .sort({ StyleNo: 1 }) // Sort alphabetically
//       .exec();

//     // Extract unique StyleNo values
//     const uniqueMONos = [...new Set(results.map((r) => r.StyleNo))];

//     res.json(uniqueMONos);
//   } catch (err) {
//     console.error("Error fetching MO numbers from cuttingOrders:", err);
//     res.status(500).json({
//       message: "Failed to fetch MO numbers from cuttingOrders",
//       error: err.message
//     });
//   }
// };

// Endpoint to Fetch Cutting Order Details for a given MO No (StyleNo)
// export const getCutOrderDetails = async (req, res) => {
//  try {
//      const styleNo = req.query.styleNo;
//      if (!styleNo) {
//        return res.status(400).json({ error: "StyleNo is required" });
//      }
 
//      // Find all documents where StyleNo matches
//      const documents = await CuttingOrders.find({ StyleNo: styleNo }).exec();
 
//      if (documents.length === 0) {
//        console.log(`No documents found for StyleNo: ${styleNo}`);
//        return res.status(404).json({ error: "MO No not found" });
//      }
 
//      res.json(documents);
//    } catch (err) {
//      console.error("Error fetching Cutting Orders details:", err);
//      res.status(500).json({
//        message: "Failed to fetch Cutting Orders details",
//        error: err.message
//      });
//    }
// };

// export const getCutOrderSize = async (req, res) => {
//  try {
//      const { styleNo, color, tableNo } = req.query;
 
//      if (!styleNo || !color || !tableNo) {
//        return res
//          .status(400)
//          .json({ error: "styleNo, color, and tableNo are required" });
//      }
 
//      // Find the document matching the styleNo and color
//      const document = await CuttingOrders.findOne({
//        StyleNo: styleNo,
//        EngColor: color
//      }).exec();
 
//      if (!document) {
//        return res
//          .status(404)
//          .json({ error: "Document not found for the given styleNo and color" });
//      }
 
//      // Find the cuttingData entry matching the tableNo
//      const cuttingDataEntry = document.cuttingData.find(
//        (cd) => cd.tableNo === tableNo
//      );
 
//      if (!cuttingDataEntry) {
//        return res
//          .status(404)
//          .json({ error: "Table number not found in cuttingData" });
//      }
 
//      // Extract sizes from markerData, filter out null/empty sizes, and sort by no
//      const sizes = cuttingDataEntry.markerData
//        .filter((md) => md.size && md.size.trim() !== "" && md.size !== "0") // Exclude null or empty sizes
//        .map((md) => ({ no: md.no, size: md.size })) // Map to { no, size }
//        .sort((a, b) => a.no - b.no) // Sort by no
//        .map((md) => md.size); // Extract only the size values
 
//      // Remove duplicates
//      const uniqueSizes = [...new Set(sizes)];
 
//      res.json(uniqueSizes);
//    } catch (err) {
//      console.error("Error fetching sizes from cuttingOrders:", err);
//      res.status(500).json({
//        message: "Failed to fetch sizes from cuttingOrders",
//        error: err.message
//      });
//    }
// };