import mongoose from 'mongoose';

const p88failedReportSchema = new mongoose.Schema({
    legacyDataId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'p88LegacyData', 
        required: true 
    },
    inspectionNumber: { type: String, required: true },
    groupId: { type: String },
    // Changed to an array to store multiple user IDs
    // emp_ids: [{ type: String }], 
    status: { 
        type: String, 
        enum: ['Pending', 'Downloaded'], 
        default: 'Pending' 
    },
    failReason: { type: String },
    // This will store the date with time set to 00:00:00
    failedAt: { type: Date }, 
    lastDownloadedAt: { type: Date }
});

export default (connection) => connection.model('p88FailedReport', p88failedReportSchema);