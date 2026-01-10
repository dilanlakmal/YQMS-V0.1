import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  Package,
  Layers,
  Hash,
  Users,
  MapPin,
  Calendar,
  Settings,
  Tag,
  Shirt,
  Globe,
  Truck,
  Camera,
  MessageSquare,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  ClipboardCheck,
  AlertCircle,
  Shield,
  Trophy,
  Ruler,
  Bug,
  Award,
  User,
  ArrowLeft,
  Home,
  Printer,
  Download,
  RefreshCw,
  Eye,
  Clock,
  ClipboardList
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Import from Measurement Summary
import {
  groupMeasurementsByGroupId,
  calculateGroupStats,
  calculateOverallMeasurementResult,
  MeasurementStatsCards,
  MeasurementLegend,
  MeasurementSummaryTable,
  OverallMeasurementSummaryTable
} from "../QADataCollection/YPivotQAInspectionMeasurementSummary";

// Import from Defect Summary
import {
  useDefectSummaryData,
  useAqlData,
  calculateAqlResult,
  AQLConfigCards,
  AQLResultTable,
  FinalDefectResultBanner,
  DefectSummaryTable
} from "../QADataCollection/YPivotQAInspectionDefectSummary";

import { determineBuyerFromOrderNo } from "../QADataCollection/YPivotQAInspectionBuyerDetermination";

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const ImagePreviewModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
        >
          <XCircle className="w-8 h-8" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
        />
        <p className="text-center text-white/80 mt-2 font-mono text-sm">
          {alt}
        </p>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, icon: Icon, className = "" }) => (
  <div
    className={`flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 ${className}`}
  >
    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
      {Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : (
        <Hash className="w-3.5 h-3.5" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className="text-xs font-bold text-gray-800 dark:text-white mt-0.5 truncate"
        title={value}
      >
        {value || "-"}
      </p>
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
    <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
      {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
    </div>
    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h3>
  </div>
);

const StatusBadge = ({ value }) => {
  let style = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  if (["Conform", "Yes", "New Order"].includes(value)) {
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (["Non-Conform", "No"].includes(value)) {
    style = "bg-red-100 text-red-700 border-red-200";
  } else if (value === "N/A") {
    style = "bg-orange-100 text-orange-700 border-orange-200";
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}
    >
      {value}
    </span>
  );
};

const ResultCard = ({ title, result, icon: Icon }) => {
  const isPass = result === "PASS";
  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
        isPass
          ? `bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800`
          : `bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800`
      }`}
    >
      <div
        className={`p-1.5 rounded-full ${
          isPass ? "bg-green-100" : "bg-red-100"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${isPass ? "text-green-600" : "text-red-600"}`}
        />
      </div>
      <div>
        <p className="text-[8px] font-bold text-gray-500 uppercase">{title}</p>
        <p
          className={`text-sm font-black ${
            isPass ? "text-green-600" : "text-red-600"
          }`}
        >
          {result}
        </p>
      </div>
    </div>
  );
};

const getInspectorPhotoUrl = (facePhoto) => {
  if (!facePhoto) return null;
  if (facePhoto.startsWith("http://") || facePhoto.startsWith("https://")) {
    return facePhoto;
  }
  const cleanPath = facePhoto.startsWith("/")
    ? facePhoto.substring(1)
    : facePhoto;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL
    : `${PUBLIC_ASSET_URL}/`;
  return `${baseUrl}${cleanPath}`;
};

// =============================================================================
// NEW HELPER COMPONENTS FOR ORDER DATA
// =============================================================================

// Color/Size Breakdown Table
const ColorSizeBreakdownTable = ({ data, orderNo }) => {
  if (!data || !data.colors || data.colors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 rounded-lg">
        <Package className="w-8 h-8 mx-auto mb-1 opacity-50" />
        <p className="text-xs">No color/size data available</p>
      </div>
    );
  }

  const { sizeList, colors, sizeTotals, grandTotal } = data;

  return (
    <div className="space-y-2">
      {orderNo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
            {orderNo}
          </span>
        </div>
      )}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide sticky left-0 bg-indigo-600 z-10">
                Color
              </th>
              {sizeList.map((size) => (
                <th
                  key={size}
                  className="px-2 py-2 text-center font-bold text-[10px] uppercase tracking-wide min-w-[40px]"
                >
                  {size}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide bg-indigo-700 min-w-[60px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                } hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
              >
                <td className="px-3 py-1.5 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 bg-inherit z-10 border-r border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: row.colorCode || "#ccc" }}
                    />
                    <span className="truncate max-w-[100px] text-[11px]">
                      {row.color}
                    </span>
                  </div>
                </td>
                {sizeList.map((size) => (
                  <td
                    key={size}
                    className={`px-2 py-1.5 text-center text-[11px] font-medium border-r border-gray-100 dark:border-gray-700 last:border-0 ${
                      row.sizes[size]
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {row.sizes[size] || "-"}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">
                  {row.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
              <td className="px-3 py-2 text-[10px] text-gray-800 dark:text-gray-200 sticky left-0 bg-gray-200 dark:bg-gray-600 z-10 uppercase">
                Total
              </td>
              {sizeList.map((size) => (
                <td
                  key={size}
                  className="px-2 py-2 text-center text-[10px] text-gray-800 dark:text-gray-200"
                >
                  {sizeTotals[size]?.toLocaleString() || "-"}
                </td>
              ))}
              <td className="px-3 py-2 text-center text-[11px] text-white bg-indigo-600">
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// SKU Data Table
const SKUDataTable = ({ skuData, orderNo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!skuData || skuData.length === 0) return null;

  const displayData = isExpanded ? skuData : skuData.slice(0, 3);

  return (
    <div className="space-y-2">
      {orderNo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
            {orderNo}
          </span>
        </div>
      )}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <th className="px-2 py-1.5 text-left font-bold text-[10px] uppercase">
                SKU
              </th>
              <th className="px-2 py-1.5 text-left font-bold text-[10px] uppercase">
                PO Line
              </th>
              <th className="px-2 py-1.5 text-left font-bold text-[10px] uppercase">
                Color
              </th>
              <th className="px-2 py-1.5 text-center font-bold text-[10px] uppercase">
                ETD
              </th>
              <th className="px-2 py-1.5 text-center font-bold text-[10px] uppercase">
                ETA
              </th>
              <th className="px-2 py-1.5 text-right font-bold text-[10px] uppercase">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((sku, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                <td className="px-2 py-1.5 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                  {sku.sku || "N/A"}
                </td>
                <td className="px-2 py-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  {sku.POLine || "N/A"}
                </td>
                <td className="px-2 py-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                  {sku.Color || "N/A"}
                </td>
                <td className="px-2 py-1.5 text-center text-[11px] text-gray-600 dark:text-gray-400">
                  {sku.ETD || "-"}
                </td>
                <td className="px-2 py-1.5 text-center text-[11px] text-gray-600 dark:text-gray-400">
                  {sku.ETA || "-"}
                </td>
                <td className="px-2 py-1.5 text-right font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                  {sku.Qty?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {skuData.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors flex items-center justify-center gap-1 uppercase tracking-wide"
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {isExpanded ? "Show Less" : `Show All (${skuData.length})`}
        </button>
      )}
    </div>
  );
};

const getProductImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

// =============================================================================
// DATA TRANSFORMATION HELPERS
// =============================================================================

const transformHeaderDataFromBackend = (backendHeaderData) => {
  if (!backendHeaderData || !Array.isArray(backendHeaderData)) {
    return { selectedOptions: {}, remarks: {}, capturedImages: {} };
  }

  const selectedOptions = {};
  const remarks = {};
  const capturedImages = {};

  backendHeaderData.forEach((section) => {
    const headerId = section.headerId;
    if (section.selectedOption) {
      selectedOptions[headerId] = section.selectedOption;
    }
    if (section.remarks) {
      remarks[headerId] = section.remarks;
    }
    if (section.images && Array.isArray(section.images)) {
      section.images.forEach((img, index) => {
        const key = img.id || `${headerId}_${index}`;
        capturedImages[key] = {
          id: img.id || key,
          url: img.imageURL ? `${API_BASE_URL}${img.imageURL}` : img.imgSrc
        };
      });
    }
  });

  return { selectedOptions, remarks, capturedImages };
};

const transformPhotoDataFromBackend = (backendPhotoData) => {
  if (!backendPhotoData || !Array.isArray(backendPhotoData)) {
    return { remarks: {}, capturedImages: {} };
  }

  const remarks = {};
  const capturedImages = {};

  backendPhotoData.forEach((section) => {
    if (section.items && Array.isArray(section.items)) {
      section.items.forEach((item) => {
        const itemKeyBase = `${section.sectionId}_${item.itemNo}`;
        if (item.remarks) {
          remarks[itemKeyBase] = item.remarks;
        }
        if (item.images && Array.isArray(item.images)) {
          item.images.forEach((img, index) => {
            const key = img.id || `${itemKeyBase}_${index}`;
            capturedImages[key] = {
              id: img.id || key,
              url: img.imageURL ? `${API_BASE_URL}${img.imageURL}` : img.imgSrc
            };
          });
        }
      });
    }
  });

  return { remarks, capturedImages };
};

const transformMeasurementDataFromBackend = (backendMeasurementData) => {
  if (!backendMeasurementData || !Array.isArray(backendMeasurementData)) {
    return { savedMeasurements: [], manualDataByGroup: {} };
  }

  const processedMeasurements = backendMeasurementData
    .filter((m) => m.size !== "Manual_Entry")
    .map((m) => ({
      ...m,
      allEnabledPcs: new Set(m.allEnabledPcs || []),
      criticalEnabledPcs: new Set(m.criticalEnabledPcs || [])
    }));

  const processedManualDataByGroup = {};
  backendMeasurementData.forEach((item) => {
    if (item.manualData) {
      const groupId = item.groupId;
      const processedImages = (item.manualData.images || []).map((img) => {
        let displayUrl = img.imageURL;
        if (
          displayUrl &&
          !displayUrl.startsWith("http") &&
          !displayUrl.startsWith("data:")
        ) {
          displayUrl = `${API_BASE_URL}${displayUrl}`;
        }
        return {
          id: img.imageId || img.id,
          url: displayUrl,
          imgSrc: displayUrl,
          editedImgSrc: displayUrl,
          remark: img.remark || "",
          history: []
        };
      });

      processedManualDataByGroup[groupId] = {
        remarks: item.manualData.remarks || "",
        status: item.manualData.status || "Pass",
        images: processedImages
      };
    }
  });

  return {
    savedMeasurements: processedMeasurements,
    manualDataByGroup: processedManualDataByGroup,
    isConfigured: processedMeasurements.length > 0
  };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const YPivotQAReportFullView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [report, setReport] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [inspectorInfo, setInspectorInfo] = useState(null);
  const [definitions, setDefinitions] = useState({ headers: [], photos: [] });
  const [measurementSpecs, setMeasurementSpecs] = useState({
    full: [],
    selected: []
  });

  // UI States
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    aql: true,
    defectSummary: true,
    order: true,
    config: true,
    header: true,
    photos: true,
    measurement: true
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // =========================================================================
  // FETCH ALL DATA
  // =========================================================================
  useEffect(() => {
    const fetchAllData = async () => {
      if (!reportId) {
        setError("No Report ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Report Data
        const reportRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (!reportRes.data.success) {
          throw new Error("Report not found");
        }

        const reportData = reportRes.data.data;
        setReport(reportData);

        // 2. Fetch Order Data
        const orderNos = reportData.orderNos || [];
        if (orderNos.length > 0) {
          let orderFetchResult = null;

          if (reportData.orderType === "single" || orderNos.length === 1) {
            const orderRes = await axios.get(
              `${API_BASE_URL}/api/fincheck-inspection/order-details/${orderNos[0]}`
            );
            if (orderRes.data.success) {
              orderFetchResult = {
                ...orderRes.data.data,
                isSingle: true,
                orderBreakdowns: [
                  {
                    orderNo: orderNos[0],
                    totalQty: orderRes.data.data.dtOrder?.totalQty,
                    colorSizeBreakdown: orderRes.data.data.colorSizeBreakdown,
                    yorksysOrder: orderRes.data.data.yorksysOrder
                  }
                ]
              };
            }
          } else {
            const orderRes = await axios.post(
              `${API_BASE_URL}/api/fincheck-inspection/multiple-order-details`,
              { orderNos }
            );
            if (orderRes.data.success) {
              orderFetchResult = { ...orderRes.data.data, isSingle: false };
            }
          }

          setOrderData(orderFetchResult);
        }

        // 3. Fetch Inspector Info
        if (reportData.empId) {
          try {
            const inspectorRes = await axios.get(
              `${API_BASE_URL}/api/user-details?empId=${reportData.empId}`
            );
            if (inspectorRes.data) {
              setInspectorInfo(inspectorRes.data);
            }
          } catch (err) {
            console.warn("Could not fetch inspector info", err);
            setInspectorInfo({
              emp_id: reportData.empId,
              eng_name: reportData.empName,
              face_photo: null
            });
          }
        }

        // 4. Fetch Section Definitions
        const [headersRes, photosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-home`),
          axios.get(`${API_BASE_URL}/api/qa-sections-photos`)
        ]);
        setDefinitions({
          headers: headersRes.data.data || [],
          photos: photosRes.data.data || []
        });

        // 5. Fetch Measurement Specs
        const measMethod =
          reportData.measurementMethod ||
          reportData.inspectionDetails?.measurement;

        // Only fetch if measurement is active
        if (measMethod && measMethod !== "N/A" && measMethod !== "No") {
          try {
            // Call the new endpoint we just created
            const specsRes = await axios.get(
              `${API_BASE_URL}/api/fincheck-reports/${reportId}/measurement-specs`
            );

            if (specsRes.data.success) {
              setMeasurementSpecs({
                full: specsRes.data.full || [],
                selected: specsRes.data.selected || []
              });
            }
          } catch (err) {
            console.warn("Could not fetch measurement specs", err);
          }
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load report"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [reportId]);

  // =========================================================================
  // DERIVED DATA
  // =========================================================================

  const selectedOrders = useMemo(() => report?.orderNos || [], [report]);

  // NEW: Extract Unique SKUs from all breakdowns
  const allUniqueSKUs = useMemo(() => {
    if (!orderData?.orderBreakdowns) return [];
    const skus = new Set();
    orderData.orderBreakdowns.forEach((bd) => {
      if (bd.yorksysOrder?.skuData) {
        bd.yorksysOrder.skuData.forEach((item) => {
          if (item.sku) skus.add(item.sku);
        });
      }
    });
    return Array.from(skus).sort();
  }, [orderData]);

  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);

  const selectedTemplate = useMemo(() => {
    return (
      report?.selectedTemplate || {
        ReportType: report?.reportType,
        Measurement:
          report?.inspectionDetails?.measurement || report?.measurementMethod,
        InspectedQtyMethod: report?.inspectionMethod,
        _id: report?.inspectionDetails?.reportTypeId,
        SelectedPhotoSectionList: []
      }
    );
  }, [report]);

  const config = useMemo(() => {
    const details = report?.inspectionDetails || {};
    return {
      inspectedQty: details.inspectedQty,
      cartonQty: details.cartonQty,
      shippingStage: details.shippingStage,
      remarks: details.remarks,
      aqlSampleSize: details.aqlSampleSize,
      aqlConfig: details.aqlConfig,
      productType: details.productType,
      productTypeId: details.productTypeId
    };
  }, [report]);

  const lineTableConfig = useMemo(() => {
    return report?.inspectionConfig?.configGroups || [];
  }, [report]);

  const headerData = useMemo(() => {
    return transformHeaderDataFromBackend(report?.headerData);
  }, [report?.headerData]);

  const photoData = useMemo(() => {
    return transformPhotoDataFromBackend(report?.photoData);
  }, [report?.photoData]);

  const processedMeasurementData = useMemo(() => {
    return transformMeasurementDataFromBackend(report?.measurementData);
  }, [report?.measurementData]);

  const savedMeasurements = processedMeasurementData.savedMeasurements;

  const savedDefects = useMemo(() => {
    return report?.defectData || [];
  }, [report?.defectData]);

  // Calculations
  const isAQLMethod = useMemo(
    () =>
      selectedTemplate?.InspectedQtyMethod === "AQL" ||
      report?.inspectionMethod === "AQL",
    [selectedTemplate, report]
  );

  const inspectedQty = useMemo(
    () => parseInt(config?.inspectedQty) || 0,
    [config?.inspectedQty]
  );

  // NEW: Flatten Defect Images for Display
  const defectImages = useMemo(() => {
    const images = [];
    if (!report?.defectData) return images;

    report.defectData.forEach((defect) => {
      const { defectName, defectCode } = defect;

      if (defect.isNoLocation) {
        // No Location Mode
        defect.images?.forEach((img) => {
          images.push({
            ...img,
            defectName,
            locationText: "General",
            positionType: "N/A"
          });
        });
      } else {
        // Location Mode
        defect.locations?.forEach((loc) => {
          loc.positions?.forEach((pos) => {
            // 1. Required Image
            if (pos.requiredImage) {
              images.push({
                ...pos.requiredImage,
                defectName,
                locationText: `${loc.locationName} - ${loc.view}`,
                positionType: pos.position // "Inside" or "Outside"
              });
            }
            // 2. Additional Images
            pos.additionalImages?.forEach((img) => {
              images.push({
                ...img,
                defectName,
                locationText: `${loc.locationName} - ${loc.view}`,
                positionType: pos.position // "Inside" or "Outside"
              });
            });
          });
        });
      }
    });

    return images;
  }, [report?.defectData]);

  const groupedMeasurements = useMemo(() => {
    return groupMeasurementsByGroupId(savedMeasurements);
  }, [savedMeasurements]);

  const measurementResult = useMemo(() => {
    return calculateOverallMeasurementResult(savedMeasurements);
  }, [savedMeasurements]);

  const summaryData = useDefectSummaryData(savedDefects, null);
  const { aqlSampleData, loadingAql } = useAqlData(
    isAQLMethod,
    determinedBuyer,
    inspectedQty
  );

  const aqlResult = useMemo(
    () => calculateAqlResult(aqlSampleData, summaryData.totals),
    [aqlSampleData, summaryData.totals]
  );

  const defectResult = useMemo(() => {
    if (aqlResult) return aqlResult.final;
    if (summaryData.totals.critical > 0 || summaryData.totals.major > 0)
      return "FAIL";
    return "PASS";
  }, [aqlResult, summaryData.totals]);

  const finalReportResult = useMemo(() => {
    if (measurementResult.result === "FAIL" || defectResult === "FAIL") {
      return "FAIL";
    }
    return "PASS";
  }, [measurementResult.result, defectResult]);

  // const inspectionFactory = useMemo(() => {
  //   const d = report?.inspectionDetails || {};
  //   if (d.isSubCon) {
  //     return d.subConFactory || d.factory || "Unknown";
  //   }
  //   return d.factory || "N/A";
  // }, [report]);

  // Scope columns for config table
  const scopeColumns = useMemo(() => {
    if (!selectedTemplate) return [];
    const cols = [];
    if (selectedTemplate.Line === "Yes") cols.push("Line");
    if (selectedTemplate.Table === "Yes") cols.push("Table");
    if (selectedTemplate.Colors === "Yes") cols.push("Color");
    // Fallback: check if lineTableConfig has these fields
    if (cols.length === 0 && lineTableConfig.length > 0) {
      const sample = lineTableConfig[0];
      if (sample.lineName || sample.line) cols.push("Line");
      if (sample.tableName || sample.table) cols.push("Table");
      if (sample.colorName || sample.color) cols.push("Color");
    }
    return cols;
  }, [selectedTemplate, lineTableConfig]);

  const relevantPhotoSections = useMemo(() => {
    if (
      !selectedTemplate?.SelectedPhotoSectionList ||
      definitions.photos.length === 0
    ) {
      return definitions.photos; // Show all if not specified
    }
    const allowedIds = selectedTemplate.SelectedPhotoSectionList.map(
      (i) => i.PhotoSectionID
    );
    return definitions.photos.filter((p) => allowedIds.includes(p._id));
  }, [selectedTemplate, definitions.photos]);

  const dtOrder = orderData?.dtOrder || {};
  const yorksys = orderData?.yorksysOrder || {};
  const skuData = yorksys.skuData || [];

  const colorSizeBreakdown = useMemo(() => {
    if (!orderData?.orderBreakdowns) return null;
    return (
      orderData.colorSizeBreakdown ||
      orderData.orderBreakdowns[0]?.colorSizeBreakdown
    );
  }, [orderData]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleGoBack = () => {
    window.close(); // Close tab if opened in new tab
    // Fallback: navigate back
    navigate("/fincheck-reports");
  };

  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-white">
            Loading Report...
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Report ID: {reportId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
            Error Loading Report
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No Report Data</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl print:hidden">
        <div className="max-w-8xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">
                  Inspection Report
                </h1>
                <p className="text-xs text-indigo-100">
                  ID: <span className="font-mono">{report.reportId}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-20 print:pt-4 space-y-4">
        {/* 1. Inspector & Report ID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Inspector Card */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full relative overflow-hidden flex flex-col">
              <div className="h-20 bg-gradient-to-br from-indigo-600 to-purple-700 relative">
                <div className="absolute inset-0 bg-white/10 opacity-30"></div>
              </div>

              <div className="flex justify-center -mt-10 relative px-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  {inspectorInfo?.face_photo ? (
                    <img
                      src={getInspectorPhotoUrl(inspectorInfo.face_photo)}
                      alt="Inspector"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.querySelector(
                          ".fallback-icon"
                        ).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`fallback-icon w-full h-full items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700 ${
                      inspectorInfo?.face_photo ? "hidden" : "flex"
                    }`}
                  >
                    <User className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="p-4 pt-2 text-center flex-1 flex flex-col">
                <h3 className="text-base font-bold text-gray-800 dark:text-white leading-tight">
                  {inspectorInfo?.eng_name || report.empName || "Unknown"}
                </h3>
                <div className="mt-2 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800">
                    <span className="text-[10px] font-bold uppercase">ID</span>
                    <span className="text-xs font-mono font-bold">
                      {report.empId || "--"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 w-full pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-left">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-medium">
                      Title
                    </p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                      {inspectorInfo?.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-medium">
                      Dept
                    </p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                      {inspectorInfo?.dept_name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Info Card */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 h-full">
              <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* LEFT SIDE: Product Image & Type */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    {/* Product Image Logic */}
                    {(() => {
                      // Try to find image in populated productTypeId or inspectionDetails
                      const imgUrl =
                        report.inspectionDetails?.productTypeId?.imageURL ||
                        report.productTypeId?.imageURL || // If populated at root
                        config?.productTypeId?.imageURL;

                      const fullUrl = getProductImageUrl(imgUrl);

                      if (fullUrl) {
                        return (
                          <img
                            src={fullUrl}
                            alt="Product"
                            className="w-full h-32 object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
                          />
                        );
                      } else {
                        return (
                          <div className="text-gray-300 dark:text-gray-600">
                            <Shirt className="w-16 h-16" />
                          </div>
                        );
                      }
                    })()}

                    <div className="mt-3 text-center w-full">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                        Product Type
                      </p>
                      <span className="inline-block px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-sm font-black text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-600">
                        {report.productType || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Report Details */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Header Section - Flex Container for Name & Order Card */}
                  <div className="mb-5 border-b border-gray-100 dark:border-gray-700 pb-3 flex justify-between items-start gap-4">
                    {/* Left: Report Name & Created Date */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          Inspection Report
                        </span>
                      </div>
                      <h1 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                        {report.reportType || "General Inspection"}
                      </h1>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created: {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Right: Order & Style Card (Small Width) */}
                    <div className="hidden sm:block">
                      <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-2.5 min-w-[140px] max-w-[200px]">
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">
                            Order No
                          </p>
                          <p
                            className="text-sm font-black text-gray-800 dark:text-white leading-tight truncate"
                            title={selectedOrders.join(", ")}
                          >
                            {selectedOrders.length > 0
                              ? selectedOrders[0]
                              : "-"}
                            {selectedOrders.length > 1 && (
                              <span className="text-xs text-gray-400 font-medium">
                                {" "}
                                +{selectedOrders.length - 1}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-600 text-right">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Style:{" "}
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {dtOrder.custStyle || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* The 4 Info Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Card 1: Report ID */}
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                      <p className="text-[10px] text-indigo-500 uppercase font-bold mb-1">
                        Report ID
                      </p>
                      <p className="text-sm font-mono font-black text-indigo-700 dark:text-indigo-300 truncate">
                        {report.reportId}
                      </p>
                    </div>

                    {/* Card 2: Date */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Date
                      </p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {new Date(report.inspectionDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Card 3: Type (First/Re) */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Type
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            report.inspectionType === "first"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        ></span>
                        <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">
                          {report.inspectionType || "First"}
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Buyer */}
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                      <p className="text-[10px] text-purple-500 uppercase font-bold mb-1">
                        Buyer
                      </p>
                      <p className="text-sm font-black text-purple-700 dark:text-purple-300 truncate">
                        {determinedBuyer}
                      </p>
                    </div>

                    {/* Card 5: Factory */}
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[10px] text-emerald-500 uppercase font-bold mb-1">
                        Factory
                      </p>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 truncate">
                        {inspectionFactory}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Report Result Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Report Result
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ResultCard title="Final" result={finalReportResult} icon={Award} />
            <ResultCard
              title="Measurement"
              result={measurementResult.result}
              icon={Ruler}
            />
            <ResultCard title="Defect" result={defectResult} icon={Bug} />
          </div>
        </div>

        {/* 3. AQL Defect Result (Only if AQL) */}
        {isAQLMethod && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("aql")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Defect Result (AQL)
              </h2>
              {expandedSections.aql ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.aql && (
              <div className="p-3 space-y-3">
                {loadingAql ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : aqlResult ? (
                  <>
                    <AQLConfigCards
                      aqlSampleData={aqlSampleData}
                      aqlResult={aqlResult}
                      inspectedQty={inspectedQty}
                    />
                    <AQLResultTable
                      defectsList={summaryData.defectsList}
                      totals={summaryData.totals}
                      aqlResult={aqlResult}
                    />
                    <FinalDefectResultBanner result={aqlResult.final} compact />
                  </>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-amber-700">
                      AQL Configuration Not Available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Defect Summary */}
        {summaryData.groups.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("defectSummary")}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <h2 className="text-white font-bold text-sm">Defect Summary</h2>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-white text-[10px] font-bold">
                  {summaryData.totals.total} total
                </span>
              </div>
              {expandedSections.defectSummary ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.defectSummary && (
              <div className="p-0">
                {/* existing Summary Table */}
                <DefectSummaryTable
                  groups={summaryData.groups}
                  totals={summaryData.totals}
                />

                {/* NEW: Defect Images Grid */}
                {defectImages.length > 0 && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" />
                      Defect Visual Evidence
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {defectImages.map((img, idx) => (
                        <div
                          key={img.imageId || idx}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm group"
                        >
                          {/* Image Container */}
                          <div
                            className="relative h-40 cursor-pointer overflow-hidden bg-gray-100"
                            onClick={() =>
                              setPreviewImage({
                                src: img.imageURL.startsWith("http")
                                  ? img.imageURL
                                  : `${API_BASE_URL}${img.imageURL}`,
                                alt: img.defectName
                              })
                            }
                          >
                            <img
                              src={
                                img.imageURL.startsWith("http")
                                  ? img.imageURL
                                  : `${API_BASE_URL}${img.imageURL}`
                              }
                              alt={img.defectName}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" />
                            </div>

                            {/* Position Badge (Inside/Outside) */}
                            {img.positionType && img.positionType !== "N/A" && (
                              <div
                                className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-sm ${
                                  img.positionType === "Outside"
                                    ? "bg-orange-500 text-white"
                                    : "bg-blue-500 text-white"
                                }`}
                              >
                                {img.positionType}
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="p-2">
                            <p
                              className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate"
                              title={img.defectName}
                            >
                              {img.defectName}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {img.locationText}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. Measurement Summary */}

        {savedMeasurements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header - Solid Blue to match screenshot */}
            <div
              className="bg-[#0088CC] px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("measurement")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Ruler className="w-4 h-4" /> Measurement Summary
              </h2>
              {expandedSections.measurement ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.measurement && (
              <div className="p-4 space-y-6">
                {/* 1. Ensure Specs are loaded before rendering tables */}
                {measurementSpecs.full.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200">
                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      Retrieving Specification Data...
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Mapping measurement points to names & tolerances
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 2. Overall Result Table */}
                    <OverallMeasurementSummaryTable
                      groupedMeasurements={groupedMeasurements}
                    />

                    {/* 3. Detailed Groups (One per configuration) */}
                    {groupedMeasurements.groups.map((group) => {
                      // Construct Label (e.g. "BLACK")
                      const configLabel =
                        [
                          group.lineName ? `Line ${group.lineName}` : null,
                          group.tableName ? `Table ${group.tableName}` : null,
                          group.colorName ? group.colorName.toUpperCase() : null
                        ]
                          .filter(Boolean)
                          .join(" / ") || "General Configuration";

                      // Calculate Stats
                      const stats = calculateGroupStats(
                        group.measurements,
                        measurementSpecs.full,
                        measurementSpecs.selected
                      );

                      return (
                        <div
                          key={group.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                        >
                          {/* Group Header (e.g. BLACK) */}
                          <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">
                              {configLabel}
                            </span>
                          </div>

                          <div className="p-4 space-y-5 bg-white dark:bg-gray-800">
                            {/* Stats Cards - FULL VIEW (No 'compact' prop) */}
                            <MeasurementStatsCards stats={stats} />

                            {/* Legend - FULL VIEW */}
                            <div className="py-1">
                              <MeasurementLegend />
                            </div>

                            {/* Main Data Table - FULL VIEW */}
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                              <MeasurementSummaryTable
                                measurements={group.measurements}
                                specsData={measurementSpecs.full}
                                selectedSpecsList={measurementSpecs.selected}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Order Information */}
        {orderData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("order")}
            >
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Order Information
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {dtOrder.customer} • Style: {dtOrder.custStyle}
                </p>
              </div>
              {expandedSections.order ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.order && (
              <div className="p-4 space-y-8">
                {/* 1. General Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <InfoRow
                    label="Order No(s)"
                    value={selectedOrders.join(", ")}
                    icon={Package}
                    className="md:col-span-2"
                  />
                  <InfoRow
                    label="Total Qty"
                    value={dtOrder.totalQty?.toLocaleString()}
                    icon={Hash}
                  />
                  <InfoRow
                    label="Factory"
                    value={dtOrder.factory}
                    icon={Building2}
                  />
                  <InfoRow label="Origin" value={dtOrder.origin} icon={Globe} />
                  <InfoRow label="Mode" value={dtOrder.mode} icon={Truck} />
                  <InfoRow
                    label="Sales Team"
                    value={dtOrder.salesTeamName}
                    icon={Users}
                  />
                  <InfoRow
                    label="Country"
                    value={dtOrder.country}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Season"
                    value={yorksys.season}
                    icon={Calendar}
                  />
                  <InfoRow
                    label="Destination"
                    value={yorksys.destination}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Product Type"
                    value={yorksys.productType}
                    icon={Layers}
                  />
                  <InfoRow
                    label="Fabric Content"
                    value={yorksys.fabricContent
                      ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
                      .join(", ")}
                    icon={Shirt}
                    className="md:col-span-2"
                  />
                  <InfoRow
                    label="SKU Description"
                    value={yorksys.skuDescription}
                    icon={Tag}
                    className="md:col-span-4"
                  />

                  {/* NEW: All Distinct SKUs Card */}
                  {allUniqueSKUs.length > 0 && (
                    <div className="md:col-span-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          All Included SKUs ({allUniqueSKUs.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allUniqueSKUs.map((sku, i) => (
                          <span
                            key={i}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-mono font-medium shadow-sm"
                          >
                            {sku}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Color/Size Breakdowns (Full Width) */}
                {orderData.orderBreakdowns &&
                  orderData.orderBreakdowns.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <Package className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                          Order Qty Breakdown
                        </h3>
                      </div>

                      <div className="space-y-6">
                        {orderData.orderBreakdowns.map((breakdown) => (
                          <div key={`cs-${breakdown.orderNo}`}>
                            <ColorSizeBreakdownTable
                              data={breakdown.colorSizeBreakdown}
                              orderNo={
                                orderData.orderBreakdowns.length > 1
                                  ? breakdown.orderNo
                                  : null
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 3. SKU Details Tables (Full Width, Below Breakdown) */}
                {orderData.orderBreakdowns &&
                  orderData.orderBreakdowns.some(
                    (b) => b.yorksysOrder?.skuData?.length > 0
                  ) && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <Hash className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                          SKU Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orderData.orderBreakdowns.map((breakdown) => {
                          const skuData = breakdown.yorksysOrder?.skuData;
                          if (!skuData || skuData.length === 0) return null;

                          return (
                            <div key={`sku-${breakdown.orderNo}`}>
                              <SKUDataTable
                                skuData={skuData}
                                orderNo={
                                  orderData.orderBreakdowns.length > 1
                                    ? breakdown.orderNo
                                    : null
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* 7. Report Configuration */}
        {selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Inspection Setup" icon={Settings} />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                  <span className="text-gray-500">Report Type</span>
                  <span className="font-bold text-indigo-600">
                    {report.reportType || selectedTemplate.ReportType}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                  <span className="text-gray-500">Sampling</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      isAQLMethod
                        ? "bg-orange-100 text-orange-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {report.inspectionMethod ||
                      selectedTemplate.InspectedQtyMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                  <span className="text-gray-500">Inspected Qty</span>
                  <span className="font-bold text-blue-600">
                    {config?.inspectedQty || 0}
                  </span>
                </div>
                {isAQLMethod && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">AQL Sample</span>
                    <span className="font-bold text-orange-600">
                      {config?.aqlSampleSize}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <SectionHeader title="Inspection Scope" icon={Layers} />
              </div>
              <div className="flex-1 overflow-x-auto">
                {lineTableConfig.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                      <tr>
                        {scopeColumns.map((col) => (
                          <th key={col} className="px-3 py-2">
                            {col}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {lineTableConfig.map(
                        (group) =>
                          group.assignments?.map((assign, idx) => (
                            <tr
                              key={`${group.id}-${assign.id || idx}`}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                            >
                              {scopeColumns.includes("Line") && (
                                <td className="px-3 py-1.5 font-bold">
                                  {idx === 0
                                    ? group.lineName || group.line
                                    : ""}
                                </td>
                              )}
                              {scopeColumns.includes("Table") && (
                                <td className="px-3 py-1.5">
                                  {idx === 0
                                    ? group.tableName || group.table
                                    : ""}
                                </td>
                              )}
                              {scopeColumns.includes("Color") && (
                                <td className="px-3 py-1.5 text-indigo-600">
                                  {idx === 0
                                    ? group.colorName || group.color
                                    : ""}
                                </td>
                              )}
                              <td className="px-3 py-1.5 text-right font-mono">
                                {assign.qty || 0}
                              </td>
                            </tr>
                          )) || (
                            <tr key={group.id}>
                              {scopeColumns.includes("Line") && (
                                <td className="px-3 py-1.5">
                                  {group.lineName || group.line}
                                </td>
                              )}
                              {scopeColumns.includes("Table") && (
                                <td className="px-3 py-1.5">
                                  {group.tableName || group.table}
                                </td>
                              )}
                              {scopeColumns.includes("Color") && (
                                <td className="px-3 py-1.5">
                                  {group.colorName || group.color}
                                </td>
                              )}
                              <td className="px-3 py-1.5 text-right">-</td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No scope configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. Header Inspection */}
        {definitions.headers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("header")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> CheckList
              </h2>
              {expandedSections.header ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.header && (
              <div className="p-4 space-y-8">
                {/* PART 1: Checklist Status Grid (1 Row, 3 Columns) */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Checklist Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {definitions.headers.map((section) => {
                      const selectedVal =
                        headerData?.selectedOptions?.[section._id];
                      return (
                        <div
                          key={section._id}
                          className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-2"
                        >
                          <span
                            className="font-bold text-gray-700 dark:text-gray-300 text-xs truncate"
                            title={section.MainTitle}
                          >
                            {section.MainTitle}
                          </span>
                          {selectedVal ? (
                            <StatusBadge value={selectedVal} />
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PART 2: Findings & Evidence (Photos/Remarks) */}
                {(() => {
                  // Filter sections that actually have content (Images OR Remarks)
                  const evidenceSections = definitions.headers.filter(
                    (section) => {
                      const hasRemark = headerData?.remarks?.[section._id];
                      const hasImages = Object.keys(
                        headerData?.capturedImages || {}
                      ).some((k) => k.startsWith(`${section._id}_`));
                      return hasRemark || hasImages;
                    }
                  );

                  if (evidenceSections.length === 0) return null;

                  return (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5" />
                        Detailed Findings
                      </h3>

                      <div className="space-y-6">
                        {evidenceSections.map((section) => {
                          const remark = headerData?.remarks?.[section._id];
                          const images = Object.keys(
                            headerData?.capturedImages || {}
                          )
                            .filter((k) => k.startsWith(`${section._id}_`))
                            .map((k) => ({
                              ...headerData.capturedImages[k],
                              key: k
                            }));

                          return (
                            <div
                              key={`${section._id}-evidence`}
                              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                            >
                              {/* Header Name for Evidence Block */}
                              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                  {section.MainTitle}
                                </span>
                              </div>

                              <div className="p-4">
                                {/* Large Photos Grid */}
                                {images.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {images.map((img, idx) => (
                                      <div
                                        key={img.key}
                                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                                        onClick={() =>
                                          setPreviewImage({
                                            src: img.url,
                                            alt: `${
                                              section.MainTitle
                                            } - Image ${idx + 1}`
                                          })
                                        }
                                      >
                                        <img
                                          src={img.url}
                                          alt="Evidence"
                                          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transform scale-75 group-hover:scale-100 transition-all" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Remark Box */}
                                {remark && (
                                  <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                    <div className="flex gap-2">
                                      <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-0.5">
                                          Inspector Remark
                                        </p>
                                        <p className="text-xs text-amber-900 dark:text-amber-100">
                                          {remark}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 9. Photo Documentation */}
        {report.photoData && report.photoData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("photos")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" /> Photos
              </h2>
              {expandedSections.photos ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.photos && (
              <div className="p-4 space-y-6">
                {/* Loop through Saved Sections from Schema */}
                {report.photoData.map((section, sectionIdx) => (
                  <div
                    key={section.sectionId || sectionIdx}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
                  >
                    {/* Section Name */}
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                      <Layers className="w-4 h-4 text-orange-500" />
                      {section.sectionName}
                    </h3>

                    {/* Grid Structure: 1 Row, 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {section.items &&
                        section.items.map((item, itemIdx) => {
                          // Skip items with no images unless there is a remark
                          if (
                            (!item.images || item.images.length === 0) &&
                            !item.remarks
                          ) {
                            return null;
                          }

                          return (
                            <div
                              key={`${section.sectionId}-${item.itemNo}-${itemIdx}`}
                              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                              {/* Item Header */}
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                  <span className="inline-block bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-2 text-[10px]">
                                    #{item.itemNo}
                                  </span>
                                  {item.itemName}
                                </span>
                              </div>

                              {/* Images Area - Real Resolution / Aspect Ratio */}
                              <div className="p-3 flex-1">
                                {item.images && item.images.length > 0 ? (
                                  <div className="space-y-2">
                                    {item.images.map((img, imgIdx) => {
                                      const imgUrl = img.imageURL.startsWith(
                                        "http"
                                      )
                                        ? img.imageURL
                                        : `${API_BASE_URL}${img.imageURL}`;

                                      return (
                                        <div
                                          key={img.imageId || imgIdx}
                                          className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                                          onClick={() =>
                                            setPreviewImage({
                                              src: imgUrl,
                                              alt: `${item.itemName} - Image ${
                                                imgIdx + 1
                                              }`
                                            })
                                          }
                                        >
                                          {/* Use w-full to fit container, h-auto for real aspect ratio */}
                                          <img
                                            src={imgUrl}
                                            alt={item.itemName}
                                            className="w-full h-auto object-cover max-h-[300px]"
                                            loading="lazy"
                                          />
                                          {/* Hover Overlay */}
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transform scale-75 group-hover:scale-100 transition-all" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300">
                                    <span className="text-xs text-gray-400 italic">
                                      No photos captured
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Remarks Footer */}
                              {item.remarks && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 px-3 py-2 border-t border-amber-100 dark:border-amber-900/30">
                                  <p className="text-[10px] text-amber-800 dark:text-amber-200 italic">
                                    <MessageSquare className="w-3 h-3 inline mr-1 opacity-70" />
                                    {item.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default YPivotQAReportFullView;
