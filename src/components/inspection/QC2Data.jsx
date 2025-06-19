import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import { useTranslation } from "react-i18next";
import EditModal from "../forms/EditInspectionData";

const QC2Data = () => {
  const {t} = useTranslation();
  const [dataCards, setDataCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");
  const [searchLineNo, setSearchLineNo] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDataForEdit, setSelectedDataForEdit] = useState(null);

  useEffect(() => {
    fetchFilterOptions();
    fetchDataCards(1, recordsPerPage);
  }, []);

  useEffect(() => {
    fetchDataCards(currentPage, recordsPerPage);
  }, [currentPage, recordsPerPage]);

const fetchDataCards = async (page, limit) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/qc2-inspection-pass-bundle/search?page=${page}&limit=${limit}`;
      const hasSearchParams =
        searchMoNo.trim() || searchPackageNo.trim() || searchEmpId.trim() || searchLineNo.trim();

      if (hasSearchParams) {
        const params = new URLSearchParams();
        if (searchMoNo.trim()) params.append("moNo", searchMoNo.trim());
        if (searchPackageNo.trim()) {
          const packageNo = Number(searchPackageNo.trim());
          if (isNaN(packageNo)) {
            alert("Package No must be a number");
            setLoading(false);
            return;
          }
          params.append("package_no", packageNo.toString());
        }
        if (searchEmpId.trim()) params.append("emp_id_inspection", searchEmpId.trim());
        if (searchLineNo.trim()) params.append("lineNo", searchLineNo.trim());
        url += `&${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data cards");
      const { data, total } = await response.json();
      setDataCards(data || []);
      setTotalRecords(total || 0);
    } catch (error) {
      console.error("Error fetching data cards:", error);
      setDataCards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`
      );
      if (!response.ok) throw new Error("Failed to fetch filter options");
      const data = await response.json();
      setMoNoOptions(data.moNo || []);
      setPackageNoOptions(data.package_no || []);
      setEmpIdOptions(data.emp_id_inspection || []);
      setLineNoOptions(data.lineNo || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setLineNoOptions([]);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDataCards(1, recordsPerPage);
  };

  const handleResetFilters = () => {
    setSearchMoNo("");
    setSearchPackageNo("");
    setSearchEmpId("");
    setSearchLineNo("");
    setCurrentPage(1);
    fetchDataCards(1, recordsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    };

  const handleEdit = (cardData) => {
    setSelectedDataForEdit(cardData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDataForEdit(null);
  };

  const handleSaveEdit = async (updatedData) => {
    if (!selectedDataForEdit) return;
    try {
      setLoading(true);

      const totalDefectCount = updatedData.rejectGarments.reduce(
        (total, garment) =>
          total +
          garment.defects.reduce((sum, defect) => sum + defect.count, 0),
        0
      );

      const defectCounts = {};
      updatedData.rejectGarments.forEach((garment) => {
        garment.defects.forEach((defect) => {
          defectCounts[defect.name] =
            (defectCounts[defect.name] || 0) + defect.count;
        });
      });

      const defectArray = Object.entries(defectCounts).map(
        ([defectName, totalCount]) => ({ defectName, totalCount })
      );

      const dataToUpdate = {
        ...updatedData,
        defectQty: totalDefectCount,
        defectArray,
        totalRejects: updatedData.rejectGarments.length,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${selectedDataForEdit.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToUpdate),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save data");
      }

      alert("Data updated successfully!");
      handleCloseEditModal();
      fetchDataCards(currentPage, recordsPerPage); // Refresh data for the current view
    } catch (error) {
      console.error("Error saving data:", error);
      alert(error.message || "Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="p-6 h-full flex flex-col bg-gray-100">
      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
             {t("bundle.mono")}
            </label>
            <input
              type="text"
              value={searchMoNo}
              onChange={(e) => setSearchMoNo(e.target.value)}
              placeholder={t("bundle.search_mono")}
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
            {t("bundle.package_no")}
            </label>
            <input
              type="text"
              value={searchPackageNo}
              onChange={(e) => setSearchPackageNo(e.target.value)}
              placeholder={t("defectPrint.search_package")}
              list="packageNoList"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <datalist id="packageNoList">
              {packageNoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
            {t("bundle.emp_id")}
            </label>
            <input
              type="text"
              value={searchEmpId}
              onChange={(e) => setSearchEmpId(e.target.value)}
              placeholder={t("set.search_emp_id")}
              list="empIdList"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <datalist id="empIdList">
              {empIdOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
            {t("bundle.line_no")}
            </label>
            <input
              type="text"
              value={searchLineNo}
              onChange={(e) => setSearchLineNo(e.target.value)}
              placeholder={t("bundle.search_line_no", "Search Line No")}
              list="lineNoList"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <datalist id="lineNoList">
              {lineNoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 md:col-span-1 lg:col-span-1">
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-200 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? t("downDa.searching") : t("dash.apply")}
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
              {t("dash.reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Records Per Page and Pagination */}
      <div className="mb-4 text-sm text-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <label className="font-semibold">{t("downDa.record_per")}:</label>
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
          <div>{t("downDa.total_record")}: {totalRecords}</div>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            Previous
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
            {t("userL.next")}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : dataCards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
         {t("previewMode.no_data_card")}
        </div>
      ) : (
        <div className="flex-grow overflow-auto bg-white rounded-lg shadow-md">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                   <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                    {t("userL.action")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.mono")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.customer_style")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.color")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.size")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.package_no")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.line_no")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.emp_id")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("previewMode.emp_name")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("previewMode.inspection_time")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("previewMode.inspection_date")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("ana.checked_qty")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("dash.total_pass")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("dash.total_rejects")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("dash.defects_qty")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("preview.defect_details")}
                  </th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {dataCards.map((card) => (
                  <tr key={card.bundle_id || card._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      <button
                        onClick={() => handleEdit(card)}
                        className="px-2 py-1.5 text-xs font-medium text-gray-700 border border-blue-800 bg-blue-200 rounded-md hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        {t("bundle.edit")}
                      </button>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.moNo}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.custStyle}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.color}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.size}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.package_no}
                    </td>
                     <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.lineNo}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.emp_id_inspection}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.eng_name_inspection}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.inspection_time}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.inspection_date}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.checkedQty}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.totalPass}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.totalRejects}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.defectQty}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.defectArray.map((defect) => (
                        <div
                          key={defect.defectName}
                          className="flex justify-between text-sm"
                        >
                          <span>{defect.defectName}:</span>
                          <span>{defect.totalCount}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          data={selectedDataForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default QC2Data;
