import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import { useTranslation } from "react-i18next";

const QC2Data = () => {
  const {t} = useTranslation();
  const [dataCards, setDataCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDataCards();
    fetchSearchOptions();
  }, []);

  const fetchDataCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle`
      );
      if (!response.ok) throw new Error("Failed to fetch data cards");
      const data = await response.json();
      setDataCards(data);
    } catch (error) {
      console.error("Error fetching data cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchOptions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle`
      );
      if (!response.ok) throw new Error("Failed to fetch search options");
      const data = await response.json();

      // Extract unique values and sort them
      const moNos = [...new Set(data.map((card) => card.moNo))].sort();
      const packageNos = [...new Set(data.map((card) => card.package_no))].sort(
        (a, b) => a - b
      );
      const empIds = [
        ...new Set(data.map((card) => card.emp_id_inspection)),
      ].sort();

      setMoNoOptions(moNos);
      setPackageNoOptions(packageNos);
      setEmpIdOptions(empIds);
    } catch (error) {
      console.error("Error fetching search options:", error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/qc2-inspection-pass-bundle`;
      const hasSearchParams =
        searchMoNo.trim() || searchPackageNo.trim() || searchEmpId.trim();

      if (hasSearchParams) {
        const params = new URLSearchParams();

        if (searchMoNo.trim()) {
          params.append("moNo", searchMoNo.trim());
        }

        if (searchPackageNo.trim()) {
          const packageNo = Number(searchPackageNo);
          if (isNaN(packageNo)) {
            alert("Package No must be a number");
            return;
          }
          params.append("package_no", packageNo.toString());
        }

        if (searchEmpId.trim()) {
          params.append("emp_id_inspection", searchEmpId.trim());
        }

        url = `${url}/search?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search data cards");
      }

      const data = await response.json();
      setDataCards(data);
    } catch (error) {
      console.error("Error searching data cards:", error);
      alert(error.message || "Failed to search data cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchMoNo("");
    setSearchPackageNo("");
    setSearchEmpId("");
    fetchDataCards();
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="relative w-full md:w-1/3">
          <label className="block mb-1 font-bold">{t("bundle.mono")}</label>
          <input
            type="text"
            placeholder={t("bundle.search_mono")}
            value={searchMoNo}
            onChange={(e) => setSearchMoNo(e.target.value)}
            className="border p-2 rounded w-full"
            list="moNoOptions"
          />
          <datalist id="moNoOptions">
            {moNoOptions
              .filter((option) =>
                option.toLowerCase().includes(searchMoNo.toLowerCase())
              )
              .map((option) => (
                <option key={option} value={option} />
              ))}
          </datalist>
        </div>
        <div className="relative w-full md:w-1/3">
          <label className="block mb-1 font-bold">{t("bundle.package_no")}</label>
          <input
            type="text"
            placeholder={t("defectPrint.search_package")}
            value={searchPackageNo}
            onChange={(e) => setSearchPackageNo(e.target.value)}
            className="border p-2 rounded w-full"
            list="packageNoOptions"
          />
          <datalist id="packageNoOptions">
            {packageNoOptions
              .filter(
                (option) =>
                  option != null && option.toString().includes(searchPackageNo)
              )
              .map((option) => (
                <option key={option} value={option} />
              ))}
          </datalist>
        </div>
        <div className="relative w-full md:w-1/3">
          <label className="block mb-1 font-bold">{t("bundle.emp_id")}</label>
          <input
            type="text"
            placeholder= {t("set.search_emp_id")}
            value={searchEmpId}
            onChange={(e) => setSearchEmpId(e.target.value)}
            className="border p-2 rounded w-full"
            list="empIdOptions"
          />
          <datalist id="empIdOptions">
            {empIdOptions
              .filter(
                (option) =>
                  option != null && option.toString().includes(searchEmpId)
              )
              .map((option) => (
                <option key={option} value={option} />
              ))}
          </datalist>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`${
              loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
            } text-white px-4 py-2 rounded w-full md:w-auto transition-colors`}
          >
            {loading ? t("downDa.searching") : t("dash.apply")}
          </button>
          <button
            onClick={handleResetFilters}
            disabled={loading}
            className={`${
              loading ? "bg-gray-300" : "bg-gray-500 hover:bg-gray-600"
            } text-white px-4 py-2 rounded w-full md:w-auto transition-colors`}
          >
           {t("dash.reset")} {t("dash.filters")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : dataCards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t("previewMode.no_data_card")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("bundle.mono")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("bundle.customer_style")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("bundle.bundle")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("bundle.size")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("bundle.package_no")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("bundle.emp_id")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("previewMode.emp_name")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("previewMode.inspection_time")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("previewMode.inspection_date")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("ana.checked_qty")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("dash.total_pass")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("dash.total_rejects")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("dash.defects_qty")}
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                {t("preview.defect_details")}
                </th>
              </tr>
            </thead>
            <tbody>
              {dataCards.map((card) => (
                <tr key={card.bundle_id} className="hover:bg-gray-100">
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
      )}
    </div>
  );
};

export default QC2Data;
