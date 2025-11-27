import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import { Plus, Loader2, Trash2, Edit3, MessageSquare, X, Check } from "lucide-react";

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
        text: "English remark is required"
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
  console.log('=== PREPARE CHECKPOINT DATA START ===');
  console.log('Input checkpoint:', JSON.stringify(checkpoint, null, 2));
  
  const filterValidOptions = (options, optionType) => {
    if (!options || !Array.isArray(options)) {
      console.log('No options or not array:', options);
      return [];
    }
    
    const filtered = options.filter(opt => {
      const isValid = opt && opt.name && String(opt.name).trim().length > 0;
      console.log(`Option "${opt?.name}" is valid: ${isValid}`);
      return isValid;
    });
    
    console.log('Filtered options:', filtered);
    return filtered.map(opt => ({
      id: opt.id ? String(opt.id) : String(Date.now() + Math.random()), // Ensure string
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

  // Process subPoints with detailed logging
  let processedSubPoints = [];
  
  console.log('Raw subPoints:', checkpoint.subPoints);
  console.log('SubPoints is array:', Array.isArray(checkpoint.subPoints));
  console.log('SubPoints length:', checkpoint.subPoints?.length || 0);
  
  if (checkpoint.subPoints && Array.isArray(checkpoint.subPoints) && checkpoint.subPoints.length > 0) {
    console.log('Processing subPoints...');
    
    processedSubPoints = checkpoint.subPoints
      .filter(sub => {
        console.log('=== FILTERING SUB POINT ===');
        console.log('Raw sub point:', JSON.stringify(sub, null, 2));
        
        if (!sub) {
          console.log('Sub point is null/undefined');
          return false;
        }
        
        if (!sub.name) {
          console.log('Sub point has no name');
          return false;
        }
        
        const name = String(sub.name).trim();
        if (name.length === 0) {
          console.log('Sub point name is empty after trim');
          return false;
        }
        
        if (!sub.options || !Array.isArray(sub.options)) {
          console.log('Sub point has no options or options is not array');
          return false;
        }
        
        const hasValidOptions = sub.options.some(opt => 
          opt && opt.name && String(opt.name).trim().length > 0
        );
        
        console.log(`Sub point "${name}" has valid options: ${hasValidOptions}`);
        console.log('Sub point options:', JSON.stringify(sub.options, null, 2));
        
        const isValid = hasValidOptions;
        console.log(`Sub point "${name}" is valid: ${isValid}`);
        
        return isValid;
      })
      .map(sub => {
        console.log('=== MAPPING SUB POINT ===');
        console.log('Mapping sub point:', JSON.stringify(sub, null, 2));
        
        const subPointData = {
          id: sub.id ? String(sub.id) : String(Date.now() + Math.random()), // Ensure string
          name: String(sub.name).trim(),
          optionType: sub.optionType || 'passfail',
          options: filterValidOptions(sub.options, sub.optionType || 'passfail')
        };
        console.log('Mapped sub point data:', JSON.stringify(subPointData, null, 2));
        return subPointData;
      });
  } else {
    console.log('No subPoints to process');
  }

  const result = {
    name: String(checkpoint.name).trim(),
    optionType: checkpoint.optionType || 'passfail',
    options: filterValidOptions(checkpoint.options, checkpoint.optionType),
    subPoints: processedSubPoints,
    failureImpact: checkpoint.failureImpact || 'customize'
  };

  console.log('=== PREPARE CHECKPOINT DATA END ===');
  console.log('Final prepared data:', JSON.stringify(result, null, 2));
  console.log('Final subPoints count:', result.subPoints.length);
  
  return result;
};


  const handleSubmit = async () => {
    if (checkpoints.length === 0) return;

    setIsSubmitting(true);
    try {
      const validCheckpoints = checkpoints.filter(cp => cp.name && cp.name.trim());
      
      console.log('=== SUBMIT DEBUG START ===');
      console.log('Original checkpoints:', JSON.stringify(checkpoints, null, 2));
      console.log('Valid checkpoints:', JSON.stringify(validCheckpoints, null, 2));
      
      if (validCheckpoints.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "No Valid Checkpoints",
          text: "Please add at least one checkpoint with a name"
        });
        setIsSubmitting(false);
        return;
      }

      // Validate remarks
      for (const checkpoint of validCheckpoints) {
        // Check main options
        for (const option of checkpoint.options) {
          if (option.hasRemark && (!option.remark?.english || !option.remark.english.trim())) {
            Swal.fire({
              icon: "warning",
              title: "Invalid Remark",
              text: `Option "${option.name}" in checkpoint "${checkpoint.name}" has remark enabled but English remark is missing`
            });
            setIsSubmitting(false);
            return;
          }
        }

        // Check sub point options
        for (const subPoint of checkpoint.subPoints) {
          for (const option of subPoint.options) {
            if (option.hasRemark && (!option.remark?.english || !option.remark.english.trim())) {
              Swal.fire({
                icon: "warning",
                title: "Invalid Remark",
                text: `Option "${option.name}" in sub point "${subPoint.name}" has remark enabled but English remark is missing`
              });
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      for (const checkpoint of validCheckpoints) {
        console.log('=== PROCESSING CHECKPOINT ===');
        console.log('Raw checkpoint:', JSON.stringify(checkpoint, null, 2));
        
        const preparedData = prepareCheckpointData(checkpoint);
        
        console.log('=== PREPARED DATA ===');
        console.log('Prepared checkpoint data:', JSON.stringify(preparedData, null, 2));
        console.log('Sub points count:', preparedData.subPoints?.length || 0);
        
        if (!preparedData.options || preparedData.options.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Checkpoint",
            text: `Checkpoint "${checkpoint.name}" must have at least one valid option`
          });
          setIsSubmitting(false);
          return;
        }

        // Check each sub point
        for (const subPoint of preparedData.subPoints || []) {
          console.log('Validating sub point:', JSON.stringify(subPoint, null, 2));
          if (!subPoint.options || subPoint.options.length === 0) {
            Swal.fire({
              icon: "warning",
              title: "Invalid Sub Point",
              text: `Sub point "${subPoint.name}" must have at least one valid option`
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
        
        console.log('=== SENDING TO API ===');
        console.log('Final data to send:', JSON.stringify(dataToSend, null, 2));
        
        const response = await axios.post(`${API_BASE_URL}/api/qc-washing-checklist`, dataToSend);
        console.log('API Response:', response.data);
      }
      
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Checkpoints added successfully"
      });
      
      setCheckpoints([]);
      onCheckpointAdded();
    } catch (error) {
      console.error('=== SUBMIT ERROR ===');
      console.error('Submit error:', error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to add checkpoints"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOptionsGrid = (options, mainId, subId = null) => {
    return (
      <div className="grid grid-cols-1 gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-700">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center space-x-2 p-2 border rounded bg-white dark:bg-gray-800">
            <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[20px]">
              {index + 1}.
            </span>
            <input
              type="text"
              value={option.name}
              onChange={(e) => updateOption(mainId, subId, option.id, 'name', e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
              placeholder="Option name"
            />
            <div className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={option.isDefault}
                onChange={(e) => updateOption(mainId, subId, option.id, 'isDefault', e.target.checked)}
                className="w-3 h-3 text-green-600"
                title="Default"
              />
              <span className="text-xs text-green-600 dark:text-green-400">Def</span>
            </div>
            <div className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={option.isFail}
                onChange={(e) => updateOption(mainId, subId, option.id, 'isFail', e.target.checked)}
                className="w-3 h-3 text-red-600"
                title="Fail"
              />
              <span className="text-xs text-red-600 dark:text-red-400">Fail</span>
            </div>
            
            {/* Remark Section */}
            <div className="flex items-center space-x-1">
              {option.hasRemark ? (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openRemarkModal(mainId, subId, option.id)}
                    className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                    title="Edit Remark"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeRemark(mainId, subId, option.id)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Remove Remark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    <Check className="h-3 w-3" />
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => openRemarkModal(mainId, subId, option.id)}
                  className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Add Remark"
                >
                  <MessageSquare className="h-3 w-3" />
                </button>
              )}
            </div>

            {options.length > 1 && (
              <button
                onClick={() => deleteOption(mainId, subId, option.id)}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                title="Delete Option"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCheckpointCard = (checkpoint) => {
    return (
      <div key={checkpoint.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
        {/* Main Checkpoint Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2 flex-1">
            <Edit3 className="h-4 w-4 text-blue-500" />
            <input
              type="text"
              value={checkpoint.name}
              onChange={(e) => updateCheckpointName(checkpoint.id, null, e.target.value)}
              className="flex-1 px-3 py-2 text-lg font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded"
              placeholder="Main checkpoint name"
            />
          </div>
          <button
            onClick={() => deleteCheckpoint(checkpoint.id)}
            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            title="Delete Main Checkpoint"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Main Checkpoint Options */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Main Options:</h4>
            <div className="flex items-center space-x-2">
              <select
                value={checkpoint.optionType}
                onChange={(e) => changeOptionType(checkpoint.id, null, e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
              >
                <option value="passfail">Pass/Fail</option>
                <option value="custom">Custom</option>
              </select>
              {checkpoint.optionType === "custom" && (
                <button
                  onClick={() => addOption(checkpoint.id, null)}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                >
                  + Option
                </button>
              )}
            </div>
          </div>
          {renderOptionsGrid(checkpoint.options, checkpoint.id)}
        </div>

        {/* Failure Impact */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Failure Impact:
          </label>
          <select
            value={checkpoint.failureImpact}
            onChange={(e) => updateFailureImpact(checkpoint.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
          >
            <option value="customize">Customize</option>
            <option value="any">Any Sub Fail = Main Fail</option>
            <option value="all">All Sub Fail = Main Fail</option>
            <option value="majority">Majority Fail = Main Fail</option>
          </select>
        </div>

        {/* Sub Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sub Points:</h4>
            <button
              onClick={() => addSubPoint(checkpoint.id)}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
            >
              <Plus className="h-3 w-3" />
              <span>Add Sub Point</span>
            </button>
          </div>

          {checkpoint.subPoints.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
              No sub points added yet. Click "Add Sub Point" to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {checkpoint.subPoints.map((subPoint, subIndex) => (
                <div key={subPoint.id} className="border border-gray-200 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-700">
                  {/* Sub Point Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                                           <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[20px]">
                        {subIndex + 1}.
                      </span>
                      <input
                        type="text"
                        value={subPoint.name}
                        onChange={(e) => updateCheckpointName(checkpoint.id, subPoint.id, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                        placeholder="Sub point name"
                      />
                    </div>
                    <button
                      onClick={() => deleteCheckpoint(checkpoint.id, subPoint.id)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      title="Delete Sub Point"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Sub Point Options */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Options:</span>
                      <div className="flex items-center space-x-2">
                        <select
                          value={subPoint.optionType}
                          onChange={(e) => changeOptionType(checkpoint.id, subPoint.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                        >
                          <option value="passfail">Pass/Fail</option>
                          <option value="custom">Custom</option>
                        </select>
                        {subPoint.optionType === "custom" && (
                          <button
                            onClick={() => addOption(checkpoint.id, subPoint.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                          >
                            + Option
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
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/20">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        QC Washing Checkpoints Configuration
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Configure checkpoints with multiple sub-points and options. Each checkpoint can have multiple sub-points, and each can have custom options with optional remarks.
      </p>
      
      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Configuration Guide:</h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>• <strong>Main Point:</strong> Primary checkpoint (e.g., "Hand Feel")</div>
          <div>• <strong>Sub Points:</strong> Secondary checkpoints under main point (e.g., "Soft", "Smooth")</div>
          <div>• <strong>Options:</strong> Available choices for each point (e.g., "Pass", "Fail", "Dry", "Rough")</div>
          <div>• <strong>Checkboxes:</strong> Def = Default option, Fail = Fail option</div>
          <div>• <strong>Remark:</strong> Optional multilingual remarks (English required, Khmer & Chinese optional)</div>
          <div>• <strong>Failure Impact:</strong> How sub-point failures affect main point result</div>
        </div>
      </div>
      
      <div className="space-y-6">
        <button
          onClick={addMainCheckpoint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Main Checkpoint
        </button>
        
        {checkpoints.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            No checkpoints configured yet. Click "Add Main Checkpoint" to start.
          </div>
        ) : (
          <div className="space-y-6">
            {checkpoints.map(checkpoint => renderCheckpointCard(checkpoint))}
          </div>
        )}
        
        {checkpoints.length > 0 && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isSubmitting ? "Saving..." : "Save All Checkpoints"}
            </button>
          </div>
        )}
      </div>

      {/* Remark Modal */}
      {remarkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Add/Edit Remark
              </h3>
              <button
                onClick={closeRemarkModal}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* English Remark - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  English Remark <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remarkData.english}
                  onChange={(e) => setRemarkData(prev => ({ ...prev, english: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter English remark (required)"
                />
              </div>

              {/* Khmer Remark - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Khmer Remark <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={remarkData.khmer}
                  onChange={(e) => setRemarkData(prev => ({ ...prev, khmer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter Khmer remark (optional)"
                  style={{ fontFamily: 'Khmer OS, Arial, sans-serif' }}
                />
              </div>

              {/* Chinese Remark - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chinese Remark <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={remarkData.chinese}
                  onChange={(e) => setRemarkData(prev => ({ ...prev, chinese: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter Chinese remark (optional)"
                  style={{ fontFamily: 'SimSun, Arial, sans-serif' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={closeRemarkModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRemark}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCWashingCheckpointForm;

