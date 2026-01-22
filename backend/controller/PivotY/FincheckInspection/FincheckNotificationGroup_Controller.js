import { FincheckNotificationGroup } from "../../MongoDB/dbConnectionController.js";

// ============================================================
// Get All Group Members
// ============================================================
export const getNotificationGroup = async (req, res) => {
  try {
    const members = await FincheckNotificationGroup.find().sort({
      createdAt: -1
    });
    return res.status(200).json({ success: true, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Add Members (Supports Bulk Add)
// ============================================================
export const addNotificationMembers = async (req, res) => {
  try {
    const { members } = req.body; // Expecting Array of objects { empId, empName, jobTitle, facePhoto }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No members provided" });
    }

    const results = {
      added: 0,
      failed: 0,
      errors: []
    };

    for (const member of members) {
      try {
        // Check duplicate
        const exists = await FincheckNotificationGroup.findOne({
          empId: member.empId
        });
        if (!exists) {
          await new FincheckNotificationGroup({
            empId: member.empId,
            empName: member.empName,
            jobTitle: member.jobTitle || "",
            facePhoto: member.facePhoto || null
          }).save();
          results.added++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Failed ${member.empId}: ${err.message}`);
      }
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Remove Member
// ============================================================
export const removeNotificationMember = async (req, res) => {
  try {
    const { id } = req.params;
    await FincheckNotificationGroup.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
