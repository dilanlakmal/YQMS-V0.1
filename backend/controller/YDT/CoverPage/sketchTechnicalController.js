import { CoverPage } from '../../MongoDB/dbConnectionController.js';
import { 
  processImageBuffer, 
  validateImageBuffer,
} from '../../../helpers/helperFunctions.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { __backendDir } from '../../../Config/appConfig.js';
import { Buffer } from 'buffer';

// Helper function to save base64 image for sketch technical
const saveSketchBase64Image = async (base64Data, orderNo, styleId, baseUrl) => {
  try {
    if (!base64Data) return null;

    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }

    const fileExtension = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');
    
    const validation = validateImageBuffer(buffer, 10); // Allow up to 10MB for sketch images
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const fileName = `${orderNo}_${styleId || 'sketch'}_${uuidv4()}.${fileExtension}`;
    const relativePath = await processImageBuffer(buffer, fileName, 'coverpage');
    const fullUrl = `${baseUrl}${relativePath}`;
    
    return fullUrl;
  } catch (error) {
    console.error('Error saving sketch base64 image:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

export const saveSketchTechnical = async (req, res) => {
  try {
    
    const {
      orderNo,
      styleId,
      shortDesc,
      department,
      initialDcDate,
      commodity,
      season,
      vendor3d,
      styleStatus,
      longDescription,
      finalFitApproval,
      sizeRange,
      targetCost,
      targetUnits,
      plannedColors,
      deliveryCount,
      fitType,
      coll1,
      coll2,
      retailPrice,
      floorSet,
      sizeCurve,
      buyerEngName,
      custStyle,
      orderQty,
      originalImage,
      mainSketchImage,
      secondaryImage,
      canvasData,
      selectedOrderData,
      availableSizes,
      createdBy,
      userInfo
    } = req.body;

    // Validate required fields
    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required'
      });
    }

    // Get base URL for image storage
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yqms.yaikh.com' 
      : (req && req.protocol && req.get) 
        ? `${req.protocol}://${req.get('host')}` 
        : 'http://localhost:5000';

    // ✅ Save images using the same pattern as coverpage
    let savedOriginalImagePath = null;
    let savedMainImagePath = null;
    let savedSecondaryImagePath = null;

    if (originalImage && originalImage.startsWith('data:image')) {
      try {
        savedOriginalImagePath = await saveSketchBase64Image(
          originalImage, 
          orderNo, 
          styleId || 'sketch', 
          baseUrl, 
          'original'
        );
      } catch (imageError) {
        console.error('Error saving original image:', imageError);
        // Don't fail the entire request, just log the error
      }
    } else if (originalImage) {
      // Already a URL, keep it as is
      savedOriginalImagePath = originalImage;
    }

    // ✅ Handle main sketch image saving
    if (mainSketchImage && mainSketchImage.startsWith('data:image')) {
      try {
        savedMainImagePath = await saveSketchBase64Image(
          mainSketchImage, 
          orderNo, 
          styleId || 'sketch', 
          baseUrl, 
          'main'
        );
      } catch (imageError) {
        console.error('Error saving main sketch image:', imageError);
        // Don't fail the entire request, just log the error
      }
    } else if (mainSketchImage) {
      // Already a URL, keep it as is
      savedMainImagePath = mainSketchImage;
    }

    // ✅ Handle secondary image saving
    if (secondaryImage && secondaryImage.startsWith('data:image')) {
      try {
        savedSecondaryImagePath = await saveSketchBase64Image(
          secondaryImage, 
          orderNo, 
          styleId || 'sketch', 
          baseUrl, 
          'secondary'
        );
      } catch (imageError) {
        console.error('Error saving secondary image:', imageError);
      }
    } else if (secondaryImage) {
      savedSecondaryImagePath = secondaryImage;
    }

    // ✅ Check if order already exists
    let existingOrder = await CoverPage.findOne({ orderNo });

    // ✅ Process size range - ensure it's an array
    let processedSizeRange = [];
    if (Array.isArray(sizeRange)) {
      processedSizeRange = sizeRange;
    } else if (typeof sizeRange === 'string') {
      processedSizeRange = sizeRange.split(',').map(s => s.trim()).filter(s => s);
    }

    const sketchTechnicalData = {
      styleId,
      shortDesc,
      department,
      initialDcDate: initialDcDate ? new Date(initialDcDate) : new Date(),
      commodity,
      season,
      vendor3d,
      styleStatus,
      longDescription,
      finalFitApproval,
      sizeRange: processedSizeRange,
      targetCost,
      targetUnits,
      plannedColors,
      deliveryCount,
      fitType,
      coll1,
      coll2,
      retailPrice,
      floorSet: floorSet ? new Date(floorSet) : new Date(),
      sizeCurve,
      orderNo, // ✅ ADD orderNo to the data
      buyerEngName,
      custStyle,
      orderQty,
      originalImage: savedOriginalImagePath || originalImage, // ✅ ADD THIS
      mainSketchImage: savedMainImagePath || mainSketchImage,
      secondaryImage: savedSecondaryImagePath || secondaryImage,
      canvasData: canvasData || [],
      selectedOrderData: selectedOrderData || null, // ✅ ADD THIS
      availableSizes: Array.isArray(availableSizes) ? availableSizes : [],
      createdBy: createdBy || 'system',
      userInfo: userInfo || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };


    if (existingOrder) {
      // ✅ Check if styleId already exists in sketchTechnical array
      const existingStyleIndex = existingOrder.sketchTechnical.findIndex(
        st => st.styleId === styleId
      );

      if (existingStyleIndex !== -1) {
        // ✅ Update existing style
        existingOrder.sketchTechnical[existingStyleIndex] = {
          ...existingOrder.sketchTechnical[existingStyleIndex].toObject(),
          ...sketchTechnicalData,
          _id: existingOrder.sketchTechnical[existingStyleIndex]._id, // Keep original ID
          updatedAt: new Date()
        };
        existingOrder.updatedAt = new Date();
        
        const savedOrder = await existingOrder.save();
        
        return res.status(200).json({
          success: true,
          message: 'Sketch technical data updated successfully',
          data: {
            orderNo: savedOrder.orderNo,
            sketchTechnicalId: savedOrder.sketchTechnical[existingStyleIndex]._id,
            objectId: savedOrder.sketchTechnical[existingStyleIndex]._id,
            totalSketchTechnicals: savedOrder.sketchTechnical.length,
            isUpdate: true
          }
        });
      } else {
        // ✅ Add new style to array
        existingOrder.sketchTechnical.push(sketchTechnicalData);
        existingOrder.updatedAt = new Date();
        
        const savedOrder = await existingOrder.save();
        const newSketch = savedOrder.sketchTechnical[savedOrder.sketchTechnical.length - 1];
        
        return res.status(200).json({
          success: true,
          message: 'Sketch technical data added to existing order successfully',
          data: {
            orderNo: savedOrder.orderNo,
            sketchTechnicalId: newSketch._id,
            objectId: newSketch._id,
            totalSketchTechnicals: savedOrder.sketchTechnical.length,
            isUpdate: false
          }
        });
      }
    } else {
      // ✅ New order - create new record
      const newOrder = new CoverPage({
        orderNo,
        coverPages: [],
        sketchTechnical: [sketchTechnicalData],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedOrder = await newOrder.save();
      const newSketch = savedOrder.sketchTechnical[0];

      return res.status(201).json({
        success: true,
        message: 'New order created with sketch technical data successfully',
        data: {
          orderNo: savedOrder.orderNo,
          sketchTechnicalId: newSketch._id,
          objectId: newSketch._id,
          totalSketchTechnicals: savedOrder.sketchTechnical.length,
          isUpdate: false
        }
      });
    }

  } catch (error) {
    console.error('Error in saveSketchTechnical:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getSketchTechnicalByOrder = async (req, res) => {
  try {
    const { orderNo } = req.params;

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required'
      });
    }

    const orderData = await CoverPage.findOne({ orderNo }).select('sketchTechnical');

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderNo,
        sketchTechnicals: orderData.sketchTechnical
      }
    });

  } catch (error) {
    console.error('Error fetching sketch technical data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateSketchTechnical = async (req, res) => {
  try {
    const { orderNo, sketchTechnicalId } = req.params;
    const updateData = req.body;

    if (!orderNo || !sketchTechnicalId) {
      return res.status(400).json({
        success: false,
        message: 'Order number and sketch technical ID are required'
      });
    }

    const result = await CoverPage.updateOne(
      { 
        orderNo, 
        'sketchTechnical._id': sketchTechnicalId 
      },
      { 
        $set: {
          'sketchTechnical.$.styleId': updateData.styleId,
          'sketchTechnical.$.shortDesc': updateData.shortDesc,
          'sketchTechnical.$.department': updateData.department,
          'sketchTechnical.$.initialDcDate': updateData.initialDcDate ? new Date(updateData.initialDcDate) : undefined,
          'sketchTechnical.$.commodity': updateData.commodity,
          'sketchTechnical.$.season': updateData.season,
          'sketchTechnical.$.vendor3d': updateData.vendor3d,
          'sketchTechnical.$.styleStatus': updateData.styleStatus,
          'sketchTechnical.$.longDescription': updateData.longDescription,
          'sketchTechnical.$.finalFitApproval': updateData.finalFitApproval,
          'sketchTechnical.$.sizeRange': updateData.sizeRange,
          'sketchTechnical.$.targetCost': updateData.targetCost,
          'sketchTechnical.$.targetUnits': updateData.targetUnits,
          'sketchTechnical.$.plannedColors': updateData.plannedColors,
          'sketchTechnical.$.deliveryCount': updateData.deliveryCount,
          'sketchTechnical.$.fitType': updateData.fitType,
          'sketchTechnical.$.coll1': updateData.coll1,
          'sketchTechnical.$.coll2': updateData.coll2,
          'sketchTechnical.$.retailPrice': updateData.retailPrice,
          'sketchTechnical.$.floorSet': updateData.floorSet ? new Date(updateData.floorSet) : undefined,
          'sketchTechnical.$.sizeCurve': updateData.sizeCurve,
          'sketchTechnical.$.orderNo': updateData.orderNo, // ✅ ADD THIS
          'sketchTechnical.$.buyerEngName': updateData.buyerEngName,
          'sketchTechnical.$.custStyle': updateData.custStyle,
          'sketchTechnical.$.orderQty': updateData.orderQty,
          'sketchTechnical.$.originalImage': updateData.originalImage, // ✅ ADD THIS
          'sketchTechnical.$.mainSketchImage': updateData.mainSketchImage,
          'sketchTechnical.$.secondaryImage': updateData.secondaryImage,
          'sketchTechnical.$.canvasData': updateData.canvasData,
          'sketchTechnical.$.selectedOrderData': updateData.selectedOrderData, // ✅ ADD THIS
          'sketchTechnical.$.availableSizes': updateData.availableSizes, // ✅ ADD THIS
          'sketchTechnical.$.updatedAt': new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sketch technical record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sketch technical data updated successfully'
    });

  } catch (error) {
    console.error('Error updating sketch technical data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Additional helper function to get specific sketch technical by ID
export const getSketchTechnicalById = async (req, res) => {
  try {
    const { orderNo, sketchTechnicalId } = req.params;

    if (!orderNo || !sketchTechnicalId) {
      return res.status(400).json({
        success: false,
        message: 'Order number and sketch technical ID are required'
      });
    }

    const orderData = await CoverPage.findOne(
      { orderNo },
      { 'sketchTechnical.$': 1 }
    ).where('sketchTechnical._id').equals(sketchTechnicalId);

    if (!orderData || !orderData.sketchTechnical.length) {
      return res.status(404).json({
        success: false,
        message: 'Sketch technical record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderNo,
        sketchTechnical: orderData.sketchTechnical[0]
      }
    });

  } catch (error) {
    console.error('Error fetching sketch technical by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ✅ Delete sketch technical record
export const deleteSketchTechnical = async (req, res) => {
  try {
    const { orderNo, sketchTechnicalId } = req.params;

    if (!orderNo || !sketchTechnicalId) {
      return res.status(400).json({
        success: false,
        message: 'Order number and sketch technical ID are required'
      });
    }

    const result = await CoverPage.updateOne(
      { orderNo },
      { 
        $pull: { 
          sketchTechnical: { _id: sketchTechnicalId } 
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sketch technical record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sketch technical record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sketch technical:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};