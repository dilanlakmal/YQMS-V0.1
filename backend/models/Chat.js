import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  senderId: { type: String, required: true }, // emp_id of the sender
  recipientId: { type: String, required: true }, // emp_id of the recipient
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default (connection) => connection.model("Chat", chatSchema);
