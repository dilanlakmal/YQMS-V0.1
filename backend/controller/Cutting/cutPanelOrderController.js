import {
  CutPanelOrders,                
} from "../MongoDB/dbConnectionController.js"; 

/* ------------------------------
   New Endpoints for CutPanelOrders
------------------------------ */

// Endpoint to Search MO Numbers (StyleNo) from cutpanelorders with partial matching
export const getCutpanelOrderMoNo = async (req, res) => {
  try {
      const searchTerm = req.query.search;
      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }
  
      const regexPattern = new RegExp(searchTerm, "i");
  
      const results = await CutPanelOrders.find({
        StyleNo: { $regex: regexPattern }
      })
        .select("StyleNo")
        .limit(100)
        .sort({ StyleNo: 1 })
        .exec();
  
      const uniqueMONos = [...new Set(results.map((r) => r.StyleNo))];
  
      res.json(uniqueMONos);
    } catch (err) {
      console.error("Error fetching MO numbers from cutpanelorders:", err);
      res.status(500).json({
        message: "Failed to fetch MO numbers from cutpanelorders",
        error: err.message
      });
    }
  };

  // Endpoint to Fetch Table Nos for a given MO No (StyleNo)
  export const getCutpanelOrderTableNo = async (req, res) => {
    try {
        const { styleNo } = req.query;
        if (!styleNo) {
          return res.status(400).json({ error: "StyleNo is required" });
        }
    
        const results = await CutPanelOrders.find({ StyleNo: styleNo })
          .select("TableNo")
          .exec();
    
        const uniqueTableNos = [...new Set(results.map((r) => r.TableNo))].filter(
          (table) => table
        );
    
        res.json(uniqueTableNos);
      } catch (err) {
        console.error("Error fetching Table Nos from cutpanelorders:", err);
        res.status(500).json({
          message: "Failed to fetch Table Nos from cutpanelorders",
          error: err.message
        });
      }
  };

  // Endpoint to Fetch Cut Panel Order Details for a given MO No (StyleNo) and TableNo
  export const getCutpanelOrderDetails = async (req, res) => {
    try {
      const { styleNo, tableNo } = req.query;
      if (!styleNo || !tableNo) {
        return res
          .status(400)
          .json({ error: "StyleNo and TableNo are required" });
      }

      const document = await CutPanelOrders.findOne({
        StyleNo: styleNo,
        TableNo: tableNo
      }).exec();

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (err) {
      console.error("Error fetching Cut Panel Orders details:", err);
      res.status(500).json({
        message: "Failed to fetch Cut Panel Orders details",
        error: err.message
      });
    }
  };

  // Endpoint to Fetch Total Order Quantity for unique StyleNo and Color combinations
  export const getCutpanelOrderTatalQty = async (req, res) => {
    try {
      const { styleNo } = req.query;
      if (!styleNo) {
        return res.status(400).json({ error: "StyleNo is required" });
      }

      const results = await CutPanelOrders.aggregate([
        // Match documents for the given StyleNo
        { $match: { StyleNo: styleNo } },
        // Group by StyleNo and Color to deduplicate and sum TotalOrderQty
        {
          $group: {
            _id: { StyleNo: "$StyleNo", Color: "$Color" },
            totalOrderQty: { $sum: "$TotalOrderQty" }
          }
        },
        // Group all results to get the overall sum
        {
          $group: {
            _id: null,
            overallTotalOrderQty: { $sum: "$totalOrderQty" }
          }
        },
        // Project only the overallTotalOrderQty field
        {
          $project: {
            _id: 0,
            overallTotalOrderQty: 1
          }
        }
      ]).exec();

      if (results.length === 0) {
        return res.json({ overallTotalOrderQty: 0 });
      }

      res.json(results[0]);
    } catch (err) {
      console.error(
        "Error fetching total order quantity from cutpanelorders:",
        err
      );
      res.status(500).json({
        message: "Failed to fetch total order quantity from cutpanelorders",
        error: err.message
      });
    }
  };

  // Endpoint to get aggregated TotalOrderQty for a given StyleNo (MO No)
// This sums the TotalOrderQty for each unique color associated with the StyleNo
  export const getCutpanelOrderAggreTotalQty = async (req, res) => {
    try {
    const { styleNo } = req.query;
    if (!styleNo) {
      return res.status(400).json({ error: "StyleNo (MO No) is required" });
    }

    // Find one document matching the StyleNo and project only TotalOrderQtyStyle
    const result = await CutPanelOrders.findOne(
      { StyleNo: styleNo },
      { TotalOrderQtyStyle: 1 }
    );

    if (result && result.TotalOrderQtyStyle !== undefined) {
      res.json({ aggregatedTotalOrderQty: result.TotalOrderQtyStyle });
    } else {
      // If no matching StyleNo or TotalOrderQtyStyle is undefined, return 0
      res.json({ aggregatedTotalOrderQty: 0 });
    }
  } catch (err) {
    console.error("Error fetching aggregated total order quantity:", err);
    res.status(500).json({
      message: "Failed to fetch aggregated total order quantity",
      error: err.message
    });
  }
  };

  // Endpoint to get aggregated TotalOrderQty for a given StyleNo (MO No)
// This sums the TotalOrderQty for each unique color associated with the StyleNo.
// export const getCutpanelOrderAggreTotalQtyPerMo = async (req, res) => {
//   try {
//       const { styleNo } = req.query;
//       if (!styleNo) {
//         return res.status(400).json({ error: "StyleNo (MO No) is required" });
//       }
  
//       // Find one document matching the StyleNo and project only TotalOrderQtyStyle
//       const result = await CutPanelOrders.findOne(
//         { StyleNo: styleNo },
//         { TotalOrderQtyStyle: 1 }
//       );
  
//       if (result && result.TotalOrderQtyStyle !== undefined) {
//         res.json({ aggregatedTotalOrderQty: result.TotalOrderQtyStyle });
//       } else {
//         // If no matching StyleNo or TotalOrderQtyStyle is undefined, return 0
//         res.json({ aggregatedTotalOrderQty: 0 });
//       }
//     } catch (err) {
//       console.error("Error fetching aggregated total order quantity:", err);
//       res.status(500).json({
//         message: "Failed to fetch aggregated total order quantity",
//         error: err.message
//       });
//     }
// };