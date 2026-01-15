import React, { useState, useEffect } from 'react';
import { useAuth } from '../authentication/AuthContext';
import { 
  MessageCircle, Send, Image as ImageIcon, Calendar, User, Tag, 
  ChevronDown, ChevronUp, Edit3, Trash2, X, Check, Upload, 
  MoreVertical, Eye, Clock, AlertCircle, CheckCircle2, XCircle,
  Paperclip, Smile, Palette, Settings, Sun, Moon, Monitor
} from 'lucide-react';
import { API_BASE_URL } from '../../../config';

const SubmittedFeedbacks = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [newMessages, setNewMessages] = useState({});
  const [newMessageImages, setNewMessageImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Theme customization states
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [chatTheme, setChatTheme] = useState(() => {
    return localStorage.getItem('chatTheme') || 'default';
  });
  const [chatBackground, setChatBackground] = useState(() => {
    return localStorage.getItem('chatBackground') || 'default';
  });
  const [bubbleStyle, setBubbleStyle] = useState(() => {
    return localStorage.getItem('bubbleStyle') || 'modern';
  });

  // Theme configurations
  const themes = {
    default: {
      name: 'Default',
      primary: 'from-blue-600 to-indigo-600',
      primaryHover: 'from-blue-700 to-indigo-700',
      secondary: 'from-gray-500 to-gray-600',
      accent: 'text-blue-600',
      userBubble: 'bg-gradient-to-br from-blue-600 to-indigo-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
    },
    purple: {
      name: 'Purple',
      primary: 'from-purple-600 to-pink-600',
      primaryHover: 'from-purple-700 to-pink-700',
      secondary: 'from-purple-500 to-purple-600',
      accent: 'text-purple-600',
      userBubble: 'bg-gradient-to-br from-purple-600 to-pink-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600'
    },
    green: {
      name: 'Green',
      primary: 'from-green-600 to-emerald-600',
      primaryHover: 'from-green-700 to-emerald-700',
      secondary: 'from-green-500 to-green-600',
      accent: 'text-green-600',
      userBubble: 'bg-gradient-to-br from-green-600 to-emerald-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600'
    },
    orange: {
      name: 'Orange',
      primary: 'from-orange-600 to-red-600',
      primaryHover: 'from-orange-700 to-red-700',
      secondary: 'from-orange-500 to-orange-600',
      accent: 'text-orange-600',
      userBubble: 'bg-gradient-to-br from-orange-600 to-red-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-orange-200 dark:border-orange-600'
    },
    dark: {
      name: 'Dark',
      primary: 'from-gray-800 to-gray-900',
      primaryHover: 'from-gray-900 to-black',
      secondary: 'from-gray-600 to-gray-700',
      accent: 'text-gray-800',
      userBubble: 'bg-gradient-to-br from-gray-800 to-gray-900',
      otherBubble: 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
    }
  };

  const backgrounds = {
    default: {
      name: 'Default',
      class: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50',
      pattern: ''
    },
    dots: {
      name: 'Dots',
      class: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50',
      pattern: 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]'
    },
    grid: {
      name: 'Grid',
      class: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50',
      pattern: 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:20px_20px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]'
    },
    waves: {
      name: 'Waves',
      class: 'bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]'
    },
    bubbles: {
      name: 'Bubbles',
      class: 'bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="25" fill="none" stroke="%23e0e7ff" stroke-width="1" opacity="0.3"/%3E%3Ccircle cx="25" cy="25" r="10" fill="none" stroke="%23e0e7ff" stroke-width="1" opacity="0.2"/%3E%3Ccircle cx="75" cy="75" r="15" fill="none" stroke="%23e0e7ff" stroke-width="1" opacity="0.2"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23a)"/%3E%3C/svg%3E")]'
    }
  };

  const bubbleStyles = {
    modern: {
      name: 'Modern',
      user: 'rounded-2xl rounded-br-md',
      other: 'rounded-2xl rounded-bl-md',
      shadow: 'shadow-lg'
    },
    classic: {
      name: 'Classic',
      user: 'rounded-lg',
      other: 'rounded-lg',
      shadow: 'shadow-md'
    },
    minimal: {
      name: 'Minimal',
      user: 'rounded-xl',
      other: 'rounded-xl',
      shadow: 'shadow-sm'
    },
    bubble: {
      name: 'Bubble',
      user: 'rounded-full px-6',
      other: 'rounded-full px-6',
      shadow: 'shadow-lg'
    }
  };

  // Save theme preferences
  useEffect(() => {
    localStorage.setItem('chatTheme', chatTheme);
    localStorage.setItem('chatBackground', chatBackground);
    localStorage.setItem('bubbleStyle', bubbleStyle);
  }, [chatTheme, chatBackground, bubbleStyle]);

  // Get current theme configuration
  const currentTheme = themes[chatTheme];
  const currentBackground = backgrounds[chatBackground];
  const currentBubbleStyle = bubbleStyles[bubbleStyle];

  // Helper to safely extract ID from various formats
  const getSafeId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (typeof id === 'object' && id.toString) {
      const str = id.toString();
      return str === '[object Object]' ? null : str;
    }
    return null;
  };

  // Helper function to format date
  const formatMessageDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to format time
  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to check if we need to show date separator
  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // Enhanced function to check if message belongs to current user
  const isMessageFromCurrentUser = (message) => {
    if (!user || !message) return false;

    const currentUserId = getSafeId(user._id) || getSafeId(user.userId) || getSafeId(user.id);
    const currentUserEmpId = user.emp_id;
    const currentUserName = user.eng_name || user.name;

    const messageAuthorId = getSafeId(message.authorId);
    const messageEmpId = message.empId;
    const messageAuthor = message.author;

    if (currentUserId && messageAuthorId && currentUserId === messageAuthorId) {
      return true;
    }
    
    if (currentUserEmpId && messageEmpId && currentUserEmpId === messageEmpId) {
      return true;
    }
    
    if (currentUserName && messageAuthor && currentUserName === messageAuthor) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [user]);

  const fetchFeedbackUpdates = async (feedbackId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${feedbackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(prev => prev.map(feedback => 
          getSafeId(feedback._id) === getSafeId(feedbackId) 
            ? { ...feedback, messages: data.data.messages, lastActivity: data.data.lastActivity }
            : feedback
        ));
      }
    } catch (error) {
      console.error('Error fetching feedback updates:', error);
    }
  };

  // Add polling effect
  useEffect(() => {
    if (expandedFeedback) {
      const interval = setInterval(() => {
        fetchFeedbackUpdates(expandedFeedback);
      }, 3000);
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [expandedFeedback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/my-feedbacks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.data || []);
      } else {
        console.error('Failed to fetch feedbacks:', response.status);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (feedbackId, files) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const imagePromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: reader.result,
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(newImages => {
      setNewMessageImages(prev => ({
        ...prev,
        [feedbackId]: [...(prev[feedbackId] || []), ...newImages]
      }));
    });
  };

  const removeMessageImage = (feedbackId, imageId) => {
    setNewMessageImages(prev => ({
      ...prev,
      [feedbackId]: (prev[feedbackId] || []).filter(img => img.id !== imageId)
    }));
  };

  const handleSendMessage = async (feedbackId) => {
    const message = newMessages[feedbackId];
    const images = newMessageImages[feedbackId] || [];
    
    if (!message?.trim() && images.length === 0) return;

    try {
      const formData = new FormData();
      
      if (message?.trim()) {
        formData.append('message', message.trim());
      }
      
      images.forEach(image => {
        formData.append('images', image.file);
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${feedbackId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        setFeedbacks(prev => prev.map(feedback => 
          feedback._id === feedbackId 
            ? { ...feedback, messages: [...(feedback.messages || []), data.data] }
            : feedback
        ));
        setNewMessages(prev => ({ ...prev, [feedbackId]: '' }));
        setNewMessageImages(prev => ({ ...prev, [feedbackId]: [] }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEditMessage = (feedbackId, messageId) => {
    const feedback = feedbacks.find(f => getSafeId(f._id) === getSafeId(feedbackId));
    const message = feedback?.messages.find(m => getSafeId(m._id) === getSafeId(messageId));
    
    if (message && isMessageFromCurrentUser(message)) {
      setEditingMessage(messageId);
      setEditText(message.message);
      setShowDropdown(null);
    }
  };

  const handleSaveEdit = async (feedbackId, messageId) => {
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${getSafeId(feedbackId)}/messages/${getSafeId(messageId)}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: editText.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        setFeedbacks(prev => prev.map(feedback => 
          getSafeId(feedback._id) === getSafeId(feedbackId)
            ? {
                ...feedback,
                messages: feedback.messages.map(message =>
                  getSafeId(message._id) === getSafeId(messageId)
                    ? data.data
                    : message
                )
              }
            : feedback
        ));
        setEditingMessage(null);
        setEditText('');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (feedbackId, messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${getSafeId(feedbackId)}/messages/${getSafeId(messageId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFeedbacks(prev => prev.map(feedback => 
          getSafeId(feedback._id) === getSafeId(feedbackId)
            ? {
                ...feedback,
                messages: feedback.messages.filter(message => getSafeId(message._id) !== getSafeId(messageId))
              }
            : feedback
        ));
        setShowDropdown(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high': 
        return {
          color: 'text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800',
          icon: AlertCircle,
          label: 'High Priority'
        };
      case 'medium': 
        return {
          color: 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800',
          icon: Clock,
          label: 'Medium Priority'
        };
      case 'low': 
        return {
          color: 'text-green-700 bg-green-100 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-800',
          icon: CheckCircle2,
          label: 'Low Priority'
        };
      default: 
        return {
          color: 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-gray-900/30 dark:border-gray-800',
          icon: Clock,
          label: 'Normal Priority'
        };
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'open': 
        return {
          color: 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800',
          icon: MessageCircle,
          label: 'Open'
        };
      case 'in-progress': 
        return {
          color: 'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-800',
          icon: Clock,
          label: 'In Progress'
        };
      case 'resolved': 
        return {
          color: 'text-green-700 bg-green-100 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-800',
          icon: CheckCircle2,
          label: 'Resolved'
        };
      case 'closed': 
        return {
          color: 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-gray-900/30 dark:border-gray-800',
          icon: XCircle,
          label: 'Closed'
        };
      default: 
        return {
          color: 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-gray-900/30 dark:border-gray-800',
          icon: MessageCircle,
          label: 'Unknown'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading your feedbacks...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Theme Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Feedback Conversations
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage your submitted feedback with real-time conversations
            </p>
          </div>
          
          {/* Theme Customization Button */}
          <button
            onClick={() => setShowThemePanel(!showThemePanel)}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${currentTheme.primary} hover:${currentTheme.primaryHover} text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
          >
            <Palette className="w-5 h-5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>

        {/* Theme Customization Panel */}
        {showThemePanel && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chat Customization</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Theme Selection */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Color Theme</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => setChatTheme(key)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        chatTheme === key 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`w-full h-6 bg-gradient-to-r ${theme.primary} rounded-lg mb-2`}></div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Selection */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Background Pattern</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(backgrounds).map(([key, bg]) => (
                    <button
                      key={key}
                      onClick={() => setChatBackground(key)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        chatBackground === key 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`w-full h-6 ${bg.class} ${bg.pattern} rounded-lg mb-2 border border-gray-200 dark:border-gray-600`}></div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bubble Style Selection */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Bubble Style</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(bubbleStyles).map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => setBubbleStyle(key)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        bubbleStyle === key 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <div className={`w-4 h-4 bg-blue-500 ${style.user} ${style.shadow}`}></div>
                        <div className={`w-4 h-4 bg-gray-300 ${style.other} ${style.shadow}`}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview</h5>
              <div className={`${currentBackground.class} ${currentBackground.pattern} p-4 rounded-lg space-y-3`}>
                <div className="flex justify-end">
                  <div className={`${currentTheme.userBubble} text-white px-4 py-2 ${currentBubbleStyle.user} ${currentBubbleStyle.shadow} max-w-xs`}>
                    <p className="text-sm">Your message preview</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className={`${currentTheme.otherBubble} text-gray-900 dark:text-white px-4 py-2 ${currentBubbleStyle.other} ${currentBubbleStyle.shadow} max-w-xs`}>
                    <p className="text-sm">Staff reply preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {imagePreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={imagePreview.preview || `${API_BASE_URL}${imagePreview.url}`}
                alt={imagePreview.name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white p-6">
                <p className="font-medium">{imagePreview.name}</p>
              </div>
            </div>
          </div>
        )}

        {feedbacks.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No feedback submitted yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Start a conversation by submitting your first feedback. We're here to help improve your experience.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map(feedback => {
              const priorityConfig = getPriorityConfig(feedback.priority);
              const statusConfig = getStatusConfig(feedback.status);
              const PriorityIcon = priorityConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={getSafeId(feedback._id)} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  
                  {/* Feedback Header */}
                  <div className="p-8 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        
                        {/* Title and Badges */}
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            {feedback.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${priorityConfig.color}`}>
                              <PriorityIcon className="w-3 h-3" />
                              {priorityConfig.label}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{feedback.module}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-500" />
                            <span>{feedback.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <span>{new Date(feedback.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {feedback.comment}
                          </p>
                        </div>
                      </div>
                      
                      {/* Chat Toggle Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setExpandedFeedback(expandedFeedback === getSafeId(feedback._id) ? null : getSafeId(feedback._id))}
                          className={`group flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} hover:${currentTheme.primaryHover} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Chat ({feedback.messages?.length || 0})</span>
                          {expandedFeedback === getSafeId(feedback._id) ? (
                            <ChevronUp className="w-5 h-5 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
                          ) : (
                            <ChevronDown className="w-5 h-5 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chat Section */}
                  {expandedFeedback === getSafeId(feedback._id) && (
                    <div className={`${currentBackground.class} ${currentBackground.pattern}`}>
                      
                      {/* Messages Area */}
                      <div className="p-6 max-h-[600px] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {feedback.messages?.length > 0 ? feedback.messages.map((message, index) => {
                          const isCurrentUser = isMessageFromCurrentUser(message);
                          const previousMessage = index > 0 ? feedback.messages[index - 1] : null;
                          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                          
                          return (
                            <div key={getSafeId(message._id)}>
                              {/* Date Separator */}
                              {showDateSeparator && (
                                <div className="flex items-center justify-center my-6">
                                  <div className="flex items-center gap-3">
                                    <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 w-16"></div>
                                    <div className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-full shadow-sm">
                                      <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatMessageDate(message.timestamp)}</span>
                                      </div>
                                    </div>
                                    <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 w-16"></div>
                                  </div>
                                </div>
                              )}

                              {/* Message */}
                              <div className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`relative max-w-[75%] group ${isCurrentUser ? 'flex flex-row-reverse items-end' : 'flex items-end'}`}>
                                  
                                  {/* Avatar */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg ${
                                    isCurrentUser 
                                      ? `ml-3 bg-gradient-to-br ${currentTheme.primary}` 
                                      : `mr-3 bg-gradient-to-br ${currentTheme.secondary}`
                                  }`}>
                                    {message.author.charAt(0).toUpperCase()}
                                  </div>

                                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    
                                    {/* Author and time */}
                                    <div className={`flex items-center gap-2 mb-2 px-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        {isCurrentUser ? 'You' : message.author}
                                        {message.isAdmin && (
                                          <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] rounded-full font-bold">
                                            STAFF
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatMessageTime(message.timestamp)}
                                      </span>
                                    </div>

                                    {/* Message bubble */}
                                    <div className={`relative px-5 py-4 ${currentBubbleStyle.shadow} backdrop-blur-sm ${
                                      isCurrentUser
                                        ? `${currentTheme.userBubble} text-white ${currentBubbleStyle.user}`
                                        : `${currentTheme.otherBubble} text-gray-900 dark:text-white ${currentBubbleStyle.other}`
                                    }`}>
                                      
                                      {/* Message Actions for Current User */}
                                      {isCurrentUser && (
                                        <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                          <button
                                            onClick={() => setShowDropdown(showDropdown === getSafeId(message._id) ? null : getSafeId(message._id))}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full shadow-lg backdrop-blur-sm transition-colors"
                                          >
                                            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                          </button>
                                          {showDropdown === getSafeId(message._id) && (
                                            <div className="absolute left-0 bottom-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl py-2 z-20 min-w-[120px] backdrop-blur-sm">
                                              <button 
                                                onClick={() => handleEditMessage(feedback._id, message._id)} 
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                              >
                                                <Edit3 className="w-4 h-4 text-blue-500" /> 
                                                <span>Edit</span>
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteMessage(feedback._id, message._id)} 
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                              >
                                                <Trash2 className="w-4 h-4" /> 
                                                <span>Delete</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Message Content */}
                                      {editingMessage === getSafeId(message._id) ? (
                                        <div className="min-w-[250px] space-y-3">
                                          <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full p-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                            placeholder="Edit your message..."
                                          />
                                          <div className="flex justify-end gap-2">
                                            <button 
                                              onClick={() => handleSaveEdit(feedback._id, message._id)} 
                                              className="p-2 bg-green-500 hover:bg-green-600 rounded-lg text-white shadow-lg transition-colors"
                                            >
                                              <Check className="w-4 h-4"/>
                                            </button>
                                            <button 
                                              onClick={() => setEditingMessage(null)} 
                                              className="p-2 bg-gray-500 hover:bg-gray-600 rounded-lg text-white shadow-lg transition-colors"
                                            >
                                              <X className="w-4 h-4"/>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {message.message && (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                              {message.message}
                                            </p>
                                          )}
                                          
                                          {/* Message Images */}
                                          {message.images?.length > 0 && (
                                            <div className={`grid gap-3 mt-4 ${
                                              message.images.length === 1 ? 'grid-cols-1' : 
                                              message.images.length === 2 ? 'grid-cols-2' : 
                                              'grid-cols-2 md:grid-cols-3'
                                            }`}>
                                              {message.images.map(image => (
                                                <div
                                                  key={image.id}
                                                  className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-white/20 hover:border-white/40 transition-all duration-200"
                                                  onClick={() => setImagePreview(image)}
                                                >
                                                  <img
                                                    src={`${API_BASE_URL}${image.url}`}
                                                    alt="attachment"
                                                    className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                                                  />
                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-200">
                                                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* Edited indicator */}
                                    {message.edited && (
                                      <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
                                        isCurrentUser 
                                          ? `${currentTheme.accent} bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30` 
                                          : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
                                      }`}>
                                        edited
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start the conversation below</p>
                          </div>
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-600">
                        
                        {/* Image Preview for New Message */}
                        {newMessageImages[getSafeId(feedback._id)] && newMessageImages[getSafeId(feedback._id)].length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Attachments ({newMessageImages[getSafeId(feedback._id)].length})
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                              {newMessageImages[getSafeId(feedback._id)].map(image => (
                                <div key={image.id} className="relative group">
                                  <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                                    <img
                                      src={image.preview}
                                      alt={image.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeMessageImage(getSafeId(feedback._id), image.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {image.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Input Area */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="text"
                                value={newMessages[getSafeId(feedback._id)] || ''}
                                onChange={(e) => setNewMessages(prev => ({
                                  ...prev,
                                  [getSafeId(feedback._id)]: e.target.value
                                }))}
                                placeholder="Type your message here..."
                                className="w-full pl-4 pr-12 py-4 text-sm bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(getSafeId(feedback._id));
                                  }
                                }}
                              />
                              
                              {/* Image Upload Button */}
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(getSafeId(feedback._id), e.target.files)}
                                  className="hidden"
                                  id={`image-upload-${getSafeId(feedback._id)}`}
                                />
                                <label
                                  htmlFor={`image-upload-${getSafeId(feedback._id)}`}
                                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-center group"
                                  title="Attach images"
                                >
                                  <ImageIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:${currentTheme.accent} transition-colors`} />
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Send Button */}
                          <button
                            onClick={() => handleSendMessage(getSafeId(feedback._id))}
                            disabled={!newMessages[getSafeId(feedback._id)]?.trim() && (!newMessageImages[getSafeId(feedback._id)] || newMessageImages[getSafeId(feedback._id)].length === 0)}
                            className={`px-6 py-4 bg-gradient-to-r ${currentTheme.primary} hover:${currentTheme.primaryHover} disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2`}
                          >
                            <Send className="w-5 h-5" />
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Max 5MB per image
                            </span>
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              Up to 10 images
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                            <span>to send</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Real-time conversations • Secure & Private • Customizable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmittedFeedbacks;

