import axios from "axios";
import {
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Filter as FilterIcon,
  Loader2,
  RefreshCw,
  Thermometer,
  UserCircle2,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";

// Helper to get image URL (kept for Operator photos)
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

// Reusable Cell Components
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

const SpecsCell = ({ temp, time }) => (
  <div className="text-xs space-y-1 text-left min-w-[100px]">
    <div className="flex items-center">
      <Thermometer size={12} className="mr-1.5 text-red-500" />
      T: {temp ?? "N/A"}°C
    </div>
    <div className="flex items-center">
      <Clock size={12} className="mr-1.5 text-blue-500" />
      t: {time ?? "N/A"}s
    </div>
  </div>
);

const TimeSlotSpecsCell = ({ icon, label, actual, required }) => {
  const isPass = () => {
    if (
      actual === null ||
      actual === undefined ||
      required === null ||
      required === undefined
    )
      return null;
    return Number(actual) === Number(required);
  };
  const status = isPass();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {icon}
        {label}: {actual ?? "N/A"}
      </div>
      {status !== null &&
        (status ? (
          <Check size={14} className="text-green-600 font-bold" />
        ) : (
          <X size={14} className="text-red-600 font-bold" />
        ))}
    </div>
  );
};

const FinalFUReports = () => {
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmpId, setSelectedEmpId] = useState("All");
  const [selectedMoNo, setSelectedMoNo] = useState("All");
  const [selectedMachineNo, setSelectedMachineNo] = useState("All");

  const [reportData, setReportData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ empIds: [], moNos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const machineNoOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(3, "0")),
    []
  );

  const fetchConsolidatedReport = useCallback(
    async (date, empId, moNo, machineNo) => {
      setLoading(true);
      setError(null);
      try {
        const formattedDate = `${
          date.getMonth() + 1
        }/${date.getDate()}/${date.getFullYear()}`;
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/final-report/fu`,
          {
            params: { date: formattedDate, empId, moNo, machineNo }
          }
        );
        setReportData(response.data);
        if (empId === "All" && moNo === "All" && machineNo === "All") {
          setFilterOptions(
            response.data.filterOptions || { empIds: [], moNos: [] }
          );
        }
      } catch (err) {
        setError(
          t(
            "scc.finalReports.fetchError",
            "Failed to fetch consolidated report."
          )
        );
        setReportData(null);
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

  const renderTable = (titleKey, data, columns) => (
    <section className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <BookOpen className="mr-3 text-indigo-600" />
        {t(titleKey)}
      </h2>
      <div className="overflow-x-auto pretty-scrollbar">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 border border-slate-300 text-left font-semibold text-slate-600"
                  style={col.style || {}}
                >
                  {t(col.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={`${col.key}-${rowIndex}`}
                      className="p-2 border border-slate-300 align-top"
                      style={col.style || {}}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
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
  );

  const firstOutputColumns = [
    {
      key: "machineNo",
      label: "scc.machineNo",
      render: (row) => row.machineNo
    },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "operatorData",
      label: "scc.operatorData",
      render: (row) => <OperatorCell operatorData={row.operatorData} />
    },
    {
      key: "specs",
      label: "scc.specs",
      render: (row) => (
        <SpecsCell temp={row.specs.tempC} time={row.specs.timeSec} />
      )
    }
  ];

  const machineCalibColumns = [
    {
      key: "machineNo",
      label: "scc.machineNo",
      render: (row) => row.machineNo
    },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    {
      key: "buyer",
      label: "scc.buyer",
      style: { minWidth: "100px" },
      render: (row) => row.buyer
    },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "operatorData",
      label: "scc.operatorData",
      render: (row) => <OperatorCell operatorData={row.operatorData} />
    },
    {
      key: "specs",
      label: "scc.specs",
      render: (row) => (
        <SpecsCell temp={row.baseReqTemp} time={row.baseReqTime} />
      )
    },
    {
      key: "timeSlots",
      label: "scc.timeSlotResults",
      style: { minWidth: "400px" },
      render: (row) => (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {TIME_SLOTS_CONFIG.map((slot) => {
            const inspection = row.inspections.find(
              (insp) => insp.timeSlotKey === slot.key
            );
            if (!inspection) {
              return (
                <div key={slot.key} className="p-1 border rounded bg-slate-100">
                  <div className="font-bold text-slate-700 text-[11px]">
                    {slot.label}
                  </div>
                  <span className="text-xs text-slate-400 italic">No Data</span>
                </div>
              );
            }
            const tempIsPass =
              Number(inspection.temp_actual) === Number(row.baseReqTemp); // FU has specific tolerance logic in its daily form, but here we simplify
            const timeIsPass =
              Number(inspection.time_actual) === Number(row.baseReqTime);
            const isOverallFail = !tempIsPass || !timeIsPass;
            const bgColor = isOverallFail ? "bg-red-50" : "bg-green-50";
            return (
              <div
                key={slot.key}
                className={`p-1.5 border rounded ${bgColor} text-xs space-y-1`}
              >
                <div className="font-bold text-slate-800 text-[11px]">
                  {slot.label}
                </div>
                <TimeSlotSpecsCell
                  icon={
                    <Thermometer size={12} className="mr-1.5 text-red-500" />
                  }
                  label="T"
                  actual={inspection.temp_actual}
                  required={row.baseReqTemp}
                />
                <TimeSlotSpecsCell
                  icon={<Clock size={12} className="mr-1.5 text-blue-500" />}
                  label="t"
                  actual={inspection.time_actual}
                  required={row.baseReqTime}
                />
              </div>
            );
          })}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-sm text-slate-600">
          SCC - FU Daily Reports | {selectedDate.toLocaleDateString()} |{" "}
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
              {t("scc.empId")}
            </label>
            <select
              id="empIdFilter"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All EMP IDs</option>
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

      {loading && (
        <div className="text-center p-10">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
        </div>
      )}
      {error && (
        <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && reportData && (
        <div className="space-y-8">
          {renderTable(
            "scc.finalReports.firstOutputFUTitle",
            sortByMachineNo(reportData.firstOutput),
            firstOutputColumns
          )}
          {renderTable(
            "scc.finalReports.machineCalibFUTitle",
            sortByMachineNo(reportData.machineCalibration),
            machineCalibColumns
          )}
        </div>
      )}
    </div>
  );
};

export default FinalFUReports;
