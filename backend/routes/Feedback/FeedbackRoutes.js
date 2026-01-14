import express from "express";
import {
  createFeedback,
  getFeedbacks,
  getUserFeedbacks,
  getFeedbackById,
  addMessage,
  editMessage,
  deleteMessage,
  updateFeedbackStatus,
  getFeedbackStats,
  upload,
  getRating,
  saveRating,
  getAuthUserRating,
  getRatingStats 
} from "../../controller/Feedback/FeedbackController.js";
import authenticateUser from "../../middleware/authenticateUser.js";

const router = express.Router();

// Feedback CRUD operations
router.post("/api/feedbacks", authenticateUser, upload.array('images', 10), createFeedback);
router.get("/api/feedbacks", getFeedbacks);
router.get("/api/feedbacks/my-feedbacks", getUserFeedbacks);
router.get("/api/feedbacks/stats", getFeedbackStats);
router.get("/api/feedbacks/:id", getFeedbackById);
// Message operations
router.post("/api/feedbacks/:id/messages", authenticateUser, upload.array('images', 10), addMessage);
router.put("/api/feedbacks/:id/messages/:messageId", authenticateUser, editMessage);
router.delete("/api/feedbacks/:id/messages/:messageId", authenticateUser, deleteMessage);
// Admin operations
router.put("/api/feedbacks/:id/status", authenticateUser, updateFeedbackStatus);

router.get("/api/ratings", authenticateUser, getRating);
router.post("/api/ratings", authenticateUser, saveRating);
router.get("/api/ratings/my-ratings", authenticateUser, getAuthUserRating);
router.get("/api/ratings/stats", getRatingStats);

export default router;