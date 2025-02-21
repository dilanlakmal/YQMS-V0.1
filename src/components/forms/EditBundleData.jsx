import React, { useEffect, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from 'prop-types';
import { API_BASE_URL } from "../../../config";

const EditModal = ({ isOpen, onClose, formData, setFormData, setUserBatches, setEditModalOpen }) => {
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);

  useEffect(() => {
    if (formData.selectedMono) {
      fetchAvailableSizesAndColors(formData.selectedMono);
    }
  }, [formData.selectedMono]);

  const fetchAvailableSizesAndColors = async (selectedMono) => {
    const sizes = await fetchSizes(selectedMono);
    const colors = await fetchColors(selectedMono);
    setAvailableSizes(sizes);
    setAvailableColors(colors);
  };

  const fetchSizes = async (selectedMono) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sizes?styleNo=${selectedMono}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sizes');
      }
      const data = await response.json();
      return data.sizes;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchColors = async (selectedMono) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/colors?styleNo=${selectedMono}`);
      if (!response.ok) {
        throw new Error('Failed to fetch colors');
      }
      const data = await response.json();
      return data.colors;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/update-bundle-data/${formData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const updatedRecord = await response.json();
        setUserBatches((prevBatches) =>
          prevBatches.map((batch) =>
            batch.id === formData.id ? updatedRecord : batch
          )
        );
        setEditModalOpen(false);
        alert("Record updated successfully!");
      } else {
        alert("Failed to update record.");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4">Edit Record</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Selected MONo:</span> {formData.selectedMono}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Customer Style:</span> {formData.custStyle}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Buyer:</span> {formData.buyer}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Country:</span> {formData.country}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Order Qty:</span> {formData.orderQty}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Factory:</span> {formData.factoryInfo}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              dateFormat="yyyy-MM-dd"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              disabled
            >
              <option value="">Select Department</option>
              <option value="QC1 Endline">QC1 Endline</option>
              <option value="Washing">Washing</option>
              <option value="Dyeing">Dyeing</option>
              <option value="Sub-con">Sub-con</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Line No</label>
            <input
              type="text"
              value={formData.lineNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, lineNo: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="">Select Color</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="">Select Size</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
            <input
              type="text"
              value={formData.count}
              onChange={(e) => setFormData((prev) => ({ ...prev, count: e.target.value.toString() }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Qty</label>
            <input
              type="text"
              value={formData.bundleQty}
              onChange={(e) => setFormData((prev) => ({ ...prev, bundleQty: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              readOnly
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

EditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    date: PropTypes.instanceOf(Date).isRequired,
    department: PropTypes.string.isRequired,
    lineNo: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    count: PropTypes.string.isRequired,
    bundleQty: PropTypes.string.isRequired,
    buyer: PropTypes.string.isRequired,
    orderQty: PropTypes.string.isRequired,
    factoryInfo: PropTypes.string.isRequired,
    custStyle: PropTypes.string.isRequired,
    selectedMono: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  setUserBatches: PropTypes.func.isRequired, // Add this prop
  setEditModalOpen: PropTypes.func.isRequired, // Add this prop
};

export default EditModal;
