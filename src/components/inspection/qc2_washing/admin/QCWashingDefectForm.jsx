import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { 
  PlusCircle, 
  Loader2, 
  Image as ImageIcon, 
  X, 
  Upload,
  Hash,
  Globe,
  Languages,
  Camera,
  AlertCircle,
  Info,
  CheckCircle
} from "lucide-react";

const LabeledInput = ({
  id,
  labelKey,
  value,
  name,
  onChange,
  type = "text",
  required = false,
  placeholderKey = "",
  readOnly = false,
  icon = null,
  description = ""
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
        {icon && <span className="mr-2">{icon}</span>}
        {labelKey}
        {required && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <Info className="h-3 w-3 mr-1" />
          {description}
        </p>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholderKey}
          readOnly={readOnly}
          className={`block w-full text-sm rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 py-3 px-4 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 ${
            readOnly 
              ? "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400" 
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
          }`}
        />
        {icon && !readOnly && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const QCWashingDefectForm = ({ onDefectAdded }) => {
  const { t } = useTranslation();
  const initialState = {
    code: "",
    english: "",
    khmer: "",
    chinese: "",
    image: ""
  };

  const [newDefect, setNewDefect] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchNextCode = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc-washing-defects/next-code`);
      if (response.data.success) {
        setNewDefect((prev) => ({ ...prev, code: response.data.nextCode }));
      }
    } catch (error) {
      console.error("Failed to fetch next defect code", error);
      Swal.fire({
        icon: "warning",
        title: "Could not fetch next code",
        text: "Please enter the defect code manually or refresh.",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    }
  }, []);

  useEffect(() => {
    fetchNextCode();
  }, [fetchNextCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDefect((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (file) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please select a valid image file.",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleImageChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let imageUrl = "";

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("defectImage", imageFile);
        const uploadRes = await axios.post(`${API_BASE_URL}/api/qc-washing-defects/upload-image`, formData);
        if (uploadRes.data.success) {
          imageUrl = uploadRes.data.url;
        } else {
          throw new Error("Image upload failed");
        }
      }

      const finalPayload = { ...newDefect, image: imageUrl };
      await axios.post(`${API_BASE_URL}/api/qc-washing-defects`, finalPayload);
      
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Washing defect added successfully",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });

      setNewDefect(initialState);
      removeImage();
      if (onDefectAdded) onDefectAdded();
      fetchNextCode();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to add washing defect",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 p-3 rounded-full shadow-lg">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          QC Washing Defect Management
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Add and configure washing defects for quality control inspections
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
              <PlusCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New QC Washing Defect
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new defect entry with multilingual support and image documentation
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  About Defect Records
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Defect codes are automatically generated. Fill in the defect descriptions in multiple languages 
                  and optionally add an image for better identification during inspections.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Defect Code
                </h3>
                
                <LabeledInput
                  id="code"
                  labelKey="Auto-Generated Code"
                  name="code"
                  value={newDefect.code}
                  onChange={handleInputChange}
                  type="number"
                  readOnly
                  required
                  icon={<Hash className="h-4 w-4" />}
                  description="This code is automatically generated and cannot be modified"
                />
              </div>

              {/* Language Fields */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Multilingual Descriptions
                </h3>
                
                <div className="space-y-4">
                  <LabeledInput
                    id="english"
                    labelKey="English Description"
                    name="english"
                    value={newDefect.english}
                    onChange={handleInputChange}
                    required
                    placeholderKey="Enter defect description in English"
                    icon={<Globe className="h-4 w-4" />}
                    description="Primary language for defect identification"
                  />
                  
                  <LabeledInput
                    id="khmer"
                    labelKey="Khmer Description"
                    name="khmer"
                    value={newDefect.khmer}
                    onChange={handleInputChange}
                    required
                    placeholderKey="បញ្ចូលការពិពណ៌នាពីកំហុសជាភាសាខ្មែរ"
                    description="Khmer translation for local operators"
                  />
                  
                  <LabeledInput
                    id="chinese"
                    labelKey="Chinese Description"
                    name="chinese"
                    value={newDefect.chinese}
                    onChange={handleInputChange}
                    placeholderKey="输入中文缺陷描述"
                    description="Optional Chinese translation"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Defect Image
                </h3>
                
                {/* Image Preview or Upload Area */}
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative group">
                      <div className="relative overflow-hidden rounded-xl border-2 border-purple-200 dark:border-purple-700">
                        <img
                          src={imagePreview}
                          alt="Defect Preview"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={removeImage}
                            className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {imageFile?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {imageFile && `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                        isDragOver
                          ? "border-purple-400 bg-purple-50 dark:bg-purple-900/30"
                          : "border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full">
                            <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            Drop image here or click to upload
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {!imagePreview && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center px-4 py-3 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 font-medium"
                    >
                      <ImageIcon className="mr-2 h-5 w-5" />
                      Choose Image File
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Summary */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Preview Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Code:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {newDefect.code || 'Auto-generated'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">English:</span>
                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-32">
                      {newDefect.english || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Khmer:</span>
                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-32">
                      {newDefect.khmer || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Image:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {imageFile ? 'Uploaded' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Info className="h-4 w-4" />
              <span>All required fields must be filled before saving</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setNewDefect(initialState);
                  removeImage();
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Clear Form
              </button>
              
              <button
                type="submit"
                disabled={isSaving || !newDefect.english || !newDefect.khmer}
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Adding Defect...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    <span>Add Defect</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Additional Info Card */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Best Practices
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>• Use clear, descriptive names for defects in all languages</li>
              <li>• Upload high-quality images that clearly show the defect</li>
              <li>• Ensure consistency in terminology across languages</li>
              <li>• Review all entries before saving to maintain data quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCWashingDefectForm;
