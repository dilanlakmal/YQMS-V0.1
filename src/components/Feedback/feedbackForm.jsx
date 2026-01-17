import { useState } from 'react';
import { 
  Send, Upload, X, FileText, AlertCircle, CheckCircle, 
  Star, MessageSquare, Image as ImageIcon, Zap, 
  ChevronDown, Info, Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '../../../config';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    module: '',
    title: '',
    comment: '',
    priority: 'medium'
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState(false);

  const modules = [
    { value: 'Quality Control', icon: '🔍', description: 'Issues with quality checks and controls' },
    { value: 'Inspection Reports', icon: '📋', description: 'Problems with inspection documentation' },
    { value: 'User Interface', icon: '🎨', description: 'UI/UX improvements and issues' },
    { value: 'Data Management', icon: '📊', description: 'Data handling and storage concerns' },
    { value: 'Authentication', icon: '🔐', description: 'Login and security related issues' },
    { value: 'Dashboard', icon: '📈', description: 'Dashboard functionality and display' },
    { value: 'Export Features', icon: '📤', description: 'Data export and download issues' },
    { value: 'Mobile App', icon: '📱', description: 'Mobile application feedback' },
    { value: 'Other', icon: '💡', description: 'General suggestions and other topics' }
  ];

  const priorities = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      description: 'Minor improvements or suggestions'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      icon: AlertCircle,
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      description: 'Important issues that need attention'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      icon: Zap,
      color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      description: 'Critical issues requiring immediate action'
    }
  ];

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== fileArray.length) {
      setMessage({ 
        type: 'error', 
        text: 'Some files were rejected. Only JPEG, JPG, PNG, WEBP files under 5MB are allowed.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }

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
      setImages(prev => [...prev, ...newImages]);
    });
  };

  const handleImageUpload = (e) => {
    handleFiles(e.target.files);
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.module || !formData.title || !formData.comment) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in to submit feedback' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const submitData = new FormData();
      
      submitData.append('module', formData.module);
      submitData.append('title', formData.title);
      submitData.append('comment', formData.comment);
      submitData.append('priority', formData.priority);
      
      images.forEach(image => {
        submitData.append('images', image.file);
      });

      const response = await fetch(`${API_BASE_URL}/api/feedbacks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormData({
          module: '',
          title: '',
          comment: '',
          priority: 'medium'
        });
        setImages([]);
        setMessage({ type: 'success', text: result.message || 'Feedback submitted successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        throw new Error(result.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      let errorMessage = 'Failed to submit feedback. Please try again.';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('403') || error.message.includes('forbidden')) {
        errorMessage = 'You do not have permission to submit feedback.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModule = modules.find(m => m.value === formData.module);
  const selectedPriority = priorities.find(p => p.value === formData.priority);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-2">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Share Your Feedback
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Help us improve by sharing your thoughts, suggestions, and reporting any issues you encounter
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  New Feedback Submission
                </h2>
                <p className="text-blue-100 text-sm">
                  All fields marked with * are required
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Message Display */}
            {message.text && (
              <div className={`mb-8 p-4 rounded-2xl flex items-start gap-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
              }`}>
                <div className={`p-2 rounded-full ${
                  message.type === 'success' ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    message.type === 'success' 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {message.type === 'success' ? 'Success!' : 'Error'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    message.type === 'success' 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-8">
              
              {/* Module Selection */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                  Select Module <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="module"
                    value={formData.module}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer transition-all duration-200"
                    required
                  >
                    <option value="">Choose a module...</option>
                    {modules.map(module => (
                      <option key={module.value} value={module.value}>
                        {module.icon} {module.value}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                </div>
                {selectedModule && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {selectedModule.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Priority Selection */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                  Priority Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {priorities.map(priority => {
                    const IconComponent = priority.icon;
                    return (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                        className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left group hover:scale-105 ${
                          formData.priority === priority.value
                            ? `${priority.color} ring-4 ring-offset-2 ring-current/20 shadow-lg`
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className={`w-6 h-6 ${
                            formData.priority === priority.value 
                              ? 'text-current' 
                              : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }`} />
                          <span className={`font-semibold ${
                            formData.priority === priority.value 
                              ? 'text-current' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {priority.label}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          formData.priority === priority.value 
                            ? 'text-current opacity-80' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {priority.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                  Feedback Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of your feedback..."
                    className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                  Detailed Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Please provide detailed feedback, suggestions, or report issues. The more specific you are, the better we can help you..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-200"
                  required
                />
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Minimum 10 characters recommended</span>
                  <span>{formData.comment.length} characters</span>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                  Attach Images (Optional)
                </label>
                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="image-upload"
                  />
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl">
                      <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Drop images here or click to browse
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        PNG, JPG, WEBP up to 5MB each • Maximum 10 files
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Attached Images ({images.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map(image => (
                        <div key={image.id} className="relative group bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-600">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {image.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(image.size)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Submitting Your Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Submit Feedback
                    </>
                  )}
                </button>
                
                {!isSubmitting && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Your feedback helps us improve our services
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Secure submission • Your privacy is protected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
