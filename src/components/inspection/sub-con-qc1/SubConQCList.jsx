import axios from "axios";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";

const SubConQCList = () => {
  const [factories, setFactories] = useState([]);
  const [allQcs, setAllQcs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [qcId, setQcId] = useState("");
  const [qcName, setQcName] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQc, setEditingQc] = useState(null);

  // Filter state
  const [filterFactory, setFilterFactory] = useState(null);
  const [filterQcId, setFilterQcId] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [factoriesRes, qcsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/subcon-sewing-factories-manage`),
        axios.get(`${API_BASE_URL}/api/subcon-sewing-factories-manage/qcs/all`)
      ]);
      setFactories(
        factoriesRes.data.map((f) => ({ value: f._id, label: f.factory }))
      );
      setAllQcs(qcsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire("Error", "Failed to fetch data from the server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedFactory || !qcId || !qcName) {
      Swal.fire("Incomplete", "Please fill all fields.", "warning");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage/${selectedFactory.value}/qcs`,
        {
          qcID: qcId,
          qcName: qcName
        }
      );
      Swal.fire("Success", "New QC added successfully!", "success");
      // Reset form and refetch data
      setSelectedFactory(null);
      setQcId("");
      setQcName("");
      fetchData();
    } catch (error) {
      console.error("Error saving QC:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to add QC.",
        "error"
      );
    }
  };

  const handleEditClick = (qc) => {
    setEditingQc(qc);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage/qcs/${editingQc.qcMongoId}`,
        {
          qcID: editingQc.qcID,
          qcName: editingQc.qcName
        }
      );
      Swal.fire("Success", "QC updated successfully!", "success");
      setIsEditModalOpen(false);
      setEditingQc(null);
      fetchData();
    } catch (error) {
      console.error("Error updating QC:", error);
      Swal.fire("Error", "Failed to update QC.", "error");
    }
  };

  const handleDelete = (qc) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${qc.qcName} (${qc.qcID}). You won't be able to revert this!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/subcon-sewing-factories-manage/qcs/${qc.qcMongoId}`
          );
          Swal.fire("Deleted!", "The QC has been deleted.", "success");
          fetchData();
        } catch (error) {
          console.error("Error deleting QC:", error);
          Swal.fire("Error", "Failed to delete QC.", "error");
        }
      }
    });
  };

  const filteredQcs = useMemo(() => {
    return allQcs.filter((qc) => {
      const factoryMatch =
        !filterFactory || qc.factoryName === filterFactory.label;
      const qcIdMatch =
        !filterQcId || qc.qcID.toLowerCase().includes(filterQcId.toLowerCase());
      return factoryMatch && qcIdMatch;
    });
  }, [allQcs, filterFactory, filterQcId]);

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="mx-40 space-y-6">
      {/* Add New QC Card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Add New QC</h2>
        <form
          onSubmit={handleSave}
          className="grid grid-cols-4 gap-4 items-end"
        >
          <div className="md:col-span-1">
            <label className="block text-sm font-medium">Factory</label>
            <Select
              options={factories}
              value={selectedFactory}
              onChange={setSelectedFactory}
              styles={reactSelectStyles}
              placeholder="Select Factory..."
              isClearable
            />
          </div>
          <div>
            <label className="block text-sm font-medium">QC ID</label>
            <input
              type="text"
              value={qcId}
              onChange={(e) => setQcId(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">QC Name</label>
            <input
              type="text"
              value={qcName}
              onChange={(e) => setQcName(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
          >
            <PlusCircle size={18} /> Save QC
          </button>
        </form>
      </div>

      {/* Manage QC List Card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Manage QC List</h2>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            options={factories}
            value={filterFactory}
            onChange={setFilterFactory}
            styles={reactSelectStyles}
            placeholder="Filter by Factory..."
            isClearable
          />
          <input
            type="text"
            value={filterQcId}
            onChange={(e) => setFilterQcId(e.target.value)}
            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="Filter by QC ID..."
          />
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Factory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  QC ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  QC Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredQcs.map((qc) => (
                  <tr key={qc.qcMongoId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {qc.factoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{qc.qcID}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{qc.qcName}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleEditClick(qc)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(qc)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingQc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit QC</h3>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">QC ID</label>
                  <input
                    type="text"
                    value={editingQc.qcID}
                    onChange={(e) =>
                      setEditingQc({ ...editingQc, qcID: e.target.value })
                    }
                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">QC Name</label>
                  <input
                    type="text"
                    value={editingQc.qcName}
                    onChange={(e) =>
                      setEditingQc({ ...editingQc, qcName: e.target.value })
                    }
                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubConQCList;
