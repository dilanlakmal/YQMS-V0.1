import axios from "axios";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config"; // Adjust path as needed
import {
  Search,
  XCircle,
  Loader2,
  Trash2,
  AlertTriangle,
  FileX,
  Info,
  ChevronDown
} from "lucide-react";

const CuttingInspectionManage = () => {
  const { t } = useTranslation();
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [selectedMoNo, setSelectedMoNo] = useState("");
  const moNoDropdownRef = useRef(null);

  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [selectedTableNo, setSelectedTableNo] = useState("");
  const tableNoDropdownRef = useRef(null);

  const [inspectionRecord, setInspectionRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState({ record: false, size: null }); // To track specific deletions

  const inputNormalStyle =
    "block w-full text-sm rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3";
  const inputDisabledStyle =
    "block w-full text-sm rounded-md shadow-sm bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500 py-2.5 px-3";

  // Fetch MO Numbers for search
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
          { params: { search: moNoSearch } }
        );
        setMoNoOptions(response.data || []);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error(
          "Error fetching MO numbers for cutting inspection:",
          error
        );
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchMoNumbers, 300);
    return () => clearTimeout(debounceFetch);
  }, [moNoSearch]);

  // Fetch Table Numbers for search (filtered by selectedMoNo)
  useEffect(() => {
    const fetchTableNumbers = async () => {
      if (!selectedMoNo || tableNoSearch.trim() === "") {
        setTableNoOptions([]);
        setShowTableNoDropdown(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
          { params: { moNo: selectedMoNo, search: tableNoSearch } }
        );
        setTableNoOptions(response.data || []);
        setShowTableNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error(
          "Error fetching Table numbers for cutting inspection:",
          error
        );
        setTableNoOptions([]);
        setShowTableNoDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchTableNumbers, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedMoNo, tableNoSearch]);

  // Fetch Inspection Record when MO and Table No are selected
  const fetchInspectionRecordDetails = useCallback(async () => {
    if (!selectedMoNo || !selectedTableNo) {
      setInspectionRecord(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspection-details-for-manage`,
        {
          // New endpoint needed
          params: { moNo: selectedMoNo, tableNo: selectedTableNo }
        }
      );
      setInspectionRecord(response.data);
    } catch (error) {
      console.error("Error fetching inspection record details:", error);
      setInspectionRecord(null);
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "info",
          title: t("cuttingReport.notFoundTitle"),
          text: t("cuttingReport.noRecordFoundForMoTable")
        });
      } else {
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text: t("cuttingReport.failedToFetchRecord")
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedMoNo, selectedTableNo, t]);

  useEffect(() => {
    if (selectedMoNo && selectedTableNo) {
      fetchInspectionRecordDetails();
    } else {
      setInspectionRecord(null); // Clear record if MO or Table No is deselected
    }
  }, [selectedMoNo, selectedTableNo, fetchInspectionRecordDetails]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteEntireRecord = async () => {
    if (!inspectionRecord || !inspectionRecord._id) return;

    Swal.fire({
      title: t(
        "cuttingReport.confirmDeleteEntireTitle",
        "Delete Entire Record?"
      ),
      text: t(
        "cuttingReport.confirmDeleteEntireMsg",
        "This will permanently delete the entire inspection record and cannot be undone. Are you sure?"
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("cutting.yesDeleteIt"),
      cancelButtonText: t("cutting.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting((prev) => ({ ...prev, record: true }));
        try {
          await axios.delete(
            `${API_BASE_URL}/api/cutting-inspection-record/${inspectionRecord._id}`
          ); // New Endpoint
          Swal.fire({
            icon: "success",
            title: t("cutting.deleted"),
            text: t("cuttingReport.recordDeletedSuccess")
          });
          setInspectionRecord(null);
          setSelectedMoNo("");
          setMoNoSearch("");
          setSelectedTableNo("");
          setTableNoSearch("");
        } catch (error) {
          console.error("Error deleting entire record:", error);
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text:
              error.response?.data?.message ||
              t("cuttingReport.failedToDeleteRecord")
          });
        } finally {
          setIsDeleting((prev) => ({ ...prev, record: false }));
        }
      }
    });
  };

  const handleDeleteSpecificSize = async (inspectedSizeToDelete) => {
    if (!inspectionRecord || !inspectionRecord._id || !inspectedSizeToDelete)
      return;

    Swal.fire({
      title: t("cuttingReport.confirmDeleteSizeTitle", "Delete This Size?"),
      text: t(
        "cuttingReport.confirmDeleteSizeMsg",
        `This will delete all inspection data for size '${inspectedSizeToDelete}' from this record. Are you sure?`
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("cutting.yesDeleteIt"),
      cancelButtonText: t("cutting.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting((prev) => ({ ...prev, size: inspectedSizeToDelete }));
        try {
          await axios.delete(
            `${API_BASE_URL}/api/cutting-inspection-record/${inspectionRecord._id}/size/${inspectedSizeToDelete}`
          ); // New Endpoint
          Swal.fire({
            icon: "success",
            title: t("cutting.deleted"),
            text: t(
              "cuttingReport.sizeDataDeletedSuccess",
              `Inspection data for size ${inspectedSizeToDelete} deleted.`
            )
          });
          fetchInspectionRecordDetails(); // Re-fetch to update the displayed record
        } catch (error) {
          console.error(`Error deleting size ${inspectedSizeToDelete}:`, error);
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text:
              error.response?.data?.message ||
              t(
                "cuttingReport.failedToDeleteSizeData",
                `Failed to delete data for size ${inspectedSizeToDelete}.`
              )
          });
        } finally {
          setIsDeleting((prev) => ({ ...prev, size: null }));
        }
      }
    });
  };

  const resetFilters = () => {
    setMoNoSearch("");
    setSelectedMoNo("");
    setTableNoSearch("");
    setSelectedTableNo("");
    setInspectionRecord(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">
        {t("cuttingReport.manageTitle", "Manage Cutting Inspection Reports")}
      </h1>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-8 items-end">
        {/* MO No Search */}
        <div className="space-y-1">
          <label
            htmlFor="moNoSearchManage"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.moNo")}
          </label>
          <div className="relative" ref={moNoDropdownRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isLoading && !selectedMoNo ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="moNoSearchManage"
                type="text"
                value={moNoSearch}
                onChange={(e) => {
                  setMoNoSearch(e.target.value);
                  setSelectedMoNo("");
                  setSelectedTableNo("");
                  setTableNoSearch("");
                  setInspectionRecord(null);
                }}
                onFocus={() =>
                  moNoOptions.length > 0 && setShowMoNoDropdown(true)
                }
                placeholder={t("cutting.search_mono_placeholder")}
                className={`${inputNormalStyle} pl-10 py-2.5`}
              />
              {moNoSearch && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t("cutting.clearSearch")}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {moNoOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSelectedMoNo(option);
                      setMoNoSearch(option);
                      setShowMoNoDropdown(false);
                      setSelectedTableNo("");
                      setTableNoSearch("");
                      setInspectionRecord(null);
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
            {showMoNoDropdown &&
              !isLoading &&
              moNoSearch &&
              moNoOptions.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3 text-sm text-gray-500 shadow-lg">
                  {t("cutting.noMoFound")}
                  {moNoSearch}
                  {t("cutting.noMoFoundEnd")}
                </div>
              )}
          </div>
        </div>

        {/* Table No Search (Conditional) */}
        <div className={`space-y-1 ${!selectedMoNo ? "opacity-50" : ""}`}>
          <label
            htmlFor="tableNoSearchManage"
            className="block text-sm font-medium text-gray-700"
          >
            {t("cutting.tableNo")}
          </label>
          <div className="relative" ref={tableNoDropdownRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isLoading && selectedMoNo && !selectedTableNo ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="tableNoSearchManage"
                type="text"
                value={tableNoSearch}
                onChange={(e) => {
                  setTableNoSearch(e.target.value);
                  setSelectedTableNo("");
                  setInspectionRecord(null);
                }}
                onFocus={() =>
                  tableNoOptions.length > 0 && setShowTableNoDropdown(true)
                }
                placeholder={t(
                  "cutting.search_table_placeholder",
                  "Search Table No..."
                )}
                className={`${
                  selectedMoNo ? inputNormalStyle : inputDisabledStyle
                } pl-10 py-2.5`}
                disabled={!selectedMoNo}
              />
              {tableNoSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setTableNoSearch("");
                    setSelectedTableNo("");
                    setInspectionRecord(null);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t("cutting.clearSearch")}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {showTableNoDropdown && tableNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {tableNoOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSelectedTableNo(option.tableNo || option);
                      setTableNoSearch(option.tableNo || option);
                      setShowTableNoDropdown(
                        false
                      ); /* fetchInspectionRecordDetails will be called by useEffect */
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                  >
                    {option.tableNo || option}{" "}
                    {/* API might return array of strings or objects */}
                  </li>
                ))}
              </ul>
            )}
            {showTableNoDropdown &&
              !isLoading &&
              selectedMoNo &&
              tableNoSearch &&
              tableNoOptions.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-3 text-sm text-gray-500 shadow-lg">
                  {t(
                    "cutting.noTableFoundForMo",
                    "No tables found for this MO and search."
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Inspection Record Details Table */}
      {isLoading && selectedMoNo && selectedTableNo && !inspectionRecord && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="ml-3 text-gray-600">
            {t("cuttingReport.loadingRecord", "Loading inspection record...")}
          </p>
        </div>
      )}

      {inspectionRecord && (
        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-slate-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {t("cuttingReport.recordDetailsTitle", "Inspection Record Details")}
          </h2>
          <div className="overflow-x-auto shadow rounded-md">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "inspectionDate",
                    "qcId",
                    "garmentType",
                    "moNo",
                    "tableNo",
                    "color",
                    "buyer",
                    "lotNoCount",
                    "totalBundleQty",
                    "bundleQtyCheck",
                    "totalInspectionQty",
                    "cuttingType",
                    "inspectionDetailsSummary"
                  ].map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                    >
                      {t(`cuttingReport.table.${key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.inspectionDate}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.cutting_emp_id}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.garmentType}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.moNo}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.tableNo}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.color}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.buyer}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-center">
                    {inspectionRecord.lotNo?.length || 0}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-center">
                    {inspectionRecord.totalBundleQty}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-center">
                    {inspectionRecord.bundleQtyCheck}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-center">
                    {inspectionRecord.totalInspectionQty}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {inspectionRecord.cuttingtype}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div>
                      {inspectionRecord.inspectionData?.length || 0}{" "}
                      {t("cuttingReport.sizesChecked", "Sizes Checked")}
                    </div>
                    {(inspectionRecord.inspectionData || []).map((inspData) => (
                      <div
                        key={inspData.inspectedSize}
                        className="text-xs text-gray-600"
                      >
                        - {t("cuttingReport.sizeLabel", "Size")}{" "}
                        {inspData.inspectedSize}: {inspData.bundleQtyCheckSize}{" "}
                        {t("cuttingReport.bundles", "bundles")}
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delete Options Section */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <h3 className="text-md font-semibold text-red-600 mb-3">
              {t("cuttingReport.deleteOptionsTitle", "Delete Options")}
            </h3>
            <div className="space-y-4">
              {/* Option 1: Delete Entire Record */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  {t(
                    "cuttingReport.option1Title",
                    "Option 1: Delete Entire Record"
                  )}
                </h4>
                <button
                  onClick={handleDeleteEntireRecord}
                  disabled={isDeleting.record || isDeleting.size !== null}
                  className="flex items-center px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                  {isDeleting.record ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  {t(
                    "cuttingReport.deleteEntireButton",
                    "Delete Entire Inspection Record"
                  )}
                </button>
              </div>

              {/* Option 2: Delete Specific Sizes */}
              {inspectionRecord.inspectionData &&
                inspectionRecord.inspectionData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "cuttingReport.option2Title",
                        "Option 2: Delete Specific Inspected Sizes"
                      )}
                    </h4>
                    <ul className="space-y-2">
                      {(inspectionRecord.inspectionData || []).map(
                        (inspSize) => (
                          <li
                            key={inspSize.inspectedSize}
                            className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md shadow-sm"
                          >
                            <span className="text-sm text-gray-800">
                              {t("cuttingReport.sizeLabel", "Size")}:{" "}
                              <strong className="font-medium">
                                {inspSize.inspectedSize}
                              </strong>
                              <span className="text-xs text-gray-500 ml-2">
                                ({inspSize.bundleQtyCheckSize}{" "}
                                {t("cuttingReport.bundles", "bundles")})
                              </span>
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteSpecificSize(inspSize.inspectedSize)
                              }
                              disabled={
                                isDeleting.size === inspSize.inspectedSize ||
                                isDeleting.record
                              }
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                              title={t(
                                "cuttingReport.deleteThisSizeData",
                                "Delete data for this size"
                              )}
                            >
                              {isDeleting.size === inspSize.inspectedSize ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      {!inspectionRecord && selectedMoNo && selectedTableNo && !isLoading && (
        <div className="mt-8 text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileX size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium">{t("cuttingReport.noRecordFoundTitle")}</p>
          <p className="text-xs">
            {t(
              "cuttingReport.noRecordFoundForSelection",
              "No inspection record found for the selected MO and Table No."
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CuttingInspectionManage;
