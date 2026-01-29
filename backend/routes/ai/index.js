import express from "express";
import chatRoutes from "./chat.route.js";
import conversationRoutes from "./conversation.route.js";


const router = express.Router();

// Create a nested router for production instructions
const instructionRouter = express.Router();


// Chat and Conversation routes
router.use("/chat", chatRoutes);
router.use("/conversation", conversationRoutes);

export default router;

