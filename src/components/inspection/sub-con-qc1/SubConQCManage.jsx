import axios from "axios";
import {
  Edit,
  Factory,
  ListChecks,
  Plus,
  PlusCircle,
  Save,
  Trash2,
  X,
  XCircle
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";

// Main component
const SubConQCManage = () => {
  return (
    <div className="space-y-8">
      <FactoryManager />
      <DefectManager />
    </div>
  );
};

// --- Factory Management Component ---
const FactoryManager = () => {
  const [factories, setFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState(null);

  const fetchFactories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage`
      );
      setFactories(res.data);
    } catch (error) {
      console.error("Error fetching factories:", error);
      Swal.fire(
        "Error",
        "Could not fetch factory data. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  const filteredFactories = useMemo(() => {
    if (!filter) return factories;
    return factories.filter((f) => f._id === filter.value);
  }, [factories, filter]);

  const handleSave = async (factoryData) => {
    // Basic validation
    if (
      !factoryData.factory ||
      (factoryData.lineList || []).some((line) => !line.trim())
    ) {
      Swal.fire(
        "Validation Error",
        "Factory name and all Line Nos are required.",
        "warning"
      );
      return;
    }

    try {
      if (factoryData._id) {
        // Update
        await axios.put(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage/${factoryData._id}`,
          factoryData
        );
        Swal.fire("Success", "Factory updated successfully!", "success");
        setEditingId(null);
      } else {
        // Create
        await axios.post(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`,
          factoryData
        );
        Swal.fire("Success", "Factory added successfully!", "success");
        setIsAdding(false);
      }
      fetchFactories();
    } catch (error) {
      Swal.fire(
        "Save Failed",
        error.response?.data?.error || "An unexpected error occurred.",
        "error"
      );
    }
  };

  const handleDelete = async (factoryId, factoryName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${factoryName}". You won't be able to revert this!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage/${factoryId}`
        );
        Swal.fire("Deleted!", "The factory has been deleted.", "success");
        fetchFactories(); // Refresh the list
      } catch (error) {
        Swal.fire(
          "Delete Failed",
          error.response?.data?.error || "An unexpected error occurred.",
          "error"
        );
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <Factory size={24} /> Manage Factories
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            <PlusCircle size={18} /> Add Factory
          </button>
        )}
      </div>

      {isAdding && (
        <AddFactoryForm
          maxNo={Math.max(0, ...factories.map((f) => f.no))}
          onSave={handleSave}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* {isAdding && (
        <AddFactoryRow
          maxNo={Math.max(0, ...factories.map((f) => f.no))}
          onSave={handleSave}
          onCancel={() => setIsAdding(false)}
        />
      )} */}

      <h3 className="text-lg font-semibold text-gray-600 mt-6 mb-2">
        Modify Existing Sub Con Factories
      </h3>
      <div className="mb-4 max-w-sm">
        <Select
          options={factories.map((f) => ({ value: f._id, label: f.factory }))}
          value={filter}
          onChange={setFilter}
          isClearable
          placeholder="Filter by Factory Name..."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">No</th>
              <th className="px-4 py-2 text-left">Factory</th>
              <th className="px-4 py-2 text-left">Factory Second Name</th>
              <th className="px-4 py-2 text-center">No of Lines</th>
              <th className="px-4 py-2 text-left">Line List</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredFactories.map((factory) =>
                editingId === factory._id ? (
                  <EditFactoryRow
                    key={factory._id}
                    factoryData={factory}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={factory._id}>
                    <td className="border-t px-4 py-2">{factory.no}</td>
                    <td className="border-t px-4 py-2 font-medium">
                      {factory.factory}
                    </td>
                    <td className="border-t px-4 py-2">
                      {factory.factory_second_name}
                    </td>
                    <td className="border-t px-4 py-2 text-center">
                      {(factory.lineList || []).length}
                    </td>
                    <td className="border-t px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(factory.lineList || []).map((line, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-200 rounded text-xs"
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-t px-4 py-2 text-center">
                      <button
                        onClick={() => setEditingId(factory._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(factory._id, factory.factory)
                        }
                        className="text-red-600 hover:text-red-800 ml-3"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Row Component for Adding/Editing a Factory ---
const FactoryFormRow = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState(initialData);
  const lineInputRefs = useRef([]);

  const handleInputChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleLinesChange = (e) => {
    const numLines = Math.max(0, parseInt(e.target.value, 10) || 0);
    const newLineList = Array.from(
      { length: numLines },
      (_, i) => (data.lineList || [])[i] || ""
    );
    setData({ ...data, lineList: newLineList });
  };

  const handleLineValueChange = (index, value) => {
    const newLineList = [...(data.lineList || [])];
    newLineList[index] = value;
    setData({ ...data, lineList: newLineList });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight" && index < (data.lineList || []).length - 1) {
      lineInputRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      lineInputRefs.current[index - 1]?.focus();
    }
  };

  const addLine = () =>
    setData({ ...data, lineList: [...(data.lineList || []), ""] });
  const removeLine = (index) =>
    setData({
      ...data,
      lineList: (data.lineList || []).filter((_, i) => i !== index)
    });

  return (
    <tr>
      <td className="border-t px-4 py-2">{data.no}</td>
      <td className="border-t px-4 py-2">
        <input
          name="factory"
          value={data.factory}
          onChange={handleInputChange}
          className="w-full p-1 border rounded"
        />
      </td>
      <td className="border-t px-4 py-2">
        <input
          name="factory_second_name"
          value={data.factory_second_name}
          onChange={handleInputChange}
          className="w-full p-1 border rounded"
        />
      </td>
      <td className="border-t px-4 py-2 text-center">
        {initialData._id ? (
          <span>{(data.lineList || []).length}</span>
        ) : (
          <input
            type="number"
            value={(data.lineList || []).length}
            onChange={handleLinesChange}
            className="w-20 p-1 border rounded text-center"
          />
        )}
      </td>
      <td className="border-t px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {(data.lineList || []).map((line, index) => (
            <div key={index} className="relative">
              <input
                ref={(el) => (lineInputRefs.current[index] = el)}
                value={line}
                onChange={(e) => handleLineValueChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="p-1 border rounded w-24"
              />
              {initialData._id && (
                <button
                  onClick={() => removeLine(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {initialData._id && (
            <button
              onClick={addLine}
              className="bg-green-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </td>
      <td className="border-t px-4 py-2 text-center">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onSave(data)}
            className="text-green-600 hover:text-green-800"
          >
            <Save size={18} />
          </button>
          <button
            onClick={onCancel}
            className="text-red-600 hover:text-red-800"
          >
            <XCircle size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- NEW Add Factory Form with Labels ---
const AddFactoryForm = ({ maxNo, onSave, onCancel }) => {
  const initialData = {
    no: maxNo + 1,
    factory: "",
    factory_second_name: "",
    lineList: []
  };
  const [data, setData] = useState(initialData);

  const handleInputChange = (e) =>
    setData({ ...data, [e.target.name]: e.target.value });

  const handleLinesChange = (e) => {
    const numLines = Math.max(0, parseInt(e.target.value, 10) || 0);
    const newLineList = Array.from(
      { length: numLines },
      (_, i) => (data.lineList || [])[i] || ""
    );
    setData({ ...data, lineList: newLineList });
  };

  const handleLineValueChange = (index, value) => {
    const newLineList = [...(data.lineList || [])];
    newLineList[index] = value;
    setData({ ...data, lineList: newLineList });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 my-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Factory Name
          </label>
          <input
            name="factory"
            value={data.factory}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Factory Second Name
          </label>
          <input
            name="factory_second_name"
            value={data.factory_second_name}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            No of Lines
          </label>
          <input
            type="number"
            value={(data.lineList || []).length}
            onChange={handleLinesChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Line Nos
        </label>
        <div className="mt-2 flex flex-wrap gap-2 p-2 border rounded-md bg-white min-h-[40px]">
          {(data.lineList || []).map((line, index) => (
            <input
              key={index}
              value={line}
              onChange={(e) => handleLineValueChange(index, e.target.value)}
              className="p-1 border rounded w-24"
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(data)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Save Factory
        </button>
      </div>
    </div>
  );
};

const EditFactoryRow = ({ factoryData, onSave, onCancel }) => {
  return (
    <FactoryFormRow
      initialData={factoryData}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
};

// --- Defect Management Component ---
const DefectManager = () => {
  const [defects, setDefects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    DefectCode: "",
    DisplayCode: "",
    DefectNameEng: ""
  });

  const fetchDefects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Create a params object from filters, removing any empty values
      const params = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {});

      const res = await axios.get(`${API_BASE_URL}/api/subcon-defects-manage`, {
        params
      });
      setDefects(res.data);
    } catch (error) {
      console.error("Error fetching defects:", error);
      Swal.fire(
        "Error",
        "Could not fetch defect data. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]); // Re-fetch whenever filters change

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ DefectCode: "", DisplayCode: "", DefectNameEng: "" });
  };

  const handleSave = async (defectData) => {
    // Basic validation
    if (
      !defectData.DefectCode ||
      !defectData.DefectNameEng ||
      !defectData.DefectNameKhmer ||
      !defectData.DefectNameChi
    ) {
      Swal.fire(
        "Validation Error",
        "Defect Code and all three defect names are required.",
        "warning"
      );
      return;
    }

    try {
      if (defectData._id) {
        // Update an existing defect
        await axios.put(
          `${API_BASE_URL}/api/subcon-defects/${defectData._id}`,
          defectData
        );
        Swal.fire("Success", "Defect updated successfully!", "success");
        setEditingId(null);
      } else {
        // Create a new defect
        await axios.post(`${API_BASE_URL}/api/subcon-defects`, defectData);
        Swal.fire("Success", "Defect added successfully!", "success");
        setIsAdding(false);
      }
      fetchDefects(); // Refresh the data
    } catch (error) {
      Swal.fire(
        "Save Failed",
        error.response?.data?.error || "An unexpected error occurred.",
        "error"
      );
    }
  };

  const handleDelete = async (defectId, defectName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${defectName}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/subcon-defects-manage/${defectId}`
        );
        Swal.fire(
          "Deleted!",
          "The defect has been successfully deleted.",
          "success"
        );
        fetchDefects();
      } catch (error) {
        Swal.fire(
          "Delete Failed",
          error.response?.data?.error || "An unexpected error occurred.",
          "error"
        );
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <ListChecks size={24} /> Manage Defect Names
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            <PlusCircle size={18} /> Add New Defect
          </button>
        )}
      </div>

      {isAdding && (
        <AddDefectForm
          onSave={handleSave}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* --- Filter Pane --- */}
      <div className="flex flex-wrap items-end gap-4 p-4 my-4 bg-gray-50 rounded-lg border">
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-medium">Defect Code</label>
          <input
            name="DefectCode"
            value={filters.DefectCode}
            onChange={handleFilterChange}
            className="w-full mt-1 p-2 border rounded"
            placeholder="Filter by Defect Code..."
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-medium">Display Code</label>
          <input
            name="DisplayCode"
            value={filters.DisplayCode}
            onChange={handleFilterChange}
            className="w-full mt-1 p-2 border rounded"
            placeholder="Filter by Display Code..."
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium">Defect Name</label>
          <input
            name="DefectNameEng"
            value={filters.DefectNameEng}
            onChange={handleFilterChange}
            className="w-full mt-1 p-2 border rounded"
            placeholder="Filter by English Name..."
          />
        </div>
        <button
          onClick={clearFilters}
          className="p-2 bg-gray-300 rounded-md hover:bg-gray-400"
        >
          <XCircle size={20} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">No</th>
              <th className="px-4 py-2 text-left">Display Code</th>
              <th className="px-4 py-2 text-left">Defect Code</th>
              <th className="px-4 py-2 text-left">Defect Name (Eng)</th>
              <th className="px-4 py-2 text-left">Defect Name (Khmer)</th>
              <th className="px-4 py-2 text-left">Defect Name (Chi)</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              defects.map((defect) =>
                editingId === defect._id ? (
                  <EditDefectRow
                    key={defect._id}
                    defectData={defect}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={defect._id}>
                    <td className="border-t px-4 py-2">{defect.no}</td>
                    <td className="border-t px-4 py-2">{defect.DisplayCode}</td>
                    <td className="border-t px-4 py-2">{defect.DefectCode}</td>
                    <td className="border-t px-4 py-2 font-medium">
                      {defect.DefectNameEng}
                    </td>
                    <td className="border-t px-4 py-2">
                      {defect.DefectNameKhmer}
                    </td>
                    <td className="border-t px-4 py-2">
                      {defect.DefectNameChi}
                    </td>
                    <td className="border-t px-4 py-2 text-center">
                      <button
                        onClick={() => setEditingId(defect._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(defect._id, defect.DefectNameEng)
                        }
                        className="text-red-600 hover:text-red-800 ml-3"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Row Component for Adding/Editing a Defect ---
const DefectFormRow = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState(initialData);

  const handleInputChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <tr>
      <td className="border-t px-4 py-2">{data.no || ""}</td>
      <td className="border-t px-4 py-2">{data.DisplayCode || "(Auto)"}</td>
      <td className="border-t px-4 py-2">
        <input
          name="DefectCode"
          type="number"
          value={data.DefectCode}
          onChange={handleInputChange}
          className="w-full p-1 border rounded"
        />
      </td>
      <td className="border-t px-4 py-2">
        <input
          name="DefectNameEng"
          value={data.DefectNameEng}
          onChange={handleInputChange}
          className="w-full p-1 border rounded"
        />
      </td>
      <td className="border-t px-4 py-2">
        <input
          name="DefectNameKhmer"
          value={data.DefectNameKhmer}
          onChange={handleInputChange}
          className="w-full p-1 border rounded"
        />
      </td>
      <td className="border-t px-4 py-2">
        <input
          name="DefectNameChi"
          value={data.DefectNameChi}
          onChange={handleInputChange}
          className="w-full p-1 border rounded"
        />
      </td>
      <td className="border-t px-4 py-2 text-center">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onSave(data)}
            className="text-green-600 hover:text-green-800"
          >
            <Save size={18} />
          </button>
          <button
            onClick={onCancel}
            className="text-red-600 hover:text-red-800"
          >
            <XCircle size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const AddDefectForm = ({ onSave, onCancel }) => {
  const initialData = {
    DefectCode: "",
    DefectNameEng: "",
    DefectNameKhmer: "",
    DefectNameChi: ""
  };
  const [data, setData] = useState(initialData);
  const handleInputChange = (e) =>
    setData({ ...data, [e.target.name]: e.target.value });

  return (
    <div className="p-4 border rounded-lg bg-gray-50 my-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Defect Code
          </label>
          <input
            name="DefectCode"
            type="number"
            value={data.DefectCode}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Defect Name (Eng)
          </label>
          <input
            name="DefectNameEng"
            value={data.DefectNameEng}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Defect Name (Khmer)
          </label>
          <input
            name="DefectNameKhmer"
            value={data.DefectNameKhmer}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Defect Name (Chi)
          </label>
          <input
            name="DefectNameChi"
            value={data.DefectNameChi}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(data)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Save Defect
        </button>
      </div>
    </div>
  );
};

// Wrapper for the Edit Row
const EditDefectRow = ({ defectData, onSave, onCancel }) => {
  return (
    <DefectFormRow
      initialData={defectData}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
};

export default SubConQCManage;
