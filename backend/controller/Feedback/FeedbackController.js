// controllers/feedbackController.js
import { Feedback } from "../../controller/MongoDB/dbConnectionController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {  __dirname } from "../../Config/appConfig.js";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'feedback-images');
    try {
      await fs.promises.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `feedback-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed'));
    }
  }
});

// Helper to get auth user details
const getAuthUser = async (req) => {
  // Check if user is authenticated via middleware
  if (!req.userId) {
    throw new Error('User not authenticated');
  }
  
  // Import UserMain here to avoid circular dependency
  const { UserMain } = await import("../MongoDB/dbConnectionController.js");
  
  // Fetch user details from database
  const user = await UserMain.findById(req.userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    userId: user._id.toString(),
    userName: user.eng_name || user.name,
    isAdmin: user.roles?.includes('admin') || false
  };
};

// Create new feedback
export const createFeedback = async (req, res) => {
  try {
    const { module, title, comment, priority = 'medium' } = req.body;
    
    // Get authenticated user
    const { userId, userName } = await getAuthUser(req);

    // Validate required fields
    if (!module || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Module, title, and comment are required'
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.originalname,
          url: `/uploads/feedback-images/${file.filename}`,
          size: file.size
        });
      }
    }

    const feedback = new Feedback({
      module,
      title,
      comment,
      priority,
      author: userName,
      authorId: userId,
      images,
      status: 'open'
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    
    // Handle authentication errors
    if (error.message === 'User not authenticated') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create feedback',
      error: error.message
    });
  }
};

// Get user's submitted feedbacks
export const getUserFeedbacks = async (req, res) => {
  try {
    // Fetch all feedbacks, not just for the authenticated user
    const feedbacks = await Feedback.find({})
      .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: feedbacks
    });

  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message
    });
  }
};

// Get all feedbacks with pagination and filters
export const getFeedbacks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      module,
      authorId,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (module) filter.module = module;
    if (authorId) filter.authorId = authorId;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await Feedback.find(filter)
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message
    });
  }
};

// Get single feedback by ID
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Add message to feedback
export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const { userId, userName, isAdmin } = await getAuthUser(req);
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.originalname,
          url: `/uploads/feedback-images/${file.filename}`,
          size: file.size
        });
      }
    }

    if (!message?.trim() && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content or images are required'
      });
    }

    const newMessage = {
      author: userName,
      authorId: userId,
      message: message?.trim() || '',
      images,
      isAdmin,
      timestamp: new Date()
    };

    feedback.messages.push(newMessage);
    feedback.lastActivity = new Date();
    
    await feedback.save();

    const addedMessage = feedback.messages[feedback.messages.length - 1];

    res.json({
      success: true,
      message: 'Message added successfully',
      data: addedMessage
    });

  } catch (error) {
    console.error('Error adding message:', error);
    if (error.message.includes('authenticated') || error.message.includes('User not found')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to post a message'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message
    });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { message } = req.body;

    const { userId } = await getAuthUser(req);
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const messageToEdit = feedback.messages.id(messageId);
    if (!messageToEdit) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message
    if (messageToEdit.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    messageToEdit.message = message.trim();
    messageToEdit.edited = true;
    messageToEdit.editedAt = new Date();
    feedback.lastActivity = new Date();

    await feedback.save();

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: messageToEdit
    });

  } catch (error) {
    console.error('Error editing message:', error);
    if (error.message.includes('authenticated') || error.message.includes('User not found')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to edit a message'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: error.message
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;

    const { userId } = await getAuthUser(req);
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const messageToDelete = feedback.messages.id(messageId);
    if (!messageToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message
    if (messageToDelete.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    feedback.messages.pull(messageId);
    feedback.lastActivity = new Date();

    await feedback.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    if (error.message.includes('authenticated') || error.message.includes('User not found')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to delete a message'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

// Update feedback status (Admin only)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;
    const { userId, isAdmin } = await getAuthUser(req);

    // Only admins can update status
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update feedback status'
      });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Update status
    if (status) {
      feedback.status = status;
      if (status === 'resolved' || status === 'closed') {
        feedback.resolvedAt = new Date();
        feedback.resolvedBy = userId;
      }
    }

    // Update assigned user
    if (assignedTo) {
      feedback.assignedTo = assignedTo;
    }

    feedback.lastActivity = new Date();
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });

  } catch (error) {
    console.error('Error updating feedback status:', error);
    
    // Handle authentication errors
    if (error.message === 'User not authenticated' || error.message === 'User not found') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: error.message
    });
  }
};

// Get feedback statistics
export const getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    const moduleStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
          high: 0, medium: 0, low: 0
        },
        byModule: moduleStats
      }
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
};
