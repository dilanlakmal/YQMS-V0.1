import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
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
  Image as ImageIcon,
  Loader
} from "lucide-react";
import { PUBLIC_ASSET_URL, API_BASE_URL } from "../../../../../config";

// --- Helper: Modal for Image Preview ---
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

// --- Helper: Info Row ---
const InfoRow = ({ label, value, icon: Icon, subValue, className = "" }) => (
  <div
    className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 ${className}`}
  >
    <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
      {Icon ? <Icon className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
        {label}
      </p>
      <p
        className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 truncate"
        title={value}
      >
        {value || "-"}
      </p>
      {subValue && (
        <p
          className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate"
          title={subValue}
        >
          {subValue}
        </p>
      )}
    </div>
  </div>
);

// --- Helper: Section Header ---
const SectionHeader = ({ title, icon: Icon, color = "text-gray-800" }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
    <div className={`p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700`}>
      {Icon && <Icon className={`w-5 h-5 ${color}`} />}
    </div>
    <h3 className={`font-bold text-gray-800 dark:text-white text-lg`}>
      {title}
    </h3>
  </div>
);

// --- Helper: Status Badge for Header Options ---
const StatusBadge = ({ value }) => {
  let style = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  if (["Conform", "Yes", "New Order"].includes(value)) {
    style =
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
  } else if (["Non-Conform", "No"].includes(value)) {
    style =
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
  } else if (value === "N/A") {
    style =
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
  }

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}
    >
      {value}
    </span>
  );
};

const YPivotQAInspectionSummary = ({ orderData, reportData }) => {
  const { selectedOrders, orderData: details } = orderData;
  const { selectedTemplate, config, lineTableConfig, headerData, photoData } =
    reportData;

  const [definitions, setDefinitions] = useState({ headers: [], photos: [] });
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    order: true,
    config: true,
    header: true,
    photos: true
  });

  // Fetch Definitions to map IDs to Names
  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const [headersRes, photosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-home`),
          axios.get(`${API_BASE_URL}/api/qa-sections-photos`)
        ]);
        setDefinitions({
          headers: headersRes.data.data,
          photos: photosRes.data.data
        });
      } catch (error) {
        console.error("Failed to load section definitions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefinitions();
  }, []);

  // --- Data Processing ---
  const dtOrder = details?.dtOrder || {};
  const yorksys = details?.yorksysOrder || {};
  const skuData = yorksys.skuData || [];

  const colorSizeBreakdown = useMemo(() => {
    if (!details?.orderBreakdowns) return null;
    return (
      details.colorSizeBreakdown ||
      details.orderBreakdowns[0]?.colorSizeBreakdown
    );
  }, [details]);

  const scopeColumns = useMemo(() => {
    if (!selectedTemplate) return [];
    const cols = [];
    if (selectedTemplate.Line === "Yes") cols.push("Line");
    if (selectedTemplate.Table === "Yes") cols.push("Table");
    if (selectedTemplate.Colors === "Yes") cols.push("Color");
    return cols;
  }, [selectedTemplate]);

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Filtering Photo Sections based on Report Type ---
  const relevantPhotoSections = useMemo(() => {
    if (
      !selectedTemplate?.SelectedPhotoSectionList ||
      definitions.photos.length === 0
    )
      return [];
    const allowedIds = selectedTemplate.SelectedPhotoSectionList.map(
      (i) => i.PhotoSectionID
    );
    return definitions.photos.filter((p) => allowedIds.includes(p._id));
  }, [selectedTemplate, definitions.photos]);

  if (!selectedOrders.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 h-96">
        <Package className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No Order Selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
      {/* ==================================================================================== */}
      {/* 1. ORDER SUMMARY HEADER */}
      {/* ==================================================================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("order")}
        >
          <div>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <FileText className="w-6 h-6" /> {dtOrder.customer || "Customer"}
            </h2>
            <p className="text-blue-100 text-sm mt-1 font-medium">
              Style: {dtOrder.custStyle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-blue-200 font-bold uppercase block">
                Selected Orders
              </span>
              <span className="text-white font-mono font-bold text-lg bg-white/20 px-2 py-1 rounded">
                {selectedOrders.length}
              </span>
            </div>
            {expandedSections.order ? (
              <ChevronUp className="text-white" />
            ) : (
              <ChevronDown className="text-white" />
            )}
          </div>
        </div>

        {expandedSections.order && (
          <div className="p-6">
            {/* Primary Order Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              <InfoRow
                label="Order No(s)"
                value={selectedOrders.join(", ")}
                icon={Package}
                className="col-span-2"
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
              <InfoRow label="Country" value={dtOrder.country} icon={MapPin} />
              <InfoRow label="Season" value={yorksys.season} icon={Calendar} />
              <InfoRow
                label="Destination"
                value={yorksys.destination}
                icon={MapPin}
              />
            </div>

            {/* Detailed Info (Yorksys) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
              <div className="md:col-span-3 lg:col-span-1">
                <InfoRow
                  label="Product Type"
                  value={yorksys.productType}
                  icon={Layers}
                  className="h-full"
                />
              </div>
              <div className="md:col-span-3 lg:col-span-2 grid grid-cols-2 gap-4">
                <InfoRow
                  label="SKU Desc."
                  value={yorksys.skuDescription}
                  icon={Tag}
                  className="col-span-2"
                />
                <InfoRow
                  label="Fabric Content"
                  value={yorksys.fabricContent
                    ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
                    .join(", ")}
                  icon={Shirt}
                  className="col-span-2"
                />
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Color Size Breakdown */}
              {colorSizeBreakdown && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-purple-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2">
                    <Package className="w-3 h-3" /> Order Qty Breakdown
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                          <th className="px-2 py-1">Color</th>
                          <th className="px-2 py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {colorSizeBreakdown.colors.map((row, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">{row.color}</td>
                            <td className="px-2 py-1 text-right font-bold">
                              {row.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* SKU Data (Limited view) */}
              {skuData.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-emerald-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2">
                    <Hash className="w-3 h-3" /> SKU Data
                  </div>
                  <div className="overflow-x-auto max-h-[150px]">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                        <tr>
                          <th className="px-2 py-1">SKU</th>
                          <th className="px-2 py-1">PO Line</th>
                          <th className="px-2 py-1 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {skuData.map((row, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1 font-mono">{row.sku}</td>
                            <td className="px-2 py-1">{row.POLine}</td>
                            <td className="px-2 py-1 text-right font-bold text-emerald-600">
                              {row.Qty.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================================== */}
      {/* 2. REPORT CONFIGURATION (Existing + Refined) */}
      {/* ==================================================================================== */}
      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Details */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
            <SectionHeader title="Inspection Setup" icon={Settings} />
            <div className="space-y-4">
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Report Type</span>
                <span className="text-sm font-bold text-indigo-600">
                  {selectedTemplate.ReportType}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Sampling Method</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    selectedTemplate.InspectedQtyMethod === "AQL"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {selectedTemplate.InspectedQtyMethod}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">
                  Inspected Qty (Lot)
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {config?.inspectedQty || 0}
                </span>
              </div>
              {selectedTemplate.InspectedQtyMethod === "AQL" && (
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500">AQL Sample Size</span>
                  <span className="text-sm font-bold text-orange-600">
                    {config?.aqlSampleSize}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scope Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <SectionHeader
                title="Inspection Scope & Assignments"
                icon={Layers}
                color="text-teal-600"
              />
            </div>
            <div className="flex-1 overflow-x-auto p-0">
              {lineTableConfig.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                    <tr>
                      {scopeColumns.map((col) => (
                        <th key={col} className="px-4 py-2">
                          {col}
                        </th>
                      ))}
                      {selectedTemplate.isQCScan === "Yes" && (
                        <th className="px-4 py-2">Inspector</th>
                      )}
                      <th className="px-4 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {lineTableConfig.map((group) =>
                      group.assignments.map((assign, idx) => (
                        <tr
                          key={`${group.id}-${assign.id}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                        >
                          {scopeColumns.includes("Line") && (
                            <td className="px-4 py-2 font-bold">
                              {idx === 0 ? group.lineName || group.line : ""}
                            </td>
                          )}
                          {scopeColumns.includes("Table") && (
                            <td className="px-4 py-2">
                              {idx === 0 ? group.tableName || group.table : ""}
                            </td>
                          )}
                          {scopeColumns.includes("Color") && (
                            <td className="px-4 py-2 text-indigo-600">
                              {idx === 0 ? group.colorName || group.color : ""}
                            </td>
                          )}
                          {selectedTemplate.isQCScan === "Yes" && (
                            <td className="px-4 py-2">
                              {assign.qcUser ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                    {assign.qcUser.eng_name.charAt(0)}
                                  </div>
                                  <span>{assign.qcUser.eng_name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">
                                  Unassigned
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-2 text-right font-mono">
                            {assign.qty || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No scope configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================== */}
      {/* 3. HEADER INSPECTION DATA (NEW SECTION) */}
      {/* ==================================================================================== */}
      {definitions.headers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("header")}
          >
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" /> Header Inspection Check
            </h2>
            {expandedSections.header ? (
              <ChevronUp className="text-white" />
            ) : (
              <ChevronDown className="text-white" />
            )}
          </div>

          {expandedSections.header && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {definitions.headers.map((section) => {
                const selectedVal = headerData?.selectedOptions?.[section._id];
                const remark = headerData?.remarks?.[section._id];

                // Filter images for this section
                const images = Object.keys(headerData?.capturedImages || {})
                  .filter((k) => k.startsWith(`${section._id}_`))
                  .map((k) => ({ ...headerData.capturedImages[k], key: k }))
                  .sort(
                    (a, b) =>
                      parseInt(a.key.split("_")[1]) -
                      parseInt(b.key.split("_")[1])
                  );

                return (
                  <div
                    key={section._id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm flex-1">
                        {section.MainTitle}
                      </h4>
                      {selectedVal ? (
                        <StatusBadge value={selectedVal} />
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Not Checked
                        </span>
                      )}
                    </div>

                    {/* Remarks */}
                    {remark && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/50 flex gap-2">
                        <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-200 italic">
                          "{remark}"
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    {images.length > 0 && (
                      <div className="flex gap-2 mt-auto pt-2 overflow-x-auto scrollbar-thin">
                        {images.map((img) => (
                          <div
                            key={img.key}
                            className="relative group flex-shrink-0 cursor-pointer"
                            onClick={() =>
                              setPreviewImage({
                                src: img.url,
                                alt: `${section.MainTitle} Photo`
                              })
                            }
                          >
                            <img
                              src={img.url}
                              className="w-10 h-10 object-cover rounded-md border border-gray-300 shadow-sm"
                              alt="Evidence"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors rounded-md" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================================== */}
      {/* 4. PHOTO DOCUMENTATION (NEW SECTION) */}
      {/* ==================================================================================== */}
      {relevantPhotoSections.length > 0 &&
        selectedTemplate?.Photos !== "No" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("photos")}
            >
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Camera className="w-5 h-5" /> Photo Documentation
              </h2>
              {expandedSections.photos ? (
                <ChevronUp className="text-white" />
              ) : (
                <ChevronDown className="text-white" />
              )}
            </div>

            {expandedSections.photos && (
              <div className="p-6 space-y-6">
                {relevantPhotoSections.map((section) => (
                  <div
                    key={section._id}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
                  >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-500" />{" "}
                      {section.sectionName}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {section.itemList.map((item) => {
                        // Get images for this item
                        const images = [];
                        let idx = 0;
                        while (idx < 20) {
                          // arbitrary safety limit
                          const key = `${section._id}_${item.no}_${idx}`;
                          if (photoData?.capturedImages?.[key]) {
                            images.push({
                              ...photoData.capturedImages[key],
                              key
                            });
                          } else if (images.length > 0 && idx > item.maxCount) {
                            break;
                          }
                          idx++;
                        }

                        const remarkKey = `${section._id}_${item.no}`;
                        const remark = photoData?.remarks?.[remarkKey];

                        if (images.length === 0 && !remark) return null; // Hide empty items

                        return (
                          <div
                            key={item.no}
                            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className="text-xs font-bold text-gray-700 dark:text-gray-200 line-clamp-2"
                                title={item.itemName}
                              >
                                <span className="inline-block bg-orange-100 text-orange-700 px-1.5 rounded mr-1.5">
                                  #{item.no}
                                </span>
                                {item.itemName}
                              </span>
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {images.map((img) => (
                                <div
                                  key={img.key}
                                  className="aspect-square rounded-md overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-600 relative group"
                                  onClick={() =>
                                    setPreviewImage({
                                      src: img.url,
                                      alt: item.itemName
                                    })
                                  }
                                >
                                  <img
                                    src={img.url}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    alt="Doc"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Remark */}
                            {remark && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 italic">
                                <MessageSquare className="w-3 h-3 inline mr-1" />
                                {remark}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Empty state for section if no photos taken */}
                    {(!photoData?.capturedImages ||
                      Object.keys(photoData.capturedImages).filter((k) =>
                        k.startsWith(`${section._id}_`)
                      ).length === 0) && (
                      <p className="text-xs text-gray-400 italic pl-6">
                        No photos captured for this section.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Building2 and other icons that were used but not imported in your original snippet need to be checked. 
          I added Building2 to the Lucide import list at the top. */}

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
      `}</style>
    </div>
  );
};

// Simple icon import fix (Building2 was missing in original imports list but used in JSX)
import { Building2, ClipboardCheck } from "lucide-react";

export default YPivotQAInspectionSummary;
