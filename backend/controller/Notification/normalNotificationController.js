import {
  NormalNotification,
  RoleManagment
} from "../../controller/MongoDB/dbConnectionController.js";

// ==========================================
// INTERNAL HELPER: Create Notification
// ==========================================
export const createNotification = async ({
  type,
  title,
  message,
  metadata, // Dynamic Object
  sender,
  targetRoles = [], // e.g. ['Admin', 'Cutting']
  link
}) => {
  try {
    // 1. Find all users who have the target roles
    const rolesDocs = await RoleManagment.find({ role: { $in: targetRoles } });

    let recipientSet = new Set();

    // Extract emp_ids from the roles
    rolesDocs.forEach((roleDoc) => {
      if (roleDoc.users && Array.isArray(roleDoc.users)) {
        roleDoc.users.forEach((user) => {
          // Don't send notification to the person who performed the action
          if (user.emp_id !== sender.emp_id) {
            recipientSet.add(user.emp_id);
          }
        });
      }
    });

    const recipients = Array.from(recipientSet);

    if (recipients.length === 0) return;

    // 2. Create Dynamic Notification
    const newNotification = new NormalNotification({
      type,
      title,
      message,
      metadata, // Saves whatever JSON object is passed
      sender,
      recipients,
      readBy: [],
      link
    });

    await newNotification.save();
    // console.log(`Notification [${type}] created for ${recipients.length} users.`);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// ==========================================
// API: Get Notifications for User
// ==========================================
export const getUserNotifications = async (req, res) => {
  try {
    const { emp_id } = req.params;

    // Find notifications where this user is a recipient
    const notifications = await NormalNotification.find({ recipients: emp_id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50

    // Calculate unread count
    const unreadCount = await NormalNotification.countDocuments({
      recipients: emp_id,
      readBy: { $ne: emp_id }
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// ==========================================
// API: Mark Single as Read
// ==========================================
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId, emp_id } = req.body;

    await NormalNotification.findByIdAndUpdate(notificationId, {
      $addToSet: { readBy: emp_id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// ==========================================
// API: Mark All as Read
// ==========================================
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { emp_id } = req.body;

    await NormalNotification.updateMany(
      { recipients: emp_id, readBy: { $ne: emp_id } },
      { $addToSet: { readBy: emp_id } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all read:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};
