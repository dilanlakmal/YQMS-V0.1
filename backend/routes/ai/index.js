import express from "express";
import chatRoutes from "./chat.route.js";
import conversationRoutes from "./conversation.route.js";
import translationRoutes from "./translation.route.js";
import documentRoutes from "./document.route.js";
import customer from "./customer.route.js";

const router = express.Router();

// Create a nested router for production instructions
const instructionRouter = express.Router();

// Mount sub-routes for instruction workflow
instructionRouter.use("/extraction", documentRoutes);
instructionRouter.use("/customer", customer);
instructionRouter.use("/", translationRoutes); // Handles /translation and /languages

// Mount the instruction router under /production/instruction
router.use("/production/instruction", instructionRouter);

// Chat and Conversation routes
router.use("/chat", chatRoutes);
router.use("/conversation", conversationRoutes);

export default router;

