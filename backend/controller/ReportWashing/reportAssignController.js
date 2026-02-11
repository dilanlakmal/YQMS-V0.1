import { ReportAssignControl } from "../MongoDB/dbConnectionController.js";

// Get Assignment Control Data (History)
import { io } from "../../Config/appConfig.js";

// Get Assignment Control Data (History)
export const getAssignControl = async (req, res) => {
    try {
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
        const { _id, preparedBy, checkedBy, approvedBy } = req.body;
        console.log(`[AssignControl] Saving: ID=${_id}, PreparedBy=${preparedBy}, CheckedBy=${checkedBy}, ApprovedBy=${approvedBy}`);

        let updatedData;

        if (_id) {
            // If ID is provided, update that specific document
            updatedData = await ReportAssignControl.findByIdAndUpdate(
                _id,
                { preparedBy, checkedBy, approvedBy },
                { new: true }
            );
            io.emit('assignment:updated', updatedData);
        } else {
            // If no ID, create a NEW record (History/Audit trail)
            updatedData = await ReportAssignControl.create({ preparedBy, checkedBy, approvedBy });
            io.emit('assignment:created', updatedData);
        }

        console.log("[AssignControl] Saved successfully:", updatedData);
        res.status(200).json(updatedData);
    } catch (error) {
        console.error("[AssignControl] Error saving assign control:", error);
        res.status(500).json({ message: "Error saving assignment control data", error: error.message });
    }
};

// Update Assignment Control Data (PUT)
export const updateAssignControl = async (req, res) => {
    try {
        const { id } = req.params;
        const { preparedBy, checkedBy, approvedBy } = req.body;
        console.log(`[AssignControl] Updating: ID=${id}, PreparedBy=${preparedBy}, CheckedBy=${checkedBy}, ApprovedBy=${approvedBy}`);

        const updatedData = await ReportAssignControl.findByIdAndUpdate(
            id,
            { preparedBy, checkedBy, approvedBy },
            { new: true }
        );

        if (!updatedData) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        io.emit('assignment:updated', updatedData);

        console.log("[AssignControl] Updated successfully:", updatedData);
        res.status(200).json(updatedData);
    } catch (error) {
        console.error("[AssignControl] Error updating assign control:", error);
        res.status(500).json({ message: "Error updating assignment control data", error: error.message });
    }
};
