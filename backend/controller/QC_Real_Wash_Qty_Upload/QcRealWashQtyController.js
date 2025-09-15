import {QCRealWashQty} from '../MongoDB/dbConnectionController.js';

export const  uploadQcRealWashQty = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of washing quantity records.'
      });
    }

    // Validate required fields
    for (const record of data) {
      if (!record.inspectionDate || !record.QC_Id || !record.Style_No || !record.color || record.washQty === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: inspectionDate, QC_Id, Style_No, color, washQty'
        });
      }
    }

    // Use upsert to handle duplicates (update if exists, insert if not)
    const bulkOps = data.map(record => ({
      updateOne: {
        filter: {
          inspectionDate: new Date(record.inspectionDate),
          QC_Id: record.QC_Id,
          Style_No: record.Style_No,
          color: record.color
        },
        update: {
          $set: {
            washQty: record.washQty,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await QCRealWashQty.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Washing quantity data saved successfully',
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        total: result.upsertedCount + result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error saving washing quantity data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const returnFilterData = async (req, res) => {
  try {
    const { 
      inspectionDate, 
      QC_Id, 
      Style_No, 
      color, 
      startDate, 
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (inspectionDate) {
      filter.inspectionDate = new Date(inspectionDate);
    }
    
    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (QC_Id) filter.QC_Id = QC_Id;
    if (Style_No) filter.Style_No = new RegExp(Style_No, 'i');
    if (color) filter.color = new RegExp(color, 'i');

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [records, total] = await Promise.all([
      QCRealWashQty.find(filter)
        .sort({ inspectionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QCRealWashQty.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: records.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Error retrieving washing quantity data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getSummaryStatuctics = async (req, res) => {
  try {
    const { startDate, endDate, QC_Id } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (QC_Id) matchStage.QC_Id = QC_Id;

    const summary = await QCRealWashQty.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalWashQty: { $sum: '$washQty' },
          totalRecords: { $sum: 1 },
          uniqueStyles: { $addToSet: '$Style_No' },
          uniqueColors: { $addToSet: '$color' },
          avgWashQty: { $avg: '$washQty' }
        }
      },
      {
        $project: {
          _id: 0,
          totalWashQty: 1,
          totalRecords: 1,
          uniqueStylesCount: { $size: '$uniqueStyles' },
          uniqueColorsCount: { $size: '$uniqueColors' },
          avgWashQty: { $round: ['$avgWashQty', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary[0] || {
        totalWashQty: 0,
        totalRecords: 0,
        uniqueStylesCount: 0,
        uniqueColorsCount: 0,
        avgWashQty: 0
      }
    });

  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const deleteWashingQty = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Expected array of record IDs.'
      });
    }

    const result = await QCRealWashQty.deleteMany({
      _id: { $in: ids }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getrealWashQty =  async (req, res) => {
  try {
    const { inspectionDate, styleNo, color } = req.query;
    
    if (!inspectionDate || !styleNo || !color) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: inspectionDate, styleNo, color"
      });
    }

    // Parse the inspection date
    const searchDate = new Date(inspectionDate);
    
    // Create flexible color matching - search for colors that contain the search term
    // This handles cases like "BLACK" matching "黑色[BLACK]"
    const colorRegex = new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    // Search for matching records with flexible color matching
    const records = await QCRealWashQty.aggregate([
      {
        $match: {
          inspectionDate: searchDate,
          Style_No: styleNo,
          $or: [
            { color: color }, // Exact match
            { color: colorRegex }, // Regex match for partial matches
            { color: { $regex: `\\[${color}\\]`, $options: 'i' } } // Match color in brackets like [BLACK]
          ]
        }
      },
      {
        $group: {
          _id: {
            inspectionDate: "$inspectionDate",
            Style_No: "$Style_No",
            color: "$color"
          },
          totalWashQty: { $sum: "$washQty" },
          qcIds: { $push: "$QC_Id" },
          recordCount: { $sum: 1 },
          matchedColors: { $addToSet: "$color" }
        }
      }
    ]);

    const totalWashQty = records.length > 0 ? records[0].totalWashQty : 0;

    res.json({
      success: true,
      washQty: totalWashQty,
      found: records.length > 0,
      details: records.length > 0 ? records[0] : null,
      searchCriteria: { inspectionDate, styleNo, color }
    });

  } catch (error) {
    console.error("Error searching real wash qty:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search real wash qty",
      error: error.message
    });
  }
};