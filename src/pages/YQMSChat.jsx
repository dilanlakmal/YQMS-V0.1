import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "../components/authentication/AuthContext";
import { API_BASE_URL } from "../../config";

const socket = io(API_BASE_URL, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
  }
});

const YQMSChat = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
          params: { q: "" },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
          }
        });
        setUsers(response.data.filter((u) => u.emp_id !== user.emp_id));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    if (user) fetchUsers();
  }, [user]);

  // Socket.io setup
  useEffect(() => {
    if (user) {
      socket.emit("join", user.emp_id);

      socket.on("onlineUsers", (onlineUserIds) => {
        setOnlineUsers(onlineUserIds);
      });

      socket.on("receiveMessage", (message) => {
        if (
          (message.senderId === selectedUser?.emp_id &&
            message.recipientId === user.emp_id) ||
          (message.senderId === user.emp_id &&
            message.recipientId === selectedUser?.emp_id)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      });

      socket.on("messageSent", (message) => {
        if (
          message.senderId === user.emp_id &&
          message.recipientId === selectedUser?.emp_id
        ) {
          setMessages((prev) => [...prev, message]);
        }
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        socket.off("onlineUsers");
        socket.off("receiveMessage");
        socket.off("messageSent");
        socket.off("error");
      };
    }
  }, [user, selectedUser]);

  // Fetch chat history when selecting a user
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (selectedUser && user) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/chats/${user.emp_id}/${selectedUser.emp_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`
              }
            }
          );
          setMessages(response.data);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
      }
    };
    fetchChatHistory();
  }, [selectedUser, user]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUser && user) {
      socket.emit("sendMessage", {
        senderId: user.emp_id,
        recipientId: selectedUser.emp_id,
        message: newMessage
      });
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar: User List */}
      <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        {users.map((u) => (
          <div
            key={u.emp_id}
            onClick={() => setSelectedUser(u)}
            className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${
              selectedUser?.emp_id === u.emp_id ? "bg-gray-200" : ""
            }`}
          >
            <div className="relative">
              <img
                src={u.face_photo || "/IMG/default-profile.png"}
                alt={u.eng_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {onlineUsers.includes(u.emp_id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{u.eng_name}</p>
              <p className="text-xs text-gray-500">{u.job_title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex items-center">
              <img
                src={selectedUser.face_photo || "/IMG/default-profile.png"}
                alt={selectedUser.eng_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="ml-3">
                <p className="text-lg font-semibold">{selectedUser.eng_name}</p>
                <p className="text-sm text-gray-500">
                  {onlineUsers.includes(selectedUser.emp_id)
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-4 ${
                    msg.senderId === user.emp_id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.senderId === user.emp_id
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YQMSChat;
