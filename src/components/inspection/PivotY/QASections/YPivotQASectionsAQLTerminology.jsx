import axios from "axios";
import {
  Calculator,
  CheckCircle,
  ChevronRight,
  FileSpreadsheet,
  Info,
  Layers,
  RefreshCw,
  Search,
  Table,
  XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsAQLTerminology = () => {
  const [loading, setLoading] = useState(true);
  const [sampleLettersRaw, setSampleLettersRaw] = useState([]);
  const [aqlValuesRaw, setAqlValuesRaw] = useState([]);

  // Calculator State
  const [calcData, setCalcData] = useState({
    InspectionType: "General",
    Level: "II",
    InspectedQty: "",
    AQLLevel: 1.0
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lettersRes, valuesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections/aql-sample-letters/get`),
          axios.get(`${API_BASE_URL}/api/qa-sections/aql-values/get`)
        ]);
        setSampleLettersRaw(lettersRes.data);
        setAqlValuesRaw(valuesRes.data);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to fetch AQL data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Prepare Data for Table 1: Sample Size Code Letters ---
  const table1Data = useMemo(() => {
    if (!sampleLettersRaw.length)
      return { rows: [], generalCols: [], specialCols: [] };

    // 1. Get Unique Batch Ranges (Rows) and sort them by Min value
    // We extract all batch objects from all documents to get a unique list
    const allBatches = sampleLettersRaw.flatMap((doc) => doc.BatchSize);
    const uniqueBatchMap = new Map();

    allBatches.forEach((b) => {
      if (!uniqueBatchMap.has(b.BatchName)) {
        uniqueBatchMap.set(b.BatchName, { name: b.BatchName, min: b.Min });
      }
    });

    const sortedRows = Array.from(uniqueBatchMap.values()).sort(
      (a, b) => a.min - b.min
    );

    // 2. Define Columns
    // Standard AQL usually has General (I, II, III) and Special (S-1 to S-4)
    const generalCols = ["I", "II", "III"];
    const specialCols = ["S-1", "S-2", "S-3", "S-4"];

    // 3. Build the Matrix
    const matrix = sortedRows.map((row) => {
      const rowData = { range: row.name };

      // Fill General
      generalCols.forEach((lvl) => {
        const doc = sampleLettersRaw.find(
          (d) => d.InspectionType === "General" && d.Level === lvl
        );
        const batch = doc?.BatchSize.find((b) => b.BatchName === row.name);
        rowData[`G_${lvl}`] = batch?.SampleLetter || "-";
      });

      // Fill Special
      specialCols.forEach((lvl) => {
        const doc = sampleLettersRaw.find(
          (d) => d.InspectionType === "Special" && d.Level === lvl
        );
        const batch = doc?.BatchSize.find((b) => b.BatchName === row.name);
        rowData[`S_${lvl}`] = batch?.SampleLetter || "-";
      });

      return rowData;
    });

    return { rows: matrix, generalCols, specialCols };
  }, [sampleLettersRaw]);

  // --- Prepare Data for Table 2: Single Sampling Plans ---
  const table2Data = useMemo(() => {
    if (!aqlValuesRaw.length) return { rows: [], aqlHeaders: [] };

    // Sort rows by Sample Size
    const sortedRows = [...aqlValuesRaw].sort(
      (a, b) => a.SampleSize - b.SampleSize
    );

    // Extract AQL Level Headers from the first valid record (assuming all have same structure)
    // We filter to ensure we only get levels that actually exist
    const referenceData = sortedRows[0]?.AQLData || [];
    const aqlHeaders = referenceData
      .map((d) => d.AQLLevel)
      .sort((a, b) => a - b);

    return { rows: sortedRows, aqlHeaders };
  }, [aqlValuesRaw]);

  // --- Calculator Logic ---
  const handleCalculate = async () => {
    if (!calcData.InspectedQty || Number(calcData.InspectedQty) <= 0) {
      Swal.fire("Validation", "Please enter a valid Inspected Qty", "warning");
      return;
    }

    setCalcLoading(true);
    setCalcResult(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/aql/calculate`,
        calcData
      );
      setCalcResult(response.data.data);
    } catch (error) {
      Swal.fire(
        "Calculation Error",
        error.response?.data?.message || "Failed to calculate AQL",
        "error"
      );
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading AQL Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ==========================================
          TABLE 1: SAMPLE SIZE CODE LETTERS
      ========================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-red-700 to-red-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Table size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">
              Table I: Sample Size Code Letters
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th
                  rowSpan="2"
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 bg-red-50 dark:bg-red-900/20 w-48"
                >
                  Lot or Batch Size
                </th>
                <th
                  colSpan={table1Data.generalCols.length}
                  className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white bg-gray-800 border-r border-gray-600"
                >
                  General Inspection Levels
                </th>
                <th
                  colSpan={table1Data.specialCols.length}
                  className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white bg-gray-800"
                >
                  Special Inspection Levels
                </th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-600">
                {/* General Headers */}
                {table1Data.generalCols.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-center text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600"
                  >
                    {col}
                  </th>
                ))}
                {/* Special Headers */}
                {table1Data.specialCols.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-center text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {table1Data.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700/50"
                  } hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                >
                  <td className="px-4 py-2 text-sm font-semibold text-white bg-red-700 dark:bg-red-800 border-r border-gray-300 dark:border-gray-600 whitespace-nowrap">
                    {row.range}
                  </td>
                  {/* General Data */}
                  {table1Data.generalCols.map((col) => (
                    <td
                      key={`G_${col}`}
                      className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                    >
                      {row[`G_${col}`]}
                    </td>
                  ))}
                  {/* Special Data */}
                  {table1Data.specialCols.map((col) => (
                    <td
                      key={`S_${col}`}
                      className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                    >
                      {row[`S_${col}`]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          TABLE 2: SINGLE SAMPLING PLANS
      ========================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">
              Table II: Single Sampling Plans for Normal Inspection
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {/* Fixed Columns Header */}
                <th
                  rowSpan="2"
                  className="px-2 py-2 bg-yellow-500 text-white text-xs font-bold uppercase border border-gray-300 w-16"
                >
                  Sample Code
                </th>
                <th
                  rowSpan="2"
                  className="px-2 py-2 bg-cyan-500 text-white text-xs font-bold uppercase border border-gray-300 w-16"
                >
                  Sample Size
                </th>
                {/* AQL Levels Header */}
                <th
                  colSpan={table2Data.aqlHeaders.length}
                  className="px-2 py-2 bg-gray-700 text-white text-sm font-bold uppercase border border-gray-300"
                >
                  Acceptance Quality Limit (AQL)
                </th>
              </tr>
              <tr className="bg-gray-200 dark:bg-gray-600">
                {table2Data.aqlHeaders.map((lvl) => (
                  <th
                    key={lvl}
                    className="px-1 py-1 text-center border border-gray-400 min-w-[50px]"
                  >
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {lvl}
                    </div>
                    <div className="grid grid-cols-2 text-[10px] font-semibold text-gray-600 dark:text-gray-300 border-t border-gray-400 pt-0.5">
                      <span>Ac</span>
                      <span>Re</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table2Data.rows.map((row, rowIndex) => (
                <tr
                  key={row._id}
                  className={`${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-yellow-50 transition-colors`}
                >
                  <td className="text-center font-bold text-sm bg-yellow-100 dark:bg-yellow-700 border border-gray-300 py-2">
                    {row.SampleLetter}
                  </td>
                  <td className="text-center font-bold text-sm bg-cyan-100 dark:bg-cyan-700 border border-gray-300 py-2">
                    {row.SampleSize}
                  </td>
                  {/* Loop through each column header to find matching AQL Data */}
                  {table2Data.aqlHeaders.map((lvl) => {
                    const cellData = row.AQLData.find(
                      (d) => d.AQLLevel === lvl
                    );
                    return (
                      <td
                        key={lvl}
                        className="border border-gray-300 p-0 h-full"
                      >
                        <div className="grid grid-cols-2 h-full">
                          <div className="text-center text-xs py-2 border-r border-gray-200 font-medium text-gray-700">
                            {cellData ? cellData.Ac : "-"}
                          </div>
                          <div className="text-center text-xs py-2 font-medium text-gray-700">
                            {cellData ? cellData.Re : "-"}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          CALCULATOR SECTION
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Calculator size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Test AQL Results</h2>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Inspection Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Inspection Type
              </label>
              <div className="relative">
                <Layers
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={calcData.InspectionType}
                  onChange={(e) =>
                    setCalcData({ ...calcData, InspectionType: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="General">General Inspection</option>
                  <option value="Special">Special Inspection</option>
                </select>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Level
              </label>
              <div className="relative">
                <Info
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={calcData.Level}
                  onChange={(e) =>
                    setCalcData({ ...calcData, Level: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {calcData.InspectionType === "General" ? (
                    <>
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                    </>
                  ) : (
                    <>
                      <option value="S-1">S-1</option>
                      <option value="S-2">S-2</option>
                      <option value="S-3">S-3</option>
                      <option value="S-4">S-4</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Qty & AQL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Inspected Qty
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={calcData.InspectedQty}
                    onChange={(e) =>
                      setCalcData({ ...calcData, InspectedQty: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  AQL Level
                </label>
                <select
                  value={calcData.AQLLevel}
                  onChange={(e) =>
                    setCalcData({ ...calcData, AQLLevel: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {table2Data.aqlHeaders.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={calcLoading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              {calcLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />{" "}
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator size={18} /> Calculate Result
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Display */}
        <div className="lg:col-span-7">
          {calcResult ? (
            <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    Result Summary
                  </h2>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-center items-center gap-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl border border-blue-100 dark:border-gray-600 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Sample Code
                    </span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {calcResult.SampleLetter}
                    </span>
                  </div>
                  <div className="bg-green-50 dark:bg-gray-700 p-4 rounded-xl border border-green-100 dark:border-gray-600 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Sample Size
                    </span>
                    <span className="text-2xl font-black text-green-600 dark:text-green-400">
                      {calcResult.SampleSize}
                    </span>
                  </div>
                  <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-xl border border-purple-100 dark:border-gray-600 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      AQL Level
                    </span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {calcResult.AQLLevel}
                    </span>
                  </div>
                </div>

                {/* Ac / Re Big Display */}
                <div className="flex items-center gap-8 bg-gray-50 dark:bg-gray-900 px-10 py-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <span className="block text-sm font-bold text-gray-500 mb-1">
                      Accept (Ac)
                    </span>
                    <span className="text-5xl font-black text-green-500">
                      {calcResult.Ac}
                    </span>
                  </div>
                  <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="text-center">
                    <span className="block text-sm font-bold text-gray-500 mb-1">
                      Reject (Re)
                    </span>
                    <span className="text-5xl font-black text-red-500">
                      {calcResult.Re}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 w-full">
                  <p className="text-center text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                    Inspector decided to select{" "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {calcResult.InspectionType} Inspection
                    </span>{" "}
                    with Level{" "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {calcResult.Level}
                    </span>
                    .
                    <br />
                    For an Inspection Qty of{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {calcResult.InspectedQty}
                    </span>{" "}
                    and AQL Level{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {calcResult.AQLLevel}
                    </span>
                    , the Maximum Accepted Pcs are{" "}
                    <span className="font-bold text-green-600">
                      {calcResult.Ac}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
                <Search size={32} className="text-indigo-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500">
                Awaiting Calculation
              </h3>
              <p className="text-sm text-center mt-2 max-w-xs">
                Enter the inspection details on the left and click calculate to
                see the Sampling Plan results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YPivotQASectionsAQLTerminology;
