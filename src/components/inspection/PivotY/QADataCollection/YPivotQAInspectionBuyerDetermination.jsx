import React, { useMemo } from "react";
import { Building2, ShoppingBag } from "lucide-react";

// ============================================================
// Buyer Configuration
// ============================================================
const BUYER_CONFIG = {
  MWW: {
    name: "MWW",
    fullName: "MWW",
    gradientClass: "from-blue-500 to-blue-600",
    textClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/30",
    borderClass: "border-blue-200 dark:border-blue-800",
    code: "COM"
  },
  Costco: {
    name: "Costco",
    fullName: "Costco",
    gradientClass: "from-red-500 to-red-600",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-900/30",
    borderClass: "border-red-200 dark:border-red-800",
    code: "CO"
  },
  Aritzia: {
    name: "Aritzia",
    fullName: "Aritzia",
    gradientClass: "from-purple-500 to-purple-600",
    textClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-900/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    code: "AR"
  },
  Reitmans: {
    name: "Reitmans",
    fullName: "Reitmans",
    gradientClass: "from-pink-500 to-pink-600",
    textClass: "text-pink-600 dark:text-pink-400",
    bgClass: "bg-pink-50 dark:bg-pink-900/30",
    borderClass: "border-pink-200 dark:border-pink-800",
    code: "RT"
  },
  ANF: {
    name: "ANF",
    fullName: "Abercrombie & Fitch",
    gradientClass: "from-indigo-500 to-indigo-600",
    textClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-900/30",
    borderClass: "border-indigo-200 dark:border-indigo-800",
    code: "AF"
  },
  STORI: {
    name: "STORI",
    fullName: "STORI",
    gradientClass: "from-emerald-500 to-emerald-600",
    textClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    code: "NT"
  },
  Unknown: {
    name: "Unknown",
    fullName: "Unknown",
    gradientClass: "from-gray-500 to-gray-600",
    textClass: "text-gray-600 dark:text-gray-400",
    bgClass: "bg-gray-50 dark:bg-gray-900/30",
    borderClass: "border-gray-200 dark:border-gray-700",
    code: "--"
  }
};

// ============================================================
// Buyer Determination Logic
// ============================================================
export const determineBuyerFromOrderNo = (orderNo) => {
  if (!orderNo || typeof orderNo !== "string") {
    return { buyer: "Unknown" };
  }

  const upperOrderNo = orderNo.toUpperCase();

  if (upperOrderNo.includes("COM")) return { buyer: "MWW" };
  if (/CO[A-LN-Z]/.test(upperOrderNo)) return { buyer: "Costco" };
  if (upperOrderNo.includes("AR")) return { buyer: "Aritzia" };
  if (upperOrderNo.includes("RT")) return { buyer: "Reitmans" };
  if (upperOrderNo.includes("AF")) return { buyer: "ANF" };
  if (upperOrderNo.includes("NT")) return { buyer: "STORI" };

  return { buyer: "Unknown" };
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionBuyerDetermination = ({
  selectedOrders = [],
  orderData = null,
  orderType = "single"
}) => {
  const buyerInfo = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return null;

    const determination = determineBuyerFromOrderNo(selectedOrders[0]);
    const config = BUYER_CONFIG[determination.buyer] || BUYER_CONFIG.Unknown;

    return {
      ...determination,
      ...config
    };
  }, [selectedOrders]);

  if (!selectedOrders || selectedOrders.length === 0 || !buyerInfo) {
    return null;
  }

  // Format order display
  const orderDisplay = useMemo(() => {
    if (selectedOrders.length === 1) {
      return selectedOrders[0];
    } else if (selectedOrders.length === 2) {
      return selectedOrders.join(", ");
    } else {
      return `${selectedOrders[0]}, +${selectedOrders.length - 1} more`;
    }
  }, [selectedOrders]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Order Numbers */}
      <div className={`bg-gradient-to-r ${buyerInfo.gradientClass} px-4 py-3`}>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span>Customer</span>
          <span className="text-white/50">|</span>
          <span className="font-medium text-white/90 truncate">
            {orderDisplay}
          </span>
        </h3>
      </div>

      {/* Customer Info Card */}
      <div className="p-4">
        <div
          className={`p-4 rounded-xl border-2 ${buyerInfo.borderClass} ${buyerInfo.bgClass}`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left Side - Icon + Customer Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
                <Building2 className={`w-6 h-6 ${buyerInfo.textClass}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Customer Info
                </p>
                <p
                  className={`text-lg font-bold ${buyerInfo.textClass} truncate`}
                >
                  {buyerInfo.fullName} | {buyerInfo.name}
                </p>
              </div>
            </div>

            {/* Right Side - Code Box */}
            {buyerInfo.code && (
              <div
                className={`px-5 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-md border-2 ${buyerInfo.borderClass} flex-shrink-0`}
              >
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center font-medium">
                  Code
                </p>
                <p
                  className={`text-xl font-black ${buyerInfo.textClass} text-center`}
                >
                  {buyerInfo.code}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionBuyerDetermination;
