import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { 
  PlusCircle, 
  Loader2, 
  Hash, 
  User, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
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
          className="block w-full text-sm rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 py-3 px-4 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
        />
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const QCWashingFirstOutputForm = ({ onOutputAdded }) => {
  const { t } = useTranslation();
  const initialState = {
    quantity: "",
  };

  const [newOutput, setNewOutput] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOutput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const outputData = {
        ...newOutput,
        addedBy: {
          emp_id: user?.emp_id,
          eng_name: user?.eng_name,
        },
      };

      await axios.post(`${API_BASE_URL}/api/qc-washing-first-outputs`, outputData);
      
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "First output record added successfully",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });

      setNewOutput(initialState);
      if (onOutputAdded) onOutputAdded();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to add first output record",
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
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          First Output Configuration
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Set the standard quantity for first output quality checks
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New First Output Record
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure the standard checked quantity for first output inspections
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  About First Output Records
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This quantity will be used as the standard sample size for first output quality inspections. 
                  It determines how many pieces should be checked during the initial production run.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Quantity Configuration
                </h3>
                
                <LabeledInput
                  id="quantity"
                  labelKey="Checked Quantity"
                  name="quantity"
                  value={newOutput.quantity}
                  onChange={handleInputChange}
                  type="number"
                  required
                  placeholderKey="Enter quantity (e.g., 50)"
                  icon={<Hash className="h-4 w-4" />}
                  description="Number of pieces to be checked in first output inspection"
                />
              </div>
            </div>

            {/* Right Column - User Info & Preview */}
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Added By
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.emp_id || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.eng_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {newOutput.quantity && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Preview
                  </h3>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {newOutput.quantity}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        pieces will be checked in first output
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>Record will be saved with current timestamp</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setNewOutput(initialState)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Clear
              </button>
              
              <button
                type="submit"
                disabled={isSaving || !newOutput.quantity}
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    <span>Add Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Additional Info Card */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Note
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              The quantity you set here will be used automatically when creating first output inspection records. 
              Make sure this aligns with your quality control standards and production requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCWashingFirstOutputForm;
