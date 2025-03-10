import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import Eye icons
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../config";

const EditModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  setUserBatches,
  setEditModalOpen,
}) => {
  const { t } = useTranslation();
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false); // For mobile toggle

  useEffect(() => {
    if (isOpen && formData.selectedMono) {
      fetchAvailableSizesAndColors(formData.selectedMono);
    }
  }, [isOpen, formData.selectedMono]);

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

      console.log("Fetched Colors:", colors);
      console.log("Fetched Sizes:", uniqueSizes);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setAvailableColors([formData.color].filter(Boolean));
      setAvailableSizes([formData.size].filter(Boolean));
    } finally {
      setLoading(false);
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
            batch._id === formData.id ? updatedRecord : batch
          )
        );
        setEditModalOpen(false);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Record updated successfully!",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update record.",
        });
      }
    } catch (error) {
      console.error("Error updating record:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update record.",
      });
    }
  };

  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
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
                  <span className="font-bold">
                    {t("bundle.selected_mono")}:
                  </span>{" "}
                  {formData.selectedMono}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">
                    {t("bundle.customer_style")}:
                  </span>{" "}
                  {formData.custStyle}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.buyer")}:</span>{" "}
                  {formData.buyer}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.country")}:</span>{" "}
                  {formData.country}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.order_qty")}:</span>{" "}
                  {formData.orderQty}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{t("bundle.factory")}:</span>{" "}
                  {formData.factoryInfo}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields - Two columns on mobile, four on laptop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.date")}
            </label>
            <DatePicker
              selected={new Date(formData.date)}
              onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              dateFormat="yyyy-MM-dd"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.department")}
            </label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, department: e.target.value }))
              }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.line_no")}
            </label>
            <input
              type="text"
              value={formData.lineNo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lineNo: e.target.value }))
              }
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.color")}
            </label>
            <select
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="">{t("bundle.select_color")}</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.size")}
            </label>
            <select
              value={formData.size}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, size: e.target.value }))
              }
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="">{t("bundle.select_size")}</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.count")}
            </label>
            <input
              type="text"
              value={formData.count.toString()}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  count: e.target.value.toString(),
                }))
              }
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.bundle_qty")}
            </label>
            <input
              type="text"
              value={formData.bundleQty}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bundleQty: e.target.value }))
              }
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
  setUserBatches: PropTypes.func.isRequired,
  setEditModalOpen: PropTypes.func.isRequired,
};

export default EditModal;
