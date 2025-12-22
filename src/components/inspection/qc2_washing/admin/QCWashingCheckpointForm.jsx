import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  X, 
  Check,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Target,
  Layers,
  Globe,
  Languages,
  Eye,
  Save
} from "lucide-react";

const QCWashingCheckpointForm = ({ onCheckpointAdded }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [currentRemarkOption, setCurrentRemarkOption] = useState(null);
  const [remarkData, setRemarkData] = useState({
    english: '',
    khmer: '',
    chinese: ''
  });

  const addMainCheckpoint = () => {
    const newCheckpoint = {
      id: Date.now() + Math.random(),
      name: "New Main Point",
      optionType: "passfail",
      options: [
        { 
          id: Date.now() + 1, 
          name: "Pass", 
          isDefault: true, 
          isFail: false,
          hasRemark: false,
          remark: null
        },
        { 
          id: Date.now() + 2, 
          name: "Fail", 
          isDefault: false, 
          isFail: true,
          hasRemark: false,
          remark: null
        }
      ],
      subPoints: [],
      failureImpact: "customize"
    };
    setCheckpoints(prev => [...prev, newCheckpoint]);
  };

  const addSubPoint = (mainId) => {
    const newSubPoint = {
      id: Date.now() + Math.random(),
      name: "New Sub Point",
      optionType: "passfail",
      options: [
        { 
          id: Date.now() + 1, 
          name: "Pass", 
          isDefault: true, 
          isFail: false,
          hasRemark: false,
          remark: null
        },
        { 
          id: Date.now() + 2, 
          name: "Fail", 
          isDefault: false, 
          isFail: true,
          hasRemark: false,
          remark: null
        }
      ]
    };
    
    setCheckpoints(prev => prev.map(checkpoint => 
      checkpoint.id === mainId 
        ? { ...checkpoint, subPoints: [...checkpoint.subPoints, newSubPoint] }
        : checkpoint
    ));
  };

  const updateCheckpointName = (mainId, subId, name) => {
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        if (!subId) {
          return { ...checkpoint, name };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, name } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
  };

  const changeOptionType = (mainId, subId, type) => {
    const newOptions = type === "passfail" 
      ? [
          { 
            id: Date.now() + 1, 
            name: "Pass", 
            isDefault: true, 
            isFail: false,
            hasRemark: false,
            remark: null
          },
          { 
            id: Date.now() + 2, 
            name: "Fail", 
            isDefault: false, 
            isFail: true,
            hasRemark: false,
            remark: null
          }
        ]
      : [{ 
          id: Date.now() + 1, 
          name: "", 
          isDefault: true, 
          isFail: false,
          hasRemark: false,
          remark: null
        }];
    
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        if (!subId) {
          return { ...checkpoint, optionType: type, options: newOptions };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, optionType: type, options: newOptions } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
  };

  const addOption = (mainId, subId) => {
    const newOption = { 
      id: Date.now() + Math.random(), 
      name: "", 
      isDefault: false, 
      isFail: false,
      hasRemark: false,
      remark: null
    };
    
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        if (!subId) {
          return { ...checkpoint, options: [...checkpoint.options, newOption] };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, options: [...sub.options, newOption] } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
  };

  const updateOption = (mainId, subId, optionId, field, value) => {
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        const updateOptions = (options) => options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, [field]: value };
          } else if (field === 'isDefault' && value) {
            return { ...opt, isDefault: false };
          }
          return opt;
        });
        
        if (!subId) {
          return { ...checkpoint, options: updateOptions(checkpoint.options) };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, options: updateOptions(sub.options) } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
  };

  const deleteOption = (mainId, subId, optionId) => {
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        const filterOptions = (options) => {
          const filtered = options.filter(opt => opt.id !== optionId);
          return filtered.length === 0 
            ? [{ 
                id: Date.now(), 
                name: "Pass", 
                isDefault: true, 
                isFail: false,
                hasRemark: false,
                remark: null
              }]
            : filtered;
        };
        
        if (!subId) {
          return { ...checkpoint, options: filterOptions(checkpoint.options) };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, options: filterOptions(sub.options) } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
  };

  const deleteCheckpoint = (mainId, subId = null) => {
    if (!subId) {
      setCheckpoints(prev => prev.filter(checkpoint => checkpoint.id !== mainId));
    } else {
      setCheckpoints(prev => prev.map(checkpoint => 
        checkpoint.id === mainId 
          ? { ...checkpoint, subPoints: checkpoint.subPoints.filter(sub => sub.id !== subId) }
          : checkpoint
      ));
    }
  };

  const updateFailureImpact = (mainId, impact) => {
    setCheckpoints(prev => prev.map(checkpoint => 
      checkpoint.id === mainId ? { ...checkpoint, failureImpact: impact } : checkpoint
    ));
  };

  // Remark functions
  const openRemarkModal = (mainId, subId, optionId) => {
    const checkpoint = checkpoints.find(cp => cp.id === mainId);
    let option;
    
    if (!subId) {
      option = checkpoint.options.find(opt => opt.id === optionId);
    } else {
      const subPoint = checkpoint.subPoints.find(sub => sub.id === subId);
      option = subPoint.options.find(opt => opt.id === optionId);
    }

    setCurrentRemarkOption({ mainId, subId, optionId });
    setRemarkData({
      english: option.remark?.english || '',
      khmer: option.remark?.khmer || '',
      chinese: option.remark?.chinese || ''
    });
    setRemarkModalOpen(true);
  };

  const closeRemarkModal = () => {
    setRemarkModalOpen(false);
    setCurrentRemarkOption(null);
    setRemarkData({ english: '', khmer: '', chinese: '' });
  };

  const saveRemark = () => {
    if (!remarkData.english.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "English remark is required",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
      return;
    }

    const { mainId, subId, optionId } = currentRemarkOption;
    
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        const updateOptionsWithRemark = (options) => options.map(opt => {
          if (opt.id === optionId) {
            return { 
              ...opt, 
              hasRemark: true,
              remark: {
                english: remarkData.english.trim(),
                khmer: remarkData.khmer.trim(),
                chinese: remarkData.chinese.trim()
              }
            };
          }
          return opt;
        });
        
        if (!subId) {
          return { ...checkpoint, options: updateOptionsWithRemark(checkpoint.options) };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, options: updateOptionsWithRemark(sub.options) } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
    closeRemarkModal();
  };

  const removeRemark = (mainId, subId, optionId) => {
    setCheckpoints(prev => prev.map(checkpoint => {
      if (checkpoint.id === mainId) {
        const updateOptionsRemoveRemark = (options) => options.map(opt => {
          if (opt.id === optionId) {
            return { 
              ...opt, 
              hasRemark: false,
              remark: null
            };
          }
          return opt;
        });
        
        if (!subId) {
          return { ...checkpoint, options: updateOptionsRemoveRemark(checkpoint.options) };
        } else {
          return {
            ...checkpoint,
            subPoints: checkpoint.subPoints.map(sub => 
              sub.id === subId ? { ...sub, options: updateOptionsRemoveRemark(sub.options) } : sub
            )
          };
        }
      }
      return checkpoint;
    }));
  };

  const prepareCheckpointData = (checkpoint) => {
    const filterValidOptions = (options, optionType) => {
      if (!options || !Array.isArray(options)) {
        return [];
      }
      
      const filtered = options.filter(opt => {
        return opt && opt.name && String(opt.name).trim().length > 0;
      });
      
      return filtered.map(opt => ({
        id: opt.id ? String(opt.id) : String(Date.now() + Math.random()),
        name: String(opt.name).trim(),
        isDefault: Boolean(opt.isDefault),
        isFail: Boolean(opt.isFail),
        hasRemark: Boolean(opt.hasRemark),
        remark: opt.hasRemark && opt.remark ? {
          english: String(opt.remark.english || '').trim(),
          khmer: String(opt.remark.khmer || '').trim(),
          chinese: String(opt.remark.chinese || '').trim()
        } : null
      }));
    };

    let processedSubPoints = [];
    
    if (checkpoint.subPoints && Array.isArray(checkpoint.subPoints) && checkpoint.subPoints.length > 0) {
      processedSubPoints = checkpoint.subPoints
        .filter(sub => {
          if (!sub || !sub.name) return false;
          const name = String(sub.name).trim();
          if (name.length === 0) return false;
          if (!sub.options || !Array.isArray(sub.options)) return false;
          const hasValidOptions = sub.options.some(opt => 
            opt && opt.name && String(opt.name).trim().length > 0
          );
          return hasValidOptions;
        })
        .map(sub => ({
          id: sub.id ? String(sub.id) : String(Date.now() + Math.random()),
          name: String(sub.name).trim(),
          optionType: sub.optionType || 'passfail',
          options: filterValidOptions(sub.options, sub.optionType || 'passfail')
        }));
    }

    return {
      name: String(checkpoint.name).trim(),
      optionType: checkpoint.optionType || 'passfail',
      options: filterValidOptions(checkpoint.options, checkpoint.optionType),
      subPoints: processedSubPoints,
      failureImpact: checkpoint.failureImpact || 'customize'
    };
  };

  const handleSubmit = async () => {
    if (checkpoints.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const validCheckpoints = checkpoints.filter(cp => cp.name && cp.name.trim());
      
      if (validCheckpoints.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "No Valid Checkpoints",
          text: "Please add at least one checkpoint with a name",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: 'top-end',
          toast: true
        });
        setIsSubmitting(false);
        return;
      }

      // Validate remarks
      for (const checkpoint of validCheckpoints) {
        for (const option of checkpoint.options) {
          if (option.hasRemark && (!option.remark?.english || !option.remark.english.trim())) {
            Swal.fire({
              icon: "warning",
              title: "Invalid Remark",
              text: `Option "${option.name}" in checkpoint "${checkpoint.name}" has remark enabled but English remark is missing`,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              position: 'top-end',
              toast: true
            });
            setIsSubmitting(false);
            return;
          }
        }

        for (const subPoint of checkpoint.subPoints) {
          for (const option of subPoint.options) {
            if (option.hasRemark && (!option.remark?.english || !option.remark.english.trim())) {
              Swal.fire({
                icon: "warning",
                title: "Invalid Remark",
                text: `Option "${option.name}" in sub point "${subPoint.name}" has remark enabled but English remark is missing`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                position: 'top-end',
                toast: true
              });
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      for (const checkpoint of validCheckpoints) {
        const preparedData = prepareCheckpointData(checkpoint);
        
        if (!preparedData.options || preparedData.options.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Checkpoint",
            text: `Checkpoint "${checkpoint.name}" must have at least one valid option`,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            position: 'top-end',
            toast: true
          });
          setIsSubmitting(false);
          return;
        }

        for (const subPoint of preparedData.subPoints || []) {
          if (!subPoint.options || subPoint.options.length === 0) {
            Swal.fire({
              icon: "warning",
              title: "Invalid Sub Point",
              text: `Sub point "${subPoint.name}" must have at least one valid option`,
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              position: 'top-end',
              toast: true
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      for (const checkpoint of validCheckpoints) {
        const checkpointData = prepareCheckpointData(checkpoint);
        
        const dataToSend = {
          ...checkpointData,
          addedBy: {
            emp_id: user?.emp_id,
            eng_name: user?.eng_name
          }
        };
        
        await axios.post(`${API_BASE_URL}/api/qc-washing-checklist`, dataToSend);
      }
      
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Checkpoints added successfully",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
      
      setCheckpoints([]);
      onCheckpointAdded();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to add checkpoints",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        position: 'top-end',
        toast: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOptionsGrid = (options, mainId, subId = null) => {
    return (
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={option.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {index + 1}
                </span>
              </div>
              
              <input
                type="text"
                value={option.name}
                onChange={(e) => updateOption(mainId, subId, option.id, 'name', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter option name"
              />
              
              <div className="flex items-center space-x-4">
                {/* Default Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.isDefault}
                    onChange={(e) => updateOption(mainId, subId, option.id, 'isDefault', e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Default</span>
                </label>
                
                {/* Fail Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.isFail}
                    onChange={(e) => updateOption(mainId, subId, option.id, 'isFail', e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Fail</span>
                </label>
                
                {/* Remark Button */}
                <div className="flex items-center space-x-1">
                  {option.hasRemark ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openRemarkModal(mainId, subId, option.id)}
                        className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Remark"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeRemark(mainId, subId, option.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Remove Remark"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openRemarkModal(mainId, subId, option.id)}
                      className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Add Remark"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Delete Button */}
                {options.length > 1 && (
                  <button
                    onClick={() => deleteOption(mainId, subId, option.id)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete Option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCheckpointCard = (checkpoint, index) => {
    return (
      <div key={checkpoint.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Checkpoint Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Checkpoint #{index + 1}
                  </span>
                </div>
                <input
                  type="text"
                  value={checkpoint.name}
                  onChange={(e) => updateCheckpointName(checkpoint.id, null, e.target.value)}
                  className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Enter main checkpoint name"
                />
              </div>
            </div>
            <button
              onClick={() => deleteCheckpoint(checkpoint.id)}
              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Delete Main Checkpoint"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Options Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                Main Options
              </h4>
              <div className="flex items-center space-x-3">
                <select
                  value={checkpoint.optionType}
                  onChange={(e) => changeOptionType(checkpoint.id, null, e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="passfail">Pass/Fail</option>
                  <option value="custom">Custom</option>
                </select>
                {checkpoint.optionType === "custom" && (
                  <button
                    onClick={() => addOption(checkpoint.id, null)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
            </div>
            {renderOptionsGrid(checkpoint.options, checkpoint.id)}
          </div>

          {/* Failure Impact Section */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Failure Impact Strategy
              </h4>
            </div>
            <select
              value={checkpoint.failureImpact}
              onChange={(e) => updateFailureImpact(checkpoint.id, e.target.value)}
              className="w-full px-4 py-3 border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="customize">Customize (Manual Control)</option>
              <option value="any">Any Sub Fail = Main Fail</option>
              <option value="all">All Sub Fail = Main Fail</option>
              <option value="majority">Majority Fail = Main Fail</option>
            </select>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              This determines how sub-point failures affect the main checkpoint result.
            </p>
          </div>

          {/* Sub Points Section */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Layers className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Sub Points ({checkpoint.subPoints.length})
              </h4>
              <button
                onClick={() => addSubPoint(checkpoint.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Sub Point</span>
              </button>
            </div>

            {checkpoint.subPoints.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg">
                <Layers className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                <p className="font-medium">No sub points added yet</p>
                <p className="text-sm">Click "Add Sub Point" to create detailed inspection criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkpoint.subPoints.map((subPoint, subIndex) => (
                  <div key={subPoint.id} className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-sm">
                    {/* Sub Point Header */}
                                        <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {subIndex + 1}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={subPoint.name}
                          onChange={(e) => updateCheckpointName(checkpoint.id, subPoint.id, e.target.value)}
                          className="flex-1 px-3 py-2 text-sm font-medium border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter sub point name"
                        />
                      </div>
                      <button
                        onClick={() => deleteCheckpoint(checkpoint.id, subPoint.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete Sub Point"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Sub Point Options */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={subPoint.optionType}
                            onChange={(e) => changeOptionType(checkpoint.id, subPoint.id, e.target.value)}
                            className="px-3 py-1 text-sm border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="passfail">Pass/Fail</option>
                            <option value="custom">Custom</option>
                          </select>
                          {subPoint.optionType === "custom" && (
                            <button
                              onClick={() => addOption(checkpoint.id, subPoint.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {renderOptionsGrid(subPoint.options, checkpoint.id, subPoint.id)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-lg">
            <Settings className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          QC Washing Checkpoints Configuration
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Create comprehensive inspection checkpoints with sub-points and multilingual remarks
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Checkpoint Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Build detailed inspection criteria with hierarchical structure
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Guide */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Configuration Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span><strong>Main Point:</strong> Primary checkpoint (e.g., "Hand Feel")</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4" />
                      <span><strong>Sub Points:</strong> Detailed criteria under main point</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span><strong>Options:</strong> Available choices (Pass/Fail/Custom)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span><strong>Default:</strong> Pre-selected option</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span><strong>Fail:</strong> Marks option as failure condition</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span><strong>Remarks:</strong> Multilingual explanations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Checkpoint Button */}
        <div className="p-6">
          <button
            onClick={addMainCheckpoint}
            className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Add Main Checkpoint</span>
          </button>
        </div>
      </div>

      {/* Checkpoints List */}
      {checkpoints.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Target className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Checkpoints Configured
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start building your inspection criteria by adding your first main checkpoint.
            </p>
            <button
              onClick={addMainCheckpoint}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Checkpoint</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {checkpoints.map((checkpoint, index) => renderCheckpointCard(checkpoint, index))}
          
          {/* Save All Button */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Save className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ready to Save
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving Checkpoints...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save All Checkpoints</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remark Modal */}
      {remarkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Languages className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Multilingual Remark
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add explanatory text in multiple languages
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeRemarkModal}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* English Remark - Required */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Globe className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                  English Remark
                  <span className="ml-2 text-red-500 dark:text-red-400">*</span>
                  <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Required)</span>
                </label>
                <textarea
                  value={remarkData.english}
                  onChange={(e) => setRemarkData(prev => ({ ...prev, english: e.target.value }))}
                  className="w-full px-4 py-3 border border-red-300 dark:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="3"
                  placeholder="Enter English remark (required for all users)"
                />
              </div>

              {/* Khmer Remark - Optional */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <span className="mr-2">🇰🇭</span>
                  Khmer Remark
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Optional)</span>
                </label>
                <textarea
                  value={remarkData.khmer}
                  onChange={(e) => setRemarkData(prev => ({ ...prev, khmer: e.target.value }))}
                  className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  placeholder="បញ្ចូលការពិពណ៌នាជាភាសាខ្មែរ (ស្រេចចិត្ត)"
                  style={{ fontFamily: 'Khmer OS, Arial, sans-serif' }}
                />
              </div>

              {/* Chinese Remark - Optional */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <span className="mr-2">🇨🇳</span>
                  Chinese Remark
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Optional)</span>
                </label>
                <textarea
                  value={remarkData.chinese}
                  onChange={(e) => setRemarkData(prev => ({ ...prev, chinese: e.target.value }))}
                  className="w-full px-4 py-3 border border-green-300 dark:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows="3"
                  placeholder="输入中文备注 (可选)"
                  style={{ fontFamily: 'SimSun, Arial, sans-serif' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Info className="h-4 w-4" />
                  <span>English remark is required for saving</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={closeRemarkModal}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRemark}
                    disabled={!remarkData.english.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Save Remark
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Best Practices Card */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-3">
              Best Practices for Checkpoint Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700 dark:text-yellow-300">
              <ul className="space-y-2">
                <li>• Use clear, descriptive names for checkpoints and sub-points</li>
                <li>• Set appropriate default options for common scenarios</li>
                <li>• Configure failure impact based on quality requirements</li>
                <li>• Add remarks for options that need explanation</li>
              </ul>
              <ul className="space-y-2">
                <li>• Test checkpoint logic before deploying to production</li>
                <li>• Ensure English remarks are always provided</li>
                <li>• Group related sub-points under logical main points</li>
                <li>• Review and update checkpoints based on feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCWashingCheckpointForm;

