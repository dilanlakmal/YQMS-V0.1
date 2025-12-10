import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Package,
  Layers,
  CheckCircle,
  AlertTriangle,
  PenTool,
  Printer,
  Save,
  Check,
  X,
  Search,
  User,
  Loader2
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// --- SUB-COMPONENT: USER SEARCH INPUT (MULTI-SELECT) ---
const UserSearchInput = ({ label, selectedUsers, onChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${searchTerm}`
          );
          setResults(res.data);
          setShowDropdown(true);
        } catch (error) {
          console.error("User search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelect = (user) => {
    // Prevent duplicates
    if (!selectedUsers.some((u) => u.emp_id === user.emp_id)) {
      onChange([...selectedUsers, user]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemove = (empId) => {
    onChange(selectedUsers.filter((u) => u.emp_id !== empId));
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>

      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden shadow-sm">
          <div className="pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID or Name to add..."
            className="w-full p-2.5 text-sm bg-transparent outline-none dark:text-white placeholder-gray-400"
          />
          {loading && (
            <div className="pr-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {results.map((u) => (
              <button
                key={u.emp_id}
                onClick={() => handleSelect(u)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors"
              >
                {u.face_photo ? (
                  <img
                    src={u.face_photo}
                    alt="face"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                    {u.emp_id}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {u.eng_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Users List */}
      <div className="flex flex-wrap gap-2 mt-1">
        {selectedUsers.map((user) => (
          <div
            key={user.emp_id}
            className="flex items-center gap-3 p-2 pr-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-full shadow-sm animate-fadeIn"
          >
            {user.face_photo ? (
              <img
                src={user.face_photo}
                alt="face"
                className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-700 flex items-center justify-center border-2 border-white dark:border-gray-700">
                <span className="text-xs font-bold text-indigo-700 dark:text-white">
                  {user.emp_id.substring(0, 2)}
                </span>
              </div>
            )}

            <div className="flex flex-col leading-tight">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-100">
                {user.emp_id}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-300 truncate max-w-[100px]">
                {user.eng_name}
              </span>
            </div>

            <button
              onClick={() => handleRemove(user.emp_id)}
              className="ml-1 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Define default state outside to ensure consistency
const DEFAULT_FORM_STATE = {
  date: new Date().toISOString().split("T")[0],
  style: "",
  qty: "",
  materials: {
    ppSizeSet: "OK",
    approvalFullSizeSpec: "OK",
    sampleComments: "OK",
    handFeelStandard: "OK",
    approvalWashingStandard: "OK",
    approvalSwatches: "OK",
    approvalTrimCard: "OK",
    approvalPrintEmb: "OK",
    fabricInspectionResult: "Pass",
    other: ""
  },
  riskAnalysis: [{ risk: "", action: "" }],
  criticalOperations: [""],
  otherComments: [""],
  attendance: {
    merchandiser: [],
    technical: [],
    cutting: [],
    qaqc: [],
    sewing: [],
    mechanic: [],
    ironing: [],
    packing: []
  }
};

// --- MAIN COMPONENT ---
const YPivotQATemplatesPPSheet = ({
  prefilledData,
  savedState,
  onDataChange
}) => {
  // 1. ROBUST INITIALIZATION
  // We merge savedState with DEFAULT_FORM_STATE.
  // This ensures that if 'riskAnalysis' is somehow missing in savedState, it defaults to [{risk:"", action:""}]
  // instead of crashing or being undefined.
  const [formData, setFormData] = useState(() => {
    if (savedState) {
      return {
        ...DEFAULT_FORM_STATE,
        ...savedState,
        // Deep merge specific objects to be safe
        materials: { ...DEFAULT_FORM_STATE.materials, ...savedState.materials },
        attendance: {
          ...DEFAULT_FORM_STATE.attendance,
          ...savedState.attendance
        }
      };
    }
    return DEFAULT_FORM_STATE;
  });

  // 2. AUTO-FILL LOGIC (Only updates Style/Qty/Date if valid and different)
  useEffect(() => {
    if (prefilledData) {
      setFormData((prev) => {
        // Only update if the field is currently empty OR if we want to force sync
        // Here we prioritize prefilled data if it exists, but we preserve other fields
        return {
          ...prev,
          style: prefilledData.style || prev.style,
          qty: prefilledData.qty || prev.qty,
          date: prefilledData.date || prev.date
        };
      });
    }
  }, [prefilledData]);

  // 3. PERSISTENCE LOGIC (Lift State Up)
  // Whenever formData changes (user types), send it up to parent
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  // --- Handlers (Unchanged) ---
  const handleMaterialChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      materials: { ...prev.materials, [field]: value }
    }));
  };

  const handleAttendanceChange = (field, usersList) => {
    setFormData((prev) => ({
      ...prev,
      attendance: { ...prev.attendance, [field]: usersList }
    }));
  };

  const addRiskRow = () => {
    setFormData((prev) => ({
      ...prev,
      riskAnalysis: [...prev.riskAnalysis, { risk: "", action: "" }]
    }));
  };

  const removeRiskRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      riskAnalysis: prev.riskAnalysis.filter((_, i) => i !== index)
    }));
  };

  const updateRiskRow = (index, field, value) => {
    const newRows = [...formData.riskAnalysis];
    newRows[index][field] = value;
    setFormData((prev) => ({ ...prev, riskAnalysis: newRows }));
  };

  const addListRow = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...prev[key], ""]
    }));
  };

  const removeListRow = (key, index) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const updateListRow = (key, index, value) => {
    const newRows = [...formData[key]];
    newRows[index] = value;
    setFormData((prev) => ({ ...prev, [key]: newRows }));
  };

  // --- Render Helpers ---
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    blue: "from-blue-500 to-blue-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
    teal: "from-teal-500 to-teal-600",
    green: "from-green-500 to-green-600"
  };

  const renderSectionHeader = (title, Icon, color = "indigo") => (
    <div
      className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r ${
        colorMap[color] || colorMap.indigo
      } rounded-t-xl`}
    >
      <Icon className="w-5 h-5 text-white" />
      <h3 className="text-white font-bold text-sm uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );

  const StatusSelector = ({
    value,
    onChange,
    options = ["OK", "NO", "NA"]
  }) => {
    return (
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit">
        {options.map((opt) => {
          let isActive = value === opt;
          let activeClass = "";
          let label = opt;

          if (opt === "OK") {
            label = <Check className="w-3.5 h-3.5" />;
            activeClass = "bg-green-500 text-white shadow-sm";
          } else if (opt === "NO") {
            label = <X className="w-3.5 h-3.5" />;
            activeClass = "bg-red-500 text-white shadow-sm";
          } else if (opt === "Pass") {
            label = "Pass";
            activeClass = "bg-green-500 text-white shadow-sm";
          } else if (opt === "Fail") {
            label = "Fail";
            activeClass = "bg-red-500 text-white shadow-sm";
          } else {
            label = "N/A";
            activeClass = "bg-gray-500 text-white shadow-sm";
          }

          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                isActive
                  ? activeClass
                  : "text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Header Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {renderSectionHeader("PP Meeting Report / 产前会", FileText, "indigo")}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Style / 款号
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <Package className="w-4 h-4 text-indigo-500" />
              <input
                type="text"
                value={formData.style}
                onChange={(e) =>
                  setFormData({ ...formData, style: e.target.value })
                }
                className="bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 outline-none w-full"
                placeholder="---"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              QTY / 数量
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <Layers className="w-4 h-4 text-emerald-500" />
              <input
                type="text"
                value={formData.qty}
                onChange={(e) =>
                  setFormData({ ...formData, qty: e.target.value })
                }
                className="bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 outline-none w-full"
                placeholder="---"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Date / 日期
            </label>
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-2 ring-indigo-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-transparent outline-none text-sm font-medium text-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Material Checklist Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {renderSectionHeader(
          "Material Availability / 物料可用性",
          CheckCircle,
          "blue"
        )}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 w-1/4">Material Item</th>
                <th className="px-6 py-4 w-1/4 border-r dark:border-gray-600">
                  Availability
                </th>
                <th className="px-6 py-4 w-1/4">Material Item</th>
                <th className="px-6 py-4 w-1/4">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                [
                  {
                    label: "PP / Size Set / Ref samples 客批样衣",
                    key: "ppSizeSet"
                  },
                  { label: "Approval Swatches 布办", key: "approvalSwatches" }
                ],
                [
                  {
                    label: "Approval Full Size Spec 客批尺寸表",
                    key: "approvalFullSizeSpec"
                  },
                  {
                    label: "Approval Trim card 物料卡",
                    key: "approvalTrimCard"
                  }
                ],
                [
                  { label: "Sample Comments 客人评语", key: "sampleComments" },
                  {
                    label: "Approval Print / Embroidery 印花、绣花",
                    key: "approvalPrintEmb"
                  }
                ],
                [
                  {
                    label: "Hand feel Standard 手感样",
                    key: "handFeelStandard"
                  },
                  {
                    label: "Fabric inspection result 验布结果",
                    key: "fabricInspectionResult",
                    type: "result"
                  }
                ],
                [
                  {
                    label: "Approval Washing Standard 洗水样",
                    key: "approvalWashingStandard"
                  },
                  { label: "Other", key: "other", type: "text" }
                ]
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium">
                    {row[0].label}
                  </td>
                  <td className="px-6 py-2 border-r dark:border-gray-600">
                    {row[0].type === "text" ? (
                      <input
                        type="text"
                        value={formData.materials[row[0].key]}
                        onChange={(e) =>
                          handleMaterialChange(row[0].key, e.target.value)
                        }
                        className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <StatusSelector
                        value={formData.materials[row[0].key]}
                        onChange={(val) =>
                          handleMaterialChange(row[0].key, val)
                        }
                        options={
                          row[0].type === "result"
                            ? ["Pass", "Fail", "NA"]
                            : ["OK", "NO", "NA"]
                        }
                      />
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium">
                    {row[1].label}
                  </td>
                  <td className="px-6 py-2">
                    {row[1].type === "text" ? (
                      <input
                        type="text"
                        value={formData.materials[row[1].key]}
                        onChange={(e) =>
                          handleMaterialChange(row[1].key, e.target.value)
                        }
                        className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <StatusSelector
                        value={formData.materials[row[1].key]}
                        onChange={(val) =>
                          handleMaterialChange(row[1].key, val)
                        }
                        options={
                          row[1].type === "result"
                            ? ["Pass", "Fail", "NA"]
                            : ["OK", "NO", "NA"]
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Risk Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {renderSectionHeader(
          "Risk Analysis / 风险分析",
          AlertTriangle,
          "orange"
        )}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-2 font-bold text-xs uppercase text-gray-500 px-2">
            <div>Risk Analysis 风险分析</div>
            <div>Risk Preventive Action 预防风险措施</div>
          </div>
          <div className="space-y-3">
            {formData.riskAnalysis.map((row, index) => (
              <div
                key={index}
                className="flex flex-col lg:flex-row gap-2 items-start group"
              >
                <div className="flex-1 w-full">
                  <textarea
                    rows={2}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    placeholder="Describe risk..."
                    value={row.risk}
                    onChange={(e) =>
                      updateRiskRow(index, "risk", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1 w-full relative">
                  <textarea
                    rows={2}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    placeholder="Preventive action..."
                    value={row.action}
                    onChange={(e) =>
                      updateRiskRow(index, "action", e.target.value)
                    }
                  />
                  <button
                    onClick={() => removeRiskRow(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addRiskRow}
            className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Add Risk Row
          </button>
        </div>
      </div>

      {/* 4. Critical Operations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {renderSectionHeader(
          "Critical Operation / 重点部位",
          PenTool,
          "purple"
        )}
        <div className="p-4">
          <div className="space-y-2">
            {formData.criticalOperations.map((text, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <span className="text-xs font-bold text-gray-400 w-6 text-right">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  value={text}
                  onChange={(e) =>
                    updateListRow("criticalOperations", index, e.target.value)
                  }
                  placeholder="Operation detail..."
                />
                <button
                  onClick={() => removeListRow("criticalOperations", index)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addListRow("criticalOperations")}
            className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 px-8"
          >
            <Plus className="w-3 h-3" /> Add Operation
          </button>
        </div>
      </div>

      {/* 5. Other Comments */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {renderSectionHeader("Other Comments / 其他评语", FileText, "teal")}
        <div className="p-4">
          <div className="space-y-2">
            {formData.otherComments.map((text, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <span className="text-xs font-bold text-gray-400 w-6 text-right">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  value={text}
                  onChange={(e) =>
                    updateListRow("otherComments", index, e.target.value)
                  }
                  placeholder="Comment..."
                />
                <button
                  onClick={() => removeListRow("otherComments", index)}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addListRow("otherComments")}
            className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 px-8"
          >
            <Plus className="w-3 h-3" /> Add Comment
          </button>
        </div>
      </div>

      {/* 6. Attendance (Multi-Select) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {renderSectionHeader("Attendance / 签名", User, "green")}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <UserSearchInput
              label="1. Merchandiser (跟单)"
              selectedUsers={formData.attendance.merchandiser}
              onChange={(list) => handleAttendanceChange("merchandiser", list)}
            />
            <UserSearchInput
              label="5. Sewing (车间)"
              selectedUsers={formData.attendance.sewing}
              onChange={(list) => handleAttendanceChange("sewing", list)}
            />
            <UserSearchInput
              label="2. Technical (技术部)"
              selectedUsers={formData.attendance.technical}
              onChange={(list) => handleAttendanceChange("technical", list)}
            />
            <UserSearchInput
              label="6. Mechanic (机修)"
              selectedUsers={formData.attendance.mechanic}
              onChange={(list) => handleAttendanceChange("mechanic", list)}
            />
            <UserSearchInput
              label="3. Cutting (裁床)"
              selectedUsers={formData.attendance.cutting}
              onChange={(list) => handleAttendanceChange("cutting", list)}
            />
            <UserSearchInput
              label="7. Ironing (烫部)"
              selectedUsers={formData.attendance.ironing}
              onChange={(list) => handleAttendanceChange("ironing", list)}
            />
            <UserSearchInput
              label="4. QA & QC"
              selectedUsers={formData.attendance.qaqc}
              onChange={(list) => handleAttendanceChange("qaqc", list)}
            />
            <UserSearchInput
              label="8. Packing (包装)"
              selectedUsers={formData.attendance.packing}
              onChange={(list) => handleAttendanceChange("packing", list)}
            />
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl flex justify-end gap-3 z-30">
        <button className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-colors">
          <Save className="w-4 h-4" /> Save Report
        </button>
      </div>

      <style jsx>{`
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
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesPPSheet;
