// src/components/inspection/cutting/report/CuttingReportQCView.jsx
import axios from "axios";
import {
  Download,
  Loader2,
  Printer,
  Search,
  UserCircle2,
  XCircle
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { decimalToFraction } from "../../../../utils/fractionUtils";
import { generateCuttingReportPDF } from "./CuttingReportQCViewPDF"; // Import the generator

// Assume you might pass a master list of fabric defects for localization
// If not, the localization for defect names will primarily use the English name from the inspection data.
const CuttingReportQCView = ({
  initialReportId,
  onBackToList,
  fabricDefectsMaster = []
}) => {
  const { t, i18n } = useTranslation();

  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: null,
    moNo: "",
    tableNo: "",
    qcId: ""
  });

  const [report, setReport] = useState(null);
  const [qcUser, setQcUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);

  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const tableNoDropdownRef = useRef(null);

  const [qcInspectorOptions, setQcInspectorOptions] = useState([]);

  const fetchQcUserDetails = useCallback(async (empId) => {
    if (!empId) {
      setQcUser(null);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${empId}`, {
        withCredentials: true
      });
      // Map face_photo to image_path for consistency with rendering logic
      setQcUser({
        ...response.data,
        image_path: response.data.face_photo || null // Map face_photo to image_path
      });
      //setQcUser(response.data);
    } catch (err) {
      console.warn(`Could not fetch QC user details for ${empId}:`, err);
      setQcUser({
        emp_id: empId,
        eng_name: "N/A",
        kh_name: "N/A",
        image_path: null
      });
    }
  }, []);

  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "" && !filters.moNo) {
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
          { params: { search: moNoSearch }, withCredentials: true }
        );
        setMoNoOptions(response.data);
        if (response.data.length > 0 && moNoSearch.trim() !== "")
          setShowMoNoDropdown(true);
        else if (moNoSearch.trim() === "") setShowMoNoDropdown(false);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
      }
    };
    const debounce = setTimeout(fetchMoNumbers, 300);
    return () => clearTimeout(debounce);
  }, [moNoSearch, filters.moNo]);

  useEffect(() => {
    if (!filters.moNo) {
      setTableNoOptions([]);
      setShowTableNoDropdown(false);
      return;
    }
    const fetchTableNumbers = async () => {
      if (tableNoSearch.trim() === "" && !filters.tableNo) {
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
          {
            params: { moNo: filters.moNo, search: tableNoSearch },
            withCredentials: true
          }
        );
        setTableNoOptions(response.data);
        if (response.data.length > 0 && tableNoSearch.trim() !== "")
          setShowTableNoDropdown(true);
        else if (tableNoSearch.trim() === "") setShowTableNoDropdown(false);
      } catch (error) {
        console.error("Error fetching table numbers:", error);
      }
    };
    const debounce = setTimeout(fetchTableNumbers, 300);
    return () => clearTimeout(debounce);
  }, [filters.moNo, tableNoSearch, filters.tableNo]);

  useEffect(() => {
    const fetchQcInspectors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/qc-inspectors`,
          { withCredentials: true }
        );
        setQcInspectorOptions(response.data);
      } catch (error) {
        console.error("Error fetching QC inspectors:", error);
      }
    };
    fetchQcInspectors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchReportByMoAndTable = useCallback(
    async (mo, table) => {
      if (!mo || !table) {
        setReport(null);
        return;
      }
      setLoading(true);
      setError(null);
      setQcUser(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspection-details-for-modify`,
          { params: { moNo: mo, tableNo: table }, withCredentials: true }
        );
        if (response.data) {
          setReport(response.data);
          if (response.data.cutting_emp_id) {
            fetchQcUserDetails(response.data.cutting_emp_id);
          }
        } else {
          setReport(null);
          setError(
            t(
              "cutting.reportNotFoundForMoTable",
              "Report not found for the selected MO and Table No."
            )
          );
        }
      } catch (err) {
        console.error("Error fetching report detail for QC View:", err);
        const errorMessage =
          err.response?.data?.message ||
          t("cutting.failedToFetchReportDetails");
        setError(errorMessage);
        setReport(null);
      } finally {
        setLoading(false);
      }
    },
    [t, fetchQcUserDetails]
  );

  useEffect(() => {
    if (initialReportId && !filters.moNo && !filters.tableNo) {
      // Only if filters are not already set by user
      const fetchInitialReport = async () => {
        setLoading(true);
        setQcUser(null);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/cutting-inspection-report-detail/${initialReportId}`,
            { withCredentials: true }
          );
          if (response.data) {
            setReport(response.data);
            setFilters((prev) => ({
              ...prev,
              moNo: response.data.moNo,
              tableNo: response.data.tableNo,
              qcId: response.data.cutting_emp_id
            }));
            setMoNoSearch(response.data.moNo);
            setTableNoSearch(response.data.tableNo);
            if (response.data.cutting_emp_id) {
              fetchQcUserDetails(response.data.cutting_emp_id);
            }
          } else {
            setError(t("cutting.reportNotFound", "Report not found."));
          }
        } catch (err) {
          setError(
            t(
              "cutting.failedToFetchInitialReport",
              "Failed to fetch initial report."
            )
          );
        } finally {
          setLoading(false);
        }
      };
      fetchInitialReport();
    }
  }, [initialReportId, fetchQcUserDetails, filters.moNo, filters.tableNo]); // Added filters to dependencies

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === "moNo") setMoNoSearch(value);
    if (name === "tableNo") setTableNoSearch(value);
  };

  const handleDateChange = (name, date) => {
    if (name === "endDate" && filters.startDate && date < filters.startDate) {
      Swal.fire({
        icon: "warning",
        title: t("common.invalidDateRange"),
        text: t("common.endDateCannotBeBeforeStartDate")
      });
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: date }));
  };

  const handleSearch = () => {
    if (filters.moNo && filters.tableNo) {
      fetchReportByMoAndTable(filters.moNo, filters.tableNo);
    } else {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: t(
          "cutting.errorMoTableRequired",
          "MO Number and Table Number are required to view the report."
        )
      });
      setReport(null);
      setQcUser(null);
    }
  };

  const getImagePath = (relativePath) => {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const path = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return `${base}${path}`;
  };

  const getLocalizedText = (eng, khmer, chinese) => {
    if (i18n.language === "km" && khmer) return khmer;
    if (i18n.language === "zh" && chinese) return chinese;
    return eng || ""; // Ensure fallback to empty string if eng is also undefined/null
  };

  const getDefectDisplayName = (defectNameFromInspection) => {
    const masterDefect = fabricDefectsMaster.find(
      (m) =>
        m.defectName === defectNameFromInspection ||
        m.defectNameEng === defectNameFromInspection
    );
    if (masterDefect) {
      return getLocalizedText(
        masterDefect.defectNameEng,
        masterDefect.defectNameKhmer,
        masterDefect.defectNameChinese
      );
    }
    return defectNameFromInspection; // Fallback to the name from inspection data
  };

  const processedMeasurementData = useMemo(() => {
    if (!report || !report.inspectionData) return { data: [], headers: [] };
    let processed = [];
    const allPcsNamesMasterSet = new Set();
    report.inspectionData.forEach((sizeData) => {
      sizeData.bundleInspectionData.forEach((bundle) => {
        bundle.measurementInsepctionData.forEach((part) => {
          part.measurementPointsData.forEach((mp) => {
            mp.measurementValues.forEach((mv) => {
              mv.measurements.forEach((m) =>
                allPcsNamesMasterSet.add(m.pcsName)
              );
            });
          });
        });
      });
    });
    const sortPcsNames = (a, b) => {
      const prefixOrder = { T: 1, M: 2, B: 3 };
      const prefixA = a.charAt(0).toUpperCase();
      const prefixB = b.charAt(0).toUpperCase();
      const numA = parseInt(a.substring(1));
      const numB = parseInt(b.substring(1));
      if (prefixOrder[prefixA] < prefixOrder[prefixB]) return -1;
      if (prefixOrder[prefixA] > prefixOrder[prefixB]) return 1;
      return numA - numB;
    };
    const sortedMasterPcsNames =
      Array.from(allPcsNamesMasterSet).sort(sortPcsNames);
    report.inspectionData.forEach((sizeData) => {
      sizeData.bundleInspectionData.forEach((bundle) => {
        bundle.measurementInsepctionData.forEach((part) => {
          part.measurementPointsData.forEach((mp) => {
            const row = {
              size: sizeData.inspectedSize,
              bundleQtyForSize: sizeData.bundleQtyCheckSize,
              bundleNo: bundle.bundleNo,
              partName: getLocalizedText(
                part.partName,
                part.partNameKhmer,
                part.partNameChinese
              ),
              measurementPoint: getLocalizedText(
                mp.measurementPointName,
                mp.measurementPointNameKhmer,
                mp.measurementPointNameChinese
              ),
              values: {},
              tolerance: sizeData.tolerance
            };
            sortedMasterPcsNames.forEach((pcsName) => {
              let foundVal = null;
              for (const mv of mp.measurementValues) {
                const measurement = mv.measurements.find(
                  (m) => m.pcsName === pcsName
                );
                if (measurement) {
                  foundVal = measurement.valuedecimal;
                  break;
                }
              }
              row.values[pcsName] = foundVal;
            });
            processed.push(row);
          });
        });
      });
    });
    return { data: processed, headers: sortedMasterPcsNames };
  }, [report, i18n.language, getLocalizedText]);

  const processedDefectData = useMemo(() => {
    if (!report || !report.inspectionData) return [];
    let processed = [];
    report.inspectionData.forEach((sizeData) => {
      sizeData.bundleInspectionData.forEach((bundle) => {
        bundle.measurementInsepctionData.forEach((part) => {
          const defectsForPart = {};
          let partHasDefects = false;
          part.fabricDefects.forEach((locationDefect) => {
            locationDefect.defectData.forEach((pcsDefect) => {
              if (pcsDefect.totalDefects > 0 && pcsDefect.defects) {
                partHasDefects = true;
                if (!defectsForPart[pcsDefect.pcsName]) {
                  defectsForPart[pcsDefect.pcsName] = [];
                }
                pcsDefect.defects.forEach((defectDetailFromSchema) => {
                  if (defectDetailFromSchema.defectName) {
                    let existing = defectsForPart[pcsDefect.pcsName].find(
                      (d) =>
                        d.nameFromSchema === defectDetailFromSchema.defectName
                    );
                    if (existing) {
                      existing.qty =
                        (existing.qty || 0) +
                        (defectDetailFromSchema.defectQty || 0);
                    } else {
                      defectsForPart[pcsDefect.pcsName].push({
                        nameFromSchema: defectDetailFromSchema.defectName, // Store the original name for lookup
                        displayName: getDefectDisplayName(
                          defectDetailFromSchema.defectName
                        ), // Get localized name
                        qty: defectDetailFromSchema.defectQty || 0
                      });
                    }
                  }
                });
              }
            });
          });
          if (partHasDefects) {
            processed.push({
              size: sizeData.inspectedSize,
              bundleQtyForSize: sizeData.bundleQtyCheckSize,
              bundleNo: bundle.bundleNo,
              partName: getLocalizedText(
                part.partName,
                part.partNameKhmer,
                part.partNameChinese
              ),
              defectsByPcs: defectsForPart
            });
          }
        });
      });
    });
    return processed;
  }, [
    report,
    i18n.language,
    getLocalizedText,
    fabricDefectsMaster,
    getDefectDisplayName
  ]);

  const inspectionSummaryData = useMemo(() => {
    if (!report || !report.inspectionData) return { details: [], totals: {} };
    const details = report.inspectionData.map((sizeData) => {
      const rejectDefects =
        (sizeData.rejectSize?.total || 0) -
        (sizeData.rejectMeasurementSize?.total || 0);
      return {
        size: sizeData.inspectedSize,
        inspectedQty: {
          total: sizeData.totalPcsSize || 0,
          top: sizeData.pcsSize?.top || 0,
          middle: sizeData.pcsSize?.middle || 0,
          bottom: sizeData.pcsSize?.bottom || 0
        },
        pass: {
          total: sizeData.passSize?.total || 0,
          top: sizeData.passSize?.top || 0,
          middle: sizeData.passSize?.middle || 0,
          bottom: sizeData.passSize?.bottom || 0
        },
        reject: {
          total: sizeData.rejectSize?.total || 0,
          top: sizeData.rejectSize?.top || 0,
          middle: sizeData.rejectSize?.middle || 0,
          bottom: sizeData.rejectSize?.bottom || 0
        },
        rejectMeasurement: {
          total: sizeData.rejectMeasurementSize?.total || 0,
          top: sizeData.rejectMeasurementSize?.top || 0,
          middle: sizeData.rejectMeasurementSize?.middle || 0,
          bottom: sizeData.rejectMeasurementSize?.bottom || 0
        },
        rejectDefects: {
          total: sizeData.rejectGarmentSize?.total || 0,
          top: sizeData.rejectGarmentSize?.top || 0,
          middle: sizeData.rejectGarmentSize?.middle || 0,
          bottom: sizeData.rejectGarmentSize?.bottom || 0
        },

        passRate: {
          total: sizeData.passrateSize?.total || 0,
          top: sizeData.passrateSize?.top || 0,
          middle: sizeData.passrateSize?.middle || 0,
          bottom: sizeData.passrateSize?.bottom || 0
        }
      };
    });
    const totals = details.reduce(
      (acc, curr) => {
        acc.inspectedQty.total += curr.inspectedQty.total;
        acc.inspectedQty.top += curr.inspectedQty.top;
        acc.inspectedQty.middle += curr.inspectedQty.middle;
        acc.inspectedQty.bottom += curr.inspectedQty.bottom;
        acc.pass.total += curr.pass.total;
        acc.pass.top += curr.pass.top;
        acc.pass.middle += curr.pass.middle;
        acc.pass.bottom += curr.pass.bottom;
        acc.reject.total += curr.reject.total;
        acc.reject.top += curr.reject.top;
        acc.reject.middle += curr.reject.middle;
        acc.reject.bottom += curr.reject.bottom;
        acc.rejectMeasurement.total += curr.rejectMeasurement.total;
        acc.rejectMeasurement.top += curr.rejectMeasurement.top;
        acc.rejectMeasurement.middle += curr.rejectMeasurement.middle;
        acc.rejectMeasurement.bottom += curr.rejectMeasurement.bottom;
        acc.rejectDefects.total += curr.rejectDefects.total;
        acc.rejectDefects.top += curr.rejectDefects.top;
        acc.rejectDefects.middle += curr.rejectDefects.middle;
        acc.rejectDefects.bottom += curr.rejectDefects.bottom;
        return acc;
      },
      {
        inspectedQty: { total: 0, top: 0, middle: 0, bottom: 0 },
        pass: { total: 0, top: 0, middle: 0, bottom: 0 },
        reject: { total: 0, top: 0, middle: 0, bottom: 0 },
        rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
        rejectDefects: { total: 0, top: 0, middle: 0, bottom: 0 }
      }
    );
    totals.passRate = {
      total:
        totals.inspectedQty.total > 0
          ? (totals.pass.total / totals.inspectedQty.total) * 100
          : 0,
      top:
        totals.inspectedQty.top > 0
          ? (totals.pass.top / totals.inspectedQty.top) * 100
          : 0,
      middle:
        totals.inspectedQty.middle > 0
          ? (totals.pass.middle / totals.inspectedQty.middle) * 100
          : 0,
      bottom:
        totals.inspectedQty.bottom > 0
          ? (totals.pass.bottom / totals.inspectedQty.bottom) * 100
          : 0
    };
    return { details, totals };
  }, [report]);

  // Function to determine result status based on totalInspectionQty and sumTotalReject
  const getResultStatus = (
    totalInspectionQty,
    sumTotalReject,
    sumTotalPcs,
    t
  ) => {
    // If totalPcs < totalInspectionQty, status is Pending
    if (sumTotalPcs < totalInspectionQty) {
      return { status: t("common.pending"), color: "text-gray-400 font-bold" };
    }

    // Logic for Pass/Fail based on totalInspectionQty and sumTotalReject
    if (totalInspectionQty >= 30 && totalInspectionQty < 45) {
      if (sumTotalReject > 0) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    } else if (totalInspectionQty >= 45 && totalInspectionQty < 60) {
      if (sumTotalReject > 0) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    } else if (totalInspectionQty >= 60 && totalInspectionQty < 90) {
      if (sumTotalReject > 1) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    } else if (totalInspectionQty >= 90 && totalInspectionQty < 135) {
      if (sumTotalReject > 2) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    } else if (totalInspectionQty >= 135 && totalInspectionQty < 210) {
      if (sumTotalReject > 3) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    } else if (totalInspectionQty >= 210 && totalInspectionQty < 315) {
      if (sumTotalReject > 5) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    } else if (totalInspectionQty >= 315) {
      if (sumTotalReject > 7) {
        return { status: t("common.fail"), color: "text-red-600 font-bold" };
      }
      return { status: t("common.pass"), color: "text-green-600 font-bold" };
    }

    // Default case (if totalInspectionQty is 0 or invalid)
    return { status: t("common.pending"), color: "text-gray-400 font-bold" };
  };

  // Calculate result status when report and inspectionSummaryData are available
  const resultStatus = useMemo(() => {
    if (!report || !inspectionSummaryData.totals) {
      return { status: t("common.pending"), color: "text-gray-400 font-bold" };
    }
    return getResultStatus(
      report.totalInspectionQty || 0,
      inspectionSummaryData.totals.reject.total || 0, // sumTotalReject
      inspectionSummaryData.totals.inspectedQty.total || 0, // sumTotalPcs
      t
    );
  }, [report, inspectionSummaryData, t]);

  const handleGeneratePDF = async () => {
    if (!report) {
      Swal.fire(t("common.noDataToGeneratePdf"), "", "warning");
      return;
    }

    Swal.fire({
      title: t("common.generatingPdf"),
      text: t("common.pleaseWait"),
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      // Call the newly imported generator function with all required data
      await generateCuttingReportPDF(report, qcUser, fabricDefectsMaster, i18n);
      Swal.close();
    } catch (pdfError) {
      console.error("PDF Generation Error:", pdfError);
      Swal.fire({
        icon: "error",
        title: t("common.pdfError"),
        text: pdfError.message || t("common.failedToGeneratePdf")
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  let lastSize = null;
  let lastBundleNo = null;
  let lastPartName = null;
  let lastDefectSize = null;
  let lastDefectBundleNo = null;

  const sizeColWidth = "w-[4rem] sm:w-[5rem]";
  const bundleQtyColWidth = "w-[3.5rem] sm:w-[4rem] print:w-[3rem]";
  const bundleNoColWidth = "w-[3.5rem] sm:w-[4rem] print:w-[3rem]";
  const partNameColWidth = "w-[7rem] sm:w-[8rem] break-words print:w-[6rem]";
  const measurementPointColWidth =
    "w-[8rem] sm:w-[10rem] break-words print:w-[7rem]";

  const sizeColLeft = "0";
  // Adjusted left positions based on the Tailwind width classes (approximate)
  // For accurate sticky positioning, ensure these values sum up correctly.
  // Using CSS variables might be more robust if widths change drastically with responsiveness.
  const bundleQtyColLeft = "var(--size-col-actual-width, 4rem)"; // Use CSS var or fixed rem
  const bundleNoColLeft =
    "calc(var(--size-col-actual-width, 4rem) + var(--bundle-qty-col-actual-width, 3.5rem))";
  const partNameColLeft =
    "calc(var(--size-col-actual-width, 4rem) + var(--bundle-qty-col-actual-width, 3.5rem) + var(--bundle-no-col-actual-width, 3.5rem))";
  const measurementPointColLeft =
    "calc(var(--size-col-actual-width, 4rem) + var(--bundle-qty-col-actual-width, 3.5rem) + var(--bundle-no-col-actual-width, 3.5rem) + var(--part-name-col-actual-width, 7rem))";

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-100 print:bg-white A4-page-container print:p-2 print:shadow-none print:border-none">
      {/* Filter Pane */}
      <div className="max-w-6xl mx-auto mb-6 p-4 border border-gray-200 rounded-lg shadow-sm print:hidden bg-white">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {t("cutting.filterReport", "Filter Report")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.startDate")}
            </label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleDateChange("startDate", date)}
              dateFormat="MM/dd/yyyy"
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.endDate")}
            </label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleDateChange("endDate", date)}
              dateFormat="MM/dd/yyyy"
              minDate={filters.startDate}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              isClearable
            />
          </div>
          <div ref={moNoDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.moNo")}
            </label>
            <input
              type="text"
              name="moNo"
              value={moNoSearch}
              onChange={(e) => {
                setMoNoSearch(e.target.value);
                setShowMoNoDropdown(true);
              }}
              onFocus={() =>
                moNoOptions.length > 0 && setShowMoNoDropdown(true)
              }
              placeholder={t("cutting.search_mono")}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                {moNoOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        moNo: option,
                        tableNo: ""
                      }));
                      setMoNoSearch(option);
                      setTableNoSearch("");
                      setShowMoNoDropdown(false);
                    }}
                    className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div ref={tableNoDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.tableNo")}
            </label>
            <input
              type="text"
              name="tableNo"
              value={tableNoSearch}
              onChange={(e) => {
                setTableNoSearch(e.target.value);
                setShowTableNoDropdown(true);
              }}
              onFocus={() =>
                tableNoOptions.length > 0 && setShowTableNoDropdown(true)
              }
              placeholder={t("cutting.search_table_no")}
              className={`mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm ${
                !filters.moNo ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              disabled={!filters.moNo}
            />
            {showTableNoDropdown && tableNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                {tableNoOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, tableNo: option }));
                      setTableNoSearch(option);
                      setShowTableNoDropdown(false);
                    }}
                    className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.qcId")}
            </label>
            <select
              name="qcId"
              value={filters.qcId}
              onChange={handleFilterChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm text-sm"
            >
              <option value="">{t("common.all")}</option>
              {qcInspectorOptions.map((qc) => (
                <option key={qc.emp_id} value={qc.emp_id}>
                  {qc.emp_id} - {getLocalizedText(qc.eng_name, qc.kh_name, "")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search size={20} />
              )}
              <span className="ml-2">
                {t("common.viewReportBtn", "View Report")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Area */}
      <div className="bg-white p-6 shadow-lg rounded-lg print:shadow-none print:border-none print:p-0">
        {loading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="ml-3 text-lg text-gray-700">
              {t("common.loadingData")}
            </p>
          </div>
        )}
        {error && !loading && (
          <div className="p-8 text-center">
            <p className="text-red-600 text-xl mb-4">{error}</p>
          </div>
        )}

        {!loading && !error && report && (
          <div className="max-w-6xl mx-auto print:max-w-full">
            {" "}
            {/* Changed to max-w-6xl */}
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                YORKMARS (CAMBODIA) GARMENT MFG CO., LTD
              </h1>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mt-1">
                {t(
                  "cutting.cutPanelInspectionReportTitle",
                  "Cut Panel Inspection Report"
                )}
              </h2>
              <div className="mt-2 text-sm text-gray-600 flex flex-wrap justify-center items-center gap-x-2">
                <span>
                  {t("cutting.panel")}: {report.garmentType}
                </span>
                <span className="print:hidden">|</span>
                <span>
                  {t("cutting.moNo")}: {report.moNo}
                </span>
                <span className="print:hidden">|</span>
                <span>
                  {t("cutting.tableNo")}: {report.tableNo}
                </span>
                <span className="print:hidden">|</span>
                <span>
                  {t("cutting.date")}: {report.inspectionDate}
                </span>
              </div>
            </div>
            <div className="mb-4 flex justify-end space-x-2 print:hidden">
              {onBackToList && (
                <button
                  onClick={onBackToList}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
                  title={t("common.backToList")}
                >
                  <XCircle size={18} className="mr-2" />{" "}
                  {t("common.backToList")}
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                title={t("common.print")}
              >
                <Printer size={18} className="mr-2" /> {t("common.print")}
              </button>
              {/* PDF Download Button */}
              <button
                onClick={handleGeneratePDF}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                title={t("common.downloadPdf", "Download PDF")}
                disabled={!report} // Disable if no report data
              >
                <Download size={18} className="mr-2" /> {t("common.pdf", "PDF")}
              </button>
            </div>
            <div className="relative mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-3">
                {t("cutting.cutPanelDetailsTitle", "Cut Panel Details")}
              </h3>
              <div className="absolute top-4 right-4 p-2 border border-gray-300 rounded-md bg-gray-50 shadow-sm text-center w-32 print:hidden">
                <p className="text-xs font-semibold">
                  {qcUser?.emp_id || report.cutting_emp_id}
                </p>
                {qcUser?.image_path ? (
                  <img
                    src={getImagePath(qcUser.image_path)}
                    alt="QC Avatar"
                    className="w-12 h-12 rounded-full mx-auto my-1 object-cover border"
                  />
                ) : (
                  <UserCircle2 className="w-12 h-12 text-gray-400 mx-auto my-1" />
                )}
                <p className="text-[0.6rem] text-gray-600 truncate">
                  {getLocalizedText(qcUser?.eng_name, qcUser?.kh_name, "") ||
                    getLocalizedText(
                      report.cutting_emp_engName,
                      report.cutting_emp_khName,
                      ""
                    )}
                </p>
                <div className="mt-1 text-xs">
                  <span className="font-medium">{t("common.result")}:</span>{" "}
                  <span className={resultStatus.color}>
                    {resultStatus.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs sm:text-sm pr-36">
                <div>
                  <strong>{t("cutting.lotNo")}:</strong>{" "}
                  {report.lotNo?.join(", ") || "N/A"}
                </div>
                <div>
                  <strong>{t("cutting.color")}:</strong> {report.color}
                </div>
                <div>
                  <strong>{t("cutting.orderQty")}:</strong> {report.orderQty}
                </div>
                <div>
                  <strong>{t("cutting.spreadTable")}:</strong>{" "}
                  {report.cuttingTableDetails?.spreadTable || "N/A"}
                </div>
                <div>
                  <strong>{t("cutting.spreadTableNo")}:</strong>{" "}
                  {report.cuttingTableDetails?.spreadTableNo || "N/A"}
                </div>
                <div>
                  <strong>{t("cutting.planLayers")}:</strong>{" "}
                  {report.cuttingTableDetails?.planLayers}
                </div>
                <div>
                  <strong>{t("cutting.actualLayers")}:</strong>{" "}
                  {report.cuttingTableDetails?.actualLayers}
                </div>
                <div>
                  <strong>{t("cutting.totalPcs")}:</strong>{" "}
                  {report.cuttingTableDetails?.totalPcs}
                </div>
                <div>
                  <strong>{t("cutting.mackerNo")}:</strong>{" "}
                  {report.cuttingTableDetails?.mackerNo}
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-2">
                {t("cutting.markerRatio")}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {report.mackerRatio?.map((mr) => (
                        <th
                          key={mr.index}
                          className="border border-gray-300 p-1 text-center"
                        >
                          {mr.markerSize}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {report.mackerRatio?.map((mr) => (
                        <td
                          key={mr.index}
                          className="border border-gray-300 p-1 text-center"
                        >
                          {mr.ratio}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs sm:text-sm mt-4 pr-36">
                <div>
                  <strong>{t("cutting.totalBundleQty")}:</strong>{" "}
                  {report.totalBundleQty}
                </div>
                <div>
                  <strong>{t("cutting.bundleQtyCheck")}:</strong>{" "}
                  {report.bundleQtyCheck}
                </div>
                <div>
                  <strong>{t("cutting.cuttingBy")}:</strong>{" "}
                  {report.cuttingtype}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
                {t(
                  "cutting.inspectionSummaryOverall",
                  "Inspection Summary (Overall)"
                )}
              </h3>
              <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
                <table className="min-w-full border-collapse text-xs sm:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.size")}
                      </th>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.inspectionQty", "Insp. Qty")}
                      </th>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.pass")}
                      </th>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.reject")}
                      </th>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.rejectMeasurements")}
                      </th>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.rejectDefects")}
                      </th>
                      <th className="p-1 sm:p-2 border border-gray-300">
                        {t("cutting.passRate")} (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionSummaryData.details.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr>
                          <td
                            className="p-1 sm:p-2 border border-gray-300 text-center"
                            rowSpan={2}
                          >
                            {item.size}
                          </td>
                          <td className="p-1 sm:p-2 border border-gray-300 text-center">
                            {item.inspectedQty.total}
                          </td>
                          <td className="p-1 sm:p-2 border border-gray-300 text-center">
                            {item.pass.total}
                          </td>
                          <td className="p-1 sm:p-2 border border-gray-300 text-center">
                            {item.reject.total}
                          </td>
                          <td className="p-1 sm:p-2 border border-gray-300 text-center">
                            {item.rejectMeasurement.total}
                          </td>
                          <td className="p-1 sm:p-2 border border-gray-300 text-center">
                            {item.rejectDefects.total < 0
                              ? 0
                              : item.rejectDefects.total}
                          </td>
                          <td className="p-1 sm:p-2 border border-gray-300 text-center">
                            {item.passRate.total.toFixed(2)}
                          </td>
                        </tr>
                        <tr className="text-[0.7rem] text-gray-500 bg-gray-50">
                          <td className="p-1 border border-gray-300 text-center">
                            T:{item.inspectedQty.top} M:
                            {item.inspectedQty.middle} B:
                            {item.inspectedQty.bottom}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            T:{item.pass.top} M:{item.pass.middle} B:
                            {item.pass.bottom}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            T:{item.reject.top} M:{item.reject.middle} B:
                            {item.reject.bottom}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            T:{item.rejectMeasurement.top} M:
                            {item.rejectMeasurement.middle} B:
                            {item.rejectMeasurement.bottom}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            T:
                            {item.rejectDefects.top < 0
                              ? 0
                              : item.rejectDefects.top}{" "}
                            M:
                            {item.rejectDefects.middle < 0
                              ? 0
                              : item.rejectDefects.middle}{" "}
                            B:
                            {item.rejectDefects.bottom < 0
                              ? 0
                              : item.rejectDefects.bottom}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            T:{item.passRate.top.toFixed(0)}% M:
                            {item.passRate.middle.toFixed(0)}% B:
                            {item.passRate.bottom.toFixed(0)}%
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                    <tr className="font-bold bg-gray-100">
                      <td
                        className="p-1 sm:p-2 border border-gray-300 text-center"
                        rowSpan={2}
                      >
                        {t("common.total")}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-300 text-center">
                        {inspectionSummaryData.totals.inspectedQty.total}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-300 text-center">
                        {inspectionSummaryData.totals.pass.total}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-300 text-center">
                        {inspectionSummaryData.totals.reject.total}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-300 text-center">
                        {inspectionSummaryData.totals.rejectMeasurement.total}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-300 text-center">
                        {inspectionSummaryData.totals.rejectDefects.total < 0
                          ? 0
                          : inspectionSummaryData.totals.rejectDefects.total}
                      </td>
                      <td className="p-1 sm:p-2 border border-gray-300 text-center">
                        {inspectionSummaryData.totals.passRate.total.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="text-[0.7rem] text-gray-500 bg-gray-100 font-semibold">
                      <td className="p-1 border border-gray-300 text-center">
                        T:{inspectionSummaryData.totals.inspectedQty.top} M:
                        {inspectionSummaryData.totals.inspectedQty.middle} B:
                        {inspectionSummaryData.totals.inspectedQty.bottom}
                      </td>
                      <td className="p-1 border border-gray-300 text-center">
                        T:{inspectionSummaryData.totals.pass.top} M:
                        {inspectionSummaryData.totals.pass.middle} B:
                        {inspectionSummaryData.totals.pass.bottom}
                      </td>
                      <td className="p-1 border border-gray-300 text-center">
                        T:{inspectionSummaryData.totals.reject.top} M:
                        {inspectionSummaryData.totals.reject.middle} B:
                        {inspectionSummaryData.totals.reject.bottom}
                      </td>
                      <td className="p-1 border border-gray-300 text-center">
                        T:{inspectionSummaryData.totals.rejectMeasurement.top}{" "}
                        M:
                        {
                          inspectionSummaryData.totals.rejectMeasurement.middle
                        }{" "}
                        B:
                        {inspectionSummaryData.totals.rejectMeasurement.bottom}
                      </td>
                      <td className="p-1 border border-gray-300 text-center">
                        T:
                        {inspectionSummaryData.totals.rejectDefects.top < 0
                          ? 0
                          : inspectionSummaryData.totals.rejectDefects.top}{" "}
                        M:
                        {inspectionSummaryData.totals.rejectDefects.middle < 0
                          ? 0
                          : inspectionSummaryData.totals.rejectDefects
                              .middle}{" "}
                        B:
                        {inspectionSummaryData.totals.rejectDefects.bottom < 0
                          ? 0
                          : inspectionSummaryData.totals.rejectDefects.bottom}
                      </td>
                      <td className="p-1 border border-gray-300 text-center">
                        T:{inspectionSummaryData.totals.passRate.top.toFixed(0)}
                        % M:
                        {inspectionSummaryData.totals.passRate.middle.toFixed(
                          0
                        )}
                        % B:
                        {inspectionSummaryData.totals.passRate.bottom.toFixed(
                          0
                        )}
                        %
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
                {t("cutting.measurementDetails")}{" "}
                {report.inspectionData &&
                  report.inspectionData.length > 0 &&
                  report.inspectionData[0].tolerance && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({t("cutting.tolerance")}:{" "}
                      {report.inspectionData[0].tolerance.min} /{" "}
                      {report.inspectionData[0].tolerance.max})
                    </span>
                  )}
              </h3>
              {processedMeasurementData.data.length > 0 ? (
                <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
                  <table className="min-w-full border-collapse text-xs table-fixed">
                    <colgroup>
                      <col className={sizeColWidth} />
                      <col className={bundleQtyColWidth} />
                      <col className={bundleNoColWidth} />
                      <col className={partNameColWidth} />
                      <col className={measurementPointColWidth} />
                      {processedMeasurementData.headers.map((_, idx) => (
                        <col
                          key={`dyn-${idx}`}
                          className="min-w-[35px] w-[35px] print:min-w-[30px] print:w-[30px]"
                        />
                      ))}
                    </colgroup>
                    <thead className="bg-gray-100">
                      <tr>
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-20`}
                          style={{ left: sizeColLeft }}
                        >
                          {t("cutting.size")}
                        </th>
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-20 whitespace-nowrap`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem))`
                          }}
                        >
                          {t("cutting.bundleQty")}
                        </th>{" "}
                        {/* Adjusted left */}
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-20 whitespace-nowrap`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem))`
                          }}
                        >
                          {t("cutting.bundleNo")}
                        </th>{" "}
                        {/* Adjusted left */}
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-20`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem) + var(--bundle-no-col-width, 4rem))`
                          }}
                        >
                          {t("cutting.partName")}
                        </th>{" "}
                        {/* Adjusted left */}
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-20`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem) + var(--bundle-no-col-width, 4rem) + var(--part-name-col-width, 8rem))`
                          }}
                        >
                          {t("cutting.measurementPoint")}
                        </th>{" "}
                        {/* Adjusted left */}
                        {processedMeasurementData.headers.map((pcsName) => (
                          <th
                            key={pcsName}
                            className="p-1 border border-gray-300"
                          >
                            {pcsName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processedMeasurementData.data.map((row, rowIndex) => {
                        const showSize = row.size !== lastSize;
                        const showBundleNo =
                          showSize || row.bundleNo !== lastBundleNo;
                        let partNameRowSpan = 1;
                        if (showBundleNo) {
                          partNameRowSpan =
                            processedMeasurementData.data.filter(
                              (r) =>
                                r.size === row.size &&
                                r.bundleNo === row.bundleNo &&
                                r.partName === row.partName
                            ).length;
                        }
                        const showPartName =
                          showBundleNo || row.partName !== lastPartName;
                        if (showSize) lastSize = row.size;
                        if (showBundleNo) lastBundleNo = row.bundleNo;
                        if (showPartName) lastPartName = row.partName;
                        let sizeRowSpan = 1;
                        if (showSize) {
                          sizeRowSpan = processedMeasurementData.data.filter(
                            (r) => r.size === row.size
                          ).length;
                        }
                        let bundleNoRowSpan = 1;
                        if (showBundleNo) {
                          bundleNoRowSpan =
                            processedMeasurementData.data.filter(
                              (r) =>
                                r.size === row.size &&
                                r.bundleNo === row.bundleNo
                            ).length;
                        }
                        return (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {showSize && (
                              <td
                                className={`p-1 border border-gray-300 text-center align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{ left: sizeColLeft }}
                                rowSpan={sizeRowSpan}
                              >
                                {row.size}
                              </td>
                            )}
                            {showSize && (
                              <td
                                className={`p-1 border border-gray-300 text-center align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{
                                  left: `calc(${sizeColLeft} + var(--size-col-width, 5rem))`
                                }}
                                rowSpan={sizeRowSpan}
                              >
                                {row.bundleQtyForSize}
                              </td>
                            )}
                            {showBundleNo && (
                              <td
                                className={`p-1 border border-gray-300 text-center align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{
                                  left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem))`
                                }}
                                rowSpan={bundleNoRowSpan}
                              >
                                {row.bundleNo}
                              </td>
                            )}
                            {showPartName && (
                              <td
                                className={`p-1 border border-gray-300 align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{
                                  left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem) + var(--bundle-no-col-width, 4rem))`
                                }}
                                rowSpan={partNameRowSpan}
                              >
                                {row.partName}
                              </td>
                            )}
                            <td
                              className={`p-1 border border-gray-300 align-middle sticky bg-white hover:bg-gray-50 z-10`}
                              style={{
                                left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem) + var(--bundle-no-col-width, 4rem) + var(--part-name-col-width, 8rem))`
                              }}
                            >
                              {row.measurementPoint}
                            </td>
                            {processedMeasurementData.headers.map((pcsName) => {
                              const value = row.values[pcsName];
                              let cellBgClass = "";
                              if (row.tolerance && typeof value === "number") {
                                if (
                                  value < row.tolerance.min ||
                                  value > row.tolerance.max
                                ) {
                                  cellBgClass = "bg-red-100";
                                } else {
                                  cellBgClass = "bg-green-100";
                                }
                              }
                              return (
                                <td
                                  key={pcsName}
                                  className={`p-1 border border-gray-300 text-center ${cellBgClass}`}
                                >
                                  {typeof value === "number"
                                    ? decimalToFraction(value)
                                    : value === null
                                    ? "-"
                                    : value}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {t(
                    "cutting.noMeasurementDataAvailable",
                    "No measurement data available for this report."
                  )}
                </p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
                {t("cutting.fabricDefectsTitle", "Fabric Defects")}
              </h3>
              {processedDefectData.length > 0 ? (
                <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
                  <table className="min-w-full border-collapse text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-10 ${sizeColWidth}`}
                          style={{ left: sizeColLeft }}
                        >
                          {t("cutting.size")}
                        </th>
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-10 whitespace-nowrap ${bundleQtyColWidth}`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem))`
                          }}
                        >
                          {t("cutting.bundleQty")}
                        </th>
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-10 whitespace-nowrap ${bundleNoColWidth}`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem))`
                          }}
                        >
                          {t("cutting.bundleNo")}
                        </th>
                        <th
                          className={`p-1 border border-gray-300 sticky bg-gray-100 z-10 ${partNameColWidth}`}
                          style={{
                            left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem) + var(--bundle-no-col-width, 4rem))`
                          }}
                        >
                          {t("cutting.partName")}
                        </th>
                        <th className="p-1 border border-gray-300">
                          {t("cutting.defectDetails")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedDefectData.map((row, rowIndex) => {
                        const showSize = row.size !== lastDefectSize;
                        let bundleNoRowSpanDefect = 1;
                        if (showSize) {
                          bundleNoRowSpanDefect = processedDefectData.filter(
                            (r) =>
                              r.size === row.size && r.bundleNo === row.bundleNo
                          ).length;
                        }
                        const showBundleNo =
                          showSize || row.bundleNo !== lastDefectBundleNo;
                        if (showSize) lastDefectSize = row.size;
                        if (showBundleNo) lastDefectBundleNo = row.bundleNo;
                        let sizeRowSpanDefect = 1;
                        if (showSize) {
                          sizeRowSpanDefect = processedDefectData.filter(
                            (r) => r.size === row.size
                          ).length;
                        }
                        let bundleNoRowSpanForDefects = 1;
                        if (showBundleNo) {
                          bundleNoRowSpanForDefects =
                            processedDefectData.filter(
                              (r) =>
                                r.size === row.size &&
                                r.bundleNo === row.bundleNo
                            ).length;
                        }
                        return (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {showSize && (
                              <td
                                className={`p-1 border border-gray-300 text-center align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{ left: sizeColLeft }}
                                rowSpan={sizeRowSpanDefect}
                              >
                                {row.size}
                              </td>
                            )}
                            {showSize && (
                              <td
                                className={`p-1 border border-gray-300 text-center align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{
                                  left: `calc(${sizeColLeft} + var(--size-col-width, 5rem))`
                                }}
                                rowSpan={sizeRowSpanDefect}
                              >
                                {row.bundleQtyForSize}
                              </td>
                            )}
                            {showBundleNo && (
                              <td
                                className={`p-1 border border-gray-300 text-center align-middle sticky bg-white hover:bg-gray-50 z-10`}
                                style={{
                                  left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem))`
                                }}
                                rowSpan={bundleNoRowSpanForDefects}
                              >
                                {row.bundleNo}
                              </td>
                            )}
                            <td
                              className={`p-1 border border-gray-300 align-middle sticky bg-white hover:bg-gray-50 z-10`}
                              style={{
                                left: `calc(${sizeColLeft} + var(--size-col-width, 5rem) + var(--bundle-qty-col-width, 4rem) + var(--bundle-no-col-width, 4rem))`
                              }}
                            >
                              {row.partName}
                            </td>
                            <td className="p-1 border border-gray-300 align-top">
                              {Object.entries(row.defectsByPcs).map(
                                ([pcsName, defectsListFromProcessedData]) => (
                                  <div key={pcsName} className="mb-1">
                                    <strong className="mr-1">{pcsName}:</strong>
                                    {defectsListFromProcessedData.map(
                                      (defectItem, dIndex) => (
                                        <span key={dIndex} className="mr-2">
                                          {defectItem.displayName} (
                                          {defectItem.qty})
                                        </span>
                                      )
                                    )}
                                  </div>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {t(
                    "cutting.noFabricDefectsReported",
                    "No fabric defects reported."
                  )}
                </p>
              )}
            </div>
            <div className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
                {t("cutting.cuttingIssuesTitle", "Cutting Issues")}
              </h3>
              {report.inspectionData.some(
                (sd) => sd.cuttingDefects?.issues?.length > 0
              ) ? (
                <div className="overflow-x-auto mb-3">
                  <table className="min-w-full border-collapse border border-gray-300 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-1 border border-gray-300">
                          {t("cutting.size")}
                        </th>
                        <th className="p-1 border border-gray-300">
                          {t("cutting.defectName")}
                        </th>
                        <th className="p-1 border border-gray-300">
                          {t("cutting.remarks")}
                        </th>
                        <th className="p-1 border border-gray-300">
                          {t("cutting.evidence")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.inspectionData.flatMap(
                        (sizeEntry) =>
                          sizeEntry.cuttingDefects?.issues?.map(
                            (issue, issueIdx) => (
                              <tr
                                key={`${sizeEntry.inspectedSize}-${issueIdx}`}
                              >
                                <td className="p-1 border border-gray-300 text-center">
                                  {sizeEntry.inspectedSize}
                                </td>
                                <td className="p-1 border border-gray-300">
                                  {getLocalizedText(
                                    issue.cuttingdefectName,
                                    issue.cuttingdefectNameKhmer,
                                    issue.cuttingdefectNameChinese
                                  )}
                                </td>
                                <td className="p-1 border border-gray-300 whitespace-pre-wrap">
                                  {issue.remarks}
                                </td>
                                <td className="p-1 border border-gray-300">
                                  <div className="flex flex-wrap gap-1">
                                    {issue.imageData &&
                                      issue.imageData.map(
                                        (img, imgIdx) =>
                                          img.path && (
                                            <a
                                              href={getImagePath(img.path)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              key={imgIdx}
                                            >
                                              <img
                                                src={getImagePath(img.path)}
                                                alt={`${t(
                                                  "cutting.evidence"
                                                )} ${img.no || imgIdx + 1}`}
                                                className="max-w-[60px] max-h-[60px] object-contain inline-block border hover:opacity-75"
                                              />
                                            </a>
                                          )
                                      )}
                                  </div>
                                </td>
                              </tr>
                            )
                          ) || []
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">
                  {t(
                    "cutting.noSpecificIssuesReportedOverall",
                    "No specific cutting issues reported across all sizes."
                  )}
                </p>
              )}
              {report.inspectionData.map(
                (sizeEntry, index) =>
                  (sizeEntry.cuttingDefects?.additionalComments ||
                    sizeEntry.cuttingDefects?.additionalImages?.length > 0) && (
                    <div
                      key={`add-${index}`}
                      className="mt-3 pt-3 border-t border-dashed"
                    >
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        {t(
                          "cutting.additionalInfoForSize",
                          "Additional Info for Size"
                        )}
                        : {sizeEntry.inspectedSize}
                      </p>
                      {sizeEntry.cuttingDefects.additionalComments && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-gray-600 mb-1">
                            {t("cutting.additionalComments")}
                          </h4>
                          <p className="text-xs text-gray-700 p-2 border border-gray-100 rounded bg-gray-50 whitespace-pre-wrap">
                            {sizeEntry.cuttingDefects.additionalComments}
                          </p>
                        </div>
                      )}
                      {sizeEntry.cuttingDefects.additionalImages &&
                        sizeEntry.cuttingDefects.additionalImages.length >
                          0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-1">
                              {t("cutting.additionalImages")}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {sizeEntry.cuttingDefects.additionalImages.map(
                                (img, imgIdx) =>
                                  img.path && (
                                    <a
                                      href={getImagePath(img.path)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      key={imgIdx}
                                    >
                                      <img
                                        src={getImagePath(img.path)}
                                        alt={`${t("cutting.additionalImage")} ${
                                          img.no || imgIdx + 1
                                        }`}
                                        className="max-w-[100px] max-h-[100px] object-contain border rounded hover:opacity-75"
                                      />
                                    </a>
                                  )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )
              )}
            </div>
          </div>
        )}
        {!loading && !error && !report && (
          <div className="p-8 text-center text-gray-500">
            {t(
              "cutting.noReportSelectedPrompt",
              'Please use the filters above and click "View Report" to display data.'
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CuttingReportQCView;
