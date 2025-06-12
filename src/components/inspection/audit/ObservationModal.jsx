import { Eraser, Table as TableIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ObservationTableInput from "./ObservationTableInput"; // Import the new component

const ObservationModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  sectionEnabled
}) => {
  const { t } = useTranslation();
  const [observationData, setObservationData] = useState(initialData);

  // Sync with parent prop if it changes (e.g., modal is reopened for a different item)
  useEffect(() => {
    setObservationData(initialData);
  }, [initialData]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(observationData);
    onClose();
  };

  // --- NEW: Handle Clear ---
  const handleClear = () => {
    setObservationData({
      text: "",
      isTable: false,
      table: { rows: 2, cols: 2, data: [] }
    });
  };

  const handleObservationChange = (e) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setObservationData({ ...observationData, text: text, isTable: false });
    }
  };

  const toggleObsTable = () => {
    const newIsTable = !observationData.isTable;
    setObservationData({
      ...observationData,
      isTable: newIsTable,
      text: newIsTable && !observationData.text ? "" : observationData.text,
      table: newIsTable
        ? observationData.table || { rows: 2, cols: 2, data: [] }
        : null
    });
  };

  const handleObsTableDimensionChange = (dim, value) => {
    const numValue = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
    const currentTableData = observationData.table?.data || [];
    const newTableConfig = {
      rows: dim === "rows" ? numValue : observationData.table?.rows || 2,
      cols: dim === "cols" ? numValue : observationData.table?.cols || 2,
      data: Array(dim === "rows" ? numValue : observationData.table?.rows || 2)
        .fill(null)
        .map((_, rIndex) =>
          Array(dim === "cols" ? numValue : observationData.table?.cols || 2)
            .fill(null)
            .map(
              (__, cIndex) =>
                (currentTableData[rIndex] &&
                  currentTableData[rIndex][cIndex]) ||
                ""
            )
        )
    };
    setObservationData({
      ...observationData,
      isTable: true,
      table: newTableConfig
    });
  };

  const handleObsTableDataChange = (tableCellData) => {
    setObservationData({
      ...observationData,
      table: { ...observationData.table, data: tableCellData }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("auditTable.editObservations", "Edit Observations")}
          </h3>
          {/* --- NEW: Clear Button --- */}
          <button
            onClick={handleClear}
            disabled={!sectionEnabled}
            title={t("common.clearAll", "Clear All")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eraser size={14} />
            {t("common.clear", "Clear")}
          </button>
        </div>

        <div className="flex items-center justify-end mb-2 gap-2">
          <span className="text-sm text-gray-600">
            {t("auditTable.useTable", "Use Table:")}
          </span>
          <button
            onClick={toggleObsTable}
            title={t("auditTable.insertTable", "Insert a data table")}
            className={`p-1 rounded ${
              observationData.isTable
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            } ${!sectionEnabled ? "cursor-not-allowed" : ""}`}
            disabled={!sectionEnabled}
          >
            <TableIcon size={16} />
          </button>
          {observationData.isTable && (
            <>
              <input
                type="number"
                value={observationData.table?.rows || 2}
                onChange={(e) =>
                  handleObsTableDimensionChange("rows", e.target.value)
                }
                min="1"
                max="10"
                className={`w-12 text-sm p-1 border rounded ${
                  !sectionEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!sectionEnabled}
                title={t("auditTable.rows")}
              />
              <span className="text-sm">x</span>
              <input
                type="number"
                value={observationData.table?.cols || 2}
                onChange={(e) =>
                  handleObsTableDimensionChange("cols", e.target.value)
                }
                min="1"
                max="10"
                className={`w-12 text-sm p-1 border rounded ${
                  !sectionEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={!sectionEnabled}
                title={t("auditTable.cols")}
              />
            </>
          )}
        </div>

        {observationData.isTable ? (
          <ObservationTableInput
            rows={observationData.table?.rows || 2}
            cols={observationData.table?.cols || 2}
            data={observationData.table?.data || []}
            onChange={handleObsTableDataChange}
            sectionEnabled={sectionEnabled}
          />
        ) : (
          <div>
            <textarea
              value={observationData.text || ""}
              onChange={handleObservationChange}
              rows="5"
              maxLength={500}
              placeholder={t(
                "auditTable.addObservationsPlaceholder",
                "Add comments or observations here..."
              )}
              className={`w-full p-2 text-sm border rounded ${
                !sectionEnabled
                  ? "bg-gray-100 cursor-not-allowed"
                  : "focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              }`}
              disabled={!sectionEnabled}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {observationData.text?.length || 0}/500
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!sectionEnabled}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
          >
            {t("common.save", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObservationModal;
