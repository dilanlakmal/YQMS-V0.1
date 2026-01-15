import { useState } from 'react';
import { Send, Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../../config'; // Adjust path as needed

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

  const modules = [
    'Quality Control',
    'Inspection Reports',
    'User Interface',
    'Data Management',
    'Authentication',
    'Dashboard',
    'Export Features',
    'Mobile App',
    'Other'
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    { value: 'high', label: 'High', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' }
  ];

  // Get auth token from localStorage
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
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

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
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
    setMessage({ type: '', text: '' }); // Clear any previous messages
    
    try {
      // Create FormData for multipart/form-data request
      const submitData = new FormData();
      
      // Add form fields
      submitData.append('module', formData.module);
      submitData.append('title', formData.title);
      submitData.append('comment', formData.comment);
      submitData.append('priority', formData.priority);
      
      // Add image files
      images.forEach(image => {
        submitData.append('images', image.file);
      });

      // Make API call to your backend
      const response = await fetch(`${API_BASE_URL}/api/feedbacks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header - let browser set it for FormData
        },
        body: submitData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success - reset form
        setFormData({
          module: '',
          title: '',
          comment: '',
          priority: 'medium'
        });
        setImages([]);
        setMessage({ type: 'success', text: result.message || 'Feedback submitted successfully!' });
        
        // Clear success message after 5 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        // Handle API errors
        throw new Error(result.message || 'Failed to submit feedback');
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // Handle different types of errors
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
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Submit New Feedback
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Help us improve by sharing your thoughts and suggestions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Message Display */}
          {message.text && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                message.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Module <span className="text-red-500">*</span>
              </label>
              <select
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Choose a module...</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority Level
              </label>
              <div className="flex gap-2">
                {priorities.map(priority => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      formData.priority === priority.value
                        ? `${priority.color} ring-2 ring-offset-2 ring-current`
                        : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief description of your feedback..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detailed Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={6}
              placeholder="Please provide detailed feedback, suggestions, or report issues..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attach Images (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload images or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG, WEBP up to 5MB each (Max 10 files)
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map(image => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
