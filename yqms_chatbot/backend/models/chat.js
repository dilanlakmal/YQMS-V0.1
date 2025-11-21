import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    history: [
      {
        role: {
          type: String,
          enum: ["user", "model"],
          required: true
        },
        parts: [
          {
            text: {
              type: String,
              required: true
            }
          }
        ],
        img: {
          type: String,
          required: false
        }
      }
    ]
  },
  { timestamps: true }
);

const createChatModel = (connection = mongoose) => {
  const conn = connection?.models ? connection : mongoose;
  return conn.models.chat || conn.model("chat", ChatSchema);
};

export default createChatModel;