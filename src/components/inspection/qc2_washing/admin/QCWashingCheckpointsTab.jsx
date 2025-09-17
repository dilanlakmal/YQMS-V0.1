import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import QCWashingCheckpointForm from "./QCWashingCheckpointForm";
import {
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
  MessageSquare,
  X,
  Check
} from "lucide-react";

const QCWashingCheckpointsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editRowId, setEditRowId] = useState(null);
  const [editedCheckpoint, setEditedCheckpoint] = useState({});
  const [isSaving, setIsSaving] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showSubPoints, setShowSubPoints] = useState(new Set());
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [currentRemarkOption, setCurrentRemarkOption] = useState(null);
  const [remarkData, setRemarkData] = useState({
    english: "",
    khmer: "",
    chinese: ""
  });

  const fetchCheckpoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-washing-checklist`
      );
      setCheckpoints(response.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: "Failed to fetch checkpoints"
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSubPointsVisibility = (id) => {
    const newShowSubPoints = new Set(showSubPoints);
    if (newShowSubPoints.has(id)) {
      newShowSubPoints.delete(id);
    } else {
      newShowSubPoints.add(id);
    }
    setShowSubPoints(newShowSubPoints);
  };

  const handleEdit = (checkpoint) => {
    setEditRowId(checkpoint._id);
    setEditedCheckpoint({
      name: checkpoint.name,
      optionType: checkpoint.optionType,
      options: checkpoint.options.map((opt) => ({
        ...opt,
        hasRemark: opt.hasRemark || false,
        remark: opt.remark || null
      })),
      subPoints: checkpoint.subPoints.map((sub) => ({
        ...sub,
        options: sub.options.map((opt) => ({
          ...opt,
          hasRemark: opt.hasRemark || false,
          remark: opt.remark || null
        }))
      })),
      failureImpact: checkpoint.failureImpact
    });
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedCheckpoint({});
  };

  const updateEditData = (field, value) => {
    setEditedCheckpoint((prev) => ({ ...prev, [field]: value }));
  };

  const updateOption = (
    optionId,
    field,
    value,
    isSubPoint = false,
    subPointId = null
  ) => {
    if (isSubPoint && subPointId) {
      setEditedCheckpoint((prev) => ({
        ...prev,
        subPoints: prev.subPoints.map((sub) =>
          sub.id === subPointId
            ? {
                ...sub,
                options: sub.options.map((opt) => {
                  if (opt.id === optionId) {
                    return { ...opt, [field]: value };
                  } else if (field === "isDefault" && value) {
                    return { ...opt, isDefault: false };
                  }
                  return opt;
                })
              }
            : sub
        )
      }));
    } else {
      setEditedCheckpoint((prev) => ({
        ...prev,
        options: prev.options.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, [field]: value };
          } else if (field === "isDefault" && value) {
            return { ...opt, isDefault: false };
          }
          return opt;
        })
      }));
    }
  };

  const addOption = (isSubPoint = false, subPointId = null) => {
    const newOption = {
      id: Date.now() + Math.random(),
      name: "",
      isDefault: false,
      isFail: false,
      hasRemark: false,
      remark: null
    };

    if (isSubPoint && subPointId) {
      setEditedCheckpoint((prev) => ({
        ...prev,
        subPoints: prev.subPoints.map((sub) =>
          sub.id === subPointId
            ? { ...sub, options: [...sub.options, newOption] }
            : sub
        )
      }));
    } else {
      setEditedCheckpoint((prev) => ({
        ...prev,
        options: [...prev.options, newOption]
      }));
    }
  };

  const deleteOption = (optionId, isSubPoint = false, subPointId = null) => {
    if (isSubPoint && subPointId) {
      setEditedCheckpoint((prev) => ({
        ...prev,
        subPoints: prev.subPoints.map((sub) =>
          sub.id === subPointId
            ? {
                ...sub,
                options:
                  sub.options.filter((opt) => opt.id !== optionId).length > 0
                    ? sub.options.filter((opt) => opt.id !== optionId)
                    : [
                        {
                          id: Date.now(),
                          name: "Pass",
                          isDefault: true,
                          isFail: false,
                          hasRemark: false,
                          remark: null
                        }
                      ]
              }
            : sub
        )
      }));
    } else {
      setEditedCheckpoint((prev) => ({
        ...prev,
        options:
          prev.options.filter((opt) => opt.id !== optionId).length > 0
            ? prev.options.filter((opt) => opt.id !== optionId)
            : [
                {
                  id: Date.now(),
                  name: "Pass",
                  isDefault: true,
                  isFail: false,
                  hasRemark: false,
                  remark: null
                }
              ]
      }));
    }
  };

  const updateSubPoint = (subPointId, field, value) => {
    setEditedCheckpoint((prev) => ({
      ...prev,
      subPoints: prev.subPoints.map((sub) =>
        sub.id === subPointId ? { ...sub, [field]: value } : sub
      )
    }));
  };

  const addSubPoint = () => {
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

    setEditedCheckpoint((prev) => ({
      ...prev,
      subPoints: [...prev.subPoints, newSubPoint]
    }));
  };

  const deleteSubPoint = (subPointId) => {
    setEditedCheckpoint((prev) => ({
      ...prev,
      subPoints: prev.subPoints.filter((sub) => sub.id !== subPointId)
    }));
  };

  const changeOptionType = (type, isSubPoint = false, subPointId = null) => {
    const newOptions =
      type === "passfail"
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
        : [
            {
              id: Date.now() + 1,
              name: "",
              isDefault: true,
              isFail: false,
              hasRemark: false,
              remark: null
            }
          ];

    if (isSubPoint && subPointId) {
      setEditedCheckpoint((prev) => ({
        ...prev,
        subPoints: prev.subPoints.map((sub) =>
          sub.id === subPointId
            ? { ...sub, optionType: type, options: newOptions }
            : sub
        )
      }));
    } else {
      setEditedCheckpoint((prev) => ({
        ...prev,
        optionType: type,
        options: newOptions
      }));
    }
  };

  // Remark functions
  const openRemarkModal = (
    checkpointId,
    subPointId,
    optionId,
    isEditing = false
  ) => {
    let option;

    if (isEditing) {
      if (!subPointId) {
        option = editedCheckpoint.options.find((opt) => opt.id === optionId);
      } else {
        const subPoint = editedCheckpoint.subPoints.find(
          (sub) => sub.id === subPointId
        );
        option = subPoint.options.find((opt) => opt.id === optionId);
      }
    } else {
      const checkpoint = checkpoints.find((cp) => cp._id === checkpointId);
      if (!subPointId) {
        option = checkpoint.options.find((opt) => opt.id === optionId);
      } else {
        const subPoint = checkpoint.subPoints.find(
          (sub) => sub.id === subPointId
        );
        option = subPoint.options.find((opt) => opt.id === optionId);
      }
    }

    setCurrentRemarkOption({ checkpointId, subPointId, optionId, isEditing });
    setRemarkData({
      english: option.remark?.english || "",
      khmer: option.remark?.khmer || "",
      chinese: option.remark?.chinese || ""
    });
    setRemarkModalOpen(true);
  };

  const closeRemarkModal = () => {
    setRemarkModalOpen(false);
    setCurrentRemarkOption(null);
    setRemarkData({ english: "", khmer: "", chinese: "" });
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

    const { checkpointId, subPointId, optionId, isEditing } =
      currentRemarkOption;

    if (isEditing) {
      // Update in edit state
      if (!subPointId) {
        setEditedCheckpoint((prev) => ({
          ...prev,
          options: prev.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  hasRemark: true,
                  remark: {
                    english: remarkData.english.trim(),
                    khmer: remarkData.khmer.trim(),
                    chinese: remarkData.chinese.trim()
                  }
                }
              : opt
          )
        }));
      } else {
        setEditedCheckpoint((prev) => ({
          ...prev,
          subPoints: prev.subPoints.map((sub) =>
            sub.id === subPointId
              ? {
                  ...sub,
                  options: sub.options.map((opt) =>
                    opt.id === optionId
                      ? {
                          ...opt,
                          hasRemark: true,
                          remark: {
                            english: remarkData.english.trim(),
                            khmer: remarkData.khmer.trim(),
                            chinese: remarkData.chinese.trim()
                          }
                        }
                      : opt
                  )
                }
              : sub
          )
        }));
      }
    }

    closeRemarkModal();
  };

  const removeRemark = (
    checkpointId,
    subPointId,
    optionId,
    isEditing = false
  ) => {
    if (isEditing) {
      // Remove from edit state
      if (!subPointId) {
        setEditedCheckpoint((prev) => ({
          ...prev,
          options: prev.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, hasRemark: false, remark: null }
              : opt
          )
        }));
      } else {
        setEditedCheckpoint((prev) => ({
          ...prev,
          subPoints: prev.subPoints.map((sub) =>
            sub.id === subPointId
              ? {
                  ...sub,
                  options: sub.options.map((opt) =>
                    opt.id === optionId
                      ? { ...opt, hasRemark: false, remark: null }
                      : opt
                  )
                }
              : sub
          )
        }));
      }
    }
  };

  const handleSave = async (id) => {
    if (!editedCheckpoint.name?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Checkpoint name is required"
      });
      return;
    }

    if (!editedCheckpoint.options || editedCheckpoint.options.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "At least one option is required"
      });
      return;
    }

    // Validate all options have names
    const invalidMainOptions = editedCheckpoint.options.some(
      (opt) => !opt.name || !opt.name.trim()
    );
    if (invalidMainOptions) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "All main options must have names"
      });
      return;
    }

    // Validate remarks
    for (const option of editedCheckpoint.options) {
      if (
        option.hasRemark &&
        (!option.remark?.english || !option.remark.english.trim())
      ) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Remark",
          text: `Option "${option.name}" has remark enabled but English remark is missing`
        });
        return;
      }
    }

    // Validate sub points
    for (const subPoint of editedCheckpoint.subPoints) {
      if (!subPoint.name || !subPoint.name.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: "All sub points must have names"
        });
        return;
      }

      const invalidSubOptions = subPoint.options.some(
        (opt) => !opt.name || !opt.name.trim()
      );
      if (invalidSubOptions) {
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: `Sub point "${subPoint.name}" has options without names`
        });
        return;
      }

      // Validate sub point remarks
      for (const option of subPoint.options) {
        if (
          option.hasRemark &&
          (!option.remark?.english || !option.remark.english.trim())
        ) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Remark",
            text: `Option "${option.name}" in sub point "${subPoint.name}" has remark enabled but English remark is missing`
          });
          return;
        }
      }
    }

    setIsSaving(id);
    try {
      const updateData = {
        ...editedCheckpoint,
        updatedBy: {
          emp_id: user?.emp_id,
          eng_name: user?.eng_name
        }
      };

      await axios.put(
        `${API_BASE_URL}/api/qc-washing-checklist/${id}`,
        updateData
      );

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: "Checkpoint updated successfully"
      });

      setEditRowId(null);
      setEditedCheckpoint({});
      fetchCheckpoints();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || "Failed to update checkpoint"
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `This will permanently delete "${name}" checkpoint`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      setIsSaving(id);
      try {
        await axios.delete(`${API_BASE_URL}/api/qc-washing-checklist/${id}`);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Checkpoint has been deleted."
        });
        fetchCheckpoints();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: t("common.error"),
          text: error.response?.data?.message || "Failed to delete checkpoint"
        });
      } finally {
        setIsSaving(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFailureImpactText = (impact) => {
    switch (impact) {
      case "any":
        return "Any Sub Fail = Main Fail";
      case "all":
        return "All Sub Fail = Main Fail";
      case "majority":
        return "Majority Fail = Main Fail";
      default:
        return impact;
    }
  };

  const getFailureImpactColor = (impact) => {
    switch (impact) {
      case "any":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      case "all":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400";
      case "majority":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const renderRemarkDisplay = (remark) => {
    if (!remark) return null;

    return (
      <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
        <div className="space-y-1">
          <div>
            <span className="font-medium text-blue-700 dark:text-blue-300">
              EN:
            </span>
            <span className="ml-1 text-blue-600 dark:text-blue-400">
              {remark.english}
            </span>
          </div>
          {remark.khmer && (
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">
                KH:
              </span>
              <span
                className="ml-1 text-blue-600 dark:text-blue-400"
                style={{ fontFamily: "Khmer OS, Arial, sans-serif" }}
              >
                {remark.khmer}
              </span>
            </div>
          )}
          {remark.chinese && (
            <div>
              <span className="font-medium text-blue-700 dark:text-blue-300">
                CN:
              </span>
              <span
                className="ml-1 text-blue-600 dark:text-blue-400"
                style={{ fontFamily: "SimSun, Arial, sans-serif" }}
              >
                {remark.chinese}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOptionsDisplay = (
    options,
    isEditing = false,
    isSubPoint = false,
    subPointId = null,
    checkpointId = null
  ) => {
    if (isEditing) {
      return (
        <div className="space-y-2 max-w-md">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="p-2 border rounded bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[20px]">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) =>
                    updateOption(
                      option.id,
                      "name",
                      e.target.value,
                      isSubPoint,
                      subPointId
                    )
                  }
                  className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Option name"
                />
                <div className="flex items-center space-x-1">
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={option.isDefault}
                      onChange={(e) =>
                        updateOption(
                          option.id,
                          "isDefault",
                          e.target.checked,
                          isSubPoint,
                          subPointId
                        )
                      }
                      className="w-3 h-3 text-green-600"
                    />
                    <span className="text-green-600 dark:text-green-400">
                      Def
                    </span>
                  </label>
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={option.isFail}
                      onChange={(e) =>
                        updateOption(
                          option.id,
                          "isFail",
                          e.target.checked,
                          isSubPoint,
                          subPointId
                        )
                      }
                      className="w-3 h-3 text-red-600"
                    />
                    <span className="text-red-600 dark:text-red-400">Fail</span>
                  </label>
                </div>

                {/* Remark Section */}
                <div className="flex items-center space-x-1">
                  {option.hasRemark ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          openRemarkModal(
                            checkpointId,
                            subPointId,
                            option.id,
                            true
                          )
                        }
                        className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                        title="Edit Remark"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() =>
                          removeRemark(
                            checkpointId,
                            subPointId,
                            option.id,
                            true
                          )
                        }
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
                      onClick={() =>
                        openRemarkModal(
                          checkpointId,
                          subPointId,
                          option.id,
                          true
                        )
                      }
                      className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Add Remark"
                    >
                      <MessageSquare className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {options.length > 1 && (
                  <button
                    onClick={() =>
                      deleteOption(option.id, isSubPoint, subPointId)
                    }
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Display remark if exists */}
              {option.hasRemark &&
                option.remark &&
                renderRemarkDisplay(option.remark)}
            </div>
          ))}
          <button
            onClick={() => addOption(isSubPoint, subPointId)}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
          >
            <Plus className="h-3 w-3" />
            <span>Add Option</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1 max-w-xs">
        {options.map((option, index) => (
          <div key={option.id} className="text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 dark:text-gray-400 min-w-[20px]">
                {index + 1}.
              </span>
              <span className="flex-1 truncate">{option.name}</span>
              <div className="flex items-center space-x-1">
                {option.isDefault && (
                  <span className="px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                )}
                {option.isFail && (
                  <span className="px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                    <AlertTriangle className="h-3 w-3" />
                  </span>
                )}
                {option.hasRemark && (
                  <button
                    onClick={() =>
                      openRemarkModal(
                        checkpointId,
                        subPointId,
                        option.id,
                        false
                      )
                    }
                    className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800/30"
                    title="View Remark"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            {/* Display remark if exists */}
            {option.hasRemark &&
              option.remark &&
              renderRemarkDisplay(option.remark)}
          </div>
        ))}
      </div>
    );
  };

  const renderSubPointsDisplay = (
    subPoints,
    isEditing = false,
    checkpointId = null
  ) => {
    if (isEditing) {
      return (
        <div className="space-y-3 max-w-2xl">
          {subPoints.map((subPoint, index) => (
            <div
              key={subPoint.id}
              className="border rounded p-3 bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[20px]">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={subPoint.name}
                    onChange={(e) =>
                      updateSubPoint(subPoint.id, "name", e.target.value)
                    }
                    className="flex-1 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Sub point name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={subPoint.optionType}
                    onChange={(e) =>
                      changeOptionType(e.target.value, true, subPoint.id)
                    }
                    className="text-xs px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value="passfail">Pass/Fail</option>
                    <option value="custom">Custom</option>
                  </select>
                  <button
                    onClick={() => deleteSubPoint(subPoint.id)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="ml-6">
                {renderOptionsDisplay(
                  subPoint.options,
                  true,
                  true,
                  subPoint.id,
                  checkpointId
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addSubPoint}
            className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sub Point</span>
          </button>
        </div>
      );
    }

    if (subPoints.length === 0) {
      return (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic">
          No sub points configured
        </div>
      );
    }

    return (
      <div className="space-y-2 max-w-md">
        {subPoints.map((subPoint, index) => (
          <div
            key={subPoint.id}
            className="border-l-4 border-blue-200 dark:border-blue-600 pl-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h5 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                {index + 1}. {subPoint.name}
              </h5>
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                {subPoint.optionType === "passfail" ? "P/F" : "Custom"}
              </span>
            </div>
            {renderOptionsDisplay(
              subPoint.options,
              false,
              true,
              subPoint.id,
              checkpointId
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <QCWashingCheckpointForm onCheckpointAdded={fetchCheckpoints} />

      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              QC Washing Checkpoints ({checkpoints.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your quality control washing checkpoints with detailed
              configurations and remarks
            </p>
          </div>
        </div>

        {checkpoints.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No checkpoints configured
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add your first checkpoint to get started with QC washing
              configuration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Checkpoint Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Main Options
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sub Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Failure Impact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Metadata
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                    </td>
                  </tr>
                ) : (
                  checkpoints.map((checkpoint) => (
                    <tr
                      key={checkpoint._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      {/* Checkpoint Details */}
                      <td className="px-4 py-4 align-top">
                        {editRowId === checkpoint._id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editedCheckpoint.name}
                              onChange={(e) =>
                                updateEditData("name", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Checkpoint name"
                            />
                            <select
                              value={editedCheckpoint.optionType}
                              onChange={(e) => changeOptionType(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="passfail">Pass/Fail</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {checkpoint.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Type:{" "}
                              {checkpoint.optionType === "passfail"
                                ? "Pass/Fail"
                                : "Custom"}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Main Options */}
                      <td className="px-4 py-4 align-top">
                        {editRowId === checkpoint._id
                          ? renderOptionsDisplay(
                              editedCheckpoint.options,
                              true,
                              false,
                              null,
                              checkpoint._id
                            )
                          : renderOptionsDisplay(
                              checkpoint.options,
                              false,
                              false,
                              null,
                              checkpoint._id
                            )}
                      </td>

                      {/* Sub Points */}
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Sub Points (
                              {editRowId === checkpoint._id
                                ? editedCheckpoint.subPoints.length
                                : checkpoint.subPoints.length}
                              )
                            </span>
                            {(editRowId === checkpoint._id
                              ? editedCheckpoint.subPoints.length
                              : checkpoint.subPoints.length) > 0 &&
                              editRowId !== checkpoint._id && (
                                <button
                                  onClick={() =>
                                    toggleSubPointsVisibility(checkpoint._id)
                                  }
                                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {showSubPoints.has(checkpoint._id) ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                          </div>

                          {(showSubPoints.has(checkpoint._id) ||
                            editRowId === checkpoint._id) && (
                            <div>
                              {editRowId === checkpoint._id
                                ? renderSubPointsDisplay(
                                    editedCheckpoint.subPoints,
                                    true,
                                    checkpoint._id
                                  )
                                : renderSubPointsDisplay(
                                    checkpoint.subPoints,
                                    false,
                                    checkpoint._id
                                  )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Failure Impact */}
                      <td className="px-4 py-4 align-top">
                        {editRowId === checkpoint._id ? (
                          <select
                            value={editedCheckpoint.failureImpact}
                            onChange={(e) =>
                              updateEditData("failureImpact", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="any">
                              Any Sub Fail = Main Fail
                            </option>
                            <option value="all">
                              All Sub Fail = Main Fail
                            </option>
                            <option value="majority">
                              Majority Fail = Main Fail
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getFailureImpactColor(
                              checkpoint.failureImpact
                            )}`}
                          >
                            {getFailureImpactText(checkpoint.failureImpact)}
                          </span>
                        )}
                      </td>

                      {/* Metadata */}
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Added by:
                            </span>
                            <br />
                            <span className="text-gray-900 dark:text-gray-100">
                              {checkpoint.addedBy?.eng_name || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Date:
                            </span>
                            <br />
                            <span className="text-gray-900 dark:text-gray-100">
                              {checkpoint.createdAt
                                ? formatDate(checkpoint.createdAt)
                                : "-"}
                            </span>
                          </div>
                          {checkpoint.updatedBy && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Updated by:
                              </span>
                              <br />
                              <span className="text-gray-900 dark:text-gray-100">
                                {checkpoint.updatedBy.eng_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-center align-top">
                        {editRowId === checkpoint._id ? (
                          <div className="flex flex-col items-center space-y-2">
                            <button
                              onClick={() => handleSave(checkpoint._id)}
                              disabled={isSaving === checkpoint._id}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors duration-200"
                            >
                              {isSaving === checkpoint._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <button
                              onClick={() => handleEdit(checkpoint)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(checkpoint._id, checkpoint.name)
                              }
                              disabled={isSaving === checkpoint._id}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
                            >
                              {isSaving === checkpoint._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remark Modal */}
      {remarkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {currentRemarkOption?.isEditing ? "Edit Remark" : "View Remark"}
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
                  English Remark{" "}
                  {currentRemarkOption?.isEditing && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                {currentRemarkOption?.isEditing ? (
                  <textarea
                    value={remarkData.english}
                    onChange={(e) =>
                      setRemarkData((prev) => ({
                        ...prev,
                        english: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter English remark (required)"
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md min-h-[80px]">
                    {remarkData.english || "No English remark"}
                  </div>
                )}
              </div>

              {/* Khmer Remark - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Khmer Remark <span className="text-gray-400">(Optional)</span>
                </label>
                {currentRemarkOption?.isEditing ? (
                  <textarea
                    value={remarkData.khmer}
                    onChange={(e) =>
                      setRemarkData((prev) => ({
                        ...prev,
                        khmer: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter Khmer remark (optional)"
                    style={{ fontFamily: "Khmer OS, Arial, sans-serif" }}
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md min-h-[80px]"
                    style={{ fontFamily: "Khmer OS, Arial, sans-serif" }}
                  >
                    {remarkData.khmer || "No Khmer remark"}
                  </div>
                )}
              </div>

              {/* Chinese Remark - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chinese Remark{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                {currentRemarkOption?.isEditing ? (
                  <textarea
                    value={remarkData.chinese}
                    onChange={(e) =>
                      setRemarkData((prev) => ({
                        ...prev,
                        chinese: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter Chinese remark (optional)"
                    style={{ fontFamily: "SimSun, Arial, sans-serif" }}
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md min-h-[80px]"
                    style={{ fontFamily: "SimSun, Arial, sans-serif" }}
                  >
                    {remarkData.chinese || "No Chinese remark"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={closeRemarkModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {currentRemarkOption?.isEditing ? "Cancel" : "Close"}
              </button>
              {currentRemarkOption?.isEditing && (
                <button
                  onClick={saveRemark}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Remark
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCWashingCheckpointsTab;
