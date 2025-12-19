import mongoose from "mongoose";

const DefectSchema = new mongoose.Schema({
    defectName: { type: String, trim: true },  
    count: { type: Number, default: 0 }        
});

const InspectionSchema = new mongoose.Schema({
    // --- Identification ---
    groupNumber: {
        type: String,
        required: false
    },
    inspectionNumbers: [{ type: String }],  
    inspectionNumbersKey: { 
        type: String, 
        unique: true, 
        sparse: true,
        index: true 
    },
    project: { type: String },

    // --- Parties ---
    supplier: { type: String },
    brand: { type: String },
    buyer: { type: String },
    client: { type: String },
    inspector: { type: String },

    // --- Product Details ---
    poNumbers: [{ type: String }],          
    skuNumbers: [{ type: String }],        
    skuName: { type: String },
    style: { type: String },
    colors: [{ type: String }],            
    sizes: [{ type: String }],          
    material: { type: String },
    description: { type: String },
   
    // --- Logistics & Location ---
    origin: { type: String },
    portOfLoading: { type: String },
    portOfArrival: { type: String },
    destination: { type: String },
    inspectionLocation: { type: String },

    // --- Quantities & Pricing ---
    packingType: { type: String },
    masterCartonPackedQty: { type: Number },
    innerPackQty: { type: Number },
    retailPrice: { type: Number },
    terms: { type: String },
    totalPoItemsQty: { type: Number },
    qtyToInspect: { type: Number },
    qtyInspected: { type: Number },
    sampleSize: { type: Number },
    sampleInspected: { type: Number },

    // --- Dates ---
    orderDate: { type: Date },
    etd: [{ type: Date }],  
    eta: [{ type: Date }], 
    scheduledInspectionDate: { type: Date },
    submittedInspectionDate: { type: Date },
    decisionDate: { type: Date },
    lastModifiedDate: { type: Date },

    // --- Inspection Results ---
    inspectionResult: { type: String, enum: ['Pass', 'Fail', 'Pending', 'Hold'] },
    approvalStatus: { type: String },
    reportType: { type: String },
    inspectorDecision: { type: String },
    defectRate: { type: Number },
   
    // Top level summary counts
    totalNumberOfDefects: { type: Number },
    totalDefectiveUnits: { type: Number },
    totalGoodUnits: { type: Number },
    
    // Top level defect summary arrays
    defectCategories: [{ type: String }],
    defectCodes: [{ type: String }],
    defectDescriptions: [{ type: String }],
    qtyCriticalDefects: { type: Number },
    qtyMajorDefects: { type: Number },
    qtyMinorDefects: { type: Number },

    // --- Comments & Extra Info ---
    allComments: { type: String },
    
    // --- PoLine Arrays (Top Level) ---
    poLineCustomerPO: [{ type: String }],  
    poLineMainPO: [{ type: String }],      

    // --- Simplified Defect Array ---
    defects: [DefectSchema],

    // --- Duplicate Prevention ---
    uploadBatch: { type: String }, 
      // Add these new fields
    downloadStatus: {
        type: String,
        enum: ['Pending', 'In Progress', 'Downloaded', 'Failed'],
        default: 'Pending'
    },
    downloadedAt: {
        type: Date,
        default: null
    },
}, {
    timestamps: true,
    collection: 'p88LegacyData'
});


export default (connection) => connection.model("p88LegacyData", InspectionSchema);
