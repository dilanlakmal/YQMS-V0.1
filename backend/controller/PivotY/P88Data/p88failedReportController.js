import { 
  p88FailedReport,
  UserMain
} from '../../MongoDB/dbConnectionController.js';

export const getAuthUserIdentifier = async (req) => {
  try {
    if (!req.userId) return "Unknown";
    
    // Fetch user details from database
    const user = await UserMain.findById(req.userId);
    if (!user) return "Unknown";
    
    // Return the emp_id (or whatever identifier you use)
    return user.emp_id || user.eng_name || user.name || "Unknown";
  } catch (error) {
    console.error('Error fetching auth user:', error);
    return "Unknown";
  }
};

// Save a failure (Called within the download loop catch block)
export const logFailedReport = async (legacyId, inspNo, groupId, reason, empId) => {
    try {
        // Date with time set to 0
        const now = new Date();
        const dateOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        await p88FailedReport.findOneAndUpdate(
            { legacyDataId: legacyId },
            { 
                $set: { 
                    inspectionNumber: inspNo,
                    groupId: groupId,
                    failReason: reason,
                    failedAt: dateOnly,
                    status: 'Pending'
                },
                // Add the specific user who just failed to the list of impacted users
                $addToSet: { 
                    emp_ids: empId 
                }
            },
            { upsert: true, new: true }
        );
    } catch (e) {
        console.error("Error logging failed report:", e.message);
    }
};

// Get all failed reports
export const getFailedReports = async (req, res) => {
    try {
        console.log('Fetching failed reports from database...'); // Debug log
        
        const reports = await p88FailedReport.find()
            .sort({ failedAt: -1 });

        console.log(`Found ${reports.length} failed reports`); // Debug log
        console.log('Sample report:', reports[0]); // Debug log

        res.json({ success: true, data: reports });
    } catch (error) {
        console.error("Error fetching failed reports:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update status to Downloaded (Called when user clicks manual link)
export const markAsDownloaded = async (req, res) => {
    try {
        const { reportId } = req.body;
        console.log(`Marking report ${reportId} as downloaded`); // Debug log

        await p88FailedReport.findByIdAndUpdate(reportId, {
            status: 'Downloaded',
            lastDownloadedAt: new Date()
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking as downloaded:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
