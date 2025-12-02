import React, { useState, useEffect, useRef } from "react";
import { Camera, Trash2, Plus, CheckCircle, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

// Image Preview Modal Component
const ImagePreviewModal = ({ isOpen, image, title, onClose, photos = [], currentIndex = 0, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        onNavigate('next');
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        onNavigate('prev');
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, onNavigate, photos.length]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={(e) => {
        // Close when clicking outside the image
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          <button 
            onClick={onClose}
            className="p-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-100 rounded-full text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="bg-black rounded-lg overflow-hidden flex-grow flex items-center justify-center relative">
          <img 
            src={image.url || image.preview || ""} 
            alt={title} 
            className="max-h-[80vh] max-w-full object-contain"
          />
          
          {/* Navigation arrows - only show if multiple photos */}
          {photos.length > 1 && (
            <>
              {/* Left arrow */}
              <button
                className="absolute left-2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all transform hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('prev');
                }}
              >
                <ChevronLeft size={24} />
              </button>
              
              {/* Right arrow */}
              <button
                className="absolute right-2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all transform hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        <div className="bg-gray-900 text-white p-4 rounded-b-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{title}</h3>
            <div className="flex items-center space-x-4">
              {photos.length > 1 && (
                <div className="text-sm font-medium">
                  {currentIndex + 1} / {photos.length}
                </div>
              )}
              <div className="text-xs text-gray-400">
                {image.timestamp ? new Date(image.timestamp).toLocaleString() : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhotoCategory = ({ title, photos = [], onAddPhoto, onDeletePhoto, onUpdateDescription, onDeleteCategory, showDeleteCategory, isUploading = false }) => {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  
  const handleImageClick = (photo, index) => {
    setPreviewImage(photo);
    setPreviewIndex(index);
  };
  
  const closePreview = () => {
    setPreviewImage(null);
  };
  
  const handleNavigate = (direction) => {
    const newIndex = direction === 'next' 
      ? (previewIndex + 1) % photos.length 
      : (previewIndex - 1 + photos.length) % photos.length;
    
    setPreviewIndex(newIndex);
    setPreviewImage(photos[newIndex]);
  };

  const handleSlideNext = () => {
    if (slideIndex + 2 < photos.length) {
      setSlideIndex(slideIndex + 1);
    }
  };

  const handleSlidePrev = () => {
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    }
  };

  const visiblePhotos = photos.slice(slideIndex, slideIndex + 2);
  const showNavigation = photos.length > 2;

  return (
    <div className="mb-6 border border-gray-200 rounded-md overflow-hidden">
      <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className="flex space-x-2">
          {showDeleteCategory && onDeleteCategory && (
            <button
              type="button"
              onClick={() => onDeleteCategory(title)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete category"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddPhoto(title)}
            disabled={isUploading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
          </button>
        </div>
      </div>
      <div className="p-4">
        {photos.length > 0 ? (
          <div className="relative">
            {/* Navigation Arrows */}
            {showNavigation && slideIndex > 0 && (
              <button
                type="button"
                onClick={handleSlidePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
            )}
            
            {showNavigation && slideIndex + 2 < photos.length && (
              <button
                type="button"
                onClick={handleSlideNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visiblePhotos.map((photo, displayIndex) => {
              const actualIndex = slideIndex + displayIndex;
              return (
              <div
                key={actualIndex}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
                onMouseEnter={() => setHoveredIndex(actualIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative group">
                  <img
                    src={photo.url || photo.preview || ""}
                    alt={`${title} - ${actualIndex + 1}`}
                    className="w-full h-64 object-contain bg-gray-50 cursor-pointer"
                    onClick={() => handleImageClick(photo, actualIndex)}
                  />
                  <div 
                    className={`absolute top-2 right-2 transition-opacity duration-200
                      ${hoveredIndex === actualIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePhoto(title, actualIndex);
                      }}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={photo.description || ''}
                    onChange={(e) => onUpdateDescription(title, actualIndex, e.target.value)}
                    placeholder="Add description for this image..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                    rows="3"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {photo.timestamp ? new Date(photo.timestamp).toLocaleString() : ''}
                  </div>
                </div>
              </div>
              );
            })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
            <Camera className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 text-center mb-2">
              {t("photos.noPhotos", "No photos added yet")}
            </p>
            <button
              type="button"
              onClick={() => onAddPhoto(title)}
              disabled={isUploading}
              className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t("photos.uploading", "Uploading...")}
                </>
              ) : (
                <>
                  <Camera size={16} className="mr-2" />
                  {t("photos.addPhoto", "Add Photo")}
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewImage !== null}
        image={previewImage || {}}
        title={title}
        photos={photos}
        currentIndex={previewIndex}
        onClose={closePreview}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

const EMBPhotosTab = ({ formData, onFormDataChange }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(new Set()); // Track uploading photos by categoryId
  
  // Load custom categories from localStorage on mount
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("embPrinting_customCategories");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  
  // Load hidden categories from localStorage on mount
  const [hiddenCategories, setHiddenCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("embPrinting_hiddenCategories");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      return new Set();
    }
  });
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const fileInputRef = React.useRef(null);

  // Save custom categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("embPrinting_customCategories", JSON.stringify(customCategories));
  }, [customCategories]);
  
  // Save hidden categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("embPrinting_hiddenCategories", JSON.stringify(Array.from(hiddenCategories)));
  }, [hiddenCategories]);

  // Always get photos directly from formData (don't use local variable that can become stale)
  // Default photo categories (excluding "Other" - users can add it as custom if needed)
  const photoCategories = [
    { id: "default_product_view_front", title: "Product View - Front" },
    { id: "default_product_view_back", title: "Product View - Back" },
    { id: "default_compare_embroidery", title: "Compare Sample Vs. Actual - Embroidery" },
    { id: "default_compare_front", title: "Compare Sample Vs. Actual - Front" },
    { id: "default_compare_back", title: "Compare Sample Vs. Actual - Back" },
    { id: "default_compare_print", title: "Compare Sample Vs. Actual - Print" },
    { id: "default_compare_color", title: "Compare Sample Vs. Actual - Color" }
  ];

  const getCategoryTitle = (categoryId) => {
    const defaultCategory = photoCategories.find((cat) => cat.id === categoryId);
    if (defaultCategory) return defaultCategory.title;
    const customCategory = customCategories.find((cat) => cat.id === categoryId);
    if (customCategory) return customCategory.title;
    const existingEntry = (formData.photos || {})[categoryId];
    if (existingEntry?.categoryTitle) return existingEntry.categoryTitle;
    return categoryId;
  };

  const getPhotosForCategory = (categoryId) => {
    const photos = formData.photos || {};
    const entry = photos[categoryId];
    if (entry && Array.isArray(entry.photos)) {
      return entry.photos;
    }
    if (Array.isArray(entry)) {
      return entry;
    }
    return [];
  };

  const setPhotosForCategory = (categoryId, photosArray, categoryTitleOverride) => {
    const currentPhotos = formData.photos || {};
    const updatedPhotos = { ...currentPhotos };
    const categoryTitle = categoryTitleOverride || getCategoryTitle(categoryId);

    if (photosArray.length > 0) {
      updatedPhotos[categoryId] = {
        categoryId,
        categoryTitle,
        photos: photosArray
      };
    } else {
      delete updatedPhotos[categoryId];
    }

    onFormDataChange({ photos: updatedPhotos });
  };
  
  // Ensure photo entries always use metadata structure
  useEffect(() => {
    const photos = formData.photos || {};
    const needsUpgrade = Object.keys(photos).some(
      (categoryId) => Array.isArray(photos[categoryId])
    );

    if (needsUpgrade) {
      const upgradedPhotos = {};
      Object.keys(photos).forEach((categoryId) => {
        const entry = photos[categoryId];
        if (Array.isArray(entry)) {
          upgradedPhotos[categoryId] = {
            categoryId,
            categoryTitle: getCategoryTitle(categoryId),
            photos: entry
          };
        } else {
          upgradedPhotos[categoryId] = entry;
        }
      });
      onFormDataChange({ photos: upgradedPhotos });
    }
  }, [formData.photos, customCategories]);

  const handleAddPhoto = (categoryTitle) => {
    // Check both fixed categories and custom categories
    const category = photoCategories.find(cat => cat.title === categoryTitle) ||
                     customCategories.find(cat => cat.title === categoryTitle);
    if (category) {
      setActiveCategory(category.id);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !activeCategory) {
      e.target.value = null;
      return;
    }

    setUploadingPhotos((prev) => new Set([...prev, activeCategory]));

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result;
      const newPhoto = {
        id: `photo-${Date.now()}-${Math.random()}`,
        file,
        preview,
        url: "",
        timestamp: new Date().toISOString(),
        description: ""
      };

      const categoryTitle = getCategoryTitle(activeCategory);
      const currentPhotos = getPhotosForCategory(activeCategory);
      setPhotosForCategory(activeCategory, [...currentPhotos, newPhoto], categoryTitle);

      setUploadingPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activeCategory);
        return newSet;
      });
      e.target.value = null;
    };

    reader.onerror = () => {
      console.error("Error reading file");
      setUploadingPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activeCategory);
        return newSet;
      });
      e.target.value = null;
    };

    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (categoryTitle, photoIndex) => {
    // Check both fixed categories and custom categories
    const category = photoCategories.find(cat => cat.title === categoryTitle) ||
                     customCategories.find(cat => cat.title === categoryTitle);
    if (category) {
      const categoryPhotos = getPhotosForCategory(category.id);
      if (categoryPhotos.length > 0) {
        const newCategoryPhotos = categoryPhotos.filter((_, i) => i !== photoIndex);
        setPhotosForCategory(category.id, newCategoryPhotos);
      }
    }
  };

  const handleUpdateDescription = (categoryTitle, photoIndex, description) => {
    // Check both fixed categories and custom categories
    const category = photoCategories.find(cat => cat.title === categoryTitle) ||
                     customCategories.find(cat => cat.title === categoryTitle);
    if (category) {
      const categoryPhotos = getPhotosForCategory(category.id);
      if (categoryPhotos[photoIndex]) {
        const newCategoryPhotos = [...categoryPhotos];
        newCategoryPhotos[photoIndex] = {
          ...newCategoryPhotos[photoIndex],
          description: description
        };
        setPhotosForCategory(category.id, newCategoryPhotos);
      }
    }
  };

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory = {
        id: `custom_${Date.now()}`,
        title: newCategoryName.trim()
      };
      setCustomCategories([...customCategories, newCategory]);
      setNewCategoryName("");
      setShowAddCategoryForm(false);
    }
  };

  const handleDeleteCustomCategory = (categoryId) => {
    setCustomCategories(customCategories.filter(cat => cat.id !== categoryId));
    setPhotosForCategory(categoryId, []);
  };

  const handleDeleteAnyCategory = (categoryTitle) => {
    // Check if it's a custom category
    const customCategory = customCategories.find(cat => cat.title === categoryTitle);
    if (customCategory) {
      handleDeleteCustomCategory(customCategory.id);
    } else {
      // Hide predefined category
      const predefinedCategory = photoCategories.find(cat => cat.title === categoryTitle);
      if (predefinedCategory) {
        setHiddenCategories(new Set([...hiddenCategories, predefinedCategory.id]));
      }
    }
  };

  // Filter out hidden predefined categories
  const visiblePhotoCategories = photoCategories.filter(cat => !hiddenCategories.has(cat.id));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {t("photos.title", "Photo Documentation")}
        </h2>
        <p className="text-gray-600 mb-4">
          {t("photos.description", "Capture and manage photos for quality inspection. Add photos by clicking the + button in each category.")}
        </p>
        {(() => {
          const categoryKeys = Object.keys(formData.photos || {});
          const totalPhotosCount = categoryKeys.reduce(
            (sum, key) => sum + getPhotosForCategory(key).length,
            0
          );
          const categoriesWithPhotosCount = categoryKeys.filter(
            (key) => getPhotosForCategory(key).length > 0
          ).length;
          return (
            <div className="flex space-x-2">
              <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md flex items-center text-sm">
                <Camera className="w-4 h-4 mr-2" />
                <span>{totalPhotosCount} Photos</span>
              </div>
              <div className="px-3 py-2 bg-green-50 text-green-700 rounded-md flex items-center text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>{categoriesWithPhotosCount} Categories</span>
              </div>
            </div>
          );
        })()}
      </div>
      
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        capture="environment"
      />

      {/* Default Categories */}
      {visiblePhotoCategories.length > 0 && (
        <div>
          <div className="space-y-4">
            {visiblePhotoCategories.map((category) => (
              <PhotoCategory
                key={category.id}
                title={category.title}
                photos={getPhotosForCategory(category.id)}
                onAddPhoto={handleAddPhoto}
                onDeletePhoto={handleDeletePhoto}
                onUpdateDescription={handleUpdateDescription}
                onDeleteCategory={handleDeleteAnyCategory}
                showDeleteCategory={false}
                isUploading={uploadingPhotos.has(category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* User-created Categories */}
      {customCategories.length > 0 && (
        <div>
          <div className="space-y-4">
            {customCategories.map((category) => (
              <PhotoCategory
                key={category.id}
                title={category.title}
                photos={getPhotosForCategory(category.id)}
                onAddPhoto={handleAddPhoto}
                onDeletePhoto={handleDeletePhoto}
                onUpdateDescription={handleUpdateDescription}
                onDeleteCategory={(categoryTitle) => {
                  const categoryToDelete = customCategories.find(cat => cat.title === categoryTitle);
                  if (categoryToDelete) {
                    handleDeleteCustomCategory(categoryToDelete.id);
                  }
                }}
                showDeleteCategory={true}
                isUploading={uploadingPhotos.has(category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Category Button */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        {!showAddCategoryForm ? (
          <button
            onClick={() => setShowAddCategoryForm(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Custom Category</span>
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomCategory();
                }
              }}
              placeholder="Enter category name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddCustomCategory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setShowAddCategoryForm(false);
                  setNewCategoryName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EMBPhotosTab;
