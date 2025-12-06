import { 
  DtOrder,
  CoverPage,
 } from "../../MongoDB/dbConnectionController.js";
 import { 
  processImageBuffer, 
  validateImageBuffer,
} from "../../../helpers/helperFunctions.js";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { __backendDir } from "../../../Config/appConfig.js";
import { Buffer } from "buffer";


// Helper function to save base64 image
const saveBase64Image = async (base64Data, orderNo, poNumber, baseUrl) => {
  try {
    if (!base64Data) return null;

    console.log('Processing base64 image for:', orderNo, poNumber);

    // Extract the base64 data and file extension
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }

    const fileExtension = matches[1];
    const imageData = matches[2];
    
    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // Validate buffer size
    const validation = validateImageBuffer(buffer, 5);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Generate unique filename
    const fileName = `${orderNo}_${poNumber}_${uuidv4()}.${fileExtension}`;
    
    console.log('Saving base64 image as:', fileName);
    
    // Use your existing processImageBuffer helper (this saves to filesystem)
    const relativePath = await processImageBuffer(buffer, fileName, 'coverpage');
    
    // Create full URL for database storage
    const fullUrl = `${baseUrl}${relativePath}`;
    
    console.log('Base64 image saved with full URL:', fullUrl);
    
    return fullUrl; // Return full URL instead of relative path
    
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

// Helper function to save uploaded file buffer
const saveImageBuffer = async (buffer, originalName, orderNo, poNumber, baseUrl) => {
  try {
    console.log('Processing uploaded file for:', orderNo, poNumber);

    // Validate buffer size
    const validation = validateImageBuffer(buffer, 5);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Get file extension
    const fileExtension = path.extname(originalName).toLowerCase();
    
    // Generate unique filename
    const fileName = `${orderNo}_${poNumber}_${uuidv4()}${fileExtension}`;
    
    console.log('Saving uploaded file as:', fileName);
    
    // Use your existing processImageBuffer helper (this saves to filesystem)
    const relativePath = await processImageBuffer(buffer, fileName, 'coverpage');
    
    // Create full URL for database storage
    const fullUrl = `${baseUrl}${relativePath}`;
    
    console.log('Uploaded file saved with full URL:', fullUrl);
    
    return fullUrl; // Return full URL instead of relative path
    
  } catch (error) {
    console.error('Error saving image buffer:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

// Update the delete function to handle full URLs
const deleteImageFile = (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    // Extract relative path from full URL
    let relativePath;
    if (imageUrl.startsWith('http')) {
      // Extract path from full URL
      const url = new URL(imageUrl);
      relativePath = url.pathname;
    } else {
      // Already a relative path
      relativePath = imageUrl;
    }
    
    // Convert to actual file path
    const fileName = path.basename(relativePath);
    const filePath = path.join(__backendDir, 'public', relativePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Image deleted: ${fileName}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};


// Helper function to get full image URL
const getImageUrl = (imagePath, baseUrl) => {
  if (!imagePath) return null;
  return `${baseUrl}${imagePath}`;
};

export const searchOrderNo = async (req, res) => {
  try {
    const { term } = req.query;
    
    
    // Add validation for search term
    if (!term || term.length < 2) {
      return res.json([]);
    }
    
    // Check if DtOrder is properly initialized
    if (!DtOrder) {
      return res.status(500).json({ 
        error: 'Database connection error',
        message: 'DtOrder model is not initialized' 
      });
    }

    let orders;
    
    try {
      
      // Improved search - works with both letters and numbers
      const searchTerm = term.trim();
      
      // Create multiple search patterns
      const searchQueries = [
        // Exact prefix match (case insensitive)
        { Order_No: { $regex: `^${searchTerm}`, $options: 'i' } },
        // Contains search (case insensitive)
        { Order_No: { $regex: searchTerm, $options: 'i' } },
        // Search in customer style as well
        { CustStyle: { $regex: searchTerm, $options: 'i' } }
      ];
      
      // Use $or to search multiple fields
      orders = await DtOrder.find({
        $or: searchQueries
      })
      .limit(10)
      .lean();
      
      // If no results with the above search, try a more flexible search
      if (orders.length === 0) {
        
        // Remove special characters and search
        const cleanTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, '');
        
        orders = await DtOrder.find({
          $or: [
            { Order_No: { $regex: cleanTerm, $options: 'i' } },
            { CustStyle: { $regex: cleanTerm, $options: 'i' } },
            { Factory: { $regex: cleanTerm, $options: 'i' } }
          ]
        })
        .limit(10)
        .lean();
        
      }
      
    } catch (queryError) {
      return res.status(500).json({ 
        error: 'Database query failed',
        message: queryError.message,
        details: queryError.toString()
      });
    }

    // Check if orders exist
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    const suggestions = orders.map((order, index) => {
      try {

        return {
          id: order._id,
          orderNo: order.Order_No,
          customerStyle: order.CustStyle,
          // orderNo: order.Order_No,
          quantity: order.TotalQty,
          colors: order.OrderColors ? order.OrderColors.map(color => color.Color) : [],
          sizes: order.SizeList || [],
          originalData: order
        };
      } catch (docError) {
        console.error(`❌ Error processing document ${index}:`, docError);
        return null;
      }
    }).filter(suggestion => suggestion !== null);

    res.json(suggestions);

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    // Check if DtOrder is properly initialized
    if (!DtOrder) {
      return res.status(500).json({ 
        error: 'Database connection error',
        message: 'DtOrder model is not initialized' 
      });
    }

    let order;
    
    try {
      // Use Mongoose syntax
      order = await DtOrder.findOne({
        Order_No: orderNo.toUpperCase()
      }).lean();
      
    } catch (queryError) {
      console.error('MongoDB query error:', queryError);
      return res.status(500).json({ 
        error: 'Database query failed',
        message: queryError.message 
      });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderData = {
      id: order._id,
      orderNo: order.Order_No,
      customerStyle: order.CustStyle,
      // orderNo: order.Order_No,
      quantity: order.TotalQty,
      colors: order.OrderColors ? order.OrderColors.map(color => color.Color) : [],
      sizes: order.SizeList || [],
      country: order.Country,
      currency: order.Ccy,
      custCode: order.Cust_Code,
      engName: order.EngName,
      mode: order.Mode,
      origin: order.Origin,
      originalData: order
    };

    res.json(orderData);

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order details',
      message: error.message 
    });
  }
};
export const saveCoverPageData = async (req, res) => {
  try {
    const {
      orderNo,
      customerStyle,
      poNumber,
      quantity,
      retailSingle,
      majorPoints,
      testInstructions, 
      uploadedImage,
      styleTable,
      sizeTable,
      stampData,
      createdBy
    } = req.body;

    // Validation
    if (!orderNo || !customerStyle || !poNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Order No, Customer Style, and PO Number are required'
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yqms.yaikh.com' 
      : `${req.protocol}://${req.get('host')}`;

    // Handle image upload - support both file upload and base64
    let savedImagePath = null;
    
    // Check if there's a file uploaded via multer
    if (req.file) {
      try {
        const validation = validateImageBuffer(req.file.buffer, 5);
        if (!validation.isValid) {
          return res.status(400).json({
            error: 'Invalid image',
            message: validation.error
          });
        }
        savedImagePath = await saveImageBuffer(
          req.file.buffer, 
          req.file.originalname, 
          orderNo, 
          poNumber,
          baseUrl 
        );
      } catch (imageError) {
        return res.status(400).json({
          error: 'Image upload failed',
          message: imageError.message
        });
      }
    }
    // Check if there's base64 image data
    else if (uploadedImage) {
      try {
        savedImagePath = await saveBase64Image(uploadedImage, orderNo, poNumber, baseUrl);
      } catch (imageError) {
        return res.status(400).json({
          error: 'Image upload failed',
          message: imageError.message
        });
      }
    }

    // Process sizeTable and styleTable (keep your existing logic)
    let processedSizeTable = [];
    if (sizeTable && Array.isArray(sizeTable) && sizeTable.length > 0) {
      processedSizeTable = sizeTable.map(item => {
        const processedItem = {
          orderTotalQty: item.orderTotalQty || 0,
          sizeDetails: item.sizeDetails || '',
          sizes: [],
          colors: []
        };
        if (item.sizes && Array.isArray(item.sizes)) {
          processedItem.sizes = item.sizes;
        }
        if (item.colors && Array.isArray(item.colors)) {
          processedItem.colors = item.colors;
        }
        return processedItem;
      });
    }

    let processedStyleTable = [];
    if (styleTable && Array.isArray(styleTable) && styleTable.length > 0) {
      processedStyleTable = styleTable.map(item => ({
        orderNo: item.orderNo || orderNo,
        customerStyle: item.customerStyle || customerStyle,
        poNumber: item.poNumber || poNumber,
        colors: Array.isArray(item.colors) ? item.colors : [],
        quantity: item.quantity || 0,
        remarks: item.remarks || ''
      }));
    }

    // ✅ UPDATED: Create the cover page item data with proper HTML handling
    const coverPageItem = {
      poNumber,
      customerStyle,
      quantity: quantity || '',
      retailSingle: retailSingle || '',
      majorPoints: majorPoints || '',
      testInstructions: testInstructions || '', 
      testInstructionsHtml: testInstructions || '', 
      uploadedImage: savedImagePath,
      styleTable: processedStyleTable,
      sizeTable: processedSizeTable,
      stampData: {
        name: stampData?.name || '',
        date: stampData?.date ? new Date(stampData.date) : new Date()
      },
      createdBy: createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Find existing order record or create new one
    let orderRecord = await CoverPage.findOne({ orderNo: orderNo });
    let oldImagePath = null;

    if (orderRecord) {
      const existingCoverPageIndex = orderRecord.coverPages.findIndex(
        cp => cp.poNumber === poNumber
      );

      if (existingCoverPageIndex !== -1) {
        oldImagePath = orderRecord.coverPages[existingCoverPageIndex].uploadedImage;
        
        orderRecord.coverPages[existingCoverPageIndex] = {
          ...orderRecord.coverPages[existingCoverPageIndex].toObject(),
          ...coverPageItem,
          updatedAt: new Date()
        };
      } else {
        orderRecord.coverPages.push(coverPageItem);
      }
      orderRecord.updatedAt = new Date();
      await orderRecord.save();
    } else {
      orderRecord = new CoverPage({
        orderNo,
        coverPages: [coverPageItem]
      });
      await orderRecord.save();
    }

    // Delete old image if it was replaced
    if (oldImagePath && savedImagePath && oldImagePath !== savedImagePath) {
      deleteImageFile(oldImagePath);
    }

    const responseData = {
      ...coverPageItem,
      uploadedImage: savedImagePath ? getImageUrl(savedImagePath, baseUrl) : null
    };

    res.status(200).json({
      success: true,
      message: 'Cover page saved successfully',
      data: {
        orderNo: orderRecord.orderNo,
        totalCoverPages: orderRecord.coverPages.length,
        savedCoverPage: responseData,
        orderRecord: orderRecord
      }
    });

  } catch (error) {
    console.error('Error saving cover page data:', error);
    res.status(500).json({
      error: 'Failed to save cover page data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getCoverPageData = async (req, res) => {
  try {
    const { orderNo, poNumber } = req.params;

    if (!orderNo) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Order No is required'
      });
    }

    const orderRecord = await CoverPage.findOne({ orderNo: orderNo }).lean();

    if (!orderRecord) {
      return res.status(404).json({
        error: 'Order not found',
        message: `No cover pages found for Order No: ${orderNo}`
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (poNumber && poNumber !== 'undefined') {
      const specificCoverPage = orderRecord.coverPages.find(
        cp => cp.poNumber === poNumber
      );

      if (!specificCoverPage) {
        return res.status(404).json({
          error: 'Cover page not found',
          message: `No cover page found for Order No: ${orderNo} and PO: ${poNumber}`
        });
      }

      const coverPageWithImageUrl = {
        ...specificCoverPage,
        uploadedImage: specificCoverPage.uploadedImage ? getImageUrl(specificCoverPage.uploadedImage, baseUrl) : null
      };

      return res.status(200).json({
        success: true,
        data: {
          orderNo: orderRecord.orderNo,
          coverPage: coverPageWithImageUrl,
          totalCoverPages: orderRecord.coverPages.length
        }
      });
    }

    const coverPagesWithImageUrls = orderRecord.coverPages.map(cp => ({
      ...cp,
      uploadedImage: cp.uploadedImage ? getImageUrl(cp.uploadedImage, baseUrl) : null
    }));

    res.status(200).json({
      success: true,
      data: {
        orderNo: orderRecord.orderNo,
        coverPages: coverPagesWithImageUrls,
        totalCoverPages: orderRecord.coverPages.length,
        createdAt: orderRecord.createdAt,
        updatedAt: orderRecord.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching cover page data:', error);
    res.status(500).json({
      error: 'Failed to fetch cover page data',
      message: error.message
    });
  }
};

export const getAllCoverPages = async (req, res) => {
  try {
    const { page = 1, limit = 10, orderNo, poNumber } = req.query;

    // Build query
    let query = {};
    if (orderNo) {
      query.orderNo = { $regex: orderNo, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with cover pages
    let orderRecords = await CoverPage.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // If PO number filter is specified, filter cover pages within each order
    if (poNumber) {
      orderRecords = orderRecords.map(order => ({
        ...order,
        coverPages: order.coverPages.filter(cp => 
          cp.poNumber.toLowerCase().includes(poNumber.toLowerCase())
        )
      })).filter(order => order.coverPages.length > 0);
    }

    // Get total count for pagination
    const totalCount = await CoverPage.countDocuments(query);

    // Calculate total cover pages across all orders
    const totalCoverPages = orderRecords.reduce((sum, order) => sum + order.coverPages.length, 0);

    res.status(200).json({
      success: true,
      data: orderRecords,
      summary: {
        totalOrders: orderRecords.length,
        totalCoverPages: totalCoverPages
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching cover pages:', error);
    res.status(500).json({
      error: 'Failed to fetch cover pages',
      message: error.message
    });
  }
};

export const deleteCoverPage = async (req, res) => {
  try {
    const { orderNo, poNumber } = req.params;

    if (!orderNo || !poNumber) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Order No and PO Number are required'
      });
    }

    const orderRecord = await CoverPage.findOne({ orderNo: orderNo });

    if (!orderRecord) {
      return res.status(404).json({
        error: 'Order not found',
        message: `No order found with Order No: ${orderNo}`
      });
    }

    const coverPageIndex = orderRecord.coverPages.findIndex(
      cp => cp.poNumber === poNumber
    );

    if (coverPageIndex === -1) {
      return res.status(404).json({
        error: 'Cover page not found',
        message: `No cover page found with PO Number: ${poNumber} in Order: ${orderNo}`
      });
    }

    const deletedCoverPage = orderRecord.coverPages[coverPageIndex];
    
    // Delete associated image file
    if (deletedCoverPage.uploadedImage) {
      deleteImageFile(deletedCoverPage.uploadedImage);
    }

    orderRecord.coverPages.splice(coverPageIndex, 1);

    if (orderRecord.coverPages.length === 0) {
      await CoverPage.findByIdAndDelete(orderRecord._id);

      return res.status(200).json({
        success: true,
        message: 'Cover page and order record deleted successfully (no cover pages remaining)',
        data: {
          deletedCoverPage,
          orderDeleted: true
        }
      });
    } else {
      orderRecord.updatedAt = new Date();
      await orderRecord.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cover page deleted successfully',
      data: {
        deletedCoverPage,
        remainingCoverPages: orderRecord.coverPages.length,
        orderDeleted: false
      }
    });

  } catch (error) {
    console.error('Error deleting cover page:', error);
    res.status(500).json({
      error: 'Failed to delete cover page',
      message: error.message
    });
  }
};

// New function to get all cover pages for a specific order
export const getCoverPagesByOrder = async (req, res) => {
  try {
    const { orderNo } = req.params;

    if (!orderNo) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Order No is required'
      });
    }

    const orderRecord = await CoverPage.findOne({ orderNo: orderNo }).lean();

    if (!orderRecord) {
      return res.status(404).json({
        error: 'Order not found',
        message: `No cover pages found for Order No: ${orderNo}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNo: orderRecord.orderNo,
        coverPages: orderRecord.coverPages,
        totalCoverPages: orderRecord.coverPages.length,
        createdAt: orderRecord.createdAt,
        updatedAt: orderRecord.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching cover pages by order:', error);
    res.status(500).json({
      error: 'Failed to fetch cover pages',
      message: error.message
    });
  }
};

export const uploadCoverPageImageHandler = async (req, res) => {
  try {
    const { orderNo, poNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please select an image file to upload'
      });
    }

    if (!orderNo || !poNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Order No and PO Number are required'
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yqms.yaikh.com' 
      : `${req.protocol}://${req.get('host')}`;

    // Validate buffer using your existing helper
    const validation = validateImageBuffer(req.file.buffer, 5);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid image',
        message: validation.error
      });
    }

    // Save the image using your existing helper
    const savedImagePath = await saveImageBuffer(
      req.file.buffer,
      req.file.originalname,
      orderNo,
      poNumber,
      baseUrl
    );

    // Get base URL for image response
    // const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullImageUrl = getImageUrl(savedImagePath, baseUrl);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imagePath: savedImagePath,
        imageUrl: fullImageUrl,
        fileName: path.basename(savedImagePath),
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }
};
