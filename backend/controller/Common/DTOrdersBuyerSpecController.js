import {
  BuyerSpecTemplate,
  ymProdConnection,
} from "../MongoDB/dbConnectionController.js";

// New endpoint to save a buyer-specific measurement spec template
export const saveBuyerSpecTemplate = async (req, res) => {
  try {
      const { moNo, buyer, specData } = req.body;
  
      // Basic validation
      if (!moNo || !buyer || !specData || !Array.isArray(specData)) {
        return res
          .status(400)
          .json({ error: "Missing or invalid data provided." });
      }
  
      // Use findOneAndUpdate with upsert to either create a new template or update an existing one for the same MO No.
      const result = await BuyerSpecTemplate.findOneAndUpdate(
        { moNo: moNo }, // find a document with this filter
        { moNo, buyer, specData, updatedAt: new Date() }, // document to insert when `upsert` is true or to update
        { new: true, upsert: true, runValidators: true } // options
      );
  
      res.status(201).json({
        message: "Buyer spec template saved successfully.",
        data: result
      });
    } catch (error) {
      console.error("Error saving buyer spec template:", error);
      res.status(500).json({
        error: "Failed to save buyer spec template.",
        details: error.message
      });
    }
};

// Endpoint to get all MO Nos from the buyer spec templates for the edit dropdown
export const getBuyerSpecMoNos = async (req, res) => {
  try {
      const monos = await BuyerSpecTemplate.find({}, { moNo: 1, _id: 0 }).sort({
        moNo: 1
      });
      res.json(monos.map((m) => m.moNo));
    } catch (error) {
      console.error("Error fetching MO options for templates:", error);
      res.status(500).json({ error: "Failed to fetch MO options" });
    }
};

// Endpoint to fetch data for both tables on the Edit page
export const getBuyerSpecData = async (req, res) => {
  const { moNo } = req.params;
    if (!moNo) {
      return res.status(400).json({ error: "MO Number is required." });
    }
  
    try {
      // 1. Fetch from BuyerSpecTemplate collection
      const templateData = await BuyerSpecTemplate.findOne({ moNo: moNo }).lean();
  
      // 2. Fetch AfterWashSpecs from dt_orders collection
      const orderData = await ymProdConnection.db
        .collection("dt_orders")
        .findOne(
          { Order_No: moNo },
          { projection: { AfterWashSpecs: 1, _id: 0 } }
        );
  
      // Check if AfterWashSpecs exist and are valid
      const patternData =
        orderData &&
        Array.isArray(orderData.AfterWashSpecs) &&
        orderData.AfterWashSpecs.length > 0
          ? orderData
          : null;
  
      if (!templateData && !patternData) {
        return res.status(404).json({
          error: `No spec data found for MO No: ${moNo} in any source.`
        });
      }
  
      res.json({ templateData, patternData });
    } catch (error) {
      console.error(`Error fetching edit spec data for MO ${moNo}:`, error);
      res
        .status(500)
        .json({ error: "Failed to fetch data.", details: error.message });
    }
};

// Endpoint to UPDATE an existing buyer spec template
export const updateBuyerSpecTemplate = async (req, res) => {
  const { moNo } = req.params;
    const { specData } = req.body;
  
    if (!specData) {
      return res.status(400).json({ error: "specData is required for update." });
    }
  
    try {
      const updatedTemplate = await BuyerSpecTemplate.findOneAndUpdate(
        { moNo: moNo },
        { $set: { specData: specData } },
        { new: true, runValidators: true } // new: true returns the modified document
      );
  
      if (!updatedTemplate) {
        return res
          .status(404)
          .json({ error: "Template not found for the given MO No." });
      }
  
      res.status(200).json({
        message: "Spec template updated successfully.",
        data: updatedTemplate
      });
    } catch (error) {
      console.error("Error updating spec template:", error);
      res.status(500).json({
        error: "Failed to update spec template.",
        details: error.message
      });
    }
};