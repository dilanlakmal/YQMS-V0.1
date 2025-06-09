import axios from "axios";
import { Award, Table as TableIcon, TrendingUp } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config"; // Ensure this path is correct
import AuditHeader from "./AuditHeader"; // Ensure this path is correct
import AuditLegend from "./AuditLegend"; // Ensure this path is correct
import AuditTable from "./AuditTable"; // Ensure this path is correct

// Helper: Initialize ONLY the INTERACTIVE SHELL.
const initializeInteractiveAuditItemShell = (staticRequirementFromDB) => {
  const level = parseInt(staticRequirementFromDB.levelValue, 10) || 0;
  const initialOk = true; // Default to OK
  const initialScore = initialOk ? level : 0;

  return {
    staticData: staticRequirementFromDB,
    ok: initialOk,
    toImprove: false,
    na: false,
    observationData: {
      text: "",
      isTable: false,
      table: { rows: 2, cols: 2, data: [] }
    },
    images: [],
    mustHave: staticRequirementFromDB.mustHave,
    score: initialScore,
    naScore: 0,
    uniqueId: staticRequirementFromDB._id || staticRequirementFromDB.no
  };
};

const ScoreCard = ({ title, value, icon, colorClass = "bg-blue-500" }) => (
  <div className={`p-4 rounded-lg shadow-md text-white ${colorClass}`}>
    <div className="flex items-center mb-2">
      {icon && React.cloneElement(icon, { size: 20, className: "mr-2" })}
      <h4 className="text-sm font-semibold">{title}</h4>
    </div>
    <p className="text-2xl font-bold text-center">{value}</p>
  </div>
);

const AdditionalCommentsTableInput = ({
  rows,
  cols,
  data = [],
  onChange,
  sectionEnabled
}) => {
  const [tableData, setTableData] = useState(data);
  useEffect(() => {
    const initialData = Array(rows)
      .fill(null)
      .map((_, rIndex) =>
        Array(cols)
          .fill(null)
          .map((__, cIndex) => (data[rIndex] && data[rIndex][cIndex]) || "")
      );
    setTableData(initialData);
  }, [rows, cols, data]);

  const handleCellChange = (rIndex, cIndex, value) => {
    if (!sectionEnabled) return;
    const newData = tableData.map((row, rowIndex) =>
      rowIndex === rIndex
        ? row.map((cell, colIndex) => (colIndex === cIndex ? value : cell))
        : row
    );
    setTableData(newData);
    onChange(newData);
  };
  if (rows < 1 || cols < 1) return null;
  return (
    <div className="overflow-x-auto my-1">
      <table className="min-w-full border-collapse text-xs">
        <tbody>
          {Array(rows)
            .fill(null)
            .map((_, rIndex) => (
              <tr key={rIndex}>
                {Array(cols)
                  .fill(null)
                  .map((_, cIndex) => (
                    <td key={cIndex} className="border border-gray-300 p-0.5">
                      <input
                        type="text"
                        value={tableData[rIndex]?.[cIndex] || ""}
                        onChange={(e) =>
                          handleCellChange(rIndex, cIndex, e.target.value)
                        }
                        className={`w-full p-0.5 text-xs bg-white ${
                          !sectionEnabled
                            ? "cursor-not-allowed bg-gray-100"
                            : "focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                        }`}
                        disabled={!sectionEnabled}
                      />
                    </td>
                  ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

const QMSAudit = () => {
  const { t, i18n } = useTranslation();
  const [auditItems, setAuditItems] = useState([]);
  const [rawStaticSectionData, setRawStaticSectionData] = useState(null);
  const [sectionTitleForDisplay, setSectionTitleForDisplay] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sectionEnabled, setSectionEnabled] = useState(true);
  const [additionalCommentsText, setAdditionalCommentsText] = useState("");
  const [showAdditionalCommentsTable, setShowAdditionalCommentsTable] =
    useState(false);
  const [additionalCommentsTableRows, setAdditionalCommentsTableRows] =
    useState(2);
  const [additionalCommentsTableCols, setAdditionalCommentsTableCols] =
    useState(2);
  const [additionalCommentsTableData, setAdditionalCommentsTableData] =
    useState([]);

  const mainTitleForThisTab = "QMS";

  console.log(
    "QMSAudit rendering, current language:",
    i18n.language,
    "auditItems count:",
    auditItems.length
  ); // DEBUG LOG 4 (Modified)

  useEffect(() => {
    const fetchStaticData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/audit-checkpoints`
        );
        const allCheckpoints = response.data;
        const currentTabDataFromDB = allCheckpoints.find(
          (cp) => cp.mainTitle === mainTitleForThisTab
        );

        if (currentTabDataFromDB) {
          setRawStaticSectionData(currentTabDataFromDB);
          const initializedItems = currentTabDataFromDB.requirements.map(
            (req) => initializeInteractiveAuditItemShell(req)
          );
          setAuditItems(initializedItems);
        } else {
          setError(
            t("common.dataNotFoundFor", { title: mainTitleForThisTab }) ||
              `Audit data for "${mainTitleForThisTab}" not found.`
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            t("common.fetchError", "Failed to fetch audit data")
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaticData();
  }, [mainTitleForThisTab, t]);

  useEffect(() => {
    if (rawStaticSectionData) {
      const lang = i18n.language;
      switch (lang) {
        case "km":
          setSectionTitleForDisplay(rawStaticSectionData.sectionTitleKhmer);
          break;
        case "zh":
          setSectionTitleForDisplay(rawStaticSectionData.sectionTitleChinese);
          break;
        default:
          setSectionTitleForDisplay(rawStaticSectionData.sectionTitleEng);
      }
    }
  }, [rawStaticSectionData, i18n.language]);

  const handleAuditDataChange = (updatedData) => {
    setAuditItems(updatedData);
  };

  const maxScore = useMemo(
    () =>
      auditItems.reduce(
        (sum, item) => sum + (parseInt(item.staticData?.levelValue, 10) || 0),
        0
      ),
    [auditItems]
  );
  const maxPossibleScore = useMemo(() => {
    const totalLevelScore = auditItems.reduce(
      (sum, item) => sum + (parseInt(item.staticData?.levelValue, 10) || 0),
      0
    );
    const totalNaDeduction = auditItems.reduce(
      (sum, item) => sum + (parseInt(item.naScore, 10) || 0),
      0
    );
    return totalLevelScore - totalNaDeduction;
  }, [auditItems]);
  const totalScoreAchieved = useMemo(
    () =>
      auditItems.reduce(
        (sum, item) => sum + (parseInt(item.score, 10) || 0),
        0
      ),
    [auditItems]
  );

  const handleAdditionalCommentsTextChange = (e) => {
    if (!sectionEnabled) return;
    const text = e.target.value;
    if (text.length <= 1000) {
      setAdditionalCommentsText(text);
      if (showAdditionalCommentsTable) setShowAdditionalCommentsTable(false);
    }
  };
  const toggleAdditionalCommentsTable = () => {
    if (!sectionEnabled) return;
    const newIsTable = !showAdditionalCommentsTable;
    setShowAdditionalCommentsTable(newIsTable);
    if (newIsTable && !additionalCommentsText) {
      if (additionalCommentsTableData.length === 0) {
        setAdditionalCommentsTableData(
          Array(additionalCommentsTableRows).fill(
            Array(additionalCommentsTableCols).fill("")
          )
        );
      }
    }
  };
  const handleAdditionalCommentsTableDimensionChange = (dim, value) => {
    if (!sectionEnabled) return;
    const numValue = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
    if (dim === "rows") setAdditionalCommentsTableRows(numValue);
    if (dim === "cols") setAdditionalCommentsTableCols(numValue);
    setAdditionalCommentsTableData(
      Array(dim === "rows" ? numValue : additionalCommentsTableRows).fill(
        Array(dim === "cols" ? numValue : additionalCommentsTableCols).fill("")
      )
    );
  };

  if (isLoading)
    return (
      <div className="p-6 text-center">
        {t("common.loading", "Loading audit data...")}
      </div>
    );
  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        {t("common.error", "Error")}: {error}
      </div>
    );
  if (
    !rawStaticSectionData ||
    (rawStaticSectionData.requirements.length > 0 &&
      auditItems.length === 0 &&
      !isLoading)
  ) {
    return (
      <div className="p-6 text-center">
        {t("common.noDataFoundFor", { title: mainTitleForThisTab }) ||
          `Audit data for "${mainTitleForThisTab}" not found or failed to initialize.`}
      </div>
    );
  }

  return (
    <div className="p-1">
      <h2 className="text-sm sm:text-lg font-semibold text-gray-800 my-4 px-4 sm:px-6 text-center sm:text-left">
        {sectionTitleForDisplay}
      </h2>
      <AuditHeader />
      <AuditLegend />
      <div className="mx-4 sm:mx-6 my-3 flex items-center gap-2">
        <label
          htmlFor={`enableSectionToggle-${mainTitleForThisTab}`}
          className="text-sm font-medium text-gray-700"
        >
          {t("auditTable.enableTable")}:
        </label>
        <div className="flex items-center">
          <button
            onClick={() => setSectionEnabled(true)}
            className={`px-3 py-1 text-xs rounded-l-md border ${
              sectionEnabled
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t("auditTable.yes")}
          </button>
          <button
            onClick={() => setSectionEnabled(false)}
            className={`px-3 py-1 text-xs rounded-r-md border ${
              !sectionEnabled
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t("auditTable.no")}
          </button>
        </div>
      </div>
      <AuditTable
        auditData={auditItems}
        onAuditDataChange={handleAuditDataChange}
        sectionEnabled={sectionEnabled}
        currentLang={i18n.language}
      />
      <div
        className={`mx-4 sm:mx-6 my-4 p-3 border rounded-lg shadow ${
          !sectionEnabled ? "opacity-60 bg-gray-50" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor={`additionalComments-${mainTitleForThisTab}`}
            className="text-sm font-semibold text-gray-700"
          >
            {t("auditTable.additionalComments")}
          </label>
          <button
            onClick={toggleAdditionalCommentsTable}
            title={t("auditTable.insertTable")}
            className={`p-1 rounded ${
              showAdditionalCommentsTable
                ? "bg-indigo-100 text-indigo-600"
                : "hover:bg-gray-100"
            } ${!sectionEnabled ? "cursor-not-allowed" : ""}`}
            disabled={!sectionEnabled}
          >
            <TableIcon size={16} />
          </button>
        </div>
        {showAdditionalCommentsTable && sectionEnabled && (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              value={additionalCommentsTableRows}
              onChange={(e) =>
                handleAdditionalCommentsTableDimensionChange(
                  "rows",
                  e.target.value
                )
              }
              min="1"
              max="10"
              className="w-12 text-xs p-1 border rounded"
              title={t("auditTable.rows")}
              disabled={!sectionEnabled}
            />
            <span className="text-xs">x</span>
            <input
              type="number"
              value={additionalCommentsTableCols}
              onChange={(e) =>
                handleAdditionalCommentsTableDimensionChange(
                  "cols",
                  e.target.value
                )
              }
              min="1"
              max="10"
              className="w-12 text-xs p-1 border rounded"
              title={t("auditTable.cols")}
              disabled={!sectionEnabled}
            />
          </div>
        )}
        {showAdditionalCommentsTable && sectionEnabled ? (
          <AdditionalCommentsTableInput
            rows={additionalCommentsTableRows}
            cols={additionalCommentsTableCols}
            data={additionalCommentsTableData}
            onChange={setAdditionalCommentsTableData}
            sectionEnabled={sectionEnabled}
          />
        ) : (
          <textarea
            id={`additionalComments-${mainTitleForThisTab}`}
            value={additionalCommentsText}
            onChange={handleAdditionalCommentsTextChange}
            rows="4"
            maxLength={1000}
            className={`w-full p-2 text-sm border rounded ${
              !sectionEnabled
                ? "bg-gray-100 cursor-not-allowed"
                : "focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            disabled={!sectionEnabled}
          />
        )}
        {!showAdditionalCommentsTable && (
          <div className="text-right text-xs text-gray-400 mt-0.5">
            {additionalCommentsText.length}/1000
          </div>
        )}
      </div>
      <div
        className={`grid md:grid-cols-3 gap-4 mx-4 sm:mx-6 my-6 ${
          !sectionEnabled ? "opacity-60" : ""
        }`}
      >
        <ScoreCard
          title={t("auditTable.maxScoreCardTitle")}
          value={maxScore}
          icon={<Award />}
          colorClass="bg-blue-500"
        />
        <ScoreCard
          title={t("auditTable.maxPossibleScoreCardTitle")}
          value={maxPossibleScore}
          icon={<TrendingUp />}
          colorClass="bg-yellow-500"
        />
        <ScoreCard
          title={t("auditTable.totalScoreCardTitle")}
          value={totalScoreAchieved}
          icon={<TrendingUp />}
          colorClass="bg-green-500"
        />
      </div>
    </div>
  );
};

export default QMSAudit;
