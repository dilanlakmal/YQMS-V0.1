import express from "express";
import ImageKit from "imagekit";
import createAIChatModel from "../models/chat.js";
import createUserChatsModel from "../models/userChats.js";

const createImageKitClient = () => {
  const publicKey =
    process.env.VITE_IMAGE_KIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey =
    process.env.IMAGEKIT_PRIVATE_KEY || process.env.VITE_IMAGE_KIT_PRIVATE_KEY;
  const urlEndpoint =
    process.env.VITE_IMAGE_KIT_ENDPOINT || process.env.IMAGEKIT_ENDPOINT;

  if (publicKey && privateKey && urlEndpoint) {
    return new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });
  }

  console.warn(
    "ImageKit credentials are missing. AI image uploads are disabled."
  );
  return null;
};

const createAiChatRoutes = ({ connection, authenticateUser }) => {
  const router = express.Router();
  const AiChat = createAIChatModel(connection);
  const AiUserChats = createUserChatsModel(connection);
  const imageKit = createImageKitClient();

  router.get("/ai/imagekit-signature", authenticateUser, (req, res) => {
    if (!imageKit) {
      return res
        .status(500)
        .json({ message: "ImageKit is not configured on the server." });
    }

    try {
      const authParams = imageKit.getAuthenticationParameters();
      res.json(authParams);
    } catch (error) {
      console.error("ImageKit signature error:", error);
      res.status(500).json({
        message: "Failed to generate upload signature",
        error: error.message
      });
    }
  });

  router.post("/chats", authenticateUser, async (req, res) => {
    try {
      const text = (req.body?.text || "").trim();
      if (!text) {
        return res
          .status(400)
          .json({ message: "Prompt text is required to start a chat." });
      }

      const newChat = await AiChat.create({
        userId: req.userId,
        history: [{ role: "user", parts: [{ text }] }]
      });

      const chatSummary = {
        _id: newChat._id.toString(),
        title: text.slice(0, 60),
        createdAt: new Date()
      };

      await AiUserChats.updateOne(
        { userId: req.userId },
        {
          $push: { chats: chatSummary },
          $setOnInsert: { userId: req.userId }
        },
        { upsert: true }
      );

      res.status(201).json(newChat._id);
    } catch (error) {
      console.error("Error creating chat:", error);
      res
        .status(500)
        .json({ message: "Failed to create chat", error: error.message });
    }
  });

  router.get("/userchats", authenticateUser, async (req, res) => {
    try {
      const userChats = await AiUserChats.findOne({
        userId: req.userId
      }).lean();
      res.status(200).json(userChats?.chats || []);
    } catch (error) {
      console.error("Error fetching user chats:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch chats", error: error.message });
    }
  });

  router.get("/chats/:id", authenticateUser, async (req, res) => {
    try {
      const chat = await AiChat.findOne({
        _id: req.params.id,
        userId: req.userId
      });

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.status(200).json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch chat", error: error.message });
    }
  });

  router.put("/chats/:id", authenticateUser, async (req, res) => {
    try {
      const { question, answer, img } = req.body || {};
      if (!answer) {
        return res.status(400).json({ message: "Answer text is required." });
      }

      const newEntries = [];
      if (question && question.trim()) {
        const entry = {
          role: "user",
          parts: [{ text: question.trim() }]
        };
        if (img) {
          entry.img = img;
        }
        newEntries.push(entry);
      }

      newEntries.push({
        role: "model",
        parts: [{ text: answer }]
      });

      const updated = await AiChat.updateOne(
        { _id: req.params.id, userId: req.userId },
        {
          $push: {
            history: {
              $each: newEntries
            }
          }
        }
      );

      if (updated.matchedCount === 0) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.status(200).json({ message: "Chat updated" });
    } catch (error) {
      console.error("Error updating chat:", error);
      res
        .status(500)
        .json({ message: "Failed to update chat", error: error.message });
    }
  });

  router.delete("/chats/:id", authenticateUser, async (req, res) => {
    try {
      const chatId = req.params.id;
      const deletion = await AiChat.deleteOne({
        _id: chatId,
        userId: req.userId
      });

      if (deletion.deletedCount === 0) {
        return res.status(404).json({ message: "Chat not found" });
      }

      await AiUserChats.updateOne(
        { userId: req.userId },
        { $pull: { chats: { _id: chatId } } }
      );

      res.status(200).json({ message: "Chat deleted" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res
        .status(500)
        .json({ message: "Failed to delete chat", error: error.message });
    }
  });

  return router;
};

export default createAiChatRoutes;

