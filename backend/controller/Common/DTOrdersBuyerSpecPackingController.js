import {
  BuyerSpecTemplateM2, // Importing the M2 Model
  ymProdConnection
} from "../MongoDB/dbConnectionController.js";

// Save M2 Template
export const saveBuyerSpecTemplateM2 = async (req, res) => {
  try {
    const { moNo, buyer, specData } = req.body;

    if (!moNo || !buyer || !specData || !Array.isArray(specData)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid data provided." });
    }

    const result = await BuyerSpecTemplateM2.findOneAndUpdate(
      { moNo: moNo },
      { moNo, buyer, specData, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      message: "Buyer spec template (M2) saved successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error saving buyer spec template M2:", error);
    res.status(500).json({
      error: "Failed to save buyer spec template M2.",
      details: error.message
    });
  }
};

// Get M2 MO Options
export const getBuyerSpecMoNosM2 = async (req, res) => {
  try {
    const monos = await BuyerSpecTemplateM2.find({}, { moNo: 1, _id: 0 }).sort({
      moNo: 1
    });
    res.json(monos.map((m) => m.moNo));
  } catch (error) {
    console.error("Error fetching MO options for templates M2:", error);
    res.status(500).json({ error: "Failed to fetch MO options" });
  }
};

// Get M2 Data (Merging with original Order Data)
export const getBuyerSpecDataM2 = async (req, res) => {
  const { moNo } = req.params;
  if (!moNo) {
    return res.status(400).json({ error: "MO Number is required." });
  }

  try {
    // 1. Fetch from BuyerSpecTemplateM2 collection
    const templateData = await BuyerSpecTemplateM2.findOne({
      moNo: moNo
    }).lean();

    // 2. Fetch AfterWashSpecs from dt_orders collection (Common source)
    const orderData = await ymProdConnection.db
      .collection("dt_orders")
      .findOne(
        { Order_No: moNo },
        { projection: { AfterWashSpecs: 1, _id: 0 } }
      );

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
    console.error(`Error fetching edit spec data M2 for MO ${moNo}:`, error);
    res
      .status(500)
      .json({ error: "Failed to fetch data.", details: error.message });
  }
};

// Update M2 Template
export const updateBuyerSpecTemplateM2 = async (req, res) => {
  const { moNo } = req.params;
  const { specData } = req.body;

  if (!specData) {
    return res.status(400).json({ error: "specData is required for update." });
  }

  try {
    const updatedTemplate = await BuyerSpecTemplateM2.findOneAndUpdate(
      { moNo: moNo },
      { $set: { specData: specData } },
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res
        .status(404)
        .json({ error: "Template not found for the given MO No." });
    }

    res.status(200).json({
      message: "Spec template M2 updated successfully.",
      data: updatedTemplate
    });
  } catch (error) {
    console.error("Error updating spec template M2:", error);
    res.status(500).json({
      error: "Failed to update spec template M2.",
      details: error.message
    });
  }
};
