import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import {
  PlusCircle,
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const FactoryManager = () => {
  const { t } = useTranslation();
  const [factories, setFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editRowId, setEditRowId] = useState(null);
  const [editedFactory, setEditedFactory] = useState({});
  const [newFactory, setNewFactory] = useState({ no: "", factory: "" });
  const [isSaving, setIsSaving] = useState(null);
  const [showSection, setShowSection] = useState(true);

  const fetchFactories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subcon-factories`);
      setFactories(response.data);
    } catch (error) {
      console.error("Error fetching factories:", error);
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: t("qc2defects.factory.fetchError")
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  const handleInputChange = (e, field, id = null) => {
    const { value } = e.target;
    if (id) {
      setEditedFactory((prev) => ({ ...prev, [field]: value }));
    } else {
      setNewFactory((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddNew = async () => {
    if (!newFactory.no || !newFactory.factory) {
      Swal.fire({
        icon: "warning",
        title: t("common.missingInfo"),
        text: t("qc2defects.factory.validationError")
      });
      return;
    }
    setIsSaving("new");
    try {
      await axios.post(`${API_BASE_URL}/api/subcon-factories`, newFactory);
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: t("qc2defects.factory.addSuccess")
      });
      setNewFactory({ no: "", factory: "" });
      fetchFactories();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error.response?.data?.message || t("qc2defects.factory.addFail")
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleSave = async (id) => {
    setIsSaving(id);
    try {
      await axios.put(
        `${API_BASE_URL}/api/subcon-factories/${id}`,
        editedFactory
      );
      Swal.fire({
        icon: "success",
        title: t("common.success"),
        text: t("qc2defects.factory.updateSuccess")
      });
      setEditRowId(null);
      fetchFactories();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text:
          error.response?.data?.message || t("qc2defects.factory.updateFail")
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: t("common.confirmDeleteTitle"),
      text: t("common.confirmDeleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("common.yesDelete"),
      cancelButtonText: t("common.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSaving(id);
        try {
          await axios.delete(`${API_BASE_URL}/api/subcon-factories/${id}`);
          Swal.fire(
            t("common.deleted"),
            t("qc2defects.factory.deleteSuccess"),
            "success"
          );
          fetchFactories();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text:
              error.response?.data?.message ||
              t("qc2defects.factory.deleteFail")
          });
        } finally {
          setIsSaving(null);
        }
      }
    });
  };

  return (
    <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <div
        className="flex justify-between items-center mb-4 cursor-pointer"
        onClick={() => setShowSection(!showSection)}
      >
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          {t("qc2defects.factory.manageTitle")}{" "}
          {showSection ? (
            <ChevronUp size={20} className="ml-2" />
          ) : (
            <ChevronDown size={20} className="ml-2" />
          )}
        </h2>
      </div>
      {showSection && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg bg-slate-50">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("qc2defects.factory.no")}
              </label>
              <input
                type="number"
                value={newFactory.no}
                onChange={(e) => handleInputChange(e, "no")}
                className="mt-1 block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("qc2defects.factory.name")}
              </label>
              <input
                type="text"
                value={newFactory.factory}
                onChange={(e) => handleInputChange(e, "factory")}
                className="mt-1 block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddNew}
                disabled={isSaving}
                className="flex items-center w-full justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isSaving === "new" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <PlusCircle size={18} className="mr-2" />
                )}
                {t("common.add")}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-60">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("qc2defects.factory.no")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("qc2defects.factory.name")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : (
                  factories.map((f) => (
                    <tr key={f._id}>
                      {editRowId === f._id ? (
                        <>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              value={editedFactory.no}
                              onChange={(e) =>
                                handleInputChange(e, "no", f._id)
                              }
                              className="w-20 text-sm rounded-md border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              value={editedFactory.factory}
                              onChange={(e) =>
                                handleInputChange(e, "factory", f._id)
                              }
                              className="w-full text-sm rounded-md border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleSave(f._id)}
                              disabled={isSaving === f._id}
                              className="p-1.5 text-green-600 hover:text-green-800"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setEditRowId(null)}
                              className="p-1.5 text-gray-600 hover:text-gray-800"
                            >
                              <XCircle size={18} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                            {f.no}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                            {f.factory}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                setEditRowId(f._id);
                                setEditedFactory(f);
                              }}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(f._id)}
                              disabled={isSaving === f._id}
                              className="p-1.5 text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FactoryManager;
