import axios from "axios";
import {
  Check,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Lock,
  MapPin
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

// Array of product names that have restricted editing/deleting
const RESTRICTED_TYPES = [
  "Bottom",
  "Dress",
  "Top",
  "Top Layer",
  "Zipper Jacket"
];

const YPivotQASectionsLocationManagement = () => {
  // Main data state
  const [productTypes, setProductTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for managing Product Types
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProductTypeId, setEditingProductTypeId] = useState(null);
  const [newProductTypeData, setNewProductTypeData] = useState({
    EnglishProductName: "",
    KhmerProductName: "",
    ChineseProductName: ""
  });
  const [editProductTypeData, setEditProductTypeData] = useState({
    EnglishProductName: "",
    KhmerProductName: "",
    ChineseProductName: ""
  });

  // State for managing Product Locations
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [selectedProductIdForNewLocation, setSelectedProductIdForNewLocation] =
    useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [editLocationName, setEditLocationName] = useState("");

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-type`
      );
      if (response.data.success) {
        setProductTypes(response.data.data);
      }
    } catch (error) {
      Swal.fire("Error", "Failed to load Product Types", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- PRODUCT TYPE CRUD ---
  const handleSaveNewProductType = async () => {
    if (!newProductTypeData.EnglishProductName.trim()) {
      Swal.fire(
        "Validation Error",
        "English Product Name is required.",
        "warning"
      );
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/qa-sections-product-type`,
        newProductTypeData
      );
      Swal.fire("Success", "Product Type created successfully!", "success");
      fetchProductTypes();
      setIsAddProductModalOpen(false);
      setNewProductTypeData({
        EnglishProductName: "",
        KhmerProductName: "",
        ChineseProductName: ""
      });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create Product Type.",
        "error"
      );
    }
  };

  const handleEditProductType = (product) => {
    setEditingProductTypeId(product._id);
    setEditProductTypeData({
      EnglishProductName: product.EnglishProductName,
      KhmerProductName: product.KhmerProductName,
      ChineseProductName: product.ChineseProductName
    });
  };

  const handleSaveEditProductType = async (id) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/qa-sections-product-type/${id}`,
        editProductTypeData
      );
      Swal.fire("Success", "Product Type updated successfully!", "success");
      fetchProductTypes();
      setEditingProductTypeId(null);
    } catch (error) {
      Swal.fire("Error", "Failed to update Product Type.", "error");
    }
  };

  const handleDeleteProductType = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}"? This is permanent.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/qa-sections-product-type/${id}`
        );
        Swal.fire("Deleted!", "Product Type has been deleted.", "success");
        fetchProductTypes();
      } catch (error) {
        Swal.fire("Error", "Failed to delete Product Type.", "error");
      }
    }
  };

  // --- PRODUCT LOCATION CRUD ---
  const handleSaveNewLocation = async () => {
    if (!selectedProductIdForNewLocation || !newLocationName.trim()) {
      Swal.fire(
        "Validation Error",
        "Please select a product and enter a location name.",
        "warning"
      );
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/qa-sections-product-type/${selectedProductIdForNewLocation}/locations`,
        { Name: newLocationName }
      );
      Swal.fire("Success", "Location added successfully!", "success");
      fetchProductTypes();
      setIsAddLocationModalOpen(false);
      setNewLocationName("");
      setSelectedProductIdForNewLocation("");
    } catch (error) {
      Swal.fire("Error", "Failed to add location.", "error");
    }
  };

  const handleEditLocation = (location) => {
    setEditingLocationId(location._id);
    setEditLocationName(location.Name);
  };

  const handleSaveEditLocation = async (productId, locationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/qa-sections-product-type/${productId}/locations/${locationId}`,
        { Name: editLocationName }
      );
      Swal.fire("Success", "Location updated successfully!", "success");
      fetchProductTypes();
      setEditingLocationId(null);
    } catch (error) {
      Swal.fire("Error", "Failed to update location.", "error");
    }
  };

  const handleDeleteLocation = async (productId, locationId, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete the location "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/qa-sections-product-type/${productId}/locations/${locationId}`
        );
        Swal.fire("Deleted!", "Location has been deleted.", "success");
        fetchProductTypes();
      } catch (error) {
        Swal.fire("Error", "Failed to delete location.", "error");
      }
    }
  };

  if (isLoading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Manage Product Types */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Manage Product Types
          </h2>
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md"
          >
            <Plus size={18} /> Add New Product Type
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Head */}
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  English Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  Khmer Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  Chinese Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {productTypes.map((pt) => {
                const isRestricted = RESTRICTED_TYPES.includes(
                  pt.EnglishProductName
                );
                const isEditing = editingProductTypeId === pt._id;
                return (
                  <tr key={pt._id}>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {pt.no}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editProductTypeData.EnglishProductName}
                          readOnly={isRestricted}
                          onChange={(e) =>
                            setEditProductTypeData({
                              ...editProductTypeData,
                              EnglishProductName: e.target.value
                            })
                          }
                          className={`w-full p-2 rounded-md border-2 ${
                            isRestricted
                              ? "bg-gray-100 cursor-not-allowed"
                              : "border-indigo-300"
                          }`}
                        />
                      ) : (
                        <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                          {isRestricted && (
                            <Lock
                              size={14}
                              className="text-amber-500"
                              title="This is a system default and cannot be fully modified or deleted."
                            />
                          )}
                          {pt.EnglishProductName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editProductTypeData.KhmerProductName}
                          onChange={(e) =>
                            setEditProductTypeData({
                              ...editProductTypeData,
                              KhmerProductName: e.target.value
                            })
                          }
                          className="w-full p-2 rounded-md border-2 border-indigo-300"
                        />
                      ) : (
                        pt.KhmerProductName
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editProductTypeData.ChineseProductName}
                          onChange={(e) =>
                            setEditProductTypeData({
                              ...editProductTypeData,
                              ChineseProductName: e.target.value
                            })
                          }
                          className="w-full p-2 rounded-md border-2 border-indigo-300"
                        />
                      ) : (
                        pt.ChineseProductName
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEditProductType(pt._id)}
                              title="Save"
                            >
                              <Save size={18} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => setEditingProductTypeId(null)}
                              title="Cancel"
                            >
                              <X size={18} className="text-gray-500" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditProductType(pt)}
                              title="Edit"
                            >
                              <Edit2 size={18} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProductType(
                                  pt._id,
                                  pt.EnglishProductName
                                )
                              }
                              disabled={isRestricted}
                              title={
                                isRestricted
                                  ? "Cannot delete system default"
                                  : "Delete"
                              }
                            >
                              <Trash2
                                size={18}
                                className={
                                  isRestricted
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-600"
                                }
                              />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Manage Product Locations */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Manage Product Locations
          </h2>
          <button
            onClick={() => setIsAddLocationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 shadow-md"
          >
            <Plus size={18} /> Add New Location
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productTypes.map((pt) => (
            <div
              key={pt._id}
              className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50"
            >
              <h3 className="text-md font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 p-3 flex items-center gap-2">
                <MapPin size={16} /> {pt.EnglishProductName}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {pt.ProductLocation.map((loc) => (
                    <tr key={loc._id} className="border-b dark:border-gray-700">
                      <td className="p-2 text-center w-10 font-mono text-gray-500">
                        {loc.No}
                      </td>
                      <td className="p-2">
                        {editingLocationId === loc._id ? (
                          <input
                            type="text"
                            value={editLocationName}
                            onChange={(e) =>
                              setEditLocationName(e.target.value)
                            }
                            className="w-full p-1 rounded border-indigo-400 border-2"
                          />
                        ) : (
                          <span className="text-gray-800 dark:text-gray-200">
                            {loc.Name}
                          </span>
                        )}
                      </td>
                      <td className="p-2 w-24">
                        <div className="flex items-center justify-center gap-2">
                          {editingLocationId === loc._id ? (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveEditLocation(pt._id, loc._id)
                                }
                                title="Save"
                              >
                                <Save size={16} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => setEditingLocationId(null)}
                                title="Cancel"
                              >
                                <X size={16} className="text-gray-500" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditLocation(loc)}
                                title="Edit"
                              >
                                <Edit2 size={16} className="text-blue-600" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteLocation(
                                    pt._id,
                                    loc._id,
                                    loc.Name
                                  )
                                }
                                title="Delete"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pt.ProductLocation.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-4 text-center text-xs text-gray-400"
                      >
                        No locations added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Add New Product Type</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="English Name*"
                value={newProductTypeData.EnglishProductName}
                onChange={(e) =>
                  setNewProductTypeData({
                    ...newProductTypeData,
                    EnglishProductName: e.target.value
                  })
                }
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Khmer Name"
                value={newProductTypeData.KhmerProductName}
                onChange={(e) =>
                  setNewProductTypeData({
                    ...newProductTypeData,
                    KhmerProductName: e.target.value
                  })
                }
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Chinese Name"
                value={newProductTypeData.ChineseProductName}
                onChange={(e) =>
                  setNewProductTypeData({
                    ...newProductTypeData,
                    ChineseProductName: e.target.value
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewProductType}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddLocationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Add New Product Location</h3>
            <div className="space-y-4">
              <select
                value={selectedProductIdForNewLocation}
                onChange={(e) =>
                  setSelectedProductIdForNewLocation(e.target.value)
                }
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Product Type --</option>
                {productTypes.map((pt) => (
                  <option key={pt._id} value={pt._id}>
                    {pt.EnglishProductName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="New Location Name*"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddLocationModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewLocation}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQASectionsLocationManagement;
