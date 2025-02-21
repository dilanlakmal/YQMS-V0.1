import { Eye, Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import QRCodePreview from "../forms/QRCodePreview";

const DefectPrint = ({ bluetoothRef }) => {
  const [defectCards, setDefectCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchRepairGroup, setSearchRepairGroup] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [repairGroupOptions, setRepairGroupOptions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printDisabled, setPrintDisabled] = useState(false);

  useEffect(() => {
    fetchDefectCards();
    fetchSearchOptions();
  }, []);

  const fetchDefectCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`);
      if (!response.ok) throw new Error("Failed to fetch defect cards");
      const data = await response.json();
      setDefectCards(data);
    } catch (error) {
      console.error("Error fetching defect cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`);
      if (!response.ok) throw new Error("Failed to fetch search options");
      const data = await response.json();

      // Extract unique values and sort them
      const moNos = [...new Set(data.map((card) => card.moNo))].sort();
      const packageNos = [...new Set(data.map((card) => card.package_no))].sort(
        (a, b) => a - b
      );
      const repairGroups = [...new Set(data.map((card) => card.repair))].sort();

      setMoNoOptions(moNos);
      setPackageNoOptions(packageNos);
      setRepairGroupOptions(repairGroups);
    } catch (error) {
      console.error("Error fetching search options:", error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/qc2-defect-print`;
      const hasSearchParams =
        searchMoNo.trim() || searchPackageNo.trim() || searchRepairGroup.trim();

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

        if (searchRepairGroup.trim()) {
          params.append("repair", searchRepairGroup.trim());
        }

        url = `${url}/search?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search defect cards");
      }

      const data = await response.json();
      setDefectCards(data);
    } catch (error) {
      console.error("Error searching defect cards:", error);
      alert(
        error.message || "Failed to search defect cards. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchMoNo("");
    setSearchPackageNo("");
    setSearchRepairGroup("");
    fetchDefectCards();
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
      await bluetoothRef.current.printDefectData(card);
      alert("QR code printed successfully!");
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR code: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="relative w-full md:w-1/3">
          <label className="block mb-1 font-bold">MO No</label>
          <input
            type="text"
            placeholder="Search MO No"
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
          <label className="block mb-1 font-bold">Package No</label>
          <input
            type="text"
            placeholder="Search Package No"
            value={searchPackageNo}
            onChange={(e) => setSearchPackageNo(e.target.value)}
            className="border p-2 rounded w-full"
            list="packageNoOptions"
          />
          <datalist id="packageNoOptions">
            {packageNoOptions
              .filter((option) => option.toString().includes(searchPackageNo))
              .map((option) => (
                <option key={option} value={option} />
              ))}
          </datalist>
        </div>
        <div className="relative w-full md:w-1/3">
          <label className="block mb-1 font-bold">Repair Group</label>
          <select
            value={searchRepairGroup}
            onChange={(e) => setSearchRepairGroup(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Repair Group</option>
            {repairGroupOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`${
              loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
            } text-white px-4 py-2 rounded w-full md:w-auto transition-colors`}
          >
            {loading ? "Searching..." : "Apply"}
          </button>
          <button
            onClick={handleResetFilters}
            disabled={loading}
            className={`${
              loading ? "bg-gray-300" : "bg-gray-500 hover:bg-gray-600"
            } text-white px-4 py-2 rounded w-full md:w-auto transition-colors`}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : defectCards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No defect cards found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Factory
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Package No
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  MO No
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Cust. Style
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Color
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Size
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Repair Group
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Defect Count
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Defect Details
                </th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {defectCards.map((card) => (
                <tr key={card.defect_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {card.factory}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {card.package_no}
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
                    {card.repair}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {card.count_print}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {card.defects.map((defect) => (
                      <div
                        key={defect.defectName}
                        className="flex justify-between text-sm"
                      >
                        <span>{defect.defectName}:</span>
                        <span>{defect.count}</span>
                      </div>
                    ))}
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
                        printDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Printer className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={selectedCard ? [selectedCard] : []}
        mode="inspection"
      />
    </div>
  );
};

export default DefectPrint;
