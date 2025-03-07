import { Eye, Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import QRCodePreview from "../forms/QRCodePreview";
import { useTranslation } from "react-i18next";

const DefectPrint = ({ bluetoothRef, printMethod }) => {
  const {t} = useTranslation();
  const [mode, setMode] = useState("repair"); // "repair", "garment", or "bundle"
  const [defectCards, setDefectCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchRepairGroup, setSearchRepairGroup] = useState("");
  const [searchStatus, setSearchStatus] = useState("both");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [repairGroupOptions, setRepairGroupOptions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printDisabled, setPrintDisabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchFilterOptions();
    fetchDefectCards(1, recordsPerPage);
  }, [mode]);

  useEffect(() => {
    fetchDefectCards(currentPage, recordsPerPage);
  }, [currentPage, recordsPerPage]);

  const fetchDefectCards = async (page, limit, filters = {}) => {
    try {
      setLoading(true);
      let url =
        mode === "repair"
          ? `${API_BASE_URL}/api/qc2-defect-print/search?page=${page}&limit=${limit}`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/search?page=${page}&limit=${limit}`;
      const hasSearchParams =
        filters.moNo || filters.packageNo || filters.repair || filters.status;

      if (hasSearchParams) {
        const params = new URLSearchParams();
        if (filters.moNo) params.append("moNo", filters.moNo);
        if (filters.packageNo) {
          const packageNo = Number(filters.packageNo);
          if (isNaN(packageNo)) {
            alert("Package No must be a number");
            setLoading(false);
            return;
          }
          params.append("package_no", packageNo.toString());
        }
        if (filters.repair) params.append("repair", filters.repair);
        url += `&${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${mode} cards`);
      const responseData = await response.json();

      // Safeguard: Ensure data and total are defined
      const data = Array.isArray(responseData.data) ? responseData.data : [];
      const total = Number.isInteger(responseData.total)
        ? responseData.total
        : 0;

      if (mode === "repair") {
        setDefectCards(data);
        setTotalRecords(total);
      } else if (mode === "garment") {
        setDefectCards(data);
        setTotalRecords(total);
      } else if (mode === "bundle") {
        const bundleQrCards = data.flatMap(
          (bundle) =>
            bundle.printArray
              ?.filter((print) => print.method === "bundle")
              .map((print) => ({
                package_no: bundle.package_no,
                moNo: bundle.moNo,
                custStyle: bundle.custStyle,
                color: bundle.color,
                size: bundle.size,
                checkedQty: bundle.checkedQty,
                defectQty: bundle.defectQty,
                totalRejectGarments: print.totalRejectGarmentCount || 0,
                totalPrintDefectCount: print.totalPrintDefectCount || 0,
                printData: print.printData || [],
                defect_print_id: print.defect_print_id,
                isCompleted: print.isCompleted || false,
                rejectGarmentsLength: bundle.rejectGarments?.length || 0,
              }))
              .filter((card) =>
                filters.status === "both"
                  ? true
                  : filters.status === "inProgress"
                  ? card.totalRejectGarments > 0
                  : card.totalRejectGarments === 0
              ) || []
        );
        setDefectCards(bundleQrCards);
        setTotalRecords(bundleQrCards.length); // Total reflects filtered bundle cards
      }
    } catch (error) {
      console.error(`Error fetching ${mode} cards:`, error);
      setDefectCards([]); // Ensure reset to empty array on error
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const url =
        mode === "repair"
          ? `${API_BASE_URL}/api/qc2-defect-print/filter-options`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${mode} options`);
      const data = await response.json();

      setMoNoOptions(Array.isArray(data.moNo) ? data.moNo : []);
      setPackageNoOptions(
        Array.isArray(data.package_no) ? data.package_no : []
      );
      setRepairGroupOptions(
        mode === "repair" && Array.isArray(data.repair) ? data.repair : []
      );
    } catch (error) {
      console.error(`Error fetching ${mode} search options:`, error);
      setMoNoOptions([]);
      setPackageNoOptions([]);
      setRepairGroupOptions([]);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDefectCards(1, recordsPerPage, {
      moNo: searchMoNo.trim(),
      packageNo: searchPackageNo.trim(),
      repair: mode === "repair" ? searchRepairGroup.trim() : undefined,
      status: mode === "bundle" ? searchStatus : undefined,
    });
  };

  const handleResetFilters = () => {
    setSearchMoNo("");
    setSearchPackageNo("");
    setSearchRepairGroup("");
    setSearchStatus("both");
    setCurrentPage(1);
    fetchDefectCards(1, recordsPerPage, {});
  };

  const handlePreviewQR = (card) => {
    setSelectedCard(card);
    setShowQRPreview(true);
  };

  const handlePrintQR = async (card) => {
    if (!bluetoothRef.current?.isConnected) {
      alert("Please connect to a printer first");
      return;
    }

    try {
      setPrintDisabled(true);
      setTimeout(() => setPrintDisabled(false), 5000);
      if (mode === "repair") {
        await bluetoothRef.current.printDefectData(card);
      } else if (mode === "garment") {
        await bluetoothRef.current.printGarmentDefectData(card);
      } else if (mode === "bundle") {
        await bluetoothRef.current.printBundleDefectData(card);
      }
      alert("QR code printed successfully!");
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR code: ${error.message}`);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="p-6 h-full flex flex-col bg-gray-100">
      {/* Mode Selection and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="col-span-1">
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Mode
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setMode("repair")}
                className={`p-2 rounded border ${
                  mode === "repair" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                By Repair
              </button>
              <button
                onClick={() => setMode("garment")}
                className={`p-2 rounded border ${
                  mode === "garment" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                By Garment
              </button>
              <button
                onClick={() => setMode("bundle")}
                className={`p-2 rounded border ${
                  mode === "bundle" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                By Bundle
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              MO No
            </label>
            <input
              type="text"
              value={searchMoNo}
              onChange={(e) => setSearchMoNo(e.target.value)}
              placeholder="Search MO No"
              list="moNoList"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <datalist id="moNoList">
              {moNoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Package No
            </label>
            <input
              type="text"
              value={searchPackageNo}
              onChange={(e) => setSearchPackageNo(e.target.value)}
              placeholder="Search Package No"
              list="packageNoList"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <datalist id="packageNoList">
              {packageNoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          {mode === "repair" && (
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Repair Group
              </label>
              <input
                type="text"
                value={searchRepairGroup}
                onChange={(e) => setSearchRepairGroup(e.target.value)}
                placeholder="Search Repair Group"
                list="repairGroupList"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
              <datalist id="repairGroupList">
                {repairGroupOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          )}
          {mode === "bundle" && (
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Status
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSearchStatus("inProgress")}
                  className={`p-2 rounded border ${
                    searchStatus === "inProgress"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setSearchStatus("completed")}
                  className={`p-2 rounded border ${
                    searchStatus === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setSearchStatus("both")}
                  className={`p-2 rounded border ${
                    searchStatus === "both"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Both
                </button>
              </div>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-200 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Searching..." : "Apply"}
            </button>
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Records Per Page and Pagination */}
      <div className="mb-4 text-sm text-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Records per page:</label>
            <select
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[50, 100, 200, 500].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>Total Records: {totalRecords}</div>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? t("downDa.searching") : t("dash.apply")}
          </button>
          <div className="flex items-center gap-2">
            <select
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                )
              )}
            </select>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2)
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md transition duration-200 ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {t("dash.reset")} {t("dash.filters")}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : !Array.isArray(defectCards) || defectCards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No{" "}
          {mode === "repair"
            ? "defect"
            : mode === "garment"
            ? "garment"
            : "bundle"}{" "}
          cards found
        </div>
      ) : (
        <div className="flex-grow overflow-auto bg-white rounded-lg shadow-md">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                  {mode === "repair" ? (
                    <>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Factory
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Package No
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        MO No
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Cust. Style
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Color
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Size
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Repair Group
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Defect Count
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Defect Details
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Action
                      </th>
                    </>
                  ) : mode === "garment" ? (
                    <>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Package No
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        MO No
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Cust. Style
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Color
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Size
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Defect Count
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Defect Details
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Action
                      </th>
                    </>
                  ) : mode === "bundle" ? (
                    <>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Package No
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Status
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Action
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        MO No
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Cust. Style
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Color
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Size
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Checked #
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Defects #
                      </th>
                      <th className="py-3 px-2 border-b border-gray-300 font-semibold text-sm text-gray-700 break-words">
                        Reject #
                      </th>
                      <th className="py-3 px-2 border-b border-gray-300 font-semibold text-sm text-gray-700 break-words">
                        Reworking #
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        Print Details
                      </th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {mode === "repair"
                  ? defectCards.map((card) => (
                      <tr key={card.defect_id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.factory || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.package_no || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.moNo || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.custStyle || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.color || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.size || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.repair || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.count_print || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.defects && Array.isArray(card.defects)
                            ? card.defects.map((defect) => (
                                <div
                                  key={defect.defectName}
                                  className="flex justify-between text-sm"
                                >
                                  <span>{defect.defectName}:</span>
                                  <span>{defect.count}</span>
                                </div>
                              ))
                            : "No defects"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          <button
                            onClick={() => handlePreviewQR(card)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                          >
                            <Eye className="inline" />
                          </button>
                          <button
                            onClick={() => handlePrintQR(card)}
                            disabled={printDisabled}
                            className={`text-blue-500 hover:text-blue-700 ${
                              printDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Printer className="inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  : mode === "garment"
                  ? defectCards.flatMap((card) =>
                      (card.rejectGarments &&
                      Array.isArray(card.rejectGarments) &&
                      card.rejectGarments.length > 0
                        ? card.rejectGarments
                        : []
                      ).map((garment) => (
                        <tr
                          key={`${card.bundle_id}-${garment.garment_defect_id}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {card.package_no || "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {card.moNo || "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {card.custStyle || "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {card.color || "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {card.size || "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {garment.totalCount || "N/A"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {garment.defects && Array.isArray(garment.defects)
                              ? garment.defects.map((defect) => (
                                  <div
                                    key={defect.name}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>{defect.name}:</span>
                                    <span>{defect.count}</span>
                                  </div>
                                ))
                              : "No defects"}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            <button
                              onClick={() =>
                                handlePreviewQR({
                                  ...card,
                                  rejectGarments: [garment],
                                })
                              }
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <Eye className="inline" />
                            </button>
                            <button
                              onClick={() =>
                                handlePrintQR({
                                  ...card,
                                  rejectGarments: [garment],
                                })
                              }
                              disabled={printDisabled}
                              className={`text-blue-500 hover:text-blue-700 ${
                                printDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <Printer className="inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  : mode === "bundle"
                  ? defectCards.map((card) => (
                      <tr
                        key={card.defect_print_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.package_no || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-white text-sm ${
                              card.totalRejectGarments > 0
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          >
                            {card.totalRejectGarments > 0
                              ? "In Progress"
                              : "Completed"}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          <button
                            onClick={() => handlePreviewQR(card)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                          >
                            <Eye className="inline" />
                          </button>
                          <button
                            onClick={() => handlePrintQR(card)}
                            disabled={printDisabled}
                            className={`text-blue-500 hover:text-blue-700 ${
                              printDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Printer className="inline" />
                          </button>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.moNo || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.custStyle || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.color || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.size || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.checkedQty || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.defectQty || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.rejectGarmentsLength || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.totalRejectGarments === 0
                            ? "0"
                            : card.totalRejectGarments || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.printData && Array.isArray(card.printData)
                            ? card.printData.flatMap((garment) =>
                                garment.defects &&
                                Array.isArray(garment.defects) ? (
                                  garment.defects.map((defect) => (
                                    <div
                                      key={`${garment.garmentNumber}-${defect.name}`}
                                      className="text-sm"
                                    >
                                      ({garment.garmentNumber}) {defect.name}:{" "}
                                      {defect.count}
                                    </div>
                                  ))
                                ) : (
                                  <div
                                    key={garment.garmentNumber}
                                    className="text-sm"
                                  >
                                    ({garment.garmentNumber}) No defects
                                  </div>
                                )
                              )
                            : "No print data"}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={selectedCard ? [selectedCard] : []}
        onPrint={handlePrintQR}
        mode={
          mode === "repair"
            ? "inspection"
            : mode === "garment"
            ? "garment"
            : "bundle"
        }
      />
    </div>
  );
};

export default DefectPrint;
