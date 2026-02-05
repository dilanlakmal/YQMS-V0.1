import { ReportAssignControl } from "../MongoDB/dbConnectionController.js";

// Get Assignment Control Data (History)
export const getAssignControl = async (req, res) => {
    try {
        // Fetch last 20 records, sorted by newest first
        const data = await ReportAssignControl.find({}).sort({ updatedAt: -1 }).limit(20);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching assign control:", error);
        res.status(500).json({ message: "Error fetching assignment control data", error: error.message });
    }
};

// Save Assignment Control Data
export const saveAssignControl = async (req, res) => {
    try {
        const { _id, checkedBy, approvedBy } = req.body;
        console.log(`[AssignControl] Saving: ID=${_id}, CheckedBy=${checkedBy}, ApprovedBy=${approvedBy}`);

        let updatedData;

        if (_id) {
            // If ID is provided, update that specific document
            updatedData = await ReportAssignControl.findByIdAndUpdate(
                _id,
                { checkedBy, approvedBy },
                { new: true }
            );
        } else {
            // If no ID, create a NEW record (History/Audit trail)
            // Do not use findOneAndUpdate({}) because that updates the existing one (Singleton)
            updatedData = await ReportAssignControl.create({ checkedBy, approvedBy });
        }

        console.log("[AssignControl] Saved successfully:", updatedData);
        res.status(200).json(updatedData);
    } catch (error) {
        console.error("[AssignControl] Error saving assign control:", error);
        res.status(500).json({ message: "Error saving assignment control data", error: error.message });
    }
};
