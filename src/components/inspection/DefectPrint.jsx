import { Eye, Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import QRCodePreview from "../forms/QRCodePreview";

const DefectPrint = ({ bluetoothRef, printMethod }) => {
  const [mode, setMode] = useState("repair"); // "repair", "garment", or "bundle"
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
  }, [mode]);

  const fetchDefectCards = async () => {
    try {
      setLoading(true);
      if (mode === "repair") {
        const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`);
        if (!response.ok) throw new Error("Failed to fetch repair cards");
        const data = await response.json();
        setDefectCards(data);
      } else if (mode === "garment" || mode === "bundle") {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle`
        );
        if (!response.ok) throw new Error("Failed to fetch bundle cards");
        const data = await response.json();
        if (mode === "garment") {
          setDefectCards(data);
        } else {
          // For "bundle" mode, extract QR codes from printArray where method is "bundle"
          const bundleQrCards = data.flatMap((bundle) =>
            bundle.printArray
              .filter((print) => print.method === "bundle")
              .map((print) => ({
                moNo: bundle.moNo,
                custStyle: bundle.custStyle,
                color: bundle.color,
                size: bundle.size,
                package_no: bundle.package_no,
                totalRejectGarments: print.totalRejectGarmentCount,
                totalDefectCount: print.totalPrintDefectCount,
                defects: print.printData, // Array of garments with defects
                defect_print_id: print.defect_print_id,
              }))
          );
          setDefectCards(bundleQrCards);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${mode} cards:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchOptions = async () => {
    try {
      const url =
        mode === "repair"
          ? `${API_BASE_URL}/api/qc2-defect-print`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${mode} options`);
      const data = await response.json();

      if (mode === "repair") {
        const moNos = [
          ...new Set(data.map((card) => card.moNo).filter(Boolean)),
        ].sort();
        const packageNos = [
          ...new Set(data.map((card) => card.package_no).filter(Boolean)),
        ].sort((a, b) => a - b);
        const repairGroups = [
          ...new Set(data.map((card) => card.repair).filter(Boolean)),
        ].sort();
        setMoNoOptions(moNos);
        setPackageNoOptions(packageNos);
        setRepairGroupOptions(repairGroups);
      } else {
        const moNos = [
          ...new Set(data.map((card) => card.moNo).filter(Boolean)),
        ].sort();
        const packageNos = [
          ...new Set(data.map((card) => card.package_no).filter(Boolean)),
        ].sort((a, b) => a - b);
        setMoNoOptions(moNos);
        setPackageNoOptions(packageNos);
        setRepairGroupOptions([]);
      }
    } catch (error) {
      console.error(`Error fetching ${mode} search options:`, error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      let url =
        mode === "repair"
          ? `${API_BASE_URL}/api/qc2-defect-print/search`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/search`;
      const hasSearchParams =
        searchMoNo.trim() ||
        searchPackageNo.trim() ||
        (mode === "repair" && searchRepairGroup.trim());

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

        if (mode === "repair" && searchRepairGroup.trim()) {
          params.append("repair", searchRepairGroup.trim());
        }

        url = `${url}?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to search ${mode} cards`);
      }

      const data = await response.json();
      if (mode === "bundle") {
        const bundleQrCards = data.flatMap((bundle) =>
          bundle.printArray
            .filter((print) => print.method === "bundle")
            .map((print) => ({
              moNo: bundle.moNo,
              custStyle: bundle.custStyle,
              color: bundle.color,
              size: bundle.size,
              package_no: bundle.package_no,
              totalRejectGarments: print.totalRejectGarmentCount,
              totalDefectCount: print.totalPrintDefectCount,
              defects: print.printData,
              defect_print_id: print.defect_print_id,
            }))
        );
        setDefectCards(bundleQrCards);
      } else {
        setDefectCards(data);
      }
    } catch (error) {
      console.error(`Error searching ${mode} cards:`, error);
      alert(
        error.message || `Failed to search ${mode} cards. Please try again.`
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

  return (
    <div className="p-4">
      {/* Mode Selection Buttons */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex space-x-2 w-full md:w-1/3">
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

        {/* Filter Inputs */}
        {mode === "repair" ? (
          <>
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
                  .filter(
                    (option) =>
                      option !== undefined &&
                      option !== null &&
                      option.toString().includes(searchPackageNo)
                  )
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
          </>
        ) : (
          <>
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
                  .filter(
                    (option) =>
                      option !== undefined &&
                      option !== null &&
                      option.toString().includes(searchPackageNo)
                  )
                  .map((option) => (
                    <option key={option} value={option} />
                  ))}
              </datalist>
            </div>
          </>
        )}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`${
              loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
            } text-white px-4 py-2 rounded w-full md:w-auto transition-colors`}
          >
            {loading ? "Searching..." : "Apply Filters"}
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

      {/* Loading or Empty State */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : defectCards.length === 0 ? (
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
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                {mode === "repair" ? (
                  <>
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
                  </>
                ) : mode === "garment" ? (
                  <>
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
                      Defect Count
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                      Defect Details
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                      Action
                    </th>
                  </>
                ) : mode === "bundle" ? (
                  <>
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
                      Package No
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                      Total Reject Garments
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                      Total Defect Count
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                      Defect Details
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">
                      Action
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {mode === "repair"
                ? defectCards.map((card) => (
                    <tr key={card.defect_id} className="hover:bg-gray-100">
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
                            printDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Printer className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                : mode === "garment"
                ? defectCards.map((card) =>
                    (card.rejectGarments && card.rejectGarments.length > 0
                      ? card.rejectGarments
                      : []
                    ).map((garment, idx) => (
                      <tr
                        key={`${card.bundle_id}-${garment.garment_defect_id}`}
                        className="hover:bg-gray-100"
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
                          {garment.defects.map((defect) => (
                            <div
                              key={defect.name}
                              className="flex justify-between text-sm"
                            >
                              <span>{defect.name}:</span>
                              <span>{defect.count}</span>
                            </div>
                          ))}
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
                ? defectCards.map((card, index) => (
                    <tr
                      key={card.defect_print_id || index}
                      className="hover:bg-gray-100"
                    >
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
                        {card.package_no || "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {card.totalRejectGarments || "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {card.totalDefectCount || "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {card.defects && Array.isArray(card.defects)
                          ? card.defects.flatMap((garment) =>
                              garment.defects.map((defect) => (
                                <div
                                  key={`${garment.garmentNumber}-${defect.name}`}
                                  className="text-sm"
                                >
                                  ({garment.garmentNumber}) {defect.name}:{" "}
                                  {defect.count}
                                </div>
                              ))
                            )
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
                            printDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Printer className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Preview */}
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
