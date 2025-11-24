import { useState, useEffect, useRef} from "react";
import ChatInterface from "@/components/chatbot/ChatInterface";
// import {
//   fetchUserData,
//   fetchUserConversation,
//   createConversation
// } from "@/components/chatbot/lib/chat.js";
import { 
  fetchUserConversation,
  fetchUserProfile, 
  createConversation 
} from "../components/chatbot/lib/api/conversation";

export default function YQMSAIChatBox({ isOpen, setIsOpen }) {
  const [userData, setUserData] = useState({
    emp_id: "",
    name: "",
    dept_name: "",
    sect_name: "",
    working_status: "",
    phone_number: "",
    eng_name: "",
    kh_name: "",
    job_title: "",
    email: "",
    profile: "",
  });

  const conversationCreated = useRef(false);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const initialMessages = [
    {
      _id: "1",
      role: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: new Date(),
    },
  ];

  // Fetch user data once on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await fetchUserProfile();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      }
    }
    loadUserData();
  }, []);

  // Fetch or create conversations when userData.emp_id is available
  useEffect(() => {
    if (!userData.emp_id) return; // early return if no emp_id
    
    const loadConversations = async () => {
      try {
        const data = await fetchUserConversation(userData.emp_id);
        if (data?.length) {
          setConversations(data);
          setActiveConversationId(data[0]._id);
        } else if (!conversationCreated.current) {
          conversationCreated.current = true;
          const newConversation = {
            userID: userData.emp_id,
            title: "New conversation",
            date: new Date(),
            messages: initialMessages,
          };
          const created = await createConversation(newConversation);
          setConversations([created]);
          setActiveConversationId(created._id);
        }
      } catch (error) {
        console.error("Error loading conversations:", error.message);
      }
    }
    loadConversations();
  }, [userData]);

  const activeConversation = conversations.find(
    (c) => c._id === activeConversationId
  );
  const messages = activeConversation?.messages || [];

  return (
    <ChatInterface
      messages={messages}
      userData={userData}
      initialMessages={initialMessages}
      activeConversationId={activeConversationId}
      setActiveConversationId={setActiveConversationId}
      conversations={conversations}
      setConversations={setConversations}
      onClose={() => setIsOpen(!isOpen)}
    />
  );
}
