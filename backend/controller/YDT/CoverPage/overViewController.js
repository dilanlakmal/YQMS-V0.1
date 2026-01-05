import {
 CoverPage
} from "../../MongoDB/dbConnectionController.js";
import PDFDocument from 'pdfkit';

// export const getSavedOrders = async (req, res) => {
//   try {
//     const { page = 1, limit = 50, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
//     // Build search query for your schema
//     const searchQuery = search ? {
//       $or: [
//         { orderNo: { $regex: search, $options: 'i' } },
//         { createdBy: { $regex: search, $options: 'i' } },
//         { 'coverPages.customerStyle': { $regex: search, $options: 'i' } },
//         { 'coverPages.poNumber': { $regex: search, $options: 'i' } }
//       ]
//     } : {};

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);
    
//     // Build sort object
//     const sort = {};
//     sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//     // Execute query with enhanced projection for your schema
//     const [orders, total] = await Promise.all([
//       CoverPage.find(searchQuery, {
//         orderNo: 1,
//         createdAt: 1,
//         createdBy: 1,
//         updatedAt: 1,
//         'coverPages.customerStyle': 1,
//         'coverPages.poNumber': 1,
//         'coverPages.quantity': 1,
//         'sketchTechnical.styleStatus': 1
//       })
//         .sort(sort)
//         .skip(skip)
//         .limit(parseInt(limit))
//         .lean(),
//       CoverPage.countDocuments(searchQuery)
//     ]);

//     // Add computed fields based on your schema
//     const enhancedOrders = orders.map(order => ({
//       ...order,
//       formattedCreatedAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : null,
//       formattedUpdatedAt: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : null,
//       // Extract key information from nested data
//       customerStyle: order.coverPages?.[0]?.customerStyle || 'N/A',
//       poNumber: order.coverPages?.[0]?.poNumber || 'N/A',
//       quantity: order.coverPages?.[0]?.quantity ? Number(order.coverPages[0].quantity) : 0,
//       styleStatus: order.sketchTechnical?.[0]?.styleStatus || 'Unknown'
//     }));

//     res.status(200).json({
//       orders: enhancedOrders,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / parseInt(limit)),
//         totalOrders: total,
//         hasNextPage: skip + parseInt(limit) < total,
//         hasPrevPage: parseInt(page) > 1
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching saved orders:', error);
//     res.status(500).json({ 
//       message: 'Server Error', 
//       error: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };

export const getSavedOrdersList = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { orderNo: { $regex: search, $options: 'i' } },
        { createdBy: { $regex: search, $options: 'i' } },
        { 'coverPages.customerStyle': { $regex: search, $options: 'i' } },
        { 'coverPages.poNumber': { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query - only fetch essential fields for the list
    const [orders, total] = await Promise.all([
      CoverPage.find(searchQuery, {
        orderNo: 1,
        createdAt: 1,
        createdBy: 1,
        updatedAt: 1,
        'coverPages.customerStyle': 1,
        'coverPages.poNumber': 1,
        'coverPages.quantity': 1,
      })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CoverPage.countDocuments(searchQuery)
    ]);

    // Format the response
    const enhancedOrders = orders.map(order => ({
      _id: order._id,
      orderNo: order.orderNo,
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      updatedAt: order.updatedAt,
      formattedCreatedAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : null,
      formattedUpdatedAt: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : null,
      customerStyle: order.coverPages?.[0]?.customerStyle || 'N/A',
      poNumber: order.coverPages?.[0]?.poNumber || 'N/A',
      quantity: order.coverPages?.[0]?.quantity ? Number(order.coverPages[0].quantity) : 0,
    }));

    res.status(200).json({
      success: true,
      orders: enhancedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching saved orders list:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getCoverPageOverview = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const record = await CoverPage.findById(id);
    
    if (!record) {
      return res.status(404).json({ message: 'Cover Page record not found' });
    }

    // Enhanced record processing for your schema
    const enhancedRecord = {
      ...record.toObject(),
      totalPages: 19,
      completedPages: 0,
      processingPages: 0,
      pendingPages: 0,
      overallProgress: 0
    };

    // Define all possible page keys based on your schema
    const pageKeys = [
      'coverPages', 
      'sketchTechnical',
      ...Array.from({ length: 17 }, (_, i) => `page${i + 3}Array`)
    ];

    // Calculate statistics based on your data structure
    pageKeys.forEach(key => {
      const pageData = enhancedRecord[key];
      if (!pageData || pageData.length === 0) {
        enhancedRecord.pendingPages++;
      } else {
        // Check for processing status in your schema
        const isProcessing = pageData.some(item => 
          item.status === 'processing' || 
          item.status === 'In Work' ||
          item.styleStatus === 'In Work' ||
          !item.status
        );
        
        if (isProcessing) {
          enhancedRecord.processingPages++;
        } else {
          enhancedRecord.completedPages++;
        }
      }
    });

    enhancedRecord.overallProgress = Math.round(
      (enhancedRecord.completedPages / enhancedRecord.totalPages) * 100
    );

    res.status(200).json(enhancedRecord);
  } catch (error) {
    console.error('Error fetching cover page overview:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const downloadCoverSheetPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const record = await CoverPage.findById(id);
    
    if (!record) {
      return res.status(404).json({ message: 'Cover Page record not found' });
    }

    // Create enhanced PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Cover Sheet - Order ${record.orderNo}`,
        Author: 'YDT System',
        Subject: 'Cover Page Overview',
        Keywords: 'cover sheet, order, overview, technical specifications'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cover-sheet-${record.orderNo}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Enhanced PDF header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('COVER SHEET OVERVIEW', { align: 'center' })
       .moveDown();

    // Order information section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(`Order Number: ${record.orderNo}`, 50, doc.y)
       .fontSize(12)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleDateString()}`, 50, doc.y + 5)
       .text(`Created: ${record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}`, 50, doc.y + 5)
       .text(`Created By: ${record.createdBy || 'N/A'}`, 50, doc.y + 5)
       .moveDown(2);

    // Cover Pages Section
    if (record.coverPages && record.coverPages.length > 0) {
      const coverData = record.coverPages[0];
      
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('COVER PAGE INFORMATION', 50, doc.y)
         .moveDown();

      doc.fontSize(12)
         .font('Helvetica')
         .text(`PO Number: ${coverData.poNumber || 'N/A'}`, 70, doc.y)
         .text(`Customer Style: ${coverData.customerStyle || 'N/A'}`, 70, doc.y + 5)
         .text(`Quantity: ${coverData.quantity ? Number(coverData.quantity).toLocaleString() : 'N/A'}`, 70, doc.y + 5)
         .text(`Retail Single: ${coverData.retailSingle || 'N/A'}`, 70, doc.y + 5)
         .text(`Major Points: ${coverData.majorPoints || 'N/A'}`, 70, doc.y + 5)
         .moveDown();

      // Style Table Information
      if (coverData.styleTable && coverData.styleTable.length > 0) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Style Table:', 70, doc.y)
           .moveDown(0.5);

        coverData.styleTable.forEach((style, index) => {
          if (doc.y > 700) doc.addPage();
          
          doc.fontSize(10)
             .font('Helvetica')
             .text(`${index + 1}. Order: ${style.orderNo}, Style: ${style.customerStyle}, PO: ${style.poNumber}`, 90, doc.y)
             .text(`   Colors: ${style.colors ? style.colors.join(', ') : 'N/A'}`, 90, doc.y + 5)
             .text(`   Quantity: ${style.quantity || 'N/A'}`, 90, doc.y + 5)
             .moveDown(0.5);
        });
      }

      // Size Table Information
      if (coverData.sizeTable && coverData.sizeTable.length > 0) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Size Information:', 70, doc.y)
           .moveDown(0.5);

        coverData.sizeTable.forEach((sizeInfo, index) => {
          if (doc.y > 700) doc.addPage();
          
          doc.fontSize(10)
             .font('Helvetica')
             .text(`${index + 1}. Total Qty: ${sizeInfo.orderTotalQty ? sizeInfo.orderTotalQty.toLocaleString() : 'N/A'}`, 90, doc.y)
             .text(`   Sizes: ${sizeInfo.sizes ? sizeInfo.sizes.join(', ') : 'N/A'}`, 90, doc.y + 5)
             .text(`   Colors: ${sizeInfo.colors ? sizeInfo.colors.join(', ') : 'N/A'}`, 90, doc.y + 5)
             .moveDown(0.5);
        });
      }
    }

    // Sketch Technical Section
    if (record.sketchTechnical && record.sketchTechnical.length > 0) {
      const sketchData = record.sketchTechnical[0];
      
      if (doc.y > 600) doc.addPage();
      
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('TECHNICAL SPECIFICATIONS', 50, doc.y)
         .moveDown();

      doc.fontSize(12)
         .font('Helvetica')
         .text(`Style ID: ${sketchData.styleId || 'N/A'}`, 70, doc.y)
         .text(`Department: ${sketchData.department || 'N/A'}`, 70, doc.y + 5)
         .text(`Status: ${sketchData.styleStatus || 'N/A'}`, 70, doc.y + 5)
         .text(`Target Cost: $${sketchData.targetCost || 'N/A'}`, 70, doc.y + 5)
         .text(`Retail Price: $${sketchData.retailPrice || 'N/A'}`, 70, doc.y + 5)
         .text(`Fit Type: ${sketchData.fitType || 'N/A'}`, 70, doc.y + 5)
         .text(`Size Range: ${sketchData.sizeRange ? sketchData.sizeRange.join(', ') : 'N/A'}`, 70, doc.y + 5)
         .moveDown();

      // Customer Information
      if (sketchData.selectedOrderData) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Customer Information:', 70, doc.y)
           .fontSize(12)
           .font('Helvetica')
           .text(`Customer: ${sketchData.selectedOrderData.engName || 'N/A'}`, 90, doc.y + 5)
           .text(`Country: ${sketchData.selectedOrderData.country || 'N/A'}`, 90, doc.y + 5)
           .text(`Currency: ${sketchData.selectedOrderData.currency || 'N/A'}`, 90, doc.y + 5)
           .text(`Mode: ${sketchData.selectedOrderData.mode || 'N/A'}`, 90, doc.y + 5)
           .moveDown();
      }
    }

    // Summary section
    const pageKeys = [
      'coverPages', 
      'sketchTechnical',
      ...Array.from({ length: 17 }, (_, i) => `page${i + 3}Array`)
    ];

    let completedPages = 0;
    let processingPages = 0;
    let pendingPages = 0;

    pageKeys.forEach(key => {
      const pageData = record[key];
      if (!pageData || pageData.length === 0) {
        pendingPages++;
      } else {
        const isProcessing = pageData.some(item => 
          item.status === 'processing' || 
          item.status === 'In Work' ||
          item.styleStatus === 'In Work' ||
          !item.status
        );
        
        if (isProcessing) {
          processingPages++;
        } else {
          completedPages++;
        }
      }
    });

    const overallProgress = Math.round((completedPages / pageKeys.length) * 100);

    if (doc.y > 650) doc.addPage();

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('SUMMARY', 50, doc.y)
       .moveDown();

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Total Pages: ${pageKeys.length}`, 70, doc.y)
       .text(`Completed: ${completedPages}`, 70, doc.y + 5)
       .text(`Processing: ${processingPages}`, 70, doc.y + 5)
       .text(`Pending: ${pendingPages}`, 70, doc.y + 5)
       .text(`Overall Progress: ${overallProgress}%`, 70, doc.y + 5)
       .moveDown(2);

    // Add footer to all pages
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .font('Helvetica')
         .text(`Page ${i + 1} of ${pageCount}`, 50, 750, { align: 'center' })
         .text(`Generated on ${new Date().toLocaleString()}`, 50, 760, { align: 'center' })
         .text(`Order: ${record.orderNo}`, 50, 770, { align: 'center' });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      message: 'Error generating PDF', 
      error: error.message 
    });
  }
};
