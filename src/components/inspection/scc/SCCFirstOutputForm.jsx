import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import { Loader2, AlertCircle, Info } from "lucide-react"; // Added Info icon
import SCCImageUpload from "./SCCImageUpload";

const initialSpecState = {
  type: "", // 'first' or 'afterHat'
  method: "", // Will be set by formType
  timeSec: "",
  tempC: "",
  tempOffset: "0",
  pressure: "",
  status: "Pass",
  remarks: "" // Added remarks here
};

const SCCFirstOutputForm = ({
  formType,
  formData,
  onFormDataChange,
  onFormSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [existingRecordLoading, setExistingRecordLoading] = useState(false);
  const [recordStatusMessage, setRecordStatusMessage] = useState(""); // For "New record" message

  const moNoDropdownRef = useRef(null);
  const methodText =
    formType === "HT"
      ? t("scc.heatTransfer", "Heat Transfer")
      : t("scc.fusingMethod", "Fusing");

  useEffect(() => {
    if (
      !formData.standardSpecification ||
      formData.standardSpecification.length < 2
    ) {
      onFormDataChange({
        ...formData,
        standardSpecification: [
          {
            ...initialSpecState,
            type: "first",
            method: methodText,
            remarks: ""
          },
          {
            ...initialSpecState,
            type: "afterHat",
            method: methodText,
            remarks: ""
          }
        ]
      });
    } else {
      const updatedSpecs = formData.standardSpecification.map((spec) => ({
        ...spec,
        method: methodText,
        remarks: spec.remarks || "" // Ensure remarks field exists
      }));
      if (
        JSON.stringify(updatedSpecs) !==
        JSON.stringify(formData.standardSpecification)
      ) {
        onFormDataChange({ ...formData, standardSpecification: updatedSpecs });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, methodText, t]); // formData and onFormDataChange removed to prevent loops, methodText depends on t

  const fetchMoNumbers = useCallback(async () => {
    if (moNoSearch.trim() === "") {
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-mono`, {
        params: { term: moNoSearch }
      });
      setMoNoOptions(response.data || []);
      setShowMoNoDropdown(response.data.length > 0);
    } catch (error) {
      console.error(
        t("scc.errorFetchingMoLog", "Error fetching MO numbers:"),
        error
      );
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
    }
  }, [moNoSearch, t]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMoNumbers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, fetchMoNumbers]);

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo);
    onFormDataChange({
      ...formData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      _id: null,
      standardSpecification: [
        { ...initialSpecState, type: "first", method: methodText, remarks: "" },
        {
          ...initialSpecState,
          type: "afterHat",
          method: methodText,
          remarks: ""
        }
      ],
      referenceSampleImageFile: null,
      referenceSampleImageUrl: null,
      afterWashImageFile: null,
      afterWashImageUrl: null,
      remarks: ""
    });
    setShowMoNoDropdown(false);
    setRecordStatusMessage(""); // Clear message on new MO
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.moNo) {
        setAvailableColors([]);
        onFormDataChange({ ...formData, buyer: "", buyerStyle: "" });
        return;
      }
      setOrderDetailsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order-details/${formData.moNo}`
        );
        const details = response.data;
        onFormDataChange((prev) => ({
          // Use functional update to avoid stale state
          ...prev,
          buyer: details.engName || "N/A",
          buyerStyle: details.custStyle || "N/A"
        }));
        setAvailableColors(details.colors || []);
      } catch (error) {
        console.error(
          t(
            "scc.errorFetchingOrderDetailsLog",
            "Error fetching order details:"
          ),
          error
        );
        Swal.fire(
          t("scc.error"),
          t("scc.errorFetchingOrderDetails", "Failed to fetch order details."),
          "error"
        );
        onFormDataChange((prev) => ({ ...prev, buyer: "", buyerStyle: "" }));
        setAvailableColors([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    if (formData.moNo) fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.moNo, t]); // Added t

  useEffect(() => {
    const fetchExistingRecord = async () => {
      if (!formData.moNo || !formData.color || !formData.inspectionDate) return;

      setExistingRecordLoading(true);
      setRecordStatusMessage(""); // Clear previous message
      try {
        const endpoint =
          formType === "HT"
            ? "/api/scc/ht-first-output"
            : "/api/scc/fu-first-output";
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          params: {
            moNo: formData.moNo,
            color: formData.color,
            inspectionDate: formData.inspectionDate.toISOString()
          }
        });

        const recordData = response.data; // Backend now returns full response

        if (
          recordData.message === "HT_RECORD_NOT_FOUND" ||
          recordData.message === "FU_RECORD_NOT_FOUND" ||
          !recordData.data
        ) {
          setRecordStatusMessage(
            t(
              "scc.newRecordMessage",
              "This is a new record. Please proceed with data entry."
            )
          );
          onFormDataChange((prev) => ({
            ...prev,
            _id: null,
            standardSpecification: [
              {
                ...initialSpecState,
                type: "first",
                method: methodText,
                remarks: prev.standardSpecification?.[0]?.remarks || ""
              }, // Preserve remarks if user typed
              {
                ...initialSpecState,
                type: "afterHat",
                method: methodText,
                remarks: prev.standardSpecification?.[1]?.remarks || ""
              }
            ],
            referenceSampleImageUrl: null, // Reset images for new record
            afterWashImageUrl: null,
            remarks: prev.remarks || "" // Preserve main remarks
          }));
        } else {
          // Existing record found
          const mapSpecsForDisplay = (specs) =>
            specs.map((spec) => ({
              ...spec,
              tempOffset:
                spec.tempOffsetPlus !== 0
                  ? String(spec.tempOffsetPlus)
                  : spec.tempOffsetMinus !== 0
                  ? String(spec.tempOffsetMinus)
                  : "0",
              remarks: spec.remarks || "" // Ensure remarks is always a string
            }));
          setRecordStatusMessage(
            t("scc.existingRecordLoadedShort", "Existing record loaded.")
          );
          onFormDataChange((prev) => ({
            ...prev,
            _id: recordData._id || recordData.data._id, // Handle both direct object and nested
            standardSpecification: mapSpecsForDisplay(
              recordData.standardSpecification ||
                recordData.data.standardSpecification
            ),
            referenceSampleImageUrl:
              recordData.referenceSampleImage ||
              recordData.data.referenceSampleImage,
            afterWashImageUrl:
              recordData.afterWashImage || recordData.data.afterWashImage,
            remarks: recordData.remarks || recordData.data.remarks || ""
          }));
        }
      } catch (error) {
        console.error(
          t("scc.errorFetchingExistingLog", "Error fetching existing record:"),
          error
        );
        // Avoid Swal for "not found" like errors handled by message above
        if (
          !(
            error.response &&
            (error.response.data.message === "HT_RECORD_NOT_FOUND" ||
              error.response.data.message === "FU_RECORD_NOT_FOUND")
          )
        ) {
          Swal.fire(
            t("scc.error"),
            t("scc.errorFetchingExisting", "Failed to fetch existing record."),
            "error"
          );
        }
        onFormDataChange((prev) => ({
          // Reset to new record state on other errors
          ...prev,
          _id: null,
          standardSpecification: [
            {
              ...initialSpecState,
              type: "first",
              method: methodText,
              remarks: ""
            },
            {
              ...initialSpecState,
              type: "afterHat",
              method: methodText,
              remarks: ""
            }
          ],
          referenceSampleImageUrl: null,
          afterWashImageUrl: null,
          remarks: ""
        }));
      } finally {
        setExistingRecordLoading(false);
      }
    };

    if (formData.moNo && formData.color && formData.inspectionDate) {
      fetchExistingRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.moNo,
    formData.color,
    formData.inspectionDate,
    formType,
    methodText,
    t
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    onFormDataChange({ ...formData, inspectionDate: date });
  };

  const handleColorChange = (e) => {
    onFormDataChange({ ...formData, color: e.target.value, _id: null }); // Reset _id on color change
    setRecordStatusMessage("");
  };

  const handleSpecChange = (specIndex, field, value) => {
    const newSpecs = formData.standardSpecification
      ? [...formData.standardSpecification]
      : [initialSpecState, initialSpecState];
    if (!newSpecs[specIndex]) {
      // Initialize if spec doesn't exist (e.g. on first load)
      newSpecs[specIndex] = {
        ...initialSpecState,
        type: specIndex === 0 ? "first" : "afterHat",
        method: methodText
      };
    }
    newSpecs[specIndex] = { ...newSpecs[specIndex], [field]: value };
    onFormDataChange({ ...formData, standardSpecification: newSpecs });
  };

  const handleImageChange = (imageType, file, previewUrl) => {
    if (imageType === "referenceSample") {
      onFormDataChange({
        ...formData,
        referenceSampleImageFile: file,
        referenceSampleImageUrl: previewUrl
      });
    } else if (imageType === "afterWash") {
      onFormDataChange({
        ...formData,
        afterWashImageFile: file,
        afterWashImageUrl: previewUrl
      });
    }
  };

  const handleImageRemove = (imageType) => {
    if (imageType === "referenceSample") {
      onFormDataChange({
        ...formData,
        referenceSampleImageFile: null,
        referenceSampleImageUrl: null
      });
    } else if (imageType === "afterWash") {
      onFormDataChange({
        ...formData,
        afterWashImageFile: null,
        afterWashImageUrl: null
      });
    }
  };

  const firstSpecStatus = formData.standardSpecification?.[0]?.status;
  const isAfterHatDisabled = firstSpecStatus === "Pass";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return <div>{t("scc.loadingUser", "Loading user data...")}</div>;
  }

  const specs =
    formData.standardSpecification &&
    formData.standardSpecification.length === 2
      ? formData.standardSpecification
      : [
          {
            ...initialSpecState,
            type: "first",
            method: methodText,
            remarks: ""
          },
          {
            ...initialSpecState,
            type: "afterHat",
            method: methodText,
            remarks: ""
          }
        ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onFormSubmit(formType);
      }}
      className="space-y-6"
    >
      {(orderDetailsLoading || existingRecordLoading) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}
      {recordStatusMessage && (
        <div
          className={`p-3 mb-4 rounded-md text-sm flex items-center ${
            recordStatusMessage.includes(
              t("scc.newRecordMessageKey", "new record")
            )
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          <Info size={18} className="mr-2" />
          {recordStatusMessage}
        </div>
      )}
      {/* Row 1: Date, MO No */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="inspectionDate"
            className="block text-sm font-medium text-gray-700"
          >
            {t("scc.date", "Date")}
          </label>
          <DatePicker
            selected={
              formData.inspectionDate
                ? new Date(formData.inspectionDate)
                : new Date()
            }
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div className="relative" ref={moNoDropdownRef}>
          <label
            htmlFor="moNoSearch"
            className="block text-sm font-medium text-gray-700"
          >
            {t("scc.moNo", "MO No")}
          </label>
          <input
            type="text"
            id="moNoSearch"
            value={moNoSearch}
            onChange={(e) => setMoNoSearch(e.target.value)}
            placeholder={t("scc.searchMoNo", "Search MO No...")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          {showMoNoDropdown && moNoOptions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
              {moNoOptions.map((mo) => (
                <li
                  key={mo}
                  onClick={() => handleMoSelect(mo)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {mo}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Row 2: Buyer, Buyer Style, Color */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("scc.buyer", "Buyer")}
          </label>
          <input
            type="text"
            value={formData.buyer || ""}
            readOnly
            className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("scc.buyerStyle", "Buyer Style")}
          </label>
          <input
            type="text"
            value={formData.buyerStyle || ""}
            readOnly
            className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="color"
            className="block text-sm font-medium text-gray-700"
          >
            {t("scc.color", "Color")}
          </label>
          <select
            id="color"
            name="color"
            value={formData.color || ""}
            onChange={handleColorChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={!formData.moNo || availableColors.length === 0}
            required
          >
            <option value="">{t("scc.selectColor", "Select Color...")}</option>
            {availableColors.map((c) => (
              <option key={c.key || c.original} value={c.original}>
                {c.original} {c.chn ? `(${c.chn})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Standard Specifications Table */}
      <div className="mt-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {t("scc.standardSpecifications", "Standard Specifications")}
        </h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  {t("scc.parameter", "Parameter")}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  {t("scc.first", "First")}
                </th>
                <th
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    isAfterHatDisabled ? "text-gray-400" : ""
                  }`}
                >
                  {t("scc.afterHat", "After Hat")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                {
                  key: "method",
                  label: t("scc.method", "Method"),
                  type: "text",
                  readOnly: true
                },
                {
                  key: "timeSec",
                  label: t("scc.timeSec", "Time (sec)"),
                  type: "number",
                  inputMode: "numeric"
                },
                {
                  key: "tempC",
                  label: t("scc.tempC", "Temp (°C)"),
                  type: "number",
                  inputMode: "numeric"
                },
                {
                  key: "tempOffset",
                  label: t("scc.tempOffset", "Temp Offset (±)"),
                  type: "number",
                  inputMode: "numeric"
                },
                {
                  key: "pressure",
                  label: t("scc.pressure", "Pressure"),
                  type: "text"
                },
                {
                  key: "status",
                  label: t("scc.status", "Status"),
                  type: "select",
                  options: ["Pass", "Reject"]
                },
                {
                  key: "remarks",
                  label: t("scc.specRemarks", "Remarks"),
                  type: "textarea"
                } // New Row
              ].map(({ key, label, type, inputMode, readOnly, options }) => (
                <tr key={key}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                    {label}
                  </td>
                  {/* "First" column */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r">
                    {type === "select" ? (
                      <select
                        value={
                          specs[0]?.[key] || (key === "status" ? "Pass" : "")
                        }
                        onChange={(e) =>
                          handleSpecChange(0, key, e.target.value)
                        }
                        className="w-full p-1 border-gray-300 rounded-md text-sm"
                      >
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {t(`scc.${opt.toLowerCase()}`, opt)}
                          </option>
                        ))}
                      </select>
                    ) : type === "textarea" ? (
                      <textarea
                        value={specs[0]?.[key] || ""}
                        onChange={(e) =>
                          handleSpecChange(0, key, e.target.value)
                        }
                        rows="2"
                        className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                          readOnly ? "bg-gray-100" : ""
                        }`}
                        readOnly={readOnly}
                      />
                    ) : (
                      <input
                        type={type}
                        inputMode={inputMode || "text"}
                        value={specs[0]?.[key] || ""}
                        readOnly={readOnly}
                        onChange={(e) =>
                          handleSpecChange(0, key, e.target.value)
                        }
                        className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                          readOnly ? "bg-gray-100" : ""
                        }`}
                      />
                    )}
                  </td>
                  {/* "After Hat" column */}
                  <td
                    className={`px-4 py-2 whitespace-nowrap text-sm text-gray-500 ${
                      isAfterHatDisabled &&
                      key !== "method" &&
                      key !== "remarks"
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {key === "method" ||
                    (key === "status" && specs[1]) ||
                    (key === "remarks" && specs[1]) ? (
                      type === "select" ? (
                        <select
                          value={
                            specs[1]?.[key] || (key === "status" ? "Pass" : "")
                          }
                          onChange={(e) =>
                            handleSpecChange(1, key, e.target.value)
                          }
                          className="w-full p-1 border-gray-300 rounded-md text-sm"
                          disabled={
                            isAfterHatDisabled &&
                            key !== "method" &&
                            key !== "remarks"
                          }
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {t(`scc.${opt.toLowerCase()}`, opt)}
                            </option>
                          ))}
                        </select>
                      ) : type === "textarea" ? (
                        <textarea
                          value={specs[1]?.[key] || ""}
                          onChange={(e) =>
                            handleSpecChange(1, key, e.target.value)
                          }
                          rows="2"
                          className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                            readOnly ||
                            (isAfterHatDisabled &&
                              key !== "method" &&
                              key !== "remarks")
                              ? "bg-gray-100"
                              : ""
                          }`}
                          readOnly={
                            readOnly ||
                            (isAfterHatDisabled &&
                              key !== "method" &&
                              key !== "remarks")
                          }
                          disabled={
                            isAfterHatDisabled &&
                            key !== "method" &&
                            key !== "remarks"
                          }
                        />
                      ) : (
                        <input
                          type={type}
                          inputMode={inputMode || "text"}
                          value={specs[1]?.[key] || ""}
                          readOnly={
                            readOnly ||
                            (isAfterHatDisabled &&
                              key !== "method" &&
                              key !== "remarks")
                          }
                          onChange={(e) =>
                            handleSpecChange(1, key, e.target.value)
                          }
                          className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                            readOnly ||
                            (isAfterHatDisabled &&
                              key !== "method" &&
                              key !== "remarks")
                              ? "bg-gray-100"
                              : ""
                          }`}
                          disabled={
                            isAfterHatDisabled &&
                            key !== "method" &&
                            key !== "remarks"
                          }
                        />
                      )
                    ) : specs[1] ? (
                      <input
                        type={type}
                        inputMode={inputMode || "text"}
                        value={specs[1]?.[key] || ""}
                        readOnly={isAfterHatDisabled}
                        onChange={(e) =>
                          handleSpecChange(1, key, e.target.value)
                        }
                        className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                          isAfterHatDisabled ? "bg-gray-100" : ""
                        }`}
                        disabled={isAfterHatDisabled}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {firstSpecStatus === "Reject" && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {t("scc.hatIsRequired", "After Hat details are required.")}
            </p>
          )}
        </div>
      </div>

      {/* Image Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SCCImageUpload
          label={t("scc.referenceSample", "Reference Sample")}
          onImageChange={(file, url) =>
            handleImageChange("referenceSample", file, url)
          }
          onImageRemove={() => handleImageRemove("referenceSample")}
          initialImageUrl={formData.referenceSampleImageUrl}
          imageType="referenceSample"
        />
        <SCCImageUpload
          label={t("scc.afterWash", "After Wash")}
          onImageChange={(file, url) =>
            handleImageChange("afterWash", file, url)
          }
          onImageRemove={() => handleImageRemove("afterWash")}
          initialImageUrl={formData.afterWashImageUrl}
          imageType="afterWash"
        />
      </div>

      {/* Main Remarks */}
      <div className="mt-6">
        <label
          htmlFor="remarks"
          className="block text-sm font-medium text-gray-700"
        >
          {t("scc.mainRemarks", "Remarks")}
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows="3"
          maxLength="250"
          value={formData.remarks || ""}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={t("scc.remarksPlaceholder", "Enter remarks here...")}
        ></textarea>
        <p className="mt-1 text-xs text-gray-500 text-right">
          {(formData.remarks || "").length} / 250{" "}
          {t("scc.characters", "characters")}
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : null}
            {formData._id
              ? t("scc.update", "Update")
              : t("scc.submit", "Submit")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SCCFirstOutputForm;
