import mongoose, { connect } from 'mongoose';

const messageSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Note: We'll reference your existing user collection
    // but won't enforce the ref since you have your own User model
  },
  message: {
    type: String,
    default: ''
  },
  images: [{
    id: String,
    name: String,
    url: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const feedbackSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: [
      'Quality Control',
      'Inspection Reports', 
      'User Interface',
      'Data Management',
      'Authentication',
      'Dashboard',
      'Export Features',
      'Mobile App',
      'Other'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId
  },
  images: [{
    id: String,
    name: String,
    url: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [messageSchema],
  tags: [String],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
feedbackSchema.index({ authorId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, priority: 1 });
feedbackSchema.index({ module: 1 });
feedbackSchema.index({ lastActivity: -1 });

// Virtual for message count
feedbackSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Update lastActivity when messages are added
feedbackSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

export default (connection) => connection.model('Feedback', feedbackSchema);
