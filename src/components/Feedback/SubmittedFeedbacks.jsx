import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Send, Image as ImageIcon, Calendar, User, Tag, 
  ChevronDown, ChevronUp, Edit3, Trash2, X, Check, Upload, 
  MoreVertical, Eye
} from 'lucide-react';

const SubmittedFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [newMessages, setNewMessages] = useState({});
  const [newMessageImages, setNewMessageImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentUser, setCurrentUser] = useState('6746b2c2b2c45a00e00599bb');

  const API_BASE_URL = 'https://192.167.12.85:5000';

  // Fetch current user and feedbacks
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUser(payload.userId);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/my-feedbacks`);
      
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
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
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

      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${feedbackId}/messages`, {
        method: 'POST',
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
    const feedback = feedbacks.find(f => f._id === feedbackId);
    const message = feedback?.messages.find(m => m._id === messageId);
    
    if (message && message.authorId === currentUser) {
      setEditingMessage(messageId);
      setEditText(message.message);
      setShowDropdown(null);
    }
  };

  const handleSaveEdit = async (feedbackId, messageId) => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${feedbackId}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editText.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        setFeedbacks(prev => prev.map(feedback => 
          feedback._id === feedbackId 
            ? {
                ...feedback,
                messages: feedback.messages.map(message =>
                  message._id === messageId
                    ? data.data
                    : message
                )
              }
            : feedback
        ));

        setEditingMessage(null);
        setEditText('');
      } else {
        console.error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (feedbackId, messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/${feedbackId}/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFeedbacks(prev => prev.map(feedback => 
          feedback._id === feedbackId 
            ? {
                ...feedback,
                messages: feedback.messages.filter(message => message._id !== messageId)
              }
            : feedback
        ));
        setShowDropdown(null);
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'in-progress': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'closed': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading feedbacks...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={imagePreview.preview}
              alt={imagePreview.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <p className="text-sm">{imagePreview.name}</p>
            </div>
          </div>
        </div>
      )}

      {feedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No feedback submitted yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Submit your first feedback to get started with the conversation.
          </p>
        </div>
      ) : (
        feedbacks.map(feedback => (
          <div key={feedback._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Feedback Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {feedback.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                      {feedback.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                      {feedback.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {feedback.module}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {feedback.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300">
                    {feedback.comment}
                  </p>
                </div>
                
                <button
                  onClick={() => setExpandedFeedback(expandedFeedback === feedback._id ? null : feedback._id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat ({feedback.messages?.length || 0})
                  {expandedFeedback === feedback._id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Chat Section */}
            {expandedFeedback === feedback._id && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Messages */}
                <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                  {feedback.messages?.map(message => {
                    const isCurrentUser = message.authorId === currentUser || message.authorId?.toString() === currentUser;
                    
                    // Debug logging
                    console.log('Message debug:', {
                      messageId: message._id,
                      messageAuthorId: message.authorId,
                      currentUser,
                      isCurrentUser,
                      authorIdType: typeof message.authorId,
                      currentUserType: typeof currentUser
                    });
                    
                    return (
                    <div
                      key={message._id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg relative group ${
                        isCurrentUser
                          ? 'bg-blue-600 dark:bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        {/* Message Actions for Current User Only */}
                        {isCurrentUser && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="relative">
                              <button
                                onClick={() => setShowDropdown(showDropdown === message._id ? null : message._id)}
                                className="w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              
                              {showDropdown === message._id && (
                                <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                  <button
                                    onClick={() => handleEditMessage(feedback._id, message._id)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(feedback._id, message._id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs font-medium opacity-75">
                            {message.author}
                          </span>
                          <span className="text-xs opacity-50">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          {message.edited && (
                            <span className="text-xs opacity-50">(edited)</span>
                          )}
                        </div>

                        {/* Message Content */}
                        {editingMessage === message._id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(feedback._id, message._id)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditText('');
                                }}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.message && (
                              <p className="text-sm mb-2">{message.message}</p>
                            )}
                            
                            {/* Message Images */}
                            {message.images && message.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {message.images.map(image => (
                                  <div key={image.id} className="relative group cursor-pointer">
                                    <img
                                      src={image.url}
                                      alt={image.name}
                                      className="w-full h-20 object-cover rounded border border-white/20"
                                      onClick={() => setImagePreview(image)}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all duration-200">
                                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}) || (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  {/* Image Preview for New Message */}
                  {newMessageImages[feedback._id] && newMessageImages[feedback._id].length > 0 && (
                    <div className="mb-3 grid grid-cols-4 gap-2">
                      {newMessageImages[feedback._id].map(image => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            onClick={() => removeMessageImage(feedback._id, image.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newMessages[feedback._id] || ''}
                        onChange={(e) => setNewMessages(prev => ({
                          ...prev,
                          [feedback._id]: e.target.value
                        }))}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(feedback._id);
                          }
                        }}
                      />
                      
                      {/* Image Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(feedback._id, e.target.files)}
                          className="hidden"
                          id={`image-upload-${feedback._id}`}
                        />
                        <label
                          htmlFor={`image-upload-${feedback._id}`}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-center"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </label>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSendMessage(feedback._id)}
                      disabled={!newMessages[feedback._id]?.trim() && (!newMessageImages[feedback._id] || newMessageImages[feedback._id].length === 0)}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SubmittedFeedbacks;
