import React, { useState, useEffect } from 'react';
import { 
  Star, TrendingUp, BarChart3, Users, Award, 
  ThumbsUp, MessageCircle, Filter, Search,
  Calendar, Target, Zap, Heart, CheckCircle, X, AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../../config';

const RatingSystem = () => {
  const [ratings, setRatings] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Sample modules
  const defaultModules = [
    { id: 'overall', name: 'Overall Experience', icon: Award, color: 'from-purple-500 to-pink-500' },
    { id: 'ui-ux', name: 'User Interface & Experience', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { id: 'performance', name: 'System Performance', icon: Zap, color: 'from-green-500 to-emerald-500' },
    { id: 'support', name: 'Customer Support', icon: Users, color: 'from-orange-500 to-red-500' },
    { id: 'features', name: 'Features & Functionality', icon: BarChart3, color: 'from-indigo-500 to-purple-500' },
    { id: 'reliability', name: 'System Reliability', icon: ThumbsUp, color: 'from-teal-500 to-green-500' }
  ];

  // Notification system
  const showNotification = (type, title, message) => {
    const id = Date.now();
    const notification = { id, type, title, message };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchRatings();
    fetchUserRatings();
    fetchModules();
  }, []);

  const fetchRatings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRatings(data.data || []);
      } else {
        console.error('Failed to fetch ratings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchUserRatings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ratings/my-ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const userRatingsMap = {};
        data.data.forEach(rating => {
          userRatingsMap[rating.moduleId] = {
            rating: rating.rating,
            comment: rating.comment
          };
        });
        setUserRatings(userRatingsMap);
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    setModules(defaultModules);
  };

  const submitRating = async (moduleId, rating, comment = '') => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moduleId,
          rating,
          comment
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserRatings(prev => ({
          ...prev,
          [moduleId]: { rating, comment }
        }));
        fetchRatings(); // Refresh ratings
        setShowRatingModal(false);
        setSelectedModule(null);
        
        // Show success notification
        const moduleName = defaultModules.find(m => m.id === moduleId)?.name || 'Module';
        showNotification(
          'success',
          'Rating Submitted Successfully!',
          `Thank you for rating ${moduleName}. Your feedback helps us improve our services.`
        );
      } else {
        const errorData = await response.json();
        showNotification(
          'error',
          'Rating Failed',
          errorData.message || 'Failed to submit rating. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification(
        'error',
        'Network Error',
        'Unable to submit rating. Please check your connection and try again.'
      );
    }
  };

  const getModuleStats = (moduleId) => {
    const moduleRatings = ratings.filter(r => r.moduleId === moduleId);
    if (moduleRatings.length === 0) return { average: 0, count: 0, distribution: [0,0,0,0,0] };

    const total = moduleRatings.reduce((sum, r) => sum + r.rating, 0);
    const average = total / moduleRatings.length;
    const distribution = [1,2,3,4,5].map(star => 
      moduleRatings.filter(r => r.rating === star).length
    );

    return { average, count: moduleRatings.length, distribution };
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase());
    const stats = getModuleStats(module.id);
    
    if (activeFilter === 'rated') return matchesSearch && stats.count > 0;
    if (activeFilter === 'unrated') return matchesSearch && stats.count === 0;
    return matchesSearch;
  });

  // Notification Toast Component
  const NotificationToast = ({ notification, onRemove }) => {
    const { id, type, title, message } = notification;
    
    const getNotificationStyles = () => {
      switch (type) {
        case 'success':
          return {
            bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            icon: CheckCircle,
            iconColor: 'text-green-600 dark:text-green-400',
            titleColor: 'text-green-800 dark:text-green-200',
            messageColor: 'text-green-700 dark:text-green-300'
          };
        case 'error':
          return {
            bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            icon: AlertCircle,
            iconColor: 'text-red-600 dark:text-red-400',
            titleColor: 'text-red-800 dark:text-red-200',
            messageColor: 'text-red-700 dark:text-red-300'
          };
        default:
          return {
            bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            icon: CheckCircle,
            iconColor: 'text-blue-600 dark:text-blue-400',
            titleColor: 'text-blue-800 dark:text-blue-200',
            messageColor: 'text-blue-700 dark:text-blue-300'
          };
      }
    };

    const styles = getNotificationStyles();
    const IconComponent = styles.icon;

    return (
      <div className={`${styles.bg} border rounded-xl shadow-lg p-4 mb-3 transform transition-all duration-300 animate-slideIn`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
              {title}
            </h4>
            <p className={`text-sm ${styles.messageColor} leading-relaxed`}>
              {message}
            </p>
          </div>
          <button
            onClick={() => onRemove(id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const RatingModal = () => {
    const [modalRating, setModalRating] = useState(0);
    const [modalComment, setModalComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!showRatingModal || !selectedModule) return null;

    const handleSubmit = async () => {
      setIsSubmitting(true);
      await submitRating(selectedModule.id, modalRating, modalComment);
      setIsSubmitting(false);
      setModalRating(0);
      setModalComment('');
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 animate-modalSlideIn">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${selectedModule.color} rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-transform hover:scale-105`}>
              <selectedModule.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Rate {selectedModule.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your feedback helps us improve our services
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setModalRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                disabled={isSubmitting}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredStar || modalRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="text-center mb-6">
            {modalRating > 0 && (
              <div className="transform transition-all duration-300 animate-fadeIn">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][modalRating]}
                </p>
                <div className="flex justify-center mt-2">
                  {Array.from({ length: modalRating }, (_, i) => (
                    <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full mx-0.5"></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-200"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowRatingModal(false);
                setSelectedModule(null);
                setModalRating(0);
                setModalComment('');
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={modalRating === 0 || isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-full">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Rate Our Services
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your ratings help us understand what we're doing well and where we can improve. 
          Rate individual modules or provide an overall experience rating.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Modules', icon: BarChart3 },
            { id: 'rated', label: 'Rated', icon: Star },
            { id: 'unrated', label: 'Not Rated', icon: MessageCircle }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const stats = getModuleStats(module.id);
          const userRating = userRatings[module.id];
          const IconComponent = module.icon;

          return (
            <div
              key={module.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1"
            >
              {/* Module Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {module.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.count} rating{stats.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating Display */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(stats.average)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.average > 0 ? stats.average.toFixed(1) : 'No ratings'}
                  </span>
                </div>

                {/* Rating Distribution */}
                {stats.count > 0 && (
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = stats.distribution[star - 1];
                      const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
                      
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-gray-600 dark:text-gray-400">{star}</span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-6 text-gray-500 dark:text-gray-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* User's Rating */}
              {userRating && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transform transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Your Rating
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= userRating.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {userRating.rating}/5
                    </span>
                  </div>
                  {userRating.comment && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      "{userRating.comment}"
                    </p>
                  )}
                </div>
              )}

              {/* Rate Button */}
              <button
                onClick={() => {
                  setSelectedModule(module);
                  setShowRatingModal(true);
                }}
                className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all transform hover:scale-105 active:scale-95 ${
                  userRating
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {userRating ? 'Update Rating' : 'Rate This Module'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No modules found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      <RatingModal />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes modalSlideIn {
          from {
            transform: scale(0.9) translateY(-10px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-modalSlideIn {
          animation: modalSlideIn 0.3s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RatingSystem;
