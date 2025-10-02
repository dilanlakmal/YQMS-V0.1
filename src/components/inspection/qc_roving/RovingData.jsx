import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";
import RovingFilterPlane from "../qc_roving/RovingDataFilterPane";
import { useAuth } from "../../authentication/AuthContext";

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${month}/${day}/${year}`; // MM/DD/YYYY
};

const REPETITION_KEYS = [
  "1st Inspection",
  "2nd Inspection",
  "3rd Inspection",
  "4th Inspection",
  "5th Inspection"
];

const RovingData = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const authUserEmpId = user?.emp_id;
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [defectDefinitions, setDefectDefinitions] = useState([]);
  const [isLoadingDefects, setIsLoadingDefects] = useState(false);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    spi: true,
    measurement: true,
    checkedDefect: true
  });

  const [filters, setFilters] = useState({
    date: getTodayDateString(),
    qcId: authUserEmpId ? String(authUserEmpId) : "", // Default to authUserEmpId if available
    operatorId: "",
    lineNo: "",
    moNo: ""
  });

  const [uniqueQcIds, setUniqueQcIds] = useState([]);
  const [uniqueOperatorIds, setUniqueOperatorIds] = useState([]);
  const [uniqueLineNos, setUniqueLineNos] = useState([]);
  const [uniqueMoNos, setUniqueMoNos] = useState([]);

  const populateUniqueFilterOptions = useCallback(
    (sourceReports) => {
      if (sourceReports && sourceReports.length > 0) {
        const qcIds = new Set();
        const operatorIds = new Set();
        const lineNos = new Set();
        const moNos = new Set();

        // Add authUserEmpId to the set if it exists, ensuring it's always an option
        if (authUserEmpId) {
          qcIds.add(String(authUserEmpId));
        }

        sourceReports.forEach((report) => {
          // if (report.emp_id) qcIds.add(report.emp_id);
          if (report.line_no) lineNos.add(report.line_no);
          if (report.mo_no) moNos.add(report.mo_no);
          // report.inlineData?.forEach((data) => {
          //   if (data.operator_emp_id) operatorIds.add(data.operator_emp_id);
          // });
          // Handle new schema with inspection_rep
          if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
            report.inspection_rep.forEach((repItem) => {
              if (repItem.emp_id) qcIds.add(String(repItem.emp_id));
              repItem.inlineData?.forEach((data) => {
                if (data.operator_emp_id)
                  operatorIds.add(String(data.operator_emp_id));
              });
            });
          } else if (report.inlineData && Array.isArray(report.inlineData)) {
            if (report.emp_id) qcIds.add(String(report.emp_id));
            report.inlineData.forEach((data) => {
              if (data.operator_emp_id)
                operatorIds.add(String(data.operator_emp_id));
            });
          }
        });

        setUniqueQcIds(Array.from(qcIds).sort());
        setUniqueOperatorIds(Array.from(operatorIds).sort());
        setUniqueLineNos(
          Array.from(lineNos).sort((a, b) =>
            String(a).localeCompare(String(b), undefined, { numeric: true })
          )
        );
        setUniqueMoNos(Array.from(moNos).sort());
      } else {
        setUniqueQcIds(authUserEmpId ? [String(authUserEmpId)] : []);
        setUniqueOperatorIds([]);
        setUniqueLineNos([]);
        setUniqueMoNos([]);
      }
    },
    [authUserEmpId]
  );

  const fetchReports = useCallback(
    async (currentFilters) => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentFilters.date)
          queryParams.append("inspection_date", currentFilters.date);

        if (currentFilters.lineNo)
          queryParams.append("lineNo", currentFilters.lineNo);
        if (currentFilters.moNo)
          queryParams.append("moNo", currentFilters.moNo);

        let endpoint = `${API_BASE_URL}/api/qc-inline-roving-reports`;
        if (queryParams.toString()) {
          endpoint = `${API_BASE_URL}/api/qc-inline-roving-reports/filtered?${queryParams.toString()}`;
        }

        const response = await axios.get(endpoint);
        const rawReportsFromApi = response.data || [];

        populateUniqueFilterOptions(rawReportsFromApi);

        const processedData = rawReportsFromApi.flatMap((report) => {
          const operatorInspectionsMap = new Map();

          const processInlineData = (
            inlineDataArray,
            repNameForLegacy = null,
            topLevelEmpIdForLegacy = null
          ) => {
            inlineDataArray?.forEach((operatorData) => {
              const operatorKey = `${operatorData.operator_emp_id}_${operatorData.tg_no}`;
              const currentRepName =
                repNameForLegacy ||
                operatorData.inspection_rep_name ||
                "Unknown Rep";

              if (!operatorInspectionsMap.has(operatorKey)) {
                operatorInspectionsMap.set(operatorKey, {
                  reportTopLevel: report,
                  operator_emp_id: operatorData.operator_emp_id,
                  operator_eng_name: operatorData.operator_eng_name,
                  operator_kh_name: operatorData.operator_kh_name,
                  operation_ch_name: operatorData.operation_ch_name,
                  operation_kh_name: operatorData.operation_kh_name,
                  ma_code: operatorData.ma_code,
                  tg_no: operatorData.tg_no,
                  inspectionsByRep: {}
                });
              }
              const existingEntry = operatorInspectionsMap.get(operatorKey);

              const repLevelDataForThisRep = repNameForLegacy
                ? {
                    emp_id: topLevelEmpIdForLegacy || report.emp_id,
                    inspection_rep_name: repNameForLegacy
                  }
                : operatorData.repLevelData || {
                    emp_id: report.emp_id,
                    inspection_rep_name: currentRepName
                  };

              existingEntry.inspectionsByRep[currentRepName] = {
                operatorLevelData: operatorData,
                repLevelData: repLevelDataForThisRep
              };
            });
          };

          if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
            report.inspection_rep.forEach((repItem) => {
              const augmentedInlineData = repItem.inlineData?.map((opData) => ({
                ...opData,
                repLevelData: repItem,
                inspection_rep_name: repItem.inspection_rep_name
              }));
              processInlineData(augmentedInlineData);
            });
          } else if (report.inlineData && Array.isArray(report.inlineData)) {
            processInlineData(
              report.inlineData,
              "1st Inspection",
              report.emp_id
            );
          }
          return Array.from(operatorInspectionsMap.values());
        });

        let reportsForDisplay = processedData;

        if (currentFilters.operatorId) {
          reportsForDisplay = processedData.filter(
            (opSummary) =>
              String(opSummary.operator_emp_id) ===
              String(currentFilters.operatorId)
          );
        }

        if (currentFilters.qcId) {
          reportsForDisplay = reportsForDisplay.filter((opSummary) => {
            return Object.values(opSummary.inspectionsByRep).some(
              (inspection) =>
                inspection.repLevelData?.emp_id === currentFilters.qcId
            );
          });
        }

        setReports(reportsForDisplay);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch reports."
        });

        setReports([]);
        populateUniqueFilterOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [populateUniqueFilterOptions]
  );

  useEffect(() => {
    fetchReports(filters);
  }, [filters, refreshTrigger, fetchReports]);

  useEffect(() => {
    setFilters((currentFilters) => {
      const newQcIdFromAuth = authUserEmpId ? String(authUserEmpId) : "";
      if (currentFilters.qcId !== newQcIdFromAuth) {
        // This will make authUserEmpId the "current default".
        return { ...currentFilters, qcId: newQcIdFromAuth };
      }
      return currentFilters;
    });
  }, [authUserEmpId]);

  const fetchDefectDefinitions = async () => {
    try {
      setIsLoadingDefects(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/defect-definitions`
      ); // Adjust endpoint as needed

      if (response.data && Array.isArray(response.data)) {
        setDefectDefinitions(response.data);
      } else {
        console.warn(
          "Defect definitions response is not an array:",
          response.data
        );
        setDefectDefinitions([]);
      }
    } catch (error) {
      console.error("Error fetching defect definitions:", error);
      setDefectDefinitions([]);
      // Optionally show user-friendly error
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Could not load defect definitions. Defect names will be shown in original language.",
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setIsLoadingDefects(false);
    }
  };

  const getDefectNameByLanguage = (
    defectName,
    language = "en",
    defectDefinitions = []
  ) => {
    if (!defectName || !defectDefinitions.length) {
      return defectName;
    }

    // Try to find the defect in the definitions
    const defectDef = defectDefinitions.find(
      (def) =>
        def.english?.toLowerCase() === defectName.toLowerCase() ||
        def.shortEng?.toLowerCase() === defectName.toLowerCase() ||
        def.khmer === defectName ||
        def.chinese === defectName
    );

    if (defectDef) {
      switch (language) {
        case "kh":
        case "khmer":
          return defectDef.khmer || defectDef.english || defectName;
        case "ch":
        case "chinese":
          return defectDef.chinese || defectDef.english || defectName;
        case "en":
        case "english":
        default:
          return defectDef.english || defectName;
      }
    }

    // If no definition found, return original name
    return defectName;
  };

  useEffect(() => {
    fetchDefectDefinitions();
  }, []);

  // Update language detection useEffect
  useEffect(() => {
    const userLanguage =
      user?.language || localStorage.getItem("preferredLanguage") || "en";
    setCurrentLanguage(userLanguage);
  }, [user]);

  // Listen for language changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "preferredLanguage") {
        setCurrentLanguage(e.newValue || "en");
      }
    };

    const handleCustomLanguageChange = (e) => {
      setCurrentLanguage(e.detail.language);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("languageChanged", handleCustomLanguageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("languageChanged", handleCustomLanguageChange);
    };
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const showImagePopup = (imageUrl) => {
    Swal.fire({
      html: `<img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; object-fit: contain;" />`,
      showConfirmButton: false,
      showCloseButton: true,
      background: "transparent",
      backdrop: "rgba(0,0,0,0.8)",
      customClass: {
        popup: "swal2-image-popup"
      }
    });
  };

  const showDetailsOnTap = (tooltipContent) => {
    Swal.fire({
      html: tooltipContent.html,
      confirmButtonText: "Close",
      width: "800px",
      showCloseButton: true,
      customClass: {
        popup: "roving-data-swal-popup"
      },
      didOpen: () => {
        // Add click handlers to images after modal opens
        const images = document.querySelectorAll(".defect-image-clickable");
        images.forEach((img) => {
          img.addEventListener("click", (e) => {
            e.preventDefault();
            showImagePopup(img.src);
          });
        });
      }
    });
  };

  const handleColumnVisibilityChange = (columnName) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const getVisibleSubColumnCount = () => {
    let count = 0;
    if (columnVisibility.spi) count++;
    if (columnVisibility.measurement) count++;
    if (columnVisibility.checkedDefect) count++;
    return count;
  };

  const handleSelectAllColumns = () => {
    setColumnVisibility({
      spi: true,
      measurement: true,
      checkedDefect: true
    });
  };

  const handleClearAllColumns = () => {
    setColumnVisibility({
      spi: false,
      measurement: false,
      checkedDefect: false
    });
  };

  const visibleSubColumnCount = getVisibleSubColumnCount();

  const renderColumnToggleCheckbox = (columnKey, label) => (
    <div className="mr-4">
      <input
        type="checkbox"
        id={`toggle-${columnKey}`}
        checked={columnVisibility[columnKey]}
        onChange={() => handleColumnVisibilityChange(columnKey)}
        className="mr-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label
        htmlFor={`toggle-${columnKey}`}
        className="text-xs font-medium text-gray-700"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="mt-4">
      <RovingFilterPlane
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        uniqueQcIds={uniqueQcIds}
        uniqueOperatorIds={uniqueOperatorIds}
        uniqueLineNos={uniqueLineNos}
        uniqueMoNos={uniqueMoNos}
      />
      <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-700">
        <h4 className="font-semibold text-sm mb-2">Legend:</h4>
        <div className="flex flex-wrap md:flex-nowrap md:space-x-8">
          <ul className="list-disc list-inside space-y-1 flex-1 min-w-[250px]">
            <li>
              <span className="text-green-600 font-bold text-lg">✓</span> : Pass
            </li>
            <li>
              <span className="text-red-600 font-bold text-lg">✗</span> : Fail /
              Reject
            </li>
            <li>
              <span className="font-semibold">SPI</span> : Stitches Per Inch
            </li>
            <li>
              <span className="font-semibold">Meas.</span> : Measurement
            </li>
            <li>
              <span className="font-semibold">Chk'd/Def</span> : Quantity
              Checked / Total Defects for Operator for that specific inspection
              event.
            </li>
          </ul>
          <ul className="list-disc list-inside space-y-1 flex-1 min-w-[250px] mt-2 md:mt-0">
            <li className="mt-2 font-semibold">
              Cell Background Colors (SPI, Meas., Chk'd/Def):
            </li>
            <ul className="list-disc list-inside ml-4">
              <li>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">Green</span> :
                Overall Roving Status is 'Pass'.
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">Yellow</span> :
                Overall Roving Status is 'Reject' (due to SPI/Meas),
                'Reject-Major' (single), or 'Reject-Minor' (single).
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">Red</span> :
                Overall Roving Status is 'Reject-Critical', 'Reject-Major'
                (multiple), or 'Reject-Minor' (multiple - *see note below*).
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-gray-200 border border-gray-400 mr-1 align-middle"></span>
                <span className="font-semibold align-middle">Gray</span> :
                Overall Roving Status is 'Pending', 'Unknown', or not
                determined.
              </li>
            </ul>
            <li className="mt-1 text-xs text-gray-500">
              (*Note: 'Reject-Minor' for multiple defects should ideally be red,
              but current data might show yellow. See console warning for
              details.)
            </li>
          </ul>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-gray-500">Loading reports...</div>
      ) : (
        <div className="overflow-x-auto relative max-h-[70vh]">
          <div className="py-2 px-2 flex items-center justify-end bg-gray-100 border-t border-b border-gray-300 sticky top-0 z-20">
            {/* <span className="text-xs font-semibold text-gray-700 mr-3">Show Columns:</span> */}
            <div className="flex items-center">
              {renderColumnToggleCheckbox("spi", "SPI")}
              {renderColumnToggleCheckbox("measurement", "Measurement")}
              {renderColumnToggleCheckbox(
                "checkedDefect",
                "Checked Qty/Defect"
              )}
            </div>
            <div className="ml-4">
              <button
                onClick={handleSelectAllColumns}
                className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 mr-2"
              >
                Select All
              </button>
              <button
                onClick={handleClearAllColumns}
                className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
              >
                Clear All
              </button>
            </div>
          </div>
          {reports.length === 0 ? (
            <div className="text-center p-10 text-gray-500">
              No reports found matching your criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-[36px] z-10 shadow-md">
                <tr>
                  <th
                    rowSpan="3"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Operator ID
                  </th>
                  <th
                    rowSpan="3"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Operation
                  </th>
                  <th
                    rowSpan="3"
                    className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500 align-middle"
                  >
                    Machine Code
                  </th>
                  {visibleSubColumnCount > 0 && (
                    <th
                      colSpan={REPETITION_KEYS.length * visibleSubColumnCount}
                      className="px-2 py-1 text-center text-sm font-medium text-gray-700 border border-gray-500"
                    >
                      Inspection Data
                    </th>
                  )}
                </tr>
                {visibleSubColumnCount > 0 && (
                  <tr>
                    {REPETITION_KEYS.map((repKey) => (
                      <th
                        key={repKey}
                        colSpan={visibleSubColumnCount} // If this row is rendered, visibleSubColumnCount > 0
                        className="px-2 py-1 text-center text-xs font-medium text-gray-700 border border-gray-500"
                      >
                        {repKey}
                      </th>
                    ))}
                  </tr>
                )}
                <tr>
                  {visibleSubColumnCount > 0 &&
                    REPETITION_KEYS.flatMap((repKey) => (
                      <React.Fragment key={`subgroup-header-${repKey}`}>
                        {columnVisibility.spi && (
                          <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">
                            SPI
                          </th>
                        )}
                        {columnVisibility.measurement && (
                          <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">
                            Meas.
                          </th>
                        )}
                        {columnVisibility.checkedDefect && (
                          <th className="px-1 py-1 text-left text-xs font-medium text-gray-700 border border-gray-500 whitespace-nowrap">
                            Chk'd/Def
                          </th>
                        )}
                      </React.Fragment>
                    ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((operatorSummary, index) => {
                  const allRepInspectionCells = [];

                  REPETITION_KEYS.forEach((repKey) => {
                    const inspectionEvent =
                      operatorSummary.inspectionsByRep[repKey];

                    if (inspectionEvent) {
                      const { operatorLevelData, repLevelData } =
                        inspectionEvent;
                      const totalDefectsForThisRep =
                        operatorLevelData.rejectGarments?.[0]?.totalCount || 0;

                      const spiDisplay = operatorLevelData.spi || "N/A";
                      const measDisplay =
                        operatorLevelData.measurement || "N/A";
                      const chkdDefDisplay = `${operatorLevelData.checked_quantity}/${totalDefectsForThisRep}`;

                      // New function to determine cell background based on overall_roving_status
                      const getCellBackgroundColorForOverallStatus = (
                        overallStatusKey
                      ) => {
                        if (!overallStatusKey)
                          return "bg-gray-200 hover:bg-gray-300";

                        switch (overallStatusKey) {
                          case "Pending":
                          case "Unknown":
                            return "bg-gray-200 hover:bg-gray-300";
                          case "Reject-Critical":
                          case "Reject-Major-M":
                          case "Reject-Minor-M":
                            return "bg-red-100 hover:bg-red-200";
                          case "Reject":
                          case "Reject-Major-S":
                          case "Reject-Minor-S":
                            return "bg-yellow-100 hover:bg-yellow-200";
                          case "Pass":
                            return "bg-green-100 hover:bg-green-200";
                          default:
                            return "bg-gray-200 hover:bg-gray-300";
                        }
                      };

                      const renderResultSymbol = (status) => {
                        if (status === "Pass")
                          return (
                            <span className="text-green-600 font-bold text-lg">
                              ✓
                            </span>
                          );
                        if (status === "Fail" || status === "Reject")
                          return (
                            <span className="text-red-600 font-bold text-lg">
                              ✗
                            </span>
                          );
                        return <span className="text-gray-500">N/A</span>;
                      };

                      const constructTooltipContent = (
                        currentReportDetails,
                        currentRepItemDetails,
                        currentOperatorInspectionData,
                        currentTotalDefectsForOp
                      ) => {
                        let defectsTextList = [];
                        let defectsHtml =
                          "<strong>Defects Found:</strong> None";
                        const defectsList = [];

                        if (
                          currentOperatorInspectionData.rejectGarments &&
                          currentOperatorInspectionData.rejectGarments.length >
                            0 &&
                          currentOperatorInspectionData.rejectGarments[0]
                            .garments
                        ) {
                          currentOperatorInspectionData.rejectGarments[0].garments.forEach(
                            (garment, garmentIndex) => {
                              garment.defects.forEach((defect, defectIndex) => {
                                const localizedDefectName =
                                  getDefectNameByLanguage(
                                    defect.name,
                                    currentLanguage,
                                    defectDefinitions
                                  );

                                // For hover tooltip (text only)
                                defectsTextList.push(
                                  `  Garment ${garmentIndex + 1}, Defect ${
                                    defectIndex + 1
                                  }: ${localizedDefectName} (Qty: ${
                                    defect.count
                                  })`
                                );

                                // For popup modal (with images)
                                let defectHtml = `<div style="margin: 8px 0; padding: 8px; border-left: 3px solid #dc2626; background-color: #fef2f2;">`;
                                defectHtml += `<strong>Garment ${
                                  garmentIndex + 1
                                }, Defect ${
                                  defectIndex + 1
                                }:</strong> ${localizedDefectName} (Qty: ${
                                  defect.count
                                })`;
                                defectHtml += `</div>`;
                                defectsList.push(defectHtml);
                              });
                            }
                          );
                        }

                        const defectsText =
                          defectsTextList.length > 0
                            ? "Defects Found:\n" + defectsTextList.join("\n")
                            : "Defects Found: None";
                        if (defectsList.length > 0) {
                          defectsHtml = `<strong>Defects Found:</strong><div style="margin-top: 8px;">${defectsList.join(
                            ""
                          )}</div>`;

                          // Add defect images if available at operator level
                          if (
                            currentOperatorInspectionData.defectImages &&
                            currentOperatorInspectionData.defectImages.length >
                              0
                          ) {
                            defectsHtml += `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;"><strong>Defect Images:</strong><div style="margin-top: 8px;">`;
                            currentOperatorInspectionData.defectImages.forEach(
                              (image, imgIndex) => {
                                defectsHtml += `<img src="${image}" alt="Defect Image ${
                                  imgIndex + 1
                                }" class="defect-image-clickable" style="max-width: 200px; max-height: 200px; margin: 4px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; transition: transform 0.2s; hover: transform: scale(1.05);" />`;
                              }
                            );
                            defectsHtml += `</div></div>`;
                          }
                        }

                        const qcId =
                          currentRepItemDetails?.emp_id ||
                          currentReportDetails?.emp_id ||
                          "N/A";
                        const qcRepName =
                          currentRepItemDetails?.inspection_rep_name || "N/A";

                        return {
                          text: `Inspection Details:
Date: ${currentReportDetails.inspection_date || "N/A"}
QC ID: ${qcId}
Inspection Rep: ${qcRepName}
Line No: ${currentReportDetails.line_no || "N/A"}
MO No: ${currentReportDetails.mo_no || "N/A"}
------------------------------
Operator ID: ${currentOperatorInspectionData.operator_emp_id || "N/A"}
Operator Name: ${
                            currentOperatorInspectionData.operator_kh_name ||
                            currentOperatorInspectionData.operator_eng_name ||
                            "N/A"
                          }
Operation: ${
                            currentOperatorInspectionData.operation_kh_name ||
                            currentOperatorInspectionData.operation_ch_name ||
                            "N/A"
                          }
Machine Code: ${currentOperatorInspectionData.ma_code || "N/A"}
------------------------------
Type: ${currentOperatorInspectionData.type || "N/A"}
Checked Qty: ${currentOperatorInspectionData.checked_quantity || "N/A"}
SPI: ${currentOperatorInspectionData.spi || "N/A"}
Meas: ${currentOperatorInspectionData.measurement || "N/A"}
Total Defects (Op): ${currentTotalDefectsForOp}
Overall Result (Op): ${currentOperatorInspectionData.qualityStatus || "N/A"}
Overall Roving Status: ${
                            currentOperatorInspectionData.overall_roving_status ||
                            "N/A"
                          }
------------------------------
${defectsText}`,
                          html: `
                            <div style="text-align: left; font-family: monospace; font-size: 0.85rem; line-height: 1.4;">
                              <h3 style="margin: 0 0 12px 0; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Inspection Details</h3>
                              <div style="margin-bottom: 12px;">
                                <strong>Date:</strong> ${
                                  currentReportDetails.inspection_date || "N/A"
                                }<br>
                                <strong>QC ID:</strong> ${qcId}<br>
                                <strong>Inspection Rep:</strong> ${qcRepName}<br>
                                <strong>Line No:</strong> ${
                                  currentReportDetails.line_no || "N/A"
                                }<br>
                                <strong>MO No:</strong> ${
                                  currentReportDetails.mo_no || "N/A"
                                }
                              </div>
                              <div style="margin-bottom: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                <strong>Operator ID:</strong> ${
                                  currentOperatorInspectionData.operator_emp_id ||
                                  "N/A"
                                }<br>
                                <strong>Operator Name:</strong> ${
                                  currentOperatorInspectionData.operator_kh_name ||
                                  currentOperatorInspectionData.operator_eng_name ||
                                  "N/A"
                                }<br>
                                <strong>Operation:</strong> ${
                                  currentOperatorInspectionData.operation_kh_name ||
                                  currentOperatorInspectionData.operation_ch_name ||
                                  "N/A"
                                }<br>
                                <strong>Machine Code:</strong> ${
                                  currentOperatorInspectionData.ma_code || "N/A"
                                }
                              </div>
                              <div style="margin-bottom: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                <strong>Type:</strong> ${
                                  currentOperatorInspectionData.type || "N/A"
                                }<br>
                                <strong>Checked Qty:</strong> ${
                                  currentOperatorInspectionData.checked_quantity ||
                                  "N/A"
                                }<br>
                                <strong>SPI:</strong> ${
                                  currentOperatorInspectionData.spi || "N/A"
                                }<br>
                                <strong>Meas:</strong> ${
                                  currentOperatorInspectionData.measurement ||
                                  "N/A"
                                }<br>
                                <strong>Total Defects (Op):</strong> ${currentTotalDefectsForOp}<br>
                                <strong>Overall Result (Op):</strong> ${
                                  currentOperatorInspectionData.qualityStatus ||
                                  "N/A"
                                }<br>
                                <strong>Overall Roving Status:</strong> ${
                                  currentOperatorInspectionData.overall_roving_status ||
                                  "N/A"
                                }
                              </div>
                              <div style="padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                ${defectsHtml}
                              </div>
                            </div>
                          `
                        };
                      };

                      const tooltipContent = constructTooltipContent(
                        operatorSummary.reportTopLevel,
                        repLevelData,
                        operatorLevelData,
                        totalDefectsForThisRep
                      );

                      const overallStatusForEvent =
                        operatorLevelData.overall_roving_status;
                      const repetitionCellBgClass =
                        getCellBackgroundColorForOverallStatus(
                          overallStatusForEvent
                        );

                      if (columnVisibility.spi) {
                        allRepInspectionCells.push(
                          <td
                            key={`spi-${repKey}`}
                            title={tooltipContent.text}
                            onClick={() => showDetailsOnTap(tooltipContent)}
                            className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${repetitionCellBgClass} transition-colors duration-150 text-center cursor-pointer`}
                          >
                            {renderResultSymbol(spiDisplay)}
                          </td>
                        );
                      }
                      if (columnVisibility.measurement) {
                        allRepInspectionCells.push(
                          <td
                            key={`meas-${repKey}`}
                            title={tooltipContent.text}
                            onClick={() => showDetailsOnTap(tooltipContent)}
                            className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${repetitionCellBgClass} transition-colors duration-150 text-center cursor-pointer`}
                          >
                            {renderResultSymbol(measDisplay)}
                          </td>
                        );
                      }
                      if (columnVisibility.checkedDefect) {
                        allRepInspectionCells.push(
                          <td
                            key={`chkdef-${repKey}`}
                            title={tooltipContent.text}
                            onClick={() => showDetailsOnTap(tooltipContent)}
                            className={`px-1 py-1 text-xs text-gray-700 border border-gray-300 ${repetitionCellBgClass} transition-colors duration-150 cursor-pointer text-center`}
                          >
                            {chkdDefDisplay}
                          </td>
                        );
                      }
                      // If all sub-columns for this rep are hidden, you might want a placeholder
                      if (
                        !columnVisibility.spi &&
                        !columnVisibility.measurement &&
                        !columnVisibility.checkedDefect &&
                        visibleSubColumnCount === 0
                      ) {
                        // This case is handled by colSpan=1 on the repKey header if visibleSubColumnCount is 0
                      }
                    } else {
                      // Render 3 empty cells if no data for this repetition
                      if (columnVisibility.spi)
                        allRepInspectionCells.push(
                          <td
                            key={`empty-spi-${repKey}`}
                            className="px-1 py-1 text-xs text-gray-400 border border-gray-300 text-center"
                          >
                            -
                          </td>
                        );
                      if (columnVisibility.measurement)
                        allRepInspectionCells.push(
                          <td
                            key={`empty-meas-${repKey}`}
                            className="px-1 py-1 text-xs text-gray-400 border border-gray-300 text-center"
                          >
                            -
                          </td>
                        );
                      if (columnVisibility.checkedDefect)
                        allRepInspectionCells.push(
                          <td
                            key={`empty-chkdef-${repKey}`}
                            className="px-1 py-1 text-xs text-gray-400 border border-gray-300 text-center"
                          >
                            -
                          </td>
                        );
                    }
                  });

                  return (
                    <tr
                      key={`${operatorSummary.operator_emp_id}-${operatorSummary.tg_no}-${index}`}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.operator_emp_id || "N/A"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.operation_kh_name ||
                          operatorSummary.operation_ch_name ||
                          "N/A"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-700 border border-gray-300">
                        {operatorSummary.ma_code || "N/A"}
                      </td>
                      {allRepInspectionCells}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default RovingData;
