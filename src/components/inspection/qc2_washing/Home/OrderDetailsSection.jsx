import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const OrderDetailsSection = ({
  formData,
  setFormData,
  handleInputChange,
  fetchOrderDetailsByStyle,
  colorOptions,
  subFactories,
  user,
  isVisible,
  onToggle,
  styleSuggestions,
  fetchMatchingStyles,
  setStyleSuggestions,
  orderNumbers,
  filterOrderNumbers,
  // filteredOrderNumbers,
  orderNoSuggestions,
  showOrderNoSuggestions,
  setShowOrderNoSuggestions,
  colorOrderQty,
  activateNextSection,
  setRecordId,
  setSavedSizes,
  onLoadSavedDataById
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const handleSave = async () => {
    try {
      // 1. Build the unique key for checking existing record
      const uniqueKey = {
        orderNo: formData.orderNo,
        date: formData.date,
        color: formData.color,
        washType: formData.washType,
        before_after_wash: formData.before_after_wash, // Washing Method
        factoryName: formData.factoryName,
        reportType: formData.reportType,
        inspector: {
          empId: user?.emp_id
        }
      };

      // 2. Check if a record already exists
      const checkRes = await fetch(
        `${API_BASE_URL}/api/qc-washing/find-existing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uniqueKey)
        }
      );
      const checkData = await checkRes.json();

      if (checkData.success && checkData.exists) {
        // 3. Prompt user: edit or cancel
        const result = await Swal.fire({
          icon: "info",
          title: "Order details already saved",
          text: "Do you want to edit the existing record?",
          showCancelButton: true,
          confirmButtonText: "Yes, edit",
          cancelButtonText: "No, cancel"
        });

        if (result.isConfirmed) {
          // 4. Load the existing record into the form (map as needed)
          const record = checkData.record;
          setFormData({
            ...formData,
            ...record // You may need to map fields if structure differs
          });
          setRecordId(record._id);
          setIsSaved(true);
          if (onLoadSavedDataById) onLoadSavedDataById(record._id);
          // Activate the next section
          if (activateNextSection) activateNextSection();

          Swal.fire({
            icon: "success",
            title: "Existing record loaded for editing.",
            showConfirmButton: false,
            timer: 1500,
            position: "top-end",
            toast: true
          });
          return;
        }
      }

      // 5. If not exists, proceed to save as new
      const saveData = {
        formData: {
          ...formData,
          colorOrderQty: colorOrderQty
        },
        userId: user?.emp_id,
        savedAt: new Date().toISOString()
      };

      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/orderData-save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveData)
        }
      );

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Data saved successfully!",
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
        setIsSaved(true);
        if (activateNextSection) activateNextSection();
        if (result.id && setRecordId) setRecordId(result.id);
      } else {
        Swal.fire({
          icon: "error",
          title: result.message || "Failed to save data",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to save data",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: "top-end",
        toast: true
      });
      console.error("Save error:", error);
    }
  };

  const handleOrderNoChange = (e) => {
    handleInputChange("orderNo", e.target.value);
    // Suggestions are fetched and visibility is set in parent's handleInputChange
  };

  const handleOrderNoBlur = () => {
    // A small delay to allow click on suggestion to register before hiding
    setTimeout(() => {
      setShowOrderNoSuggestions(false);
      fetchOrderDetailsByStyle(formData.orderNo); // Fetch details after selection or blur
    }, 150);
  };

  const handleOrderNoFocus = () => {
    // Show suggestions again if input is focused and there are suggestions
    if (orderNoSuggestions.length > 0) {
      setShowOrderNoSuggestions(true);
    }
  };

  const handleSuggestionClick = (selectedOrder) => {
    handleInputChange("orderNo", selectedOrder);
    fetchOrderDetailsByStyle(selectedOrder);
    setShowOrderNoSuggestions(false); // Hide suggestions immediately on click
  };
  // Load saved measurement sizes
  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/saved-sizes/${orderNo}/${color}`
      );

      if (!response.ok) {
        // setSavedSizes([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSavedSizes(data.savedSizes || []);
        // console.log("Loaded saved sizes:", data.savedSizes);
      }
    } catch (error) {
      console.error("Error loading saved sizes:", error);
      setSavedSizes([]);
    }
  };

  useEffect(() => {
    if (formData.orderNo && formData.color)
      loadSavedSizes(formData.orderNo, formData.color);
  }, [formData.orderNo, formData.color]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Order Details
        </h2>
        {/* <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button> */}
      </div>
      {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 dark:text-white">
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              MoNo:
            </label>
            <div className="relative flex-1">
              <input
                type="text"
                value={formData.orderNo}
                onChange={handleOrderNoChange}
                onBlur={handleOrderNoBlur}
                onFocus={handleOrderNoFocus}
                placeholder="Enter Order No to search"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isSaved}
              />
              {showOrderNoSuggestions &&
                formData.orderNo &&
                orderNoSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                    {orderNoSuggestions.map((order, index) => (
                      <li
                        key={index}
                        onMouseDown={() => handleSuggestionClick(order)}
                        className="px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                        disabled={isSaved}
                      >
                        {order}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Date:</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isSaved}
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">Order QTY:</label>
            <input
              type="number"
              value={formData.orderQty}
              onChange={(e) => handleInputChange("orderQty", e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              style={{ opacity: 1, color: "inherit" }}
              disabled={isSaved}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              Color:
            </label>
            <select
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isSaved}
            >
              <option value="">-- Select Color --</option>
              {colorOptions &&
                colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
            </select>
            {colorOrderQty !== null && (
              <span
                className="ml-2 flex items-center px-3 py-1 rounded-full font-semibold text-gray-800 bg-yellow-100 border border-yellow-300 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-600"
                style={{ minWidth: 60 }}
                title="Total order quantity for selected color"
              >
                <span className="mr-1 text-xs font-medium text-gray-600 dark:text-yellow-50">
                  Color Qty:
                </span>
                {colorOrderQty}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              Washing Type:
            </label>
            <select
              value={formData.washType}
              onChange={(e) => handleInputChange("washType", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isSaved}
            >
              <option value="Normal Wash">Normal Wash</option>
              <option value="Acid Wash">Acid Wash</option>
              <option value="Garment Dye">Garment Dye</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              Inspection Report:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={
                    formData.firstOutput === true ||
                    formData.firstOutput === "First Output"
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "firstOutput",
                      e.target.checked ? "First Output" : ""
                    )
                  }
                  className="mr-2 dark:bg-gray-700 dark:checked:bg-indigo-500 dark:border-gray-600 dark:text-white"
                  disabled={isSaved}
                />
                First Output
              </label>
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={
                    formData.inline === true || formData.inline === "Inline"
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "inline",
                      e.target.checked ? "Inline" : ""
                    )
                  }
                  className="mr-2 dark:bg-gray-700 dark:checked:bg-indigo-500 dark:border-gray-600 dark:text-white"
                  disabled={isSaved}
                />
                Inline
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              Buyer:
            </label>
            <input
              type="text"
              value={formData.buyer}
              onChange={(e) => handleInputChange("buyer", e.target.value)}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white cursor-not-allowed"
              style={{ opacity: 1, color: "inherit" }}
              disabled={isSaved}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              Factory Name:
            </label>
            <select
              value={formData.factoryName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  factoryName: e.target.value
                }))
              }
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              disabled={isSaved}
            >
              {subFactories.map((factory) => (
                <option key={factory} value={factory}>
                  {factory}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium">
              Befor/After Wash:
            </label>
            <select
              value={formData.before_after_wash || "Before Wash"}
              onChange={(e) =>
                handleInputChange("before_after_wash", e.target.value)
              }
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              disabled={isSaved}
            >
              <option value="Before Wash">Before Wash</option>
              <option value="After Wash">After Wash</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="w-20 text-sm font-medium dark:text-gray-300">
              Estimate Wash Qty:
            </label>
            <input
              type="number"
              value={formData.washQty}
              onChange={(e) => handleInputChange("washQty", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min={0}
              disabled={isSaved}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          onClick={handleSave}
          disabled={isSaved}
        >
          Save
        </button>
      </div>
    </div>
  );
};
OrderDetailsSection.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  fetchOrderDetailsByStyle: PropTypes.func.isRequired,
  colorOptions: PropTypes.array,
  subFactories: PropTypes.array,
  user: PropTypes.object,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
  styleSuggestions: PropTypes.array,
  fetchMatchingStyles: PropTypes.func,
  setStyleSuggestions: PropTypes.func,
  orderNumbers: PropTypes.array,
  filterOrderNumbers: PropTypes.func,
  orderNoSuggestions: PropTypes.array,
  showOrderNoSuggestions: PropTypes.bool,
  setShowOrderNoSuggestions: PropTypes.func,
  colorOrderQty: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  activateNextSection: PropTypes.func,
  setRecordId: PropTypes.func,
  setSavedSizes: PropTypes.func,
  onLoadSavedDataById: PropTypes.func
};

export default OrderDetailsSection;
