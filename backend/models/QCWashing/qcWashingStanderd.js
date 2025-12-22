import mongoose from "mongoose";

// Sub-schema for individual wash type standards
const WashTypeStandardSchema = new mongoose.Schema({
  washType: { 
    type: String, 
    enum: ['Normal Wash', 'Acid Wash', 'Garment Dye', 'Soft Wash', 'Acid Wash + Garment Dye'], 
    required: true 
  },
  washingMachine: {
    temperature: { type: Number, default: null },
    time: { type: Number, default: null },
    silicon: { type: Number, default: null },
    softener: { type: Number, default: null },
  },
  tumbleDry: {
    temperature: { type: Number, default: null },
    timeCool: { type: Number, default: null },
    timeHot: { type: Number, default: null },
  }
}, { 
  timestamps: true,
  _id: true // Each standard gets its own ID for easier updates
});

// Main factory standards schema
const FactoryMachineStandardSchema = new mongoose.Schema({
  factoryName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    index: true // Index for faster queries
  },
  standards: {
    type: [WashTypeStandardSchema],
    default: [],
    validate: {
      validator: function(standards) {
        // Ensure no duplicate wash types within the same factory
        const washTypes = standards.map(s => s.washType);
        return washTypes.length === new Set(washTypes).size;
      },
      message: 'Duplicate wash types are not allowed for the same factory'
    }
  },
  // Additional factory metadata
  factoryCode: { 
    type: String, 
    trim: true,
    sparse: true // Allow multiple null values but unique non-null values
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  notes: { 
    type: String, 
    trim: true 
  }
}, { 
  timestamps: true,
  collection: 'qc_washing_factory_standards' // Explicit collection name
});

// Indexes for better performance
// FactoryMachineStandardSchema.index({ factoryName: 1 });
FactoryMachineStandardSchema.index({ 'standards.washType': 1 });
FactoryMachineStandardSchema.index({ factoryName: 1, 'standards.washType': 1 });

// Instance methods
FactoryMachineStandardSchema.methods.addOrUpdateStandard = function(washType, washingMachine, tumbleDry) {
  const existingIndex = this.standards.findIndex(s => s.washType === washType);
  
  const standardData = {
    washType,
    washingMachine: washingMachine || {},
    tumbleDry: tumbleDry || {}
  };

  if (existingIndex !== -1) {
    // Update existing standard
    this.standards[existingIndex] = {
      ...this.standards[existingIndex].toObject(),
      ...standardData,
      updatedAt: new Date()
    };
  } else {
    // Add new standard
    this.standards.push(standardData);
  }
  
  return this.save();
};

FactoryMachineStandardSchema.methods.removeStandard = function(washType) {
  this.standards = this.standards.filter(s => s.washType !== washType);
  return this.save();
};

FactoryMachineStandardSchema.methods.getStandard = function(washType) {
  return this.standards.find(s => s.washType === washType);
};

// Static methods
FactoryMachineStandardSchema.statics.findByFactoryName = function(factoryName) {
  return this.findOne({ factoryName: factoryName });
};

FactoryMachineStandardSchema.statics.findFactoryStandard = function(factoryName, washType) {
  return this.findOne(
    { factoryName: factoryName },
    { standards: { $elemMatch: { washType: washType } } }
  );
};

FactoryMachineStandardSchema.statics.getAllFactoriesWithStandards = function() {
  return this.find({ 'standards.0': { $exists: true } })
    .select('factoryName standards.washType createdAt updatedAt')
    .sort({ factoryName: 1 });
};

// Pre-save middleware
FactoryMachineStandardSchema.pre('save', function(next) {
  // Ensure factory name is properly formatted
  if (this.factoryName) {
    this.factoryName = this.factoryName.trim().toUpperCase();
  }
  
  // Update the main document's updatedAt when standards are modified
  if (this.isModified('standards')) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Virtual for getting standards count
FactoryMachineStandardSchema.virtual('standardsCount').get(function() {
  return this.standards ? this.standards.length : 0;
});

// Virtual for getting available wash types
FactoryMachineStandardSchema.virtual('availableWashTypes').get(function() {
  return this.standards ? this.standards.map(s => s.washType) : [];
});

// Ensure virtuals are included in JSON output
FactoryMachineStandardSchema.set('toJSON', { virtuals: true });
FactoryMachineStandardSchema.set('toObject', { virtuals: true });

export default (connection) => connection.model("QCWashingMachineStandard", FactoryMachineStandardSchema);
