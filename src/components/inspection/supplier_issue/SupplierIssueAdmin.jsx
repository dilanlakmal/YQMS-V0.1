import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  Plus,
  Edit,
  Save,
  Trash2,
  X,
  Search,
  XCircle,
  Building,
  Tag
} from "lucide-react";
import Swal from "sweetalert2";
import Select from "react-select";

// --- Reusable Components ---

const AdminCard = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
    )}
    <input
      className="w-full p-2 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
      {...props}
    />
  </div>
);

const ActionButton = ({
  onClick,
  children,
  className = "",
  icon,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md transition ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {icon}
    {children}
  </button>
);

const IconButton = ({ onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-full transition ${className}`}
  >
    {children}
  </button>
);

const selectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary, #F9FAFB)", // Default to light gray
    borderColor: "var(--color-border, #D1D5DB)",
    boxShadow: "none",
    "&:hover": {
      borderColor: "var(--color-border-hover, #9CA3AF)"
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--color-text-primary, #111827)" // FIX: Sets text color for selected item
  }),
  input: (base) => ({
    ...base,
    color: "var(--color-text-primary, #111827)" // FIX: Sets text color for the input field
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--color-text-secondary, #6B7280)" // FIX: Sets placeholder color
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary, #FFFFFF)", // Dropdown background
    zIndex: 20
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--color-bg-accent-active, #4F46E5)"
      : isFocused
      ? "var(--color-bg-accent, #6366F1)"
      : "transparent",
    color: isSelected
      ? "var(--color-text-accent, #FFFFFF)"
      : "var(--color-text-primary, #111827)", // FIX: Sets text color for options
    "&:active": {
      backgroundColor: "var(--color-bg-accent-active, #4338CA)"
    }
  })
};

// --- Main Admin Component ---

const SupplierIssueAdmin = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);

  const [newFactoryType, setNewFactoryType] = useState("");
  const [newFactoryName, setNewFactoryName] = useState("");
  const [newDefect, setNewDefect] = useState({ eng: "", khmer: "", chi: "" });

  // State for tables
  const [factorySearch, setFactorySearch] = useState("");
  const [defectSearch, setDefectSearch] = useState({ no: "", name: "" });
  const [editingFactory, setEditingFactory] = useState({
    oldName: null,
    newName: ""
  });
  const [editingDefect, setEditingDefect] = useState(null); // Will hold the entire defect object

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/supplier-issues/defects`
      );
      setConfigs(res.data);
    } catch (error) {
      Swal.fire("Error", "Could not fetch configurations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const factoryTypeOptions = useMemo(
    () => configs.map((c) => ({ value: c.factoryType, label: c.factoryType })),
    [configs]
  );

  // --- Handlers (No logical changes needed) ---
  const handleAddFactoryType = async () => {
    if (!newFactoryType.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/api/supplier-issues/defects`, {
        factoryType: newFactoryType
      });
      Swal.fire("Success", "New factory type added!", "success");
      setNewFactoryType("");
      fetchConfigs();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to add type.",
        "error"
      );
    }
  };

  const handleAddFactoryName = async () => {
    if (!selectedType || !newFactoryName.trim()) return;
    try {
      await axios.post(
        `${API_BASE_URL}/api/supplier-issues/defects/${selectedType.value}/factories`,
        { factoryName: newFactoryName }
      );
      Swal.fire("Success", "New factory name added!", "success");
      setNewFactoryName("");
      fetchConfigs();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to add factory name.",
        "error"
      );
    }
  };

  const handleAddDefect = async () => {
    if (!selectedType || !newDefect.eng.trim()) return;
    try {
      await axios.post(
        `${API_BASE_URL}/api/supplier-issues/defects/${selectedType.value}/defects`,
        {
          defectNameEng: newDefect.eng,
          defectNameKhmer: newDefect.khmer,
          defectNameChi: newDefect.chi
        }
      );
      Swal.fire("Success", "New defect added!", "success");
      setNewDefect({ eng: "", khmer: "", chi: "" });
      fetchConfigs();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to add defect.",
        "error"
      );
    }
  };

  const handleDeleteFactory = (factoryName) => {
    Swal.fire({
      title: "Are you sure?",
      text: `This will delete "${factoryName}". You can't undo this!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/supplier-issues/defects/${selectedType.value}/factories`,
            { data: { factoryName } }
          );
          Swal.fire(
            "Deleted!",
            `"${factoryName}" has been deleted.`,
            "success"
          );
          fetchConfigs();
        } catch (error) {
          Swal.fire(
            "Error",
            error.response?.data?.error || "Failed to delete factory.",
            "error"
          );
        }
      }
    });
  };

  const handleUpdateFactory = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/supplier-issues/defects/${selectedType.value}/factories`,
        { oldName: editingFactory.oldName, newName: editingFactory.newName }
      );
      Swal.fire("Success", "Factory name updated!", "success");
      setEditingFactory({ oldName: null, newName: "" });
      fetchConfigs();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to update factory.",
        "error"
      );
    }
  };

  const handleDeleteDefect = (defect) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete defect: "${defect.defectNameEng}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/supplier-issues/defects/${selectedType.value}/defects/${defect._id}`
          );
          Swal.fire("Deleted!", "Defect has been removed.", "success");
          fetchConfigs();
        } catch (error) {
          Swal.fire(
            "Error",
            error.response?.data?.error || "Failed to delete defect.",
            "error"
          );
        }
      }
    });
  };

  const handleUpdateDefect = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/supplier-issues/defects/${selectedType.value}/defects/${editingDefect._id}`,
        {
          defectNameEng: editingDefect.defectNameEng,
          defectNameKhmer: editingDefect.defectNameKhmer,
          defectNameChi: editingDefect.defectNameChi
        }
      );
      Swal.fire("Success", "Defect updated!", "success");
      setEditingDefect(null);
      fetchConfigs();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to update defect.",
        "error"
      );
    }
  };

  // --- Memoized state for display ---
  const selectedConfig = useMemo(
    () => configs.find((c) => c.factoryType === selectedType?.value),
    [selectedType, configs]
  );
  const filteredFactories = useMemo(() => {
    if (!selectedConfig) return [];
    return selectedConfig.factoryList.filter((f) =>
      f.toLowerCase().includes(factorySearch.toLowerCase())
    );
  }, [selectedConfig, factorySearch]);
  const filteredDefects = useMemo(() => {
    if (!selectedConfig) return [];
    return selectedConfig.defectList.filter(
      (d) =>
        d.no.toString().includes(defectSearch.no) &&
        d.defectNameEng.toLowerCase().includes(defectSearch.name.toLowerCase())
    );
  }, [selectedConfig, defectSearch]);

  if (loading)
    return <div className="text-center p-8">Loading configuration...</div>;

  // --- RENDER SECTION ---
  return (
    <div className="space-y-8 text-gray-700 dark:text-gray-200">
      {/* --- Section 1: Add --- */}
      <AdminCard
        title="Add New Factory Type"
        icon={<Building size={20} className="text-indigo-500" />}
      >
        <div className="flex gap-2">
          <InputField
            placeholder="E.g., Printing, Embroidery..."
            value={newFactoryType}
            onChange={(e) => setNewFactoryType(e.target.value)}
          />
          <ActionButton
            onClick={handleAddFactoryType}
            className="bg-green-600 hover:bg-green-700"
            icon={<Plus size={16} />}
          >
            Add Type
          </ActionButton>
        </div>
      </AdminCard>

      <AdminCard
        title="Add New Factory Name / Defect"
        icon={<Plus size={20} className="text-indigo-500" />}
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Select Factory Type First
          </label>
          <Select
            options={factoryTypeOptions}
            value={selectedType}
            onChange={setSelectedType}
            styles={selectStyles}
            placeholder="Select a type to enable adding..."
          />
        </div>

        {selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Column 1: Add Factory */}
            <div className="space-y-3 text-gray-700 dark:text-gray-200">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                Add Factory Name
              </h4>
              <div className="flex items-end gap-2">
                <InputField
                  label="New Factory Name"
                  placeholder="E.g., Sunwahyu"
                  value={newFactoryName}
                  onChange={(e) => setNewFactoryName(e.target.value)}
                />
                <ActionButton
                  onClick={handleAddFactoryName}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  icon={<Plus size={16} />}
                >
                  Add
                </ActionButton>
              </div>
            </div>
            {/* Column 2: Add Defect */}
            <div className="space-y-3 text-gray-800 dark:text-gray-300">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                Add Defect
              </h4>
              <InputField
                label="Defect Name (English)"
                value={newDefect.eng}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, eng: e.target.value })
                }
              />
              <InputField
                label="Defect Name (Khmer)"
                value={newDefect.khmer}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, khmer: e.target.value })
                }
              />
              <InputField
                label="Defect Name (Chinese)"
                value={newDefect.chi}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, chi: e.target.value })
                }
              />
              <ActionButton
                onClick={handleAddDefect}
                className="bg-indigo-600 hover:bg-indigo-700 w-full"
                icon={<Plus size={16} />}
              >
                Add Defect
              </ActionButton>
            </div>
          </div>
        )}
      </AdminCard>

      {/* --- Section 2: Manage --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AdminCard
          title={`Manage Factories: ${selectedType?.label || "..."}`}
          icon={<Building size={20} className="text-indigo-500" />}
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <InputField
              placeholder="Search factory names..."
              value={factorySearch}
              onChange={(e) => setFactorySearch(e.target.value)}
              className="pl-10"
            />
            {factorySearch && (
              <XCircle
                size={18}
                onClick={() => setFactorySearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              />
            )}
          </div>
          <div className="max-h-80 overflow-y-auto border dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    Factory Name
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFactories.map((name) => (
                  <tr key={name} className="border-t dark:border-gray-700">
                    <td className="p-3 text-gray-800 dark:text-gray-300">
                      {editingFactory.oldName === name ? (
                        <InputField
                          value={editingFactory.newName}
                          onChange={(e) =>
                            setEditingFactory({
                              ...editingFactory,
                              newName: e.target.value
                            })
                          }
                        />
                      ) : (
                        name
                      )}
                    </td>
                    <td className="p-3 w-28 text-right space-x-1">
                      {editingFactory.oldName === name ? (
                        <>
                          <IconButton
                            onClick={handleUpdateFactory}
                            className="text-green-500 hover:bg-green-100 dark:hover:bg-green-800"
                          >
                            <Save size={18} />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              setEditingFactory({ oldName: null, newName: "" })
                            }
                            className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <X size={18} />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() =>
                              setEditingFactory({
                                oldName: name,
                                newName: name
                              })
                            }
                            className="text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800"
                          >
                            <Edit size={18} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteFactory(name)}
                            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-800"
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard
          title={`Manage Defects: ${selectedType?.label || "..."}`}
          icon={<Tag size={20} className="text-indigo-500" />}
        >
          <div className="grid grid-cols-3 gap-2">
            <InputField
              placeholder="Search No..."
              value={defectSearch.no}
              onChange={(e) =>
                setDefectSearch({ ...defectSearch, no: e.target.value })
              }
            />
            <InputField
              placeholder="Search Name..."
              value={defectSearch.name}
              onChange={(e) =>
                setDefectSearch({ ...defectSearch, name: e.target.value })
              }
              className="col-span-2"
            />
          </div>
          <div className="max-h-96 overflow-y-auto border dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    No.
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    English
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    Khmer
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    Chinese
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDefects.map((defect) => (
                  <tr
                    key={defect._id}
                    className="border-t dark:border-gray-700 text-gray-800 dark:text-gray-300"
                  >
                    <td className="p-3 font-mono text-gray-800 dark:text-gray-300">
                      {defect.no}
                    </td>
                    {editingDefect?._id === defect._id ? (
                      <>
                        <td>
                          <InputField
                            value={editingDefect.defectNameEng}
                            onChange={(e) =>
                              setEditingDefect({
                                ...editingDefect,
                                defectNameEng: e.target.value
                              })
                            }
                          />
                        </td>
                        <td>
                          <InputField
                            value={editingDefect.defectNameKhmer}
                            onChange={(e) =>
                              setEditingDefect({
                                ...editingDefect,
                                defectNameKhmer: e.target.value
                              })
                            }
                          />
                        </td>
                        <td>
                          <InputField
                            value={editingDefect.defectNameChi}
                            onChange={(e) =>
                              setEditingDefect({
                                ...editingDefect,
                                defectNameChi: e.target.value
                              })
                            }
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-semibold">
                          {defect.defectNameEng}
                        </td>
                        <td className="p-3">{defect.defectNameKhmer}</td>
                        <td className="p-3">{defect.defectNameChi}</td>
                      </>
                    )}
                    <td className="p-3 w-28 text-right space-x-1">
                      {editingDefect?._id === defect._id ? (
                        <>
                          <IconButton
                            onClick={handleUpdateDefect}
                            className="text-green-500 hover:bg-green-100 dark:hover:bg-green-800"
                          >
                            <Save size={18} />
                          </IconButton>
                          <IconButton
                            onClick={() => setEditingDefect(null)}
                            className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <X size={18} />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => setEditingDefect({ ...defect })}
                            className="text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800"
                          >
                            <Edit size={18} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteDefect(defect)}
                            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-800"
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default SupplierIssueAdmin;
