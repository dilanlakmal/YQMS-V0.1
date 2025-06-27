import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../config";
import EditModal from "../forms/EditInspectionData";

const EditInspection = () => {
  const { t } = useTranslation();
  const [dataCards, setDataCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [masterDefects, setMasterDefects] = useState([]); // New state for master defect list

  useEffect(() => {
    fetchFilterOptions();
    fetchDataCards(1);
    fetchMasterDefects(); // Fetch master defects on initial load
  }, []);

  const fetchDataCards = async (page) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/qc2-inspection-pass-bundle/search?page=${page}&limit=${recordsPerPage}`;
      const hasSearchParams =
        searchMoNo.trim() || searchPackageNo.trim() || searchEmpId.trim();

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
        if (searchEmpId.trim())
          params.append("emp_id_inspection", searchEmpId.trim());
        url += `&${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data cards");
      const { data, total } = await response.json();
      setDataCards(data || []);
      setTotalRecords(total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching data cards:", error);
      setDataCards([]);
      setTotalRecords(0);
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
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setMoNoOptions([]);
      setPackageNoOptions([]);
      setEmpIdOptions([]);
    }
  };

  // New function to fetch master defect list
  const fetchMasterDefects = async () => {
    try {
      // Assuming an API endpoint that returns a list of all defects with their codes
      const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
      if (!response.ok) throw new Error("Failed to fetch master defects");
      const data = await response.json();
      setMasterDefects(data);
    } catch (error) {
      console.error("Error fetching master defects:", error);
    }
  };

  const handleSearch = () => {
    fetchDataCards(1);
  };

  const handleResetFilters = () => {
    // Reset state and fetch immediately
    setSearchMoNo("");
    setSearchPackageNo("");
    setSearchEmpId("");
    setCurrentPage(1);
    fetchDataCards(1); // Fetch immediately after reset
  };

  const handleEdit = (data) => {
    setSelectedData(data);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedData) => {
    if (!selectedData) return;
    try {
      setLoading(true);

      const totalDefectCount = updatedData.rejectGarments.reduce(
        (total, garment) =>
          total +
          garment.defects.reduce((sum, defect) => sum + defect.count, 0),
        0
      );

      // Build a robust, case-insensitive lookup map for defect codes.
      const defectCodeLookup = new Map();

      // 1. Populate from masterDefects (most authoritative source)
      masterDefects.forEach(d => {
        if (d.name && d.code) { // Use 'name' for lookup key (assuming API returns 'name' for English)
          defectCodeLookup.set(d.name.trim().toLowerCase(), d.code);
        }
      });

      // 2. Populate from selectedData.defectArray (for any custom or older defects not in master, but present in the original bundle data)
      selectedData.defectArray?.forEach(d => {
        if (d.defectName && d.defectCode) {
          const key = d.defectName.trim().toLowerCase();
          if (!defectCodeLookup.has(key)) { // Only add if not already present from master
            defectCodeLookup.set(key, d.defectCode);
          }
        }
      });

      // 3. Populate from selectedData.rejectGarments (similar to above, for individual garment defects)
      selectedData.rejectGarments?.forEach(g => g.defects.forEach(d => {
        if (d.name && d.code) {
          const key = d.name.trim().toLowerCase();
          if (!defectCodeLookup.has(key)) { // Only add if not already present from master or defectArray
            defectCodeLookup.set(key, d.code);
          }
        }
      }));

      // Patch rejectGarments and build the summary `defectArray` correctly.
      const defectSummary = {};
      let validationError = null;
      updatedData.rejectGarments.forEach((garment) => {
        garment.defects.forEach((defect) => {
          if (validationError || !defect.name) return; // Stop if error found or no defect name
          const trimmedDefectName = defect.name.trim();

          // If code is missing, try to add it from our lookup.
          if (!defect.code) {
            defect.code = defectCodeLookup.get(trimmedDefectName.toLowerCase());
          }

          // If code is still missing, it's a new defect we can't resolve. Stop the process.
          if (!defect.code) {
            validationError = `Cannot save: Defect "${trimmedDefectName}" is missing a required code.`;
            return;
          }

          // Aggregate defects for the summary array, preserving the code.
          if (!defectSummary[trimmedDefectName]) {
            defectSummary[trimmedDefectName] = { totalCount: 0, defectCode: defect.code };
          }
          defectSummary[trimmedDefectName].totalCount += defect.count;
        });
      });

      if (validationError) throw new Error(validationError);

      const defectArray = Object.entries(defectSummary).map(
        ([defectName, { totalCount, defectCode }]) => ({ defectName, totalCount, defectCode }) // Ensure defectCode is passed
      );
      
      // Destructure to exclude IDs from the payload.
      const { _id, bundle_id, bundle_random_id, ...restOfSelectedData } = selectedData;

      const dataToUpdate = {
        ...restOfSelectedData,
        ...updatedData,
        defectQty: totalDefectCount,
        defectArray,
        totalRejects: updatedData.rejectGarments.length,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${selectedData.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToUpdate)
        }
      );

      if (!response.ok) throw new Error("Failed to save data");

      await fetchDataCards(currentPage);
      setIsModalOpen(false);
      alert("Data updated successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert(error.message || "Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchDataCards(page);
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="p-4 h-full flex flex-col bg-gray-100">
      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 font-bold text-gray-700">
              {t("bundle.mono")}
            </label>
            <input
              type="text"
              placeholder={t("bundle.search_mono")}
              value={searchMoNo}
              onChange={(e) => setSearchMoNo(e.target.value)}
              className="w-full p-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-blue-50 text-gray-800 placeholder-gray-400 transition duration-200"
              list="moNoOptions"
            />
            <datalist id="moNoOptions">
              {moNoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block mb-1 font-bold text-gray-700">
              {t("bundle.package_no")}
            </label>
            <input
              type="text"
              placeholder={t("defectPrint.search_package")}
              value={searchPackageNo}
              onChange={(e) => setSearchPackageNo(e.target.value)}
              className="w-full p-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-blue-50 text-gray-800 placeholder-gray-400 transition duration-200"
              list="packageNoOptions"
            />
            <datalist id="packageNoOptions">
              {packageNoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block mb-1 font-bold text-gray-700">
              {t("bundle.emp_id")}
            </label>
            <input
              type="text"
              placeholder={t("bundle.search_emp_id")}
              value={searchEmpId}
              onChange={(e) => setSearchEmpId(e.target.value)}
              className="w-full p-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-blue-50 text-gray-800 placeholder-gray-400 transition duration-200"
              list="empIdOptions"
            />
            <datalist id="empIdOptions">
              {empIdOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
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

      {/* Pagination */}
      <div className="mb-4 text-sm text-gray-700">
        <div className="flex justify-between items-center">
          <div>Total Records: {totalRecords}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              Next
            </button>
          </div>
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
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("bundle.mono")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("bundle.color")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("bundle.size")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("bundle.package_no")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("ana.checked_qty")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("dash.total_pass")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("dash.total_rejects")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("dash.defects_qty")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  {t("preview.defect_details")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {dataCards.map((card) => (
                <tr key={card.bundle_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {card.moNo}
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
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    <button
                      onClick={() => handleEdit(card)}
                      className="px-2 py-1.5 text-xs font-medium text-gray-700 border border-blue-800 bg-blue-200 rounded-md hover:bg-blue-300"
                    >
                      {t("bundle.edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedData}
        masterDefects={masterDefects}
        onSave={handleSave}
      />
    </div>
  );
};

export default EditInspection;
