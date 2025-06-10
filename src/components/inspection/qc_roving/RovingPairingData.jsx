import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  CheckCircle,
  XCircle,
  PackageCheck,
  Ruler,
  Wrench,
  RefreshCw,
  Loader,
  Info
} from "lucide-react";

const RovingPairingData = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    date: new Date(),
    qcId: user?.emp_id || "",
    operatorId: "",
    lineNo: "",
    moNo: ""
  });

  const [filterOptions, setFilterOptions] = useState({
    qcIds: [],
    operatorIds: [],
    lineNos: [],
    moNos: []
  });

  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    accessory: true,
    measurements: true,
    defects: true
  });

  const formatDateForAPI = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const fetchFilterOptions = useCallback(
    async (selectedDate) => {
      if (!selectedDate) return;
      try {
        const formattedDate = formatDateForAPI(selectedDate);
        const response = await axios.get(
          `${API_BASE_URL}/api/roving-pairing/filters`,
          {
            params: { date: formattedDate }
          }
        );
        setFilterOptions(response.data);
        if (user?.emp_id && !response.data.qcIds.includes(user.emp_id)) {
          setFilterOptions((prev) => ({
            ...prev,
            qcIds: [user.emp_id, ...prev.qcIds].sort()
          }));
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    },
    [user.emp_id]
  );

  useEffect(() => {
    fetchFilterOptions(filters.date);
  }, [fetchFilterOptions, filters.date]);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        date: formatDateForAPI(filters.date),
        qcId: filters.qcId,
        operatorId: filters.operatorId,
        lineNo: filters.lineNo,
        moNo: filters.moNo
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/roving-pairing/report-data`,
        { params }
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    if (field === "date") {
      newFilters.qcId = user?.emp_id || "";
      newFilters.operatorId = "";
      newFilters.lineNo = "";
      newFilters.moNo = "";
      fetchFilterOptions(value);
    }
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      date: new Date(),
      qcId: user?.emp_id || "",
      operatorId: "",
      lineNo: "",
      moNo: ""
    };
    setFilters(clearedFilters);
    fetchFilterOptions(clearedFilters.date);
  };

  const handleColumnVisibilityChange = (column) => {
    if (column === "all") {
      const areAllVisible = Object.values(visibleColumns).every((v) => v);
      setVisibleColumns({
        accessory: !areAllVisible,
        measurements: !areAllVisible,
        defects: !areAllVisible
      });
    } else {
      setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
    }
  };

  const inspectionReps = [
    "1st Inspection",
    "2nd Inspection",
    "3rd Inspection",
    "4th Inspection",
    "5th Inspection"
  ];

  const Legend = () => (
    <div className="p-4 mb-4 bg-gray-50 border rounded-lg text-sm text-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Info size={20} className="text-blue-500" />
        <h3 className="font-semibold text-base text-gray-800">
          Legend & Meanings
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <p className="font-semibold">Format:</p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              13/15
            </span>{" "}
            = Total Pass / Total Parts
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Abbreviations:</p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              T
            </span>{" "}
            = Measurement Total Rejects
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              N
            </span>{" "}
            = Measurement Negative Rejects
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              P
            </span>{" "}
            = Measurement Positive Rejects
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              TR
            </span>{" "}
            = Defect Total Rejected Parts
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              Q
            </span>{" "}
            = Defect Total Quantity
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Roving Pairing Inspection Data
        </h2>

        {/* Filter Pane */}
        <div className="p-4 bg-white rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <DatePicker
                selected={filters.date}
                onChange={(date) => handleFilterChange("date", date)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                QC ID
              </label>
              <select
                value={filters.qcId}
                onChange={(e) => handleFilterChange("qcId", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All QC IDs</option>
                {filterOptions.qcIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Operator ID
              </label>
              <select
                value={filters.operatorId}
                onChange={(e) =>
                  handleFilterChange("operatorId", e.target.value)
                }
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Operators</option>
                {filterOptions.operatorIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Line No
              </label>
              <select
                value={filters.lineNo}
                onChange={(e) => handleFilterChange("lineNo", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Lines</option>
                {filterOptions.lineNos.map((no) => (
                  <option key={no} value={no}>
                    {no}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MO No
              </label>
              <select
                value={filters.moNo}
                onChange={(e) => handleFilterChange("moNo", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All MOs</option>
                {filterOptions.moNos.map((no) => (
                  <option key={no} value={no}>
                    {no}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="w-full bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-baseline gap-6 mb-4 text-gray-600">
          <p>
            <strong>Operation Name:</strong> Pairing (ការផ្គូផ្គង)
          </p>
          <p>
            <strong>Operation No:</strong> 7
          </p>
        </div>

        <Legend />

        <div className="p-4 bg-white rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-x-6 gap-y-2">
            <h4 className="font-semibold text-gray-700">Show Columns:</h4>
            {Object.keys(visibleColumns).map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col]}
                  onChange={() => handleColumnVisibilityChange(col)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={Object.values(visibleColumns).every((v) => v)}
                onChange={() => handleColumnVisibilityChange("all")}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Select All
            </label>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-200 z-10">
              <tr>
                <th
                  rowSpan="2"
                  className="p-2 border border-gray-300 text-sm font-semibold text-gray-700 align-middle"
                >
                  Line No
                </th>
                <th
                  rowSpan="2"
                  className="p-2 border border-gray-300 text-sm font-semibold text-gray-700 align-middle"
                >
                  MO No
                </th>
                <th
                  rowSpan="2"
                  className="p-2 border border-gray-300 text-sm font-semibold text-gray-700 align-middle"
                >
                  Operator ID
                </th>
                {inspectionReps.map((rep) => (
                  <th
                    key={rep}
                    colSpan={
                      Object.values(visibleColumns).filter((v) => v).length
                    }
                    className="p-2 border border-gray-300 text-sm font-semibold text-gray-700"
                  >
                    {rep}
                  </th>
                ))}
              </tr>
              <tr>
                {inspectionReps.map((rep) => (
                  <React.Fragment key={`${rep}-sub`}>
                    {visibleColumns.accessory && (
                      <th className="p-2 border border-gray-300 bg-gray-100">
                        <PackageCheck
                          title="Accessory"
                          size={18}
                          className="mx-auto text-gray-600"
                        />
                      </th>
                    )}
                    {visibleColumns.measurements && (
                      <th className="p-2 border border-gray-300 bg-gray-100">
                        <Ruler
                          title="Measurements"
                          size={18}
                          className="mx-auto text-gray-600"
                        />
                      </th>
                    )}
                    {visibleColumns.defects && (
                      <th className="p-2 border border-gray-300 bg-gray-100">
                        <Wrench
                          title="Defects"
                          size={18}
                          className="mx-auto text-gray-600"
                        />
                      </th>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={
                      3 +
                      5 * Object.values(visibleColumns).filter((v) => v).length
                    }
                    className="text-center py-10"
                  >
                    <Loader className="animate-spin inline-block text-blue-500" />
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      3 +
                      5 * Object.values(visibleColumns).filter((v) => v).length
                    }
                    className="text-center py-10 text-gray-500"
                  >
                    No data found for the selected filters.
                  </td>
                </tr>
              ) : (
                // **** START: THE ONLY CORRECTION IS HERE in the tbody map ****
                reportData.map((row, rowIndex) => (
                  <tr
                    key={`${row.operatorId}-${row.lineNo}-${row.moNo}-${rowIndex}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="p-2 border border-gray-300 text-sm text-center font-medium">
                      {row.lineNo}
                    </td>
                    <td className="p-2 border border-gray-300 text-sm text-center font-medium">
                      {row.moNo}
                    </td>
                    <td className="p-2 border border-gray-300 text-sm text-center font-medium">
                      {row.operatorId}
                    </td>

                    {inspectionReps.map((repName) => {
                      const inspection = row.inspections.find(
                        (insp) => insp.rep_name === repName
                      );
                      const summary = inspection?.totalSummary;

                      const accessoryCell = (
                        <td
                          className={`p-2 border border-gray-300 text-center ${
                            !inspection
                              ? "bg-gray-200"
                              : inspection.accessoryComplete === "Yes"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {inspection &&
                            (inspection.accessoryComplete === "Yes" ? (
                              <CheckCircle
                                className="text-green-600 mx-auto"
                                size={20}
                              />
                            ) : (
                              <XCircle
                                className="text-red-600 mx-auto"
                                size={20}
                              />
                            ))}
                        </td>
                      );

                      const measurementCell = (
                        <td
                          className={`p-2 border border-gray-300 text-center text-xs ${
                            !summary
                              ? "bg-gray-200"
                              : summary.measurementTotalRejects > 0
                              ? "bg-red-100"
                              : "bg-green-100"
                          }`}
                        >
                          {summary && (
                            <div>
                              <div className="font-bold">
                                {summary.totalPass ?? 0}/
                                {summary.totalParts ?? 0}
                              </div>
                              <div>
                                (T:{summary.measurementTotalRejects ?? 0}, N:
                                {summary.measurementNegativeRejects ?? 0}, P:
                                {summary.measurementPositiveRejects ?? 0})
                              </div>
                            </div>
                          )}
                        </td>
                      );

                      const defectCell = (
                        <td
                          className={`p-2 border border-gray-300 text-center text-xs ${
                            !summary
                              ? "bg-gray-200"
                              : summary.defectTotalRejectedParts > 0 ||
                                summary.defectTotalQty > 0
                              ? "bg-red-100"
                              : "bg-green-100"
                          }`}
                        >
                          {summary && (
                            <div>
                              <div className="font-bold">
                                {summary.totalPass ?? 0}/
                                {summary.totalParts ?? 0}
                              </div>
                              <div>
                                (TR:{summary.defectTotalRejectedParts ?? 0}, Q:
                                {summary.defectTotalQty ?? 0})
                              </div>
                            </div>
                          )}
                        </td>
                      );

                      return (
                        <React.Fragment key={repName}>
                          {visibleColumns.accessory && accessoryCell}
                          {visibleColumns.measurements && measurementCell}
                          {visibleColumns.defects && defectCell}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
                // **** END: CORRECTION ****
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RovingPairingData;
