import { Link, useLocation } from "react-router-dom";
import "./chatList.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { authJsonFetch } from "../../lib/api";

const ChatList = ({ basePath = "/ai-agent" }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRefs = useRef({});

  const { isPending, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: async () => {
      const response = await authJsonFetch("/api/userchats", {
        method: "GET",
        headers: {}
      });
      return response || [];
    },
    retry: 1
  });

  // Filter chats based on search query
  const filteredChats =
    data?.filter((chat) =>
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Get current chat ID from URL
  const currentChatId = location.pathname.split("/").pop();

  const deleteMutation = useMutation({
    mutationFn: async (chatId) => {
      return authJsonFetch(`/api/chats/${chatId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      setOpenMenuId(null);
    }
  });

  const handleDelete = (chatId) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
        deleteMutation.mutate(chatId);
    }
  };

  const handleShare = (chatId, title) => {
    const url = `${window.location.origin}${basePath}/chats/${chatId}`;
    if (navigator.share) {
      navigator.share({
        title: `Chat: ${title}`,
        text: `Check out this chat: ${title}`,
        url: url,
      }).catch((err) => {
        console.log('Error sharing:', err);
        navigator.clipboard.writeText(url);
        alert('Chat link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Chat link copied to clipboard!');
      }).catch(() => {
        prompt('Copy this link:', url);
      });
    }
    setOpenMenuId(null);
  };

  const handleRename = (chatId, currentTitle) => {
    const newTitle = prompt('Enter new title:', currentTitle);
    if (newTitle && newTitle.trim() && newTitle !== currentTitle) {
      alert(`Rename functionality for "${currentTitle}" to "${newTitle}" will be implemented soon.`);
    }
    setOpenMenuId(null);
  };

  const handleArchive = (chatId) => {
    if (window.confirm("Are you sure you want to archive this chat?")) {
      alert('Archive functionality will be implemented soon.');
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === chatId ? null : chatId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutside = Object.values(menuRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );
      if (clickedOutside) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

    // Check if we're on the dashboard (new chat) page
    const isDashboardPage = location.pathname === basePath;

    return (
      <div className='chatList'>
          <div className="chatList-header">
              <span className='title'></span>
              <Link to={basePath} className="nav-link active">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>New Chat</span>
              </Link>
              <Link to="/home" className="nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span>Explore More</span>
              </Link>
              {/* <Link to="/profile" className="nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Contact</span>
              </Link> */}
          </div>
          <hr />
          <div className="chatList-content">
              <div className="chatList-search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input 
                      type="text" 
                      placeholder="Search chats..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                      <button 
                          className="clear-search"
                          onClick={() => setSearchQuery('')}
                          type="button"
                      >
                          ×
                      </button>
                  )}
              </div>
              <span className='title'>RECENT CHATS</span>
              <div className="list">
                  {isPending ? (
                      <div className="loading-state">
                          <div className="spinner"></div>
                          <span>Loading chats...</span>
                      </div>
                  ) : error ? (
                      <div className="error-state">
                          <span>⚠️ Error fetching chats</span>
                      </div>
                  ) : filteredChats.length === 0 ? (
                      <div className="empty-state">
                          {searchQuery ? (
                              <>
                                  <span>🔍</span>
                                  <span>No chats found</span>
                              </>
                          ) : (
                              <>
                                  <span>💬</span>
                                  <span>No chats yet</span>
                                  <span className="empty-hint">Start a new conversation</span>
                              </>
                          )}
                      </div>
                  ) : (
                      filteredChats.map((chat) => (
                        <div 
                            key={chat._id} 
                            className={`chat-item ${currentChatId === chat._id ? 'active' : ''}`}
                        >
                          <Link 
                              to={`${basePath}/chats/${chat._id}`} 
                              className="chat-link"
                          >
                            {chat.title}
                          </Link>
                          <div 
                            className="menu-container" 
                            ref={(el) => (menuRefs.current[chat._id] = el)}
                          >
                            <button 
                              onClick={(e) => toggleMenu(e, chat._id)}
                              className="menu-btn"
                              title="More options"
                              type="button"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="8" cy="3" r="1.5"/>
                                <circle cx="8" cy="8" r="1.5"/>
                                <circle cx="8" cy="13" r="1.5"/>
                              </svg>
                            </button>
                            {openMenuId === chat._id && (
                              <div className="context-menu">
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleShare(chat._id, chat.title);
                                  }}
                                  className="menu-item"
                                  type="button"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                    <polyline points="16 6 12 2 8 6"/>
                                    <line x1="12" y1="2" x2="12" y2="15"/>
                                  </svg>
                                  <span>Share</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRename(chat._id, chat.title);
                                  }}
                                  className="menu-item"
                                  type="button"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                  <span>Rename</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleArchive(chat._id);
                                  }}
                                  className="menu-item"
                                  type="button"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="21 8 21 21 3 21 3 8"/>
                                    <rect x="1" y="3" width="22" height="5"/>
                                    <line x1="10" y1="12" x2="14" y2="12"/>
                                  </svg>
                                  <span>Archive</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(chat._id);
                                  }}
                                  className="menu-item delete-item"
                                  type="button"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
              </div>
          </div>
          <hr />
          <div className="upgrade">
              <img src="/logo.png" alt="" />
              <div className="texts">
                  <span>Upgrade to Pro</span>
                  <span>Get unlimited access to all features</span>
              </div>
          </div>
      </div>
    )
  }

export default ChatList