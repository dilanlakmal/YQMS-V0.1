import axios from "axios";
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Filter as FilterIcon,
  Hash,
  Loader2,
  RefreshCw,
  Ruler,
  ShieldQuestion,
  UserCircle2
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";

// Reusable Helper Components
const getFacePhotoUrl = (facePhotoPath) => {
  if (!facePhotoPath) return null;
  if (facePhotoPath.startsWith("http")) return facePhotoPath;
  if (facePhotoPath.startsWith("/storage/"))
    return `${API_BASE_URL}${facePhotoPath}`;
  try {
    const apiOrigin = new URL(API_BASE_URL).origin;
    return `${apiOrigin}${facePhotoPath}`;
  } catch (e) {
    return facePhotoPath;
  }
};

const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00 AM" },
  { key: "09:00", label: "09.00 AM" },
  { key: "12:00", label: "12.00 PM" },
  { key: "14:00", label: "02.00 PM" },
  { key: "16:00", label: "04.00 PM" },
  { key: "18:00", label: "06.00 PM" }
];

const OperatorCell = ({ operatorData }) => {
  if (!operatorData || !operatorData.emp_id)
    return <span className="text-slate-400 italic">N/A</span>;
  const imageUrl = getFacePhotoUrl(operatorData.emp_face_photo);
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-1">
      <div className="font-medium text-slate-700 text-xs">
        {operatorData.emp_id}
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={operatorData.emp_eng_name}
          className="w-10 h-10 rounded-full object-cover border"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <UserCircle2 className="w-10 h-10 text-slate-300" />
      )}
      <div
        className="text-[10px] text-slate-500 truncate w-full max-w-[100px]"
        title={operatorData.emp_eng_name || "N/A"}
      >
        {operatorData.emp_eng_name || "N/A"}
      </div>
    </div>
  );
};

const FinalElasticReports = () => {
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmpId, setSelectedEmpId] = useState("All");
  const [selectedMoNo, setSelectedMoNo] = useState("All");
  const [selectedMachineNo, setSelectedMachineNo] = useState("All");

  const [reportData, setReportData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ empIds: [], moNos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const machineNoOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => String(i + 1)),
    []
  );

  const fetchConsolidatedReport = useCallback(
    async (date, empId, moNo, machineNo) => {
      setLoading(true);
      setError(null);
      try {
        // Backend for elastic expects YYYY-MM-DD
        const formattedDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/final-report/elastic`,
          {
            params: { date: formattedDate, empId, moNo, machineNo }
          }
        );
        setReportData(response.data.elasticReport || []);
        if (empId === "All" && moNo === "All" && machineNo === "All") {
          setFilterOptions(
            response.data.filterOptions || { empIds: [], moNos: [] }
          );
        }
      } catch (err) {
        setError(t("scc.finalReports.fetchError"));
        setReportData([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchConsolidatedReport(
      selectedDate,
      selectedEmpId,
      selectedMoNo,
      selectedMachineNo
    );
  }, [
    selectedDate,
    selectedEmpId,
    selectedMoNo,
    selectedMachineNo,
    fetchConsolidatedReport
  ]);

  const handleClearFilters = () => {
    setSelectedEmpId("All");
    setSelectedMoNo("All");
    setSelectedMachineNo("All");
  };

  const sortByMachineNo = (data) => {
    if (!data) return [];
    return [...data].sort((a, b) =>
      a.machineNo.localeCompare(b.machineNo, undefined, { numeric: true })
    );
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-sm text-slate-600">
          SCC - Elastic Daily Reports | {selectedDate.toLocaleDateString()} |{" "}
          {selectedEmpId === "All" ? "All EMP" : selectedEmpId} |{" "}
          {selectedMachineNo === "All"
            ? "All Machines"
            : `Machine ${selectedMachineNo}`}{" "}
          | {selectedMoNo === "All" ? "All MOs" : selectedMoNo}
        </p>
      </div>

      <div className="p-4 mb-6 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label
              htmlFor="reportDate"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.date")}
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="MM/dd/yyyy"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              id="reportDate"
            />
          </div>
          <div>
            <label
              htmlFor="empIdFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.operatorId", "Operator ID")}
            </label>
            <select
              id="empIdFilter"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All Operators</option>
              {filterOptions.empIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="moNoFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.moNo")}
            </label>
            <select
              id="moNoFilter"
              value={selectedMoNo}
              onChange={(e) => setSelectedMoNo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All MO Nos</option>
              {filterOptions.moNos.map((mo) => (
                <option key={mo} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="machineNoFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.machineNo")}
            </label>
            <select
              id="machineNoFilter"
              value={selectedMachineNo}
              onChange={(e) => setSelectedMachineNo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All Machines</option>
              {machineNoOptions.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
            >
              <RefreshCw size={16} className="mr-2" />
              {t("scc.clearFilters")}
            </button>
          </div>
        </div>
      </div>

      <section className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
          <BookOpen className="mr-3 text-indigo-600" />
          {t(
            "scc.finalReports.elasticCheckingTitle",
            "Daily Elastic Checking Reports"
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 mb-4 p-2 bg-slate-50 rounded-md">
          <strong>Legend:</strong>
          <span className="flex items-center">
            <Hash size={12} className="mr-1 text-blue-500" />
            Checked Qty
          </span>
          <span className="flex items-center">
            <ClipboardList size={12} className="mr-1 text-red-500" />
            Defect Qty
          </span>
          <span className="flex items-center">
            <Ruler size={12} className="mr-1 text-green-500" />
            Measurement
          </span>
          <span className="flex items-center">
            <ShieldQuestion size={12} className="mr-1 text-orange-500" />
            Quality
          </span>
        </div>

        <div className="overflow-x-auto pretty-scrollbar">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 border border-slate-300">Machine No</th>
                <th className="p-2 border border-slate-300">Operator</th>
                <th className="p-2 border border-slate-300">MO No</th>
                <th className="p-2 border border-slate-300">Color</th>
                <th className="p-2 border border-slate-300">Total Checked</th>
                <th className="p-2 border border-slate-300">Total Defects</th>
                <th className="p-2 border border-slate-300">Defect Details</th>
                <th className="p-2 border border-slate-300">Defect Rate</th>
                <th className="p-2 border border-slate-300">
                  Measurement Summary
                </th>
                <th
                  className="p-2 border border-slate-300"
                  style={{ minWidth: "450px" }}
                >
                  Time Slot Results
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-10 text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="10"
                    className="p-10 text-center text-red-600 bg-red-100"
                  >
                    {error}
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                sortByMachineNo(reportData).map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 text-center align-middle font-medium">
                      {row.machineNo}
                    </td>
                    <td className="p-2 border border-slate-300 align-middle">
                      <OperatorCell operatorData={row.operatorData} />
                    </td>
                    <td className="p-2 border border-slate-300 text-center align-middle">
                      {row.moNo}
                    </td>
                    <td className="p-2 border border-slate-300 text-center align-middle">
                      {row.color}
                    </td>
                    <td className="p-2 border border-slate-300 text-center align-middle font-bold">
                      {row.totalCheckedQty}
                    </td>
                    <td className="p-2 border border-slate-300 text-center align-middle font-bold text-red-600">
                      {row.totalDefectsQty}
                    </td>
                    <td className="p-2 border border-slate-300 align-top text-xs">
                      {Object.entries(row.defectSummary).map(([name, qty]) => (
                        <div key={name}>
                          {name}: {qty}
                        </div>
                      ))}
                    </td>
                    <td
                      className={`p-2 border border-slate-300 text-center align-middle font-semibold ${
                        row.totalDefectRate > 0
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >{`${(row.totalDefectRate * 100).toFixed(2)}%`}</td>
                    <td className="p-2 border border-slate-300 text-center align-middle font-semibold">
                      {row.measurementSummary}
                    </td>
                    <td className="p-2 border border-slate-300 align-top">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {TIME_SLOTS_CONFIG.map((slot) => {
                          const inspection = row.inspections.find(
                            (insp) => insp.timeSlotKey === slot.key
                          );
                          return (
                            <div
                              key={slot.key}
                              className="p-1.5 border rounded bg-slate-50 text-xs space-y-1"
                            >
                              <div className="font-bold text-slate-800 text-center">
                                {slot.label}
                              </div>
                              {inspection ? (
                                <>
                                  <div className="flex items-center">
                                    <Hash
                                      size={12}
                                      className="mr-1.5 text-blue-500"
                                    />{" "}
                                    Qty: {inspection.checkedQty}
                                  </div>
                                  <div className="flex items-center">
                                    <ClipboardList
                                      size={12}
                                      className="mr-1.5 text-red-500"
                                    />{" "}
                                    Defects: {inspection.totalDefectQty}
                                  </div>
                                  <div
                                    className={`flex items-center font-medium ${
                                      inspection.measurement === "Pass"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    <Ruler size={12} className="mr-1.5" />{" "}
                                    {inspection.measurement}
                                  </div>
                                  <div
                                    className={`flex items-center font-medium ${
                                      inspection.qualityIssue === "Pass"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    <ShieldQuestion
                                      size={12}
                                      className="mr-1.5"
                                    />{" "}
                                    {inspection.qualityIssue}
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400 italic block text-center">
                                  No Data
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="p-4 text-center text-slate-500 italic"
                  >
                    {t("scc.finalReports.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FinalElasticReports;
