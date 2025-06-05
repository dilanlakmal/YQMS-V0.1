import React, { useEffect, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from 'prop-types';
import { API_BASE_URL } from "../../../config";
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { FaEye, FaEyeSlash } from "react-icons/fa";

const EditModal = ({ isOpen, onClose, formData, setFormData, setUserBatches, setEditModalOpen }) => {
  const { t } = useTranslation();
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [localFormData, setLocalFormData] = useState(formData);

  useEffect(() => {
 
    // Initialize local form data when the modal opens or formData prop changes
    setLocalFormData(formData);
  }, [formData, isOpen]);

  useEffect(() => {
    // Fetch color/size options when the modal is open and selectedMono is available
    // Use localFormData.selectedMono to ensure consistency within the modal
    if (isOpen && localFormData.selectedMono) {
      fetchAvailableSizesAndColors(localFormData.selectedMono);
    } else if (!isOpen) {
      // Reset options when modal closes
      setAvailableColors([]);
      setAvailableSizes([]);
    }
  }, [isOpen, localFormData.selectedMono]);

  const fetchAvailableSizesAndColors = async (selectedMono) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/order-details/${selectedMono}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const colors = data.colors.map((c) => c.original);
      const allSizes = Object.values(data.colorSizeMap).flatMap(
        (colorData) => colorData.sizes
      );
      const uniqueSizes = [...new Set(allSizes)];

      setAvailableColors(colors);
      setAvailableSizes(uniqueSizes);

    } catch (error) {
      console.error("Error fetching order details:", error);
      // Fallback to current form data's color/size if fetch fails, ensuring they are in the options
      setAvailableColors(localFormData.color ? [localFormData.color] : []);
      setAvailableSizes(localFormData.size ? [localFormData.size] : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/update-bundle-data/${localFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localFormData),
        }
      );
      if (response.ok) {
        const updatedRecord = await response.json();
        setUserBatches((prevBatches) =>
          prevBatches.map((batch) =>
             batch._id === localFormData.id ? { ...batch, ...updatedRecord.data } : batch
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

  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
  };
   const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-5xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          {t("editBundle.edit_record")}
        </h2>
        {loading && (
          <div className="text-center text-gray-500 mb-4">
            Loading sizes and colors...
          </div>
        )}

        {/* Order Details - Hidden on mobile with toggle, visible on laptop */}
        <div className="mb-4 md:mb-6 p-4 bg-blue-50 rounded-md">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2 md:mb-4">
              {t("bundle.order_details")}
            </h2>
            <button
              onClick={toggleOrderDetails}
              className="text-gray-500 hover:text-gray-700 md:hidden" // Hidden on md and above
            >
              {showOrderDetails ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className={`${showOrderDetails ? "block" : "hidden"} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.selected_mono")}:</span> {localFormData.selectedMono}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.customer_style")}:</span> {localFormData.custStyle}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.buyer")}:</span> {localFormData.buyer}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.country")}:</span> {localFormData.country}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.order_qty")}:</span> {localFormData.orderQty}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.factory")}:</span> {localFormData.factoryInfo}
                </p>
              </div>
            </div>
              {/* )} */}
          </div>
        </div>
       
        {/* <div className="grid grid-cols-3 md:grid-cols-4 gap-6 mb-6"> */}

        {/* Form Fields - Two columns on mobile, four on laptop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.date")}</label>
            <DatePicker
              selected={localFormData.date ? new Date(localFormData.date) : null}
              onChange={(date) => handleChange({ target: { name: 'date', value: date } })}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              dateFormat="yyyy-MM-dd"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.department")}</label>
            <select
              name="department"
              value={localFormData.department}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              disabled
            >
              <option value="">{t("bundle.select_department")}</option>
              <option value="Production">{t("bundle.production")}</option>
              <option value="Washing">{t("home.washing")}</option>
              <option value="OPA">{t("home.opa")}</option>
              <option value="Sub-con">{t("bundle.sub_con")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.line_no")}</label>
            <input
              name="lineNo"
              type="text"
              value={localFormData.lineNo}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.color")}</label>
            <select
              name="color" 
              value={localFormData.color || ''}
              onChange={handleChange}
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
              value={localFormData.size}
              onChange={handleChange}
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
              name="count"
              type="text"
              value={localFormData.count}
              onChange={handleChange}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bundle.bundle_qty")}</label>
            <input
              name="bundleQty"
              type="text"
              value={localFormData.bundleQty}
              onChange={handleChange}
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
    id: PropTypes.string, // Can be initially undefined if creating new
    _id: PropTypes.string, // From MongoDB
    date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    department: PropTypes.string,
    lineNo: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bundleQty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    buyer: PropTypes.string,
    orderQty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    factoryInfo: PropTypes.string,
    custStyle: PropTypes.string,
    selectedMono: PropTypes.string,
    country: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  setUserBatches: PropTypes.func.isRequired,
  setEditModalOpen: PropTypes.func.isRequired,
};

export default EditModal;
