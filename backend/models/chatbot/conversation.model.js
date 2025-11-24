import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  _id: { type: String },
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userID: { 
    type: String, 
    required: true },
  title: { type: String, default: "New conversation" },
  date: { type: Date },
  messages: { type: [messageSchema], default: [] }
});

export default function createConversationModel(connection) {
  return connection.model("Conversation", conversationSchema);
} 