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

// Save Assignment Control Data (CREATE NEW ONLY)
export const saveAssignControl = async (req, res) => {
    try {
        const {
            preparedBy, preparedByName,
            checkedBy, checkedByName,
            approvedBy, approvedByName,
            admin, adminName,
            userWarehouse, userWarehouseName
        } = req.body;

        console.log('[AssignControl] CREATING new assignment:');
        console.log(`  PreparedBy=${preparedBy} (${preparedByName})`);
        console.log(`  CheckedBy=${checkedBy} (${checkedByName})`);
        console.log(`  ApprovedBy=${approvedBy} (${approvedByName})`);
        console.log(`  Admin=${admin} (${adminName})`);
        console.log(`  UserWarehouse=${userWarehouse} (${userWarehouseName})`);
        console.log(`  UserWarehouse=${userWarehouse} (${userWarehouseName})`);

        // Create a NEW record (History/Audit trail)
        const newAssignment = await ReportAssignControl.create({
            preparedBy, preparedByName,
            checkedBy, checkedByName,
            approvedBy, approvedByName,
            admin, adminName,
            userWarehouse, userWarehouseName
        });

        console.log('[AssignControl] Created successfully with ID:', newAssignment._id);

        // Emit socket event for real-time updates
        io.emit('assignment:created', newAssignment);

        res.status(201).json(newAssignment);
    } catch (error) {
        console.error('[AssignControl] Error creating assignment:', error);
        res.status(500).json({ message: "Error creating assignment control data", error: error.message });
    }
};

// Update Assignment Control Data (PUT)
export const updateAssignControl = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            preparedBy, preparedByName,
            checkedBy, checkedByName,
            approvedBy, approvedByName,
            admin, adminName,
            userWarehouse, userWarehouseName
        } = req.body;

        console.log(`[AssignControl] Updating: ID=${id}`);
        console.log(`  PreparedBy=${preparedBy} (${preparedByName})`);
        console.log(`  CheckedBy=${checkedBy} (${checkedByName})`);
        console.log(`  ApprovedBy=${approvedBy} (${approvedByName})`);
        console.log(`  Admin=${admin} (${adminName})`);
        console.log(`  UserWarehouse=${userWarehouse} (${userWarehouseName})`);
        console.log(`  UserWarehouse=${userWarehouse} (${userWarehouseName})`);

        const updatedData = await ReportAssignControl.findByIdAndUpdate(
            id,
            {
                preparedBy, preparedByName,
                checkedBy, checkedByName,
                approvedBy, approvedByName,
                admin, adminName,
                userWarehouse, userWarehouseName
            },
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

// Delete Assignment Control Data (DELETE)
export const deleteAssignControl = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[AssignControl] Deleting ID=${id}`);

        const deletedData = await ReportAssignControl.findByIdAndDelete(id);

        if (!deletedData) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        io.emit('assignment:deleted', { id: deletedData._id });

        console.log("[AssignControl] Deleted successfully:", id);
        res.status(200).json({ message: "Assignment deleted successfully", id: deletedData._id });
    } catch (error) {
        console.error("[AssignControl] Error deleting assign control:", error);
        res.status(500).json({ message: "Error deleting assignment control data", error: error.message });
    }
};
