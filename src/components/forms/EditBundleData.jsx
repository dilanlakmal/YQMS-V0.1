import React, { useEffect, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from 'prop-types';
import { API_BASE_URL } from "../../../config";
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

const EditModal = ({ isOpen, onClose, formData, setFormData, setUserBatches, setEditModalOpen }) => {
  const {t} = useTranslation();
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
    // console.log('Available Sizes:', sizes); // Log the sizes data
    // console.log('Available Colors:', colors); // Log the colors data
  };

  const fetchSizes = async (selectedMono) => {
    try {
      console.log(`Fetching sizes for styleNo: ${selectedMono}`); // Log the selectedMono
      const response = await fetch(`${API_BASE_URL}/api/sizes?styleNo=${selectedMono}`);
      console.log('Sizes API Response:', response); // Log the full response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch sizes:', errorText);
        throw new Error('Failed to fetch sizes');
      }
      const data = await response.json();
      console.log('Sizes Data:', data); // Log the data
      return data.sizes;
    } catch (error) {
      console.error('Error fetching sizes:', error);
      return [];
    }
  };

  const fetchColors = async (selectedMono) => {
    try {
      console.log(`Fetching colors for styleNo: ${selectedMono}`); // Log the selectedMono
      const response = await fetch(`${API_BASE_URL}/api/colors?styleNo=${selectedMono}`);
      console.log('Colors API Response:', response); // Log the full response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch colors:', errorText);
        throw new Error('Failed to fetch colors');
      }
      const data = await response.json();
      console.log('Colors Data:', data); // Log the data
      return data.colors;
    } catch (error) {
      console.error('Error fetching colors:', error);
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
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Record updated successfully!',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update record.',
        });
      }
    } catch (error) {
      console.error("Error updating record:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update record.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-auto h-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-auto h-auto max-w-auto">
        <h2 className="text-2xl font-bold mb-4">{t("editBundle.edit_record")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t("bundle.order_details")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.selected_mono")}:</span> {formData.selectedMono}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.customer_style")}:</span> {formData.custStyle}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.buyer")}:</span> {formData.buyer}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.country")}:</span> {formData.country}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.order_qty")}:</span> {formData.orderQty}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.factory")}:</span> {formData.factoryInfo}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.date")}</label>
            <DatePicker
              selected={new Date(formData.date)}
              onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              dateFormat="yyyy-MM-dd"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.department")}</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              disabled
            >
              <option value="">{t("bundle.select_department")}</option>
              <option value="QC1 Endline">{t("bundle.qc1_endline")}</option>
              <option value="Washing">{t("home.washing")}</option>
              <option value="OPA">{t("home.opa")}</option>
              <option value="Sub-con">{t("bundle.sub_con")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.line_no")}</label>
            <input
              type="text"
              value={formData.lineNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, lineNo: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.color")}</label>
            <select
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="">{t("bundle.select_color")}</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.size")}</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="">{t("bundle.select_size")}</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.count")}</label>
            <input
              type="text"
              value={formData.count.toString()} // Ensure count is a string
              onChange={(e) => setFormData((prev) => ({ ...prev, count: e.target.value.toString() }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.bundle_qty")}</label>
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
           {t("editU.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            {t("editBundle.save")}
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
    count: PropTypes.string.isRequired, // Ensure count is a string
    bundleQty: PropTypes.string.isRequired,
    buyer: PropTypes.string.isRequired,
    orderQty: PropTypes.string.isRequired,
    factoryInfo: PropTypes.string.isRequired,
    custStyle: PropTypes.string.isRequired,
    selectedMono: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  setUserBatches: PropTypes.func.isRequired,
  setEditModalOpen: PropTypes.func.isRequired,
};

export default EditModal;
