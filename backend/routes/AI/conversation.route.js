import express from "express";

import { 
    createConversation,
    getAllConversation,
    getUserConversation,
    deleteConversation,
    addMessage,
    updateConversationTitle,
    updateConversationModel
} from "../../controller/AI/conversation.controller.js";

const router = express.Router();

router.post("/", createConversation);
router.get("/", getAllConversation);
router.get("/:userID", getUserConversation);
router.delete("/:id", deleteConversation);
router.post("/:id/addMessage", addMessage);
router.patch("/:id/updateTitle", updateConversationTitle);
router.patch("/:id/updateModel", updateConversationModel);

export default router;