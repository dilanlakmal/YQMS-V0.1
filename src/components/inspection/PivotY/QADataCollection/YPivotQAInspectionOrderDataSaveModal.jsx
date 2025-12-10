import React, { useState, useMemo } from "react";
import {
  X,
  Save,
  Loader2,
  Calendar,
  User,
  Package,
  Hash,
  Building2,
  Shirt,
  Factory,
  FileText,
  MessageSquare,
  Boxes,
  Truck,
  Ruler,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Image
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// ============================================================
// Info Row Component
// ============================================================
const InfoRow = ({ icon: Icon, label, value, color = "gray" }) => {
  const colorClasses = {
    gray: "text-gray-600 dark:text-gray-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
    blue: "text-blue-600 dark:text-blue-400",
    pink: "text-pink-600 dark:text-pink-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    amber: "text-amber-600 dark:text-amber-400"
  };

  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div
        className={`p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 ${colorClasses[color]}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 break-words">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// AQL Config Table
// ============================================================
const AQLConfigDisplay = ({ aqlConfig, inspectedQty }) => {
  if (!aqlConfig || !aqlConfig.items || aqlConfig.items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* AQL Info */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-[9px] text-gray-500 uppercase">Type</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {aqlConfig.inspectionType || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-[9px] text-gray-500 uppercase">Level</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {aqlConfig.level || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
          <p className="text-[9px] text-purple-600 uppercase">Batch</p>
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
            {aqlConfig.batch || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
          <p className="text-[9px] text-emerald-600 uppercase">Sample Letter</p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {aqlConfig.sampleLetter || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-center">
          <p className="text-[9px] text-cyan-600 uppercase">Sample Size</p>
          <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
            {aqlConfig.sampleSize || "N/A"}
          </p>
        </div>
      </div>

      {/* AQL Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                AQL Level
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                Ac
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                Re
              </th>
            </tr>
          </thead>
          <tbody>
            {aqlConfig.items.map((item, index) => {
              const bgClass =
                item.status === "Minor"
                  ? "bg-blue-50/50 dark:bg-blue-900/10"
                  : item.status === "Major"
                  ? "bg-orange-50/50 dark:bg-orange-900/10"
                  : "bg-red-50/50 dark:bg-red-900/10";

              const textClass =
                item.status === "Minor"
                  ? "text-blue-700 dark:text-blue-400"
                  : item.status === "Major"
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-red-700 dark:text-red-400";

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-200 dark:border-gray-700 ${bgClass}`}
                >
                  <td className={`px-3 py-2 font-semibold ${textClass}`}>
                    {item.status}
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                    {item.aqlLevel ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                    {item.ac ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-red-600 dark:text-red-400">
                    {item.re ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// Main Modal Component
// ============================================================
const YPivotQAInspectionOrderDataSaveModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  orderState,
  reportState,
  qualityPlanData
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Extract data for display
  const inspectionDate = orderState?.inspectionDate;
  const inspectionType = orderState?.inspectionType || "first";
  const orderNos = orderState?.selectedOrders || [];
  const orderData = orderState?.orderData;
  const orderType = orderState?.orderType || "single";

  const selectedTemplate = reportState?.selectedTemplate;
  const config = reportState?.config || {};

  // Buyer determination
  const determineBuyer = (orderNo) => {
    if (!orderNo) return { buyer: "Unknown", code: "--" };
    const upper = orderNo.toUpperCase();
    if (upper.includes("COM")) return { buyer: "MWW", code: "COM" };
    if (/CO[A-LN-Z]/.test(upper)) return { buyer: "Costco", code: "CO" };
    if (upper.includes("AR")) return { buyer: "Aritzia", code: "AR" };
    if (upper.includes("RT")) return { buyer: "Reitmans", code: "RT" };
    if (upper.includes("AF")) return { buyer: "ANF", code: "AF" };
    if (upper.includes("NT")) return { buyer: "STORI", code: "NT" };
    return { buyer: "Unknown", code: "--" };
  };

  const buyerInfo =
    orderNos.length > 0
      ? determineBuyer(orderNos[0])
      : { buyer: "Unknown", code: "--" };

  // AQL Config computation
  const aqlConfig = useMemo(() => {
    if (selectedTemplate?.InspectedQtyMethod !== "AQL") return null;

    // This would need the actual AQL configs passed in
    // For now, we'll structure it based on what's typically available
    return config.aqlConfig || null;
  }, [selectedTemplate, config]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        inspectionDate,
        inspectionType,
        orderNos,
        orderType,
        empId: user?.emp_id,
        empName: user?.name || user?.job_title,
        inspectionDetails: {
          buyer: buyerInfo.buyer,
          buyerCode: buyerInfo.code,
          productType:
            config.productType || orderData?.yorksysOrder?.productType,
          productTypeId: config.productTypeId,
          supplier: "YM",
          isSubCon: config.isSubCon || false,
          subConFactory: config.selectedSubConFactoryName || "",
          subConFactoryId: config.selectedSubConFactory,
          reportTypeName: selectedTemplate?.ReportType,
          reportTypeId: selectedTemplate?._id,
          measurement: selectedTemplate?.Measurement || "N/A",
          method: selectedTemplate?.InspectedQtyMethod || "N/A",
          inspectedQty:
            config.inspectedQty || selectedTemplate?.InspectedQty || 0,
          aqlSampleSize: config.aqlSampleSize || 0,
          cartonQty: config.cartonQty || 0,
          shippingStage: config.shippingStage || "",
          remarks: config.remarks || "",
          totalOrderQty: orderData?.dtOrder?.totalQty || 0,
          custStyle: orderData?.dtOrder?.custStyle || "",
          customer: orderData?.dtOrder?.customer || "",
          factory: orderData?.dtOrder?.factory || "",
          aqlConfig: aqlConfig,
          productionStatus: qualityPlanData?.productionStatus || null,
          packingList: qualityPlanData?.packingList || null,
          qualityPlanEnabled: selectedTemplate?.QualityPlan === "Yes"
        }
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/create-report`,
        payload
      );

      if (response.data.success) {
        onConfirm(response.data.data);
      } else {
        setError(response.data.message || "Failed to save report");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err.response?.data?.message || "Failed to save inspection report"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Save className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Save Inspection Report
                  </h2>
                  <p className="text-sm text-indigo-200">
                    Review and confirm details
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {/* User Info Section */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-4">
                {/* User Photo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  {user?.face_photo ? (
                    <img
                      src={`${PUBLIC_ASSET_URL}${user.face_photo}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full items-center justify-center ${
                      user?.face_photo ? "hidden" : "flex"
                    }`}
                  >
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase">
                    Inspector
                  </p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                    {user?.name || user?.job_title || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ID: {user?.emp_id || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Inspection Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-1">
                <InfoRow
                  icon={Calendar}
                  label="Inspection Date"
                  value={
                    inspectionDate
                      ? new Date(inspectionDate).toLocaleDateString()
                      : "N/A"
                  }
                  color="indigo"
                />
                <InfoRow
                  icon={ClipboardList}
                  label="Inspection Type"
                  value={
                    inspectionType === "first"
                      ? "First Inspection"
                      : "Re-Inspection"
                  }
                  color="emerald"
                />
                <InfoRow
                  icon={Package}
                  label="Order No(s)"
                  value={orderNos.join(", ")}
                  color="purple"
                />
                <InfoRow
                  icon={Hash}
                  label="Total Order Qty"
                  value={orderData?.dtOrder?.totalQty?.toLocaleString() || "0"}
                  color="blue"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-1">
                <InfoRow
                  icon={Building2}
                  label="Buyer"
                  value={buyerInfo.buyer}
                  color="orange"
                />
                <InfoRow
                  icon={Shirt}
                  label="Product Type"
                  value={
                    config.productType ||
                    orderData?.yorksysOrder?.productType ||
                    "N/A"
                  }
                  color="pink"
                />
                <InfoRow
                  icon={Factory}
                  label="Supplier"
                  value="YM"
                  color="cyan"
                />
                <InfoRow
                  icon={Factory}
                  label="Sub-Con"
                  value={
                    config.isSubCon
                      ? `Yes - ${config.selectedSubConFactoryName || "N/A"}`
                      : "No"
                  }
                  color="amber"
                />
              </div>
            </div>

            {/* Report Type Info */}
            {selectedTemplate && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200">
                    Report Configuration
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500 uppercase">
                      Report Type
                    </p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                      {selectedTemplate.ReportType}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500 uppercase">
                      Measurement
                    </p>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {selectedTemplate.Measurement || "N/A"}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500 uppercase">Method</p>
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      {selectedTemplate.InspectedQtyMethod || "N/A"}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500 uppercase">
                      Inspected Qty
                    </p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {config.inspectedQty ||
                        selectedTemplate.InspectedQty ||
                        0}
                    </p>
                  </div>
                </div>

                {/* Additional config fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {selectedTemplate.isCarton === "Yes" && (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-[9px] text-gray-500 uppercase">
                        Carton Qty
                      </p>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {config.cartonQty || 0}
                      </p>
                    </div>
                  )}
                  {selectedTemplate.ShippingStage === "Yes" && (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-[9px] text-gray-500 uppercase">
                        Shipping Stage
                      </p>
                      <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        {config.shippingStage || "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                {config.remarks && (
                  <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">
                      Remarks
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {config.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AQL Config - Only show if method is AQL */}
            {selectedTemplate?.InspectedQtyMethod === "AQL" && aqlConfig && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                    AQL Configuration
                  </h3>
                </div>
                <AQLConfigDisplay
                  aqlConfig={aqlConfig}
                  inspectedQty={config.inspectedQty}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700 dark:text-red-400">
                    Error
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, Save Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionOrderDataSaveModal;
