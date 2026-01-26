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
    
    // Use your existing processImageBuffer helper (this saves to filesystem)
    const relativePath = await processImageBuffer(buffer, fileName, 'coverpage');
    
    // Create full URL for database storage
    const fullUrl = `${baseUrl}${relativePath}`;
    
    return fullUrl; // Return full URL instead of relative path
    
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

// Helper function to save uploaded file buffer
const saveImageBuffer = async (buffer, originalName, orderNo, poNumber, baseUrl) => {
  try {

    // Validate buffer size
    const validation = validateImageBuffer(buffer, 5);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Get file extension
    const fileExtension = path.extname(originalName).toLowerCase();
    
    // Generate unique filename
    const fileName = `${orderNo}_${poNumber}_${uuidv4()}${fileExtension}`;
    
    
    // Use your existing processImageBuffer helper (this saves to filesystem)
    const relativePath = await processImageBuffer(buffer, fileName, 'coverpage');
    
    // Create full URL for database storage
    const fullUrl = `${baseUrl}${relativePath}`;
    
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

    const searchPatterns = [
      { Order_No: { $regex: term, $options: 'i' } },
      { Cust_Code: { $regex: term, $options: 'i' } },
      { CustStyle: { $regex: term, $options: 'i' } }
    ];

    const orders = await DtOrder.find({ $or: searchPatterns })
      .limit(10)
      .lean();

    const suggestions = orders.map((order, index) => {
      try {
        return {
          orderNo: order.Order_No,
          customerStyle: order.CustStyle,
          customerCode: order.Cust_Code,
          quantity: order.TotalQty,
          colors: order.OrderColors ? order.OrderColors.map(c => c.Color) : []
        };
      } catch (docError) {
        console.error(`❌ Error processing document ${index}:`, docError);
        return null;
      }
    }).filter(suggestion => suggestion !== null);

    res.json(suggestions);

  } catch (error) {
    console.error('Error fetching order suggestions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderNo } = req.params;

    // Find order by Order_No
    const order = await DtOrder.findOne({ Order_No: orderNo.toUpperCase() }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ensure colorBreakdown is always an array (even if empty)
    const colorBreakdown = order.OrderColors && Array.isArray(order.OrderColors)
      ? order.OrderColors.map(color => {
        const sizes = {};
        let colorTotal = 0;

        if (color.OrderQty && Array.isArray(color.OrderQty)) {
          color.OrderQty.forEach(sizeObj => {
            if (typeof sizeObj === 'object' && sizeObj !== null) {
              Object.keys(sizeObj).forEach(key => {
                const cleanKey = key.split(';')[0].trim();
                const val = Number(sizeObj[key]);
                if (!isNaN(val)) {
                  sizes[cleanKey] = val;
                  colorTotal += val;
                }
              });
            }
          });
        }

        return {
          colorCode: color.ColorCode || 'N/A',
          colorName: color.Color || 'Unknown Color',
          chineseColor: color.ChnColor || '',
          sizes: sizes,
          colorTotal: colorTotal
        };
      })
      : [];

    // Ensure sizeList is always an array (even if empty)
    const sizeList = order.SizeList && Array.isArray(order.SizeList) && order.SizeList.length > 0
      ? order.SizeList
      : ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']; // Default sizes if none found

    // Format the response data
    const orderDetails = {
      orderNo: order.Order_No,
      companyName: order.EngName || 'Yorkmars (cambodia) Garment MFG. Co. Ltd.',
      cust_Code: order.Cust_Code || 'N/A',
      customerCode: order.Cust_Code || 'N/A',
      customerStyle: order.CustStyle || 'N/A',
      totalQuantity: order.TotalQty || 0,
      orderDate: order.createdAt,
      exFactoryDate: order.updatedAt,
      customerPO: order.CustPORef || '',
      season: order.Season || '',
      countryOfOrigin: order.Origin || '',
      
      // Product details
      productDescription: order.Style || '',
      
      // Colors and sizes breakdown - ALWAYS arrays
      colorBreakdown: colorBreakdown,
      sizeList: sizeList,
      sizeSpec: order.SizeSpec || [],
      
      // Additional order information
      currency: order.Ccy || '',
      country: order.Country || '',
      factory: order.Factory || '',
      mode: order.Mode || '',
      shortName: order.ShortName || '',
      
      // Shipment information (if available)
      shipmentDetails: order.OrderColorShip ? order.OrderColorShip.map(colorShip => ({
        colorCode: colorShip.ColorCode,
        shipments: colorShip.ShipSeqNo.map(ship => ({
          seqNo: ship.seqNo,
          shipId: ship.Ship_ID,
          sizes: ship.sizes.reduce((sizeObj, size) => {
            const sizeKey = Object.keys(size)[0].split(';')[0].trim();
            const sizeValue = Object.values(size)[0];
            sizeObj[sizeKey] = sizeValue || 0;
            return sizeObj;
          }, {})
        }))
      })) : []
    };

    res.status(200).json({
      success: true,
      data: orderDetails
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message
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
      createdBy,
      status = 'draft'
    } = req.body;

    // Validation - only require essential fields
    if (!orderNo || !customerStyle || !poNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Order No, Customer Style, and PO Number are required'
      });
    }

    // Validate status if provided
    const validStatuses = ['draft', 'submitted', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yqms.yaikh.com' 
      : `${req.protocol}://${req.get('host')}`;

    // Handle image upload (existing code)
    let savedImagePath = null;
    
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

    // ✅ UPDATED: Process sizeTable - handle null/undefined/empty
    let processedSizeTable = [];
    if (sizeTable && Array.isArray(sizeTable) && sizeTable.length > 0) {
      processedSizeTable = sizeTable
        .filter(item => item && (item.orderTotalQty || item.sizeDetails || (item.sizes && item.sizes.length > 0) || (item.colors && item.colors.length > 0)))
        .map(item => {
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

    // ✅ UPDATED: Process styleTable - handle null/undefined/empty
    let processedStyleTable = [];
    if (styleTable && Array.isArray(styleTable) && styleTable.length > 0) {
      processedStyleTable = styleTable
        .filter(item => item && (item.orderNo || item.customerStyle || item.poNumber || (item.colors && item.colors.length > 0) || item.quantity))
        .map(item => ({
          orderNo: item.orderNo || orderNo,
          customerStyle: item.customerStyle || customerStyle,
          poNumber: item.poNumber || poNumber,
          colors: Array.isArray(item.colors) ? item.colors : [],
          quantity: item.quantity || 0,
          remarks: item.remarks || ''
        }));
    }

    // ✅ UPDATED: Create the cover page item data with nullable tables
    const coverPageItem = {
      poNumber,
      customerStyle,
      quantity: quantity || '',
      retailSingle: retailSingle || '',
      majorPoints: majorPoints || '',
      testInstructions: testInstructions || '', 
      testInstructionsHtml: testInstructions || '', 
      uploadedImage: savedImagePath,
      status: status,
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

    // Rest of the save logic remains the same...
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
      message: `Cover page ${status === 'submitted' ? 'submitted' : 'saved'} successfully`,
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
