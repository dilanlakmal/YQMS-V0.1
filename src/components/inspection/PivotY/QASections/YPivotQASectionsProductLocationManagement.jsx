import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsProductLocationManagement = () => {
  // State management
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [frontLocations, setFrontLocations] = useState([]);
  const [backLocations, setBackLocations] = useState([]);
  const [isMarkingFront, setIsMarkingFront] = useState(false);
  const [isMarkingBack, setIsMarkingBack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  const [viewMode, setViewMode] = useState("create"); // 'create' or 'list'
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  const [loadingProductTypes, setLoadingProductTypes] = useState(true);

  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);

  // Fetch product types on mount
  useEffect(() => {
    fetchProductTypes();
    fetchSavedConfigurations();
  }, []);

  const fetchProductTypes = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-type`
      );
      if (response.data.success) {
        setProductTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load product types"
      });
    }
  };

  const fetchSavedConfigurations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location`
      );
      if (response.data.success) {
        setSavedConfigurations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    }
  };

  // Handle image upload
  const handleImageUpload = (e, view) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload an image file"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Please upload an image smaller than 10MB"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (view === "front") {
        setFrontImage(file);
        setFrontImagePreview(reader.result);
        setFrontLocations([]);
      } else {
        setBackImage(file);
        setBackImagePreview(reader.result);
        setBackLocations([]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle image click to mark location
  const handleImageClick = (e, view) => {
    const isMarking = view === "front" ? isMarkingFront : isMarkingBack;
    if (!isMarking) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    Swal.fire({
      title: "Enter Location Name",
      input: "text",
      inputPlaceholder: "e.g., Front Pocket, Back Collar",
      showCancelButton: true,
      confirmButtonText: "Add Location",
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a location name";
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const locations = view === "front" ? frontLocations : backLocations;
        const newLocation = {
          LocationNo: locations.length + 1,
          LocationName: result.value,
          x: x,
          y: y
        };

        if (view === "front") {
          setFrontLocations([...frontLocations, newLocation]);
        } else {
          setBackLocations([...backLocations, newLocation]);
        }

        Swal.fire({
          icon: "success",
          title: "Location Added",
          text: `Location "${result.value}" has been marked`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Remove location
  const removeLocation = (locationNo, view) => {
    Swal.fire({
      title: "Remove Location?",
      text: "Are you sure you want to remove this location?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove it"
    }).then((result) => {
      if (result.isConfirmed) {
        if (view === "front") {
          const updated = frontLocations
            .filter((loc) => loc.LocationNo !== locationNo)
            .map((loc, index) => ({ ...loc, LocationNo: index + 1 }));
          setFrontLocations(updated);
        } else {
          const updated = backLocations
            .filter((loc) => loc.LocationNo !== locationNo)
            .map((loc, index) => ({ ...loc, LocationNo: index + 1 }));
          setBackLocations(updated);
        }
      }
    });
  };

  // Save configuration
  const handleSave = async () => {
    // Validation
    if (!selectedProductType) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a product type"
      });
      return;
    }

    if (!frontImage || !backImage) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please upload both front and back view images"
      });
      return;
    }

    if (frontLocations.length === 0 && backLocations.length === 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "No Locations Marked",
        text: "You haven't marked any locations. Continue anyway?",
        showCancelButton: true,
        confirmButtonText: "Yes, Continue",
        cancelButtonText: "Go Back",
        confirmButtonColor: "#6366f1",
        cancelButtonColor: "#6b7280"
      });

      if (!result.isConfirmed) return;
    }

    submitData();
  };

  const submitData = async () => {
    setLoading(true);

    try {
      const productTypeObj = productTypes.find(
        (pt) => pt._id === selectedProductType
      );

      const formData = new FormData();
      formData.append("productTypeId", selectedProductType);
      formData.append(
        "productTypeName",
        productTypeObj?.EnglishProductName || "Unknown"
      );
      formData.append("frontView", frontImage);
      formData.append("backView", backImage);
      formData.append("frontLocations", JSON.stringify(frontLocations));
      formData.append("backLocations", JSON.stringify(backLocations));

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-product-location`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Product location configuration saved successfully",
          confirmButtonColor: "#6366f1"
        });

        resetForm();
        fetchSavedConfigurations();
        setViewMode("list");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save configuration"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProductType("");
    setFrontImage(null);
    setBackImage(null);
    setFrontImagePreview(null);
    setBackImagePreview(null);
    setFrontLocations([]);
    setBackLocations([]);
    setIsMarkingFront(false);
    setIsMarkingBack(false);
  };

  // View saved configuration
  const viewConfiguration = (config) => {
    setSelectedConfig(config);
    setViewMode("preview");
  };

  // Delete configuration
  const deleteConfiguration = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the location configuration and images",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-product-location/${id}`
        );

        if (response.data.success) {
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Configuration has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });
          fetchSavedConfigurations();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message || "Failed to delete configuration"
        });
      }
    }
  };

  // Render location markers
  const renderLocationMarkers = (locations, color = "red") => {
    return locations.map((location) => (
      <div
        key={location.LocationNo || location._id}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
        style={{
          left: `${location.x}%`,
          top: `${location.y}%`
        }}
        onMouseEnter={() => setHoveredLocation(location)}
        onMouseLeave={() => setHoveredLocation(null)}
      >
        <div className="relative">
          <div
            className={`w-8 h-8 bg-${color}-500 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer`}
            style={{ backgroundColor: color === "red" ? "#ef4444" : "#3b82f6" }}
          >
            {location.LocationNo}
          </div>
          {hoveredLocation?.LocationNo === location.LocationNo && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10 shadow-lg">
              <div className="font-semibold">
                Location {location.LocationNo}
              </div>
              <div>{location.LocationName}</div>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Product Location Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Upload product images and mark inspection locations
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {viewMode !== "create" && (
              <button
                onClick={() => {
                  setViewMode("create");
                  setSelectedConfig(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create New
              </button>
            )}
            {viewMode === "create" && savedConfigurations.length > 0 && (
              <button
                onClick={() => setViewMode("list")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                View Saved
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Mode */}
      {viewMode === "create" && (
        <div className="space-y-6">
          {/* Product Type Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Product Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="">-- Select a Product Type --</option>
              {productTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.EnglishProductName}
                  {type.KhmerProductName && ` (${type.KhmerProductName})`}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload Section */}
          {selectedProductType && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Front View */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Front View
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {frontLocations.length} location
                      {frontLocations.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {!frontImagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "front")}
                      />
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <img
                          ref={frontImageRef}
                          src={frontImagePreview}
                          alt="Front View"
                          className={`w-full h-auto ${
                            isMarkingFront
                              ? "cursor-crosshair"
                              : "cursor-default"
                          }`}
                          onClick={(e) => handleImageClick(e, "front")}
                        />
                        {renderLocationMarkers(frontLocations, "red")}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsMarkingFront(!isMarkingFront)}
                          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                            isMarkingFront
                              ? "bg-indigo-600 text-white shadow-lg"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          <MapPin className="w-4 h-4 inline mr-2" />
                          {isMarkingFront
                            ? "Marking ON (Click Image)"
                            : "Mark Locations"}
                        </button>
                        <button
                          onClick={() => {
                            setFrontImage(null);
                            setFrontImagePreview(null);
                            setFrontLocations([]);
                            setIsMarkingFront(false);
                          }}
                          className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {frontLocations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                            Marked Locations:
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {frontLocations.map((loc) => (
                              <div
                                key={loc.LocationNo}
                                className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {loc.LocationNo}
                                  </span>
                                  {loc.LocationName}
                                </span>
                                <button
                                  onClick={() =>
                                    removeLocation(loc.LocationNo, "front")
                                  }
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove location"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Back View */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Back View
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {backLocations.length} location
                      {backLocations.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {!backImagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "back")}
                      />
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <img
                          ref={backImageRef}
                          src={backImagePreview}
                          alt="Back View"
                          className={`w-full h-auto ${
                            isMarkingBack
                              ? "cursor-crosshair"
                              : "cursor-default"
                          }`}
                          onClick={(e) => handleImageClick(e, "back")}
                        />
                        {renderLocationMarkers(backLocations, "blue")}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsMarkingBack(!isMarkingBack)}
                          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                            isMarkingBack
                              ? "bg-indigo-600 text-white shadow-lg"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          <MapPin className="w-4 h-4 inline mr-2" />
                          {isMarkingBack
                            ? "Marking ON (Click Image)"
                            : "Mark Locations"}
                        </button>
                        <button
                          onClick={() => {
                            setBackImage(null);
                            setBackImagePreview(null);
                            setBackLocations([]);
                            setIsMarkingBack(false);
                          }}
                          className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {backLocations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                            Marked Locations:
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {backLocations.map((loc) => (
                              <div
                                key={loc.LocationNo}
                                className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {loc.LocationNo}
                                  </span>
                                  {loc.LocationName}
                                </span>
                                <button
                                  onClick={() =>
                                    removeLocation(loc.LocationNo, "back")
                                  }
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove location"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-2">How to mark locations:</p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-2">
                      <li>Upload both front and back view images</li>
                      <li>
                        Click the "Mark Locations" button to enable marking mode
                      </li>
                      <li>
                        Click on the image where you want to mark an inspection
                        point
                      </li>
                      <li>
                        Enter a descriptive name for the location (e.g., "Left
                        Pocket", "Collar")
                      </li>
                      <li>Repeat for all inspection points on both views</li>
                      <li>Click "Save Configuration" when finished</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              {frontImagePreview && backImagePreview && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Product:{" "}
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {
                            productTypes.find(
                              (pt) => pt._id === selectedProductType
                            )?.EnglishProductName
                          }
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Locations:{" "}
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {frontLocations.length + backLocations.length}
                        </span>
                        <span className="text-xs ml-2">
                          (Front: {frontLocations.length}, Back:{" "}
                          {backLocations.length})
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={resetForm}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        disabled={loading}
                      >
                        <X className="w-4 h-4 inline mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Configuration
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* List Mode */}
      {viewMode === "list" && !selectedConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Saved Configurations ({savedConfigurations.length})
          </h3>

          {savedConfigurations.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                No configurations saved yet
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                Create your first product location configuration
              </p>
              <button
                onClick={() => setViewMode("create")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Configuration
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedConfigurations.map((config) => (
                <div
                  key={config._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <h4
                    className="font-semibold text-gray-800 dark:text-white mb-3 truncate"
                    title={config.productTypeName}
                  >
                    {config.productTypeName}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>
                        Front: {config.frontView.locations.length} locations
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>
                        Back: {config.backView.locations.length} locations
                      </span>
                    </div>
                    <p className="text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                      Created: {new Date(config.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewConfiguration(config)}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => deleteConfiguration(config._id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors"
                      title="Delete configuration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Mode */}
      {viewMode === "preview" && selectedConfig && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {selectedConfig.productTypeName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Created: {new Date(selectedConfig.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedConfig(null);
                  setViewMode("list");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Front View Preview */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Front View ({selectedConfig.frontView.locations.length}{" "}
                  locations)
                </h4>
                <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4">
                  <img
                    src={`${API_BASE_URL}/api/qa-sections-product-location/image/${selectedConfig.frontView.imagePath
                      .split("/")
                      .pop()}`}
                    alt="Front View"
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error("Error loading front image");
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {renderLocationMarkers(
                    selectedConfig.frontView.locations,
                    "red"
                  )}
                </div>

                {selectedConfig.frontView.locations.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Location List:
                    </h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedConfig.frontView.locations.map((loc) => (
                        <div
                          key={loc._id}
                          className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <span className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {loc.LocationNo}
                          </span>
                          <span className="flex-1">{loc.LocationName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Back View Preview */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Back View ({selectedConfig.backView.locations.length}{" "}
                  locations)
                </h4>
                <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4">
                  <img
                    src={`/api/qa-sections-product-location/image/${selectedConfig.backView.imagePath
                      .split("/")
                      .pop()}`}
                    alt="Back View"
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error("Error loading back image");
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {renderLocationMarkers(
                    selectedConfig.backView.locations,
                    "blue"
                  )}
                </div>

                {selectedConfig.backView.locations.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Location List:
                    </h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedConfig.backView.locations.map((loc) => (
                        <div
                          key={loc._id}
                          className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {loc.LocationNo}
                          </span>
                          <span className="flex-1">{loc.LocationName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQASectionsProductLocationManagement;
