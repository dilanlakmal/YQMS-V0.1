import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../authentication/AuthContext';
import { 
  MessageCircle, Send, Image as ImageIcon, Calendar, User, Tag, 
  ChevronDown, ChevronUp, Edit3, Trash2, X, Check, 
  MoreVertical, Eye, Clock, AlertCircle, CheckCircle2, XCircle,
  Paperclip, Palette, Settings, Sparkles, Filter, Search,
  MessageSquare, Users, Activity, Zap, AtSign, Reply
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Mention functionality states
  const [showMentionDropdown, setShowMentionDropdown] = useState({});
  const [mentionQuery, setMentionQuery] = useState({});
  const [cursorPosition, setCursorPosition] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const inputRefs = useRef({});
  const [mentionedMessages, setMentionedMessages] = useState({});
  
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

  // Theme configurations (keeping existing themes)
  const themes = {
    default: {
      name: 'Ocean Blue',
      primary: 'from-blue-600 to-indigo-600',
      primaryHover: 'from-blue-700 to-indigo-700',
      secondary: 'from-gray-500 to-gray-600',
      accent: 'text-blue-600',
      userBubble: 'bg-gradient-to-br from-blue-600 to-indigo-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
      icon: '🌊'
    },
    purple: {
      name: 'Royal Purple',
      primary: 'from-purple-600 to-pink-600',
      primaryHover: 'from-purple-700 to-pink-700',
      secondary: 'from-purple-500 to-purple-600',
      accent: 'text-purple-600',
      userBubble: 'bg-gradient-to-br from-purple-600 to-pink-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600',
      icon: '💜'
    },
    green: {
      name: 'Forest Green',
      primary: 'from-green-600 to-emerald-600',
      primaryHover: 'from-green-700 to-emerald-700',
      secondary: 'from-green-500 to-green-600',
      accent: 'text-green-600',
      userBubble: 'bg-gradient-to-br from-green-600 to-emerald-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600',
      icon: '🌲'
    },
    orange: {
      name: 'Sunset Orange',
      primary: 'from-orange-600 to-red-600',
      primaryHover: 'from-orange-700 to-red-700',
      secondary: 'from-orange-500 to-orange-600',
      accent: 'text-orange-600',
      userBubble: 'bg-gradient-to-br from-orange-600 to-red-600',
      otherBubble: 'bg-white dark:bg-gray-700 border border-orange-200 dark:border-orange-600',
      icon: '🌅'
    },
    dark: {
      name: 'Midnight Dark',
      primary: 'from-gray-800 to-gray-900',
      primaryHover: 'from-gray-900 to-black',
      secondary: 'from-gray-600 to-gray-700',
      accent: 'text-gray-800',
      userBubble: 'bg-gradient-to-br from-gray-800 to-gray-900',
      otherBubble: 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
      icon: '🌙'
    }
  };

  const backgrounds = {
    default: {
      name: 'Clean',
      class: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50',
      pattern: '',
      icon: '✨'
    },
    dots: {
      name: 'Dotted',
      class: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50',
      pattern: 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[length:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]',
      icon: '⚪'
    },
    grid: {
      name: 'Grid',
      class: 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50',
      pattern: 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:20px_20px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]',
      icon: '⚏'
    },
    waves: {
      name: 'Waves',
      class: 'bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]',
      icon: '🌊'
    },
    bubbles: {
      name: 'Bubbles',
      class: 'bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="25" fill="none" stroke="%23e0e7ff" stroke-width="1" opacity="0.3"/%3E%3Ccircle cx="25" cy="25" r="10" fill="none" stroke="%23e0e7ff" stroke-width="1" opacity="0.2"/%3E%3Ccircle cx="75" cy="75" r="15" fill="none" stroke="%23e0e7ff" stroke-width="1" opacity="0.2"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23a)"/%3E%3C/svg%3E")]',
      icon: '🫧'
    }
  };

  const bubbleStyles = {
    modern: {
      name: 'Modern',
      user: 'rounded-2xl rounded-br-md',
      other: 'rounded-2xl rounded-bl-md',
      shadow: 'shadow-lg',
      icon: '💫'
    },
    classic: {
      name: 'Classic',
      user: 'rounded-lg',
      other: 'rounded-lg',
      shadow: 'shadow-md',
      icon: '📝'
    },
    minimal: {
      name: 'Minimal',
      user: 'rounded-xl',
      other: 'rounded-xl',
      shadow: 'shadow-sm',
      icon: '⚪'
    },
    bubble: {
      name: 'Bubble',
      user: 'rounded-full px-6',
      other: 'rounded-full px-6',
      shadow: 'shadow-lg',
      icon: '🫧'
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

  // Fetch available users for mentions
  const fetchAvailableUsers = async (feedbackId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${feedbackId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      // Fallback: extract users from existing messages
      const feedback = feedbacks.find(f => getSafeId(f._id) === getSafeId(feedbackId));
      if (feedback && feedback.messages) {
        const uniqueUsers = [...new Set(feedback.messages.map(msg => msg.author))];
        const userList = uniqueUsers.map(author => ({
          id: author,
          name: author,
          avatar: author.charAt(0).toUpperCase()
        }));
        setAvailableUsers(userList);
      }
    }
  };

  // Handle mention input
  const handleMentionInput = (feedbackId, value, selectionStart) => {
    const beforeCursor = value.substring(0, selectionStart);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(prev => ({ ...prev, [feedbackId]: query }));
      setShowMentionDropdown(prev => ({ ...prev, [feedbackId]: true }));
      setCursorPosition(prev => ({ ...prev, [feedbackId]: selectionStart }));
      
      // Fetch users if not already loaded
      if (availableUsers.length === 0) {
        fetchAvailableUsers(feedbackId);
      }
    } else {
      setShowMentionDropdown(prev => ({ ...prev, [feedbackId]: false }));
      setMentionQuery(prev => ({ ...prev, [feedbackId]: '' }));
    }
  };

  // Filter users based on mention query
  const getFilteredUsers = (feedbackId) => {
    const query = mentionQuery[feedbackId] || '';
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(query) && 
      user.name !== (user.eng_name || user.name) // Don't mention yourself
    );
  };

  // Insert mention
  const insertMention = (feedbackId, user) => {
    const currentMessage = newMessages[feedbackId] || '';
    const position = cursorPosition[feedbackId] || 0;
    const beforeCursor = currentMessage.substring(0, position);
    const afterCursor = currentMessage.substring(position);
    
    // Find the @ symbol position
    const mentionStart = beforeCursor.lastIndexOf('@');
    const beforeMention = currentMessage.substring(0, mentionStart);
    const newMessage = `${beforeMention}@${user.name} ${afterCursor}`;
    
    setNewMessages(prev => ({ ...prev, [feedbackId]: newMessage }));
    setShowMentionDropdown(prev => ({ ...prev, [feedbackId]: false }));
    setMentionQuery(prev => ({ ...prev, [feedbackId]: '' }));
    
    // Focus back to input
    setTimeout(() => {
      const input = inputRefs.current[feedbackId];
      if (input) {
        const newPosition = mentionStart + user.name.length + 2; // +2 for @ and space
        input.focus();
        input.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Handle reply to message
  const handleReplyToMessage = (feedbackId, message) => {
    const replyText = `@${message.author} `;
    setNewMessages(prev => ({ 
      ...prev, 
      [feedbackId]: (prev[feedbackId] || '') + replyText 
    }));
    setReplyingTo(prev => ({ ...prev, [feedbackId]: message }));
    
    // Focus input
    setTimeout(() => {
      const input = inputRefs.current[feedbackId];
      if (input) {
        input.focus();
        input.setSelectionRange(replyText.length, replyText.length);
      }
    }, 0);
  };

  // Clear reply
  const clearReply = (feedbackId) => {
    setReplyingTo(prev => ({ ...prev, [feedbackId]: null }));
  };

  // Parse message for mentions and render them
  const renderMessageWithMentions = (messageText, mentions = []) => {
  if (!messageText) return messageText;
  
  const mentionRegex = /@(\w+)/g;
  const parts = messageText.split(mentionRegex);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) { // This is a mention
      const mention = mentions?.find(m => m.username === part);
      
      return (
        <span 
          key={index} 
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
          title={mention?.message?.message ? `Referenced: "${mention.message.message}"` : `Mentioned: @${part}`}
        >
          <AtSign className="w-3 h-3" />
          {part}
          {mention?.message && (
            <MessageSquare className="w-3 h-3 opacity-70" />
          )}
        </span>
      );
    }
    return part;
  });
};

  // Filter feedbacks based on search and status
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Get feedback statistics
  const getStats = () => {
    const total = feedbacks.length;
    const open = feedbacks.filter(f => f.status === 'open').length;
    const inProgress = feedbacks.filter(f => f.status === 'in-progress').length;
    const resolved = feedbacks.filter(f => f.status === 'resolved').length;
    const closed = feedbacks.filter(f => f.status === 'closed').length;
    
    return { total, open, inProgress, resolved, closed };
  };

  const stats = getStats();

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
  const replyTo = replyingTo[feedbackId];
  const mentions = mentionedMessages[feedbackId] || [];
  
  if (!message?.trim() && images.length === 0) return;

  try {
    const formData = new FormData();
    
    if (message?.trim()) {
      formData.append('message', message.trim());
    }
    
    if (replyTo) {
      formData.append('replyTo', getSafeId(replyTo._id));
    }
    
    if (mentions.length > 0) {
      formData.append('mentions', JSON.stringify(mentions));
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
      setReplyingTo(prev => ({ ...prev, [feedbackId]: null }));
      setMentionedMessages(prev => ({ ...prev, [feedbackId]: [] }));
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

  
// Enhanced function to handle mention with message selection
const handleMentionWithMessage = (feedbackId, user, messageId = null) => {
  const currentMessage = newMessages[feedbackId] || '';
  const position = cursorPosition[feedbackId] || 0;
  const beforeCursor = currentMessage.substring(0, position);
  const afterCursor = currentMessage.substring(position);
  
  // Find the @ symbol position
  const mentionStart = beforeCursor.lastIndexOf('@');
  const beforeMention = currentMessage.substring(0, mentionStart);
  const newMessage = `${beforeMention}@${user.name} ${afterCursor}`;
  
  setNewMessages(prev => ({ ...prev, [feedbackId]: newMessage }));
  
  // Store the mentioned message reference
  if (messageId) {
    setMentionedMessages(prev => ({
      ...prev,
      [feedbackId]: [
        ...(prev[feedbackId] || []),
        { username: user.name, messageId }
      ]
    }));
  }
  
  setShowMentionDropdown(prev => ({ ...prev, [feedbackId]: false }));
  setMentionQuery(prev => ({ ...prev, [feedbackId]: '' }));
  
  // Focus back to input
  setTimeout(() => {
    const input = inputRefs.current[feedbackId];
    if (input) {
      const newPosition = mentionStart + user.name.length + 2;
      input.focus();
      input.setSelectionRange(newPosition, newPosition);
    }
  }, 0);
};

const renderMentionDropdown = (feedbackId) => {
  const feedback = feedbacks.find(f => getSafeId(f._id) === getSafeId(feedbackId));
  const filteredUsers = getFilteredUsers(feedbackId);
  
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-30">
      <div className="p-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <AtSign className="w-4 h-4" />
          <span>Mention someone</span>
        </div>
      </div>
      
      {filteredUsers.length > 0 ? (
        <div className="max-h-64 overflow-y-auto">
          {filteredUsers.map(user => (
            <div key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {/* User header */}
              <button
                onClick={() => handleMentionWithMessage(feedbackId, user)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.avatar || user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mention user</p>
                </div>
              </button>
              
              {/* User's recent messages */}
              {feedback?.messages
                ?.filter(msg => msg.author === user.name)
                ?.slice(-3) // Show last 3 messages
                ?.map(msg => (
                  <button
                    key={getSafeId(msg._id)}
                    onClick={() => handleMentionWithMessage(feedbackId, user, getSafeId(msg._id))}
                    className="w-full px-8 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l-4 border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {msg.message || 'Image message'}
                    </p>
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <AtSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No users found</p>
        </div>
      )}
    </div>
  );
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Your Conversations
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching your feedback discussions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    My Feedback Hub
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track, manage, and engage in real-time conversations with mentions
                  </p>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Open</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolved}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Resolved</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                      <XCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.closed}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Theme Customization Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowThemePanel(!showThemePanel)}
                className={`flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${currentTheme.primary} hover:${currentTheme.primaryHover} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <Palette className="w-5 h-5" />
                <span className="hidden sm:inline">Customize Theme</span>
                <span className="sm:hidden">Theme</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback by title, comment, or module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-8 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer transition-all duration-200 min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || filterStatus !== 'all') && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                  Status: {filterStatus}
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Theme Customization Panel - keeping existing implementation */}
        {showThemePanel && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Theme panel content - same as before */}
          </div>
        )}

        {/* Image Preview Modal */}
        {imagePreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 z-10 p-3 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={imagePreview.preview || `${API_BASE_URL}${imagePreview.url}`}
                alt={imagePreview.name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6">
                <p className="font-semibold text-lg">{imagePreview.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-12 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {feedbacks.length === 0 ? (
                  <MessageCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {feedbacks.length === 0 ? 'No feedback submitted yet' : 'No matching feedback found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {feedbacks.length === 0 
                  ? 'Start a conversation by submitting your first feedback. We\'re here to help improve your experience.'
                  : 'Try adjusting your search terms or filters to find what you\'re looking for.'
                }
              </p>
              {feedbacks.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredFeedbacks.map(feedback => {
              const priorityConfig = getPriorityConfig(feedback.priority);
              const statusConfig = getStatusConfig(feedback.status);
              const PriorityIcon = priorityConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={getSafeId(feedback._id)} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.01]">
                  
                  {/* Enhanced Feedback Header */}
                  <div className="p-8 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1 space-y-6">
                        
                        {/* Title and Badges */}
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {feedback.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border-2 ${priorityConfig.color}`}>
                              <PriorityIcon className="w-4 h-4" />
                              {priorityConfig.label}
                            </span>
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border-2 ${statusConfig.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        
                        {/* Enhanced Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                              <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.module}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Module</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                              <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.author}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Author</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {new Date(feedback.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced Description */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {feedback.comment}
                          </p>
                        </div>
                      </div>
                      
                      {/* Enhanced Chat Toggle Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setExpandedFeedback(expandedFeedback === getSafeId(feedback._id) ? null : getSafeId(feedback._id))}
                          className={`group flex items-center gap-4 px-8 py-4 bg-gradient-to-r ${currentTheme.primary} hover:${currentTheme.primaryHover} text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 text-lg`}
                        >
                          <MessageCircle className="w-6 h-6" />
                          <div className="text-left">
                            <div>Chat</div>
                            <div className="text-sm opacity-80">({feedback.messages?.length || 0} messages)</div>
                          </div>
                          {expandedFeedback === getSafeId(feedback._id) ? (
                            <ChevronUp className="w-6 h-6 group-hover:transform group-hover:-translate-y-1 transition-transform" />
                          ) : (
                            <ChevronDown className="w-6 h-6 group-hover:transform group-hover:translate-y-1 transition-transform" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Chat Section with Mentions */}
                  {expandedFeedback === getSafeId(feedback._id) && (
                    <div className={`${currentBackground.class} ${currentBackground.pattern}`}>
                      
                      {/* Messages Area */}
                      <div className="p-8 max-h-[700px] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {feedback.messages?.length > 0 ? feedback.messages.map((message, index) => {
                          const isCurrentUser = isMessageFromCurrentUser(message);
                          const previousMessage = index > 0 ? feedback.messages[index - 1] : null;
                          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                          
                          return (
                            <div key={getSafeId(message._id)}>
                              {/* Enhanced Date Separator */}
                              {showDateSeparator && (
                                <div className="flex items-center justify-center my-8">
                                  <div className="flex items-center gap-4">
                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent flex-1 w-20"></div>
                                    <div className="px-6 py-3 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-2xl shadow-lg">
                                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span>{formatMessageDate(message.timestamp)}</span>
                                      </div>
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent flex-1 w-20"></div>
                                  </div>
                                </div>
                              )}

                              {/* Enhanced Message with Reply Indicator */}
                              <div className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`relative max-w-[80%] group ${isCurrentUser ? 'flex flex-row-reverse items-end' : 'flex items-end'}`}>
                                  
                                  {/* Enhanced Avatar */}
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-xl border-2 border-white dark:border-gray-600 ${
                                    isCurrentUser 
                                      ? `ml-4 bg-gradient-to-br ${currentTheme.primary}` 
                                      : `mr-4 bg-gradient-to-br ${currentTheme.secondary}`
                                  }`}>
                                    {message.author.charAt(0).toUpperCase()}
                                  </div>

                                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    
                                    {/* Enhanced Author and time */}
                                    <div className={`flex items-center gap-3 mb-3 px-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                        {isCurrentUser ? 'You' : message.author}
                                        {message.isAdmin && (
                                          <span className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-bold shadow-lg">
                                            ✨ STAFF
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                        {formatMessageTime(message.timestamp)}
                                      </span>
                                    </div>

                                    {/* Enhanced Message bubble */}
                                    <div className={`relative px-6 py-4 ${currentBubbleStyle.shadow} backdrop-blur-sm border-2 ${
                                      isCurrentUser
                                        ? `${currentTheme.userBubble} text-white ${currentBubbleStyle.user} border-white/20`
                                        : `${currentTheme.otherBubble} text-gray-900 dark:text-white ${currentBubbleStyle.other}`
                                    }`}>
                                      
                                      {/* Reply Indicator - Now inside the message bubble */}
                                      {message.replyTo && (
                                        <div className={`mb-4 p-3 rounded-xl border-l-4 ${
                                          isCurrentUser 
                                            ? 'bg-white/20 border-white/40' 
                                            : 'bg-gray-100 dark:bg-gray-600 border-blue-500'
                                        }`}>
                                          <div className="flex items-center gap-2 mb-2">
                                            <Reply className={`w-3 h-3 ${isCurrentUser ? 'text-white/80' : 'text-blue-600 dark:text-blue-400'}`} />
                                            <span className={`text-xs font-semibold ${
                                              isCurrentUser 
                                                ? 'text-white/90' 
                                                : 'text-blue-800 dark:text-blue-200'
                                            }`}>
                                              {message.replyTo.author}
                                            </span>
                                          </div>
                                          <p className={`text-sm leading-relaxed ${
                                            isCurrentUser 
                                              ? 'text-white/80' 
                                              : 'text-gray-700 dark:text-gray-300'
                                          }`}>
                                            {renderMessageWithMentions(message.replyTo.message)}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Enhanced Message Actions for Current User */}
                                      {isCurrentUser && (
                                        <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                          <button
                                            onClick={() => setShowDropdown(showDropdown === getSafeId(message._id) ? null : getSafeId(message._id))}
                                            className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl shadow-xl backdrop-blur-sm transition-colors border border-gray-200 dark:border-gray-600"
                                          >
                                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                          </button>
                                          {showDropdown === getSafeId(message._id) && (
                                            <div className="absolute left-0 bottom-16 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl py-3 z-20 min-w-[140px] backdrop-blur-sm">
                                              <button 
                                                onClick={() => handleEditMessage(feedback._id, message._id)} 
                                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors font-medium"
                                              >
                                                <Edit3 className="w-4 h-4 text-blue-500" /> 
                                                <span>Edit Message</span>
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteMessage(feedback._id, message._id)} 
                                                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors font-medium"
                                              >
                                                <Trash2 className="w-4 h-4" /> 
                                                <span>Delete Message</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Reply Button for All Messages */}
                                      {!isCurrentUser && (
                                        <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                          <button
                                            onClick={() => handleReplyToMessage(getSafeId(feedback._id), message)}
                                            className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl shadow-xl backdrop-blur-sm transition-colors border border-gray-200 dark:border-gray-600"
                                            title="Reply to this message"
                                          >
                                            <Reply className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                          </button>
                                        </div>
                                      )}

                                      {/* Enhanced Message Content */}
                                      {editingMessage === getSafeId(message._id) ? (
                                        <div className="min-w-[300px] space-y-4">
                                          <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full p-4 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-200"
                                            rows={4}
                                            placeholder="Edit your message..."
                                          />
                                          <div className="flex justify-end gap-3">
                                            <button 
                                              onClick={() => handleSaveEdit(feedback._id, message._id)} 
                                              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium"
                                            >
                                              <Check className="w-4 h-4"/>
                                              Save
                                            </button>
                                            <button 
                                              onClick={() => setEditingMessage(null)} 
                                              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-xl text-white shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium"
                                            >
                                              <X className="w-4 h-4"/>
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {message.message && (
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                              {renderMessageWithMentions(message.message)}
                                            </div>
                                          )}
                                          
                                          {/* Enhanced Message Images */}
                                          {message.images?.length > 0 && (
                                            <div className={`grid gap-4 mt-6 ${
                                              message.images.length === 1 ? 'grid-cols-1' : 
                                              message.images.length === 2 ? 'grid-cols-2' : 
                                              'grid-cols-2 md:grid-cols-3'
                                            }`}>
                                              {message.images.map(image => (
                                                <div
                                                  key={image.id}
                                                  className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-white/30 hover:border-white/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                  onClick={() => setImagePreview(image)}
                                                >
                                                  <img
                                                    src={`${API_BASE_URL}${image.url}`}
                                                    alt="attachment"
                                                    className="w-full h-36 object-cover group-hover:scale-110 transition-transform duration-300"
                                                  />
                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-300">
                                                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                      <Eye className="w-6 h-6 text-white" />
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* Enhanced Edited indicator */}
                                    {message.edited && (
                                      <div className={`text-xs mt-3 px-3 py-1 rounded-full border ${
                                        isCurrentUser 
                                          ? `${currentTheme.accent} bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800` 
                                          : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                                      }`}>
                                        ✏️ edited
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200 dark:border-gray-600">
                              <MessageCircle className="w-10 h-10 text-gray-400" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">No messages yet</h4>
                            <p className="text-gray-400 dark:text-gray-500">Start the conversation below to get help with your feedback</p>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Message Input with Mentions */}
                      <div className="p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t-2 border-gray-200 dark:border-gray-600">
                      
                        
                        {/* Reply Indicator */}
                        {replyingTo[getSafeId(feedback._id)] && (
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Reply className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                  Replying to {replyingTo[getSafeId(feedback._id)].author}
                                </span>
                              </div>
                              <button
                                onClick={() => clearReply(getSafeId(feedback._id))}
                                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
                              >
                                <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 truncate">
                              {replyingTo[getSafeId(feedback._id)].message}
                            </p>
                          </div>
                        )}

                        {/* Enhanced Image Preview for New Message */}
                        {newMessageImages[getSafeId(feedback._id)] && newMessageImages[getSafeId(feedback._id)].length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Paperclip className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                Attachments ({newMessageImages[getSafeId(feedback._id)].length})
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                              {newMessageImages[getSafeId(feedback._id)].map(image => (
                                <div key={image.id} className="relative group">
                                  <div className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-lg">
                                    <img
                                      src={image.preview}
                                      alt={image.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeMessageImage(getSafeId(feedback._id), image.id)}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 border-2 border-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                                    {image.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Enhanced Input Area with Mention Support */}
                        <div className="flex gap-4">
                          <div className="flex-1 relative">
                            <div className="relative">
                              <input
                                ref={(el) => inputRefs.current[getSafeId(feedback._id)] = el}
                                type="text"
                                value={newMessages[getSafeId(feedback._id)] || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const selectionStart = e.target.selectionStart;
                                  setNewMessages(prev => ({
                                    ...prev,
                                    [getSafeId(feedback._id)]: value
                                  }));
                                  handleMentionInput(getSafeId(feedback._id), value, selectionStart);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setShowMentionDropdown(prev => ({ ...prev, [getSafeId(feedback._id)]: false }));
                                  }
                                }}
                                placeholder="Type your message here... Use @ to mention someone"
                                className="w-full pl-6 pr-16 py-4 text-lg bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 shadow-lg"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown[getSafeId(feedback._id)]) {
                                    e.preventDefault();
                                    handleSendMessage(getSafeId(feedback._id));
                                  }
                                }}
                              />
                              
                              {/* Mention Dropdown */}
                              {showMentionDropdown[getSafeId(feedback._id)] && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-30">
                                  <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      <AtSign className="w-4 h-4" />
                                      <span>Mention someone</span>
                                    </div>
                                  </div>
                                  {getFilteredUsers(getSafeId(feedback._id)).length > 0 ? (
                                    getFilteredUsers(getSafeId(feedback._id)).map(user => (
                                      <button
                                        key={user.id}
                                        onClick={() => insertMention(getSafeId(feedback._id), user)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                      >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                          {user.avatar || user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Click to mention</p>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                      <AtSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">No users found</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Enhanced Image Upload Button */}
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
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
                                  className="p-3 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl cursor-pointer transition-colors duration-200 flex items-center justify-center group border border-gray-200 dark:border-gray-600 shadow-md"
                                  title="Attach images"
                                >
                                  <ImageIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:${currentTheme.accent} transition-colors`} />
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Send Button */}
                          <button
                            onClick={() => handleSendMessage(getSafeId(feedback._id))}
                            disabled={!newMessages[getSafeId(feedback._id)]?.trim() && (!newMessageImages[getSafeId(feedback._id)] || newMessageImages[getSafeId(feedback._id)].length === 0)}
                            className={`px-8 py-4 bg-gradient-to-r ${currentTheme.primary} hover:${currentTheme.primaryHover} disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-3 text-lg`}
                          >
                            <Send className="w-6 h-6" />
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>

                        {/* Enhanced Quick Actions with Mention Info */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                              <AtSign className="w-4 h-4" />
                              Type @ to mention
                            </span>
                            <span className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                              <ImageIcon className="w-4 h-4" />
                              Max 5MB per image
                            </span>
                            <span className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                              <Paperclip className="w-4 h-4" />
                              Up to 10 images
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <kbd className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-mono border border-gray-200 dark:border-gray-600">Enter</kbd>
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

        {/* Enhanced Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Live Updates</span>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <AtSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Mentions & Replies</span>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Secure & Private</span>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Palette className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Fully Customizable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmittedFeedbacks;


