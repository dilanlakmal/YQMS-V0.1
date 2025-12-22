import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../../config";
import { 
  FaThermometerHalf, 
  FaClock, 
  FaFlask, 
  FaTint, 
  FaSave, 
  FaSpinner,
  FaEdit,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import { 
  Building2, 
  Check, 
  AlertTriangle, 
  Settings, 
  Zap,
  ChevronDown,
  Info
} from "lucide-react";
import Swal from 'sweetalert2';

const WASH_TYPES = ["Normal Wash", "Acid Wash", "Garment Dye", "Soft Wash", "Acid Wash + Garment Dye"];

const MACHINE_TYPES = [
  { 
    key: "washingMachine", 
    label: "Washing Machine", 
    fields: ["temperature", "time", "silicon", "softener"],
    icon: "🧺",
    color: "blue"
  },
  { 
    key: "tumbleDry", 
    label: "Tumble Dry", 
    fields: ["temperature", "timeCool", "timeHot"],
    icon: "🌪️",
    color: "purple"
  }
];

const FIELD_LABELS = {
  temperature: "Temperature",
  time: "Time",
  timeCool: "Time Cool",
  timeHot: "Time Hot",
  silicon: "Silicon",
  softener: "Softener"
};

const FIELD_UNITS = {
  temperature: "°C",
  time: "min",
  timeCool: "min",
  timeHot: "min",
  silicon: "g",
  softener: "g"
};

const FIELD_ICONS = {
  temperature: <FaThermometerHalf className="text-red-500" />,
  time: <FaClock className="text-yellow-500" />,
  timeCool: <FaClock className="text-cyan-500" />,
  timeHot: <FaClock className="text-orange-500" />,
  silicon: <FaFlask className="text-purple-500" />,
  softener: <FaTint className="text-blue-500" />
};

export default function QCWashingStandardTable() {
  const [subFactories, setSubFactories] = useState([]);
  const [selectedSubFactory, setSelectedSubFactory] = useState('');
  const [loadingFactories, setLoadingFactories] = useState(false);
  const [standards, setStandards] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [editingStates, setEditingStates] = useState({});

  useEffect(() => {
    fetchSubFactories();
  }, []);

  useEffect(() => {
    if (selectedSubFactory) {
      fetchStandards();
    } else {
      setStandards({});
    }
  }, [selectedSubFactory]);

  const fetchSubFactories = async () => {
    setLoadingFactories(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/supplier-issues/defects/Washing`);
      const data = await response.json();
      
      if (data && Array.isArray(data.factoryList)) {
        const factoryObjects = data.factoryList.map((factoryName) => ({
          id: factoryName,
          name: factoryName,
          code: factoryName
        }));
        
        setSubFactories(factoryObjects);
        
        const defaultFactory = data.factoryList.includes("YM") 
          ? "YM" 
          : data.factoryList[0] || "";
        
        if (defaultFactory) {
          setSelectedSubFactory(defaultFactory);
        }
      } else {
        setSubFactories([]);
        setSelectedSubFactory('');
      }
    } catch (error) {
      console.error('Error fetching sub-factories:', error);
      setSubFactories([]);
      setSelectedSubFactory('');
      Swal.fire({
        icon: 'error',
        title: 'Error fetching factories',
        text: 'Failed to load factory list. Please try again.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    } finally {
      setLoadingFactories(false);
    }
  };

  const fetchStandards = async () => {
    if (!selectedSubFactory) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/standards?factoryName=${selectedSubFactory}`);
      const data = await response.json();
      
      if (data.success) {
        const obj = {};
        data.data.forEach(item => { 
          obj[item.washType] = {
            ...item,
            factoryName: selectedSubFactory
          };
        });
        setStandards(obj);
      } else {
        setStandards({});
      }
    } catch (error) {
      setStandards({});
      console.error('Error fetching standards:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error fetching standards',
        text: error.message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    }
  };

  const handleSubFactoryChange = (factoryName) => {
    const hasUnsavedChanges = Object.keys(standards).some(washType => {
      const standard = standards[washType];
      return standard && (
        Object.keys(standard.washingMachine || {}).length > 0 ||
        Object.keys(standard.tumbleDry || {}).length > 0
      );
    });

    if (hasUnsavedChanges && selectedSubFactory) {
      Swal.fire({
        title: 'Change Factory?',
        text: 'You have unsaved changes. Changing the factory will clear all current data. Do you want to continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, change it!'
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedSubFactory(factoryName);
          setStandards({});
        }
      });
    } else {
      setSelectedSubFactory(factoryName);
    }
  };

  const handleChange = (washType, machineKey, field, value) => {
    setStandards(prev => ({
      ...prev,
      [washType]: {
        ...prev[washType],
        factoryName: selectedSubFactory,
        [machineKey]: {
          ...((prev[washType] && prev[washType][machineKey]) || {}),
          [field]: value
        }
      }
    }));
  };

  const toggleEdit = (washType) => {
    setEditingStates(prev => ({
      ...prev,
      [washType]: !prev[washType]
    }));
  };

  const handleSave = async (washType) => {
    if (!washType || !selectedSubFactory) {
      Swal.fire({
        icon: 'warning',
        title: 'Factory Required',
        text: 'Please select a factory before saving standards',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [washType]: true }));
    
    try {
      const body = {
        washType,
        factoryName: selectedSubFactory,
        washingMachine: standards[washType]?.washingMachine || {},
        tumbleDry: standards[washType]?.tumbleDry || {}
      };
      
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/standards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStandards(prev => ({ 
          ...prev, 
          [washType]: {
            ...data.data,
            factoryName: selectedSubFactory
          }
        }));
        setEditingStates(prev => ({ ...prev, [washType]: false }));
        Swal.fire({
          icon: 'success',
          title: `${washType} standards saved successfully!`,
          text: `Saved for ${selectedSubFactory} factory`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: 'top-end',
          toast: true
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to save standards',
          text: data.message || 'Unknown error occurred',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: 'top-end',
          toast: true
        });
      }
    } catch (error) {
      console.error('Error saving standards:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error saving standards',
        text: error.message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [washType]: false }));
    }
  };

  const selectedFactory = subFactories.find(factory => factory.id === selectedSubFactory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            QC Washing Standards Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Configure and manage washing machine standards for different factories
          </p>
        </div>

        {/* Factory Selection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Factory Selection</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a factory to manage its washing standards</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Factory <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSubFactory}
                  onChange={(e) => handleSubFactoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
                  disabled={loadingFactories}
                >
                  <option value="">
                    {loadingFactories ? "Loading factories..." : "Choose a factory"}
                  </option>
                  {subFactories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {selectedSubFactory && (
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 w-full">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Factory Selected</p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-100">{selectedSubFactory}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!selectedSubFactory && (
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please select a factory to view and manage washing standards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Standards Content */}
        {!selectedSubFactory ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Factory Selected</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Please select a factory from the dropdown above to view and manage washing standards.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Factory Info Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Standards for {selectedSubFactory}</h2>
                    <p className="text-blue-100">Configure washing machine parameters</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-sm font-medium">Factory: {selectedSubFactory}</span>
                </div>
              </div>
            </div>

            {/* Standards Grid */}
            <div className="grid gap-8">
              {WASH_TYPES.map(washType => {
                const isEditing = editingStates[washType];
                const isLoading = loadingStates[washType];
                
                return (
                  <div key={washType} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Wash Type Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{washType}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Factory: {selectedSubFactory}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isEditing && (
                            <button
                              onClick={() => toggleEdit(washType)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <FaEdit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Machine Types Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {MACHINE_TYPES.map(machine => (
                          <div key={machine.key} className={`bg-gradient-to-br ${machine.color === 'blue' ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' : 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'} rounded-xl p-6 border ${machine.color === 'blue' ? 'border-blue-200 dark:border-blue-800' : 'border-purple-200 dark:border-purple-800'}`}>
                            <div className="flex items-center space-x-3 mb-4">
                              <span className="text-2xl">{machine.icon}</span>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{machine.label}</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {machine.fields.map(field => (
                                <div key={field} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {FIELD_ICONS[field]}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {FIELD_LABELS[field]}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      className={`w-full px-3 py-2 border rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        isEditing 
                                          ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500' 
                                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                                      }`}
                                      value={standards[washType]?.[machine.key]?.[field] ?? ""}
                                      onChange={e => handleChange(washType, machine.key, field, e.target.value)}
                                      placeholder="0"
                                      disabled={!isEditing}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                                      {FIELD_UNITS[field]}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      {isEditing && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Info className="h-4 w-4" />
                            <span>Changes will be saved for: {selectedSubFactory}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleEdit(washType)}
                              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <FaTimes className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => handleSave(washType)}
                              disabled={isLoading}
                              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                            >
                              {isLoading ? (
                                <>
                                  <FaSpinner className="h-4 w-4 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <FaSave className="h-4 w-4" />
                                  <span>Save Standards</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
