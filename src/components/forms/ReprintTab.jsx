import { useEffect, useRef, useState } from "react";
import { FaFilter, FaPrint, FaQrcode, FaTimes } from "react-icons/fa";
import { API_BASE_URL } from "../../../config";
import { useTranslation } from 'react-i18next';
import BluetoothComponent from "./Bluetooth";
import QRCodePreview from "./QRCodePreview";

export default function ReprintTab() {
  const { t } = useTranslation();
  const { formData, updateFormData } = useFormData();
  const [monoSearch, setMonoSearch] = useState("");
  const [packageNoSearch, setPackageNoSearch] = useState("");
  const [empIdSearch, setEmpIdSearch] = useState("");
  const [selectedMono, setSelectedMono] = useState("");
  const [selectedPackageNo, setSelectedPackageNo] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMonoDropdown, setShowMonoDropdown] = useState(false);
  const [showPackageNoDropdown, setShowPackageNoDropdown] = useState(false);
  const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);

  const bluetoothComponentRef = useRef();
  const monoInputRef = useRef(null);
  const packageNoInputRef = useRef(null);
  const empIdInputRef = useRef(null);

  // Fetch records based on search inputs
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/reprint-search?mono=${monoSearch}&packageNo=${packageNoSearch}&empId=${empIdSearch}`
        );
        const data = await response.json();
        setRecords(data);
        setFilteredRecords(data);
      } catch (error) {
        console.error("Error fetching records:", error);
        setRecords([]);
        setFilteredRecords([]);
      }
    };
    fetchRecords();
  }, [monoSearch, packageNoSearch, empIdSearch]);

  // Fetch colors and sizes when a MONo is selected
  useEffect(() => {
    const fetchColorsSizes = async () => {
      if (!selectedMono) {
        setColors([]);
        setSizes([]);
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/api/reprint-colors-sizes/${selectedMono}`
      );
      const data = await response.json();
      setColors(data);
    };
    fetchColorsSizes();
  }, [selectedMono]);

  // Filter records based on selections
  useEffect(() => {
    if (
      !selectedMono &&
      !selectedPackageNo &&
      !selectedEmpId &&
      !color &&
      !size
    ) {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter((record) => {
        const matchesMono = selectedMono
          ? record.selectedMono === selectedMono
          : true;
        const matchesPackageNo = selectedPackageNo
          ? record.package_no?.toString() === selectedPackageNo
          : true;
        const matchesEmpId = selectedEmpId
          ? record.emp_id === selectedEmpId
          : true;
        const matchesColor = color ? record.color === color : true;
        const matchesSize = size ? record.size === size : true;
        return (
          matchesMono &&
          matchesPackageNo &&
          matchesEmpId &&
          matchesColor &&
          matchesSize
        );
      });
      setFilteredRecords(filtered);
    }
  }, [selectedMono, selectedPackageNo, selectedEmpId, color, size, records]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        monoInputRef.current &&
        !monoInputRef.current.contains(event.target)
      ) {
        setShowMonoDropdown(false);
      }
      if (
        packageNoInputRef.current &&
        !packageNoInputRef.current.contains(event.target)
      ) {
        setShowPackageNoDropdown(false);
      }
      if (
        empIdInputRef.current &&
        !empIdInputRef.current.contains(event.target)
      ) {
        setShowEmpIdDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrint = async (record) => {
    try {
      await bluetoothComponentRef.current.printData({
        ...record,
        bundle_id: record.bundle_random_id,
      });
    } catch (error) {
      alert(`Print failed: ${error.message}`);
    }
  };

  const handlePreviewQR = (record) => {
    setSelectedRecords([record]);
    setShowQRPreview(true);
  };

  const handleMonoSelect = (mono) => {
    setSelectedMono(mono);
    setMonoSearch(mono);
    setShowMonoDropdown(false); // Close dropdown immediately after selection
    setColor("");
    setSize("");
  };

  const handlePackageNoSelect = (packageNo) => {
    setSelectedPackageNo(packageNo);
    setPackageNoSearch(packageNo);
    setShowPackageNoDropdown(false); // Close dropdown immediately after selection
    setColor("");
    setSize("");
  };

  const handleEmpIdSelect = (empId) => {
    setSelectedEmpId(empId);
    setEmpIdSearch(empId);
    setShowEmpIdDropdown(false); // Close dropdown immediately after selection
    setColor("");
    setSize("");
  };

  const handleClearFilters = () => {
    setMonoSearch("");
    setPackageNoSearch("");
    setEmpIdSearch("");
    setSelectedMono("");
    setSelectedPackageNo("");
    setSelectedEmpId("");
    setColor("");
    setSize("");
    setFilteredRecords(records);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Reprint Records</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-md"
          >
            <FaFilter className="mr-1" size={10} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          {showFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center text-sm bg-gray-200 px-3 py-1 rounded-md"
            >
              <FaTimes className="mr-1" size={10} />
              Clear
            </button>
          )}
          <BluetoothComponent ref={bluetoothComponentRef} />
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div ref={monoInputRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("bundle.search_mono")}
            </label>
            <input
              type="text"
              value={monoSearch}
              onChange={(e) => {
                setMonoSearch(e.target.value);
                setShowMonoDropdown(true);
              }}
              onFocus={() => setShowMonoDropdown(true)}
              placeholder="Search MONo..."
              className="w-full p-2 border rounded"
            />
            {showMonoDropdown && monoSearch && records.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto border rounded bg-white absolute z-10">
                {[...new Set(records.map((r) => r.selectedMono))].map(
                  (mono) => (
                    <li
                      key={mono}
                      onClick={() => handleMonoSelect(mono)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {mono}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          <div ref={packageNoInputRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package No
            </label>
            <input
              type="text"
              value={packageNoSearch}
              onChange={(e) => {
                setPackageNoSearch(e.target.value);
                setShowPackageNoDropdown(true);
              }}
              onFocus={() => setShowPackageNoDropdown(true)}
              placeholder="Search Package No..."
              inputMode="numeric" // Numeric keyboard for mobile/tablet
              className="w-full p-2 border rounded"
            />
            {showPackageNoDropdown && packageNoSearch && records.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto border rounded bg-white absolute z-10">
                {[
                  ...new Set(
                    records.map((r) => r.package_no?.toString() || "N/A")
                  ),
                ].map((pkg) => (
                  <li
                    key={pkg}
                    onClick={() => handlePackageNoSelect(pkg)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {pkg}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div ref={empIdInputRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emp ID
            </label>
            <input
              type="text"
              value={empIdSearch}
              onChange={(e) => {
                setEmpIdSearch(e.target.value);
                setShowEmpIdDropdown(true);
              }}
              onFocus={() => setShowEmpIdDropdown(true)}
              placeholder="Search Emp ID..."
              className="w-full p-2 border rounded"
            />
            {showEmpIdDropdown && empIdSearch && records.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto border rounded bg-white absolute z-10">
                {[...new Set(records.map((r) => r.emp_id || "N/A"))].map(
                  (empId) => (
                    <li
                      key={empId}
                      onClick={() => handleEmpIdSelect(empId)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {empId}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {selectedMono && showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label>{t("bundle.color")}</label>
            <select
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setSize("");
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">{t("bundle.select_color")}</option>
              {colors.map((c) => (
                <option key={c.color} value={c.color}>
                  {c.color}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>{t("bundle.size")}</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!color}
            >
              <option value="">{t("bundle.select-size")}</option>
              {colors
                .find((c) => c.color === color)
                ?.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {filteredRecords.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-sky-100">
                <th className="p-2 border border-gray-300">{t("bundle.package_no")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.mono")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.color")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.size")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.style_no")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.line_no")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.date")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.time")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.emp_id")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.action")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.package_no || "N/A"}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    <button
                      onClick={() => handlePreviewQR(record)}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-100"
                    >
                      <FaQrcode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePrint(record)}
                      className="ml-2 text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-100"
                    >
                      <FaPrint className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.selectedMono}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.color}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.size}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.custStyle}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.lineNo}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.updated_date_seperator}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.updated_time_seperator}
                  </td>
                  <td className="p-2 border border-gray-300 text-center text-sm">
                    {record.emp_id || "N/A"}
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
        qrData={selectedRecords}
        onPrint={handlePrint}
        mode="production"
      />
    </div>
  );
}
